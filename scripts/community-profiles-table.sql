-- Community Profiles table (replaces Webflow CRM)
CREATE TABLE IF NOT EXISTS community_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  fid INTEGER UNIQUE,
  user_id UUID,
  cover_image_url TEXT,
  thumbnail_url TEXT,
  biography TEXT,
  category TEXT NOT NULL DEFAULT 'musician',
  website TEXT,
  instagram TEXT,
  twitter TEXT,
  tiktok TEXT,
  spotify TEXT,
  youtube TEXT,
  apple_music TEXT,
  amazon_music TEXT,
  youtube_music TEXT,
  twitch TEXT,
  soundcloud TEXT,
  audius TEXT,
  farcaster_username TEXT,
  bluesky TEXT,
  tags TEXT[] DEFAULT '{}',
  admin_notes TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_notable BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_profiles_slug ON community_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_community_profiles_category ON community_profiles(category);
CREATE INDEX IF NOT EXISTS idx_community_profiles_fid ON community_profiles(fid) WHERE fid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_community_profiles_tags ON community_profiles USING gin(tags);

ALTER TABLE community_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "community_profiles_read" ON community_profiles FOR SELECT TO authenticated USING (true);
