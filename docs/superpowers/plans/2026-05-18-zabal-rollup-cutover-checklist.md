# ZABAL Live Hub -> ZAO OS Rollup - Cutover Checklist

**Date:** 2026-05-18
**Branch:** `ws/zabal-rollup-2026-05-18`
**Spec:** `docs/superpowers/specs/2026-05-17-zabal-zaoos-rollup-design.md`
**Research:** Doc 665 (PR #549)

Code is shipped to the branch. This doc walks Zaal through cutover.

## 1. Pre-cutover review

- [ ] Open PR + skim diffs
- [ ] Confirm mode mapping in `scripts/zabal-rollup-backfill.mjs` MODE_MAP is correct:
  - studio -> music
  - market -> governance
  - social -> events
  - battle -> build
  - If different mapping wanted, edit `MODE_MAP` before running with `--commit`.
- [ ] Confirm Spotlight phase cadence: Mon-Wed nominate, Thu-Sun vote, Sun-midnight winner. Override in `nycDayOfWeek()` branches if different.

## 2. Apply migration to ZAO OS Supabase

- [ ] Open Supabase SQL Editor for the ZAO OS project
- [ ] Paste contents of `scripts/zabal-rollup-migration.sql`
- [ ] Run. Verify 9 tables created (`zabal_*`) and all functions appear in Functions tab.
- [ ] Quick sanity:

```sql
SELECT tablename FROM pg_tables
 WHERE schemaname='public' AND tablename LIKE 'zabal\_%' ESCAPE '\'
 ORDER BY tablename;
-- expect 9 rows
```

## 3. Backfill from zabal.art Supabase

- [ ] Get zabal.art Supabase URL + service role key from Vercel project
- [ ] Set env locally:

```bash
export ZABAL_SOURCE_SUPABASE_URL="<zabal.art project url>"
export ZABAL_SOURCE_SUPABASE_SERVICE_KEY="<zabal.art service role key>"
export SUPABASE_URL="<ZAO OS project url>"
export SUPABASE_SERVICE_ROLE_KEY="<ZAO OS service role key>"
```

- [ ] Dry-run:

```bash
node scripts/zabal-rollup-backfill.mjs
```

- [ ] Inspect counts, then commit:

```bash
node scripts/zabal-rollup-backfill.mjs --commit
```

- [ ] Verify parity:

```bash
node scripts/zabal-rollup-backfill.mjs --verify
```

## 4. Deploy to Vercel

- [ ] Merge `ws/zabal-rollup-2026-05-18` into `main`
- [ ] Verify Vercel preview / production deploy succeeds
- [ ] Verify env vars on Vercel:
  - `NEXT_PUBLIC_SUPABASE_URL` (ZAO OS)
  - `SUPABASE_SERVICE_ROLE_KEY` (ZAO OS)
  - `NEYNAR_API_KEY` (existing)
  - `FARCASTER_READ_API_BASE=https://haatz.quilibrium.com` (existing, per Doc 665)
  - `CRON_SECRET` (optional but recommended for cron endpoint)

## 5. Smoke test on production

- [ ] Open https://thezao.com/zabal in Farcaster (auth via Quickauth surface)
- [ ] Confirm vote power loads (shows your FID, score, zao casts)
- [ ] Cast a vote on one mode. Confirm leaderboard updates within 30s
- [ ] Open https://thezao.com/zabal/spotlight
  - Mon-Wed: try a nomination (use a friend's FID + reason)
  - Thu-Sun: confirm nominees show + vote works
- [ ] Hit feeds directly:
  - `https://thezao.com/api/zabal/empire-leaderboard` -> `[{address, score}, ...]`
  - `https://thezao.com/api/zabal/spotlight-empire-leaderboard` -> `[{address, score}, ...]`

## 6. DM yerbearserker + Adrian (divifly)

Send via Farcaster DM. Both new feeds need apiLeaderboard entries on $ZABAL Empire.

```
Hey @yerbearserker (cc Adrian) — ZABAL Live Hub voting rolled into ZAO OS today.
Two new public JSON feeds ready for the $ZABAL Empire apiLeaderboards:

  Feed 1 (weekly focus vote):
    URL:         https://thezao.com/api/zabal/empire-leaderboard
    Name:        ZAO Weekly Focus
    Description: Vote weekly on ZAO direction: Music, Governance, Events, Build.
    Boosters:    Token + Reputation both ON

  Feed 2 (Member Spotlight winners):
    URL:         https://thezao.com/api/zabal/spotlight-empire-leaderboard
    Name:        Member Spotlight
    Description: Weekly recognition of ZAO contributors. Winners cumulative.
    Boosters:    Token + Reputation both ON

Format on both: [{address, score}] - matches Empire Builder spec exactly.

Retire the old zabal.art/api/empire-leaderboard apiLeaderboard once these are live.
zabal.art DNS fate still TBD; the legacy site stays up with a banner pointing to
thezao.com/zabal for now.

Refs:
  - Spec: ZAOOS PR #554
  - Research: Doc 665 (ZAOOS PR #549)
  - Sister doc: Doc 626 (Empire Builder + ZABAL POIDH airdrop)
```

## 7. Announce on Farcaster /zao

Suggested cast (240 chars):

```
ZABAL voting just shipped inside ZAO OS.

Weekly vote on ZAO direction: Music | Governance | Events | Build.
Plus Member Spotlight — nominate Mon-Wed, vote Thu-Sun.

thezao.com/zabal

Backed by $ZABAL Empire on @glankerempire.
```

## 8. Post-ship audit (30 days, 2026-06-18)

- [ ] Confirm Empire Builder refresh cadence working on both apiLeaderboards
- [ ] Audit `zabal_custom_leaderboards` usage. Drop if unused (per spec Open Question)
- [ ] Decide zabal.art DNS fate (redirect, sunset, or keep separate)
- [ ] Review Spotlight nominee/vote volume - adjust nominee count (4 vs 8) if needed
- [ ] Verify haatz Neynar cost reduction baseline (per Doc 665 expectation 70-90%)

## 9. Standalone vs rollup checkpoint (2026-08-17)

- [ ] Pull 3-month metrics: weekly voters, unique FIDs, EB distribution events
- [ ] Decide whether to fully deprecate zabal.art or continue dual-running
- [ ] Update Doc 665 with last-validated date + outcome
