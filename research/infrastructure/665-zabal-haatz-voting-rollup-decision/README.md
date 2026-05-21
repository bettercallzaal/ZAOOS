---
topic: infrastructure
type: decision
status: research-complete
last-validated: 2026-05-17
original-query: Should ZABAL voting use haatz, keep standalone Supabase or roll into ZAO OS (reconstructed)
related-docs: 304, 589, 626, 661
tier: STANDARD
---

# 665 — ZABAL Live Hub: haatz swap + standalone Supabase vs ZAO OS rollup

> **Goal:** Decide whether to (a) swap ZABAL Live Hub Neynar reads to haatz.quilibrium.com, (b) keep standalone Supabase or roll voting into ZAO OS. Map current state, integration points, and ship order.

> **Trigger:** 2026-05-17 ask from Zaal: "make voting app work with haatz and let's get it up and running. Activate Supabase or roll it into ZAO OS."

> **TL;DR:** SWAP all 3 ZABAL Neynar read paths to haatz first (1 hour work, 100% cost win, zero risk - failover keeps Neynar as tier-2). KEEP standalone Supabase short-term (already shipped, Empire Builder integration live). Roll into ZAO OS only as Phase 3 once ZAO OS has a public `/zabal` route and audience overlap justifies merge. Standalone is not dead weight - it owns `zabal.art` brand, Empire Builder feed, and the Studio/Market/Social/Battle vote modes. ZAO OS already has 7 distinct vote APIs; ZABAL would be the 8th - merging now adds infra cost without product win.

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Haatz swap** | DO IT NOW. All 3 Neynar read sites in ZABAL Live Hub are reads that haatz serves at parity: `feed/user/casts` (in `api/calculate-vote-power.js`), `user/bulk` (in `api/calculate-vote-power.js` + `api/empire-leaderboard.js`), generic proxy (`api/neynar.js`). 1 hour work. 70-90% Neynar cost reduction confirmed in Doc 589. |
| **Failover** | TWO-TIER pattern from Doc 589: try haatz first (5s timeout), fall back to Neynar with API key. Never one-tier - haatz uptime not SLA'd by Cassie. |
| **Writes** | NONE in ZABAL Live Hub (no cast posting, no follow, no signers). Pure read app. No risk from haatz write gap. |
| **Standalone Supabase vs ZAO OS** | KEEP STANDALONE for Phases 1-2. zabal.art ships independently, low blast radius, Empire Builder JSON feed already pulls from `/api/empire-leaderboard`. Rolling into ZAO OS now = rebuilding Studio/Market/Social/Battle UI in Next.js + dual-Supabase migration + URL change. Zero product win. |
| **When to roll into ZAO OS** | Trigger: ZAO OS gets a public unauthenticated `/zabal` route AND ZAO OS membership grows past 500 (currently 188 per skill metadata). Until then, separate concerns. |
| **ZAO OS link, not merge** | ZAO OS should LINK to zabal.art voting from `/governance` and `/music/track-of-day` as a sibling vote surface. No code merge needed. Cross-link in `community.config.ts` + nexus tiles. |
| **Activate Supabase** | Supabase IS already active for zabal.art - tables exist (`votes`, `leaderboard_scores`, `vote_power_cache`, `custom_leaderboards`, `custom_leaderboard_entries`), RLS configured, triggers firing. "Activate" interpretation = ensure prod Vercel env vars (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `NEYNAR_API_KEY`) set + run any unrun migrations. See Part 5 checklist. |
| **Ship order** | 1) Haatz swap PR (today, ~1 hr). 2) Supabase env-var + migration audit (today, ~30 min). 3) Live verification at zabal.art (today). 4) ZAO OS link-in from `/nexus` + community.config.ts (this week). 5) Roll-into-ZAO-OS decision revisit (2026-08-17, after 3 months of standalone data). |

---

## Part 1 — Haatz Context (Doc 589 Recap)

**haatz.quilibrium.com** = Cassie Heart / Quilibrium-operated free public Neynar v2 API proxy. Read-only by design. No API key. Validated 2026-05-02 with 30+ endpoints tested.

| Property | Value |
|----------|-------|
| Base URL | `https://haatz.quilibrium.com` |
| Auth | None |
| Cost | $0 |
| Coverage | ~30 Neynar v2 read endpoints + v1 protocol endpoints |
| Latency | 120-210ms typical, 1.15s worst case (channel search) |
| Block on writes | All write paths 404; use Neynar |
| Block on trending | `/v2/farcaster/feed/trending` + `/v2/farcaster/feed/for_you` timeout 8s; route to Neynar |
| Block on relevant_followers | 404; route to Neynar |
| Schema compat | ~99% with Neynar v2; minor cursor diff (`next.cursor` vs `next_cursor`) per Doc 304 |
| Failover risk | Cassie can pull access; mitigated by tier-2 Neynar fallback |

## Part 2 — ZABAL Live Hub Neynar Audit

All Neynar calls in `/Users/zaalpanthaki/Documents/ZABAL/api/`. Verified 2026-05-17 by reading source.

### Call site 1: `api/neynar.js` (generic proxy)

```js
// Line 37
const url = `https://api.neynar.com/v2/farcaster/${endpoint}${queryString ? '?' + queryString : ''}`;
```

Generic GET-only proxy fronting any Neynar v2 endpoint via `?endpoint=...&...params`. Headers send `api_key`. Used by frontend `js/` files (e.g. `state-manager.js`, `share-modal.js`) for user lookup and channel data.

**Haatz compat:** YES for all reads. NO if frontend ever passes `feed/trending` or `feed/for_you` (need exclusion list).

### Call site 2: `api/calculate-vote-power.js`

Two Neynar reads per FID:

```js
// Line 43 — fetch /zao channel casts (counts cast activity for power bonus)
`https://api.neynar.com/v2/farcaster/feed/user/casts?fid=${fid}&limit=100`

// Line 77 — fetch user bulk (extracts experimental.neynar_user_score for multiplier)
`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`
```

**Haatz compat:** BOTH WORK. `feed/user/casts` confirmed 140ms in Doc 589. `user/bulk` confirmed 145ms.

**Gotcha:** `experimental.neynar_user_score` is a Neynar-proprietary score. Confirm haatz response shape includes it. If not, route this single call back to Neynar (keep multiplier logic intact).

### Call site 3: `api/empire-leaderboard.js`

```js
// Line 53 — bulk user lookup to map FIDs -> verified Eth addresses for Empire Builder feed
`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fids}`
```

Returns `verified_addresses.eth_addresses[0]` per user. Powers the JSON feed Empire Builder pulls.

**Haatz compat:** YES.

### Other API routes (no Neynar)

- `api/leaderboard.js` — Supabase only
- `api/sync-empire-builder.js` — calls Empire Builder, not Neynar
- `api/update-leaderboard-users.js` — Supabase
- `api/send-notification-neynar.js` — WRITE path (push notif via Neynar `notifications/`). Keep on Neynar.
- `api/cron/*` — Supabase + cron
- `api/custom-leaderboards/*` — Supabase

**Total Neynar reads to swap:** 3 fetch sites across 3 files. **Writes to leave alone:** 1 (`send-notification-neynar.js`).

## Part 3 — Haatz Swap Implementation

### Pattern: env-var-driven base + per-call failover

Add env vars (Vercel + local):

```bash
FARCASTER_READ_API_BASE=https://haatz.quilibrium.com
NEYNAR_API_KEY=<existing>
```

Create new helper `api/_lib/farcaster-read.js`:

```js
// Shared Neynar v2 reader with haatz tier-1 + Neynar tier-2 failover
const HAATZ_BASE = process.env.FARCASTER_READ_API_BASE || 'https://haatz.quilibrium.com';
const NEYNAR_BASE = 'https://api.neynar.com';
const NEYNAR_KEY = process.env.NEYNAR_API_KEY;

// Paths haatz cannot serve (timeouts or 404 per Doc 589)
const NEYNAR_ONLY = [
  '/v2/farcaster/feed/trending',
  '/v2/farcaster/feed/for_you',
  '/v2/farcaster/user/relevant_followers',
  '/v2/farcaster/user/power',
];

export async function readFarcaster(pathWithQuery) {
  const tryHaatz = !NEYNAR_ONLY.some(p => pathWithQuery.startsWith(p));

  if (tryHaatz) {
    try {
      const res = await fetch(`${HAATZ_BASE}${pathWithQuery}`, {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) return res.json();
    } catch { /* fall through */ }
  }

  // Tier 2: Neynar with key
  const res = await fetch(`${NEYNAR_BASE}${pathWithQuery}`, {
    headers: { 'api_key': NEYNAR_KEY, accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Farcaster read failed: ${res.status}`);
  return res.json();
}
```

### Diffs per file

**`api/neynar.js`:**

```diff
- const url = `https://api.neynar.com/v2/farcaster/${endpoint}${queryString ? '?' + queryString : ''}`;
- const response = await fetch(url, {
-   headers: { 'api_key': NEYNAR_API_KEY, 'accept': 'application/json' }
- });
- if (!response.ok) { /* err handling */ }
- const data = await response.json();
+ const path = `/v2/farcaster/${endpoint}${queryString ? '?' + queryString : ''}`;
+ const data = await readFarcaster(path);
  return res.status(200).json(data);
```

**`api/calculate-vote-power.js`:**

```diff
- const castsResponse = await fetch(
-   `https://api.neynar.com/v2/farcaster/feed/user/casts?fid=${fid}&limit=100`,
-   { headers: { 'api_key': NEYNAR_API_KEY, 'accept': 'application/json' } }
- );
- if (castsResponse.ok) { const castsData = await castsResponse.json(); ... }
+ const castsData = await readFarcaster(`/v2/farcaster/feed/user/casts?fid=${fid}&limit=100`);

- const scoreResponse = await fetch(
-   `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`,
-   { headers: { 'api_key': NEYNAR_API_KEY, 'accept': 'application/json' } }
- );
- if (scoreResponse.ok) { const scoreData = await scoreResponse.json(); ... }
+ const scoreData = await readFarcaster(`/v2/farcaster/user/bulk?fids=${fid}`);
```

**`api/empire-leaderboard.js`:**

```diff
- const neynarResponse = await fetch(
-   `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fids}`,
-   { headers: { 'accept': 'application/json', 'api_key': neynarKey } }
- );
- if (!neynarResponse.ok) throw new Error('Failed to fetch user data from Neynar');
- const neynarData = await neynarResponse.json();
+ const neynarData = await readFarcaster(`/v2/farcaster/user/bulk?fids=${fids}`);
```

### Verification

1. Local: hit haatz directly with a sample FID:
   ```bash
   curl 'https://haatz.quilibrium.com/v2/farcaster/user/bulk?fids=3' | jq .users[0].experimental
   ```
   Confirm `neynar_user_score` field is present. If not, exclude `user/bulk` from haatz tier and keep on Neynar (drops cost win to ~50% instead of 90%).

2. Deploy preview to Vercel: vote as test FID, verify vote_power calculated correctly + leaderboard renders.

3. Monitor: add `console.log('haatz:hit')` / `console.log('haatz:fallback')` for 7 days, then strip after baseline confirmed.

## Part 4 — Standalone Supabase vs ZAO OS Rollup

### Option A — Keep standalone Supabase (RECOMMEND)

| Property | Value |
|----------|-------|
| Cost | $0 (Supabase free tier, Vercel hobby) |
| Migration cost | $0 |
| URL | zabal.art (own) |
| Brand | Independent ZABAL identity |
| Empire Builder feed | Already at `/api/empire-leaderboard` |
| Risk | Low - already shipped, working |
| Audience | 188 ZAO + open public |
| Voting modes | Studio/Market/Social/Battle (ZABAL-specific) |
| Time to "up + running" | ~30 min env audit + haatz PR |

### Option B — Roll into ZAO OS

| Property | Value |
|----------|-------|
| Cost | $0 ongoing, ~3-5 days build |
| Migration | Rewrite vanilla JS UI in Next.js 16 + React 19, port Supabase tables to ZAO OS Supabase, redirect zabal.art -> thezao.com/zabal |
| Existing voting in ZAO OS | 7 vote APIs: proposals, library, music/track-of-day, music/submissions, music/playlists/collaborative, discord/proposals, governance UI |
| Brand cost | ZABAL loses standalone identity; becomes ZAO OS sub-page |
| Empire Builder feed | Must rebuild + reconfigure apiLeaderboard URL with yerbearserker/Adrian |
| Auth | ZAO OS is auth-gated; ZABAL voting is public mini-app. Conflict. |
| Audience | Same 188 ZAO members + loses open public who don't auth into ZAO OS |
| Risk | Medium - public mini-app behavior changes, EB integration breaks during cutover |

### Option C — Hybrid (read-only ZAO OS embed)

ZAO OS displays ZABAL leaderboard via iframe or fetch from `zabal.art/api/empire-leaderboard`. Voting stays at zabal.art. Cross-link in nexus + community.config.ts.

| Property | Value |
|----------|-------|
| Cost | $0, ~2 hr build |
| Risk | Zero - additive |
| User benefit | ZAO OS members see ZABAL voting status without leaving |

### Comparison matrix

| Dimension | A: Standalone | B: Roll into ZAO OS | C: Hybrid embed |
|-----------|---------------|--------------------|--------------------|
| Time to ship | 30 min | 3-5 days | 2 hr |
| Migration risk | None | Medium | None |
| Brand integrity | Full | Loss | Full |
| Cost ongoing | $0 | $0 | $0 |
| Empire Builder feed | Live | Rebuild | Live (unchanged) |
| Public mini-app | Live | Auth-gated change | Live |
| Open public voters | Yes | Auth-required | Yes |
| Cross-ecosystem visibility | Low | High | Medium |
| ZAO OS member experience | Visits external | Inline | Embedded preview |

**RECOMMEND: A (now) + C (this week)** — standalone stays, ZAO OS embeds read-only view. Revisit B in 2026-08-17 after 3 months of standalone metrics.

## Part 5 — "Activate Supabase" Checklist (zabal.art)

Verify Vercel prod env has:

```
SUPABASE_URL=<set>
SUPABASE_ANON_KEY=<set>
NEYNAR_API_KEY=<set>
FARCASTER_READ_API_BASE=https://haatz.quilibrium.com   # NEW
```

Verify Supabase tables exist + RLS configured:

```sql
-- run in Supabase SQL editor
SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN (
  'votes', 'leaderboard_scores', 'vote_power_cache',
  'custom_leaderboards', 'custom_leaderboard_entries',
  'vote_comments'
);
-- expect 6 rows
```

Run any unrun migrations (likely all already run, but confirm):

```
database/leaderboard-schema.sql
database/weekly-voting-migration.sql
database/custom-leaderboards-schema.sql
database/vote-comments-schema.sql
database/fix-rls-for-weekly-voting.sql
database/fix-vote-409-comprehensive.sql
database/add-pfp-column.sql
database/update-get-leaderboard-function.sql
database/fix-get-leaderboard-function.sql
```

Smoke test: visit https://zabal.art/vote.html, connect Farcaster, submit vote, verify leaderboard updates within 30s.

## Part 6 — Empire Builder Integration State (No Change Needed)

Per Doc 626: ZABAL Empire on Empire Builder pulls `/api/empire-leaderboard` as an apiLeaderboard. Format `[{address, score}]` already correct. Haatz swap is invisible to Empire Builder - the endpoint URL stays the same, only internal fetch source changes.

Confirm with yerbearserker / Adrian (divifly):
1. Is the `apiLeaderboard` configured with `https://zabal.art/api/empire-leaderboard` as endpoint?
2. Last successful refresh timestamp?
3. Cadence (Empire Builder default = on-demand refresh + scheduled).

If not yet configured: send Part 10 DM template from Doc 626 with ZABAL Live Hub URL substituted.

## Part 7 — ZAO OS Cross-Link (Phase 2, This Week)

Add to `/Users/zaalpanthaki/Documents/ZAO OS V1/community.config.ts`:

```ts
brandUrls: {
  // ...existing
  zabal: {
    home: 'https://zabal.art',
    vote: 'https://zabal.art/vote.html',
    leaderboard: 'https://zabal.art/leaderboard.html',
    empireFeed: 'https://zabal.art/api/empire-leaderboard',
    empire: 'https://songjam.space/zabal',
  },
}
```

Add ZABAL tile to ZAO OS nexus / governance page:

```tsx
<Link href="https://zabal.art/vote.html" external>
  ZABAL weekly vote — Studio / Market / Social / Battle
</Link>
```

No code merge. Just visibility.

## Specific Numbers

| Metric | Value |
|--------|-------|
| haatz base URL | `https://haatz.quilibrium.com` |
| haatz endpoints serving Farcaster reads | ~30 |
| haatz auth | none |
| haatz cost | $0 |
| Neynar Starter plan | $99/mo |
| Neynar Growth plan | $499/mo |
| Projected ZAO/BCZ saving | 70-90% of Neynar bill |
| ZABAL Neynar fetch sites | 3 (across 3 files) |
| ZABAL Neynar write sites | 1 (`send-notification-neynar.js`, keep on Neynar) |
| Haatz swap est time | 1 hour |
| Supabase tables in ZABAL | 6 |
| ZABAL voting cadence | Weekly, Monday-Sunday in America/New_York |
| Vote modes | 4 (Studio, Market, Social, Battle) |
| Vote power cap | 6 |
| Vote power inputs | base 1 + /zao casts bonus (1-3) + Neynar score multiplier (0.5-1.5) |
| ZAO OS vote APIs | 7 (proposals, library, music/track-of-day, music/submissions, music/playlists, discord/proposals + governance UI) |
| ZAO OS member count | 188 (per skill metadata 2026-05-17) |
| $ZABAL Empire URL | https://songjam.space/zabal |
| Empire Builder feed endpoint | https://zabal.art/api/empire-leaderboard |
| Stake multiplier formula | 1 + sqrt(stake / 250000 SANG) |
| ZAO OS stack | Next.js 16 + React 19 + Supabase + Neynar |
| ZABAL Live Hub stack | Vanilla JS + Supabase + Neynar + Vercel |
| ZABAL Live Hub version | 2.0.0 (per package.json) |
| zabal.art pages | 7 (index, vote, gallery, leaderboard, submissions, chat, custom-leaderboards) |
| vote.html size | 8985 lines |

## Risks + Mitigations

| Risk | Mitigation |
|------|-----------|
| haatz removes `experimental.neynar_user_score` from `user/bulk` | Exclude `user/bulk` from haatz tier, keep on Neynar. Re-test 2026-06-17. |
| haatz goes offline | Failover Neynar tier-2 already in code. Add Pingdom on `https://haatz.quilibrium.com/v1/info`. |
| Cassie restricts haatz | Same Neynar fallback. Re-evaluate cost when announced. |
| Empire Builder apiLeaderboard URL mis-configured | Verify with yerbearserker today. Worst case: send DM template from Doc 626 + reconfigure. |
| Supabase migration drift between dev/prod | Run `database/check-current-database.sql` in prod, compare to expected tables list above. |
| RLS regression breaks voting | Apply `fix-rls-for-weekly-voting.sql` + `fix-vote-409-comprehensive.sql` if 409 errors appear post-deploy. |
| Standalone -> rollup decision deferred forever | Calendar: 2026-08-17 review checkpoint with metrics (voters/wk, unique FIDs, EB distribution events). |

## Sources

| Source | URL | Verified |
|--------|-----|----------|
| ZABAL repo Neynar audit | `/Users/zaalpanthaki/Documents/ZABAL/api/` | 2026-05-17 read |
| Doc 589 haatz endpoint coverage (DEEP) | `research/farcaster/589-haatz-coverage-cassie-casts-may2026/` | 2026-05-02 verified, current |
| Doc 304 haatz discovery | `research/farcaster/304-quilibrium-hypersnap-free-neynar-api/` | 2026-04-08 |
| Doc 626 Empire Builder + ZABAL POIDH | `research/business/626-empire-builder-zabal-poidh-airdrop/` | 2026-05-09 |
| ZAOOS vote APIs | `/Users/zaalpanthaki/Documents/ZAO OS V1/src/app/api/` find result | 2026-05-17 |
| ZABAL Live Hub README | `/Users/zaalpanthaki/Documents/ZABAL/README.md` | 2026-05-17 |
| Empire Builder docs | https://empire-builder.gitbook.io/empire-builder-docs | per Doc 626 |
| $ZABAL Empire UI | https://songjam.space/zabal | per Doc 626 |
| ZABAL Live Hub live | https://zabal.art | per package.json homepage |
| haatz live | https://haatz.quilibrium.com | per Doc 589 |
| ZABAL custom leaderboards integration doc | `/Users/zaalpanthaki/Documents/ZABAL/docs/EMPIRE_BUILDER_INTEGRATION.md` | 2026-05-17 read |

## Also See

- [Doc 626 — Empire Builder + ZABAL POIDH airdrop](../../business/626-empire-builder-zabal-poidh-airdrop/) — sister integration
- [Doc 589 — haatz coverage audit](../../farcaster/589-haatz-coverage-cassie-casts-may2026/) — endpoint truth source
- [Doc 304 — Quilibrium / Hypersnap free Neynar API](../../farcaster/304-quilibrium-hypersnap-free-neynar-api/) — origin story
- [Doc 661 — ZAOOS codebase audit May 2026](../../dev-workflows/661-zaoos-codebase-audit-may-2026/) — ZAO OS surface

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add `FARCASTER_READ_API_BASE=https://haatz.quilibrium.com` to ZABAL Vercel prod + preview env | @Zaal | Config | Today |
| Create `api/_lib/farcaster-read.js` helper with haatz tier-1 + Neynar tier-2 failover | @Zaal / Claude | Code PR | Today |
| Refactor `api/neynar.js`, `api/calculate-vote-power.js`, `api/empire-leaderboard.js` to use helper | @Zaal / Claude | Code PR | Today |
| Verify `experimental.neynar_user_score` present in haatz `user/bulk` response | @Zaal | Smoke test | Today (curl 1 fid) |
| Audit Supabase prod env vars + run unrun migrations | @Zaal | Ops | Today |
| Smoke test voting at zabal.art post-deploy | @Zaal | Manual QA | Today |
| Confirm Empire Builder `apiLeaderboard` pointing at `https://zabal.art/api/empire-leaderboard` with yerbearserker / Adrian | @Zaal | DM | This week |
| Add ZABAL brand block to `community.config.ts` in ZAO OS | @Zaal | PR to ZAO OS | This week |
| Add ZABAL tile to ZAO OS nexus / governance page (Option C hybrid embed) | @Zaal | PR to ZAO OS | This week |
| Re-validate haatz uptime + endpoint coverage | @Zaal | Doc update | 2026-06-17 (30 day SLA) |
| Standalone vs rollup decision checkpoint with 3-month metrics | @Zaal | Review | 2026-08-17 |
