-- Opt-in public member profiles: a chosen name plus per-field public toggles.
--
-- STATUS: DRAFT - not applied. Schema changes require Zaal's approval per
-- CLAUDE.md ("Ask first: Database migrations or schema changes"). Apply through
-- the Supabase SQL editor after review. Rollback: 20261101-member-public-profile.down.sql
--
-- Sessions are iron-session, not Supabase Auth, so auth.uid() cannot identify a
-- member and an owner-only RLS policy cannot be written. Ownership is enforced
-- in src/app/api/members/me/public-profile (the row always comes from the
-- session), which uses the service role. RLS here denies every browser client.
--
-- Everyone starts opted out: no backfill, public_name NULL, public_fields empty.

begin;

alter table public.users
  add column if not exists public_name text,
  add column if not exists public_fields text[] not null default '{}';

alter table public.users drop constraint if exists users_public_name_check;
alter table public.users add constraint users_public_name_check check (
  public_name is null
  or (public_name = btrim(public_name) and char_length(public_name) between 1 and 50)
);

alter table public.users drop constraint if exists users_public_fields_known_check;
alter table public.users add constraint users_public_fields_known_check check (
  public_fields <@ array[
    'username', 'avatar', 'real_name', 'bio', 'location', 'website', 'tags',
    'x', 'instagram', 'bluesky', 'soundcloud', 'spotify', 'audius', 'discord',
    'ens', 'farcaster', 'membership', 'respect', 'reputation', 'artist', 'activity'
  ]::text[]
);

-- The name is the minimum: no toggle can be on without one.
alter table public.users drop constraint if exists users_public_fields_need_name_check;
alter table public.users add constraint users_public_fields_need_name_check check (
  public_name is not null or public_fields = '{}'::text[]
);

create index if not exists idx_users_public_name
  on public.users (public_name)
  where public_name is not null;

-- Service role only. No policy is created, so RLS denies anon and authenticated.
alter table public.users enable row level security;
revoke all on table public.users from anon, authenticated;

comment on column public.users.public_name is
  'Name shown on the public profile, picked by the member. NULL means no public profile.';
comment on column public.users.public_fields is
  'Fields the member turned on. Enforced in src/lib/members/public-profile.ts.';

commit;
