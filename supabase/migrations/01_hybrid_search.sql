-- Pathik Hybrid Search: Supabase Migration
-- Run this in Supabase SQL Editor to set up the vector store

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Create route_embeddings table
CREATE TABLE IF NOT EXISTS route_embeddings (
  id            BIGSERIAL PRIMARY KEY,
  route_name    TEXT UNIQUE NOT NULL,
  embedding     VECTOR(384) NOT NULL,
  route_data    JSONB,
  search_text   TEXT NOT NULL DEFAULT '',
  search_vector TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', search_text)) STORED,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_route_embeddings_hnsw
  ON route_embeddings USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_route_embeddings_fts
  ON route_embeddings USING GIN (search_vector);

CREATE INDEX IF NOT EXISTS idx_route_embeddings_trgm
  ON route_embeddings USING GIN (search_text gin_trgm_ops);

-- 4. Create hybrid search function
CREATE OR REPLACE FUNCTION match_routes_hybrid(
  query_embedding VECTOR(384),
  query_text      TEXT,
  match_count     INT   DEFAULT 5,
  vector_weight   FLOAT DEFAULT 0.5,
  text_weight     FLOAT DEFAULT 0.5,
  min_score       FLOAT DEFAULT 0.1
)
RETURNS TABLE (
  id            BIGINT,
  route_name    TEXT,
  route_data    JSONB,
  search_text   TEXT,
  metadata      JSONB,
  score         FLOAT,
  vector_score  FLOAT,
  text_score    FLOAT,
  created_at    TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH vector_matches AS (
    SELECT
      re.id,
      re.route_name,
      re.route_data,
      re.search_text,
      re.metadata,
      re.created_at,
      1 - (re.embedding <=> query_embedding) AS vec_score
    FROM route_embeddings re
    ORDER BY re.embedding <=> query_embedding
    LIMIT match_count * 2
  ),
  text_matches AS (
    SELECT
      vm.id,
      ts_rank(vm.search_vector, plainto_tsquery('english', query_text)) AS txt_score
    FROM vector_matches vm
    WHERE vm.search_vector @@ plainto_tsquery('english', query_text)
  ),
  combined AS (
    SELECT
      vm.*,
      COALESCE(vm.vec_score, 0) AS vector_score,
      COALESCE(tm.txt_score, 0) AS text_score,
      (vector_weight * COALESCE(vm.vec_score, 0)) + (text_weight * COALESCE(tm.txt_score, 0)) AS combined_score
    FROM vector_matches vm
    LEFT JOIN text_matches tm ON vm.id = tm.id
  )
  SELECT
    c.id,
    c.route_name,
    c.route_data,
    c.search_text,
    c.metadata,
    c.combined_score AS score,
    c.vector_score,
    c.text_score,
    c.created_at
  FROM combined c
  WHERE c.combined_score >= min_score
  ORDER BY c.combined_score DESC
  LIMIT match_count;
END;
$$;

-- 5. Updated_at trigger
CREATE OR REPLACE FUNCTION update_route_embeddings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_route_embeddings_updated_at ON route_embeddings;
CREATE TRIGGER update_route_embeddings_updated_at
  BEFORE UPDATE ON route_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION update_route_embeddings_updated_at();
