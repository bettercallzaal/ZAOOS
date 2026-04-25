# Applied stock-* scripts archive (snapshot 2026-04-25)

These migrations + scripts were RUN against the live Supabase prior to 2026-04-25.
Kept for history + restore reference, not for re-running unless re-baselining a fresh DB.

**Re-run risks:**
- `set-stock-team-random-codes.ts` re-randomizes ALL 4-letter codes for the dashboard
  (per `feedback_no_regenerate_codes` memory - DO NOT run after sending codes).
- `stock-circles-v1-migration.sql` is idempotent but re-running re-seeds Zaal as
  coordinator on all 8 circles - if you've reassigned, re-run resets.
- `stock-onepagers-migration.sql` is idempotent (ON CONFLICT DO NOTHING) - safe to
  re-run, won't clobber edits.
- `stock-schema.sql` is the foundational dashboard schema - safe re-run via
  CREATE TABLE IF NOT EXISTS.

**Active script (still in scripts/ root, not here):**
- `stock-missing-tables-migration.sql` - unblocks /do add idea, /gemba, dashboard
  Budget + RSVPs tabs. Run this if the bot is logging "Could not find table" errors.
