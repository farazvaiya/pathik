#!/usr/bin/env node
/**
 * Generate embeddings for routes and upsert to Supabase.
 * Run: node scripts/generate-embeddings.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL?.trim();
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function getEmbedding(text) {
  const { pipeline } = await import('@xenova/transformers');
  if (!getEmbedding._pipe) {
    console.log('Loading embedding model...');
    getEmbedding._pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  const output = await getEmbedding._pipe(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

function loadJson(filename) {
  const p = path.join(__dirname, '..', '..', filename);
  if (!fs.existsSync(p)) { console.warn(`${filename} not found`); return null; }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

async function main() {
  const routes = loadJson('routes.json');
  const metro = loadJson('metro.json');

  const records = [];
  const seen = new Set();

  if (routes?.corridors) {
    for (const c of routes.corridors) {
      const key = `${String(c.from).toLowerCase().trim()}::${String(c.to).toLowerCase().trim()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const busNames = c.direct?.names || [];
      const stops = c.direct?.stops || [];
      records.push({
        route_name: `${c.from} to ${c.to}`,
        from_stop: String(c.from).trim(),
        to_stop: String(c.to).trim(),
        bus_names: busNames,
        fare: c.direct?.fare ?? null,
        stops,
        content: [c.from, c.to, ...busNames, ...stops.slice(0, 5)].join(' '),
      });
    }
  }

  if (metro?.stations) {
    const stations = metro.stations;
    for (let i = 0; i < stations.length; i++) {
      for (let j = i + 1; j < stations.length; j++) {
        const key = `metro::${stations[i]}::${stations[j]}`;
        if (seen.has(key)) continue;
        seen.add(key);
        records.push({
          route_name: `Metro: ${stations[i]} to ${stations[j]}`,
          from_stop: stations[i],
          to_stop: stations[j],
          bus_names: ['MRT-6'],
          fare: metro?.fares?.[stations[i]]?.[stations[j]] ?? null,
          stops: [],
          content: `metro MRT-6 ${stations[i]} ${stations[j]}`,
        });
      }
    }
  }

  console.log(`${records.length} unique routes to embed`);

  let success = 0, errors = 0;
  const BATCH = 10;

  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH);
    await Promise.all(
      batch.map(async (r) => {
        try {
          const embedding = await getEmbedding(r.content);
          const { error } = await supabase.from('route_embeddings').upsert(
            { ...r, embedding },
            { onConflict: 'route_name' }
          );
          if (error) { console.error(`  FAIL ${r.route_name}: ${error.message}`); errors++; }
          else { success++; process.stdout.write('.'); }
        } catch (e) {
          console.error(`  FAIL ${r.route_name}: ${e.message}`);
          errors++;
        }
      })
    );
    console.log(` [${Math.min(i + BATCH, records.length)}/${records.length}]`);
  }

  console.log(`\nDone. Success: ${success}, Errors: ${errors}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
