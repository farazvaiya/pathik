#!/usr/bin/env node

/**
 * Pathik — Generate Route Embeddings for Supabase (Hybrid RAG)
 *
 * Reads routes.json + metro.json, generates 384-dim embeddings via
 * all-MiniLM-L6-v2 (@xenova/transformers), and upserts to Supabase.
 *
 * Usage:
 *   node backend/scripts/generate-embeddings.js
 *
 * Prerequisites:
 *   - SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in backend/.env
 *   - npm install @xenova/transformers (already in package.json)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../../');
const ROUTES_FILE = path.join(ROOT, 'routes.json');
const METRO_FILE = path.join(ROOT, 'metro.json');

async function main() {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });

  const { env } = require('../src/config/env');
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in backend/.env');
    process.exit(1);
  }

  console.log('[embeddings] Loading transformer model...');
  const { pipeline } = await import('@xenova/transformers');
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  console.log('[embeddings] Model loaded.');

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const embeddings = [];

  // Process routes.json
  if (fs.existsSync(ROUTES_FILE)) {
    const routesData = JSON.parse(fs.readFileSync(ROUTES_FILE, 'utf8'));
    const corridors = routesData.corridors || [];
    console.log(`[embeddings] Processing ${corridors.length} corridors...`);

    for (const corridor of corridors) {
      const routeName = `${(corridor.from || '').toLowerCase().replace(/\s+/g, '_')}_to_${(corridor.to || '').toLowerCase().replace(/\s+/g, '_')}`;
      const busNames = corridor.direct?.names || [];
      const stops = corridor.direct?.stops || [];
      const searchText = [
        corridor.from,
        corridor.to,
        ...busNames,
        ...stops,
        corridor.direct?.mode || '',
      ].filter(Boolean).join(' ');

      const output = await extractor(searchText, { pooling: 'mean', normalize: true });
      const vector = Array.from(output.data);

      embeddings.push({
        route_name: routeName,
        embedding: `[${vector.join(',')}]`,
        route_data: corridor,
        search_text: searchText,
        metadata: { source: 'routes.json', mode: corridor.direct?.mode || 'bus' },
      });
    }
  }

  // Process metro.json
  if (fs.existsSync(METRO_FILE)) {
    const metroData = JSON.parse(fs.readFileSync(METRO_FILE, 'utf8'));
    const stations = metroData.stations || [];
    console.log(`[embeddings] Processing ${stations.length} metro stations...`);

    for (const station of stations) {
      const routeName = `metro_${(station.name || '').toLowerCase().replace(/\s+/g, '_')}`;
      const searchText = [
        station.name,
        'metro',
        'MRT',
        'Dhaka Metro',
        ...(station.connections || []),
      ].filter(Boolean).join(' ');

      const output = await extractor(searchText, { pooling: 'mean', normalize: true });
      const vector = Array.from(output.data);

      embeddings.push({
        route_name: routeName,
        embedding: `[${vector.join(',')}]`,
        route_data: station,
        search_text: searchText,
        metadata: { source: 'metro.json', mode: 'metro' },
      });
    }
  }

  console.log(`[embeddings] Upserting ${embeddings.length} embeddings to Supabase...`);

  const BATCH_SIZE = 50;
  for (let i = 0; i < embeddings.length; i += BATCH_SIZE) {
    const batch = embeddings.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('route_embeddings')
      .upsert(batch, { onConflict: 'route_name' });

    if (error) {
      console.error(`[embeddings] Batch ${Math.floor(i / BATCH_SIZE)} failed:`, error.message);
    } else {
      console.log(`[embeddings] Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(embeddings.length / BATCH_SIZE)} done`);
    }
  }

  console.log(`[embeddings] ✅ Done! ${embeddings.length} embeddings upserted.`);
}

main().catch((err) => {
  console.error('[embeddings] Fatal error:', err);
  process.exit(1);
});
