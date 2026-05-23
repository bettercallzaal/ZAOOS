-- juke_spaces: one row per Juke developer-API-minted space.
-- juke_webhook_events: every inbound webhook for idempotency + audit.
--
-- Path B writes a row on create; webhooks update status / participant_count /
-- recording_url. /live/{id} can read this server-side instead of polling
-- GET /v1/rooms/{id} on every render.
--
-- RLS: read-public for juke_spaces (the /live page is public read).
--      writes are service-role only (server routes).
--      juke_webhook_events is service-role only on both reads and writes.

create table if not exists public.juke_spaces (
  id text primary key,                                 -- Juke space id
  title text not null,
  status text not null default 'scheduled',            -- 'scheduled' | 'active' | 'ended'
  created_by_fid integer not null,                     -- ZAO host FID (app.owner_fid)
  scheduled_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  recording_url text,
  participant_count integer not null default 0,
  embed_url text,                                      -- juke.audio/embed/{id}
  raw jsonb,                                           -- Juke create response, for debugging
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists juke_spaces_status_idx
  on public.juke_spaces (status);
create index if not exists juke_spaces_created_by_fid_idx
  on public.juke_spaces (created_by_fid);
create index if not exists juke_spaces_scheduled_at_idx
  on public.juke_spaces (scheduled_at) where status = 'scheduled';

-- Touch updated_at on every row update.
create or replace function public.juke_spaces_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists juke_spaces_set_updated_at on public.juke_spaces;
create trigger juke_spaces_set_updated_at
before update on public.juke_spaces
for each row execute function public.juke_spaces_set_updated_at();

create table if not exists public.juke_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,                            -- room.started | room.finished | participant.joined | participant.left | recording.ready
  juke_event_id text,                                  -- Juke's id if provided in body
  signature_hash text not null,                        -- sha256 of full X-Juke-Signature header, the idempotency key
  space_id text,
  body jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error text
);

create unique index if not exists juke_webhook_events_signature_uq
  on public.juke_webhook_events (signature_hash);
create index if not exists juke_webhook_events_event_type_idx
  on public.juke_webhook_events (event_type);
create index if not exists juke_webhook_events_space_id_idx
  on public.juke_webhook_events (space_id);

-- RLS
alter table public.juke_spaces enable row level security;
alter table public.juke_webhook_events enable row level security;

-- juke_spaces is publicly readable so /live/{id} can SSR without an auth round-trip.
drop policy if exists "juke_spaces_read_all" on public.juke_spaces;
create policy "juke_spaces_read_all"
  on public.juke_spaces
  for select
  using (true);

-- Writes are server-only (no anon / authenticated INSERT policies, service role bypasses RLS).
-- juke_webhook_events has no public policies; service role only.
