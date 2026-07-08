import { getSupabaseClient } from '../config/supabase';
import { logger } from '../utils/logger';

let _pipeline: any = null;

async function getEmbedding(text: string): Promise<number[]> {
  if (!_pipeline) {
    const { pipeline } = await import('@xenova/transformers');
    _pipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  const output = await _pipeline(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data as Float32Array);
}

export async function hybridSearch(
  queryText: string,
  limit = 5,
  options: { vectorWeight?: number; textWeight?: number } = {}
): Promise<any[]> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    logger.warn('[vector] Supabase not configured — skipping hybrid search');
    return [];
  }

  const embedding = await getEmbedding(queryText);
  const { vectorWeight = 0.7, textWeight = 0.3 } = options;

  const { data, error } = await supabase.rpc('match_routes_hybrid', {
    query_text: queryText,
    query_embedding: embedding,
    match_count: limit,
    vector_weight: vectorWeight,
    text_weight: textWeight,
  });

  if (error) {
    logger.error(`[vector] hybridSearch RPC error: ${error.message}`);
    return [];
  }

  return data || [];
}

export async function upsertRouteEmbedding(route: {
  route_name: string;
  from_stop: string;
  to_stop: string;
  bus_names?: string[];
  fare?: number | null;
  stops?: string[];
}): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not configured');

  const text = [
    route.route_name,
    `${route.from_stop} to ${route.to_stop}`,
    route.bus_names?.join(' ') || '',
    route.stops?.join(' ') || '',
  ].join(' ').trim();

  const embedding = await getEmbedding(text);

  const { error } = await supabase.from('route_embeddings').upsert(
    {
      route_name: route.route_name,
      from_stop: route.from_stop,
      to_stop: route.to_stop,
      bus_names: route.bus_names || [],
      fare: route.fare ?? null,
      stops: route.stops || [],
      embedding,
      content: text,
    },
    { onConflict: 'route_name' }
  );

  if (error) throw new Error(`Upsert failed: ${error.message}`);
}
