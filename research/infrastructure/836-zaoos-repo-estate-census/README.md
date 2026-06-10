---
topic: infrastructure
type: audit
status: research-complete
last-validated: 2026-06-10
superseded-by:
related-docs: 819, 601, 471
original-query: "can we do a full overview of this repo and how it all works look through all our git commits aswell and confirm what we have updated what is missing and we still need to build - a status on all the different parts of the repo. Plus a read-only Vercel + Supabase token census mapping projects to repos into a costed kill-list, and add that access to the repo."
tier: STANDARD
---

# Doc 836 - ZAOOS Repo + Estate Census

> **Goal:** Full overview of the ZAOOS monorepo (what is built, in flight, missing) plus a live census of the paid Vercel + Supabase estate mapped to repos, with a kill-list. The cloud half is reproducible via `scripts/estate-audit/audit.sh`.

## Key Decisions

| # | Decision |
|---|----------|
| 1 | KILL 54 dead Vercel projects (no deploy in 90+ days). Biggest cluster: 12 old NEXUS iterations (`nexusv-4` -> `nexusv-5-8-5`) + ~5 duplicate projects pointing at the same repo. |
| 2 | DELETE the 2 INACTIVE Supabase projects (`zaalp99@gmail.com's Project`, `supabase-chestnut-pebble`) once confirmed no data is needed - they are auto-paused, cost $0, deletable. |
| 3 | KEEP the 32 live Vercel projects + 2 active Supabase projects (ZAOOS, ZAO STOCK). |
| 4 | FIX the CLAUDE.md / project-map drift: it claims a `contracts/` Solidity dir that does not exist on disk. All contracts are external addresses in `community.config.ts`. |
| 5 | CLOSE the biggest code gap: 38 of 54 API domains have no `__tests__`. Test debt, not comment debt (whole-repo TODO count is ~10). |
| 6 | $ caveat: neither Vercel nor Supabase public API exposes per-project spend. This census flags liveness; dollar cross-check is manual against the usage dashboards. |

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
| API route handlers | 302 across 54 domains |
| React components | ~360 across 34 feature groups |
| Custom hooks | 18 |
| lib domains | 41 |
| Audio providers | 9 (+ tests) |
| SQL files in scripts/ | 129 (3 live, rest archived) |
| Research docs | ~1,234 markdown across 18 categories |

## 3. Backend - API surface (302 routes / 54 domains)

Largest: music (39), admin (29), auth (21), users (15), social (13), spaces
(12), cron (11), publish (10), chat (10), discord (8). Every route has a real
handler; no stubs. 16 of 54 domains have tests - the 38 untested = the biggest
correctness gap.

## 4. Frontend - components / hooks / lib

Biggest subsystems: music (64 components), spaces (58), social (22), admin (21),
chat (18), plus an "os" phone shell. 9 audio source providers behind one
PlayerProvider. lib spans agents, publish (8 platforms), spaces, music, hats,
wavewarz, empire-builder + infra.

## 5. Agent stack (bot/)

Matches the locked 5-surface model (doc 601), all updated 2026-06-09: ZOE
concierge (44 files), Hermes fix-PR (13), ZAO Devz (minimal), Teams (attabotty/
magnetiq personas), root ZAOstock bot. Treasury agents VAULT/BANKER/DEALER in
`src/lib/agents/` are thin wrappers over a shared runner. Confirmed dead and NOT
in active code: openclaw, Composio AO, Agent Zero, 7-agent squad, 10-bot fleet.

## 6. What is missing / half-built

UI-complete-backend-missing: music NFT mint (Arweave not wired), ambient mixer,
Kick connect, festival photos. Disabled: Lens + Hive publishing, OpenRank (their
SSL expired Mar 2026). Real TODOs: agent dead-letter queue (events.ts:24,
doc-457), OrDAO partial ABI, `music/generate` no rate limit, miniapp auth
consolidation. Drift: `contracts/` dir claimed by map but absent.

## 7. The paid estate - CENSUS COMPLETE (2026-06-10)

Run with read-only, short-lived tokens via `scripts/estate-audit/audit.sh`.
Raw dumps in `~/.zao/private/` (off-repo). Tokens revoked post-run.

### Vercel - 86 unique projects: 32 live, 54 dead

(A "project" is counted once after dedup-by-id; the API returns each under both
personal scope and the `bettercallzaals-projects` team.)

Dead = no deployment in 90+ days. Notable waste:
- **12 old NEXUS iterations** (`nexusv-4` through `nexusv-5-8-5`), all dead since
  July 2025. Only live `zaonexus` is current. Kill all 12.
- **Duplicate projects, same repo:** `16statestreet` x3, `unifiedchatclient` x2,
  `followingchurn` x2. ~5 extra projects that are pure dupes.

Full 54-project kill-list (name <- linked repo), newest-dead first:
resumev-1, bettercallzaal-coding-hub, zounz, zski, ww, 16statestreet (x3),
bettercallzaal-strategies, ethboulderjournal, zao-stock, zabalbot,
zao-leaderboard, zabalnewsletter, zabalsocials, agencyweb3toolkit, zaoprojects,
zaaltimelinev1, zaaltimelinev1-1, v0-solana-governance-d-app,
v0-zao-music-marketplace-v1, unifiedchatclient (x2), cedartide,
fractalbotnov2025, wwinfo1, artivisminmaine1, wwtest1, nexusv-4 ... nexusv-5-8-5
(12), avaxpayments-v1, sideby-sidev2, v0-billable, monorepo-turborepo,
whatgenreareyou, soundz-v1, followingchurn (x2), followertest, loanz-platform-1.

32 live (keep): zaoos, zao-video-editor, zaonexus, bettercallzaalwebsite, zpoidh,
zuke, co-c-concert-z, zaofractal, zabalart, zlank, riverside-group-demo, bcz-yapz,
zaostock, imanprojects, wavewarzapp, farmdrop, zaal-donate-button, ltaesnap,
crownvics, fishbowlz, duodo-snap, nouns-snap, zabalsnap1, aurdour, textsplitter,
b-zbuild-2, plus 6 `v0-*` scratch deploys.

### Supabase - 4 projects: 2 active, 2 inactive

| Project | Status | Created | Region |
|---------|--------|---------|--------|
| ZAOOS | ACTIVE_HEALTHY | 2026-03-12 | us-west-2 |
| ZAO STOCK | ACTIVE_HEALTHY | 2026-04-29 | us-west-2 |
| zaalp99@gmail.com's Project | INACTIVE | 2025-12-26 | us-east-1 |
| supabase-chestnut-pebble | INACTIVE | 2026-02-27 | us-east-1 |

INACTIVE = Supabase auto-paused (free-tier idle pause). Paused = $0, data
retained, deletable. The cowork tracker DB (`etwvzrmlxeobinrlytza`) is NOT here -
it lives under Iman's account.

### $ gap (both)

No per-project spend or DB size via either public API. Cross-check:
- Vercel usage: https://vercel.com/account/usage
- Supabase usage: https://supabase.com/dashboard/org/_/usage
- Supabase DB size: `select pg_size_pretty(pg_database_size(current_database()));`

## 8. The tooling (shipped this PR)

`scripts/estate-audit/audit.sh` + README. Lists every Vercel project (last-deploy
age -> dead flag, deduped by id, mapped to git repo) and every Supabase project
(status -> paused flag), prints kill-candidate lists. Tokens read from
`~/.zao/estate-tokens.env` (off-repo, gitignored via `*estate-tokens*`, never
printed). Raw dumps -> `~/.zao/private/` per `.claude/rules/pii-hygiene.md`. Bug
fixed during this run: bash-subshell comma corruption in JSON assembly -> rewrote
to JSONL + `jq -s unique_by(.id)`.

## 9. Bottom line

Production-grade, extremely active repo. Backend fully implemented, frontend
broad, agent stack matches the locked model with no zombie code. Real gaps:
(1) test coverage on ~70% of API domains, (2) a few UI-complete-backend-missing
features, (3) agent dead-letter queue, (4) 54 dead Vercel projects + 2 paused
Supabase projects to clean up. The cloud estate is now censused and reproducible.

## Also See

- [Doc 819](../../agents/) - ZAOcowork architecture audit (sibling infra audit)
- [Doc 601](../../agents/601-agent-stack-cleanup-decision/) - locked 5-surface agent model
- [Doc 471](../../security/471-vercel-oauth-breach-apr2026/) - prior Vercel-side incident

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Delete 54 dead Vercel projects (start with 12 NEXUS + 5 dupes) | @Zaal | Manual (Vercel dashboard) | Next cleanup |
| Delete 2 INACTIVE Supabase projects after confirming no data needed | @Zaal | Manual (Supabase dashboard) | Next cleanup |
| Cross-check live projects against Vercel usage dashboard for bandwidth/cron spend | @Zaal | Manual | Optional |
| Fix CLAUDE.md / project-map `contracts/` drift (dir does not exist) | @Zaal | PR | Next docs pass |
| Schedule test-coverage push for the 38 untested API domains | @Team | Planning | Backlog |

## Sources

- [FULL] Vercel REST API `/v9/projects` + `/v2/teams` - censused 2026-06-10, 86 unique projects (raw dump `~/.zao/private/vercel-estate-20260610-155641.json`)
- [FULL] Supabase Management API `/v1/projects` - censused 2026-06-10, 4 projects (raw dump `~/.zao/private/supabase-estate-20260610-160236.json`)
- [FULL] ZAOOS git history + working tree - 2,659 commits, scanned 2026-06-09 via 5 parallel exploration agents
- [FULL] `scripts/estate-audit/audit.sh` - the reproducible census tool shipped in this PR
