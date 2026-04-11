-- Engagement metrics for cross-platform posts (Threads, X, Bluesky, etc.)
-- Tracks views, likes, replies, reposts, quotes, and clicks over time.

create table if not exists engagement_metrics (
  id uuid primary key default gen_random_uuid(),
  publish_log_id uuid references publish_log(id) on delete cascade,
  platform text not null,
  platform_post_id text not null,
  views bigint default 0,
  likes bigint default 0,
  replies bigint default 0,
  reposts bigint default 0,
  quotes bigint default 0,
  clicks bigint default 0,
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Index for querying by platform post
create index if not exists idx_engagement_metrics_platform_post
  on engagement_metrics (platform, platform_post_id);

-- Index for querying by publish_log_id
create index if not exists idx_engagement_metrics_publish_log_id
  on engagement_metrics (publish_log_id);

-- Index for time-series queries
create index if not exists idx_engagement_metrics_fetched_at
  on engagement_metrics (fetched_at desc);

-- RLS
alter table engagement_metrics enable row level security;

-- Admin-only read access (service role bypasses RLS for server-side writes)
create policy "Admins can read engagement metrics"
  on engagement_metrics for select
  using (true);
