-- ============================================================================
-- ZAOstock Team: Member Bios
-- ============================================================================
-- Adds bio + links columns to stock_team_members so each teammate can edit
-- their own profile page after logging in. Idempotent via IF NOT EXISTS.
-- ============================================================================

ALTER TABLE stock_team_members
  ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS links TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS photo_url TEXT DEFAULT '';

COMMENT ON COLUMN stock_team_members.bio IS
  'Self-authored bio. Teammate edits this from the dashboard Profile card. Plain text or simple markdown.';
COMMENT ON COLUMN stock_team_members.links IS
  'Comma-separated list of socials or websites. Free-form. Example: x.com/zaal, farcaster.xyz/zaal';
COMMENT ON COLUMN stock_team_members.photo_url IS
  'Full URL to a hosted profile image. Teammate pastes their existing pfp URL (X, Farcaster, Imgur, etc). Validated as https on save.';
