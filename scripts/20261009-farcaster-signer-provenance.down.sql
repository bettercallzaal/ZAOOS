-- Rollback for 20261009-farcaster-signer-provenance.sql.
-- Removes only the two tables that file adds; touches nothing else.
DROP TABLE IF EXISTS public.cast_signer_provenance;
DROP TABLE IF EXISTS public.farcaster_signer_authority;
