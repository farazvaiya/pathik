const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 8080);
const FEEDBACK_FILE = path.join(__dirname, 'feedback.json');
const ROUTES_FILE = path.join(__dirname, 'routes.json');
const GROQ_BASE = 'https://api.groq.com/openai/v1';
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const NVIDIA_BASE = 'https://integrate.api.nvidia.com/v1';

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  });
  res.end(JSON.stringify(payload));
}

function readRequestBody(req, limitBytes = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > limitBytes) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

async function handleFeedback(req, res) {
  try {
    const raw = await readRequestBody(req, 64 * 1024);
    const input = JSON.parse(raw || '{}');
    const item = {
      id: `feedback_${Date.now()}`,
      type: String(input.type || 'correct').slice(0, 40),
      note: String(input.note || '').slice(0, 1200),
      origin: String(input.origin || '').slice(0, 120),
      destination: String(input.destination || '').slice(0, 120),
      routeLabel: String(input.routeLabel || '').slice(0, 120),
      source: String(input.source || '').slice(0, 80),
      confidence: String(input.confidence || '').slice(0, 40),
      createdAt: new Date().toISOString(),
    };
    let items = [];
    if (fs.existsSync(FEEDBACK_FILE)) {
      items = JSON.parse(fs.readFileSync(FEEDBACK_FILE, 'utf8') || '[]');
      if (!Array.isArray(items)) items = [];
    }
    items.unshift(item);
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(items.slice(0, 1000), null, 2));
    sendJson(res, 201, { ok: true, item });
  } catch (err) {
    sendJson(res, 400, { ok: false, error: err.message });
  }
}

/**
 * POST /api/routes — Add a new route to routes.json permanently
 * Body: { from, to, busName, fare, stops: ["stop1","stop2",...] }
 */
async function handleAddRoute(req, res) {
  try {
    const raw = await readRequestBody(req, 64 * 1024);
    const input = JSON.parse(raw || '{}');
    const from = String(input.from || '').trim().toLowerCase();
    const to = String(input.to || '').trim().toLowerCase();
    const busName = String(input.busName || '').trim();
    const fare = Number(input.fare) || null;
    const stopsList = Array.isArray(input.stops) ? input.stops.map(s => String(s).trim()).filter(Boolean) : [];

    if (!from || !to) {
      sendJson(res, 400, { error: 'from and to are required' });
      return;
    }

    // Read current routes.json
    let data = { places: {}, corridors: [] };
    if (fs.existsSync(ROUTES_FILE)) {
      data = JSON.parse(fs.readFileSync(ROUTES_FILE, 'utf8') || '{}');
      if (!Array.isArray(data.corridors)) data.corridors = [];
      if (typeof data.places !== 'object' || data.places === null) data.places = {};
    }

    // Check if this corridor already exists (exact from→to match)
    const exists = data.corridors.some(c => 
      String(c.from || '').toLowerCase() === from && 
      String(c.to || '').toLowerCase() === to
    );
    if (exists) {
      sendJson(res, 409, { error: 'This route already exists in routes.json' });
      return;
    }

    // Build stops with proper title case
    const titleCase = s => String(s || '').split(' ').map(w => w ? w[0].toUpperCase() + w.slice(1) : '').join(' ');
    const titleFrom = titleCase(from);
    const titleTo = titleCase(to);

    // Ensure from and to are in places
    if (!data.places[from]) data.places[from] = [];
    if (!data.places[to]) data.places[to] = [];

    // Create the corridor entry
    const newCorridor = {
      from: titleFrom,
      to: titleTo,
      direct: {
        mode: "bus",
        names: busName ? [busName] : [],
        stops: [titleFrom, ...stopsList.map(titleCase), titleTo]
      }
    };

    data.corridors.push(newCorridor);

    // Update the _note count
    data._note = `Auto-converted from route.txt. ${data.corridors.length} corridors.`;

    // Write back to file
    fs.writeFileSync(ROUTES_FILE, JSON.stringify(data, null, 2));
    console.log(`[Pathik] New route added to routes.json: ${titleFrom} → ${titleTo}`);

    sendJson(res, 201, { ok: true, message: `Route "${titleFrom} → ${titleTo}" added permanently to routes.json`, corridor: newCorridor });
  } catch (err) {
    console.error('[Pathik] Error adding route:', err);
    sendJson(res, 500, { error: err.message });
  }
}

async function handleAiRoute(req, res) {
  try {
    const raw = await readRequestBody(req, 64 * 1024);
    const { query } = JSON.parse(raw || '{}');
    if (!query || typeof query !== 'string') {
      sendJson(res, 400, { error: 'Missing query' });
      return;
    }

    const provider = process.env.PATHIK_AI_PROVIDER || 'groq';
    const isOpenRouter = provider === 'openrouter';
    const isNvidia = provider === 'nvidia';
    const key = isNvidia ? process.env.NVIDIA_API_KEY : (isOpenRouter ? process.env.OPENROUTER_API_KEY : process.env.GROQ_API_KEY);
    if (!key) {
      sendJson(res, 503, { error: 'AI provider key is not configured on the server' });
      return;
    }

    const defaultModel = process.env.PATHIK_AI_MODEL || (
      isNvidia ? 'nvidia/llama-3.3-nemotron-super-49b-v1.5' :
      isOpenRouter ? 'meta-llama/llama-3.3-70b-instruct:free' :
      'llama-3.3-70b-versatile'
    );
    const models = (process.env.PATHIK_AI_MODELS || defaultModel)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const base = isNvidia ? NVIDIA_BASE : (isOpenRouter ? OPENROUTER_BASE : GROQ_BASE);
    const prompt = `Return strict JSON for Dhaka public transit query "${query}". Use only bus, ac_bus, and metro. Schema: {"origin":"","destination":"","routes":[{"id":1,"label":"","total_cost":0,"total_cost_range":"","total_time_minutes":0,"total_time_range":"","steps":[{"mode":"","icon":"","from":"","to":"","bus_names":[],"landmarks":[],"cost":0,"cost_range":"","time_minutes":0,"time_range":"","tip_bn":""}]}]}.`;
    const headers = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
    if (isOpenRouter || isNvidia) {
      headers['HTTP-Referer'] = process.env.PATHIK_PUBLIC_URL || 'http://localhost:8080';
      headers['X-Title'] = 'Pathik Transit';
    }

    let lastError = null;
    for (const model of models) {
      try {
        const aiRes = await fetch(`${base}/chat/completions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2,
            max_tokens: 4096,
            response_format: { type: 'json_object' },
          }),
        });
        const text = await aiRes.text();
        if (!aiRes.ok) {
          lastError = new Error(`${model} HTTP ${aiRes.status}: ${text.slice(0, 500)}`);
          continue;
        }
        const data = JSON.parse(text);
        const content = data?.choices?.[0]?.message?.content || '{}';
        const parsed = JSON.parse(content);
        sendJson(res, 200, { ...parsed, _source: 'ai_proxy', _model: model });
        return;
      } catch (err) {
        lastError = err;
      }
    }
    sendJson(res, 502, { error: lastError ? lastError.message : 'All AI models failed' });
  } catch (err) {
    sendJson(res, 500, { error: err.message });
  }
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  if (req.url.startsWith('/api/feedback') && req.method === 'POST') {
    handleFeedback(req, res);
    return;
  }

  if (req.url.startsWith('/api/routes') && req.method === 'POST') {
    handleAddRoute(req, res);
    return;
  }

  if (req.url.startsWith('/api/route') && req.method === 'POST') {
    handleAiRoute(req, res);
    return;
  }

  const cleanUrl = req.url.split('?')[0];
  let filePath = path.join(__dirname, cleanUrl === '/' ? 'index.html' : cleanUrl);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Server Error');
      }
      return;
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`[Pathik] Server running at http://localhost:${PORT}`);
  console.log(`[Pathik] Open that URL in your browser (NOT the file directly)`);
});