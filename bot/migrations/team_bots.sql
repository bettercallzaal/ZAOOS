-- Team bot memory tables. Paste into Supabase SQL editor (one-time setup).
-- Used by Magnetiq + AttaBotty bots in bot/src/teams/.

create extension if not exists "pgcrypto";

create table if not exists team_bot_messages (
  id uuid primary key default gen_random_uuid(),
  bot text not null check (bot in ('magnetiq', 'attabotty')),
  chat_id bigint not null,
  message_id bigint not null,
  from_id bigint not null,
  from_username text,
  text text not null,
  is_bot_reply boolean not null default false,
  ts timestamptz not null default now()
);
create index if not exists team_bot_messages_bot_ts_idx on team_bot_messages(bot, ts desc);
create index if not exists team_bot_messages_chat_idx on team_bot_messages(chat_id, ts desc);

create table if not exists team_bot_facts (
  id uuid primary key default gen_random_uuid(),
  bot text not null check (bot in ('magnetiq', 'attabotty')),
  fact text not null,
  created_at timestamptz not null default now()
);
create index if not exists team_bot_facts_bot_idx on team_bot_facts(bot, created_at desc);

create table if not exists team_bot_ideas (
  id uuid primary key default gen_random_uuid(),
  bot text not null check (bot in ('magnetiq', 'attabotty')),
  from_id bigint not null,
  text text not null,
  created_at timestamptz not null default now()
);
create index if not exists team_bot_ideas_bot_idx on team_bot_ideas(bot, created_at desc);

create table if not exists team_bot_tasks (
  id uuid primary key default gen_random_uuid(),
  bot text not null check (bot in ('magnetiq', 'attabotty')),
  from_id bigint not null,
  text text not null,
  status text not null default 'open' check (status in ('open', 'done', 'dropped')),
  created_at timestamptz not null default now(),
  closed_at timestamptz
);
create index if not exists team_bot_tasks_bot_status_idx on team_bot_tasks(bot, status, created_at desc);

create table if not exists team_bot_clips (
  id uuid primary key default gen_random_uuid(),
  bot text not null check (bot in ('magnetiq', 'attabotty')),
  from_id bigint not null,
  url text not null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists team_bot_clips_bot_idx on team_bot_clips(bot, created_at desc);

create table if not exists team_bot_daily_summaries (
  id uuid primary key default gen_random_uuid(),
  bot text not null check (bot in ('magnetiq', 'attabotty')),
  for_date date not null,
  summary text not null,
  message_count int not null default 0,
  created_at timestamptz not null default now(),
  unique (bot, for_date)
);

-- No RLS - service role only writes. Service key is bot/.env (chmod 600).
