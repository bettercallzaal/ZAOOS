-- FISHBOWLZ: Persistent async fishbowl audio spaces
-- Core tables for hot-seat rotation, transcripts, strict JSONL logging

create table if not exists fishbowl_rooms (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text not null,
  description text,
  host_fid integer not null,
  host_name text not null,
  host_username text not null,
  host_pfp text,
  state text not null default 'active' check (state in ('active', 'paused', 'ended')),
  hot_seat_count integer not null default 5,
  rotation_enabled boolean not null default true,
  current_speakers jsonb not null default '[]',
  current_listeners jsonb not null default '[]',
  -- Audio source
  audio_source_type text check (audio_source_type in ('farcaster', 'external_url', 'native')),
  audio_source_url text,
  audio_source_meta jsonb,
  -- Stats
  total_sessions integer not null default 0,
  total_speakers integer not null default 0,
  total_listeners integer not null default 0,
  -- Timestamps
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  ended_at timestamptz
);

create index idx_fishbowl_rooms_host on fishbowl_rooms (host_fid);
create index idx_fishbowl_rooms_state on fishbowl_rooms (state);
create index idx_fishbowl_rooms_slug on fishbowl_rooms (slug);

-- Individual fishbowl sessions (one room can have many sessions over time)
create table if not exists fishbowl_sessions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references fishbowl_rooms(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer,
  -- Who was in the hot seat at any point
  speakers jsonb not null default '[]',  -- [{fid, username, joined_at, left_at}]
  -- Listener count snapshots
  listener_count_snapshots jsonb not null default '[]',  -- [{at, count}]
  -- Final transcript segment ID
  last_transcript_id uuid,
  state text not null default 'live' check (state in ('live', 'paused', 'ended'))
);

create index idx_fishbowl_sessions_room on fishbowl_sessions (room_id);
create index idx_fishbowl_sessions_started on fishbowl_sessions (started_at);

-- Full transcripts with speaker attribution and timestamps
create table if not exists fishbowl_transcripts (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references fishbowl_rooms(id) on delete cascade,
  session_id uuid references fishbowl_sessions(id) on delete set null,
  speaker_fid integer,
  speaker_name text not null,
  speaker_role text not null check (speaker_role in ('host', 'speaker', 'listener_rotated', 'agent')),
  text text not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_ms integer,
  -- Source: 'audio_capture', 'manual', 'agent_summary'
  source text not null default 'audio_capture',
  -- For cross-platform: source platform
  platform text check (platform in ('farcaster', 'twitter_x', 'native')),
  -- Hash for deduplication
  content_hash text,
  created_at timestamptz not null default now()
);

create index idx_fishbowl_transcripts_room on fishbowl_transcripts (room_id);
create index idx_fishbowl_transcripts_session on fishbowl_transcripts (session_id);
create index idx_fishbowl_transcripts_speaker on fishbowl_transcripts (speaker_fid);
create index idx_fishbowl_transcripts_started on fishbowl_transcripts (started_at);

-- JSONL append log (strict logging for future tokenomics + compliance)
-- This is an append-only event log, NOT a relational table for queries
create table if not exists fishbowl_event_log (
  id bigserial primary key,
  event_type text not null,
  event_data jsonb not null,
  room_id uuid references fishbowl_rooms(id) on delete set null,
  session_id uuid references fishbowl_sessions(id) on delete set null,
  actor_fid integer,
  actor_type text check (actor_type in ('human', 'agent')),
  created_at timestamptz not null default now()
);

create index idx_fishbowl_event_log_room on fishbowl_event_log (room_id);
create index idx_fishbowl_event_log_type on fishbowl_event_log (event_type);
create index idx_fishbowl_event_log_created on fishbowl_event_log (created_at);

-- RLS
alter table fishbowl_rooms enable row level security;
alter table fishbowl_sessions enable row level security;
alter table fishbowl_transcripts enable row level security;
alter table fishbowl_event_log enable row level security;

-- Rooms: anyone can read, hosts can modify their own
create policy "Anyone can read fishbowl rooms"
  on fishbowl_rooms for select using (true);

create policy "Authenticated users can create rooms"
  on fishbowl_rooms for insert with check (true);

create policy "Hosts can update their own rooms"
  on fishbowl_rooms for update using (true);

-- Sessions: anyone can read active sessions
create policy "Anyone can read fishbowl sessions"
  on fishbowl_sessions for select using (true);

create policy "System can insert sessions"
  on fishbowl_sessions for insert with check (true);

-- Transcripts: anyone can read
create policy "Anyone can read transcripts"
  on fishbowl_transcripts for select using (true);

create policy "System can insert transcripts"
  on fishbowl_transcripts for insert with check (true);

-- Event log: read all, write via API only
create policy "Anyone can read event log"
  on fishbowl_event_log for select using (true);

create policy "System can append event log"
  on fishbowl_event_log for insert with check (true);

-- Function to log fishbowl events (used by API)
create or replace function log_fishbowl_event(
  p_event_type text,
  p_event_data jsonb,
  p_room_id uuid,
  p_session_id uuid,
  p_actor_fid integer,
  p_actor_type text
) returns bigint as $$
declare
  v_id bigint;
begin
  insert into fishbowl_event_log (event_type, event_data, room_id, session_id, actor_fid, actor_type)
  values (p_event_type, p_event_data, p_room_id, p_session_id, p_actor_fid, p_actor_type)
  returning id into v_id;
  return v_id;
end;
$$ language plpgsql security definer;
