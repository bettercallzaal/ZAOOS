-- Add FC identity gating to fishbowl rooms

alter table fishbowl_rooms
add column if not exists gating_enabled boolean not null default false,
add column if not exists min_quality_score integer not null default 0,
add column if not exists owner_fc_fid integer;

-- Update existing rooms to allow null owner_fc_fid
alter table fishbowl_rooms
alter column owner_fc_fid drop not null;

-- Index for gated room lookups
create index if not exists idx_fishbowl_rooms_gated
on fishbowl_rooms (gating_enabled)
where gating_enabled = true;
