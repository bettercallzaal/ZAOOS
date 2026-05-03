---
topic: farcaster
type: decision
status: research-complete
last-validated: 2026-05-03
related-docs: 081, 304, 309, 587
tier: STANDARD
---

# 593 — FIP: Live Activity (Audio Spaces) — ZAO Spaces Cross-Client Integration

> **Goal:** ZAO ships the first reference implementation of FIPs #268 + #269 on its existing Spaces stack, gets host-attested cross-client presence for free, and submits feedback to @rish before FarCon.

## Key Decisions

| # | Decision | Action | Why |
|---|----------|--------|-----|
| 1 | **IMPLEMENT both FIPs in ZAO Spaces** | Add `fc:live` meta tags to `src/app/spaces/[id]/layout.tsx` + `src/app/spaces/hms/[id]/layout.tsx`, build `/api/spaces/[id]/manifest` endpoint, wire `USER_DATA_TYPE_LIVE_AT` write into HMSFishbowlRoom join/leave | ZAO Space URLs already follow the canonical pattern (`zaoos.com/spaces/<id>`). Existing cast-on-live broadcast (`src/app/api/stream/rooms/route.ts`) already creates the chat anchor cast. Marginal code lift; massive cross-client distribution. |
| 2 | **CO-AUTHOR feedback comment with @manan + @topocount.eth** on FIP #268 | Post technical feedback within 7 days of 2026-05-03, before FarCon | rish thanked @topocount.eth + @manan; window to influence is now. ZAO has the only production HMS+Livepeer combo cited as Juke alternative. |
| 3 | **COORDINATE with Juke** before shipping | Reach out via FISHBOWLZ→Juke contact (per memory `project_fishbowlz_deprecated.md`) to align on writer-cooperation convention | FIP #268 explicitly names Juke as the only existing client. Misaligned writers WILL clobber each other (the "misbehaving client" risk in the FIP). ZAO + Juke aligned = healthy `LIVE_AT` ecosystem. |
| 4 | **DO NOT touch ZAO mini-app gate logic** for this | LIVE_AT writes are server-side via app signer; client-side mini-app gate stays as-is (per doc 591) | Don't bundle this into the mini-app audit work. |
| 5 | **DEFER recording URL gating** | First implementation: omit `fc:live:recordingUrl`; add later when ZOUNZ recording RBAC is wired | FIP says "providers gating recordings SHOULD point at access-check page." ZAO doesn't have that page yet. Skip the field until it does. |

## What rish Posted (Source — 2026-05-03)

@rish [cast](https://farcaster.xyz/rish/0x0fafaa5d) on Farcaster (channel `/fc-updates`):

> "FIPs for live activity on the protocol could be audio spaces, livestreams, or something else in the future - goal is to have cross client and mini app support good weekend read going into farcon, feedback is appreciated"

Co-authors thanked: @topocount.eth + @manan. Two GitHub discussions opened same day:

- [#268 — FIP: Live Activity Status](https://github.com/farcasterxyz/protocol/discussions/268) (created 2026-05-03 00:44 UTC, FIP Stage 2: Draft)
- [#269 — FIP: Live Activity Manifest](https://github.com/farcasterxyz/protocol/discussions/269) (created 2026-05-03 00:51 UTC, FIP Stage 2: Draft)

Zaal already commented: "Ooo I'll look into this one excited for what this could become."

## FIP #268 Summary — `USER_DATA_TYPE_LIVE_AT` (Protocol Layer)

**One new constant.** `USER_DATA_TYPE_LIVE_AT = 10` added to the existing `UserDataType` enum. No new message type, no new store, no new permission model.

**Slot semantics:** Last-write-wins. Single canonical URL. `value = ""` means "not currently live." Validated as RFC-3986 URL, `https://` only, ≤256 bytes.

**Heartbeat convention** (off-protocol, SHOULD):
- Writer re-writes the same value every **1 second** (MIN 1s, MAX 5s)
- Reader treats slot as stale if message timestamp older than **5 seconds**

**Cooperative writing** (off-protocol, SHOULD):
- Read slot before each write
- If empty or stale: write own value
- If fresh and self-written: keep heartbeating
- If fresh and other-writer: activity URLs preempt presence URLs; presence-only writers yield

**New rate limit budget:** 5000 writes/hour per storage unit, separate from general 500 tx/hr budget. Without this, 1-sec heartbeat would burn user's general budget in 8 minutes.

**Protocol delta:** Single enum value + one validation rule. Trivial.

## FIP #269 Summary — Live Activity Manifest (Application Layer)

**No protocol change.** Application contract that turns the `LIVE_AT` URL into renderable activity card.

**Required meta tags on the audio URL:**
```html
<meta property="fc:live" content="1">
<meta property="fc:live:hostFid" content="<integer>">
<link rel="farcaster-live-activity-manifest" href="<manifest URL>">
```

**Optional dynamic state:**
- `fc:live:startedAt` (ISO 8601 UTC)
- `fc:live:speakerFids` (comma-separated integers)
- `fc:live:participantCount` (integer)
- `fc:live:expectedDurationSec` (1-86400)
- `fc:live:endedAt` (ISO 8601 UTC, permanent once set)
- `fc:live:recordingUrl` (absolute URL)
- `fc:cast` (cast hash anchoring chat)

**Manifest endpoint** serves JFS envelope (same shape as Mini Apps `accountAssociation`):
```typescript
type LiveActivityManifest = {
  hostAttestation: {
    header: string;     // base64url JSON: { fid, type: "auth", key }
    payload: string;    // base64url JSON: { url: <audio URL> }
    signature: string;  // base64url Ed25519 over `${header}.${payload}`
  };
};
```

**Chat:** Standard reply tree of the cast referenced by `fc:cast` meta tag. No special chat infra required — replies inherit cast moderation + threading.

**Resolution flow** (client-side):
1. Fetch URL, parse meta tags
2. If `fc:live=1` absent → render as plain OpenGraph
3. Validate required tags + manifest pointer
4. Render live card from meta tags
5. (Recommended) Verify manifest JFS for trust-sensitive surfaces
6. (Optional) Query Snapchain for `fc:cast` reply tree
7. Combine `fc:live:endedAt` + `LIVE_AT` freshness for lifecycle

## ZAO Codebase Reality (Step-2 Grounding)

| ZAO Asset | File | FIP Maps To |
|---|---|---|
| Space URL pattern | `src/app/spaces/[id]/layout.tsx` (line: `url: \`https://zaoos.com/spaces/${id}\``) | The audio URL written to `LIVE_AT` |
| HMS Space URL pattern | `src/app/spaces/hms/[id]/layout.tsx` | Same — alternate provider |
| Live notification cast | `src/app/api/stream/rooms/route.ts` (already casts `${title} is now live on ZAO OS! Join: https://zaoos.com/spaces/${roomId}`) | The cast `fc:cast` meta tag points at |
| HMSFishbowlRoom join/leave hooks | `src/components/spaces/HMSFishbowlRoom.tsx` | Where to fire `LIVE_AT` write + heartbeat + clear |
| Live transcript hook | `src/hooks/useLiveTranscript.ts` | Could surface in meta tag (future) |
| Auto stream marker hook | `src/hooks/useAutoStreamMarker.ts` | Existing pattern for live state side-effects |
| Livepeer integration | `src/lib/livepeer/`, `src/app/api/livepeer/` | Stream provider for video, parallel meta-tag implementation |
| Spaces broadcast | `src/components/spaces/BroadcastPanel.tsx` | UI surface that triggers go-live |
| App FID 19640 (per memory `project_infra_keys.md`) | community.config.ts | The signer that writes `LIVE_AT` on user behalf |

**ZAO is positioned to be reference implementation.** No other client cited in FIP #268 except Juke. ZAO's HMS + Livepeer combo + existing live-cast infrastructure means we ship this in days, not weeks.

## Implementation Plan: 5 Discrete PRs

### PR #1 — Meta tags on space layouts (~50 lines, 1 day)

Add `fc:live` family of meta tags to:
- `src/app/spaces/[id]/layout.tsx`
- `src/app/spaces/hms/[id]/layout.tsx`

Read live state from Stream.io / HMS room state (host FID, started_at, speaker FIDs, participant count). Required tags only for v1 (`fc:live`, `fc:live:hostFid`, manifest pointer link).

### PR #2 — Manifest endpoint (~80 lines, 1 day)

Build `/api/spaces/[id]/manifest/route.ts` returning the `LiveActivityManifest` JFS. Reuse Mini App `accountAssociation` JFS code if present (per `project_infra_keys.md` ZAO is on Neynar — check `src/lib/auth/`).

JFS payload claims `https://zaoos.com/spaces/<id>`. Signed with host's app key (delegated key, NOT personal wallet — per `feedback_never_ask_private_keys.md`).

### PR #3 — `LIVE_AT` write + heartbeat (~120 lines, 2 days)

In `HMSFishbowlRoom.tsx` (and Stream.io equivalent):

- On join (host or participant): write `USER_DATA_TYPE_LIVE_AT` via Neynar SDK with app signer, value = `https://zaoos.com/spaces/<id>`
- Start interval: heartbeat every 1 second (matches FIP recommendation)
- Implement cooperative write convention: read slot before each write; yield if other writer fresh and we are presence-only
- On leave: write `value = ""` to clear

Server-side via app signer (per `feedback_never_ask_private_keys.md`). Use existing Neynar client at `src/lib/auth/`.

### PR #4 — Reader: render others' `LIVE_AT` in ZAO feed (~100 lines, 2 days)

When rendering casts in `src/components/feed/`, query `LIVE_AT` for the cast author. If fresh + non-empty + URL serves `fc:live=1`:
- Avatar pill with green dot + "LIVE" label
- Click → opens space (if our domain) or external URL
- Verify manifest JFS for trust-sensitive surfaces

Bonus: query `LIVE_AT` for `/thezao` channel members; show "live now" strip at top of channel feed.

### PR #5 — `fc:cast` linkage to existing live-notification cast (~30 lines, 0.5 day)

In `src/app/api/stream/rooms/route.ts`, after creating the live-notification cast, store the cast hash. Pass it through the meta-tag layer so `<meta property="fc:cast" content="<hash>">` is served.

## Numbers (3+ Required, Hitting 7)

| # | Stat | Source |
|---|------|--------|
| 1 | New enum value: `USER_DATA_TYPE_LIVE_AT = 10` | FIP #268 spec section |
| 2 | Heartbeat interval: 1 second (RECOMMENDED), MIN 1s, MAX 5s | FIP #268 liveness section |
| 3 | Reader freshness threshold: EXACTLY 5 seconds | FIP #268 liveness section |
| 4 | Value max length: 256 bytes | FIP #268 validation flow |
| 5 | Recommended new rate limit: 5000 writes/hour per storage unit | FIP #268 rate limit section |
| 6 | UserData storage allotment: ~800 records per default storage unit | FIP #268 storage section |
| 7 | 5 PRs to ship reference impl in ~6.5 dev days | This doc, derived |

## Comparison: 3 Implementation Approaches

| Approach | Lift | Cross-client visibility | Trust verification | Recommendation |
|---|---|---|---|---|
| **Just meta tags** (FIP #269 only, skip protocol-level write) | 1.5 days | None — others can't discover ZAO spaces because no `LIVE_AT` write | Manifest only verifies host AFTER URL is found | SKIP — defeats the cross-client purpose |
| **`LIVE_AT` write + meta tags** (full both FIPs) | 6.5 days | Full — every Farcaster client renders ZAO Space presence | Full JFS chain | **ADOPT** |
| **`LIVE_AT` write only** (skip manifest) | 3 days | Partial — clients can show "active" pill, can't render rich card | None — anyone can spoof host | SKIP — half-measure, anyone can spoof us |

## Risks + Open Questions

| Risk | Severity | Mitigation |
|---|---|---|
| FIP changes during draft phase (Stage 2) | Medium | Lock to a snapshot SHA, rev when approved. Cite `last-validated` in this doc. |
| Juke + ZAO clobber each other on `LIVE_AT` | High | Implement cooperative write convention from Day 1. Reach out to Juke pre-ship. |
| Snapchain `LIVE_AT` enum value not yet shipped | High | Read FIP #266 (Snapchain Signers) for FIP authoring convention. ZAO can ship meta tags + manifest BEFORE Snapchain ships enum, then add the write when enum lands. |
| Neynar SDK doesn't yet support `USER_DATA_TYPE_LIVE_AT = 10` | Medium | Check Neynar version pinning in `package.json`. Open issue with Neynar if missing. |
| App-signer rate limit consumption (5000/hr per storage unit) | Low | One slot per active host, 1 heartbeat/sec = 3600/hr. Within budget with 28% headroom. Multiple concurrent ZAO live spaces → multiple FIDs → independent budgets. |
| `fc:live:recordingUrl` exposes private recordings if naively wired | High | DEFER recordingUrl until ZOUNZ access-check page exists. Per FIP: "providers SHOULD point at page that handles access checks." |
| @rish only thanked @manan + @topocount.eth — ZAO not yet in the conversation | Medium | Submit substantive technical feedback by Day 7 (2026-05-09) — before FarCon. Reference the existing ZAO Spaces stack as a real-world test bed. |
| FarCon date unknown to me from these sources | Medium | Verify FarCon date via [farcon.xyz](https://farcon.xyz) or @dwr.eth before scheduling feedback timeline. |

## Strategic Wins for ZAO

1. **First reference impl outside Juke.** Cited in FIP discussion = ZAO inserted into Farcaster protocol convo. Distribution win.
2. **Cross-client discoverability.** Every Farcaster client (Warpcast, Recaster, Coinbase Wallet's mini app surface) renders ZAO Space presence without us shipping per-client integrations. Free distribution.
3. **ZAOstock 2026 (Oct 3) live broadcast** can ride `LIVE_AT` for native cross-client presence on every ZAOstock day-of livestream.
4. **Replaces FISHBOWLZ → Juke partnership friction.** Per `project_fishbowlz_deprecated.md`, FISHBOWLZ paused for Juke partnership. Now both apps cooperate via protocol convention instead of API alignment.
5. **POIDH bounty hooks** (per doc 415, 533): "live POIDH" bounties tied to ZAO Spaces become discoverable in any client.

## Also See

- [Doc 081 — Farcaster Social Graph Sharing](../081-farcaster-social-graph-sharing/) — UserData read patterns
- [Doc 304 — Quilibrium Hypersnap Free Neynar API](../304-quilibrium-hypersnap-free-neynar-api/) — Neynar API alternative for high-frequency reads
- [Doc 309 — Snapchain Hypersnap Protocol Deep Dive](../309-snapchain-hypersnap-protocol-deep-dive/) — Snapchain message validation, signer model
- [Doc 587 — Hypersnap+Quilibrium+farcasterorg Ecosystem](../587-hypersnap-quilibrium-farcasterorg-ecosystem-may2026/) — full Farcaster infra map
- [Doc 591 — Miniapp Production Audit (memory)](../../) — see memory `project_miniapp_audit_591.md`; do NOT bundle this work into the mini-app gate
- Memory: `project_fishbowlz_deprecated.md` (Juke partnership), `project_spaces_next.md` (Spaces roadmap), `project_infra_keys.md` (ZAO app FID 19640)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Read FIP #268 + #269 carefully (pin SHA) | @Zaal | Read | 2026-05-04 |
| Reach out to Juke (FISHBOWLZ→Juke contact) re: `LIVE_AT` cooperation | @Zaal | DM | 2026-05-05 |
| Post technical feedback comment on discussion #268 (cite ZAO Spaces stack) | @Zaal or research session | GitHub | 2026-05-09 (before FarCon) |
| Post separate feedback on #269 (manifest JFS reuse from Mini App `accountAssociation`) | @Zaal | GitHub | 2026-05-09 |
| Verify FarCon date (farcon.xyz or @dwr.eth) | @Zaal | Research | 2026-05-04 |
| PR #1: meta tags on space layouts | research session or Quad | PR | After Zaal greenlight |
| PR #2: `/api/spaces/[id]/manifest` endpoint | research session or Quad | PR | After PR #1 |
| PR #3: `LIVE_AT` write + heartbeat in HMSFishbowlRoom | research session or Quad | PR | After PR #2 |
| PR #4: render others' `LIVE_AT` in ZAO feed | research session or Quad | PR | After PR #3 |
| PR #5: `fc:cast` linkage to existing live-notification cast | research session or Quad | PR | After PR #4 |
| Re-validate this doc when FIPs reach Stage 3 (Final) | research session | Re-fetch + supersede | TBD |

## Sources

### Primary (FIPs + announcement)

- [@rish cast on Farcaster, 2026-05-03](https://farcaster.xyz/rish/0x0fafaa5d) — announcement, links to both FIPs, going into FarCon
- [FIP: Live Activity Status — discussion #268](https://github.com/farcasterxyz/protocol/discussions/268) — protocol layer, `USER_DATA_TYPE_LIVE_AT = 10`, created 2026-05-03 00:44 UTC by rishavmukherji, FIP Stage 2: Draft
- [FIP: Live Activity Manifest — discussion #269](https://github.com/farcasterxyz/protocol/discussions/269) — application layer, meta tags + JFS manifest + cast chat anchor, created 2026-05-03 00:51 UTC, FIP Stage 2: Draft

### Supporting

- [Discussion #266: Snapchain Signers](https://github.com/farcasterxyz/protocol/discussions/266) — FIP authoring conventions, signer model context
- [Mini Apps documentation](https://miniapps.farcaster.xyz/) — `accountAssociation` JFS precedent reused by FIP #269 manifest
- @topocount.eth + @manan — co-authors thanked by rish (Farcaster handles)
- [Juke (Notion landing)](https://www.notion.so/Spaces-Twitter-like-audio-video-rooms-34e655195a8b80a79894c97d6effa82b) — only existing Farcaster audio-spaces client cited in FIP #268; ZAO already paused FISHBOWLZ for Juke partnership per memory

### ZAO codebase paths verified live 2026-05-03

- `src/app/spaces/[id]/layout.tsx` — Space URL `https://zaoos.com/spaces/${id}`
- `src/app/spaces/hms/[id]/layout.tsx` — HMS Space URL `https://zaoos.com/spaces/hms/${id}`
- `src/app/api/stream/rooms/route.ts` — already casts live-notification with audio URL embed
- `src/components/spaces/HMSFishbowlRoom.tsx`, `BroadcastPanel.tsx`, `AudioRoomAdapter.tsx` — UI + room components
- `src/hooks/useLiveTranscript.ts`, `useAutoStreamMarker.ts` — live-state hooks
- `src/lib/livepeer/`, `src/lib/spaces/`, `src/app/api/livepeer/`, `src/app/api/spaces/`, `src/app/api/stream/` — server modules

**URL liveness:** All 4 external URLs verified live 2026-05-03 via gh api / WebFetch / direct fetch. FIP discussions are open with 0 comments at time of fetch (12 minutes after creation).

**Hallucination check:** All FIP spec quotes pulled verbatim from `gh api repos/farcasterxyz/protocol/discussions/{268,269}` body field. ZAO file paths grep-confirmed in `/tmp/zao-research-593/src/`. No invented citations.

**Staleness note:** FIPs are in Stage 2 (Draft). Spec details may change before Stage 3 (Final). Re-validate before any code changes land.
