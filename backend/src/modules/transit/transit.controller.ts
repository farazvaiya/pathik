import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
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

// === Safety Score ===

const SAFETY_CACHE = new Map<string, { score: number; data: any; ts: number }>();
const SAFETY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const DANGER_CATEGORIES = new Set([
  'accident', 'assault', 'robbery', 'harassment', 'escaped_criminal',
  'toll_extortion', 'road_hazard', 'fire', 'natural_disaster',
]);

// Map user-selected post types to AI categories for posts not yet classified
const TYPE_TO_CATEGORY: Record<string, string> = {
  traffic: 'traffic_jam',
  accident: 'accident',
  danger: 'other',
  tip: 'other',
  event: 'other',
  other: 'other',
};

const SEVERITY_WEIGHTS: Record<string, number> = {
  critical: 4, high: 3, medium: 2, low: 1,
};

const safetyScoreSchema = z.object({
  stops: z.array(z.string().max(120)).min(2).max(20),
});

export async function getSafetyScore(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { stops } = safetyScoreSchema.parse(req.body);
    const cacheKey = stops.map(s => s.toLowerCase().trim()).sort().join('|');

    const cached = SAFETY_CACHE.get(cacheKey);
    if (cached && Date.now() - cached.ts < SAFETY_CACHE_TTL) {
      res.json({ success: true, data: cached.data });
      return;
    }

    const FeedPost = mongoose.model('FeedPost');
    const Alert = mongoose.model('Alert');

    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    // Normalize stop names for exact matching
    const normalizedStops = stops.map(s => s.toLowerCase().trim());
    const normalizedStopSet = new Set(normalizedStops);

    let incidentCount = 0;
    let totalPenalty = 0;
    const topRisks: string[] = [];

    // === FeedPost query ===
    try {
      const posts = await FeedPost.find({
        status: 'active',
        isDeleted: false,
        $or: [
          { from: { $exists: true, $ne: '' } },
          { to: { $exists: true, $ne: '' } },
          { locationName: { $exists: true, $ne: '' } },
        ],
        createdAt: { $gte: new Date(now - thirtyDays) },
      }).select('from to type aiCategory aiSeverity upvotes downvotes createdAt message locationName').lean();

      for (const post of posts) {
        const p = post as any;

        // Exact match: check from/to fields
        const fromNorm = String(p.from || '').toLowerCase().trim();
        const toNorm = String(p.to || '').toLowerCase().trim();
        const locNorm = String(p.locationName || '').toLowerCase().trim();
        const matchesStop =
          normalizedStopSet.has(fromNorm) ||
          normalizedStopSet.has(toNorm) ||
          (locNorm && normalizedStops.some(s => locNorm === s || s === locNorm));

        if (!matchesStop) continue;

        // Determine category: use aiCategory if available, else fallback to user type
        let cat = p.aiCategory;
        if (!cat && p.type) {
          cat = TYPE_TO_CATEGORY[p.type] || 'other';
        }
        if (!cat || !DANGER_CATEGORIES.has(cat)) continue;

        const severity = p.aiSeverity || 'medium';
        const age = now - new Date(p.createdAt).getTime();
        const timeDecay = age < sevenDays ? 1.0 : age < thirtyDays ? 0.5 : 0.2;
        const upvotes = p.upvotes || 0;
        const downvotes = p.downvotes || 0;
        const communityFactor = 1 + (downvotes * 0.1) - (upvotes * 0.05);

        const penalty = (SEVERITY_WEIGHTS[severity] || 2) * timeDecay * Math.max(0.1, communityFactor);
        totalPenalty += penalty;
        incidentCount++;

        if (topRisks.length < 3 && p.message) {
          topRisks.push(`${cat}: ${String(p.message).slice(0, 80)}`);
        }
      }
    } catch (err: any) {
      logger.warn(`[safety] FeedPost query failed: ${err.message}`);
    }

    // === Alert query ===
    try {
      const alerts = await Alert.find({
        status: 'active',
        $or: [
          { from: { $exists: true, $ne: '' } },
          { to: { $exists: true, $ne: '' } },
        ],
        createdAt: { $gte: new Date(now - thirtyDays) },
      }).select('type severity from to sightingCount createdAt').lean();

      for (const alert of alerts) {
        const a = alert as any;
        const fromNorm = String(a.from || '').toLowerCase().trim();
        const toNorm = String(a.to || '').toLowerCase().trim();
        const matchesStop = normalizedStopSet.has(fromNorm) || normalizedStopSet.has(toNorm);
        if (!matchesStop) continue;

        const age = now - new Date(a.createdAt).getTime();
        const timeDecay = age < sevenDays ? 1.0 : age < thirtyDays ? 0.5 : 0.2;
        const sightingBoost = 1 + (a.sightingCount || 0) * 0.15;

        const penalty = (SEVERITY_WEIGHTS[a.severity] || 2) * timeDecay * sightingBoost;
        totalPenalty += penalty;
        incidentCount++;

        if (topRisks.length < 3) {
          topRisks.push(`${a.type}: Alert active near this corridor`);
        }
      }
    } catch (err: any) {
      logger.warn(`[safety] Alert query failed: ${err.message}`);
    }

    const safetyScore = Math.max(1, Math.min(10, Math.round(10 - totalPenalty)));

    const result = {
      safetyScore,
      incidentCount,
      topRisks: topRisks.slice(0, 3),
      scoreLabel: safetyScore >= 7 ? 'safe' : safetyScore >= 4 ? 'moderate' : 'caution',
    };

    SAFETY_CACHE.set(cacheKey, { score: safetyScore, data: result, ts: Date.now() });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// === Chatbot ===

const chatSchema = z.object({
  message: z.string().min(1).max(500),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(1000),
  })).max(10).optional().default([]),
});

const CHAT_SYSTEM_PROMPT = `You are Pathik, a friendly Dhaka public transit assistant. Answer in Bangla (Banglish is fine). Be concise (2-3 sentences max). Use real-time incident data provided in context. Always mention safety concerns if any. If you don't know, say "আমার কাছে এই তথ্য নেই" (I don't have this info). Return strict JSON: {"response_bn": "your answer"}`;

export async function handleChat(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { message, history } = chatSchema.parse(req.body);

    // Gather real-time context
    let contextStr = '';

    try {
      const FeedPost = mongoose.model('FeedPost');
      const Alert = mongoose.model('Alert');

      // Recent posts mentioning the query keywords
      const keywords = message.split(/\s+/).filter(w => w.length > 2).slice(0, 5);
      if (keywords.length > 0) {
        const keywordRegex = keywords.map(k => new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
        const recentPosts = await FeedPost.find({
          status: 'active',
          isDeleted: false,
          $or: [
            { message: { $in: keywordRegex } },
            { from: { $in: keywordRegex } },
            { to: { $in: keywordRegex } },
          ],
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        }).select('type from to message aiCategory aiSeverity locationName createdAt').limit(5).lean();

        if (recentPosts.length > 0) {
          contextStr += 'Recent incidents in relevant area:\n';
          recentPosts.forEach((p: any) => {
            contextStr += `- ${p.aiCategory || p.type}: ${p.from || ''} → ${p.to || ''} (${p.aiSeverity || 'unknown'}). "${String(p.message).slice(0, 100)}"\n`;
          });
        }

        const recentAlerts = await Alert.find({
          status: 'active',
          $or: [
            { from: { $in: keywordRegex } },
            { to: { $in: keywordRegex } },
          ],
        }).select('type severity from to locationName sightingCount').limit(3).lean();

        if (recentAlerts.length > 0) {
          contextStr += 'Active alerts:\n';
          recentAlerts.forEach((a: any) => {
            contextStr += `- ${a.type} (${a.severity}): ${a.from || ''} → ${a.to || ''}. Sightings: ${a.sightingCount || 0}\n`;
          });
        }
      }
    } catch (err: any) {
      logger.warn(`[chat] Context gathering failed: ${err.message}`);
    }

    const provider = env.PATHIK_AI_PROVIDER;
    const base = AI_BASES[provider];
    const key = provider === 'nvidia' ? env.NVIDIA_API_KEY : provider === 'openrouter' ? env.OPENROUTER_API_KEY : env.GROQ_API_KEY;

    if (!key) {
      res.status(503).json({ success: false, error: { code: 'AI_NOT_CONFIGURED', message: 'AI provider key is not configured' } });
      return;
    }

    const models = (env.PATHIK_AI_MODELS || DEFAULT_MODELS[provider]).split(',').map(m => m.trim()).filter(Boolean);

    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: CHAT_SYSTEM_PROMPT },
    ];

    // Add conversation history
    for (const h of history.slice(-6)) {
      messages.push({ role: h.role, content: h.content });
    }

    // Add current message with context
    const userMessage = contextStr
      ? `User question: "${message}"\n\nReal-time context:\n${contextStr}`
      : `User question: "${message}"`;
    messages.push({ role: 'user', content: userMessage });

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
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.3,
            max_tokens: 512,
            response_format: { type: 'json_object' },
          }),
        });
        const text = await aiRes.text();
        if (!aiRes.ok) { lastError = new Error(`${model} HTTP ${aiRes.status}`); continue; }
        const data = JSON.parse(text);
        const content = data?.choices?.[0]?.message?.content || '{}';
        const parsed = JSON.parse(content);
        res.json({ success: true, data: { response_bn: parsed.response_bn || 'Sorry, I could not understand.', _model: model } });
        return;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    res.status(502).json({ success: false, error: { code: 'AI_UPSTREAM_ERROR', message: lastError?.message || 'AI failed' } });
  } catch (err) {
    next(err);
  }
}
