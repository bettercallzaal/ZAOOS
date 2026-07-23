-- ============================================================================
-- repo_improvements: findings + decisions for the ZOE repo-improver scout
-- ============================================================================
-- A cheap OpenRouter scout audits ZAO repos and proposes improvements here.
-- ZOE reviews each with its OWN judgment (its yes/no), logs the reasoning, and
-- on approve routes the fix through the Hermes pipeline. This table is also the
-- LEARNING LOG - every {finding, decision, reasoning, outcome} accumulates so
-- ZOE can learn what is worth acting on. See bot/src/zoe/repo-improver.ts.
--
-- SAFE: CREATE TABLE IF NOT EXISTS only. Service-role RLS (scout + ZOE).
-- APPLY ONLY VIA SUPABASE. DO NOT apply to production until Zaal approves.
-- Reviewed-by: Zaal (gated before apply)
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS repo_improvements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  repo TEXT NOT NULL,
  hermes_target TEXT,           -- null => no auto-fix target (manual follow-up)

  -- The scout's proposed finding.
  area TEXT NOT NULL,
  problem TEXT NOT NULL,
  proposed_fix TEXT NOT NULL,
  files TEXT[] NOT NULL DEFAULT '{}',
  risk TEXT NOT NULL CHECK (risk = ANY (ARRAY['low','medium','high'])),
  confidence TEXT NOT NULL CHECK (confidence = ANY (ARRAY['low','medium','high'])),
  model TEXT,                   -- the cheap model that produced the finding

  -- ZOE's self-gate decision + the learning trail.
  status TEXT NOT NULL DEFAULT 'proposed'
    CHECK (status = ANY (ARRAY['proposed','rejected','fixing','fixed','escalated'])),
  zoe_reasoning TEXT,           -- ZOE's own yes/no reasoning (learn from this)
  pr_url TEXT,
  run_id UUID,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ZOE's review scan: proposed findings first.
CREATE INDEX IF NOT EXISTS repo_improvements_status_idx ON repo_improvements (status, created_at);
-- Learning queries: "what did ZOE decide for this repo/area over time".
CREATE INDEX IF NOT EXISTS repo_improvements_repo_idx ON repo_improvements (repo, created_at DESC);

ALTER TABLE repo_improvements ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='repo_improvements' AND policyname='repo_improvements_service_role'
  ) THEN
    CREATE POLICY repo_improvements_service_role ON repo_improvements
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

COMMIT;

-- Rotation marker (which repo the scout audits next) lives in ~/.zao/zoe/
-- as a small file, not the DB - no table needed for it.
