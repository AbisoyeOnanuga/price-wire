CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS comps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  brand TEXT NOT NULL,
  model_family TEXT NOT NULL,
  storage_gb INT,
  carrier_lock TEXT NOT NULL,
  condition_grade TEXT NOT NULL,
  includes_charger BOOLEAN NOT NULL DEFAULT false,
  platform TEXT NOT NULL,
  listed_price NUMERIC(10, 2),
  sold_price NUMERIC(10, 2) NOT NULL,
  days_on_market INT,
  source TEXT NOT NULL DEFAULT 'seed',
  search_text TEXT NOT NULL,
  embedding vector(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS comps_brand_model_idx ON comps (brand, model_family);
CREATE INDEX IF NOT EXISTS comps_search_gin ON comps USING gin (to_tsvector('english', search_text));
CREATE INDEX IF NOT EXISTS comps_embedding_idx ON comps USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);
