-- Add UNIQUE constraint to rooms.slug
-- Nullable columns allow multiple NULLs per Postgres spec, so rooms without slugs are fine.
-- Prevents two rooms from having the same slug, which causes routing conflicts.

CREATE UNIQUE INDEX IF NOT EXISTS idx_rooms_slug_unique ON rooms (slug) WHERE slug IS NOT NULL;
