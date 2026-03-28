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
