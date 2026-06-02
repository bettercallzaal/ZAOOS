---
topic: farcaster
type: architecture
status: research-complete
last-validated: 2026-06-02
related-docs: "795, 306, 308, 173, 017, 304"
original-query: "write research articles about what we have in this client and how we built it"
scope: "the ZAOOS Farcaster client — auth/identity, managed signers, Neynar integration, miniapp, feeds/casts/social"
---

# 796 — ZAOOS Farcaster client architecture

> **Goal.** A build-in-public, file:line-cited deep dive into the ZAOOS Farcaster client as it actually exists in code today: how identity and sessions work, how managed signers turn a logged-in user into a poster, how the single Neynar integration layer reads and writes Farcaster, how the miniapp embeds and authenticates silently, and the security model that holds it all together. Everything below is what the code does, not what it aspires to.

## Method

Read end-to-end before writing: `src/lib/auth/*`, the `auth/`, `auth/signer/`, `miniapp/`, `neynar/`, `casts/`, `users/` route handlers, `src/lib/farcaster/neynar.ts` + `neynarActions.ts`, `src/hooks/{useAuth,useMiniApp}`, `src/components/miniapp/*`, the `.well-known/farcaster.json` manifest, `src/middleware.ts`, `src/lib/env.ts`, and the Farcaster block of `community.config.ts`. Where security claims appear they were verified against the credential paths in `session.ts` / `signer/save` / `neynar/cast`. The companion security audit is **doc 795** (`research/security/795-farcaster-client-audit-cleanup/`); this doc is the architecture counterpart.

---

## 1. Overview

ZAOOS started as a **gated Farcaster social client for The ZAO** — a 188-member music community on Base — and grew into the monorepo lab described in `CLAUDE.md`. The Farcaster client is the original surface and still the spine: a Next.js 16 / React 19 app that lets allowlisted members read Farcaster feeds, post/like/recast/follow through a managed signer, and run as both a website (`zaoos.com`) and a Farcaster **mini app** embedded in Warpcast, Base App, Coinbase Wallet, and any other Farcaster client.

**Stack (Farcaster-relevant slice):**

| Concern | Tech |
|---------|------|
| Sessions | `iron-session` (encrypted cookie, no server session store) — `src/lib/auth/session.ts` |
| Farcaster data + writes | Neynar v2 API via a single wrapper module — `src/lib/farcaster/neynar.ts` |
| Free reads | Optional Hypersnap/Quilibrium read proxy with failover — `neynar.ts:4`, `ENV.FARCASTER_READ_API_BASE` |
| Web SIWF | `@farcaster/auth-client` (`createAppClient` + `viemConnector`) — `auth/verify/route.ts:4` |
| Web SIWE | `viem/siwe` + `viem` `verifyMessage` (ERC-1271 aware) — `auth/siwe/route.ts:4` |
| Miniapp auth | `@farcaster/quick-auth` JWT verification — `miniapp-quickauth.ts:10` |
| Miniapp SDK | `@farcaster/miniapp-sdk` (client) + `@farcaster/miniapp-node` (webhook verify) |
| Gate | Supabase `allowlist` / `users` tables — `src/lib/gates/allowlist.ts` |

**Three auth surfaces** get a user in — each terminates in the same iron-session cookie:

1. **Web SIWF** — Sign In With Farcaster (auth-kit signature) — `/api/auth/verify`.
2. **Web SIWE** — Sign In With Ethereum (wallet signature, including smart wallets) — `/api/auth/siwe`.
3. **Miniapp QuickAuth** — silent JWT, no signature prompt — `/api/miniapp/auth` + `/api/miniapp/auth-context`.

The app's own Farcaster identity is **FID 19640** (`community.config.ts:34`, also `adminFids: [19640]` at `community.config.ts:43`). The community channels are `['zao', 'zabal', 'cocconcertz', 'wavewarz']` with `defaultChannel: 'zao'` (`community.config.ts:36-38`).

---

## 2. Identity & sessions

### The cookie

Sessions are a single encrypted `iron-session` cookie named `zaoos_session` — there is no server-side session table. Config lives in `src/lib/auth/session.ts:29-38`:

```ts
cookieOptions: {
  secure: isProd,
  httpOnly: true,
  sameSite: (isProd ? 'none' : 'lax'),
  maxAge: 7 * 24 * 60 * 60, // 7 days
}
```

**Why `SameSite=None` in production** — documented inline at `session.ts:22-27`: the Farcaster client embeds `zaoos.com` in a third-party iframe. `SameSite=Lax` cookies are dropped on cross-site iframe navigations, so after `/api/miniapp/auth-context` sets the cookie, the browser would refuse to send it on the `/home` redirect and the server would see no session. `None` requires `Secure=true`, so dev over `http://localhost` falls back to `Lax` (`session.ts:28,35`). This single decision is what makes embedded miniapp sessions work at all.

### The server→client boundary

The session payload (`SessionPayload`, `session.ts:11-20`) carries a server-only field: `signerUuid` — the managed-signer posting credential. Two functions guard the boundary:

- `getSessionData()` (`session.ts:45-60`) — server-side reader, `react`-`cache`d per request, returns the full `SessionData` including `signerUuid` and a derived `hasSigner: !!session.signerUuid`. A session is valid if it has **either** a FID **or** a wallet address (`session.ts:48`).
- `toPublicSession()` (`session.ts:68-70`) — strips `signerUuid` to `null` before any server→client hand-off. The `/api/auth/session` route (`auth/session/route.ts:13`) is the only place the client reads its own session, and it spreads `toPublicSession(session)` so the browser receives `hasSigner` but never the signer UUID itself.

The client hook `useAuth()` (`src/hooks/useAuth.ts`) just `fetch`es `/api/auth/session`, exposing `{ user, loading, logout, refetch }`. `logout()` POSTs `/api/auth/logout` (which calls `clearSession()` → `session.destroy()`, `auth/logout/route.ts:7`) and hard-navigates home.

### How `isAdmin` is derived

`isAdmin` is **never** trusted from input — it is computed at session-save time from public config:

```ts
session.isAdmin = ADMIN_FIDS.includes(data.fid) ||
  (data.walletAddress ? ADMIN_WALLETS.includes(data.walletAddress.toLowerCase()) : false);
```

(`session.ts:89-90` for `saveSession`, mirrored at `session.ts:109-110` for `saveWalletSession`.) `ADMIN_FIDS` / `ADMIN_WALLETS` come from `community.config.ts`. The standalone `isAdmin(fid)` helper (`session.ts:119-121`) is a pure FID check used elsewhere. The security implication: because admin FIDs are public, the **only** thing standing between an attacker and an admin cookie is that the FID feeding `saveSession` must come from a *verified* source — see §3 and the doc-795 bug.

### The three save paths

| Function | Used by | authMethod | signerUuid |
|----------|---------|-----------|------------|
| `saveSession()` `session.ts:72-92` | SIWF (`auth/verify`), miniapp (`authenticateMiniappToken`) | `farcaster` | `null` at login (set later by signer flow) |
| `saveWalletSession()` `session.ts:94-112` | SIWE (`auth/siwe`) | `wallet` | always `null` (wallet sessions can't post) |
| `session.signerUuid = …; session.save()` | `signer/save`, `signer/status` | unchanged | the approved signer UUID |

---

## 3. Three ways in

All three terminate in an iron-session cookie and all three pass the same allowlist gate (§7). They differ in what they verify and what they can do afterward.

| | **SIWF (web)** | **SIWE (web wallet)** | **Miniapp QuickAuth** |
|---|---|---|---|
| Route | `POST /api/auth/verify` | `POST /api/auth/siwe` | `GET /api/miniapp/auth` + `POST /api/miniapp/auth-context` |
| Library | `@farcaster/auth-client` `verifySignInMessage` | `viem/siwe` + `verifyMessage` | `@farcaster/quick-auth` `verifyJwt` |
| Proof | Farcaster signature over a SIWF message | Ethereum signature over a SIWE message | Signed QuickAuth JWT (`payload.sub` = FID) |
| Nonce | `auth_nonces` table, 15-min TTL, atomic delete-on-use | same `auth_nonces` table, 15-min TTL | n/a (JWT is self-contained, domain-pinned) |
| Smart wallets | n/a | ✅ ERC-1271 via `publicClient.verifyMessage` | n/a |
| Identity source | `result.fid` from verified message | wallet → `getUserByAddress` lookup | `Number(payload.sub)` from verified JWT |
| Can post? | ✅ after signer flow | ❌ (no Farcaster signer) | ✅ after signer flow |
| UX | one signature prompt | one wallet signature | **silent** (no prompt) |

### (a) SIWF — `/api/auth/verify`

`GET` mints a nonce: `crypto.randomBytes(16)` hex, inserted into `auth_nonces` with a 15-minute expiry, and fires a best-effort prune of expired rows (`auth/verify/route.ts:36-52`). The app client is **lazy-initialized** (`getAppClient()`, `verify/route.ts:18-28`) to avoid cold-start timeouts on serverless — it wires `viemConnector` to an Optimism RPC (`verify/route.ts:14`).

`POST` (schema at `verify/route.ts:57-62`):
1. **Atomic nonce consumption** — `delete … .eq('nonce', nonce).gt('expires_at', now).select().maybeSingle()` (`verify/route.ts:76-86`). The delete-and-return-in-one-query prevents the race where two concurrent requests both pass nonce validation.
2. `verifySignInMessage({ message, signature, nonce, domain })` (`verify/route.ts:91`). RPC/network failure → `503`; `isError`/`!success` → `401`; success but no FID → `502`.
3. Fetch user + allowlist in parallel via `Promise.allSettled` (`verify/route.ts:117-120`), then fall back to checking each of the user's custody + verified addresses against the allowlist (`verify/route.ts:135-147`).
4. `saveSession({ fid, …, signerUuid: null })`, then a fire-and-forget `users` upsert + first-login side effects (admin in-app notification + a welcome cast via `autoCastToZao`, `verify/route.ts:216-235`).

### (b) SIWE — `/api/auth/siwe`

`GET` mints a nonce (`crypto.randomUUID()` stripped of dashes) into the **same** `auth_nonces` table, same 15-min TTL (`siwe/route.ts:29-44`). `POST` (schema `siwe/route.ts:49-52`):
1. `parseSiweMessage(message)`, validate `.address` and `.nonce`.
2. Atomic nonce delete-and-return (`siwe/route.ts:76-81`).
3. **Domain pinning** — in production the expected domain is `ENV.NEXT_PUBLIC_SIWF_DOMAIN` (not the client-controllable `Host` header), preventing replay of a signature scoped to another site; outside production it falls back to the request host so previews work (`siwe/route.ts:92-96`).
4. `validateSiweMessage` (expiry) then `publicClient.verifyMessage(...)` on mainnet — this **supports EOAs and smart-contract wallets via ERC-1271** (`siwe/route.ts:106-111`, comment at :106).
5. Allowlist-by-wallet, then a best-effort `getUserByAddress` to attach Farcaster identity if the wallet has one (`siwe/route.ts:131-141`), then `saveWalletSession`. Note the `role`: `'member'` if the wallet resolved a FID, else `'beta'` (`siwe/route.ts:161`).

### (c) Miniapp QuickAuth — `miniapp-quickauth.ts`

The shared verifier `authenticateMiniappToken(token)` (`src/lib/auth/miniapp-quickauth.ts:36-89`) is the single source of truth for both miniapp routes:
1. `quickAuthClient.verifyJwt({ token, domain })` where `domain` is pinned to `ENV.NEXT_PUBLIC_SIWF_DOMAIN || 'zaoos.com'` (`miniapp-quickauth.ts:39,43`) — QuickAuth JWTs are tied to the manifest domain, not the request host.
2. `fid = Number(payload.sub)` — **the FID comes from the verified JWT, never the request body** (`miniapp-quickauth.ts:44`, header comment :1-9). This is the crux of the doc-795 fix.
3. `Number.isInteger(fid) && fid > 0` guard → `401` on garbage.
4. `getUserByFid(fid)` → `404` if not found; allowlist by FID then by each verified ETH address (`miniapp-quickauth.ts:57-68`).
5. On access, `saveSession({ fid, … })`. Returns `{ status, body }` for the route to relay.

`/api/miniapp/auth` (GET) and `/api/miniapp/auth-context` (POST) are thin twins (`miniapp/auth/route.ts`, `miniapp/auth-context/route.ts`) — both pull a bearer token via `extractBearerToken` (`miniapp-quickauth.ts:24-28`) and delegate. The client attaches the token with `sdk.quickAuth.fetch(...)` (see §6).

### (d) Registration — `/api/auth/register`

For a wallet that has no Farcaster account: `registerUser(signature, custody, deadline, fname)` mints a new FID via Neynar, then `createSigner()` returns a signer + approval URL (`auth/register/route.ts:33-45`). Gated by allowlist-by-wallet first.

---

## 4. Managed signers — turning a member into a poster

A read-only session can't post. To write to Farcaster on a user's behalf, ZAOOS uses **Neynar managed signers**: the app holds a per-user `signer_uuid` that, once the user approves it on-chain, authorizes posting as that user's FID. The lifecycle is **create → register → approve → poll → save**.

### Create + register — `POST /api/auth/signer`

`auth/signer/route.ts` (auth-gated via `getSessionData()`, returns existing signer if already approved):
1. **Create** a managed signer — `createSigner()` → `{ signer_uuid, public_key }` (`signer/route.ts:32`, wrapper `neynar.ts:246-254`).
2. **Sign the SignedKeyRequest** with the **app's** wallet (`APP_SIGNER_PRIVATE_KEY`), an EIP-712 typed-data signature over `{ requestFid, key, deadline }` against the Farcaster `SignedKeyRequestValidator` contract (`0x00000000FC700472606ED4fA22623Acf62c60553`) on Optimism (chainId 10) — `signer/route.ts:44-71`. The header comment (`signer/route.ts:10-15`) is explicit: this is the **app's auto-generated wallet (FID 19640), never any user's personal key**.
3. **Register** the signed key — `registerSignedKey(signerUuid, appFid, deadline, signature)` returns `{ signer_uuid, status, signer_approval_url }` (`signer/route.ts:74`, wrapper `neynar.ts:256-275`). The approval URL is handed to the client so the user can approve in their Farcaster app.

### Approve + poll + save — `signer/status` and `signer/save`

After the user approves, the client polls `GET /api/auth/signer/status?signer_uuid=…` (`signer/status/route.ts`):
- Verifies the caller has a session.
- **Never binds a signer that belongs to a different FID** — `if (status.fid && status.fid !== sessionData.fid) → 403` (`signer/status/route.ts:21-26`).
- Only when `status.status === 'approved'` **and** `status.fid === sessionData.fid` does it write `session.signerUuid` and save. It **fails closed** on a missing FID (`signer/status/route.ts:32-42`) so an approved-but-unassociated signer can never be bound.

`POST /api/auth/signer/save` (`signer/save/route.ts`) is the manual SIWN (Sign In With Neynar) path: it checks `parsed.data.fid === sessionData.fid` (`save/route.ts:26`), then re-verifies with Neynar that the signer's FID matches (`getSignerStatus`, `save/route.ts:31-37`) before binding. Two independent FID checks before the credential is trusted.

### Why `signer_uuid` is a server-only posting credential

`signer_uuid` is a **bearer credential** for posting as a FID. If it leaked to the browser, any client could post/like/follow as that user. So:
- It lives **only** in the encrypted session cookie (`signerUuid` field, `session.ts:18`), never sent to the browser (`toPublicSession` zeroes it, §2).
- **Every write route pulls it from the session, never from the request body**, so there is no IDOR — a caller cannot pass someone else's signer:

| Write route | Guard | Neynar call |
|-------------|-------|-------------|
| `POST /api/neynar/cast` | `session.signerUuid` else 401 (`neynar/cast/route.ts:15`) | `publishCast(session.signerUuid, text, embeds)` |
| `POST /api/neynar/like` | `session.signerUuid` else 401 (`neynar/like/route.ts:14`) | `likeCast(session.signerUuid, hash)` |
| `POST /api/neynar/recast` | `session.signerUuid` | `recastCast(...)` |
| `POST/DELETE /api/users/follow` | `session.signerUuid` else 401 (`users/follow/route.ts:13,33`) | `followUser`/`unfollowUser(session.signerUuid, [fid])` |
| `POST /api/casts/delete` | `session.signerUuid` else 401 (`casts/delete/route.ts:13`) | `deleteCast(session.signerUuid, hash)` |

The client-side thin wrappers in `src/lib/farcaster/neynarActions.ts` (`publishCast`, `likeCast`, `recastCast`, `followUser`, `mute/block`, `deleteCastAction`, `getCastSummary`) only ever POST a `text`/`castHash`/`targetFid` — never a signer — to these routes. The server supplies the credential.

---

## 5. The Neynar integration layer

`src/lib/farcaster/neynar.ts` is the **single Farcaster data/write client** for the whole app — roughly 35 endpoint wrappers, all server-side, all carrying `AbortSignal.timeout(10000)` and consistent error formatting.

### The Hypersnap read-proxy failover pattern

The crown-jewel cost optimization. Two base URLs (`neynar.ts:3-6`):

```ts
const NEYNAR_BASE = 'https://api.neynar.com/v2/farcaster';
const READ_BASE = ENV.FARCASTER_READ_API_BASE
  ? `${ENV.FARCASTER_READ_API_BASE}/v2/farcaster`
  : NEYNAR_BASE;
```

`ENV.FARCASTER_READ_API_BASE` points at a **free Neynar-compatible read proxy** (Hypersnap / Quilibrium — see docs 304/309/489). Two header builders:
- `headers()` (`neynar.ts:8-13`) — includes `x-api-key: NEYNAR_API_KEY` (paid Neynar).
- `readHeaders()` (`neynar.ts:16-21`) — **omits the API key** when a free read proxy is configured, since the proxy doesn't need it.

`fetchWithFailover(path, init)` (`neynar.ts:24-39`) is the dispatcher:
- If no proxy is configured (`READ_BASE === NEYNAR_BASE`), go straight to Neynar.
- Otherwise try the proxy first; on a non-OK response **or** a network error, fall back to `NEYNAR_BASE` with full `headers()` (re-attaching the API key).

The result: **read traffic (the bulk of Farcaster API volume — feeds, profiles, followers) is served for free via the proxy, with automatic, transparent fallback to paid Neynar on any hiccup.** Writes always go straight to `NEYNAR_BASE` (they need the signer + API key and have no free equivalent).

### Wrapper catalog

| Category | Functions (selected) | Path | Read/Write |
|----------|----------------------|------|------------|
| Feeds | `getTrendingFeed`, `getChannelFeed`, `getPopularCasts`, `getTrendingTopics` | `/feed/*`, `/trending/*` | read (failover) |
| Casts | `getCastThread`, `getCastConversationSummary`, `postCast`, `publishCast`, `deleteCast` | `/cast*` | read failover / write direct |
| Reactions | `reactToCast` + `likeCast` / `recastCast` aliases | `/reaction` | write direct |
| Users | `getUserByFid`, `getUsersByFids`, `getUserByAddress`, `searchUsers`, `getBestFriends`, `getFollowSuggestions` | `/user/*` | read (failover) |
| Follows | `getFollowers`, `getFollowing`, `getRelevantFollowers`, `followUser`, `unfollowUser` | `/followers`, `/following`, `/user/follow` | read failover / write direct |
| Moderation | `muteUser`/`unmuteUser`, `blockUser`/`unblockUser` | `/mute`, `/block` | write direct |
| Notifications | `getNotifications`, `markNotificationsSeen` | `/notifications*` | read failover / write direct |
| Signers | `createSigner`, `registerSignedKey`, `getSignerStatus` | `/signer*` | direct (API key) |
| Storage | `getStorageUsage` | `/storage/usage` | read (failover) |
| Frames / miniapps | `getFrameCatalog`, `searchFrames`, `getRelevantFrames` | `/frame/*` | read (failover) |
| Onboarding | `registerUser` | `/user` | direct |
| Off-Neynar | `getAccountVerifications` | `api.farcaster.xyz/fc/account-verifications` | direct to Farcaster |

`postCast` (`neynar.ts:80-125`) is the rich publisher — it handles channel posts, replies (`parent`), and embeds, including the Neynar-specific requirement that a **cast embed needs both hash and fid** (`neynar.ts:99-105`), falling back to a `farcaster.xyz/~/conversations/<hash>` URL embed when only a hash is known. It also accepts an optional `apiKey` override so governance-powered accounts (`@thezao`, `@wavewarz` — `ENV.ZAO_OFFICIAL_*` / `WAVEWARZ_OFFICIAL_*`) can post through their own Neynar keys.

`neynarActions.ts` is the **client-side counterpart** — typed `fetch` helpers that call the server routes (which inject the signer). Components import from here, never from `neynar.ts` directly.

---

## 6. Miniapp integration

### Manifest + account association

`public/.well-known/farcaster.json` declares the app to Farcaster clients:
- `accountAssociation` — a signed `{ header, payload, signature }` proving `zaoos.com` is owned by FID 19640. *(Values are a domain-ownership proof, referenced not reproduced here.)*
- `miniapp` block (`farcaster.json:7-21`): `name: "ZAO OS"`, `homeUrl: https://zaoos.com/miniapp`, `splashBackgroundColor: #0a1628` (the navy theme), `webhookUrl: https://zaoos.com/api/miniapp/webhook`, `primaryCategory: "social"`, `canonicalDomain: "zaoos.com"`, and `requiredCapabilities: ["actions.ready"]`.

### Splash dismissal — `<MiniAppReady>`

`src/components/miniapp/MiniAppReady.tsx` is mounted in the root `<body>` before `<Providers>` and does one thing: call `sdk.actions.ready()` ASAP to dismiss the Farcaster native splash on every route (`MiniAppReady.tsx:31-47`). It is deliberately separate from the auth gate so a slow lazy-loaded RainbowKit/AuthKit chunk can't trap the splash. It is idempotent and has a **2.5s fallback timer** (`MiniAppReady.tsx:52-55`) — the comment notes "ready() never invoked" is the #1 cause of stuck Farcaster miniapps.

### Silent auth — `<MiniAppGate>`

`src/components/miniapp/MiniAppGate.tsx` runs a state machine `checking → web | authing → allowed | denied`:
- Detects miniapp via `sdk.isInMiniApp()`; if not in a miniapp → render as plain web (`MiniAppGate.tsx:25-28`).
- Calls `sdk.actions.ready()` again (belt-and-suspenders, `MiniAppGate.tsx:33`).
- Bypasses gating for `/miniapp` and public `/sopha/*` marketing routes (`MiniAppGate.tsx:39-51`).
- **Silent auth**: reads `sdk.context` for a FID *hint*, then calls `sdk.quickAuth.fetch('/api/miniapp/auth-context')` (POST) or `/api/miniapp/auth` (GET) — the authoritative FID is the one the server pulls from the verified JWT, the context FID is only a hint (`MiniAppGate.tsx:56-64`, comment :57-61 cites doc 795). A **5s timeout race** prevents the user from being trapped in `authing` (`MiniAppGate.tsx:65-68`).
- On `hasAccess`, redirect `/` or `/home` to `/home`; on no access, render `NoAccessScreen` with a "Request Access in /zao" compose button (`MiniAppGate.tsx:121-160`).

### Capability-gated actions — `useMiniApp`

`src/hooks/useMiniApp.ts` is the client surface for SDK actions. On mount it dynamically imports `@farcaster/miniapp-sdk`, calls `ready()`, enables `sdk.back.enableWebNavigation()`, caches `sdk.getCapabilities()`, and extracts context: `userFid`, `safeAreaInsets`, `location`, `added` (`useMiniApp.ts:60-109`). It exposes:

| Action | Capability gate |
|--------|-----------------|
| `composeCast({ text, embeds, channelKey })` | requires `isMiniApp && sdkReady` (`useMiniApp.ts:111-127`) |
| `hapticImpact` / `hapticNotification` / `hapticSelection` | checks `capabilitiesRef.includes('haptics.*')` before firing (`useMiniApp.ts:129-157`) |
| `viewProfile(fid)` / `viewCast(hash)` | best-effort, swallow if unsupported (`useMiniApp.ts:159-177`) |
| `addMiniApp()` | prompts the user to add the app (`useMiniApp.ts:179-187`) |

Every action no-ops gracefully outside a miniapp or when the capability is absent — the same component tree runs on the web and inside any Farcaster client.

### Webhook → tokens → send pipeline

1. **Webhook** — `POST /api/miniapp/webhook` (`miniapp/webhook/route.ts`) verifies the event with Farcaster's official `parseWebhookEvent(raw, verifyAppKeyWithNeynar)` (`webhook/route.ts:11`), confirms the FID is in our `allowlist` (silently accepts-but-ignores non-members, `webhook/route.ts:19-29`), then on `miniapp_added` / `notifications_enabled` **upserts** the `{ token, url }` into `notification_tokens` keyed by FID; on `miniapp_removed` / `notifications_disabled` it flips `enabled=false` (`webhook/route.ts:31-59`).
2. **Send** — `POST /api/notifications/send` (`notifications/send/route.ts`) is **admin-only** (`send/route.ts:28`). Schema: up to 500 recipient FIDs, `title`≤100, `body`≤500, a `targetUrl` (`send/route.ts:17-22`). It fetches enabled tokens, enforces **per-user rate limits — 1 per 30s and 100 per day** via the `notification_log` table (`send/route.ts:59-98`), groups tokens by their Farcaster notification URL, POSTs in parallel with `Promise.allSettled` (`send/route.ts:113-180`), **bulk-disables invalid tokens** the API reports back (`send/route.ts:156-162`), logs successful sends for rate-limit accounting, and writes an audit-log entry (`send/route.ts:204-210`).
3. **Status** — `GET /api/notifications/status` (`notifications/status/route.ts`) returns whether the current FID has notifications enabled.

---

## 7. The gate

`src/lib/gates/allowlist.ts` — `checkAllowlist(fid?, walletAddress?)` is the single membership oracle, checked at every auth surface. It returns `{ allowed, entry? }` and tries, in order (all filtered to `is_active = true`):

1. **By FID** in the `allowlist` table (`allowlist.ts:13-23`) — fastest, most reliable.
2. **By wallet** in `allowlist`, across three fields: `wallet_address`, `custody_address`, and the `verified_addresses` JSONB array via `.contains()` (`allowlist.ts:26-61`).
3. **Fallback to the `users` table** by FID then wallet (`allowlist.ts:64-87`) — covers members added through the admin panel.

Enforcement points:
- **SIWF** (`auth/verify/route.ts:117-157`) — FID first, then each custody/verified address.
- **SIWE** (`auth/siwe/route.ts:120-123`) — by wallet.
- **Miniapp** (`miniapp-quickauth.ts:57-68`) — FID then each verified ETH address.
- **Register** (`auth/register/route.ts:28-31`) — by wallet, before minting a FID.
- **Webhook** (`miniapp/webhook/route.ts:19-29`) — FID must be a member before a token is stored.

A non-allowlisted login returns `403 { redirect: '/not-allowed' }`.

---

## 8. Security model

The full audit is **doc 795**; the architecture-level guards:

- **CSP `frame-ancestors *`** for multi-client embedding — `src/middleware.ts:108`. The app is a miniapp embedded by Warpcast, Base App, Coinbase Wallet, and unknown third-party clients, so it cannot enumerate iframe origins. `X-Frame-Options` is **intentionally not set** (`middleware.ts:116-120`) because XFO would override the CSP and break embedding. The CSP also enumerates a long `frame-src` allowlist for embedded players/frames and uses a per-request **nonce** for `script-src` with `'strict-dynamic'` (`middleware.ts:96-97,127-129`).
- **Rate limiting** — a prefix-ordered table in `middleware.ts:13-78` (most-specific first). Farcaster-relevant limits: `/api/casts/delete` 10/min, `/api/casts` 15/min, `/api/users/follow` 15/min, `/api/auth` 10/min, `/api/neynar` 15/min, `/api/miniapp` 10/min, `/api/notifications` 20/min. Keyed by `ip:pathname` (`middleware.ts:164-167`).
- **Env validation at module load** — `src/lib/env.ts:28-38` `requireEnv`s the crown jewels (`NEYNAR_API_KEY`, `SESSION_SECRET`, `APP_SIGNER_PRIVATE_KEY`, `APP_FID`) so a misconfigured deploy fails fast; `optionalSecretEnv` enforces a minimum length on optional secrets (`env.ts:18-26`).
- **Server-only credentials** — `signerUuid` (per-user, in-cookie), `APP_SIGNER_PRIVATE_KEY` (app wallet, env), `NEYNAR_API_KEY` (env) never reach the browser. The session route uses `toPublicSession`; write routes read the signer server-side.
- **Secret/PII hygiene** — `.claude/rules/secret-hygiene.md` and `pii-hygiene.md` govern agent-driven commits to this surface. (Consistent with those rules, the `accountAssociation` proof and `.env` values are referenced here, not reproduced.)

### The doc-795 lesson (auth-bypass)

`/api/miniapp/auth-context` once minted a session — including admin — from an **unsigned body FID**. Because `saveSession` derives `isAdmin` from public `ADMIN_FIDS` (§2), any unauthenticated caller could POST an admin's FID and receive an admin cookie: a live account-takeover primitive. The fix moved both miniapp routes onto the shared `authenticateMiniappToken` helper, which takes the FID **only** from the verified QuickAuth JWT `payload.sub` (`miniapp-quickauth.ts:43-44`). The header comments in `miniapp-quickauth.ts`, `auth-context/route.ts`, and `MiniAppGate.tsx` all now cite doc 795 as a tripwire against regression. **The architectural principle: identity must always come from a verified source (signature or signed JWT), never from request-body input — and `isAdmin` is derived, never accepted.**

---

## 9. How it was built / lessons

- **Monorepo as lab.** The Farcaster client is the origin of ZAOOS (`CLAUDE.md`: "started as a gated Farcaster social client for The ZAO") and remains the spine while other experiments graduate out (ZAOstock → `zaostock.com`, redirected in `middleware.ts:138-144`).
- **One client module, two cost tiers.** Centralizing every Farcaster call in `neynar.ts` made the Hypersnap read-proxy a *one-knob* change: set `FARCASTER_READ_API_BASE` and ~25 read endpoints transparently route to a free proxy with automatic fallback, while ~10 write endpoints stay on paid Neynar. No call site changed.
- **Embedding forced unusual cookie + header choices.** `SameSite=None` (§2) and `frame-ancestors *` (§8) are both concessions to running inside arbitrary Farcaster client iframes — the kind of decision you only reach by shipping into real clients and watching sessions silently drop.
- **Managed signers decouple identity from posting.** Login (read access, gated) and signer approval (write access, on-chain consent) are separate steps. A wallet-only (SIWE) user can browse but never post; a SIWF/miniapp user posts only after approving a signer the *app* registered with its *own* wallet — the user's keys are never touched.
- **Silent miniapp UX is a feature, not an accident.** QuickAuth + `MiniAppReady` + `MiniAppGate`'s timeout races exist to make the embedded experience feel native: no splash hang, no signature prompt, no spinner trap.
- **The auth-bypass (doc 795)** is the cautionary tale baked into the comments: trusting an unsigned body FID for a `isAdmin`-deriving `saveSession` was a one-line account-takeover. The fix — a shared, JWT-only verifier — is now the canonical pattern for any future miniapp route.

---

## Related docs

- **795** — Farcaster client security audit + cleanup (the audit companion to this architecture doc).
- **306 / 308** — Farcaster client / managed-signer prior art.
- **173** — Farcaster miniapps integration.
- **017** — Neynar onboarding.
- **304** — Farcaster read-API proxy / cost optimization (Hypersnap/Quilibrium).
