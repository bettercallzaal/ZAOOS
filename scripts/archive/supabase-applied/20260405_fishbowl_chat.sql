-- FISHBOWLZ chat messages
create table if not exists fishbowl_chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references fishbowl_rooms(id) on delete cascade,
  sender_fid integer not null,
  sender_username text not null,
  text text not null,
  created_at timestamptz not null default now()
);

create index idx_fishbowl_chat_room on fishbowl_chat_messages (room_id);
create index idx_fishbowl_chat_created on fishbowl_chat_messages (created_at);

alter table fishbowl_chat_messages enable row level security;

create policy "Anyone can read fishbowl chat"
  on fishbowl_chat_messages for select using (true);

create policy "System can insert fishbowl chat"
  on fishbowl_chat_messages for insert with check (true);
