# Pathik Deployment

This project can run as a static website or as a small full-stack Node app.
For a simple varsity/demo deploy, Netlify, Vercel, or GitHub Pages is enough.
For production-style AI and server-synced feedback, deploy `server.js`.

## Before Publishing

1. Keep real API keys out of `config.js`.
2. Revoke/regenerate any API keys that were previously shared or committed.
3. Publish these files:
   - `index.html`
   - `style.css`
   - `script.js`
   - `config.js`
   - `routes.json`
   - `metro.json`

`server.js`, `convert.js`, and `node_modules/` are not needed for static hosting.

For a full-stack deployment, keep API keys in server environment variables:

```text
GROQ_API_KEY=your_groq_key
OPENROUTER_API_KEY=your_openrouter_key
PATHIK_AI_PROVIDER=groq
PATHIK_AI_MODEL=llama-3.3-70b-versatile
PATHIK_PUBLIC_URL=https://your-domain.example
```

You can also configure a fallback chain. The backend will try each model in
order until one returns valid route JSON:

```text
PATHIK_AI_MODELS=nvidia/llama-3.3-nemotron-super-49b-v1.5,nvidia/llama-3.3-nemotron-super-49b-v1,qwen/qwen3-next-80b-a3b-instruct
```

Then set `AI_PROXY_URL` in `config.js` to:

```text
/api/route
```

## Netlify

1. Create a GitHub repository and upload the project files.
2. Go to Netlify and choose "Add new site" > "Import an existing project".
3. Select the repository.
4. Build command: leave empty.
5. Publish directory: `.`
6. Deploy.

## GitHub Pages

1. Push the files to a GitHub repository.
2. Open repository Settings > Pages.
3. Source: deploy from branch.
4. Branch: `main`, folder: `/root`.
5. Save and wait for the Pages URL.

## Local Preview

Run:

```bash
node server.js
```

Then open:

```text
http://localhost:8080
```

## Full-Stack Local Preview

To test the backend AI proxy locally, run:

```bash
GROQ_API_KEY=your_key node server.js
```

Then set `AI_PROXY_URL: '/api/route'` in `config.js`.

Feedback submitted from the app is saved to `feedback.json`.

## Model Benchmark

Use the benchmark to compare NVIDIA/Groq/OpenRouter models against the same
verified route queries.

1. Start the backend with the model you want to test:

```bash
GROQ_API_KEY=your_key PATHIK_AI_PROVIDER=groq PATHIK_AI_MODEL=llama-3.3-70b-versatile node server.js
```

2. Run the benchmark:

```bash
BENCHMARK_URL=http://localhost:8080/api/route BENCHMARK_MODEL=llama-3.3-70b-versatile node benchmark.js
```

3. Compare the printed score and the generated `benchmark-result-*.json`.

For NVIDIA, use server environment variables like:

```text
NVIDIA_API_KEY=your_key
PATHIK_AI_PROVIDER=nvidia
PATHIK_AI_MODEL=nvidia/llama-3.3-nemotron-super-49b-v1.5
```

To benchmark a model chain:

```bash
NVIDIA_API_KEY=your_key PATHIK_AI_PROVIDER=nvidia PATHIK_AI_MODELS=nvidia/llama-3.3-nemotron-super-49b-v1.5,nvidia/llama-3.3-nemotron-super-49b-v1 node server.js
```

To test many NVIDIA models with one command:

```bash
NVIDIA_API_KEY=your_key node benchmark-all-models.js
```

The candidate list lives in `benchmark-models.json`. The script skips failed or
unavailable models, scores every model against the same route queries, prints a
ranking table, and saves `benchmark-all-result-*.json`.

For a faster smoke test:

```bash
NVIDIA_API_KEY=your_key BENCHMARK_MAX_CASES=3 node benchmark-all-models.js
```

If models time out, start with one case and a longer timeout:

```bash
NVIDIA_API_KEY=your_key BENCHMARK_MAX_CASES=1 BENCHMARK_TIMEOUT_MS=120000 node benchmark-all-models.js
```

Useful benchmark knobs:

```text
BENCHMARK_MAX_CASES=3              # test fewer route queries first
BENCHMARK_TIMEOUT_MS=120000        # wait longer for slow/cold models
BENCHMARK_MAX_TOKENS=1536          # lower tokens for faster responses
BENCHMARK_SKIP_AFTER_TIMEOUTS=1    # skip remaining cases after a model timeout
```
