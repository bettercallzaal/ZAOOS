---
topic: wavewarz
type: audit
status: research-complete
last-validated: 2026-08-12
superseded-by:
related-docs: 1076, 1605, 1078, 2078
original-query: "lets do a deep research on https://wavewarz.info/ we have 3 sites one for each of the founders wavewarz.com by hurricane (the actual dapp) safety features etc. wavewarz.info is the stats app by candy toybox lots of it is open source https://wavewarz.info/api-docs and has api docs, then i wanna build wwtracker which just shows the other parts to add an extention to the wavewarz.info we can make it a sub page of tracker.wavewarz.info if we want but lets /zao-research and organize all of wavewarz things ww is propreietary and should never me shared for the actual smart contract info so we can be safe"
tier: DEEP
---

# 2267 — WaveWarZ surface map: three sites, three owners, one API

> **Goal:** Establish who owns which WaveWarZ surface, correct a wrong canonical
> map in doc 1605, document the public API, and decide where `wwtracker` should
> live.

## Key Decisions (recommendations first)

| # | Decision | Why | Owner |
|---|----------|-----|-------|
| 1 | **CORRECT doc 1605.** Its canonical map says `bettercallzaal/wwtracker` deploys to `wavewarz.info`. It does not. Verified 2026-08-12: `/api/public/stats` returns **200 on wavewarz.info** and **404 on wwtracker.vercel.app**. The repo behind wavewarz.info is **`CandyToyBox/wavewarz-intelligence`**. | Acting on 1605 would lead to the conclusion that the tracker extension already exists. It does not — they are separate apps by separate owners. | @Zaal |
| 2 | **BUILD `wwtracker` as an API consumer, not a fork.** The wavewarz.info public API is unauthenticated, CORS-open (`*`), 30-60s cached, 7 endpoints. Consume it; do not duplicate the indexing. | Zero coordination cost with Sam, no data drift, and the hard part (Solana indexing) is already solved and maintained. | @Zaal |
| 3 | **DO NOT fork `wavewarz-intelligence` — it has NO LICENSE.** Public on GitHub with no license file means all rights reserved by default. Reading it is fine; copying, forking or deriving from it is not granted. | Legal exposure with a co-founder is the worst kind. If a fork is genuinely wanted, ask Sam to add a license first — that is a five-minute conversation, not a legal problem. | @Zaal |
| 4 | **USE `tracker.wavewarz.info` only if Sam controls the apex DNS and agrees.** Otherwise ship on `wwtracker.vercel.app` and link both ways. | A subdomain implies one product and one owner. Two owners on one domain needs an explicit agreement about who can break what. | @Zaal + [[Sam]] |
| 5 | **NEVER publish `ww` internals.** The private `bettercallzaal/ww` repo holds `.env.production`, Helius setup and Solana program integration. This doc names no contract addresses, no program internals, no keys. | Standing instruction. ZAOOS is a **public** repo — anything written here is published. | @Zaal |

## The three surfaces, corrected

| Surface | Owner | Repo | Public? | What it is |
|---------|-------|------|---------|------------|
| **wavewarz.com** | [[Hurricane]] | **not public** | no | The dapp. *"Trade music battles live. Buy/sell tokens while the timer runs. Artists get paid every trade."* No public API (all `/api/*` probes return 308). Served via Cloudflare in front of Vercel. |
| **wavewarz.info** | [[Sam]] (CandyToyBox) | `CandyToyBox/wavewarz-intelligence` | **source-available, NO LICENSE** | "WaveWarZ Intelligence" — analytics, leaderboards, tournament brackets, events calendar, Clippers programme. **Owns the public API.** TypeScript, 13 MB, last push 2026-08-10. |
| **wwtracker.vercel.app** | @Zaal | `bettercallzaal/wwtracker` | public | Separate analytics dashboard off Dune. **No public API** (404s on `/api/public/*`). |

Hurricane's public repos (`hurric4n3ike`) contain only `wavewarzhomepage`,
`wavewarzhomepagev`, and `rpc-proxy` — the dapp itself is absent from GitHub,
consistent with it being proprietary.

Sam's predecessor repo `analytics-wave-warz` ("WaveWarz Artist, Trader, and Fans
Stats App", 2026-02-28) is the earlier version of the same idea.

## The public API — full spec

Base `https://wavewarz.info` · no auth · no enforced rate limit · CORS `*` ·
30-60s server-side cache · SOL amounts are plain numbers, not lamports.

| Endpoint | Params | Returns |
|----------|--------|---------|
| `GET /api/public/stats` | none | `updatedAt`, `solPriceUsd`, `volume`, `liveBattle`, `artistPayouts`, `traderClaims`, `battles` |
| `GET /api/public/battles` | `type` (main\|quick\|community), `live`, `limit` (max 200), `offset` | paginated battle feed |
| `GET /api/public/battles/:id` | path id | full battle incl. `factors` (poll votes, DJ Wavy reasoning, charts), `artistEarnings`, `battleDurationSeconds` |
| `GET /api/public/events` | `subtype` (standard\|charity\|spotlight\|prediction), `live`, `limit` | Main Events grouped from rounds (best-of-3) |
| `GET /api/public/leaderboards/artists` | `limit` (max 500) | wins/losses/draws, volume, on-chain earnings |
| `GET /api/public/leaderboards/traders` | `limit` (max 500) | SOL volume, win rate, net P&L from settlements |
| `GET /api/public/leaderboards/songs` | `limit`, `sort` (volume\|battles\|winRate) | Quick Battle songs by Audius track |

Semantics worth knowing before building on it:

- **Only one live battle exists platform-wide at any time.** `liveBattle` is a
  single object or null, not a list.
- **Quick Battles put song titles in `artist1`/`artist2`**, not artist names.
- **Main Events are best-of-3** — round winners differ from event winners.
- **Trader P&L reflects actual on-chain claims**, not recorded trades.
- **Live status is timer math**, not a flag: `now < created_at + battle_duration`.

## Live numbers — verified 2026-08-12

Pulled directly from `/api/public/stats`:

| Metric | Value |
|--------|-------|
| Total volume | **895.65 SOL / $68,652** |
| Artist payouts | **13.79 SOL / $1,057** (instant, automatic, on-chain, 1% of trades) |
| Trader claims | **392.32 SOL / $30,071** across **1,725 withdrawals** |
| Battles | **1,378** total |
| — Main Events | 51 |
| — Main battles | 167 |
| — Quick battles | 1,176 |
| — Community battles | 35 |
| SOL price used | $76.65 |
| **Last 7 days** | **12.24 SOL** |
| **Last 24 hours** | **1.30 SOL** |

### Growth, and the honest caveat

Against the figures Zaal gave in a 2026-05-19 partner call — **456 SOL volume,
7.74 SOL to artists** — lifetime volume has **roughly doubled** in three months
and artist payouts are up ~78%.

But **last-7d volume is 12.24 SOL against an 895 SOL lifetime**, and `liveBattle`
was null at the time of reading. Quick Battles carry 85% of all battle count
(1,176 of 1,378) while Main Events number only 51. **The platform is quiet right
now**, and any pitch using the lifetime number should expect the follow-up
question about current activity.

## Where wwtracker fits

wavewarz.info already covers: leaderboards (artists / traders / songs), battle
analytics, tournament brackets, events calendar, Quick Battle charts, and the
Clippers programme.

`wwtracker` currently covers, per its own README: platform treasury wallet,
program activity, and trader PnL — **backed by Dune**, which is a different data
path from the .info API (direct Solana reads).

**The non-overlapping value is the treasury and program-level view.** That is the
"other parts" worth building — not another leaderboard.

## Sources

- [wavewarz.info/api-docs](https://wavewarz.info/api-docs) — `[FULL]` — complete endpoint spec read 2026-08-12
- [wavewarz.info](https://wavewarz.info) — `[FULL]` — site sections, positioning, displayed stats
- `GET https://wavewarz.info/api/public/stats` — `[FULL]` — live JSON, 2026-08-12T10:09:38Z
- [wavewarz.com](https://wavewarz.com) — `[PARTIAL — meta tags + API probes only; app is client-rendered and was not driven with a browser]`
- `gh api repos/CandyToyBox/wavewarz-intelligence` — `[FULL]` — visibility, size, language, license=NONE, push date
- `gh api users/CandyToyBox/repos`, `gh api users/hurric4n3ike/repos` — `[FULL]` — public repo inventory per founder
- `gh api repos/bettercallzaal/wwtracker` + README — `[FULL]`
- ZAOOS doc 1605 (`1605-wavewarz-estate-audit-jul2026`) — `[FULL]` — **contains the error corrected in Decision 1**
- ZAOOS doc 1076 (`1076-wavewarz-estate-audit`) — `[FULL]`
- HTTP probes of `/api/public/stats` across four hosts — `[FULL]` — the evidence for Decision 1

**Method note:** an initial attempt to distinguish the apps by comparing page
MD5s was **unsound** — wavewarz.info renders live stats, so two fetches of the
same app differ. The endpoint-presence test (200 vs 404) is what the conclusion
rests on.

**Community source:** none. Reddit/HN/X carry no substantive WaveWarZ discussion
found in this pass; the ecosystem conversation lives on Farcaster and in the
project's own X Spaces. Recorded as a gap rather than padded.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Correct doc 1605's canonical map row for wavewarz.info. Shipped: 1605 amended + `superseded-by` or inline correction note | @Zaal | PR | 2026-08-15 |
| Ask [[Sam]] to add a LICENSE to `wavewarz-intelligence`. Shipped: LICENSE file exists in that repo | @Zaal | Message | 2026-08-15 |
| Decide `tracker.wavewarz.info` vs `wwtracker.vercel.app` with Sam. Shipped: written decision in this doc | @Zaal + Sam | Decision | 2026-08-19 |
| Point `wwtracker` at the `/api/public/*` endpoints instead of duplicating indexing. Shipped: wwtracker renders at least one panel from the .info API | @Zaal | PR | 2026-08-26 |
| Scope wwtracker to treasury + program-level views only — no duplicate leaderboards. Shipped: scope written into wwtracker README | @Zaal | PR | 2026-08-22 |

## Also See

- [Doc 1605](../1605-wavewarz-estate-audit-jul2026/) — estate audit; **its wavewarz.info row is wrong**
- [Doc 1076](../1076-wavewarz-estate-audit/) — earlier estate audit
- [Doc 1078](../1078-wwtracker-analytics-infrastructure/) — wwtracker analytics infrastructure
- [Doc 2078](../2078-wwtracker-geo-discoverability-stack/) — wwtracker GEO stack
