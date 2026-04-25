-- ============================================================================
-- stock_onepagers - DB-backed 1-pager docs (replaces ZAO-STOCK/onepagers/*.md)
-- ============================================================================
-- Bot can edit, dashboard can edit, /onepager Claude skill writes here too.
-- Idempotent. Paste into Supabase SQL Editor.

BEGIN;

CREATE TABLE IF NOT EXISTS stock_onepagers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  audience TEXT NOT NULL DEFAULT '',
  purpose TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','final','sent','archived')),
  visibility TEXT NOT NULL DEFAULT 'internal' CHECK (visibility IN ('internal','public')),
  meeting_date TEXT,
  meeting_location TEXT,
  authors TEXT,
  reviewers TEXT,
  version INT NOT NULL DEFAULT 1,
  last_edited_by UUID REFERENCES stock_team_members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stock_onepagers_status_idx ON stock_onepagers(status);
CREATE INDEX IF NOT EXISTS stock_onepagers_visibility_idx ON stock_onepagers(visibility);
CREATE INDEX IF NOT EXISTS stock_onepagers_updated_idx ON stock_onepagers(updated_at DESC);

CREATE TABLE IF NOT EXISTS stock_onepager_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  onepager_id UUID NOT NULL REFERENCES stock_onepagers(id) ON DELETE CASCADE,
  member_id UUID REFERENCES stock_team_members(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('created','edited','status_change','note','share','review_comment')),
  content TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stock_onepager_activity_pager_idx ON stock_onepager_activity(onepager_id, created_at DESC);

ALTER TABLE stock_onepagers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_onepager_activity ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access" ON stock_onepagers;
CREATE POLICY "Service role full access" ON stock_onepagers FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service role full access" ON stock_onepager_activity;
CREATE POLICY "Service role full access" ON stock_onepager_activity FOR ALL USING (true) WITH CHECK (true);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION stock_onepagers_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS stock_onepagers_updated_at_trg ON stock_onepagers;
CREATE TRIGGER stock_onepagers_updated_at_trg
  BEFORE UPDATE ON stock_onepagers
  FOR EACH ROW EXECUTE FUNCTION stock_onepagers_touch_updated_at();

-- Seed: roddy-parks-rec from prior markdown
INSERT INTO stock_onepagers (
  slug, title, audience, purpose, body, status, visibility,
  meeting_date, meeting_location, authors, reviewers, version
) VALUES (
  'roddy-parks-rec',
  'ZAOstock 2026 - Parks/Rec briefing',
  'Roddy Ehrlenbach, Director of Parks Recreation & Facilities, City of Ellsworth',
  'Lock parklet permit for Oct 3 2026 + Aug 15 dry run. Establish day-of point of contact + power/parking/security baseline.',
  E'# ZAOstock 2026 - One Page\n\n> **Music festival - Saturday October 3, 2026 - Franklin Street Parklet - Ellsworth, Maine**\n> Submitted to Roddy Ehrlenbach, Director of Parks, Recreation & Facilities - meeting Tue 2026-04-28\n> Contact: Zaal Panthaki - zaalp99@gmail.com - (207) [PHONE]\n\n## What it is\n\nZAOstock is a one-day music festival celebrating local + regional independent artists, run by The ZAO (a small music community / artist organization based in Maine). It is part of the **Art of Ellsworth** program in partnership with **Heart of Ellsworth** (Cara Romano).\n\n**Format:** afternoon-into-evening, 4-6 acts across one stage, all-ages, free admission with optional donations + sponsor support, food/beverage from local vendors.\n\n**Anchor partners:** Wallace Events (staging + tents), Heart of Ellsworth (programming + community), Art of Ellsworth (umbrella series).\n\n## Why Ellsworth, why this venue\n\nI (Zaal) live in Ellsworth. The ZAO has spent four years building a music + community organization, and ZAOstock is its first public Maine event. Choosing Franklin Street Parklet keeps it walkable, downtown, low-impact, and integrated with existing Ellsworth foot traffic - small enough to do well, central enough to draw locals + day-trippers.\n\n## Expected scale\n\n| | Aug 15 dry run | Oct 3 main event |\n|---|---|---|\n| Attendance | 50 invited guests + team | 200-400 estimate |\n| Hours | 2pm-6pm (4 hr) | early afternoon - early evening (~6 hr) |\n| Acts | 2 local + 1 preview | 4-6 |\n| Sound | modest PA | mid-size PA, daytime levels |\n| Vendors | 0-1 light food | 2-4 local food + bev |\n\n## What we bring\n\n- Insurance (event policy, certificate naming City of Ellsworth as additional insured)\n- Production: staging, sound, lighting, generator if needed (via Wallace Events)\n- 19-person volunteer crew across 8 working circles (ops, music, partners, finance, merch, marketing, media, host)\n- Cleanup commitment: site returned same-or-better than found\n- All artist contracts + payments handled by ZAO\n- Build-in-public: livestream, photo/video documentation (we publish process + content for community + sponsors)\n\n## What we''d ask of Parks / Recreation\n\n1. **Parklet permit hold** for Saturday October 3, 2026 (full day) and Saturday August 15, 2026 (afternoon, dry run / dress rehearsal).\n2. **Power** - what''s available at the parklet, what we''d need to bring in.\n3. **Parking guidance** - overflow plan, signage, anything the city can pre-route.\n4. **Day-of point of contact** - one name + number for the city if something needs coordinating in the moment.\n5. **Security / safety coordination** - what triggers PD involvement, what''s our scope, any required briefing.\n6. **Noise / sound levels** - confirm expectations + cutoff time, how we keep neighbors comfortable.\n\n## What success looks like\n\nA small festival that proves the model: ZAO can produce a real event in Ellsworth that local + regional artists want to play, locals want to come to, sponsors see value in, and the city is glad happens here. If Year 1 lands, Year 2 grows.\n\n## Why now\n\nThe ZAO has been in build mode since 2022. We have artists, content, sponsors, and a community ready. ZAOstock is the moment that builds turn into a tradition.\n\n---\n\n**One ask above all:** lock the date + venue. Everything else routes through that.',
  'draft',
  'internal',
  '2026-04-28',
  'City Hall, Ellsworth',
  'Zaal',
  'Shawn',
  1
) ON CONFLICT (slug) DO NOTHING;

COMMIT;

SELECT slug, title, status, visibility, version, updated_at FROM stock_onepagers ORDER BY updated_at DESC;
