---
topic: infrastructure
type: decision
status: research-complete
last-validated: 2026-07-05
superseded-by:
related-docs: 354, 695, 710
original-query: "Can zaalcaster play computer audio into a Juke space WITHOUT a browser extension? Can a web page get a host/speaker LiveKit publish token (SIWF / partner token / dev key) and publish a mixed track via livekit-client, or does Juke v1 gate audio publishing like agent-join? What does ZAODEVZ/Zuke already have to reuse? Is headless/Node publish possible? Given our getUserMedia mixing engine (public/juke-dj.js), what is the minimal non-extension path and its blockers? Decide: Chrome extension (built) vs in-our-web-page publish that deploys to Vercel."
tier: STANDARD
---

# 968 — Juke Space Audio Publish Paths (extension vs in-page vs virtual device)

> **Goal:** Decide how zaalcaster plays computer audio into a Juke space. Three real paths exist; pick per constraint (works-today vs Vercel-deployable vs zero-code).

## Key Decisions (recommendations first)

| Decision | Verdict | Why |
|----------|---------|-----|
| Is a browser extension the ONLY way? | **No** | Three paths work: extension (built), in-page livekit-client publish, and an OS virtual audio device. |
| Fastest path that works today | **USE the extension OR a virtual audio device (BlackHole)** | Both ride Juke's own publish stack; no Juke SDK, no host-role gymnastics in code. |
| Vercel-deployable "our web page" path | **BUILD in-page publish with @farcaster/auth-client (SIWF) + livekit-client `publishTrack(mixedTrack)`** | All endpoints are documented; we do NOT need Juke's unpublished SDK. But it is the biggest lift and needs Zaal to be the space host. |
| Can Node/headless publish audio? | **No (practical)** | Juke issues LiveKit publish tokens only through the SIWF-gated `/v1/rooms/{id}/join` (browser). No developer endpoint mints a host publish token. Audio-in-Node is solvable (ffmpeg+BlackHole); the token is the wall. |
| Does Juke v1 block human audio publish like it blocks agents? | **No** | The agent path ("agents do not publish audio in v1") is separate. Juke docs: "desktop speakers are first-class once promoted" via web SDK / livekit-client. Humans publish; agents don't. |
| Reuse from ZAODEVZ/Zuke? | **Only creation + iframe, NOT publish** | Zuke is iframe-only (Path A) + developer API (Path B). No livekit-client, no vendored publish SDK. |

## Findings

### 1. Human audio publish IS allowed — the gate is host/speaker promotion, not v1

Juke's own spec (the `llms.txt` / SKILL.md Zaal pasted, 2026-07-05) is explicit:

- Auth ladder step 6: "Speaking: only after host/co-host promotion grants LiveKit publish permission. Promotion + mic publish works the same on web (SDK / hosted iframe via `livekit-client`) and native iOS — desktop speakers are first-class once promoted."
- The "agents cannot publish audio in v1" limit is the **agent-join** path only (x402 / partner agent). It does not apply to a human host/speaker.

So a browser with `livekit-client` + a publish-capable LiveKit token CAN broadcast a custom audio track. `room.localParticipant.publishTrack(track)` publishes any `MediaStreamTrack` — including the mixed track our `public/juke-dj.js` `MediaStreamDestination` produces. We do not even need the getUserMedia patch in our own page; publish the mixed track directly.

### 2. The token is the real gate — and it is browser-only

To publish you need a LiveKit token with publish rights. Juke mints LiveKit tokens through:

- `POST /v1/rooms/{id}/join` (Bearer Juke JWT) → returns `{ livekit_token, livekit_ws_url, role }`. Publish rights come with `role` in `{speaker, co_host, host}`.
- `POST /v1/rooms/{id}/token` refreshes it.

The Juke JWT itself comes from SIWF (`/v1/auth/siwf/nonce` → relay → `/v1/auth/siwf/login`) — a browser flow — or a partner token (needs `JUKE_API_KEY`, but partner tokens are "room participation only" and "host promotion still required to speak"). There is **no developer endpoint that hands a server/Node a host publish token**. Therefore headless/Node publish is blocked at the token layer, even though publishing audio from Node is otherwise possible (LiveKit server SDK + `ffmpeg` capturing a virtual device like BlackHole).

Consequence: **the host must be a real browser signed in as a fid with host/speaker role.** If Zaal creates the space (iOS app, or dev API where his fid owns the Juke app), he is host → SIWF as himself on our page → `/join` returns `role: host` + a publish token → publish the mix. If he is not host, he needs another human to promote him.

### 3. Zuke gives creation + iframe, not publish

Verified against `ZAODEVZ/Zuke` (main, 2026-07-05):

- `src/components/spaces/JukeEmbed.tsx` — `<iframe src={jukeEmbedUrl(...)}>` (Path A, hosted iframe). No `livekit-client`.
- `package.json` deps: `@farcaster/auth-client@^0.7.1`, `@farcaster/auth-kit@^0.8.2`, `@neynar/nodejs-sdk@^3.175.0`. **No `livekit-client`.**
- `src/lib/spaces/juke-api.ts` (create space, key-only), `juke-partner-token.ts` (partner SSO), `jukeAgentJoin.ts` (data-only agent). `src/lib/publish/auto-cast.ts` is cast auto-posting, not audio.
- No `livekit`, `embed-sdk`, or `publishTrack` files anywhere in the tree.

So the audio always happens inside Juke's cross-origin iframe. We cannot inject our mix into that iframe (cross-origin `getUserMedia` is unreachable). To publish our mix in our own page we must talk LiveKit ourselves — which Zuke never does, so there is nothing to copy for the publish half. We already ported Zuke's create/embed into `zaalcaster/juke.js`; that is the reusable part.

### 4. Why the extension works and the iframe does not

The built extension (`zaalcaster/extension/`) patches `getUserMedia` in the MAIN world of juke.audio itself, so **Juke's own `livekit-client`** publishes the mix. It rides Juke's entire auth + host + publish stack — that is why it is the least-code working path. The hosted iframe embedded in our page is cross-origin, so the same patch is impossible from outside; only an extension (or Juke's own page) can reach it.

### 5. The three paths, compared

| Path | Vercel-deployable | Setup for Zaal | Code to build | Verifiable headless | Robustness | Must be host? |
|------|-------------------|----------------|---------------|---------------------|-----------|---------------|
| **A. Chrome extension** (built, #24) | No (load-unpacked) | load unpacked once | done | No (needs browser) | High — rides Juke stack | Yes (host the space normally) |
| **B. In-page livekit publish** | **Yes** | none | High: SIWF flow (@farcaster/auth-client) + livekit-client join + `publishTrack(mix)`; reimplement 3 REST calls (no Juke SDK needed) | No (browser only) | Medium — most moving parts | Yes (SIWF as the host fid) |
| **C. Virtual audio device** (BlackHole/Loopback) | N/A (local) | install driver + route mic+music into it, select as mic on juke.audio | ~none | No | Highest — works with ANY space app (Juke, X, Discord) | Yes (host normally) |

All three require Zaal to be a host/speaker — that is a Juke rule, not a path property.

### 6. Minimal non-extension path (Path B), concretely

1. `public/juke-dj.js` already yields a mixed `MediaStreamTrack` (mic + tab audio via getDisplayMedia + files). Reuse as-is; skip `installBridge()` — publish the track directly.
2. Add `@farcaster/auth-client` + `livekit-client` to a web bundle (breaks zero-dep, but it is a browser page — acceptable).
3. SIWF: `POST /v1/auth/siwf/nonce` → open relay channel → render `farcaster://connect` as a QR (desktop) / tap (mobile) → poll → `POST /v1/auth/siwf/login` → Juke JWT.
4. `POST /v1/rooms/{id}/join` with the JWT → `{ livekit_token, livekit_ws_url, role }`. Require `role ∈ {host, speaker, co_host}`, else surface "ask a host to promote you."
5. `new Room()`, `room.connect(livekit_ws_url, livekit_token)`, `room.localParticipant.publishTrack(mixedTrack, { source: Track.Source.Microphone })`.
6. Keep "Powered by Juke" + host identity visible (Juke design rule).

Blockers: (a) Zaal must be host of the space; (b) two audio connections if he also listens via the iframe — publish-only in this page, listen in the Juke app/iframe elsewhere, or set the iframe to `?audio=off`; (c) cannot verify headless — every step needs his browser; (d) SIWF QR + relay polling is the fiddly part.

## Also See

- [Doc 354](../354-cross-posting-infrastructure-audit/) — cross-posting infra (auto-cast lineage)
- [Doc 695](../../) — Juke developer API path A/B (referenced by Zuke's juke-api.ts)
- zaalcaster repo: `juke.js` (create/embed port), `extension/` (Path A built), `public/juke-dj.js` + `public/dj.html` (mix engine)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Decide Path A (extension, ship now) vs Path B (Vercel product) for zaalcaster spaces DJ | @Zaal | Decision in chat | 2026-07-06 |
| If Path B: build `public/space-dj-live.html` — SIWF join + livekit-client publishTrack(mix), role-gated; PR merged to zaalcaster | @Zaal | PR | 2026-07-12 |
| Validate first real DJ session in-browser (host a space, publish mix, confirm listeners hear music+voice) — report hash/outcome | @Zaal | Manual test | 2026-07-08 |
| If Path C: document BlackHole aggregate-device setup as a one-pager in zaalcaster/extension or a SETUP note | @Zaal | Doc | 2026-07-12 |

## Sources

- [Juke Audio llms.txt / SKILL.md — pasted by Zaal 2026-07-05] `[FULL]` — canonical spec; auth ladder step 6 (speakers first-class once promoted), agent audio v1 limit, SIWF endpoints, /join returning livekit_token+role, partner-token scope. Primary source.
- [ZAODEVZ/Zuke repo — main branch, GitHub API 2026-07-05](https://github.com/ZAODEVZ/Zuke) `[FULL]` — package.json deps (no livekit-client), JukeEmbed.tsx (iframe), src/lib/spaces/* tree. Verified via `gh api`.
- [Space DJ 1.0.2 extension — Downloads/space-dj-1.0.2.zip] `[FULL]` — decompiled inject.js/background.js confirm the getUserMedia-patch + tab-capture mechanism the built extension reuses.
- [LiveKit client publishTrack — livekit-client docs](https://docs.livekit.io/client-sdk-js/) `[PARTIAL - API shape known from Juke docs' livekit-client references; not re-fetched this run]` — `room.localParticipant.publishTrack(MediaStreamTrack)` is the publish primitive.
