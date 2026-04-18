-- ============================================================================
-- ZAOstock Cypher: artist signup fields
-- ============================================================================
-- Cyphers are ZAO's signature product (see research/community/432). A cypher
-- is a multi-artist collaborative track created live during the event. This
-- SQL adds fields so any artist (from pipeline OR public signup) can indicate
-- interest in the Oct 3 cypher session.
--
-- Public signup form at /stock/cypher POSTs into stock_artists with
-- cypher_interested=true.
-- ============================================================================

ALTER TABLE stock_artists
  ADD COLUMN IF NOT EXISTS cypher_interested BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS cypher_role TEXT DEFAULT '';

COMMENT ON COLUMN stock_artists.cypher_interested IS
  'True if this artist wants to be in the Oct 3 cypher session. Can be set by music team or by the artist via the public /stock/cypher signup form.';
COMMENT ON COLUMN stock_artists.cypher_role IS
  'What the artist brings to the cypher: vocals, production, instrument, etc. Free-form text.';
