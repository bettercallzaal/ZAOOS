-- ============================================================================
-- ZAO CRM - add structured category + tags to crm_contacts (doc 772 follow-up).
--
-- The Airtable "Music/Tech/Other" field was 114 free-text values that are really
-- ~11 real segments. This adds a clean `category` (single canonical segment) and
-- `tags` (text[] for the granular original label + acquisition channel), so the
-- CRM can segment/filter instead of relying on free-text role + a notes dump.
--
-- Additive + idempotent. category/tags are public-safe (segments, not PII) so
-- they're added to the public view too. Safe to run on the existing CRM.
-- ============================================================================

alter table public.crm_contacts add column if not exists category text;
alter table public.crm_contacts add column if not exists tags text[] not null default '{}';

create index if not exists crm_contacts_category_idx on public.crm_contacts(category);
create index if not exists crm_contacts_tags_gin_idx on public.crm_contacts using gin(tags);

-- category + tags are segments, not private data — expose them on the public
-- view. Appended at the END so `create or replace view` accepts the change
-- (Postgres only allows adding columns, not reordering, on replace).
create or replace view public.crm_contacts_public as
  select id, slug, name, handle, farcaster_handle, x_handle, github_handle,
         role, org, how_we_met, public_summary, created_at,
         category, tags
  from public.crm_contacts
  where is_public = true;

grant select on public.crm_contacts_public to anon, authenticated;

comment on column public.crm_contacts.category is
  'Single canonical segment (Musician / Web3 / Founder / …). Public-safe.';
comment on column public.crm_contacts.tags is
  'Free multi-labels: granular original category + acquisition channel. Public-safe.';
