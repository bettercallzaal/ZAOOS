-- ============================================================================
-- ZAO CRM - Supabase-native public/private relationship CRM
-- Doc 772. Supersedes the Airtable CRM (doc 737).
--
-- AUTH MODEL NOTE (important - differs from doc 772's first draft):
-- ZAOOS uses iron-session (FID/wallet + isAdmin), NOT Supabase Auth. There is
-- no auth.uid(). Therefore:
--   * PRIVATE protection is enforced at the APP layer: /crm pages + the write
--     API check getSessionData().isAdmin, and read via the service-role client
--     (which bypasses RLS). Zaal is the single owner.
--   * PUBLIC exposure is via curated views granted to anon. The base tables
--     deny anon entirely. The view's column projection + WHERE filter IS the
--     security boundary.
-- The views are intentionally SECURITY DEFINER (security_invoker NOT set) so
-- they can read the RLS-locked base tables and return only the public subset.
-- Supabase's linter flags security-definer views; that warning is ACCEPTED here
-- because the views expose only public-safe columns of opted-in rows. Do not
-- grant anon any direct SELECT on the base tables - that would leak private
-- columns of is_public rows.
--
-- Table names are crm_* to avoid colliding with the dormant legacy `contacts`
-- table from scripts/archive/supabase-applied/20260406_contacts.sql.
-- ============================================================================

-- ---------- updated_at trigger helper (idempotent) --------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- crm_contacts (private base table) -------------------------------
create table if not exists public.crm_contacts (
  id                    uuid primary key default gen_random_uuid(),
  owner_fid             integer,                       -- admin who owns the row (single-owner today)
  -- public-safe columns
  name                  text not null,
  slug                  text unique,                   -- for /network/[slug]
  handle                text,                          -- primary handle (display)
  farcaster_handle      text,
  x_handle              text,
  github_handle         text,
  role                  text,
  org                   text,
  how_we_met            text,
  public_summary        text,
  is_public             boolean not null default false,
  -- private columns (never exposed to anon)
  telegram_handle       text,
  email                 text,
  phone                 text,
  location              text,
  private_notes         text,
  relationship_strength integer check (relationship_strength between 0 and 5),
  -- migration reconciliation
  legacy_airtable_id    text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists crm_contacts_is_public_idx on public.crm_contacts(is_public) where is_public = true;
create index if not exists crm_contacts_slug_idx       on public.crm_contacts(slug);
create unique index if not exists crm_contacts_legacy_airtable_idx
  on public.crm_contacts(legacy_airtable_id) where legacy_airtable_id is not null;

drop trigger if exists crm_contacts_updated_at on public.crm_contacts;
create trigger crm_contacts_updated_at before update on public.crm_contacts
  for each row execute function public.set_updated_at();

-- ---------- crm_interactions (private base table, per-row visibility) -------
create table if not exists public.crm_interactions (
  id                 uuid primary key default gen_random_uuid(),
  contact_id         uuid not null references public.crm_contacts(id) on delete cascade,
  type               text not null default 'note',   -- meeting | call | email | message | gcal | github | note
  occurred_at        timestamptz not null default now(),
  title              text,
  public_summary     text,                            -- shown on the public feed
  private_notes      text,                            -- never leaves the private layer
  visibility         text not null default 'private' check (visibility in ('public','private')),
  source             text,                            -- gmail-mcp | meeting-skill | manual | zoe
  bonfire_episode_id text,
  created_by         text,                            -- 'zoe' | 'admin:<fid>' | 'migration'
  created_at         timestamptz not null default now()
);

create index if not exists crm_interactions_contact_idx    on public.crm_interactions(contact_id);
create index if not exists crm_interactions_occurred_idx    on public.crm_interactions(occurred_at desc);
create index if not exists crm_interactions_public_idx      on public.crm_interactions(visibility) where visibility = 'public';

-- ---------- RLS: lock base tables; service-role bypasses, anon denied -------
alter table public.crm_contacts     enable row level security;
alter table public.crm_interactions enable row level security;

-- No anon/authenticated policies are created. With RLS enabled and no policy,
-- those roles get ZERO rows. The service-role key (server-side only) bypasses
-- RLS, which is how the app reads/writes the private layer after an
-- iron-session isAdmin check. Revoke direct grants for belt-and-suspenders.
revoke all on public.crm_contacts     from anon, authenticated;
revoke all on public.crm_interactions from anon, authenticated;

-- ---------- Public views (curated projection, granted to anon) --------------
-- SECURITY DEFINER (no security_invoker) on purpose - see header note.
create or replace view public.crm_contacts_public as
  select id, slug, name, handle, farcaster_handle, x_handle, github_handle,
         role, org, how_we_met, public_summary, created_at
  from public.crm_contacts
  where is_public = true;

create or replace view public.crm_interactions_public as
  select i.id, i.contact_id, i.type, i.occurred_at, i.title, i.public_summary
  from public.crm_interactions i
  join public.crm_contacts c on c.id = i.contact_id
  where i.visibility = 'public' and c.is_public = true;

grant select on public.crm_contacts_public     to anon, authenticated;
grant select on public.crm_interactions_public to anon, authenticated;

comment on view public.crm_contacts_public is
  'Public projection of crm_contacts (is_public=true, safe columns only). Security boundary is this projection - never expose private columns here.';
comment on view public.crm_interactions_public is
  'Public projection of crm_interactions (visibility=public AND parent contact is_public). Safe columns only.';
