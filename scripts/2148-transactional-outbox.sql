-- ============================================================================
-- Transactional Outbox: durable idempotent side-effect protocol
-- ============================================================================
-- ADDITIVE MIGRATION: creates effect_intents + outbox_dispatch_log for the
-- crash-safe at-most-once delivery of every outbound side effect (Telegram /
-- Farcaster / mail / on-chain). Design: research/agents/2145-transactional-outbox-design.
--
-- This migration is SAFE: CREATE TABLE IF NOT EXISTS only, no alter to existing
-- tables. RLS = service-role-only writes (matches agent_runs / cowork model).
--
-- APPLY ONLY VIA SUPABASE (SQL editor or a managed branch). Reviewed-by: Zaal.
-- ============================================================================

BEGIN;

-- ============================================================================
-- TABLE: effect_intents
-- ============================================================================
-- The durable intent ledger. The PRIMARY KEY (run_id, effect_key) IS the
-- at-most-once lock: `INSERT ... ON CONFLICT DO NOTHING` is the atomic
-- "claim once". A retry recomputes the same deterministic effect_key and
-- collides, so the effect fires exactly once even across process crashes.
--
-- state lifecycle:
--   intent -> dispatched -> committed
--   intent | dispatched -> abandoned (reconciler, past the attempt ceiling)
--   committed and abandoned are terminal; the row never moves backward once
--   committed (monotonic - see the CHECK-driven update guards in code).
CREATE TABLE IF NOT EXISTS effect_intents (
  run_id            UUID NOT NULL,
  effect_key        TEXT NOT NULL,
  state             TEXT NOT NULL DEFAULT 'intent'
                      CHECK (state IN ('intent', 'dispatched', 'committed', 'abandoned')),
  channel           TEXT NOT NULL
                      CHECK (channel IN ('telegram', 'farcaster', 'mail', 'onchain', 'internal')),
  payload_digest    TEXT NOT NULL,        -- sha256:dreamnet-sorted-json:v0 over the payload
  fence_owner       TEXT,                 -- instance that claimed the dispatch
  fence_expires_at  TIMESTAMPTZ,
  external_ref      JSONB,                -- message_id / cast hash / tx hash (evidence)
  attempts          INT NOT NULL DEFAULT 0,
  last_error        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  committed_at      TIMESTAMPTZ,
  PRIMARY KEY (run_id, effect_key)
);

-- Reconciler scan: dispatched rows whose fence has expired (crash window).
CREATE INDEX IF NOT EXISTS idx_effect_intents_reconcile
  ON effect_intents (state, fence_expires_at)
  WHERE state = 'dispatched';

-- Per-run lookups.
CREATE INDEX IF NOT EXISTS idx_effect_intents_run ON effect_intents (run_id);

-- ============================================================================
-- TABLE: outbox_dispatch_log
-- ============================================================================
-- Append-only audit of every physical send ATTEMPT, for replay/debugging.
-- Distinct from effect_intents (which holds the current state): this is the
-- history. One row per attempt/outcome.
CREATE TABLE IF NOT EXISTS outbox_dispatch_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id       UUID NOT NULL,
  effect_key   TEXT NOT NULL,
  attempt      INT NOT NULL,
  outcome      TEXT NOT NULL
                 CHECK (outcome IN ('claimed', 'sent', 'failed', 'deduped', 'reconciled', 'abandoned')),
  at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  detail       JSONB
);

CREATE INDEX IF NOT EXISTS idx_outbox_log_effect ON outbox_dispatch_log (run_id, effect_key);

-- ============================================================================
-- RLS: service-role-only (matches agent_runs / cowork board)
-- ============================================================================
ALTER TABLE effect_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbox_dispatch_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "effect_intents_service_role_all" ON effect_intents;
CREATE POLICY "effect_intents_service_role_all" ON effect_intents
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "outbox_dispatch_log_service_role_all" ON outbox_dispatch_log;
CREATE POLICY "outbox_dispatch_log_service_role_all" ON outbox_dispatch_log
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

COMMENT ON TABLE effect_intents IS 'Durable at-most-once ledger for outbound side effects. PK (run_id, effect_key) is the idempotency lock; INSERT ON CONFLICT DO NOTHING = atomic claim. Design: doc 2145.';
COMMENT ON COLUMN effect_intents.effect_key IS 'Deterministic business identity: channel + sha256(canonical(identity)). NEVER a timestamp/uuid - a retry must recompute the same key.';
COMMENT ON COLUMN effect_intents.external_ref IS 'Evidence of the committed send: telegram message_id, farcaster cast hash, tx hash. Written in the same statement that flips state to committed.';
COMMENT ON TABLE outbox_dispatch_log IS 'Append-only history of every physical send attempt (audit/replay). effect_intents holds current state; this holds the trail.';

COMMIT;

-- ============================================================================
-- VERIFICATION (run after applying)
-- ============================================================================
-- SELECT tablename FROM pg_tables WHERE tablename IN ('effect_intents','outbox_dispatch_log');
-- -- expect 2 rows
-- SELECT indexname FROM pg_indexes WHERE tablename = 'effect_intents';
-- -- expect the reconcile + run indexes
