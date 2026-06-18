-- scrape_cache: generic persistence for the no-login scrapers in src/lib/scrape/.
-- One row per (source, key). data holds the validated scraper output as JSONB.
--
-- STATUS: DRAFT - not yet applied. Schema/DB changes require Zaal approval per
-- CLAUDE.md ("Ask first: Database migrations or schema changes"). Apply via the
-- Supabase SQL editor or MCP apply_migration after review.
--
-- Examples of (source, key):
--   ('x',                '2067194761446920264')        -- a tweet / X Article
--   ('wavewarz-artist',  '<solana_wallet>')            -- artist battle stats
--   ('wavewarz-battles', 'all')                        -- full battle history snapshot
--   ('farcaster',        '<fid>')                      -- full post history

create table if not exists public.scrape_cache (
  source      text        not null,
  key         text        not null,
  data        jsonb       not null,
  scraped_at  timestamptz not null default now(),
  primary key (source, key)
);

create index if not exists scrape_cache_source_idx on public.scrape_cache (source);
create index if not exists scrape_cache_scraped_at_idx on public.scrape_cache (scraped_at desc);

-- RLS: service-role only. The scrapers run server-side via supabaseAdmin; no
-- browser/anon access. (No anon/authenticated policies are created, so RLS
-- denies all client reads/writes by default.)
alter table public.scrape_cache enable row level security;

comment on table public.scrape_cache is
  'Generic cache for src/lib/scrape outputs. Written server-side via supabaseAdmin only.';
