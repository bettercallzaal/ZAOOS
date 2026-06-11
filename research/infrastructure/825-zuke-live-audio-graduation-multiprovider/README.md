---
topic: infrastructure
type: extraction-plan
status: research-complete
last-validated: 2026-06-11
original-query: Confirm Zuke (ZAODEVZ/Zuke) as the permanent home for all ZAO live audio; audit its current state; plan the multi-provider build-out (Juke primary + 100ms + more as backups) and the ZAOOS spaces deprecation path
related-docs: 695, 710, 609, 610, 817
tier: DEEP
---

# 825 - Zuke: The Permanent Home for ZAO Live Audio (Multi-Provider Graduation Plan)

> **Goal:** Make [`ZAODEVZ/Zuke`](https://github.com/ZAODEVZ/Zuke) the permanent, premier surface for **all** ZAO live audio content. Zuke already graduated from ZAOOS on **Juke**; this doc audits its real state, sets the **multi-provider** direction (Juke primary, 100ms + Stream.io + others as backups/options), maps which ZAOOS spaces code becomes provider adapters vs gets deleted, and defines the cutover so ZAOOS `/spaces` deprecates cleanly once Zuke is proven.

## Decisions

| # | Decision | Rationale | Status |
|---|----------|-----------|--------|
| 1 | **Zuke (`ZAODEVZ/Zuke`) is the canonical, permanent home for all ZAO live audio** | Already graduated, own repo + Supabase + Vercel (`zuke-sandy.vercel.app`), Juke integration live | LOCKED 2026-06-11 |
| 2 | **Zuke is multi-provider, not Juke-only.** Juke is primary; 100ms, Stream.io, Songjam are backup options behind a provider-adapter layer | Zaal: "make ZUKE our premier app… give it many backups, as many options as we can, including Juke APIs". Resilience + reach (Juke = Farcaster-native; 100ms/Stream = full control; Songjam = X Spaces ingest) | LOCKED 2026-06-11 |
| 3 | **The hardened ZAOOS 100ms code becomes Zuke's `HmsProvider` adapter — it is NOT thrown away** | The #817 work (gate enforcement, session integrity, one-open-session index) is hard-won; it ports as a provider, not a copy-paste | LOCKED 2026-06-11 |
| 4 | **Delete 100ms/spaces code from ZAOOS only AFTER it is confirmed working in Zuke** | Zaal: "we can delete the code after we confirm it works on ZUKE." No premature deletion; run both until cutover proven | LOCKED 2026-06-11 |
| 5 | **No hard listener gate. Live audio on Zuke is open + members-first discovery.** Juke's embed stays open; we do not block listeners by ZAO holding | Zaal 2026-06-11: "no hard gate." Reach > exclusivity for live audio; the open Farcaster-native model is the point. Drops the gating blocker entirely | LOCKED 2026-06-11 |
| 6 | **ZAOOS `/spaces` redirects to Zuke `/live` at cutover; code deleted, routes redirect** | Standard ZAO graduation model (CLAUDE.md): own repo, own DB, own domain, delete from lab, redirect routes | PLANNED |
| 7 | **Zuke gets its own custom domain** (`zuke.thezao.com` per its setup doc) | Premier standalone product, not a Vercel preview alias | PLANNED (in Zuke's own v1 roadmap) |
| 8 | **Cross-repo work is driven by prompting Zuke's own Claude Code sessions + monitoring**, since this session is scoped to `bettercallzaal/zaoos` | Zaal: "we can prompt the zuke claude code sessions too if we wanna just monitor that". This doc is the handoff brief for those sessions | LOCKED 2026-06-11 |

---

## Part 1 — Zuke Audit (state as of 2026-06-11, `main` @ `0451b5d`)

Cloned and read end-to-end. Zuke is **more mature than its own README claims.**

### Stack (mirrors ZAOOS — clean fork)

Next.js `16.2.6`, React `19.2.4`, `@supabase/supabase-js`, `iron-session` v8, `@farcaster/auth-kit` + `@farcaster/auth-client`, `@neynar/nodejs-sdk`, Zod v4, Vitest. Tailwind v4. Same idioms as ZAOOS (`@/` alias, `getSessionData()`, Zod `safeParse`, `NextResponse.json`).

### The two Juke integration paths (per research doc 695)

- **Path A — keyless iframe embed** (`src/lib/spaces/juke.ts`): renders `https://juke.audio/embed/{spaceId}`. Anonymous listen, SIWF participation, hand-raise, mic — **all handled by Juke's hosted UI**. No API key. Hardened space-id validation (`/^[A-Za-z0-9_-]{1,128}$/`) so a crafted path can't smuggle a different origin into the iframe. Supports `?audio=off` (second-screen) and a `partnerToken` (Juke Partner-SSO bridge — pre-authenticates the visitor, no SIWF QR).
- **Path B — developer API** (`src/lib/spaces/juke-api.ts`): `POST https://api.juke.audio/v1/developer/spaces`, **key-only** auth (`X-Juke-Api-Key`; room owner = app `owner_fid`). Defensive response parsing (`extractSpaceId` tries `id`/`space_id`/`spaceId`/`room_id`, top-level + one level deep) because Juke's create-space response is undocumented/beta. Never throws — returns a discriminated `CreateJukeSpaceResult`.

### Auth — already at v1 (README is stale)

The README says "Admin password (v0), SIWN in v1." **Reality: SIWF is fully landed** (last merged PR: `ws/admin-auth-siwf`):

- `/api/auth/nonce`, `/api/auth/verify`, `/api/auth/session`, `/api/auth/logout` + `AuthKitWrapper.tsx`.
- `verify/route.ts` does real SIWF: `createAppClient().verifySignInMessage()` over Optimism RPC, nonce single-use (`consumeNonce`), Neynar profile hydration, then **admin-gates by `ENV.ZUKE_ADMIN_FIDS`** (403 if the FID isn't an admin).
- `session.ts` keeps a **legacy `zuke_admin` password cookie** as back-compat only, explicitly marked for deletion after secret-rotation task #71.

**Implication:** Zuke's auth foundation is solid and Farcaster-native. What it gates today is **admin (who can create spaces)** — not listeners.

### Database

Two tables (`scripts/juke-spaces-migration*.sql`): `juke_spaces` and `juke_webhook_events`.

- `juke_spaces`: `id, title, status (scheduled|active|ended), created_by_fid, scheduled_at/started_at/ended_at, recording_url, participant_count, participants (jsonb), embed_url, raw`.
- Webhook handling (`jukeSpacesDb.ts`) is **idempotent**: `recordWebhookEvent` inserts on a `signature_hash` unique constraint and returns `false` on `23505` (replay) so side effects don't double-run. Participant add/remove dedupes on `fid`. This is the Juke-side analog of the session-integrity work we did for 100ms in #817.

### Create-space authz (`/api/juke/space`)

Two ways in: an **admin session** OR a shared `JUKE_CREATE_PASSWORD` (constant-time compared, SHA-256'd first). The password path is what `/live/create` and the ZAOcoworking bot use. 503s cleanly if `JUKE_API_KEY` is unset (Path A keeps working regardless).

### Surfaces present

`/live`, `/live/[spaceId]`, `/live/create`, `/live/recordings`, `/listen`, `/juke` , `/juke-status` (ops dashboard: recent spaces, webhook timeline, integration stats), `/admin` console, agent-join + webhook-admin routes, a `cron/juke-stale-rooms` sweeper. Components: `JukeEmbed`, `JukeListenerBadge`, `EndJukeSpaceButton`.

### Gaps (the real work)

1. **No listener token-gating** — Juke's hosted embed is open. ZAO holder-gating (the thing 100ms enforces server-side in ZAOOS) has no equivalent in Zuke. **This is the #1 blocker** for Zuke replacing *gated* ZAOOS spaces. (See Part 4.)
2. **No provider abstraction** — every type/route/table is Juke-specific. The multi-provider vision needs a `LiveAudioProvider` interface. (See Part 2.)
3. **Auto-cast is a stub** (`src/lib/publish/auto-cast.ts`) — no-op until the ZAO signer is wired.
4. **README/setup docs are stale** (claim admin-password auth; SIWF already shipped).

---

## Part 2 — The Multi-Provider Direction (Juke + backups)

Zaal's ask: *"make ZUKE our premier app for ZAO live content… give it many backups, as many options as we can, including Juke APIs."*

### Prior art already exists in ZAOOS — port it, don't reinvent

ZAOOS `src/components/spaces/AudioRoomAdapter.tsx` **already is** a provider router:

```ts
const provider = room.provider ?? 'stream';
if (provider === '100ms') return <HMSVideoRoom roomName={room.id} role={role} … />;
return <StreamRoomAdapter room={room} user={user} … />;  // Stream.io
```

ZAOOS runs **four** audio backends today: **100ms** (`HMSVideoRoom`), **Stream.io** (`StreamRoomAdapter`), **Juke** (embed), **Songjam** (X Spaces ingest). The lesson: a `room.provider` discriminator + per-provider component, each behind `next/dynamic` so visitors only download the SDK their room needs (~150KB each).

### Target architecture in Zuke

Generalize `juke_spaces` → a provider-agnostic `spaces` table with a `provider` column, and introduce a provider-adapter interface:

```
src/lib/spaces/providers/
  types.ts        # LiveAudioProvider interface: createRoom, getEmbed, endRoom, handleWebhook, gateJoin
  juke.ts         # PRIMARY — wraps existing juke-api.ts + juke.ts (already built)
  hms.ts          # BACKUP — ported from ZAOOS hms100ms.ts + 100ms routes (carries #817 hardening)
  stream.ts       # OPTIONAL — ported from ZAOOS StreamRoomAdapter
  songjam.ts      # OPTIONAL — X Spaces ingest
  index.ts        # registry: pick provider per space; fall back if primary down
```

| Provider | Strength | Role in Zuke | Source |
|----------|----------|--------------|--------|
| **Juke** | Farcaster-native, hosted UI, zero-infra, SIWF built in | **Primary** | already in Zuke |
| **100ms (HMS)** | Full control, server-side gating, recording, video, transcription | **Backup / gated rooms** | port from ZAOOS (#817-hardened) |
| **Stream.io** | Mature SDK, scale | Optional | port from ZAOOS `StreamRoomAdapter` |
| **Songjam** | Ingests X / Twitter Spaces | Optional (cross-post reach) | port from ZAOOS `songjam.ts` |

"Backup" = both **failover** (if Juke's API/embed is down, host on 100ms) and **capability** (gated/recorded/video rooms Juke's hosted embed can't do).

---

## Part 3 — ZAOOS Spaces Surface Inventory (what ports, what deletes)

Inventoried 2026-06-11. ZAOOS already mixes 100ms + Juke + Stream + Songjam under `spaces/`.

### Becomes a Zuke provider adapter (port, then delete from ZAOOS)

| ZAOOS path | Becomes |
|------------|---------|
| `src/lib/social/hms100ms.ts` | core of `providers/hms.ts` |
| `src/lib/social/sweep100msRooms.ts` | Zuke `cron/hms-stale-rooms` |
| `src/app/api/100ms/rooms/**`, `…/token/route.ts`, `…/webhook/route.ts`, `…/stage/route.ts` | Zuke `api/hms/**` (carry the **gate-auth** + **stage-auth** tests — that's the #817 enforcement) |
| `src/components/spaces/HMSVideoRoom.tsx` | Zuke `components/spaces/HmsRoom.tsx` |
| `src/components/spaces/AudioRoomAdapter.tsx` | Zuke `providers/index.ts` router (generalized) |
| `src/components/spaces/StreamRoomAdapter.tsx` | `providers/stream.ts` (if Stream kept) |
| `src/lib/spaces/songjam.ts`, `SongjamSpaceCard.tsx` | `providers/songjam.ts` (if kept) |
| `src/lib/spaces/roomsDb.ts`, `sessionsDb.ts`, `src/lib/social/msRoomsDb.ts` | Zuke `spaces` table DAL (merge with `jukeSpacesDb.ts`) |

### The #817 hardening that MUST carry into the HMS adapter

These are 100ms-specific guarantees with no current equivalent in Zuke's Juke path — re-apply them in `providers/hms.ts`:

1. **Server-side token-gate enforcement** — `api/100ms/token` checks ZAO holding/membership before minting a join token (`gate-auth.test.ts`, `stage-auth.test.ts`).
2. **Session integrity** — dedup + the `uniq_*_sessions_open_per_room` unique partial index (one open session per room).
3. **Stale-room sweeper** — `sweep100msRooms.ts` closes orphaned rooms.

> Juke's side already has *idempotent webhooks* (`signature_hash` unique) — the equivalent of (2) for its own model. So when porting, (2) applies to the **HMS adapter**, not the Juke adapter.

### Stays in ZAOOS (do NOT move) — shared infra Zuke forks its own copy of

`src/middleware.ts` (rate limit/CORS/`frame-src`), `src/lib/auth/session.ts`, `src/lib/db/supabase.ts`, Neynar/Farcaster wallet resolution. Zuke already has its own forked copies of these (clean break — own DB, own session secret).

### Cross-references to clean up at deletion

`src/app/api/chat/assistant/route.ts`, `src/app/api/admin/member-fix/route.ts`, `src/app/api/stream/rooms/route.ts`, `src/app/api/spaces/stats/route.ts`, `SpacesLeaderboard.tsx`, nav entries in `community.config.ts` all reference spaces — grep and redirect/remove at cutover.

---

## Part 4 — Gating: Resolved (no hard gate)

**Decision (Zaal 2026-06-11): no hard listener gate.** ZAO live audio on Zuke is **open + members-first discovery**, not holder-gated. This removes what was the only real blocker.

What this means concretely:

- **Listeners are not blocked by ZAO holding.** Anyone with the link can listen — that is the Farcaster-native, reach-first model Juke is built for.
- **"Members-first" is a discovery/surfacing nuance, not enforcement.** Member-facing surfaces (ZAO app, member feeds, the ZAOcoworking bot) promote rooms first; the room itself stays open.
- **Creation stays gated** as it already is in Zuke — only `ZUKE_ADMIN_FIDS` (or the `JUKE_CREATE_PASSWORD` path) can spin up a space. Open to listen, controlled to host.
- **The #817 server-side *token-gate* logic does NOT port.** It was the holder-gate on `api/100ms/token`; with no hard gate it's dropped. The rest of the #817 hardening — **session integrity, the one-open-session index, the stale-room sweeper** — still ports into the HMS provider (those are correctness, not gating).

Net effect on the plan: Part 5 loses its "decide + implement gating" step; the HMS provider port gets simpler (mint join tokens without a holder check).

---

## Part 5 — Cutover Plan (no deletion until proven)

Phased, with ZAOOS spaces running the whole time until step 6.

1. **Provider layer in Zuke** — add `providers/types.ts` + wrap existing Juke code as `providers/juke.ts`. No behavior change. (Zuke session)
2. **Port HMS as a provider** — bring `hms100ms.ts` + `api/100ms/**` + `HMSVideoRoom` into `providers/hms.ts` / `api/hms/**`, carrying the #817 **session-integrity + one-open-session index + sweeper** (drop the holder-gate per Part 4). Generalize `juke_spaces` → `spaces` with a `provider` column (additive migration). (Zuke session)
3. **Wire backups + auto-cast** — provider failover registry; replace the auto-cast stub with the ZAO signer. (Zuke session)
4. **Prove parity** — run a real ZAO event on Zuke (a Juke room + one HMS room). Recording lands, webhooks fire, both providers join cleanly. This is the "confirmed working" bar from Decision #4.
6. **Deprecate ZAOOS spaces** — only now: delete the 100ms/spaces surface from ZAOOS (Part 3 list), add redirects `/spaces` + `/spaces/hms/[id]` → Zuke `/live`, drop nav entries, remove `space_sessions` etc. after a verification window. (ZAOOS session — this repo, this branch)
7. **Domain + branding** — `zuke.thezao.com`, Zuke identity/logo. (Zuke session)

---

## Part 6 — Env + Deps Delta (Zuke vs ZAOOS)

Zuke already carries: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JUKE_API_KEY`, `JUKE_WEBHOOK_SECRET`, `SESSION_SECRET`, `ZUKE_ADMIN_FIDS`, `OPTIMISM_RPC_URL`, `NEYNAR_API_KEY`, `JUKE_CREATE_PASSWORD`, (legacy `ZUKE_ADMIN_PASSWORD`).

To add for the HMS/Stream providers (from ZAOOS `.env.example`): `HMS_*` (100ms management token / template / app access key + secret), `STREAM_API_KEY` + `STREAM_API_SECRET` (if Stream kept), plus the ZAO **token-gate** inputs (contract address + RPC for the holder check) and the **app signer** for auto-cast. New deps when those providers land: `@100mslive/react-sdk`, `@stream-io/video-react-sdk` — split via `next/dynamic` so they don't bloat the Juke path.

---

## Part 7 — Open Questions / Risks

1. ~~Gating model~~ — **resolved: no hard gate** (Part 4). Open + members-first discovery.
2. **Juke beta surface** — create-space response is undocumented; `extractSpaceId` is defensive but could break if Juke changes shape. Keep the HMS provider as the proven fallback.
3. **Two Supabase projects** — Zuke has its own DB (clean break). Don't let ZAOOS and Zuke schemas drift; after cutover, ZAOOS holds no spaces tables (echoes the doc 610 two-project lesson).
4. **Recording/storage** — Juke hosts recordings; the HMS provider needs its own recording sink (S3/Supabase storage). Decide where HMS recordings live.
5. **Stale docs in Zuke** — its README + `setup-zuke.md` still say admin-password auth. Update as part of step 1.

---

## Part 8 — Driving Zuke From Here (cross-repo workflow)

This session is scoped to `bettercallzaal/zaoos`, so it **cannot push to `ZAODEVZ/Zuke`**. The workflow Zaal chose: **prompt Zuke's own Claude Code sessions + monitor.** This doc is the handoff brief. Per Zuke task:

- **Step 1–4 + 7** → Zuke Claude Code sessions (work happens in the Zuke repo).
- **Step 6** (delete from ZAOOS + redirects) → a ZAOOS session on this branch, gated on step 5 proof.
- **Ready-to-paste kickoff for a Zuke session:** *"Add a `LiveAudioProvider` interface under `src/lib/spaces/providers/`, wrap the existing Juke code as the `juke` provider with no behavior change, and scaffold an `hms` provider stub. Generalize `juke_spaces` → `spaces` with an additive `provider` column migration. Context: ZAOOS research doc 825."*

---

## Sources

- Live clone of `ZAODEVZ/Zuke` @ `main` `0451b5d` (read 2026-06-11): `juke.ts`, `juke-api.ts`, `jukeSpacesDb.ts`, `session.ts`, `api/auth/verify`, `api/juke/space`, `zuke.config.ts`, README, AGENTS.md, setup-zuke.md.
- ZAOOS spaces surface inventory (2026-06-11): `AudioRoomAdapter.tsx`, `hms100ms.ts`, `api/100ms/**`, `roomsDb.ts`, `sessionsDb.ts`.
- Doc 695 (Juke two-path integration), Doc 710 (Juke API supersession note), Doc 609/610 (ZAOstock graduation + two-project DB lesson), #817 (100ms gate enforcement + session integrity hardening).
