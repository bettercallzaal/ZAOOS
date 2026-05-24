-- juke_spaces migration #2 (2026-05-24)
--
-- Adds a `participants` jsonb column that the webhook handler keeps in sync
-- with participant.joined / participant.left deliveries. Per the Juke
-- 2026-05-23 changelog, those events now carry fid + display_name + role for
-- real humans + agents only (anonymous listeners + LiveKit virtual
-- participants filtered out).
--
-- Shape:
--   [
--     { "fid": 12345, "display_name": "@zaal", "role": "host",
--       "joined_at": "2026-05-24T03:14:00Z" },
--     ...
--   ]
--
-- The webhook handler upserts on `(space_id, fid)` and removes the entry on
-- participant.left. Cheaper than a separate juke_space_participants table at
-- ZAO's volume (single-digit live spaces, ≤ 50 participants each).

alter table public.juke_spaces
  add column if not exists participants jsonb not null default '[]'::jsonb;

create index if not exists juke_spaces_participants_gin
  on public.juke_spaces using gin (participants);
