-- Respect Transfers — on-chain transfer history for OG + ZOR tokens
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS respect_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_hash TEXT NOT NULL,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  token_type TEXT NOT NULL CHECK (token_type IN ('og_erc20', 'zor_erc1155')),
  amount TEXT NOT NULL,
  block_number BIGINT,
  block_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tx_hash, to_address, token_type)
);

CREATE INDEX IF NOT EXISTS idx_respect_transfers_to ON respect_transfers (to_address);
CREATE INDEX IF NOT EXISTS idx_respect_transfers_from ON respect_transfers (from_address);
CREATE INDEX IF NOT EXISTS idx_respect_transfers_timestamp ON respect_transfers (block_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_respect_transfers_type ON respect_transfers (token_type);

ALTER TABLE respect_transfers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read transfers" ON respect_transfers;
CREATE POLICY "Public read transfers" ON respect_transfers FOR SELECT USING (true);
