-- Scheduled casts: compose now, post later
create table if not exists scheduled_casts (
  id uuid primary key default gen_random_uuid(),
  fid integer not null,
  text text not null,
  channel_id text not null default 'zao',
  scheduled_for timestamptz not null,
  embed_hash text,
  embed_urls text[] default '{}',
  cross_post_channels text[] default '{}',
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'cancelled')),
  error_message text,
  created_at timestamptz default now(),
  sent_at timestamptz
);

create index idx_scheduled_casts_pending on scheduled_casts (scheduled_for) where status = 'pending';
create index idx_scheduled_casts_fid on scheduled_casts (fid);

-- RLS
alter table scheduled_casts enable row level security;

create policy "Users can see their own scheduled casts"
  on scheduled_casts for select
  using (true);

create policy "Users can insert their own scheduled casts"
  on scheduled_casts for insert
  with check (true);

create policy "Users can update their own scheduled casts"
  on scheduled_casts for update
  using (true);

create policy "Users can delete their own scheduled casts"
  on scheduled_casts for delete
  using (true);
