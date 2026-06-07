-- 010_bot_heartbeats.sql
-- Fleet liveness for the coworking "Bots" board.
-- Written by POST /api/v1/bots/heartbeat (per-bot bearer); read by GET /api/v1/bots.
-- Apply in the cowork-zaodevz Supabase project (SQL editor).

create table if not exists public.bot_heartbeats (
  bot         text primary key,
  status      text not null default 'up' check (status in ('up','degraded','down')),
  ts          timestamptz not null default now(),
  meta        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

comment on table public.bot_heartbeats is
  'Latest heartbeat per bot for the /bots status board. Upserted by POST /api/v1/bots/heartbeat (per-bot bearer; bot = the token). online + ageSeconds are derived at read time from ts.';

-- Heartbeat = upsert keyed by bot:
--   insert into bot_heartbeats (bot, status, ts, meta, updated_at)
--   values ($1,$2,now(),$3,now())
--   on conflict (bot) do update set status=excluded.status, ts=excluded.ts,
--     meta=excluded.meta, updated_at=now();
--
-- GET /api/v1/bots derives, per row:
--   ageSeconds = extract(epoch from (now() - ts))
--   online     = ageSeconds < 180   (3 missed 60s beats)

-- Server-only access: the board reads via GET /api/v1/bots (service role),
-- not from the browser. Enable RLS with no public policy so the anon/auth
-- keys can't touch it directly; the service role bypasses RLS.
alter table public.bot_heartbeats enable row level security;
