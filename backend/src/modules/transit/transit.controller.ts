import { Request, Response, NextFunction } from 'express';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { readJsonFile, readJsonArray, writeJsonFile, writeJsonArray } from '../../utils/fileStore';
import { cleanInput, cleanStringList, titleCase } from '../../utils/cleaners';
import { z } from 'zod';

const AI_BASES = {
  groq: 'https://api.groq.com/openai/v1',
  openrouter: 'https://openrouter.ai/api/v1',
  nvidia: 'https://integrate.api.nvidia.com/v1',
};

const DEFAULT_MODELS = {
  groq: 'llama-3.3-70b-versatile',
  openrouter: 'meta-llama/llama-3.3-70b-instruct:free',
  nvidia: 'nvidia/llama-3.3-nemotron-super-49b-v1.5',
};

const PROMPTS = {
  explain_route: `Explain this verified Dhaka public transit result in concise Bangla. Do not invent new buses, stops, fares, or routes. Return strict JSON: {"summary_bn":"","why_this_route_bn":"","fare_note_bn":"","confidence_note_bn":"","risks_bn":[]}.`,
  parse_query: `Parse this Dhaka transit request into strict JSON only. Do not guess route details. Return {"origin":"","destination":"","normalized_query":"","needs_clarification":false,"clarifying_question_bn":"\"}.`,
  route_fallback: `Return strict JSON for Dhaka public transit query. This is an UNVERIFIED AI fallback because verified local data did not find a route. Use only bus, ac_bus, and metro. Schema: {"origin":"","destination":"","routes":[{"id":1,"label":"Unverified AI suggestion","total_cost":0,"total_cost_range":"","total_time_minutes":0,"total_time_range":"","steps":[{"mode":"","icon":"","from":"","to":"","bus_names":[],"landmarks":[],"cost":0,"cost_range":"","time_minutes":0,"time_range":"","tip_bn":""}]}],"needs_verification":true,"verification_note_bn":""}`,
};

const aiRequestSchema = z.object({
  query: z.string().min(1).max(240),
  task: z.enum(['route_fallback', 'explain_route', 'parse_query']).optional().default('route_fallback'),
  context: z.string().max(1800).optional().default(''),
});

async function getHybridContext(query: string): Promise<string> {
  try {
    const { hybridSearch } = await import('../../repositories/vector.repository');
    const results = await hybridSearch(query, 5);
    if (!results.length) return '';
    return results
      .map((r: any) => `Route: ${r.route_name}\nFrom: ${r.from_stop} → To: ${r.to_stop}\nBus: ${r.bus_names?.join(', ') || 'N/A'}\nFare: ${r.fare ?? 'N/A'} BDT`)
      .join('\n\n');
  } catch (err: any) {
    logger.warn(`[transit] Hybrid search failed: ${err.message}`);
    return '';
  }
}

export async function handleAiRoute(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { query, task, context } = aiRequestSchema.parse(req.body);

    let ragContext = context;
    if (env.USE_HYBRID_SEARCH === 'true' && task === 'route_fallback') {
      const hybridCtx = await getHybridContext(query);
      if (hybridCtx) {
        ragContext = `Verified route data from database:\n${hybridCtx}\n\n${context}`.trim();
      }
    }

    const provider = env.PATHIK_AI_PROVIDER;
    const base = AI_BASES[provider];
    const key = provider === 'nvidia' ? env.NVIDIA_API_KEY : provider === 'openrouter' ? env.OPENROUTER_API_KEY : env.GROQ_API_KEY;

    if (!key) {
      res.status(503).json({ success: false, error: { code: 'AI_NOT_CONFIGURED', message: 'AI provider key is not configured' } });
      return;
    }

    const models = (env.PATHIK_AI_MODELS || DEFAULT_MODELS[provider]).split(',').map((m) => m.trim()).filter(Boolean);
    const promptBase = PROMPTS[task] || PROMPTS.route_fallback;
    const prompt = `${promptBase}\n\nQuery: "${query}"\n${ragContext ? `Context: ${ragContext}` : ''}`;

    const headers: Record<string, string> = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
    if (provider === 'openrouter' || provider === 'nvidia') {
      headers['HTTP-Referer'] = env.PATHIK_PUBLIC_URL || 'http://localhost:5000';
      headers['X-Title'] = 'Pathik Transit';
    }

    let lastError: Error | null = null;
    for (const model of models) {
      try {
        const aiRes = await fetch(`${base}/chat/completions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.2, max_tokens: 4096, response_format: { type: 'json_object' } }),
        });
        const text = await aiRes.text();
        if (!aiRes.ok) { lastError = new Error(`${model} HTTP ${aiRes.status}: ${text.slice(0, 500)}`); continue; }
        const data = JSON.parse(text);
        const content = data?.choices?.[0]?.message?.content || '{}';
        const parsed = JSON.parse(content);
        res.status(200).json({ ...parsed, _source: task === 'route_fallback' ? 'ai_unverified' : 'ai_assist', _task: task, _model: model });
        return;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    res.status(502).json({ success: false, error: { code: 'AI_UPSTREAM_ERROR', message: lastError ? lastError.message : 'All AI models failed' } });
  } catch (err) {
    next(err);
  }
}

export function getRoutesData(_req: Request, res: Response): void {
  const data = readJsonFile('routes.json');
  if (!data) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'routes.json not found' } }); return; }
  res.set('Cache-Control', 'no-store').json(data);
}

export function getMetroData(_req: Request, res: Response): void {
  const data = readJsonFile('metro.json');
  if (!data) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'metro.json not found' } }); return; }
  res.set('Cache-Control', 'public, max-age=3600').json(data);
}

export function getFareData(_req: Request, res: Response): void {
  const data = readJsonFile('fair.json');
  if (!data) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'fair.json not found' } }); return; }
  res.set('Cache-Control', 'public, max-age=3600').json(data);
}

const addRouteSchema = z.object({
  from: z.string().min(1).max(120),
  to: z.string().min(1).max(120),
  busName: z.string().max(120).optional().default(''),
  fare: z.number().min(0).max(1000).nullable().optional(),
  stops: z.array(z.string().max(120)).max(80).optional().default([]),
});

export function addRoute(req: Request, res: Response, next: NextFunction): void {
  try {
    if (env.PATHIK_ENABLE_ROUTE_WRITES !== '1') {
      res.status(403).json({ success: false, error: { code: 'ROUTE_WRITES_DISABLED', message: 'Route writes are disabled on this server' } });
      return;
    }
    const parsed = addRouteSchema.parse(req.body);
    const from = cleanInput(parsed.from, 120, { lowercase: true });
    const to = cleanInput(parsed.to, 120, { lowercase: true });
    const busName = cleanInput(parsed.busName, 120);
    const fare = parsed.fare ?? null;
    const stopsList = cleanStringList(parsed.stops, 80);
    const existing = readJsonFile<any>('routes.json');
    const data = existing && Array.isArray(existing.corridors) ? existing : { places: {}, corridors: [] };
    if (data.corridors.some((c: any) => String(c.from || '').toLowerCase() === from && String(c.to || '').toLowerCase() === to)) {
      res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'This route already exists' } });
      return;
    }
    if (!data.places[from]) data.places[from] = [];
    if (!data.places[to]) data.places[to] = [];
    const titleFrom = titleCase(from);
    const titleTo = titleCase(to);
    const direct: any = { mode: 'bus', names: busName ? [busName] : [], stops: [titleFrom, ...stopsList.map(titleCase), titleTo] };
    if (fare !== null) direct.fare = fare;
    const newCorridor = { from: titleFrom, to: titleTo, direct };
    data.corridors.push(newCorridor);
    writeJsonFile('routes.json', data);
    logger.info(`[transit] New corridor added: ${titleFrom} → ${titleTo}`);
    res.status(201).json({ success: true, message: `Route "${titleFrom} → ${titleTo}" added`, corridor: newCorridor });
  } catch (err) { next(err); }
}

const feedbackSchema = z.object({
  type: z.string().max(40).optional().default('correct'),
  note: z.string().max(1200).optional().default(''),
  origin: z.string().max(120).optional().default(''),
  destination: z.string().max(120).optional().default(''),
  routeLabel: z.string().max(120).optional().default(''),
  source: z.string().max(80).optional().default(''),
  confidence: z.string().max(40).optional().default(''),
});

export function createFeedback(req: Request, res: Response, next: NextFunction): void {
  try {
    const parsed = feedbackSchema.parse(req.body);
    const item = { id: `feedback_${Date.now()}`, ...parsed, createdAt: new Date().toISOString() };
    const items = readJsonArray('feedback.json');
    items.unshift(item);
    writeJsonArray('feedback.json', items, 1000);
    res.status(201).json({ success: true, data: item });
  } catch (err) { next(err); }
}
