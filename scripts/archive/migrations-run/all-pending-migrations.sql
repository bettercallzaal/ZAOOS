-- Room experience tables: hand raises + chat messages
-- Run against Supabase SQL editor

-- Hand raise queue
CREATE TABLE IF NOT EXISTS room_hand_raises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  fid integer NOT NULL,
  username text,
  pfp_url text,
  status text DEFAULT 'raised', -- raised, invited, dismissed, lowered
  created_at timestamptz DEFAULT now(),
  UNIQUE(room_id, fid)
);

CREATE INDEX IF NOT EXISTS idx_room_hand_raises_room ON room_hand_raises(room_id, status);

-- Room text chat messages
CREATE TABLE IF NOT EXISTS room_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  fid integer NOT NULL,
  username text,
  pfp_url text,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_room_messages_room ON room_messages(room_id, created_at);

-- Enable RLS
ALTER TABLE room_hand_raises ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies: allow authenticated reads, server-side writes via service role
CREATE POLICY "Anyone can read hand raises" ON room_hand_raises FOR SELECT USING (true);
CREATE POLICY "Anyone can read room messages" ON room_messages FOR SELECT USING (true);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE room_hand_raises;
ALTER PUBLICATION supabase_realtime ADD TABLE room_messages;
-- Scheduled rooms: announce upcoming spaces with RSVP
CREATE TABLE IF NOT EXISTS scheduled_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  host_fid integer NOT NULL,
  host_name text,
  host_pfp text,
  scheduled_at timestamptz NOT NULL,
  category text DEFAULT 'general',
  theme text DEFAULT 'default',
  rsvp_count integer DEFAULT 0,
  state text DEFAULT 'scheduled', -- scheduled, live, ended, cancelled
  room_id uuid, -- links to rooms table when it goes live
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS room_rsvps (
  scheduled_room_id uuid REFERENCES scheduled_rooms(id) ON DELETE CASCADE,
  fid integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (scheduled_room_id, fid)
);

-- Add recording_url to rooms table for VOD links
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS recording_url text;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_rooms_state ON scheduled_rooms(state);
CREATE INDEX IF NOT EXISTS idx_scheduled_rooms_scheduled_at ON scheduled_rooms(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_room_rsvps_fid ON room_rsvps(fid);
CREATE TABLE IF NOT EXISTS tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid,
  sender_fid integer NOT NULL,
  recipient_fid integer NOT NULL,
  amount text NOT NULL,
  currency text DEFAULT 'ETH',
  chain text DEFAULT 'base',
  tx_hash text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tips_room ON tips(room_id);
CREATE INDEX IF NOT EXISTS idx_tips_recipient ON tips(recipient_fid);
-- Listening Parties table
-- Scheduled events where members listen together with synced playback

CREATE TABLE IF NOT EXISTS listening_parties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  host_fid integer NOT NULL,
  host_name text,
  track_urls text[] NOT NULL DEFAULT '{}',
  scheduled_at timestamptz,
  started_at timestamptz,
  state text DEFAULT 'scheduled', -- scheduled, live, ended
  current_track_index integer DEFAULT 0,
  current_position_ms integer DEFAULT 0,
  participant_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listening_parties_state ON listening_parties(state);
CREATE INDEX IF NOT EXISTS idx_listening_parties_scheduled ON listening_parties(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_listening_parties_host ON listening_parties(host_fid);

ALTER TABLE listening_parties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read parties" ON listening_parties;
CREATE POLICY "Anyone can read parties" ON listening_parties FOR SELECT USING (true);
-- overlay_now_playing: stores each user's current playing track for OBS overlays.
-- The public GET endpoint reads from this table (no auth required — fid acts as key).
-- The authenticated POST endpoint upserts rows here.

CREATE TABLE IF NOT EXISTS overlay_now_playing (
  fid          BIGINT PRIMARY KEY,
  track_name   TEXT NOT NULL,
  artist_name  TEXT NOT NULL,
  artwork_url  TEXT,
  platform     TEXT NOT NULL DEFAULT 'audio',
  position     INTEGER NOT NULL DEFAULT 0,
  duration     INTEGER NOT NULL DEFAULT 0,
  track_url    TEXT,
  is_playing   BOOLEAN NOT NULL DEFAULT false,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Allow public read (overlay pages have no auth)
ALTER TABLE overlay_now_playing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read overlay now playing"
  ON overlay_now_playing FOR SELECT
  USING (true);

CREATE POLICY "Service role can upsert overlay now playing"
  ON overlay_now_playing FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index for quick lookup by fid (primary key already covers this)
-- Add index on updated_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_overlay_now_playing_updated
  ON overlay_now_playing (updated_at);
-- Song requests for DJ mode in Spaces
CREATE TABLE IF NOT EXISTS song_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  requester_fid integer NOT NULL,
  requester_name text,
  song_url text NOT NULL,
  song_title text,
  song_artist text,
  song_artwork text,
  status text DEFAULT 'pending', -- pending, accepted, rejected, played
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_song_requests_room ON song_requests(room_id, status);
-- Push notification subscriptions for Web Push API
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS user_push_subscriptions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  fid INTEGER NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for looking up subscriptions by user
CREATE INDEX IF NOT EXISTS idx_push_subs_fid ON user_push_subscriptions (fid);

-- RLS: users can only manage their own subscriptions
ALTER TABLE user_push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON user_push_subscriptions FOR SELECT
  USING (true);  -- Service role handles auth check in API

CREATE POLICY "Users can insert own subscriptions"
  ON user_push_subscriptions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete own subscriptions"
  ON user_push_subscriptions FOR DELETE
  USING (true);

CREATE POLICY "Users can update own subscriptions"
  ON user_push_subscriptions FOR UPDATE
  USING (true);
-- Follower snapshot for tracking unfollows
CREATE TABLE IF NOT EXISTS follower_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fid integer NOT NULL,
  follower_fids integer[] NOT NULL DEFAULT '{}',
  follower_count integer NOT NULL DEFAULT 0,
  following_count integer NOT NULL DEFAULT 0,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(fid, snapshot_date)
);

-- Unfollow events
CREATE TABLE IF NOT EXISTS unfollow_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_fid integer NOT NULL,
  unfollower_fid integer NOT NULL,
  unfollower_username text,
  unfollower_display_name text,
  detected_at timestamptz DEFAULT now()
);

-- Growth history for sparklines
CREATE TABLE IF NOT EXISTS member_stats_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fid integer NOT NULL,
  follower_count integer NOT NULL DEFAULT 0,
  following_count integer NOT NULL DEFAULT 0,
  engagement_score real,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(fid, snapshot_date)
);

CREATE INDEX idx_follower_snapshots_fid ON follower_snapshots(fid);
CREATE INDEX idx_unfollow_events_member ON unfollow_events(member_fid);
CREATE INDEX idx_member_stats_fid ON member_stats_history(fid);

-- Additional ALTER TABLE commands
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS recording_url text;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS gate_config jsonb;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS theme text DEFAULT 'default';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS layout_preference text DEFAULT 'speakers-first';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_type text DEFAULT 'stage';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS persistent boolean DEFAULT false;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS channel_id text;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS last_active_at timestamptz DEFAULT now();

-- Connected platforms metadata
ALTER TABLE connected_platforms ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';
