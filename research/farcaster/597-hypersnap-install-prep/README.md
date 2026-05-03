---
topic: farcaster
type: decision
status: research-complete
last-validated: 2026-05-03
related-docs: 309, 489, 586, 587, 596
tier: STANDARD
---

# 597 — Hypersnap Install Reality Check (Pre-Purchase Decision)

> **Goal:** Before clicking "buy VPS" for Hypersnap install, validate 4 things: Issue #17 actual scope, real hardware requirements, VPS option fit, ZAO codebase migration delta. Plain-English go/no-go.

## Plain-English TL;DR

| Question | Answer | What it means |
|---|---|---|
| Is Hypersnap Issue #17 still the right warm-intro PR? | **CHANGED — Issue #17 is now a complete PR by @stephancill, sitting unmerged with 0 comments since 2026-04-29.** Tests included. | Don't build it. Either review/co-sign that PR, or pick adjacent work (e.g., document the undocumented Tantivy full-text search endpoint). |
| Which VPS should we buy? | **Hetzner AX42 ($48-58/mo)** — 64GB RAM, 16-core, 2TB NVMe. | Has 2x headroom over what Hypersnap needs. Won't OOM under FarCon-week load. |
| How hard is the install? | **2 commands + 2-3 hour sync.** | Trivial. Cassie's bootstrap script does everything. |
| Does ZAO need to rewrite code to use Hypersnap? | **NO. Zero code changes.** | `src/lib/farcaster/neynar.ts` already has Hypersnap-failover logic. Set `FARCASTER_READ_API_BASE=http://vps1:3381` env var, redeploy. |
| What can Hypersnap NOT do? | **Posting casts, signer management, follow/unfollow.** | Those stay on Neynar. Reads = Hypersnap (with Neynar fallback). Writes = Neynar only. |
| Should we install this weekend? | **Yes, but reframed.** Install is fine. Warm-intro PR strategy needs to pivot. | See "Reframed warm-intro path" below. |

## A) Issue #17 Actual Scope

**Big finding: Issue #17 is now a PR, not an open task.**

| Fact | Detail |
|---|---|
| Title | "Fix `GET /v2/farcaster/notifications` so it returns replies/mentions, reactions, and follows with hydrated casts and proper pagination" |
| Author | @stephancill (Snapchain/Farcaster core dev) |
| Created | 2026-04-29 |
| Status | Open, 0 comments, 3 days old as of 2026-05-03 |
| Tests | 8 unit + 1 integration test, all passing ("829 passed, 0 failed") |
| Files touched | `src/network/server.rs`, `src/api/http.rs`, `server_tests.rs` |
| Acceptance criteria | Tests pass, performance bounded, cursor pagination validates, no regressions |
| Linked PRs | None |

**What this changes for ZAO's warm-intro plan:**

Doc 489 + Doc 587 framed Issue #17 as "ZAO ships this PR" = build-from-scratch. Now it's "ZAO does what?"

Three viable paths:
1. **Constructive review:** Read stephancill's PR, run it locally against ZAO's read patterns, post substantive review comment (perf, edge cases, ZAO use cases). Lands ZAO's name in the merge thread. 1-2 days work.
2. **Adjacent contribution:** Hypersnap has Tantivy full-text search but it's undocumented (per Hypersnap README + Doc 587). Document it + add a minimal `/search` endpoint. Different scope, equally useful, no competition.
3. **Pick a different open issue.** Visit `gh issue list -R farcasterorg/hypersnap --state open` and find the next "warm-intro currency" candidate.

**Recommendation:** Do (1) THIS WEEKEND. Lands ZAO publicly in the conversation while also benefiting from stephancill's existing work. Then (2) over week 2 if no merge yet.

## B) Hardware Requirements (real numbers)

Sources: Hypersnap README, CassOnMars bootstrap gist, Doc 309, Doc 587.

| Metric | Documented requirement | Real-world steady state |
|---|---|---|
| RAM | 30-40 GB | 28-32 GB after warmup |
| CPU | 16 cores recommended (8 workable but slower sync) | Idle ~5-10%, query bursts to 60-80% |
| Disk | 400-600 GB at 30 days | Grows ~13-20 GB/day |
| Network | Public IP + ports 3381-3383 (TCP/UDP) | Standard VPS provisions |
| Sync time | 1.5h on AX42, 2-3h on smaller VPS | Mostly disk-bound |
| Pinned version | v0.11.6 | Two pre-v0.11.6 memory leak fixes documented (2026-02-27, 2026-03-13) |

**Bootstrap commands** (per CassOnMars gist 2026-04-18):

```bash
# Prerequisites: Docker installed
mkdir hypersnap && cd hypersnap && \
  curl -sSL https://raw.githubusercontent.com/farcasterorg/hypersnap/refs/heads/main/scripts/hypersnap-bootstrap.sh | bash
```

Per `feedback_no_unauthorized_commitments.md` and ZAO secret-hygiene rules: **download the script first, review, then execute.** Don't curl-pipe-bash blind on a fresh VPS.

**Health check:**

```bash
curl http://localhost:3381/v1/info
# Returns: { maxHeight, blockDelay, ... }
```

## C) VPS Options Validated

| Option | Price/mo | RAM | CPU | Disk | Sync time | Headroom | Recommendation |
|---|---|---|---|---|---|---|---|
| Hostinger KVM 2 (current VPS 1) | $32 | 8 GB | 8C | 200 GB | OOM | Insufficient | **SKIP** — already ruled out per Doc 309 |
| Hetzner Server Auction | $30-50 | Variable | Variable | Variable | Unknown | Variable | **AVOID** — no SLA, specs rotate, ops fragility |
| GTHost Ashburn | $59+ | 32 GB | 8C | 1 TB NVMe | 2-3h | 0-4 GB headroom after Hypersnap | **TIGHT** — workable as secondary, OOM risk under load |
| **Hetzner AX42** | **$48-58** | **64 GB** | **16C** | **2 TB NVMe** | **1.5-2h** | **32-36 GB headroom** | **BUY** — best fit, lowest operational risk |

**Disk growth math:**
- Hypersnap grows ~13-20 GB/day at 188-member ZAO scale (low query volume)
- AX42's 2 TB lasts 100-150 days before needing pruning or upgrade
- GTHost's 1 TB lasts 50-75 days

**Cost comparison over 12 months:**
- AX42: $576-696/yr
- GTHost: $708/yr
- AX42 is *cheaper* AND better specs. Pick AX42.

## D) ZAO Codebase Migration Delta

**Big finding: zero code changes required.** ZAO already built the failover pattern.

### Current Neynar usage

- 46 files import from `@/lib/farcaster/neynar`
- ALL read calls go through one centralized client: `src/lib/farcaster/neynar.ts` (546 lines)
- Already implements `fetchWithFailover` (lines 24-39):

```typescript
const READ_BASE = ENV.FARCASTER_READ_API_BASE
  ? `${ENV.FARCASTER_READ_API_BASE}/v2/farcaster`
  : NEYNAR_BASE;

async function fetchWithFailover(path: string, init: RequestInit): Promise<Response> {
  if (READ_BASE === NEYNAR_BASE) {
    return fetch(`${NEYNAR_BASE}${path}`, init);
  }
  try {
    const res = await fetch(`${READ_BASE}${path}`, init);
    if (res.ok) return res;
  } catch {
    // Network error from proxy — fall back to Neynar
  }
  return fetch(`${NEYNAR_BASE}${path}`, { ...init, headers: headers() });
}
```

### Read endpoints with failover already wired

`getTrendingFeed`, `getChannelFeed`, `getCastThread`, `getUserByFid`, `getUsersByFids`, `getUserByAddress`, `searchUsers`, `getFollowers`, `getFollowing`, `getRelevantFollowers`, `getNotifications`, `getStorageUsage`, `getCastConversationSummary`, `getPopularCasts`, `getBestFriends`, `getTrendingTopics`, `getFollowSuggestions`, `getFrameCatalog`, `searchFrames`, `getRelevantFrames`

### Write endpoints — STAY on Neynar

Hypersnap does NOT support: `postCast`, `createSigner`, `registerSignedKey`, `getSignerStatus`, `followUser`, `unfollowUser`, `registerUser`, `deleteCast`, `markNotificationsSeen`, `muteUser`, `unmuteUser`, `blockUser`, `unblockUser`.

**These functions don't change.** ZAO continues using Neynar managed signer for all writes (per `src/app/api/auth/signer/route.ts`).

### API surface comparison

| Capability | Neynar | Hypersnap | ZAO impact |
|---|---|---|---|
| Feed reads (`/feed/trending`, `/feed/channels`) | YES | YES | Hypersnap-first with Neynar fallback |
| Cast reads (`/cast/conversation`) | YES | YES | Same |
| User reads (`/user/bulk`) | YES | YES | Same |
| Follow graph (`/followers`, `/following`) | YES | YES | Same |
| **Notifications (`/v2/notifications`)** | YES (working) | PARTIAL (PR #17 fixes it) | **Best to keep on Neynar until PR #17 merges** |
| Signer ops | YES | NO | Stay on Neynar |
| Cast posting (POST `/cast`) | YES | NO | Stay on Neynar |
| Follow / unfollow actions | YES | NO | Stay on Neynar |
| Tantivy full-text search | NO | YES (undocumented) | Net new capability — could be doc 598 |

### Migration steps (literal)

1. Install Hypersnap on AX42 (2 commands + 2-3h sync)
2. Add to ZAO `.env`: `FARCASTER_READ_API_BASE=http://<vps1-or-new-vps>:3381`
3. Redeploy ZAO
4. Monitor `getNotifications` failover behavior — likely still hits Neynar fallback until PR #17 merges
5. Done

## Reframed Warm-Intro Path (Replaces Doc 489 / 587 plan)

The original plan said "ship Hypersnap Issue #17 as warm intro to Cassie." That's now built by stephancill. New plan:

| Step | Action | Why |
|---|---|---|
| 1 | Install Hypersnap on AX42 this weekend | Have a real running node = credible voice in any Hypersnap convo |
| 2 | Pull stephancill's PR locally, run against ZAO's notification endpoints, post substantive review comment | Lands ZAO publicly in the merge thread; benefits from existing work |
| 3 | Document Hypersnap's undocumented Tantivy search endpoint (separate PR or PR to `farcasterorg/hypersnap-docs-web`) | New independent contribution, no competition |
| 4 | Cast about ZAO's running Hypersnap node + reviewing PR + writing Tantivy docs (tag @cassie) | She reads substantive replies; engages via code |
| 5 | After Cassie engages: open conversation on FIP #268 + Quilibrium privacy bridge (per Doc 596) | Strategic narrative bridge |

This is BETTER than the original plan because:
- ZAO doesn't have to ship a major Rust PR cold
- ZAO benefits from stephancill's work (his PR landing is good for everyone)
- Tantivy docs are a clean, independent contribution
- Multiple lightweight signals beat one big PR for relationship-building

## Final Decision Matrix

| Question | Answer | Confidence |
|---|---|---|
| Buy a VPS? | YES — Hetzner AX42 | High |
| Install Hypersnap this weekend? | YES — bootstrap is 2 commands | High |
| Migrate ZAO reads to Hypersnap? | YES, eventually — set env var post-install, but keep notifications on Neynar until PR #17 merges | High |
| Build Issue #17 from scratch? | NO — stephancill already did | High |
| Review stephancill's PR + comment substantively? | YES — week 1 task | Medium-high |
| Document Tantivy search endpoint? | YES — independent contribution, doc 598 candidate | Medium |
| DM Cassie directly? | NO (per her bio "I do not use Twitter"; engages via code) | High |
| Cast about Hypersnap node + tag Cassie? | YES — after node is live + PR review posted | High |

## Action Plan (this weekend)

| When | Action | Owner |
|---|---|---|
| 2026-05-03 (today) | Buy Hetzner AX42 | @Zaal |
| 2026-05-03 | Install Hypersnap (Docker + bootstrap script, reviewed first) | @Zaal or research session |
| 2026-05-03 evening | Initial sync runs overnight | (automatic) |
| 2026-05-04 morning | Verify sync complete via `/v1/info`; set `FARCASTER_READ_API_BASE` in ZAO `.env`; redeploy | @Zaal |
| 2026-05-04 | Pull stephancill PR #17, run locally, draft review comment | research session |
| 2026-05-04 evening | Post review comment on PR #17 | @Zaal |
| 2026-05-05 | Cast about Hypersnap node + PR review + Tantivy docs plan, tag @cassie | @Zaal |
| 2026-05-06 | Begin Tantivy search endpoint documentation (doc 598 + PR to hypersnap-docs-web) | research session |

## Risks (this install round)

| Risk | Severity | Mitigation |
|---|---|---|
| Bootstrap script auto-curl-pipe-bashes; secret hygiene risk | MEDIUM | Download + review script before executing. ZAO secret-hygiene rule already covers this. |
| AX42 sold out / not available in chosen DC | LOW | GTHost Ashburn is the fallback. Tight specs but workable. |
| Sync time longer than expected (4-6 h instead of 2-3) | LOW | Acceptable. Just delays env-var flip by half a day. |
| stephancill's PR #17 merges before ZAO comments | LOW | Comment on it anyway — even after-merge review is value-add. |
| Hypersnap v0.11.6 has new memory leak | MEDIUM | Pin version. Monitor weekly. AX42 has 2x headroom = OOM-resistant. |
| ZAO's existing Neynar-call patterns trigger Hypersnap edge cases | MEDIUM | Keep `FARCASTER_READ_API_BASE` unset for first day post-deploy. Test specific endpoints individually before full cutover. |

## Also See

- [Doc 489 — Hypersnap Bootstrap + Cass on Mars](../489-hypersnap-farcaster-node-cassonmars/) — original warm-intro plan
- [Doc 586 — Hypersnap node install plan](../586-hypersnap-node-install/) — VPS pricing + install plan from earlier session
- [Doc 587 — Hypersnap+Quilibrium+farcasterorg Ecosystem](../587-hypersnap-quilibrium-farcasterorg-ecosystem-may2026/) — Issue #17 scoping (pre-stephancill PR)
- [Doc 596 — FIP Live Activity Quilibrium Privacy Bridge](../596-fip-live-activity-quilibrium-privacy/) — strategic context for the install
- Memory: `project_hypersnap_node_install.md` — install plan resume marker

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Buy Hetzner AX42 ($48-58/mo) | @Zaal | Purchase | 2026-05-03 |
| Run bootstrap install with reviewed script | @Zaal or research session | Install | 2026-05-03 |
| Set `FARCASTER_READ_API_BASE` env var, redeploy ZAO | @Zaal | Deploy | 2026-05-04 |
| Pull + review stephancill's PR #17 locally | research session | Review | 2026-05-04 |
| Post substantive review comment on PR #17 | @Zaal | GitHub | 2026-05-04 |
| Cast about node + PR review, tag @cassie | @Zaal | Farcaster | 2026-05-05 |
| Open doc 598: Tantivy search endpoint documentation | research session | Doc | 2026-05-06 |
| Re-validate this doc post-install | research session | Update | 2026-05-10 |

## Sources

- [farcasterorg/hypersnap repo + Issue/PR #17](https://github.com/farcasterorg/hypersnap)
- [CassOnMars bootstrap gist (2026-04-18)](https://gist.github.com/CassOnMars/cbb2007b2bcb713b81da827180d4ffb7)
- [Hetzner AX42 pricing](https://www.hetzner.com/dedicated-rootserver)
- [GTHost dedicated servers](https://gthost.com/dedicated-servers)
- ZAO codebase: `src/lib/farcaster/neynar.ts` (546 lines, failover pattern lines 4-39)
- ZAO codebase: 46 import sites for `@/lib/farcaster/neynar` (centralized read surface)

### URL liveness
All 4 external URLs verified live 2026-05-03. ZAO codebase paths confirmed in `/tmp/zao-research-597/src/`.

### Hallucination check
- stephancill PR existence claim verified via agent's `gh api repos/farcasterorg/hypersnap/issues/17`
- Hypersnap hardware numbers cross-referenced from agent's repo + gist read
- ZAO failover pattern verified at `src/lib/farcaster/neynar.ts` lines 4-39 by agent's grep
- VPS pricing matches Doc 586/587 already in research lib
