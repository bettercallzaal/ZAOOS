# Doc 836 - ZAOOS Repo + Estate Census

Date: 2026-06-09
Status: Living snapshot (regenerate via `scripts/estate-audit/audit.sh` for the cloud half)
Scope: Full overview of the ZAOOS monorepo - what it is, what is built, what is in flight, what is missing - plus the tooling to census the paid Vercel/Supabase estate.

## 1. What this repo is

ZAOOS is "the lab" for The ZAO ecosystem. Started as a gated Farcaster social
client (188 members on Base), grew into a monorepo where many ZAO experiments
live side by side. Things graduate to their own repo when production + public +
new-user ready; on graduation the code is deleted from ZAOOS so there is no
drift. Research stays forever (institutional memory).

Stack: Next.js 16.2, React 19.2, Supabase (Postgres + RLS), Neynar + Farcaster
hub, XMTP, Stream.io / 100ms (video), Wagmi 2 / Viem 2, Solana web3.js, Arweave,
Tailwind v4, iron-session, Capacitor 8 (iOS/Android), Biome + Vitest +
Playwright, Sentry.

## 2. Repo scale (measured 2026-06-09)

| Metric | Value |
|--------|-------|
| Total git commits | 2,659 (since 2026-03-12) |
| Commits, last 30 days | 752 (~25/day) |
| Merged PRs, last 90 days | ~522 |
| Merged PRs, last 30 days | ~274 |
| API route handlers | 302 across 54 domains |
| React components | ~360 across 34 feature groups |
| Custom hooks | 18 |
| lib domains | 41 |
| Audio providers | 9 (+ tests) |
| SQL files in scripts/ | 129 (3 live, rest archived) |
| Research docs | ~1,234 markdown across 18 categories |
| Contributors | Zaal (dominant) + Claude/agents (~190 agent commits) |

## 3. Backend - API surface (302 routes / 54 domains)

Largest domains: music (39), admin (29), auth (21), users (15), social (13),
spaces (12), cron (11), publish (10), chat (10), discord (8).

Coverage: 16 of 54 domains have `__tests__` (admin, auth, crm, hats, juke,
members, music, notifications, proposals, search, snapshot, spaces, streaks,
users, wavewarz, 100ms). 38 domains have no dedicated tests - the biggest
correctness gap in the repo.

Status: every route has a real handler. No stub/dead endpoints. Graceful
degradation throughout (discord -> 503 when unconfigured, fractals -> on-chain
fallback when ornode down, music/generate -> mock when HF_TOKEN missing).

## 4. Frontend - components / hooks / lib

Biggest subsystems: music (64 components), spaces (58), social (22), admin (21),
chat (18). Plus an "os" shell (phone shell, app drawer, dock, widgets).

lib highlights: agents (autonomous treasury), publish (8-platform posting),
spaces (Juke + RTMP + gating), music (filters, waveform, Audius/LastFM/Tidal/
Songlink), hats, wavewarz, empire-builder, plus infra (db, auth, farcaster, ens,
wagmi, xmtp, validation, security).

Audio: 9 source providers (HTML5, Spotify, Apple Music, YouTube, Soundcloud,
Tidal, Bandcamp, Radio) behind a single PlayerProvider.

## 5. Agent stack (bot/)

Matches the post-doc-601 "5 surfaces" model. All updated 2026-06-09.

| Subsystem | Path | Status |
|-----------|------|--------|
| ZOE concierge | `bot/src/zoe/` | Active. 44 files - memory (25KB), proactive, decompose/dispatch, scheduler, critics, posts, farcaster, safety |
| Hermes (fix-PR) | `bot/src/hermes/` | Active. 13 files - runner, claude-cli, coder, critic, git, pr-watcher, preflight |
| ZAO Devz | `bot/src/devz/` | Active but minimal (index.ts 18KB). Phase-3 fold into Hermes still pending |
| Teams (attabotty, magnetiq) | `bot/src/teams/` | Active. Persona blocks, shared brain/memory |
| Fleet-agent | `bot/src/fleet-agent/` | Lightweight runner (3.4KB) |
| Root bot (ZAOstock) | `bot/src/*.ts` | Active. index.ts 50KB dispatcher + actions/digest/circles/status |

On-chain treasury agents live in `src/lib/agents/` (VAULT / BANKER / DEALER),
all thin wrappers over a shared `runner.ts` (buy -> burn -> stake cycle, 0x
swaps, config-driven spend caps). Trading is gated by `config.trading_enabled`.

Confirmed dead/decommissioned (per doc 601, NOT in active code): openclaw,
Composio AO, Agent Zero, the 7-agent squad, 10-bot branded fleet. Only
historical comments remain.

## 6. Contracts

No `.sol` files / no `contracts/` dir in the repo (the project map lists one,
but it is not present - all contract interaction is against external addresses
configured in `community.config.ts`): Respect tokens OG+ZOR on Optimism, Hats
Protocol v1 (treeId 226), ZOUNZ Nouns Builder DAO on Base, Snapshot (zaal.eth).

DRIFT NOTE: CLAUDE.md / project map claims a `contracts/` directory with
Solidity (staking, bounty board). It does not exist on disk. Either it
graduated out or never landed - update the map.

## 7. What is in flight (last 60 days churn)

Most-churned dirs: `src/app/stock/team` (150), `docs/daily` (150),
`bot/src/zoe` (135), `scripts` (100), `content/transcripts/bcz-yapz` (86),
`src/components/spaces` (57), `bot/src/hermes` (51), `src/lib/agents` (48).

Active threads:
- ZAOstock spinout prep (stock/team) - graduates to its own repo/DB/domain.
- Agent stack (ZOE 135 + Hermes 51 + lib/agents 48 = 234 changes).
- Spaces/Juke hardening (ghost cleanup, live counts, room-id persist, pinned
  links) + FISHBOWLZ removal.
- CRM moved Supabase-native (away from Airtable; migrations 20260529 / 20260531).
- Research capture at ~1.5 docs/day.

## 8. What is missing / half-built (the honest gaps)

Feature-incomplete (UI exists, backend not wired):
- Music NFT minting - `MintTrack.tsx:110` throws "Arweave minting not yet
  configured"; Arweave backend not deployed.
- Ambient Mixer - "coming soon" placeholder (`AmbientMixer.tsx:286`).
- Kick connect - "coming soon" (`KickConnect.tsx:136`).
- Festivals photos - "coming soon" (`festivals/page.tsx:117`).

Disabled integrations:
- Lens + Hive publishing commented out in `PlatformToggles.tsx` (wallet
  complexity / deferred, ref research/121).
- OpenRank engagement scoring off - their SSL cert expired Mar 2026
  (`members/[username]/route.ts:164`).
- Tidal / Sopha silently null when unconfigured.

Real TODOs worth tracking:
- Agent event dead-letter queue not wired (`lib/agents/events.ts:24`,
  doc-457) - failed agent events are dropped.
- OrDAO client uses a partial ABI pending `@ordao/contracts` npm publish.
- `music/generate` has no per-user rate limit on an expensive AI call.
- miniapp auth: two routes need consolidation onto QuickAuth JWT
  (`miniapp/auth-context/route.ts:13`) - currently accepts unsigned FID claims
  (hardened against admin-grant, but still a refactor owed).
- ZOE scheduler Phase-4 tip generation is a stub (`scheduler.ts:247`).

Test debt: 38 of 54 API domains untested; whole-repo TODO/FIXME count is low
(~10) so debt is concentrated in coverage, not littered comments.

Stale branches: ~50 April worksession branches on origin, abandoned, safe to
prune.

## 9. The paid estate (Vercel + Supabase) - tooling shipped, run pending

The cloud-cost half of this census needs read-only tokens that are not yet on
the machine. Tooling is shipped at `scripts/estate-audit/`:

- `audit.sh` lists every Vercel project (per scope, with last-deploy age ->
  dead flag) and every Supabase project (status -> paused/abandoned flag),
  maps Vercel projects to their linked git repo, and prints a kill-candidate
  list for each.
- Tokens read from `~/.zao/estate-tokens.env` (off-repo, gitignored, never
  printed). Raw dumps -> `~/.zao/private/` per pii-hygiene rules.
- API gap: neither Vercel nor Supabase public API returns per-project $ spend
  or DB size. The script flags liveness; dollar cross-check is manual against
  the usage dashboards (documented in the script output + README).

To run: create 1-day read-only tokens, write the env file, then
`bash scripts/estate-audit/audit.sh`. Revoke both tokens after (Supabase PATs
are account-wide).

## 10. Bottom line

The repo is production-grade and extremely active. Backend is fully
implemented, frontend is broad, the agent stack matches the locked 5-surface
model with no zombie code. Real gaps are: (1) test coverage on ~70% of API
domains, (2) a handful of UI-complete-but-backend-missing features (music mint,
ambient mixer, a few connectors), (3) agent event dead-letter queue, (4) the
cloud-cost kill-list still needs tokens to run. The institutional-memory bet
(1,234 research docs) is paying off - this census was assembled almost entirely
from the repo itself.
