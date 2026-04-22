-- ============================================================================
-- ZAOstock Suggestion Box
-- ============================================================================
-- Public suggestion submission. Zaal moderates (can delete any row).
-- Everyone can read; team can action and credit the contributor.
-- ============================================================================

CREATE TABLE IF NOT EXISTS stock_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT DEFAULT '',
  contact TEXT DEFAULT '',
  suggestion TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewing','actioned','wontfix','archived')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE stock_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON stock_suggestions;
CREATE POLICY "Service role full access" ON stock_suggestions FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE stock_suggestions IS
  'Public suggestion box. Anyone can submit via /stock/suggest. Zaal moderates via the dashboard Suggestions tab.';
COMMENT ON COLUMN stock_suggestions.status IS
  'Triage: new (fresh submit), reviewing (team looking at it), actioned (done), wontfix, archived.';
