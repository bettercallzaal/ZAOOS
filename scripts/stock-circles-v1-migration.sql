-- ============================================================================
-- ZAOstock Circles v1 Migration - Governance Model (Doc 502)
-- ============================================================================
-- Replaces role + scope hierarchy with flat circles model. Backward-compatible:
-- legacy role + scope columns preserved but deprecated. Service role full access.
--
-- Idempotent. Safe to re-run. Paste into Supabase SQL Editor.
-- Spec: /research/governance/502-zaostock-circles-v1-spec/README.md
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. stock_circles - Circle definitions
-- ============================================================================
CREATE TABLE IF NOT EXISTS stock_circles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  coordinator_member_id UUID REFERENCES stock_team_members(id) ON DELETE SET NULL,
  coordinator_rotation_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stock_circles_slug_idx ON stock_circles(slug);
CREATE INDEX IF NOT EXISTS stock_circles_coordinator_idx ON stock_circles(coordinator_member_id);

-- ============================================================================
-- 2. stock_circle_members - Membership join table (many-to-many)
-- ============================================================================
CREATE TABLE IF NOT EXISTS stock_circle_members (
  member_id UUID NOT NULL REFERENCES stock_team_members(id) ON DELETE CASCADE,
  circle_id UUID NOT NULL REFERENCES stock_circles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (member_id, circle_id),
  UNIQUE(member_id, circle_id)
);

CREATE INDEX IF NOT EXISTS stock_circle_members_circle_idx ON stock_circle_members(circle_id);
CREATE INDEX IF NOT EXISTS stock_circle_members_member_idx ON stock_circle_members(member_id);

-- ============================================================================
-- 3. stock_proposals - Consent decisions (optional, strategy track)
-- ============================================================================
CREATE TABLE IF NOT EXISTS stock_proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proposer_member_id UUID NOT NULL REFERENCES stock_team_members(id) ON DELETE RESTRICT,
  circle_id UUID REFERENCES stock_circles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','open','consenting','passed','blocked','withdrawn')),
  opened_at TIMESTAMPTZ,
  consent_window_ends_at TIMESTAMPTZ,
  decided_at TIMESTAMPTZ,
  outcome TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stock_proposals_status_idx ON stock_proposals(status);
CREATE INDEX IF NOT EXISTS stock_proposals_circle_idx ON stock_proposals(circle_id);
CREATE INDEX IF NOT EXISTS stock_proposals_proposer_idx ON stock_proposals(proposer_member_id);
CREATE INDEX IF NOT EXISTS stock_proposals_opened_idx ON stock_proposals(opened_at);

-- ============================================================================
-- 4. stock_proposal_objections - Consent window objections (48h silent = yes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS stock_proposal_objections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL REFERENCES stock_proposals(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES stock_team_members(id) ON DELETE RESTRICT,
  reason TEXT NOT NULL,
  raised_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(proposal_id, member_id)
);

CREATE INDEX IF NOT EXISTS stock_proposal_objections_proposal_idx ON stock_proposal_objections(proposal_id);
CREATE INDEX IF NOT EXISTS stock_proposal_objections_member_idx ON stock_proposal_objections(member_id);

-- ============================================================================
-- 5. stock_respect_events - Peer-ranked contribution tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS stock_respect_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  awarded_to UUID NOT NULL REFERENCES stock_team_members(id) ON DELETE RESTRICT,
  awarded_by UUID REFERENCES stock_team_members(id) ON DELETE SET NULL,
  amount INT NOT NULL DEFAULT 0,
  reason TEXT DEFAULT '',
  fractal_session_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stock_respect_events_awarded_to_idx ON stock_respect_events(awarded_to);
CREATE INDEX IF NOT EXISTS stock_respect_events_awarded_by_idx ON stock_respect_events(awarded_by);
CREATE INDEX IF NOT EXISTS stock_respect_events_fractal_idx ON stock_respect_events(fractal_session_id);

-- ============================================================================
-- 6. stock_buddy_pairings - Onboarding buddy pairs
-- ============================================================================
CREATE TABLE IF NOT EXISTS stock_buddy_pairings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  new_member_id UUID NOT NULL REFERENCES stock_team_members(id) ON DELETE CASCADE,
  buddy_member_id UUID NOT NULL REFERENCES stock_team_members(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  UNIQUE(new_member_id, buddy_member_id)
);

CREATE INDEX IF NOT EXISTS stock_buddy_pairings_new_member_idx ON stock_buddy_pairings(new_member_id);
CREATE INDEX IF NOT EXISTS stock_buddy_pairings_buddy_idx ON stock_buddy_pairings(buddy_member_id);

-- ============================================================================
-- 7. stock_qa_log - Questions + answers (silent-star detector)
-- ============================================================================
CREATE TABLE IF NOT EXISTS stock_qa_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id_asked UUID NOT NULL REFERENCES stock_team_members(id) ON DELETE RESTRICT,
  member_id_answered UUID REFERENCES stock_team_members(id) ON DELETE SET NULL,
  question_text TEXT NOT NULL,
  answered_at TIMESTAMPTZ,
  circle_id UUID REFERENCES stock_circles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stock_qa_log_asked_idx ON stock_qa_log(member_id_asked);
CREATE INDEX IF NOT EXISTS stock_qa_log_answered_idx ON stock_qa_log(member_id_answered);
CREATE INDEX IF NOT EXISTS stock_qa_log_circle_idx ON stock_qa_log(circle_id);
CREATE INDEX IF NOT EXISTS stock_qa_log_created_idx ON stock_qa_log(created_at DESC);

-- ============================================================================
-- 3. RLS Policies - Service role full access on all new tables
-- ============================================================================
ALTER TABLE stock_circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_proposal_objections ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_respect_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_buddy_pairings ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_qa_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON stock_circles;
CREATE POLICY "Service role full access" ON stock_circles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access" ON stock_circle_members;
CREATE POLICY "Service role full access" ON stock_circle_members FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access" ON stock_proposals;
CREATE POLICY "Service role full access" ON stock_proposals FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access" ON stock_proposal_objections;
CREATE POLICY "Service role full access" ON stock_proposal_objections FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access" ON stock_respect_events;
CREATE POLICY "Service role full access" ON stock_respect_events FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access" ON stock_buddy_pairings;
CREATE POLICY "Service role full access" ON stock_buddy_pairings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access" ON stock_qa_log;
CREATE POLICY "Service role full access" ON stock_qa_log FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- 4. Seed circles (6 base circles from spec)
-- ============================================================================
-- LOW-FRICTION ROLLOUT: Zaal is default coordinator for ALL 6 circles.
-- When someone volunteers for a circle, they take over via /link or admin SQL.
-- No rotation cadence enforced - rotation_ends_at intentionally NULL.

INSERT INTO stock_circles (slug, name, description, coordinator_member_id, coordinator_rotation_ends_at)
VALUES
  ('music', 'Music', 'Artist booking, sound, stage programming, day-of run-of-show + cues',
    (SELECT id FROM stock_team_members WHERE name = 'Zaal' LIMIT 1), NULL),
  ('ops', 'Operations', 'Site, power, tents, vendors, logistics, permits, insurance, safety, first aid, F&B',
    (SELECT id FROM stock_team_members WHERE name = 'Zaal' LIMIT 1), NULL),
  ('partners', 'Partners', 'Sponsors, local businesses, Wallace Events, Heart of Ellsworth, Art of Ellsworth',
    (SELECT id FROM stock_team_members WHERE name = 'Zaal' LIMIT 1), NULL),
  ('finance', 'Finance', 'Sponsor invoicing, vendor payments, P&L, budget tracking, merch revenue accounting',
    (SELECT id FROM stock_team_members WHERE name = 'Zaal' LIMIT 1), NULL),
  ('merch', 'Merch', 'T-shirts, posters, print design, day-of sales, inventory',
    (SELECT id FROM stock_team_members WHERE name = 'Zaal' LIMIT 1), NULL),
  ('marketing', 'Marketing', 'Socials, newsletter, local press, signage, build-in-public archive',
    (SELECT id FROM stock_team_members WHERE name = 'Zaal' LIMIT 1), NULL),
  ('media', 'Media', 'Photo, video, livestream, audio recording, day-of capture, post-fest content',
    (SELECT id FROM stock_team_members WHERE name = 'Zaal' LIMIT 1), NULL),
  ('host', 'Host', 'Artist hospitality, day-of volunteers (gates/runners/parking), guest experience',
    (SELECT id FROM stock_team_members WHERE name = 'Zaal' LIMIT 1), NULL)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  coordinator_member_id = EXCLUDED.coordinator_member_id;

-- ============================================================================
-- 5. Backfill circle memberships from current stock_team_members scopes
-- ============================================================================
-- Notes:
-- - "ops" scope maps to ops circle
-- - "music" scope maps to music circle
-- - "partners" scope maps to partners circle (if any)
-- - "marketing" scope maps to marketing circle (if any)
-- - Members with empty scope or non-matching get no auto-assignment (they pick week 1)
-- - Zaal (ops + partners + marketing per spec) added to those three circles
-- - Coordinator_member_id left NULL for week 1 self-select

WITH scope_mappings AS (
  SELECT
    stm.id as member_id,
    sc.id as circle_id
  FROM stock_team_members stm
  CROSS JOIN stock_circles sc
  WHERE stm.active IS NOT FALSE
    AND (
      (stm.scope = 'ops' AND sc.slug = 'ops')
      OR (stm.scope = 'music' AND sc.slug = 'music')
      OR (stm.scope = 'partners' AND sc.slug = 'partners')
      OR (stm.scope = 'marketing' AND sc.slug = 'marketing')
      OR (stm.name = 'Zaal' AND sc.slug IN ('ops', 'partners', 'marketing'))
    )
)
INSERT INTO stock_circle_members (member_id, circle_id, joined_at)
SELECT member_id, circle_id, now()
FROM scope_mappings
ON CONFLICT (member_id, circle_id) DO NOTHING;

-- ============================================================================
-- 6. Verification: circles + member counts + coordinator status
-- ============================================================================
SELECT
  'CIRCLES SUMMARY' AS check,
  sc.slug,
  sc.name,
  COUNT(DISTINCT scm.member_id) as member_count,
  stm.name as coordinator_name,
  sc.coordinator_rotation_ends_at
FROM stock_circles sc
LEFT JOIN stock_circle_members scm ON sc.id = scm.circle_id
LEFT JOIN stock_team_members stm ON sc.coordinator_member_id = stm.id
GROUP BY sc.id, sc.slug, sc.name, stm.name, sc.coordinator_rotation_ends_at
ORDER BY sc.created_at;

-- ============================================================================
-- 7. Detail: members by circle
-- ============================================================================
SELECT
  'MEMBERS BY CIRCLE' AS check,
  sc.name,
  stm.name,
  stm.scope as legacy_scope,
  CASE WHEN sc.coordinator_member_id = stm.id THEN 'COORDINATOR' ELSE 'member' END as role_in_circle
FROM stock_circles sc
JOIN stock_circle_members scm ON sc.id = scm.circle_id
JOIN stock_team_members stm ON scm.member_id = stm.id
ORDER BY sc.name, stm.name;

-- ============================================================================
-- 8. Verification: total counts
-- ============================================================================
SELECT
  'TABLE COUNTS' AS check,
  (SELECT COUNT(*) FROM stock_circles) as circles_count,
  (SELECT COUNT(*) FROM stock_circle_members) as memberships_count,
  (SELECT COUNT(*) FROM stock_proposals) as proposals_count,
  (SELECT COUNT(*) FROM stock_respect_events) as respect_events_count,
  (SELECT COUNT(*) FROM stock_buddy_pairings) as buddy_pairings_count,
  (SELECT COUNT(*) FROM stock_qa_log) as qa_log_count;

COMMIT;
