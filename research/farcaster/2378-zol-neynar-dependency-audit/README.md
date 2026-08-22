---
topic: farcaster
type: risk-audit
status: research-complete
created: 2026-08-22
last-validated: 2026-08-22
board-task:
related-docs: "2374, 2313, 1563-neynar-api-zol-music-scout-capabilities, 993-zol-farcaster-upgrades"
original-query: "Audit ZAO's Neynar dependencies (ZOL, Warpee, any miniapps) — list what breaks if Neynar API changes"
tier: STANDARD
---

# 2378 - ZOL Neynar Dependency Audit (Aug 2026)

> **Context:** Doc 2374 identified a P1 action: audit ZAO's Neynar dependencies before
> Aug 25, 2026. Neynar announced Aug 17, 2026 it is seeking a new team to run Farcaster
> and its developer platform. This doc maps every Neynar surface ZOL touches, classifies
> each as CRITICAL / DEGRADED / SAFE under operator failure, and gives a concrete
> migration path for each.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **ZOL's write path is a 1-line fix, not a crisis.** The hub submission endpoint is the only Neynar-specific piece of the write path; signing is protocol-native. | `zol-lib.js:17` has `HUB = 'https://hub-api.neynar.com'`. Changing to any public hub restores posting. Message construction and signing use `@farcaster/hub-nodejs` which is operator-agnostic. |
| 2 | **ZOL's v1 search endpoint is double-risk: legacy + in-handoff scope.** Migrate to v2 endpoint NOW, not later. | `searchNeynarCasts()` already carries a comment "v1 LEGACY — may be deprecated" with Phase 5 upgrade path. Neynar handoff makes that "may" a "will." This is the one call that should ship before the operator transition completes. |
| 3 | **Read path migration (mentions, user resolution) can wait until Neynar's status is clearer, but a fallback provider must be chosen.** | Neynar's blog says the dev platform continues while they find an operator — API is not off yet. But we need a named fallback so a 2-hour migration window is possible, not a 2-week design sprint. |
| 4 | **Signer key registration is fully protocol-native. Zero Neynar risk.** | `add-signer.js` talks directly to Optimism contracts (KeyGateway, IdRegistry) via ethers.js. No API key, no Neynar endpoint. |

## Dependency Inventory

### A. Write Path — how ZOL posts casts

| Component | File | Neynar endpoint | Risk level | Migration cost |
|---|---|---|---|---|
| Hub submission (post/reply/remove/follow) | `src/zol-lib.js:43` `submit()` | `hub-api.neynar.com/v1/submitMessage` | **CRITICAL** — posts go dark | **1 line**: change `HUB` constant to alt hub |
| Message signing | `src/zol-lib.js:22` `signer()` | None — uses `@farcaster/hub-nodejs` locally | **SAFE** | No change needed |
| Message construction | `src/zol-lib.js:44-68` `post()/quoteCast()/remove()/follow()` | None — protocol SDK | **SAFE** | No change needed |
| Signer key registration | `src/add-signer.js` | None — Optimism onchain (KeyGateway, IdRegistry) | **SAFE** | No change needed |

**Write path summary:** ZOL becomes mute ONLY if `hub-api.neynar.com` stops accepting submissions. The signing identity and protocol formatting are fully self-contained. Fix = change 1 constant.

**Alternative hub endpoints:**
- `hoyt.farcaster.xyz` — public hub (Merkle's former primary)
- `snapchain.farcaster.xyz` — Snapchain primary hub
- `api.farcaster.xyz` — Farcaster-controlled endpoint
- Self-hosted: hub-monorepo (Farcaster open source, Docker)
- Pinata Hub: `hub.pinata.cloud`

### B. Read Path — how ZOL discovers and resolves Farcaster data

| Function | File | Neynar endpoint | Risk level | Protocol alternative |
|---|---|---|---|---|
| `getNeynarMentions()` | `src/integrations.js:83` | `GET /v2/farcaster/reactions/user_reactions` | **DEGRADED** — ZOL loses mention inbox | Hub: `GET /v1/reactionsByFid` or `GET /v2/farcaster/notifications?type=mentions` |
| `searchNeynarCasts()` | `src/integrations.js:108` | `GET /v1/search_casts` (**LEGACY v1**) | **CRITICAL + LEGACY** — double risk | Neynar v2: `GET /v2/farcaster/cast/search?q=...`; or Pinata search |
| `resolveFid()` | `src/zol-lib.js:54` | `GET /v2/farcaster/user/by_username` | **DEGRADED** — username-to-FID breaks | Hub: `GET /v1/userDataByUsername?username=...` |
| `connectivity.check` | `src/integrations.js` (config block) | `GET /v2/farcaster/user/bulk?fids=...` | **LOW** — health check only | Change to any hub `/healthz` endpoint |

**Note on `getNeynarMentions()`:** The FIELD DRIFT GUIDE in `integrations.js:63-69` documents that this call currently queries **likes**, not @-mentions. The real mention inbox path is `GET /v2/farcaster/notifications?type=mentions&fid=...` — already documented as "UPGRADE PATH (Phase 5)." This migration is independent of the Neynar crisis but should be bundled with the v1 search migration.

### C. Credentials and secrets

| Secret | Location | Risk | Notes |
|---|---|---|---|
| `NEYNAR_API_KEY` | `~/.zao/private/neynar.env` on Pi | If Neynar revokes keys during handoff | Keep monitoring neynar.com for "key rotation" announcements |
| Signer private key | `~/.openclaw/farcaster-credentials.json` on Pi | None — not Neynar-managed | Onchain key, fully self-sovereign |
| FID (3338501) | Hardcoded in `zol-lib.js:17` | None — onchain identity | Not affected by operator change |
| Custody wallet | `~/zol/.zol-wallet-key` on Pi | None — Optimism wallet, not Neynar | Controls key registry only |

### D. Protocol SDK dependencies

| Package | Status | Operator risk |
|---|---|---|
| `@farcaster/hub-nodejs` | Pi-only, lazy-loaded | **SAFE** — open-source Farcaster SDK, not Neynar-specific |
| `ethers` v6 | Used in `add-signer.js` | **SAFE** — direct Optimism RPC |

## Risk Matrix

```
                     Impact if Neynar API goes down
                     ┌────────────────┬────────────────┐
                     │  HIGH IMPACT   │  LOW IMPACT    │
    ┌────────────────┼────────────────┼────────────────┤
    │ SHORT fix      │ Hub submit     │ Connectivity   │
    │ window (<2h)   │ (1-line HUB    │ check (change  │
    │                │ constant)      │ healthz URL)   │
    ├────────────────┼────────────────┼────────────────┤
    │ MEDIUM fix     │ v1 search      │ Mentions inbox │
    │ window (1-2d)  │ (migrate to    │ (real @ switch │
    │                │ v2 NOW)        │ + field map)   │
    ├────────────────┼────────────────┼────────────────┤
    │ LONG fix       │ resolveFid     │                │
    │ window (2-5d)  │ (hub direct    │                │
    │                │ lookup)        │                │
    └────────────────┴────────────────┴────────────────┘
```

## Migration Plan

### P1 — Ship before operator transition (do now, minimal blast radius)

**Task 1: Migrate `searchNeynarCasts()` from v1 → v2**
- File: `src/integrations.js:108-130`
- Change: `GET /v1/search_casts?q=...` → `GET /v2/farcaster/cast/search?q=...`
- Response shape change: `result.casts[]` → `result.result.casts[]` (verify from Neynar docs)
- This is already documented in the FIELD DRIFT GUIDE as Phase 5 upgrade. Ship now.

**Task 2: Add `HUB` constant env override**
- File: `src/zol-lib.js:17`
- Change: `const HUB = process.env.ZOL_HUB_URL || 'https://hub-api.neynar.com'`
- Add `ZOL_HUB_URL=` to `.env.example` with comment listing alt hubs
- Allows hot-switching without a code deploy

### P2 — Choose fallback API provider (decision, not code)

ZOL needs a NAMED FALLBACK for `api.neynar.com`. Candidates:

| Provider | Endpoints needed | Notes |
|---|---|---|
| **Direct Farcaster hub** | user lookup, notifications, reactions | Free; requires hub-protocol query format |
| **Pinata Farcaster** | search, user, reactions | Free tier; clean REST; no API key for public reads |
| **Airstack** | user, search, notifications | More complex but aggregates multiple protocols |

Recommendation: **Pinata** for read endpoints (free tier, REST format close to Neynar's). Hub direct for submission.

Add `CAST_DATA_PROVIDER=neynar` env var (already recommended in doc 2313 for the receipts path). This becomes the runtime switch.

### P3 — Mention inbox fix (independent of Neynar crisis)

Migrate `getNeynarMentions()` from **likes** (`reaction_type=likes`) to **real @-mentions** (`/v2/farcaster/notifications?type=mentions`). This is a correctness fix documented in the FIELD DRIFT GUIDE. Bundle with the v1 search migration PR.

## Scope: Warpee and miniapps

**Warpee:** Warpee is ZAO's own Farcaster research API service, separate from Neynar. Warpee queries Farcaster hubs directly per doc 1477 (the query plan). Neynar's operator transition does not directly affect Warpee's query path — Warpee's risk is Farcaster hub availability, not Neynar API availability. Monitor separately.

**WaveWarZ miniapp (doc 1425/2321):** The miniapp SDK (Farcaster frames v2 / miniapps SDK) is protocol-level and does not depend on Neynar's API for its core function. Neynar's mention and notification endpoints would only matter if WaveWarZ sends notifications through ZOL's cast-posting path. Per doc 2374 decision #2, ship before ecosystem restructure — the miniapp frame SDK is safe.

**ZOL FID and signer:** Both onchain (Optimism), fully Neynar-independent.

## What Does NOT Break Under Neynar Operator Failure

- ZOL's Farcaster identity (FID 3338501)
- ZOL's signer keypair (local Ed25519 key)
- ZOL's ability to construct and sign messages
- Signer key registration flow
- Any direct hub interaction (if the hub URL is updated)
- Approval gate / ApprovalBridge (internal system, no Neynar dependency)
- Bonfire knowledge graph (separate service)
- Cowork tracker (Supabase, no Neynar dependency)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Migrate `searchNeynarCasts()` v1 → v2 in `integrations.js:108` | Claude (PR) | Code | 2026-08-25 |
| Add `ZOL_HUB_URL` env override to `zol-lib.js:17` + `.env.example` | Claude (PR) | Code | 2026-08-25 |
| Choose fallback API provider (Pinata recommended) + add `CAST_DATA_PROVIDER` env var | @Zaal | Decision | 2026-08-27 |
| Migrate `getNeynarMentions()` from likes → real @-mentions (correctness fix) | Claude (PR) | Code | 2026-08-29 |
| Pin Neynar SDK version in `package.json` + add note on v1→v2 SDK migration timeline | @Zaal | Code | 2026-08-27 |
| Monitor neynar.com/blog weekly for operator announcement | ZOE | Standing watch | Ongoing |

## Sources

- [INTERNAL] `src/zol-lib.js` — ZOL hub submit + signer implementation (read 2026-08-22)
- [INTERNAL] `src/integrations.js` — ZOL Neynar API read path + FIELD DRIFT GUIDE (read 2026-08-22)
- [INTERNAL] `src/add-signer.js` — ZOL signer registration flow (read 2026-08-22)
- [INTERNAL] `.env.example` — ZOL secret inventory (read 2026-08-22)
- [INTERNAL] Doc 2374 — Farcaster operator crisis context + action items
- [INTERNAL] Doc 2313 — Farcaster auth primitives (CAST_DATA_PROVIDER pattern)
- [INTERNAL] Doc 1563 — Neynar API / ZOL music scout capabilities
