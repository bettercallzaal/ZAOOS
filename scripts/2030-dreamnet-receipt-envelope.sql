-- ============================================================================
-- DreamNet Receipt Envelope: persist portable proof on the receipts table
-- ============================================================================
-- ADDITIVE MIGRATION: adds columns so ZAO's Spine can persist a full
-- dreamnet.receipt.v1 envelope (Brandon's DreamNet Public Core contract,
-- Apache-2.0) alongside each receipt - making our receipts provable OUTSIDE
-- our own database. See research doc 2030.
--
-- This migration is SAFE: ADD COLUMN IF NOT EXISTS only, all nullable. No
-- rewrite of existing rows, no constraint that could reject current data.
--
-- APPLY ONLY VIA SUPABASE: Supabase SQL editor or a managed branch.
-- DO NOT apply to production until Zaal approves.
-- Reviewed-by: Zaal (gated before apply)
-- ============================================================================

BEGIN;

-- content_sha256: integrity hash over the canonical envelope (tamper-evidence).
-- 64-char lowercase hex. Nullable so pre-migration receipts stay valid.
ALTER TABLE receipts
  ADD COLUMN IF NOT EXISTS content_sha256 TEXT;

-- dreamnet_envelope: the full dreamnet.receipt.v1 object, as emitted by
-- bot/src/zoe/receipt-envelope.ts buildReceiptEnvelope(). jsonb for querying.
ALTER TABLE receipts
  ADD COLUMN IF NOT EXISTS dreamnet_envelope JSONB;

-- Optional integrity check: when present, content_sha256 must be 64-hex.
-- Guarded so it is only added once (no IF NOT EXISTS for constraints in PG).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'receipts_content_sha256_hex'
  ) THEN
    ALTER TABLE receipts
      ADD CONSTRAINT receipts_content_sha256_hex
      CHECK (content_sha256 IS NULL OR content_sha256 ~ '^[a-f0-9]{64}$');
  END IF;
END $$;

-- Replay dedup: input_digest already holds a stable action-identity digest
-- (set app-side in emitReceipt as of doc 2030). A UNIQUE index turns "detect"
-- into "prevent". Partial (WHERE input_digest IS NOT NULL) so legacy null-digest
-- rows are unaffected. Uncomment to ENFORCE dedup once app-side is confirmed
-- clean of intentional duplicates:
--
-- CREATE UNIQUE INDEX IF NOT EXISTS receipts_run_input_digest_uniq
--   ON receipts (run_id, input_digest)
--   WHERE input_digest IS NOT NULL;

COMMIT;

-- ============================================================================
-- POST-APPLY (code, separate PR): update emitReceipt to also write
-- content_sha256 + dreamnet_envelope from buildReceiptEnvelope(). Until then,
-- the envelope is computed on demand from the existing columns and this
-- migration is inert - safe to apply early.
-- ============================================================================
