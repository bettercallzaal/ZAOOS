-- Directory of ZAO Respect holders who have signed in to ZAO XMTP.
-- This is NOT the authority on membership: the Respect check on Optimism is.
-- It only lets members who have used the app find each other.
-- Not applied anywhere yet. Apply to the app's own Supabase project.

create table if not exists public.members_seen (
  fid           bigint primary key,
  username      text,
  display_name  text,
  pfp_url       text,
  xmtp_address  text check (xmtp_address is null or xmtp_address ~ '^0x[0-9a-f]{40}$'),
  respect_checked_at timestamptz not null default now(),
  last_login_at timestamptz not null default now()
);

create index if not exists members_seen_username_idx on public.members_seen (lower(username));

-- RLS on, no policies: only the server (service role) reads or writes.
alter table public.members_seen enable row level security;
