# ZABAL Live Hub -> ZAO OS Rollup - Design Spec

**Date:** 2026-05-17
**Status:** awaiting user approval
**Tier:** big-bang ship (Approach A)
**Related research:** Doc 665 (haatz swap + rollup decision), Doc 626 (Empire Builder + ZABAL POIDH), Doc 589 (haatz coverage), Doc 304 (haatz origin)

## Decisions Captured

| Decision | Value |
|----------|-------|
| Approach | Big bang - both votes shipped together (Approach A) |
| Auth | Public route (no ZAO OS auth gate) |
| URL | DEFERRED - decide zabal.art fate post-cutover |
| Supabase | Migrate all ZABAL tables into ZAO OS Supabase |
| Vote modes | DUAL: ZAO weekly focus (Music/Governance/Events/Build) + Member Spotlight |
| Empire Builder feeds | TWO new feeds at `thezao.com/api/zabal/*-leaderboard`; DM yerbearserker/Adrian to reconfigure both |
| Voting cadence | Weekly Mon-Sun in America/New_York (unchanged from current ZABAL) |
| Vote power | Same formula: base 1 + /zao casts bonus (1-3) + Neynar score multiplier (0.5-1.5), capped at 6 |
| Haatz | Mandatory tier-1 for all Farcaster reads, Neynar tier-2 fallback per Doc 665 |

## Estimated Effort

5-7 days big bang, single ship.

## Architecture

ZABAL voting lives inside the existing ZAO OS Next.js 16 app as a **public route group** (no auth required), with API routes proxying through the new haatz-first reader.

```
src/app/
  (public)/                       <-- NEW route group, no auth middleware
    zabal/
      page.tsx                    <-- ZAO weekly focus voting (Music/Governance/Events/Build)
      spotlight/
        page.tsx                  <-- Member Spotlight nomination + voting
      leaderboard/
        page.tsx                  <-- combined leaderboard view (tabs: focus | spotlight)
      _components/
        VoteCard.tsx
        ModePicker.tsx
        VotePowerBadge.tsx
        SpotlightNominationForm.tsx
        SpotlightVoteList.tsx
        LeaderboardTable.tsx
        WeeklyTimer.tsx
  api/zabal/
    vote/route.ts                 <-- POST: cast weekly focus vote
    leaderboard/route.ts          <-- GET: focus leaderboard
    empire-leaderboard/route.ts   <-- GET: EB feed for focus, format [{address,score}]
    calculate-vote-power/route.ts <-- GET: per-FID vote power (haatz reads)
    spotlight/
      nominate/route.ts           <-- POST: nominate a FID this week
      vote/route.ts               <-- POST: vote for a nominee this week
      nominees/route.ts           <-- GET: current week's nominees
    spotlight-leaderboard/route.ts <-- GET: rolling spotlight winners feed
    spotlight-empire-leaderboard/route.ts <-- GET: EB feed for spotlight
  middleware.ts                   <-- EXISTING; add `/zabal/*` + `/api/zabal/*` to public matcher
src/lib/farcaster/
  haatz-reader.ts                 <-- NEW shared helper (haatz tier-1 + Neynar tier-2)
```

### Why a `(public)` route group

ZAO OS today auth-gates most routes via `middleware.ts`. ZABAL voting must remain accessible to non-ZAO Farcaster users (the existing zabal.art behavior). Route groups in Next.js 16 let us declare `(public)` siblings to `(auth)` without polluting URLs. Middleware matcher gets updated to skip auth on `/zabal/*` + `/api/zabal/*`.

### Why a shared haatz reader

Per Doc 665, three ZABAL Neynar read sites collapse into one helper. Same helper benefits all future ZAO OS Farcaster reads (per Doc 589 70-90% cost cut). Lives at `src/lib/farcaster/haatz-reader.ts` for org-wide reuse.

## Data Model (Supabase migration into ZAO OS project)

Migrate the 6 existing ZABAL tables into ZAO OS Supabase, prefixed `zabal_` to namespace (avoid clash with existing ZAO OS proposal/library/music vote tables). Add 2 new tables for Spotlight.

### Migrated tables (prefix `zabal_`)

```sql
zabal_votes                       -- existing votes table; mode = Music|Governance|Events|Build
zabal_leaderboard_scores          -- aggregated per-FID totals + streak
zabal_vote_power_cache            -- per-FID cached power + username
zabal_custom_leaderboards         -- carry over for EB-style custom leaderboards (drop if unused)
zabal_custom_leaderboard_entries
zabal_vote_comments
```

### New tables (Spotlight)

```sql
CREATE TABLE zabal_spotlight_nominations (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week         DATE NOT NULL,                       -- Monday of nomination week
  nominator_fid INTEGER NOT NULL,
  nominee_fid  INTEGER NOT NULL,
  reason       TEXT,                                -- max 280 chars
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (week, nominator_fid, nominee_fid)         -- one nomination per nominator per nominee per week
);

CREATE TABLE zabal_spotlight_votes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week         DATE NOT NULL,
  voter_fid    INTEGER NOT NULL,
  nominee_fid  INTEGER NOT NULL,
  vote_power   INTEGER NOT NULL DEFAULT 1,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (week, voter_fid)                          -- one vote per voter per week
);

CREATE TABLE zabal_spotlight_winners (
  week         DATE PRIMARY KEY,
  winner_fid   INTEGER NOT NULL,
  winner_username TEXT,
  vote_count   INTEGER NOT NULL,
  computed_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS

- `zabal_votes`, `zabal_spotlight_*`: anonymous insert allowed with FID validation in API route (not at RLS level - same pattern current ZABAL uses).
- Reads: public select on leaderboard + winner tables.
- All writes go through API routes that validate Farcaster signature via Neynar (writes are app-server, Neynar required, not haatz).

### Migration path

1. Apply the 9 ZABAL `.sql` files into ZAO OS Supabase SQL editor in order (see Doc 665 Part 5 checklist), with table names renamed `zabal_*`.
2. Run new spotlight schema.
3. Backfill: copy existing zabal.art Supabase rows into ZAO OS Supabase via one-time export/import script.
4. Verify row counts match before flipping zabal.art DNS (or before announcing the move if DNS deferred).

## Data Flow

### ZAO weekly focus vote

```
User opens thezao.com/zabal
  -> Farcaster miniapp SDK auto-resolves FID
  -> client calls GET /api/zabal/calculate-vote-power?fid=X
       (server reads /zao casts via haatz, Neynar score via haatz, caps power at 6)
       (caches in zabal_vote_power_cache for 24h)
  -> user clicks mode (Music|Governance|Events|Build)
  -> client POSTs /api/zabal/vote with fid + mode + signature
       (server validates signature, calls upsert_weekly_zabal_vote SQL fn)
       (trigger updates zabal_leaderboard_scores)
  -> client refetches /api/zabal/leaderboard
  -> Empire Builder polls /api/zabal/empire-leaderboard on its own refresh schedule
       (returns top 50 voters as [{address, score}] using haatz user/bulk for address resolution)
```

### Member Spotlight nomination + vote

```
Phase 1: Nomination (Mon-Wed)
  User opens thezao.com/zabal/spotlight
  -> client POSTs /api/zabal/spotlight/nominate {nominee_fid, reason}
  -> server validates: nominator != nominee, week in nomination phase, no duplicate
  -> insert into zabal_spotlight_nominations

Phase 2: Voting (Thu-Sun)
  Server picks top 4-8 nominees by nomination count (cron at Wed midnight)
  -> client GETs /api/zabal/spotlight/nominees -> shows current ballot
  -> user votes via POST /api/zabal/spotlight/vote {nominee_fid}
  -> server validates: one vote per voter per week, vote_power from cache
  -> insert into zabal_spotlight_votes

Phase 3: Winner computation (Sun midnight cron)
  Aggregate spotlight_votes by nominee_fid, weighted by vote_power
  Top vote count -> insert into zabal_spotlight_winners
  Server returns winner via /api/zabal/spotlight-leaderboard
  Empire Builder polls /api/zabal/spotlight-empire-leaderboard for the cumulative winner list
```

### Vote power

Same formula as current ZABAL Live Hub. Server-side calculation; client never owns the math.

```
base_power = 1
zao_casts_bonus = match(zao_cast_count_30d) { 50+: 3, 20+: 2, 5+: 1, *: 0 }
neynar_multiplier = match(neynar_user_score) { >=0.9: 1.5, >=0.7: 1.25, <0.5: 0.5, *: 1.0 }
power = min( round((base_power + zao_casts_bonus) * neynar_multiplier), 6 )
```

Reads via haatz tier-1 (`/v2/farcaster/feed/user/casts`, `/v2/farcaster/user/bulk`).

## Error Handling

| Failure | Handling |
|---------|----------|
| haatz read 5xx/timeout | Failover to Neynar with API key. Log `farcaster.read.fallback`. |
| haatz missing `neynar_user_score` field | Helper detects null `experimental.neynar_user_score`; route this call straight to Neynar (per Doc 665 Part 2 gotcha). |
| User has no `verified_addresses.eth_addresses[0]` | Use `custody_address` fallback (same as current `api/empire-leaderboard.js` line 73). |
| Supabase write fails | Return 5xx to client; client retries once with backoff via existing `js/api-throttle.js` pattern. |
| Duplicate vote within same week | DB unique constraint rejects; API returns 409 with `previous_mode` so client can show "you already voted X this week, click to change". |
| EB feed returns empty | Return `[]` (not error). Empire Builder treats empty array as no leaderboard entries, leaves last refresh in place. |
| Spotlight nomination during voting phase | API returns 400 "nominations closed for this week". |
| Spotlight vote during nomination phase | API returns 400 "voting opens Thursday". |
| Cron fails to compute winner | Manually re-run `compute_spotlight_winner(week)` SQL function; alert via existing ZAO OS monitoring. |

## Empire Builder Reconfigure (DMs to yerbearserker/Adrian)

Two new apiLeaderboards on the $ZABAL Empire:

```
Leaderboard 1: ZAO Weekly Focus
  Name:        ZAO Weekly Focus
  Description: Vote weekly on ZAO direction: Music, Governance, Events, Build.
  API URL:     https://thezao.com/api/zabal/empire-leaderboard
  Token Boosters: ON
  Reputation Boosters: ON

Leaderboard 2: Member Spotlight Winners
  Name:        Member Spotlight
  Description: Weekly recognition of ZAO contributors. Winners cumulative.
  API URL:     https://thezao.com/api/zabal/spotlight-empire-leaderboard
  Token Boosters: ON
  Reputation Boosters: ON
```

Send DM template from Doc 626 Part 10 with the two URLs. Once configured, retire the existing zabal.art apiLeaderboard.

## Testing

| Layer | Coverage |
|-------|----------|
| Unit | Vote power calculation pure function. Spotlight winner aggregation. Vote week boundary math (Mon-Sun NYC). |
| Integration | `/api/zabal/empire-leaderboard` returns valid `[{address, score}]` shape with sample seed data. Haatz reader failover behavior with mocked 5xx + timeout. |
| E2E | Smoke: connect Farcaster, cast weekly focus vote, see leaderboard update. Nominate spotlight, see in nominee list. Vote spotlight, see winner computation. |
| Migration | Row count parity between zabal.art Supabase and ZAO OS Supabase post-backfill. |
| Cron | Manual trigger of winner computation function with seeded weekly data. |

## Ship Plan (Big Bang - 5-7 Days)

| Day | Work |
|-----|------|
| 1 | DB migration (rename + apply 9 zabal SQL files in ZAO OS Supabase, add 3 spotlight tables). Backfill row export from zabal.art. Verify row counts. |
| 2 | haatz-reader helper + tests. Public route group middleware update. `/api/zabal/calculate-vote-power` + `/api/zabal/vote` API routes. |
| 3 | `/zabal/page.tsx` UI (focus vote). `/api/zabal/leaderboard` + `/api/zabal/empire-leaderboard`. Smoke test focus voting end-to-end on Vercel preview. |
| 4 | Spotlight tables + nomination/vote API routes. `/zabal/spotlight/page.tsx` UI. Cron job for nominee selection + winner computation. |
| 5 | `/zabal/leaderboard/page.tsx` combined view. `/api/zabal/spotlight-leaderboard` + `/api/zabal/spotlight-empire-leaderboard`. E2E smoke test both votes. |
| 6 | DM yerbearserker/Adrian with two new EB URLs. Verify first refresh on $ZABAL Empire. Confirm boosters apply. |
| 7 | Production cutover. Announce on Farcaster /zao channel. Leave zabal.art live with banner pointing at thezao.com/zabal (DNS fate still deferred). |

## Open Questions (Not Blocking, Decide Later)

| Question | When |
|----------|------|
| zabal.art DNS fate (redirect, sunset, or coexist) | Within 60 days of cutover |
| Drop `zabal_custom_leaderboards` tables? (Empire Builder admin tool, may be redundant with ZAO OS governance UI) | Audit usage 30 days post-cutover |
| Spotlight nominee count (4 vs 8) | Decide during Day 4 build based on first week's nomination volume |
| Spotlight winner pin location (ZAO OS home? /zabal/spotlight? both?) | Day 5 during UI build |
| Notification strategy (Farcaster push via Neynar, in-app, both) | Day 5 |

## Out of Scope

- New vote modes beyond the ones decided here
- ZAO membership gating (decided: public)
- zabal.art DNS migration (deferred)
- Mobile app native build (web miniapp suffices)
- Custom Empire Builder boosters (rely on existing Token + Reputation boosters on $ZABAL Empire)

## Sources

- Research Doc 665 (this design's parent): `/Users/zaalpanthaki/Documents/ZAO OS V1/research/infrastructure/665-zabal-haatz-voting-rollup-decision/README.md`
- ZABAL Live Hub repo: `/Users/zaalpanthaki/Documents/ZABAL/`
- ZAO OS repo: `/Users/zaalpanthaki/Documents/ZAO OS V1/`
- Doc 626: Empire Builder + ZABAL POIDH airdrop
- Doc 589: haatz coverage audit
- Doc 304: haatz / Quilibrium origin
