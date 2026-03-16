-- ZAO OS: Add missing indexes identified by codebase audit
-- Run in Supabase SQL Editor
-- Safe to run multiple times (all statements use IF NOT EXISTS)
--
-- This migration adds indexes that were NOT already created by earlier scripts.
-- Indexes that already exist in prior migrations are listed at the bottom
-- for reference so we have a single audit document.

-- ============================================================
-- NEW INDEXES — not defined in any existing migration
-- ============================================================

-- users: composite index for the common "lookup active user by FID" query
-- Optimises: SELECT * FROM users WHERE fid = $1 AND is_active = TRUE
-- Used by the /api/users/[fid] route and the allowlist gate middleware
CREATE INDEX IF NOT EXISTS idx_users_fid_active
  ON users (fid, is_active)
  WHERE fid IS NOT NULL;

-- allowlist: filter by is_active for the gate check
-- Optimises: SELECT * FROM allowlist WHERE fid = $1 AND is_active = TRUE
-- The fid index exists but a dedicated is_active partial index helps when
-- scanning for all active members (e.g. leaderboard, member count)
CREATE INDEX IF NOT EXISTS idx_allowlist_is_active
  ON allowlist (is_active)
  WHERE is_active = TRUE;

-- channel_casts: standalone channel_id index
-- The composite (channel_id, timestamp DESC) index already covers ordered
-- feed queries, but a plain channel_id index is useful for non-ordered
-- lookups like COUNT(*) per channel or admin bulk deletes
CREATE INDEX IF NOT EXISTS idx_channel_casts_channel_id
  ON channel_casts (channel_id);

-- proposal_votes: index on voter_id for "my votes" queries
-- The existing index covers proposal_id lookups; this covers voter lookups
-- Optimises: SELECT * FROM proposal_votes WHERE voter_id = $1
CREATE INDEX IF NOT EXISTS idx_proposal_votes_voter
  ON proposal_votes (voter_id);

-- sessions: index on fid for session lookups during auth
-- Optimises: SELECT * FROM sessions WHERE fid = $1 ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_sessions_fid
  ON sessions (fid);

-- notification_tokens: partial index on enabled + fid for push delivery
-- Optimises: SELECT * FROM notification_tokens WHERE fid = $1 AND enabled = TRUE
-- (idx_notification_tokens_enabled exists but is not composite with fid)
CREATE INDEX IF NOT EXISTS idx_notification_tokens_fid_enabled
  ON notification_tokens (fid, enabled)
  WHERE enabled = TRUE;


-- ============================================================
-- ALREADY EXISTING — defined in prior migration scripts
-- Listed here for audit completeness; these statements are no-ops
-- ============================================================

-- From create-users-table.sql:
--   idx_users_primary_wallet  ON users(primary_wallet)
--   idx_users_fid             ON users(fid) WHERE fid IS NOT NULL
--   idx_users_role            ON users(role)
--   idx_users_is_active       ON users(is_active) WHERE is_active = TRUE

-- From setup-database.sql:
--   idx_allowlist_fid         ON allowlist(fid) WHERE fid IS NOT NULL
--   idx_allowlist_wallet      ON allowlist(wallet_address) WHERE wallet_address IS NOT NULL
--   idx_hidden_messages_hash  ON hidden_messages(cast_hash)
--   idx_notification_tokens_fid     ON notification_tokens(fid)
--   idx_notification_tokens_enabled ON notification_tokens(enabled) WHERE enabled = TRUE

-- From add-channel-casts-table.sql:
--   idx_channel_casts_channel_ts ON channel_casts(channel_id, timestamp DESC)
--   idx_channel_casts_parent     ON channel_casts(parent_hash) WHERE parent_hash IS NOT NULL

-- From create-proposals.sql:
--   idx_proposals_status           ON proposals(status)
--   idx_proposals_author           ON proposals(author_id)
--   idx_proposals_created          ON proposals(created_at DESC)
--   idx_proposal_votes_proposal    ON proposal_votes(proposal_id)
--   idx_proposal_comments_proposal ON proposal_comments(proposal_id)

-- From create-notifications.sql:
--   idx_notifications_recipient ON notifications(recipient_fid, read, created_at DESC)
--   idx_notifications_created   ON notifications(created_at DESC)
