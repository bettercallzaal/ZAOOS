-- ============================================================
-- ZABAL Live Hub -> ZAO OS Rollup Migration
-- Date: 2026-05-18
-- Spec: docs/superpowers/specs/2026-05-17-zabal-zaoos-rollup-design.md
-- Research: research/infrastructure/665-zabal-haatz-voting-rollup-decision/
--
-- Adds 9 tables to ZAO OS Supabase (zabal_ prefix to avoid clash with
-- existing ZAO OS proposal/library/music vote tables).
--   6 migrated from zabal.art Supabase (votes, leaderboard_scores,
--   vote_power_cache, custom_leaderboards, custom_leaderboard_entries,
--   vote_comments).
--   3 new for Member Spotlight (spotlight_nominations, spotlight_votes,
--   spotlight_winners).
--
-- Vote modes renamed: Studio/Market/Social/Battle -> Music/Governance/Events/Build
-- Voting cadence preserved: weekly Mon-Sun in America/New_York.
--
-- Idempotent (CREATE IF NOT EXISTS). Run in Supabase SQL Editor.
-- ============================================================

-- Require uuid_generate_v4 (Supabase has this by default via pgcrypto/uuid-ossp)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Section 1: Core voting tables (migrated, zabal_-prefixed)
-- ============================================================

CREATE TABLE IF NOT EXISTS zabal_votes (
  id           BIGSERIAL PRIMARY KEY,
  fid          INTEGER NOT NULL,
  username     TEXT,
  mode         TEXT NOT NULL CHECK (mode IN ('music', 'governance', 'events', 'build')),
  vote_power   INTEGER NOT NULL DEFAULT 1,
  vote_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  voted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zabal_votes_fid       ON zabal_votes(fid);
CREATE INDEX IF NOT EXISTS idx_zabal_votes_voted_at  ON zabal_votes(voted_at DESC);
CREATE INDEX IF NOT EXISTS idx_zabal_votes_mode      ON zabal_votes(mode);

-- One vote per week per user (Mon-Sun in NYC)
CREATE UNIQUE INDEX IF NOT EXISTS idx_zabal_votes_fid_week ON zabal_votes (
  fid,
  (DATE_TRUNC('week', voted_at AT TIME ZONE 'America/New_York')::DATE + INTERVAL '1 day')
);

CREATE TABLE IF NOT EXISTS zabal_vote_power_cache (
  fid          INTEGER PRIMARY KEY,
  username     TEXT,
  vote_power   INTEGER NOT NULL DEFAULT 1,
  zao_casts    INTEGER DEFAULT 0,
  neynar_score NUMERIC(4,3) DEFAULT 0.500,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zabal_vote_power_cache_updated ON zabal_vote_power_cache(updated_at DESC);

CREATE TABLE IF NOT EXISTS zabal_leaderboard_scores (
  fid             INTEGER PRIMARY KEY,
  username        TEXT,
  total_votes     INTEGER NOT NULL DEFAULT 0,
  last_vote_date  DATE,
  streak_days     INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zabal_leaderboard_total  ON zabal_leaderboard_scores(total_votes DESC);
CREATE INDEX IF NOT EXISTS idx_zabal_leaderboard_streak ON zabal_leaderboard_scores(streak_days DESC);

-- ============================================================
-- Section 2: Vote comments (migrated)
-- ============================================================

CREATE TABLE IF NOT EXISTS zabal_vote_comments (
  id          BIGSERIAL PRIMARY KEY,
  fid         INTEGER NOT NULL,
  username    TEXT NOT NULL,
  comment     TEXT NOT NULL CHECK (LENGTH(comment) <= 500),
  vote_mode   TEXT NOT NULL CHECK (vote_mode IN ('music', 'governance', 'events', 'build')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zabal_vote_comments_fid        ON zabal_vote_comments(fid);
CREATE INDEX IF NOT EXISTS idx_zabal_vote_comments_created_at ON zabal_vote_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_zabal_vote_comments_mode       ON zabal_vote_comments(vote_mode);

-- ============================================================
-- Section 3: Custom leaderboards (migrated, kept for parity;
-- audit usage 30d post-cutover per spec Open Questions)
-- ============================================================

CREATE TABLE IF NOT EXISTS zabal_custom_leaderboards (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             VARCHAR(50) NOT NULL,
  description      VARCHAR(200) NOT NULL,
  empire_address   TEXT NOT NULL,
  metric_type      TEXT NOT NULL CHECK (metric_type IN ('votes', 'holdings', 'activity', 'custom')),
  icon_url         TEXT,
  api_endpoint     TEXT,
  scoring_rules    JSONB DEFAULT '{}',
  reset_frequency  TEXT NOT NULL DEFAULT 'never' CHECK (reset_frequency IN ('never', 'daily', 'weekly', 'monthly')),
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zabal_custom_lb_empire ON zabal_custom_leaderboards(empire_address);
CREATE INDEX IF NOT EXISTS idx_zabal_custom_lb_active ON zabal_custom_leaderboards(is_active);

CREATE TABLE IF NOT EXISTS zabal_custom_leaderboard_entries (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leaderboard_id UUID NOT NULL REFERENCES zabal_custom_leaderboards(id) ON DELETE CASCADE,
  fid            INTEGER NOT NULL,
  username       TEXT,
  address        TEXT,
  score          NUMERIC NOT NULL DEFAULT 0,
  metadata       JSONB DEFAULT '{}',
  last_updated   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (leaderboard_id, fid)
);

CREATE INDEX IF NOT EXISTS idx_zabal_custom_entries_lb       ON zabal_custom_leaderboard_entries(leaderboard_id);
CREATE INDEX IF NOT EXISTS idx_zabal_custom_entries_score    ON zabal_custom_leaderboard_entries(leaderboard_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_zabal_custom_entries_fid      ON zabal_custom_leaderboard_entries(fid);

-- ============================================================
-- Section 4: Member Spotlight (NEW)
-- Phase 1 nominate (Mon-Wed), Phase 2 vote (Thu-Sun), Phase 3 winner (Sun midnight).
-- ============================================================

CREATE TABLE IF NOT EXISTS zabal_spotlight_nominations (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week           DATE NOT NULL,            -- Monday of nomination week
  nominator_fid  INTEGER NOT NULL,
  nominee_fid    INTEGER NOT NULL,
  reason         TEXT CHECK (LENGTH(reason) <= 280),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (nominator_fid != nominee_fid),
  UNIQUE (week, nominator_fid, nominee_fid)
);

CREATE INDEX IF NOT EXISTS idx_zabal_spotlight_nom_week    ON zabal_spotlight_nominations(week DESC);
CREATE INDEX IF NOT EXISTS idx_zabal_spotlight_nom_nominee ON zabal_spotlight_nominations(week, nominee_fid);

CREATE TABLE IF NOT EXISTS zabal_spotlight_votes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week         DATE NOT NULL,
  voter_fid    INTEGER NOT NULL,
  nominee_fid  INTEGER NOT NULL,
  vote_power   INTEGER NOT NULL DEFAULT 1,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (week, voter_fid)                  -- one spotlight vote per voter per week
);

CREATE INDEX IF NOT EXISTS idx_zabal_spotlight_vote_week    ON zabal_spotlight_votes(week DESC);
CREATE INDEX IF NOT EXISTS idx_zabal_spotlight_vote_nominee ON zabal_spotlight_votes(week, nominee_fid);

CREATE TABLE IF NOT EXISTS zabal_spotlight_winners (
  week             DATE PRIMARY KEY,
  winner_fid       INTEGER NOT NULL,
  winner_username  TEXT,
  vote_count       INTEGER NOT NULL,
  computed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Section 5: Functions
-- ============================================================

-- Return the Monday (in America/New_York) of the current voting week
CREATE OR REPLACE FUNCTION get_current_zabal_voting_week()
RETURNS DATE
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN DATE_TRUNC('week', CURRENT_DATE AT TIME ZONE 'America/New_York')::DATE + INTERVAL '1 day';
END;
$$;

-- Upsert a weekly focus vote (replaces previous if user already voted this week)
CREATE OR REPLACE FUNCTION upsert_zabal_weekly_vote(
  p_fid  INTEGER,
  p_mode TEXT
)
RETURNS TABLE (
  previous_mode TEXT,
  new_mode      TEXT,
  changed       BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_week          DATE;
  v_username      TEXT;
  v_vote_power    INTEGER;
  v_previous_mode TEXT;
BEGIN
  v_week := get_current_zabal_voting_week();

  SELECT username, vote_power
    INTO v_username, v_vote_power
    FROM zabal_vote_power_cache
   WHERE fid = p_fid;

  IF v_vote_power IS NULL THEN
    v_vote_power := 1;
  END IF;

  SELECT mode INTO v_previous_mode
    FROM zabal_votes
   WHERE fid = p_fid
     AND voted_at >= v_week
     AND voted_at <  v_week + INTERVAL '7 days'
   ORDER BY voted_at DESC
   LIMIT 1;

  DELETE FROM zabal_votes
   WHERE fid = p_fid
     AND voted_at >= v_week
     AND voted_at <  v_week + INTERVAL '7 days';

  INSERT INTO zabal_votes (fid, username, mode, vote_power, vote_date, voted_at)
  VALUES (p_fid, v_username, p_mode, v_vote_power, CURRENT_DATE, NOW());

  RETURN QUERY
    SELECT v_previous_mode,
           p_mode,
           (v_previous_mode IS NULL OR v_previous_mode != p_mode);
END;
$$;

-- Has this user voted in the current focus week?
CREATE OR REPLACE FUNCTION has_voted_this_zabal_week(p_fid INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_week DATE;
  v_cnt  INTEGER;
BEGIN
  v_week := get_current_zabal_voting_week();
  SELECT COUNT(*) INTO v_cnt
    FROM zabal_votes
   WHERE fid = p_fid
     AND voted_at >= v_week
     AND voted_at <  v_week + INTERVAL '7 days';
  RETURN v_cnt > 0;
END;
$$;

-- Current week's focus vote totals
CREATE OR REPLACE FUNCTION get_this_zabal_weeks_votes()
RETURNS TABLE (
  mode        TEXT,
  vote_count  BIGINT,
  total_power BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_week DATE;
BEGIN
  v_week := get_current_zabal_voting_week();
  RETURN QUERY
    SELECT v.mode,
           COUNT(*)::BIGINT,
           COALESCE(SUM(v.vote_power), 0)::BIGINT
      FROM zabal_votes v
     WHERE v.voted_at >= v_week
       AND v.voted_at <  v_week + INTERVAL '7 days'
     GROUP BY v.mode
     ORDER BY 3 DESC;
END;
$$;

-- Update zabal_leaderboard_scores after each vote (weekly streak math)
CREATE OR REPLACE FUNCTION update_zabal_leaderboard_score()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_votes  INTEGER;
  v_streak_weeks INTEGER;
  v_last_date    DATE;
BEGIN
  -- Total = distinct weeks voted in
  SELECT COUNT(DISTINCT DATE_TRUNC('week', voted_at AT TIME ZONE 'America/New_York')::DATE + INTERVAL '1 day')
    INTO v_total_votes
    FROM zabal_votes
   WHERE fid = NEW.fid;

  -- Streak = consecutive weeks ending at most recent vote
  WITH RECURSIVE week_series AS (
    SELECT DATE_TRUNC('week', MAX(voted_at) AT TIME ZONE 'America/New_York')::DATE + INTERVAL '1 day' AS week_start,
           0 AS weeks_back
      FROM zabal_votes
     WHERE fid = NEW.fid
    UNION ALL
    SELECT week_start - INTERVAL '7 days',
           weeks_back + 1
      FROM week_series
     WHERE weeks_back < 52
       AND EXISTS (
         SELECT 1 FROM zabal_votes
          WHERE fid = NEW.fid
            AND voted_at >= week_start - INTERVAL '7 days'
            AND voted_at <  week_start
       )
  )
  SELECT COALESCE(MAX(weeks_back) + 1, 1)
    INTO v_streak_weeks
    FROM week_series;

  SELECT MAX(voted_at::DATE) INTO v_last_date FROM zabal_votes WHERE fid = NEW.fid;

  INSERT INTO zabal_leaderboard_scores (fid, username, total_votes, streak_days, last_vote_date)
  VALUES (NEW.fid, NEW.username, v_total_votes, v_streak_weeks, v_last_date)
  ON CONFLICT (fid) DO UPDATE SET
    username       = EXCLUDED.username,
    total_votes    = EXCLUDED.total_votes,
    streak_days    = EXCLUDED.streak_days,
    last_vote_date = EXCLUDED.last_vote_date,
    updated_at     = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_zabal_leaderboard ON zabal_votes;
CREATE TRIGGER trigger_update_zabal_leaderboard
AFTER INSERT ON zabal_votes
FOR EACH ROW
EXECUTE FUNCTION update_zabal_leaderboard_score();

-- Top-N leaderboard
CREATE OR REPLACE FUNCTION get_zabal_leaderboard(p_limit INTEGER DEFAULT 100)
RETURNS TABLE (
  rank        BIGINT,
  fid         INTEGER,
  username    TEXT,
  score       INTEGER,
  streak      INTEGER,
  last_vote   DATE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
    SELECT ROW_NUMBER() OVER (ORDER BY ls.total_votes DESC, ls.streak_days DESC),
           ls.fid,
           ls.username,
           ls.total_votes,
           ls.streak_days,
           ls.last_vote_date
      FROM zabal_leaderboard_scores ls
     ORDER BY ls.total_votes DESC, ls.streak_days DESC
     LIMIT p_limit;
END;
$$;

-- ============================================================
-- Section 6: Spotlight functions
-- ============================================================

-- Top-N spotlight nominees for the current week
CREATE OR REPLACE FUNCTION get_zabal_spotlight_nominees(p_limit INTEGER DEFAULT 8)
RETURNS TABLE (
  nominee_fid       INTEGER,
  nomination_count  BIGINT,
  reasons           TEXT[]
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_week DATE;
BEGIN
  v_week := get_current_zabal_voting_week();
  RETURN QUERY
    SELECT n.nominee_fid,
           COUNT(*)::BIGINT AS nomination_count,
           ARRAY_AGG(n.reason) FILTER (WHERE n.reason IS NOT NULL) AS reasons
      FROM zabal_spotlight_nominations n
     WHERE n.week = v_week
     GROUP BY n.nominee_fid
     ORDER BY nomination_count DESC
     LIMIT p_limit;
END;
$$;

-- Compute spotlight winner for a given week (idempotent; Sunday midnight cron)
CREATE OR REPLACE FUNCTION compute_zabal_spotlight_winner(p_week DATE)
RETURNS TABLE (
  winner_fid       INTEGER,
  winner_username  TEXT,
  vote_count       INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_winner_fid       INTEGER;
  v_winner_username  TEXT;
  v_vote_count       INTEGER;
BEGIN
  -- Aggregate spotlight votes weighted by vote_power
  SELECT sv.nominee_fid,
         SUM(sv.vote_power)::INTEGER
    INTO v_winner_fid, v_vote_count
    FROM zabal_spotlight_votes sv
   WHERE sv.week = p_week
   GROUP BY sv.nominee_fid
   ORDER BY SUM(sv.vote_power) DESC, sv.nominee_fid ASC  -- deterministic tiebreak
   LIMIT 1;

  IF v_winner_fid IS NULL THEN
    RETURN; -- no votes that week, no winner
  END IF;

  -- Resolve username from vote_power_cache if available
  SELECT username INTO v_winner_username FROM zabal_vote_power_cache WHERE fid = v_winner_fid;

  INSERT INTO zabal_spotlight_winners (week, winner_fid, winner_username, vote_count, computed_at)
  VALUES (p_week, v_winner_fid, v_winner_username, v_vote_count, NOW())
  ON CONFLICT (week) DO UPDATE SET
    winner_fid      = EXCLUDED.winner_fid,
    winner_username = EXCLUDED.winner_username,
    vote_count      = EXCLUDED.vote_count,
    computed_at     = NOW();

  RETURN QUERY
    SELECT v_winner_fid, v_winner_username, v_vote_count;
END;
$$;

-- Cumulative spotlight winners (for Empire Builder feed)
CREATE OR REPLACE FUNCTION get_zabal_spotlight_leaderboard(p_limit INTEGER DEFAULT 100)
RETURNS TABLE (
  fid          INTEGER,
  username     TEXT,
  wins         BIGINT,
  total_votes  BIGINT,
  last_win     DATE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
    SELECT w.winner_fid,
           MAX(w.winner_username),
           COUNT(*)::BIGINT      AS wins,
           SUM(w.vote_count)::BIGINT,
           MAX(w.week)            AS last_win
      FROM zabal_spotlight_winners w
     GROUP BY w.winner_fid
     ORDER BY wins DESC, total_votes DESC
     LIMIT p_limit;
END;
$$;

-- ============================================================
-- Section 7: RLS (public read, system writes via service role / SECURITY DEFINER)
-- ============================================================

ALTER TABLE zabal_votes                          ENABLE ROW LEVEL SECURITY;
ALTER TABLE zabal_vote_power_cache               ENABLE ROW LEVEL SECURITY;
ALTER TABLE zabal_leaderboard_scores             ENABLE ROW LEVEL SECURITY;
ALTER TABLE zabal_vote_comments                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE zabal_custom_leaderboards            ENABLE ROW LEVEL SECURITY;
ALTER TABLE zabal_custom_leaderboard_entries     ENABLE ROW LEVEL SECURITY;
ALTER TABLE zabal_spotlight_nominations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE zabal_spotlight_votes                ENABLE ROW LEVEL SECURITY;
ALTER TABLE zabal_spotlight_winners              ENABLE ROW LEVEL SECURITY;

-- Public reads on everything
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'zabal_votes','zabal_vote_power_cache','zabal_leaderboard_scores',
    'zabal_vote_comments','zabal_custom_leaderboards','zabal_custom_leaderboard_entries',
    'zabal_spotlight_nominations','zabal_spotlight_votes','zabal_spotlight_winners'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%I read public" ON %I', t, t);
    EXECUTE format('CREATE POLICY "%I read public" ON %I FOR SELECT USING (true)', t, t);
  END LOOP;
END $$;

-- Writes go through API routes with service role key; allow anon writes only if explicitly needed
-- For now: API routes use service role, so anon writes blocked. (Service role bypasses RLS.)

-- ============================================================
-- Section 8: Grants
-- ============================================================

GRANT EXECUTE ON FUNCTION get_current_zabal_voting_week()                  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION upsert_zabal_weekly_vote(INTEGER, TEXT)          TO authenticated;
GRANT EXECUTE ON FUNCTION has_voted_this_zabal_week(INTEGER)               TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_this_zabal_weeks_votes()                     TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_zabal_leaderboard(INTEGER)                   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_zabal_spotlight_nominees(INTEGER)            TO anon, authenticated;
GRANT EXECUTE ON FUNCTION compute_zabal_spotlight_winner(DATE)             TO authenticated;
GRANT EXECUTE ON FUNCTION get_zabal_spotlight_leaderboard(INTEGER)         TO anon, authenticated;

-- ============================================================
-- Done.
-- Next: run scripts/zabal-rollup-backfill.mjs to import existing
-- zabal.art rows. Verify row counts match before flipping DNS.
-- ============================================================
