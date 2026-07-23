-- ============================================================================
-- app_errors: the ingest rail for ZOE's autonomous error-remediation loop
-- ============================================================================
-- Today ZOE is blind to production errors until Zaal notices and pastes a
-- screenshot. This table is the front door: the app's onRequestError handler
-- upserts a deduped digest per unique failure, and ZOE polls status='new',
-- routes a fix (Hermes coder + critic + auto-PR), and reports the outcome.
-- See feedback_zoe_route_dont_ask + research doc 2030 (receipts).
--
-- SAFE: CREATE TABLE IF NOT EXISTS only, no alter to existing tables. RLS
-- matches repo convention (service-role writes; the app's server handler and
-- ZOE both use the service role).
--
-- APPLY ONLY VIA SUPABASE: Supabase SQL editor or a managed branch.
-- DO NOT apply to production until Zaal approves.
-- Reviewed-by: Zaal (gated before apply)
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS app_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The reference code shown to the user in the error boundary (e.g. 1463886943).
  ref_code TEXT,

  -- Which repo owns the throw. Maps to a Hermes fix target.
  repo TEXT NOT NULL DEFAULT 'zaocowork'
    CHECK (repo = ANY (ARRAY['zaoos','zaostock','zaocowork'])),

  -- Where it happened + optional brand context (the board renders per brand).
  route TEXT,
  brand TEXT,

  message TEXT NOT NULL,
  stack TEXT,

  -- Dedup key: a hash of the NORMALIZED stack (line numbers / ids stripped).
  -- One bug = one row; repeat occurrences bump count instead of adding rows.
  stack_hash TEXT NOT NULL,

  count INTEGER NOT NULL DEFAULT 1,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Remediation lifecycle:
  --   new       -> just captured, awaiting ZOE
  --   fixing    -> ZOE claimed it, fix pipeline running
  --   fixed     -> a PR is open (or merged) - pr_url set
  --   escalated -> needs Zaal (big build / pipeline could not fix)
  --   ignored   -> known-noise, do not act (e.g. extension chatter)
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status = ANY (ARRAY['new','fixing','fixed','escalated','ignored'])),

  pr_url TEXT,
  run_id UUID,           -- link to the Hermes/agent run that fixed it
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per unique bug. The app-side handler upserts on stack_hash.
CREATE UNIQUE INDEX IF NOT EXISTS app_errors_stack_hash_uniq ON app_errors (stack_hash);

-- ZOE's poll: new errors, highest-count first.
CREATE INDEX IF NOT EXISTS app_errors_status_count_idx ON app_errors (status, count DESC);

ALTER TABLE app_errors ENABLE ROW LEVEL SECURITY;

-- Service-role only (the app server handler + ZOE). No anon access.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='app_errors' AND policyname='app_errors_service_role'
  ) THEN
    CREATE POLICY app_errors_service_role ON app_errors
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- COMPANION (cowork repo, separate PR): the app's instrumentation onRequestError
-- upserts here. Reference snippet (server-side, service-role client):
--
--   const stackHash = sha256(normalizeStack(error.stack));   -- strip line/col + ids
--   await supabase.from('app_errors').upsert({
--     ref_code, repo: 'zaocowork', route, brand, message: error.message,
--     stack: error.stack, stack_hash: stackHash, last_seen: new Date().toISOString(),
--   }, { onConflict: 'stack_hash', ignoreDuplicates: false });
--   -- then: increment count via an RPC or a follow-up update where stack_hash matches.
--
-- Until that ships, rows can be inserted manually to exercise the ZOE poller.
-- ============================================================================
