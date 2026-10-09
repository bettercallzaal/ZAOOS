-- Farcaster signer provenance (DreamNet Phase 1, Brandon's decisions 1-3, 2026-10-09)
--
-- NOT APPLIED. Zaal applies this after his impact review (vault decision item 28).
--
-- Two NEW tables. Nothing existing is altered: channel_casts, hidden_messages
-- and every other table are untouched, and no existing row is read or changed.
-- Shapes match src/lib/farcaster/signer-provenance.ts (PR #3855).
--
-- Rollback (removes only what this file adds):
--   DROP TABLE IF EXISTS public.cast_signer_provenance;
--   DROP TABLE IF EXISTS public.farcaster_signer_authority;

-- 1. Which key signed which cast, as read from a Farcaster hub.
--    Keyed on (cast_hash, signer), not cast_hash alone: a cast hash covers the
--    message data, not the signer, so deduplication must never overwrite an
--    earlier signer's provenance (Brandon's reference correction).
CREATE TABLE IF NOT EXISTS public.cast_signer_provenance (
  cast_hash         TEXT        NOT NULL CHECK (cast_hash ~ '^0x[0-9a-f]{40,64}$'),
  fid               BIGINT      NOT NULL CHECK (fid > 0),
  signer            TEXT        NOT NULL CHECK (signer ~ '^0x[0-9a-f]{64}$'),
  signature_scheme  TEXT        NOT NULL DEFAULT 'SIGNATURE_SCHEME_ED25519',
  hub_url           TEXT        NOT NULL,
  observed_at       TIMESTAMPTZ NOT NULL,
  inserted_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (cast_hash, signer)
);

CREATE INDEX IF NOT EXISTS idx_cast_signer_provenance_fid_signer
  ON public.cast_signer_provenance (fid, signer);

-- 2. Last known authority of ONE (FID, signer key) pair, with the on-chain
--    event it rests on. One row per key, so signer A's removal can never
--    suppress signer B on the same FID. 'unknown' keeps a key out of
--    current-authority context; it is not a revocation.
CREATE TABLE IF NOT EXISTS public.farcaster_signer_authority (
  fid              BIGINT      NOT NULL CHECK (fid > 0),
  signer           TEXT        NOT NULL CHECK (signer ~ '^0x[0-9a-f]{64}$'),
  status           TEXT        NOT NULL CHECK (status IN ('active', 'removed', 'unknown')),
  reason           TEXT        NOT NULL,
  event_chain_id   INTEGER,
  event_block      BIGINT,
  event_log_index  INTEGER,
  event_tx         TEXT,
  hub_url          TEXT        NOT NULL,
  checked_at       TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (fid, signer)
);

-- 3. Server-side only. RLS on with NO policies: anon and authenticated
--    clients can neither read nor write; only the service role (server
--    routes) can. Unlike channel_casts, these are not publicly readable.
ALTER TABLE public.cast_signer_provenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farcaster_signer_authority ENABLE ROW LEVEL SECURITY;
