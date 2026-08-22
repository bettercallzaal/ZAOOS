---
topic: farcaster
type: implementation-reference
status: research-complete
created: 2026-08-22
last-validated: 2026-08-22
board-task:
related-docs: "2378-zol-neynar-dependency-audit, 2374-farcaster-operator-crisis-aug2026, 309-snapchain-hypersnap-protocol-deep-dive"
original-query: "Concrete hub API reference for ZOL's Neynar migration — what exactly replaces each Neynar call in the Farcaster hub HTTP API?"
tier: STANDARD
---

# 2381 - Farcaster Hub API: ZOL Migration Reference (Aug 2026)

> **Purpose:** Doc 2378 identified the exact ZOL functions that hit Neynar and said
> "hub direct queries are the alternative." This doc answers: what are those exact hub
> queries? Includes the Snapchain HTTP API reference for each ZOL Neynar call, verified
> from Snapchain's own documentation (snapchain.farcaster.xyz/llms-full.txt), and the
> exact code change needed for each migration step.

## Snapchain HTTP API — Key Facts

| Fact | Value |
|---|---|
| Default port (self-hosted) | 3381 |
| API version prefix | `/v1/` |
| `submitMessage` path | `POST /v1/submitMessage` (body: `application/octet-stream`) |
| Auth (optional, admin endpoints) | HTTP Basic Auth (`-u "username:password"`) |
| Content-Type for message submission | `application/octet-stream` |
| Protocol SDK | `@farcaster/hub-nodejs` (ZOL already has this at `^0.15.9`) |
| Self-host option | Snapchain node on AWS (~$25/month) |
| Managed alternative | Pinata Hub (`hub.pinata.cloud`, free tier) |

**Critical finding:** The `submitMessage` path (`POST /v1/submitMessage`) and content type are IDENTICAL on Neynar Hub (`hub-api.neynar.com`) and Snapchain. ZOL's `submit()` function works on any Snapchain-compatible hub without any logic change — only the base URL changes.

## Endpoint Mapping: ZOL Neynar Calls → Hub Protocol Calls

### 1. `submit()` — Message submission (write path)

**Current (Neynar hub):**
```
POST hub-api.neynar.com/v1/submitMessage
Headers: Content-Type: application/octet-stream, x-api-key: ${KEY}
Body: encoded Message protobuf
```

**Hub protocol equivalent:**
```
POST {HUB_URL}/v1/submitMessage
Headers: Content-Type: application/octet-stream
Body: encoded Message protobuf (same format)
```

**Code change in `zol-lib.js:17` and `zol-lib.js:43`:**
```js
// BEFORE (line 17):
const HUB = 'https://hub-api.neynar.com';

// AFTER:
const HUB = process.env.ZOL_HUB_URL || 'https://hub.pinata.cloud';

// ALSO (line 43 — remove Neynar API key header):
// BEFORE:
{ 'Content-Type': 'application/octet-stream', 'x-api-key': KEY }
// AFTER (x-api-key is Neynar-specific, not needed for protocol hubs):
{ 'Content-Type': 'application/octet-stream' }
```

Note: If using a hub that requires auth (e.g., self-hosted with password), add HTTP Basic Auth per the Snapchain docs. Pinata's hub accepts unauthenticated `submitMessage` on the free tier.

### 2. `getNeynarMentions()` — Mention inbox

**Current (Neynar API — queries LIKES, not real mentions):**
```
GET api.neynar.com/v2/farcaster/reactions/user_reactions?fid=${fid}&reaction_type=likes&limit=${limit}
```

**Hub protocol equivalent — real @-mentions (fix the correctness bug too):**
```
GET {HUB_URL}/v1/castsByMention?fid=${fid}&pageSize=${limit}
```

Response shape: `{ messages: Array<{ data: { castAddBody: { text, embeds, mentions, parentCastId } }, hash, ... }> }`

Fields ZOL reads: map `data.castAddBody.text` → `.text`, `data.fid` → `.authorFid`, `hash` → `.castHash`, `data.timestamp` → `.timestamp` (Farcaster timestamp is seconds since 2021-01-01; add `1609459200` to get Unix epoch).

**Why this is better:** `castsByMention` returns actual cast messages where ZOL's FID (3338501) is mentioned — replacing the "likes" workaround and fixing the correctness bug documented in the FIELD DRIFT GUIDE.

### 3. `searchNeynarCasts()` — Cast search (PRIORITY: migrate NOW)

**Current (Neynar v1 legacy — double risk):**
```
GET api.neynar.com/v1/search_casts?q=${query}&limit=${limit}
```

**Hub protocol:** NO search endpoint in Snapchain's HTTP API. Search requires an external service.

**Options in order of ease:**
- **Neynar v2** (migrate immediately while Neynar is still up): `GET api.neynar.com/v2/farcaster/cast/search?q=${query}&limit=${limit}` — same response shape as v1 but under `.result.casts[]` not `.casts[]`. Minimal code change.
- **Pinata Farcaster Hub** (`hub.pinata.cloud`) — Pinata Hub doesn't expose search; use their separate managed API
- **Airstack** — `GET api.airstack.xyz/gql` (GraphQL, more complex)
- **Self-hosted** — run Snapchain + build a search index (major effort)

**Recommended immediate action:** Migrate from v1 to v2 now (1-line URL change + response field fix). This buys time while evaluating a long-term search alternative.

```js
// BEFORE (integrations.js:110):
'/v1/search_casts?q=${encodeURIComponent(query)}&limit=${limit}'

// AFTER (Neynar v2, same API key, different path + response):
'/v2/farcaster/cast/search?q=${encodeURIComponent(query)}&limit=${limit}'

// Response field change (integrations.js:119-127):
// BEFORE: const casts = (result.casts || []).map(...)
// AFTER: const casts = (result.result?.casts || []).map(...)
// (v2 wraps the array in a `result` object)
```

### 4. `resolveFid()` — Username to FID lookup

**Current (Neynar API):**
```
GET api.neynar.com/v2/farcaster/user/by_username?username=${username}
```

**Hub protocol equivalent:**
There is no direct username-to-FID lookup on Snapchain hubs. The canonical path is via the Farcaster Fname Registry:
```
GET fnames.farcaster.xyz/transfers?name=${username}
```
Returns `{ transfers: [{ id, timestamp, username, owner, from, to, user_signature, server_signature }] }`. The most recent `transfer.to` is the FID that owns the name currently.

Alternative (if already using Neynar API): `GET api.neynar.com/v2/farcaster/user/by_username?username=${username}` is a standard v2 endpoint (not the one at risk). It's the v1 search endpoint that's legacy-risk, not `by_username`.

**Code change:** None urgently needed if staying on Neynar API for now. `resolveFid()` uses the v2 endpoint which is not legacy-risk. For full Neynar independence:

```js
// Replace in zol-lib.js:54:
async function resolveFid(username) {
  const r = await fetch(`https://fnames.farcaster.xyz/transfers?name=${encodeURIComponent(String(username).replace(/^@/, ''))}`);
  const j = await r.json();
  const transfers = j?.transfers;
  if (!transfers?.length) return null;
  // Most recent transfer TO is the current owner
  return transfers[transfers.length - 1]?.to || null;
}
```

### 5. `connectivity.check` — Health check

**Current (Neynar API):**
```
GET api.neynar.com/v2/farcaster/user/bulk?fids=3338501
```

**Hub protocol equivalent:**
```
GET {HUB_URL}/v1/info
```
Returns `{ version, isSyncing, nickname, rootHash, dbStats }`. Change the health check in `integrations.js` to use this endpoint and check `response.ok` instead of `response.error`.

## Recommended Hub URLs (alternatives to `hub-api.neynar.com`)

| Hub | URL | Free tier | Auth required | Notes |
|---|---|---|---|---|
| **Pinata** | `https://hub.pinata.cloud` | Yes | No (for submitMessage) | REST HTTP, Snapchain-compatible, stable |
| Self-hosted Snapchain | localhost:3381 | N/A | Optional | Run on AWS ~$25/mo; full control |
| Farcaster validator | See validators.toml | Not public | Unknown | Protocol validators, not intended as public API |

**Recommended for ZOL:** `Pinata` (`hub.pinata.cloud`). It's Snapchain-compatible, has a free tier for `submitMessage`, and requires no API key for basic operations.

## Confirmed Identical: Neynar Hub vs Snapchain

ZOL's write path (`submit()` → `POST /v1/submitMessage`) is confirmed as protocol-identical between Neynar and Snapchain:
- Path: `/v1/submitMessage` ✓
- Content-Type: `application/octet-stream` ✓
- Body: `Message.encode(msg).finish()` protobuf bytes ✓
- `@farcaster/hub-nodejs` SDK: `^0.15.9` already installed ✓

The ONLY Neynar-specific thing in the write path is the `x-api-key` header — which is NOT needed on Pinata or other protocol hubs.

## Migration Checklist (ordered by urgency)

- [ ] **NOW (P0):** Migrate `searchNeynarCasts()` v1 → v2 endpoint (2 lines: URL + response field)
- [ ] **NOW (P0):** Add `ZOL_HUB_URL` env override to `zol-lib.js:17` (1 line, enables hot-swap)
- [ ] **P1:** Remove `x-api-key` from `submit()` headers (line 43) when hub URL is non-Neynar
- [ ] **P1:** Swap `connectivity.check` from Neynar API to `{HUB_URL}/v1/info` (isolates health check from read-path failures)
- [ ] **P2:** Migrate `getNeynarMentions()` to `GET /v1/castsByMention?fid=3338501` (fixes correctness bug + removes Neynar read dependency)
- [ ] **P3:** Migrate `resolveFid()` to Fname registry (full Neynar independence — lowest urgency, non-legacy endpoint)

## What This Does NOT Change

- `@farcaster/hub-nodejs` SDK (`^0.15.9`) — already protocol-native, no change
- Message signing logic (local, Ed25519) — no change
- FID (3338501), signer key, custody wallet — no change
- Approval gate, cowork tracker, Bonfire — no Farcaster dependency

## Sources

- [FULL] Snapchain HTTP API reference via `snapchain.farcaster.xyz/llms-full.txt` (read 2026-08-22)
- [FULL] Snapchain llms.txt (read 2026-08-22)
- [INTERNAL] `src/zol-lib.js` — ZOL current hub submit implementation (read 2026-08-22)
- [INTERNAL] `src/integrations.js` — ZOL Neynar read calls + FIELD DRIFT GUIDE (read 2026-08-22)
- [INTERNAL] Doc 2378 — dependency audit establishing which calls need migration
- [INTERNAL] Doc 309 — Snapchain/Hypersnap deep dive (May 2026)
