-- ============================================================================
-- ZAOstock Artist Claim: bio, photo, logo, claim token, contributor points
-- ============================================================================
-- Lets artists (and community contributors) claim their own public profile,
-- fill in a bio + photo + logo, and earn ZAOfestivals Points along a
-- contributor path. Completing the path unlocks volunteer eligibility.
--
-- Paste into Supabase SQL Editor and run. Safe to re-run (IF NOT EXISTS).
-- ============================================================================

ALTER TABLE stock_artists
  ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS photo_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS claim_token TEXT,
  ADD COLUMN IF NOT EXISTS points_earned INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS volunteer_eligible BOOLEAN DEFAULT false;

-- Backfill claim_token for existing rows with a random 16-char token
UPDATE stock_artists
  SET claim_token = substr(md5(random()::text || id::text || now()::text), 1, 16)
  WHERE claim_token IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS stock_artists_claim_token_idx
  ON stock_artists(claim_token)
  WHERE claim_token IS NOT NULL;

COMMENT ON COLUMN stock_artists.bio IS
  'Self-authored artist bio. Shown on /stock/artist/<slug>. Earning step 1.';
COMMENT ON COLUMN stock_artists.photo_url IS
  'Artist profile image URL (https only). Artist can paste their X/Farcaster pfp.';
COMMENT ON COLUMN stock_artists.logo_url IS
  'Artist brand logo URL (https only). Used on posters, stage visuals, broadcast overlay. Earning step 2.';
COMMENT ON COLUMN stock_artists.claim_token IS
  '16-char opaque token. Artist visits /stock/artist/<slug>?token=<claim_token> to edit.';
COMMENT ON COLUMN stock_artists.points_earned IS
  'Cumulative ZAOfestivals Points. 1 point per contributor step (bio, logo, etc). Paid post-event.';
COMMENT ON COLUMN stock_artists.volunteer_eligible IS
  'True when the contributor has completed the full path. Required to work the event as a volunteer on Oct 3.';
