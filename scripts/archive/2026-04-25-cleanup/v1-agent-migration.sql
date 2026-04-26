-- V1 Agent config extensions
ALTER TABLE agent_config ADD COLUMN IF NOT EXISTS daily_budget_usd numeric DEFAULT 10;
ALTER TABLE agent_config ADD COLUMN IF NOT EXISTS zabal_allocation_pct numeric DEFAULT 70;
ALTER TABLE agent_config ADD COLUMN IF NOT EXISTS content_allocation_pct numeric DEFAULT 30;
ALTER TABLE agent_config ADD COLUMN IF NOT EXISTS gift_enabled boolean DEFAULT true;
ALTER TABLE agent_config ADD COLUMN IF NOT EXISTS gift_rotation_list text[] DEFAULT '{}';
ALTER TABLE agent_config ADD COLUMN IF NOT EXISTS gift_rotation_index integer DEFAULT 0;
ALTER TABLE agent_config ADD COLUMN IF NOT EXISTS min_signal_score numeric DEFAULT 40;

-- Content drafts (for teaser approval flow)
CREATE TABLE IF NOT EXISTS content_drafts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_name text NOT NULL,
  title text NOT NULL,
  markdown text NOT NULL,
  status text DEFAULT 'pending',
  feedback text,
  paragraph_post_id text,
  paragraph_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Track amplified posts (prevent re-amplifying)
CREATE TABLE IF NOT EXISTS amplified_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  paragraph_post_id text NOT NULL UNIQUE,
  title text,
  teaser_chosen text,
  amplified_at timestamptz DEFAULT now()
);
