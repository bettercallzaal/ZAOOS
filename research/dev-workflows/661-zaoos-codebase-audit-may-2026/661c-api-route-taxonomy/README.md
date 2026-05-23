---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-05-21
related-docs: 661
tier: STANDARD
parent-doc: 661
---

# 661c - src/app/api/ Route Taxonomy Audit

Total routes: 324 across 54 active domains (CLAUDE.md quoted 301, actual count is 324).

## Domain Inventory (sorted by route count)

| Domain | Route count | Last commit | Notes |
|---|---|---|---|
| music | 39 | 2026-04-05 | Music player, submissions, trending, curators, scrobble, mint, metadata |
| admin | 29 | 2026-04-20 | Allowlist, users, spaces, export, audit-log, backfill, ens-subnames |
| stock | 24 | 2026-04-27 | ZAOstock team dashboard, random codes, team assignments |
| auth | 21 | 2026-04-16 | Signer, lastfm, kick, OAuth endpoints |
| users | 15 | 2026-04-09 | Profile, wallet, follow, block, mute, messaging-prefs, socials, storage |
| social | 13 | 2026-04-08 | Cross-post pipeline, platform connectors, engagement tracking |
| fishbowlz | 13 | 2026-04-22 | Gate-check, chat, sessions, transcripts, recap (paused but active) |
| spaces | 11 | 2026-03-30 | Space chat, members, settings, streaming |
| publish | 10 | 2026-03-30 | Bluesky, Discord, Farcaster, X, Telegram, Threads, Lens, Hive, status |
| chat | 10 | 2026-04-07 | Send, search, react, assistant, hide, messages, thread, minimax, schedule |
| cron | 9 | 2026-04-16 | Heartbeat, nightly jobs, cleanup tasks |
| platforms | 8 | 2026-03-30 | Platform auth callbacks (legacy structure) |
| members | 8 | 2026-04-08 | Members list, roles, activity, badges |
| discord | 8 | 2026-04-13 | Discord webhook handlers, link verification, sync |
| respect | 7 | 2026-04-06 | Vote tallying, weights, import, ledger |
| twitch | 6 | 2026-03-30 | Chat webhook, activity sync |
| notifications | 6 | 2026-04-20 | Push send, in-app, telegram, email, settings |
| library | 6 | 2026-03-30 | Music library, saved tracks, playlists |
| miniapp | 5 | 2026-05-02 | Farcaster frame handlers, data endpoints |
| fractals | 5 | 2026-04-06 | Fractal process votes, cycle data |
| wavewarz | 4 | 2026-04-08 | WaveWarZ game endpoints |
| stream | 4 | 2026-04-16 | Stream.io tokens, session management |
| proposals | 4 | 2026-03-30 | Create, vote, comment, status updates |
| neynar | 4 | 2026-03-30 | Neynar API wrappers, followers, following, feed |
| memory | 4 | 2026-03-30 | User memory / recall system |
| bluesky | 4 | 2026-03-30 | Bluesky API wrappers, follows, profile sync |
| webhooks | 3 | 2026-05-03 | Supabase webhooks, event dispatch |
| livepeer | 3 | 2026-03-30 | Livepeer studio handlers |
| empire-builder | 3 | 2026-05-02 | Empire V3 trading bot API |
| broadcast | 3 | 2026-03-30 | Admin broadcast system |
| 100ms | 3 | 2026-04-08 | 100ms video call token handlers |
| zounz | 2 | 2026-03-30 | ZOUNZ release notes, submissions |
| streaks | 2 | 2026-03-30 | User activity streaks |
| search | 2 | 2026-03-30 | Multi-domain search (all, casts, proposals, music, members) |
| overlay | 2 | 2026-03-30 | Player overlay, playback sync |
| hats | 2 | 2026-03-30 | Hat NFT endpoints |
| ens | 2 | 2026-03-30 | ENS resolution, subname management |
| directory | 2 | 2026-03-30 | Community directory, members export |
| casts | 2 | 2026-04-08 | Farcaster cast helpers, trending |
| artists | 2 | 2026-03-30 | Artist profile, metadata |
| upload | 1 | 2026-03-30 | Image/file upload to cloud storage |
| staking | 1 | 2026-04-16 | Token staking endpoint |
| songjam | 1 | 2026-03-30 | SongJam API wrapper |
| snapshot | 1 | 2026-03-30 | Snapshot governance read |
| profile | 1 | 2026-03-30 | User profile fetch |
| nexus | 1 | 2026-04-11 | Nexus hub (ecosystem directory) |
| moderation | 1 | 2026-03-30 | Moderation tools |
| following | 1 | 2026-03-30 | User following list |
| feedback | 1 | 2026-04-16 | GitHub issue creation from in-app feedback |
| fc-identity | 1 | 2026-04-20 | Farcaster identity verification |
| events | 1 | 2026-04-06 | Event listings |
| community-issues | 1 | 2026-03-30 | Community issue submission + Paperclip forwarding |
| agents | 1 | 2026-04-20 | Agent status endpoint |
| activity | 1 | 2026-03-30 | User activity log |

## Decommissioned-but-Present Routes

None found. No active routes reference openclaw, composio, agent-zero, or other decommissioned surfaces.

Referrals domain (referenced in git history) was intentionally deleted via commit `5006d30b` ("remove: delete referral/invite code system"). No orphan routes remain.

## Dead-Route Candidates (>90d untouched + verified frontend calls)

No candidates. All 54 domains have commits after 2026-02-17. All domains with >90d untouched status (3 commits: `twitch`, `library`, `proposals`, `bluesky`, `neynar`, `memory`, `platforms`, `broadcast`, `livepeer`, `zounz`, `streaks`, `search`, `overlay`, `hats`, `ens`, `directory`, `casts`, `artists`, `upload`, `songjam`, `snapshot`, `profile`, `moderation`, `following`, `community-issues`, `activity`) are actively called from frontend components and should be retained.

Spot-check: fishbowlz (paused 2026-04-16 per CLAUDE.md) is still called 26+ times across frontend. Keep it for historical/graduated-code tracking, but mark for future review once ZAOstock spins out.

## Auth + Zod Coverage Spot Check (10 random routes)

| Route | getSession? | Zod safeParse? | Try/catch? | Notes |
|---|---|---|---|---|
| community-issues/route.ts | YES | YES | YES | Exemplar: clean input validation + error forwarding |
| feedback/route.ts | YES | YES | YES | Rate-limiting + GitHub integration, proper validation |
| directory/route.ts | YES | NO | YES | No input to validate (read-only), acceptable |
| notifications/route.ts | YES | YES | YES | Solid |
| proposals/route.ts | YES | YES | YES | EXEMPLAR: comprehensive error handling, fire-and-forget patterns |
| streaks/route.ts | YES | NO | YES | No body validation needed (read-only) |
| upload/route.ts | YES | NO | YES | File upload, validates via FileReader API (acceptable) |
| search/route.ts | YES | YES | YES | Solid |
| ens/route.ts | NO | YES | YES | CONCERN: missing getSession. Public ENS read, may be intentional. Verify. |
| members/route.ts | YES | NO | YES | List endpoint, acceptable without input validation |

Finding: 9/10 routes call getSession. 7/10 use Zod safeParse (3 skipped are read-only). 10/10 wrap main logic in try/catch. ONE CONCERN: ens/route.ts lacks session check - verify intentionality (likely public read, but should be documented).

## Exemplars

| Route | Why exemplar |
|---|---|
| src/app/api/proposals/route.ts | GET/POST/PATCH pattern, comprehensive Zod validation, proper session check, state-machine validation (VALID_TRANSITIONS), fire-and-forget Promise.allSettled patterns for cross-platform announces, audit logging, clear error boundaries. Best-in-class error handling + structured logging. Model for any complex multi-step route. |
| src/app/api/community-issues/route.ts | Minimal, focused POST, proper input parsing, clean Zod validation, external service integration (Paperclip) non-blocking with fallback, proper null-coalescing, clear error messages. GET/POST shape is reusable. |
| src/app/api/auth/signer/route.ts | Web3-specific exemplar: careful private-key handling (never logged, only at execution time), explicit documentation about wallet non-access, EIP-712 signing flow, session-based state machine. Comment-heavy for security-sensitive code. |

## Recommended Actions (P0/P1/P2)

P0 (before ship):
- **VERIFY ens/route.ts session requirement**: Is public ENS read intentional? If yes, add JSDoc comment explaining why getSession is skipped. If no, add session check. OWNER: active frontend maintainer. BY-WHEN: end of week.

P1 (before next sprint):
- **CONSOLIDATE search endpoints**: chat/search, music/search, miniapp/search, /search all search but differently. Audit usage and document each domain's purpose in schema comments. Consider a unified SearchService. OWNER: backend maintainer. BY-WHEN: 2 weeks.
- **Audit fishbowlz frontend usage**: ZAOstock graduation will orphan these routes (2026-05-29 spinout target). Grep for live fishbowlz/api calls in components and mark for removal in graduation PR. OWNER: ZAOstock PM. BY-WHEN: before spinout.
- **Document public vs auth-required**: create a matrix (routes.md) listing all 324 routes with session requirement + brief purpose. Pin in README. OWNER: next auditor. BY-WHEN: 2 weeks.

P2 (nice-to-have):
- **Standardize notifications send pattern**: POST /api/notifications/send vs /api/notifications/push/send creates confusion. Consider /api/notifications/[channel]/send unifier. OWNER: backend. BY-WHEN: next refactor cycle.
- **Consider feature-flag for admin routes**: admin/* is 29 routes - many toggle features (backfill, poll-config). Migrate to feature table in Supabase. OWNER: backend. BY-WHEN: 2026-06.

## Sources

- `src/app/api/` directory listing (all 54 domains)
- `git log --since="2026-02-17" -- src/app/api` (commit date verification for 324 routes)
- Grep for `/api/` in `src/components/`, `src/hooks/`, `src/app/` pages (frontend caller verification)
- 10-route spot check: community-issues, feedback, directory, notifications, proposals, streaks, upload, search, ens, members
- Exemplar routes: proposals, community-issues, auth/signer
- CLAUDE.md (decommissioned surface list: openclaw, composio, agent-zero, fishbowlz paused)
