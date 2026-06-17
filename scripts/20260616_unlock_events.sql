-- Unlock Protocol event ticketing (research doc 863)
-- Adds a central `events` registry so each ZAO event can carry its Unlock lock
-- address + hosted event page URL. The existing `event_rsvps` table (email + name
-- capture, CSV export) is UNCHANGED - this table sits alongside it, joined on slug.
--
-- Run this against the ZAO OS app Supabase project (NOT the cowork tracker).
-- Paste into the Supabase SQL editor and run.

create table if not exists public.events (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  title            text not null,
  description      text,
  -- Unlock Protocol fields. Created via EVENTS by Unlock Labs (events.unlock-protocol.com).
  lock_address     text,                       -- 0x... PublicLock contract on Base
  unlock_event_url text,                       -- hosted event page / checkout URL
  chain_id         integer not null default 8453,  -- Base mainnet
  -- Scheduling / display
  starts_at        timestamptz,
  ends_at          timestamptz,
  location         text,
  is_published     boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists events_slug_idx on public.events (slug);
create index if not exists events_published_idx on public.events (is_published, starts_at);

-- keep updated_at fresh
create or replace function public.events_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists events_updated_at on public.events;
create trigger events_updated_at
  before update on public.events
  for each row execute function public.events_set_updated_at();

-- RLS: public can read published events; only service role writes.
alter table public.events enable row level security;

drop policy if exists "events public read published" on public.events;
create policy "events public read published"
  on public.events for select
  using (is_published = true);

-- (writes happen via the service-role key server-side, which bypasses RLS)

-- Seed the first weekend event. Fill lock_address + unlock_event_url after you
-- create the event on events.unlock-protocol.com (Base, free ticket + approval).
insert into public.events (slug, title, description, chain_id, is_published)
values (
  'flowstage-weekend',
  'FlowStage Weekend Session',
  'ZABAL Gamez / FlowStage session. NFT ticket is your proof of attendance and July build-eligibility signal.',
  8453,
  true
)
on conflict (slug) do nothing;
