-- arweave-assets.sql
-- Arweave atomic assets minted by ZAO members

CREATE TABLE IF NOT EXISTS arweave_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fid INTEGER NOT NULL,
  arweave_tx_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  content_type TEXT NOT NULL,
  cover_tx_id TEXT,
  genre TEXT,
  description TEXT,
  license_preset TEXT DEFAULT 'collectible',
  price_u NUMERIC,
  edition_size INTEGER,
  collected_count INTEGER DEFAULT 0,
  ucm_order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  song_id UUID
);

CREATE TABLE IF NOT EXISTS arweave_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES arweave_assets(id),
  collector_address TEXT NOT NULL,
  collector_fid INTEGER,
  price_paid NUMERIC,
  collected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_arweave_assets_fid ON arweave_assets(fid);
CREATE INDEX IF NOT EXISTS idx_arweave_assets_created ON arweave_assets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_arweave_collections_asset ON arweave_collections(asset_id);
CREATE INDEX IF NOT EXISTS idx_arweave_collections_fid ON arweave_collections(collector_fid);

ALTER TABLE arweave_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE arweave_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on arweave_assets"
  ON arweave_assets FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on arweave_collections"
  ON arweave_collections FOR ALL USING (auth.role() = 'service_role');

CREATE TABLE IF NOT EXISTS system_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE system_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only on system_state"
  ON system_state FOR ALL USING (auth.role() = 'service_role');
