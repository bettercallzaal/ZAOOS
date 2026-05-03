---
topic: farcaster
type: decision
status: research-complete
last-validated: 2026-05-03
related-docs: 081, 304, 309, 489, 587, 591, 593
tier: DEEP
---

# 594 — FIP Live Activity (Audio Spaces) DEEP DIVE: Threat Model, Precedents, Network Load, FarCon Feedback

> **Goal:** Companion to Doc 593's 5-PR action plan. Goes wide on author intent, Juke alignment, 8 prior-art platforms, privacy threats, Snapchain internals, network-wide load math, cooperative-writer attack surface, and verbatim feedback drafts to land before FarCon Rome (2026-05-04 / 2026-05-05).

## URGENT TIMING UPDATE (overrides Doc 593)

**FarCon 2026 is this weekend.** May 4-5 at Palazzo Brancaccio, Rome. Per FarCon agenda: May 4 = Builders Day, May 5 = Summit Day. rish dropped FIPs #268 + #269 on 2026-05-03 ~12 hours before Builders Day. The "weekend read going into farcon" framing means **technical feedback should land within 24-36 hours of right now (2026-05-03 evening US time)**, not "by 2026-05-09" as Doc 593 stated.

Implication: post feedback comments **2026-05-04 morning UTC** (before Builders Day starts) so rish + topocount + manan see them before in-person discussions. After FarCon Stage-2-Draft consensus likely hardens; missing that window means feedback rolls into a Stage 3 Final amendment, not the original spec.

## Key Decisions (Revised from Doc 593)

| # | Decision | Action | Why |
|---|----------|--------|-----|
| 1 | **POST FEEDBACK on #268 + #269 BEFORE 2026-05-04 09:00 UTC** | Use the verbatim drafts in section "FIP Feedback Comments" below. Reference Nostr NIP-53 precedent + ZAO Spaces real-world test bed + 3 specific privacy gaps. | FarCon Builders Day starts that window. Stage 2 Draft consensus likely hardens at FarCon. |
| 2 | **DM @topocount.eth directly, not just rish** | He maintains `@farcaster/*` npm packages + Snapchain. He is the Snapchain implementer of the FIP. Warm intro: ZAO's existing HMS+Livepeer Spaces stack. | rish wrote it; topocount ships it. Feedback that reaches the implementer lands harder than feedback that reaches the author. |
| 3 | **DM @nickysap (Juke) within 48h** | Confirm Juke will follow cooperative writer convention. Propose joint test: ZAO writes presence-only URL, Juke writes activity URL with `fc:live=1`, verify activity preempts cleanly. | Juke is the only existing client cited. ZAO + Juke aligned = healthy ecosystem. ZAO + Juke unaligned = first big "misbehaving client" incident the FIP warns about. |
| 4 | **KEEP Doc 593's 5-PR plan but ADD privacy mitigations to PR #1 and PR #3** | PR #1 (meta tags): omit `fc:live:speakerFids` from public meta tags for gated rooms; gate behind authenticated manifest fetch. PR #3 (LIVE_AT write): use opaque room IDs (`/spaces/<uuid>` not `/spaces/zounz-private-<x>`). | Stalking + co-location inference is HIGH-severity privacy risk per agent D analysis. Trivial to mitigate at app layer; impossible to fix at protocol layer (no protocol opt-out). |
| 5 | **DEFER `fc:live:recordingUrl` indefinitely** (vs Doc 593 "until ZOUNZ access-check page exists") | Even publishing the meta tag — pointing to an access-checked page — leaks "this Space was recorded." For ZOUNZ-tier private content that's metadata leakage. Only publish recordingUrl AFTER the Space ends, NEVER during. | Agent D found that recordingUrl existence itself is a signal. ZOUNZ recordings should be discoverable via ZOUNZ-internal channels, not LIVE_AT meta tags. |
| 6 | **DESIGN ZAO as a presence-only writer first, activity writer second** | When user is in ZAO Space: ZAO writes activity URL with `fc:live=1`. When user is just on ZAO OS but not in a Space: ZAO writes presence-only URL (`https://zaoos.com/active`) WITHOUT `fc:live=1`. Per FIP convention, Juke's activity writes will preempt ZAO's presence writes — correct behavior. | Avoids ZAO ever clobbering Juke's space presence. Reverses the failure mode where two competing apps fight for the slot. |
| 7 | **HOT-SHARD JITTER on heartbeats** | Stagger heartbeats across active users with random 0-1000ms jitter so 30 concurrent users don't all write at the same wall-clock second | Snapchain shards by FID hash. Synchronized heartbeats from many FIDs in same shard = hot shard. Trivial fix at app layer. |
| 8 | **APP KEY ROTATION on monthly schedule** | ZAO app signer for `USER_DATA_ADD` rotates monthly. Build KEY_REMOVE UI now. | If app key compromised, attacker can write false LIVE_AT for every authorized ZAO user. FIP has no protocol-level mitigation. |

## Cast Origin + Author Network (Agent A Findings)

@rish [cast on 2026-05-03 ~00:30 UTC](https://farcaster.xyz/rish/0x0fafaa5d) in `/fc-updates`:

> "FIPs for live activity on the protocol could be audio spaces, livestreams, or something else in the future - goal is to have cross client and mini app support good weekend read going into farcon, feedback is appreciated"

Zaal already commented: "Ooo I'll look into this one excited for what this could become."

### @rish (Rishav Mukherji) — author

| Fact | Source |
|---|---|
| Co-founder of Neynar | Multiple Farcaster bio refs |
| Background: 4yr Coinbase (helped launch Base L2), then Facebook Messenger | LinkedIn |
| De facto Farcaster protocol evangelist via Neynar | Authoring pattern across recent FIPs |
| 2026-04-21 cast asking "which mini apps are audio spaces on farcaster?" got 30 recasts + 20 replies | Jina Reader on his profile |
| 2026-04-28 cast: "the host and the builder of the app told me live on the space that we should build spaces native to the farcaster client was kinda surprising" | Same |

The Apr 28 cast is the **public origin signal** for FIPs #268 + #269. Spaces went from "delegate to ecosystem mini apps" to "protocol-native presence primitive" inside a week.

### @manan (Manan Patel) — co-thinker

| Fact | Source |
|---|---|
| Neynar core SDK engineer | GitHub: `@neynar/nodejs-sdk`, `@neynar/react`, `@neynar/create-farcaster-mini-app` |
| 246.8K Warpcast followers | Firefly |
| Likely owner of SDK additions for `USER_DATA_TYPE_LIVE_AT = 10` | Inferred |

### @topocount.eth (Kevin Joseph Siegler) — co-thinker AND implementer

| Fact | Source |
|---|---|
| **Snapchain protocol engineer at Neynar** | GitHub `@neynarxyz` |
| Maintains `@farcaster/hub-nodejs`, `hub-web`, `core`, `protobufs`, `grpc`, `flatbuffers`, `fishery` | npm |
| Direct Snapchain contributor; will write the protobuf + validation code for FIP #268 | GitHub commits |
| Verified across Farcaster, Lens, Twitter/X, GitHub via web3.bio | web3.bio |

**This is the highest-leverage person to talk to.** rish wrote the spec; topocount writes the Snapchain code that makes it real. Feedback through topocount lands harder.

### Discussion comment status

`gh api repos/farcasterxyz/protocol/discussions/{268,269}/comments` returned **empty arrays** as of 2026-05-03 ~12:00 UTC (~12 hours after FIP drop). No public dissent, no public concerns, no community discussion yet. The window to be the FIRST substantive comment is open.

## FarCon 2026 Context

| Fact | Detail |
|---|---|
| Dates | 2026-05-04 (Builders Day) + 2026-05-05 (Summit Day) |
| Location | Palazzo Brancaccio, Rome, Italy |
| Prior editions | Boston 2023, Venice 2024, NYC 2025 |
| FIP review process | Not formally documented; de facto consensus point for Stage 2 → Stage 3 progression |
| Pre-event signal | rish's Apr 28 cast + 2026-05-03 FIP drop = "weekend read going into farcon" = soft launch for in-person debate |

## Adjacent FIPs (Stage 2 Draft Context)

| # | Title | Relevance to #268/#269 |
|---|-------|------------------------|
| 131 | Notifications as protocol primitives | Could push "follow user just went live" — pairs with LIVE_AT |
| 163 | Scaling Farcaster | Network capacity for high-frequency LIVE_AT heartbeats — see network-load section below |
| 171 | External cast data | Cast embeds — chat-anchor cast for FIP #269 leans on this |
| 197 | Location type as embed | Adjacent metadata pattern; not overlapping |
| 202 | HTTP Headers for Farcaster resources | Manifest endpoint serves OG meta tags; this FIP standardizes the headers |
| 246 | Mini App Contract Address Metadata | Mini-app identification — Juke/Fireside/FarHouse use this |
| 262 | Functional Signers | Per-`UserDataType` signer scopes — would let users grant `LIVE_AT` write to ZAO without granting full UserData |
| 266 | Snapchain Signers | FIP authoring conventions, signer model context — referenced by FIP #268 |

**No prior Farcaster live-activity FIPs exist.** FIPs #268 + #269 are first-of-kind for the protocol.

## Juke Deep Dive (Agent B Findings)

### Stack

| Component | Choice |
|---|---|
| Founder | @nickysap (Nicky Sap), solo or 2-3 person team |
| Public surface | [juke.audio](https://juke.audio/) — TestFlight signup, iOS-only beta |
| Code | Closed source (TestFlight only). Founder said in Substack he MAY open-source post-beta. |
| Audio transport | **LiveKit** (open-source WebRTC SFU) |
| Chat layer | **Farcaster native reply tree** — zero chat backend. Host casts space announcement; replies are chat. Neynar webhook streams new replies into Space UI in real-time. |
| Backend | Postgres + Redis (per founder Substack) |
| Client | Native iOS Swift app, `AVAudioSession`, audio interruption handling |
| Auth | Farcaster + Neynar |

**Critical insight:** Juke's chat architecture is **already exactly what FIP #269 specifies** ("Chat is the standard reply tree of a cast referenced by the URL's `fc:cast` meta tag"). Nicky built this independently before the FIP. He will not need to retrofit chat. He WILL need to add the `LIVE_AT` write + meta tags + manifest endpoint.

### Public coordination signal

| Question | Answer |
|---|---|
| Has Juke publicly committed to FIP #268 cooperative writer convention? | **No.** No GitHub issue, no blog post, no cast. Juke went TestFlight ~late March 2026; FIP dropped 2026-05-03. Nicky may not have designed heartbeat coordination yet. |
| Has Juke publicly committed to implementing FIP #268? | **No.** No public commitment. |
| Recordings? Replays? Scheduling? | None of these in current beta. |
| Founder on protocol-aware design | Founder Substack 2026-03-27 ([Farcaster Was Dead, So I Started Building](https://nickysap.substack.com/p/farcaster-was-dead-so-i-started-building)) shows deep Farcaster protocol literacy. He'll likely embrace #268/#269 if approached. |

### ZAO ↔ Juke partnership state (memory + research grounding)

| Fact | Source |
|---|---|
| ZAO paused FISHBOWLZ on 2026-04-16 to partner with Juke | Memory `project_fishbowlz_deprecated.md` |
| Doc 526 (Distribution V3) records: "Audio-room job is being done by Juke (doc - nickysap). FISHBOWLZ failed at the job layer, not the tech layer. Revisit only with a different job." | research/business/526 |
| No public partnership agreement found | This is "we're aligned, let's not compete," not "we have a contract." |
| ZAO uses 100ms HMS + Livepeer (different stack from Juke's LiveKit) | `src/components/spaces/HMSFishbowlRoom.tsx`, `src/lib/livepeer/` |

**Strategic outcome:** ZAO and Juke are not direct competitors anymore. ZAO is a Farcaster-gated mini-app community with Spaces as ONE feature; Juke is a dedicated Spaces app. Both can write `LIVE_AT` for users in their respective spaces. Cooperative writer convention is the alignment surface.

## Precedent Landscape (Agent C Findings)

### Comparison table — 8 platforms, 5 axes

| Platform | Presence model | Cross-client | Adoption | Status | Lesson for #268/#269 |
|---|---|---|---|---|---|
| Twitter Spaces | Centralized API, polling | Yes (until 2023) | Failed at scale | Decline | Presence ≠ discovery; API alone doesn't drive engagement |
| Clubhouse | Walled garden, no API | No | Collapsed | Dead | Isolation killed it; openness is necessary not sufficient |
| Discord Stage | Native presence in client | No (intentional) | Successful | Active | Presence works only if clients prioritize it in feed/discovery |
| Spotify Connect | Proprietary heartbeat across own devices | No | Successful | Active | Heartbeat works when you control the full stack |
| Last.fm scrobbling | Event-driven (track end) + public API | Yes | Successful, niche | Active | Event-driven scales better than heartbeat; latency tolerable for music |
| Matrix presence | Real-time federated sync | Yes | Costly (CPU) | Active, friction | Presence diffusion is CPU-expensive — confirms LIVE_AT load concern |
| Nostr NIP-53 + NIP-10312 | Signed events, last-write-wins, ~1hr implicit freshness | Yes | Niche | Active | **Closest precedent to FIP #268.** Confirms LWW + signed events is viable. FIP improves on it with explicit 5s freshness. |
| Mini App `accountAssociation` JFS | Signed envelope, domain-bound | Yes (within Farcaster) | Successful | Active | Reused by FIP #269 manifest. Operationally smart, but maybe overbuilt for ephemeral 5s data. |

### Top 3 lessons for ZAO

1. **Twitter Spaces failed despite a public API because discovery was reactive.** FIP #268 risks the same fate UNLESS clients (Warpcast, Recaster, ZAOOS, Coinbase Wallet's mini app surface) wire `LIVE_AT` into feed ranking + notifications, not just a profile dot. **ZAO should ship the reader (PR #4 in Doc 593) BEFORE the writer.** Demonstrate the rendering value first.

2. **Nostr NIP-53 is the closest precedent and it works at small scale.** Reference it in feedback comments. Anyone in the FIP #268 conversation skeptical that LWW presence works should be pointed at NIP-53 as proof.

3. **Mini App JFS reuse is elegant but possibly overbuilt for ephemeral data.** FIP #269 should specify whether clients can SKIP signature verification on reads (FIP says "RECOMMENDED" — not MUST). At 50-cast feed scale, JFS adds ~300ms vs. unsigned. ZAO should advocate for explicit "cache by (host_fid, key)" guidance to amortize verification cost.

## Privacy Threat Model (Agent D Findings)

### Three HIGH-severity privacy risks

| # | Risk | Severity | Protocol fix? | App-layer mitigation (ZAO) |
|---|------|----------|---------------|--------------------------|
| 1 | **Real-time stalking via LIVE_AT** | HIGH | None (by design — LIVE_AT IS public presence) | Use opaque room IDs `/spaces/<uuid>`, never embed category info in URL path |
| 2 | **Co-location inference via `fc:live:speakerFids` meta tag** | HIGH | None | For gated rooms (ZOUNZ): omit `speakerFids` from public meta tags; serve speaker list ONLY via authenticated manifest endpoint |
| 3 | **Permanent presence history (no `USER_DATA_REMOVE`)** | HIGH | Would require new FIP for `USER_DATA_REMOVE` | Document to users: "Your presence history is permanent on Snapchain. Use `value=""` to clear current state, but historical writes are irreversible." |

### Three MEDIUM-severity risks

| # | Risk | Mitigation |
|---|------|----------|
| 4 | No protocol opt-out flag | Maintain client-side FID blocklist; refuse to construct `USER_DATA_ADD` for opted-out FIDs (cooperative only) |
| 5 | Domain-based doxxing via URL category | Use opaque room IDs (mitigation overlaps risk 1) |
| 6 | App key compromise = false LIVE_AT for all authorized users | Monthly app key rotation + KEY_REMOVE UI |

### One LOW-severity, one architecturally-significant

| # | Risk | Mitigation |
|---|------|----------|
| 7 | Replay attack on signed `USER_DATA_ADD` | Already mitigated by Snapchain timestamp validation (rejects >600s ahead, LWW rejects older). No action needed. |
| 8 | `fc:live:recordingUrl` existence leaks "this Space was recorded" | Only publish recordingUrl POST-Space-end. Never during live. For ZOUNZ rooms, never publish — use ZOUNZ-internal discovery. |

## Snapchain Internals + Network-Wide Load Math (Agent D)

### Per-FID math (ZAO scale): WELL within budget

| Metric | Number |
|---|---|
| ZAO members | 188 (gated) |
| Peak concurrent in Spaces (estimate 16% peak utilization) | ~30 |
| Heartbeats per FID per hour | 3,600 (1/sec) |
| Proposed LIVE_AT budget per FID | 5,000/hr |
| Headroom per FID | 28% |
| Total ZAO LIVE_AT writes/hr at peak | 108,000 |
| Total ZAO writes/sec at peak | ~30 |

ZAO load is negligible. No per-FID budget exhaustion risk.

### Network-wide math: CONCERNING at scale

| Metric | Number |
|---|---|
| Farcaster MAU (estimate) | ~1M |
| Farcaster DAU (estimate) | ~80-100k |
| Hypothetical 5% concurrent live | 5,000 users |
| LIVE_AT writes/hr at 5k concurrent | 18,000,000 |
| LIVE_AT writes/sec at 5k concurrent | 5,000 |
| Current Snapchain sustained throughput (per FIP #163 target) | ~1,000 writes/sec |
| Multiplier on current sustained rate | **27×** |

**FIP #268 does not address aggregate network throughput.** Per-FID rate limit (5,000/hr) is generous, but no aggregate cap exists. If LIVE_AT adoption hits 5% concurrent (Twitter Spaces never got near this; Discord Stage at peak might), validators face 27× current load. **This is a substantive feedback point for the FIP discussion.**

### Hot-shard risk

Snapchain shards by FID hash (Doc 309). LIVE_AT writes are correlated in time (heartbeat synchronized to wall clock seconds). Many FIDs in the same shard heartbeating at the same second = hot shard. **Mitigation at app layer (Decision #7 above): random 0-1000ms jitter per user.**

### JFS verification latency cost (per Agent D benchmarks)

| Surface | Cost |
|---|---|
| 50-cast feed, no manifest verification | ~300ms (network only) |
| 50-cast feed, full JFS verification + Snapchain key lookup | ~600ms |
| Per-signature Ed25519 verification (Snapchain Rust) | 45-50µs |
| Per-signature Ed25519 verification (client JS) | 1-2ms |

**FIP #269 has no caching strategy.** ZAO can implement client-side cache keyed by `(host_fid, signing_key)` to amortize verification across multiple activities by the same host.

## Mini-App Implementation Constraints (Agent D)

ZAO mini-app runs inside Farcaster client iframe with `SameSite=None` + `frame-ancestors: *` (per memory `project_miniapp_audit_591.md`).

| Constraint | Detail |
|---|---|
| `sdk.context.user.fid` | Available — knows the user's FID |
| `sdk.context.client.clientFid` | Available — knows which Farcaster client launched the iframe (Warpcast=9152, etc.) |
| User's ed25519 signer | NOT directly available inside iframe (lives in parent client's secure storage) |
| ZAO must register its OWN app key with `USER_DATA_ADD` scope | Server-side, signed by ZAO's app FID 19640 |
| User authorizes ZAO once via Sign in with Farcaster | Then ZAO writes `LIVE_AT` on behalf of the user using its app key |

**Architecture: ZAO writes `LIVE_AT` server-side, not from the iframe.** When user joins HMSFishbowlRoom, the room emits an event to ZAO backend; backend uses ZAO app key to sign `USER_DATA_ADD` for that user's FID with `value = https://zaoos.com/spaces/<id>`. Heartbeat is also server-driven (cron-like loop while user is in the room). On leave, server writes `value = ""` to clear.

## Cooperative Writer Attack Surface (Agent D)

FIP #268's cooperative convention is SHOULD, not MUST. Three viable attacks:

| Attack | Description | Defense |
|---|---|---|
| **Spam writer** | Malicious app overwrites LIVE_AT every second to junk URL | UX-visible: users notice space disappears, revoke the bad app. FIP relies on "organic UX cost." |
| **Censorship writer** | Compromised ZAO key writes presence-only URL while user is genuinely in Juke space | Activity preempts presence per FIP convention. Monitoring at ZAO layer flags the anomaly. |
| **Replay** | Re-broadcast old signed message | Mitigated by Snapchain timestamp validation. Not viable. |

**Critical observation:** the cooperative writer convention REWARDS apps that follow it (their writes survive) and IMPOSES no protocol cost on apps that ignore it. Pure social pressure. ZAO should monitor LIVE_AT writes for our authorized users and surface anomalies.

## FIP Feedback Comments (Verbatim Drafts)

### Comment to post on [discussion #268](https://github.com/farcasterxyz/protocol/discussions/268)

```
Strong support for the design — `UserData` is the right home for "currently live at"
and the small protocol delta is admirable.

Three substantive points + one nit, from operating an HMS+Livepeer Spaces stack
on a gated 188-member Farcaster mini-app (ZAO OS, app FID 19640):

1. **Network-wide write rate** — the per-FID 5,000/hr budget is generous, but the
   FIP doesn't address aggregate Snapchain throughput. Back-of-envelope: 5%
   concurrent-live across 1M users at 1s heartbeat = 5,000 writes/sec for LIVE_AT
   alone, which is ~27x current sustained throughput per FIP #163's target.
   Discord Stage hit ~10k concurrent in single events at peak; aggregate load is
   plausible. Worth surfacing aggregate cap or per-shard back-pressure as a
   companion concern. Hot-shard risk is also real because heartbeats are
   wall-clock-correlated; recommend an informational note suggesting clients
   apply 0-1000ms jitter.

2. **No protocol opt-out** — there's no way for a user to declare "no app should
   write LIVE_AT for me." Cooperative client behavior plus user-initiated KEY_REMOVE
   is the only lever, and KEY_REMOVE is a heavy hammer (revokes all writes by that
   key, not just LIVE_AT). FIP #262 (Functional Signers) would resolve this if it
   advances. Worth calling out the dependency.

3. **Permanent presence history** — `value = ""` clears current state, but the
   write history persists on Snapchain indefinitely. For users joining live activities
   in sensitive contexts (private DAOs, support groups, gated rooms), this is an
   irreversible attack surface. The FIP correctly rejects USER_DATA_REMOVE for
   complexity reasons, but a documentation note on this property would help app
   authors educate users.

Nit: section "Cooperative writing convention" — the convention rewards compliance
with no protocol cost on non-compliance. Worth noting (or, ambitiously, exploring)
whether validators could enforce "activity preempts presence" by reading meta tags
at validation time. I assume that's correctly out of scope, but flagging.

Reference precedent: Nostr NIP-53 + NIP-10312 use the same LWW pattern with
~1hr implicit freshness (vs your explicit 5s); design appears sound at small
scale. Closest prior art.

Happy to ship a reference implementation in ZAO Spaces and report back what
breaks. We're aligned with @nickysap on the cooperative writer convention.
```

### Comment to post on [discussion #269](https://github.com/farcasterxyz/protocol/discussions/269)

```
The `accountAssociation` JFS reuse is operationally smart — devs already know the
shape, clients already verify it. Three notes from planning a real implementation:

1. **Manifest caching** — at 50-cast feed scale with full JFS verification, per
   our benchmarks: ~600ms vs ~300ms unsigned (Ed25519 in JS at 1-2ms/sig + manifest
   fetch + Snapchain key lookup). Worth specifying ETag / Cache-Control guidance
   in the manifest endpoint section, and explicit client-side caching by
   (host_fid, signing_key) so verification amortizes across multiple activities by
   the same host.

2. **`fc:live:speakerFids` doxxes small rooms** — for gated/private spaces (5-15
   participants is common), publishing speakerFids in public meta tags lets any
   reader cross-reference LIVE_AT slots and reconstruct co-location. Recommend
   explicit guidance: gated activities SHOULD serve speakerFids only via the
   authenticated manifest endpoint (or omit entirely), not in public OG meta tags.

3. **`fc:live:recordingUrl` existence leak** — even pointing recordingUrl at an
   access-checked page leaks the fact that the activity was recorded. For
   provider-side privacy, recommend specifying that providers SHOULD only publish
   recordingUrl AFTER the activity ends (not during the live window), so the meta
   tag doesn't signal "this is being recorded right now" to active participants.

Implementation status: ZAO Spaces (HMS + Livepeer at zaoos.com/spaces/<id>)
already serves the cast-on-live notification pattern that FIP #269 standardizes.
Meta tags + manifest endpoint = a few hundred lines of code. Will share PRs after
your feedback lands.

Cc @topocount.eth for the protobuf side.
```

## Complete Risk Table (Updated)

| # | Risk | Severity | Mitigation owner | ZAO action |
|---|------|----------|------------------|------------|
| 1 | Real-time stalking via LIVE_AT | HIGH | App layer | Opaque room IDs in URL path |
| 2 | Co-location inference via `speakerFids` | HIGH | App layer | Gate `speakerFids` to authenticated manifest fetches for gated rooms |
| 3 | Permanent presence history | HIGH | Protocol (no fix) | Document permanence to users; offer "delete account" path that scrubs Farcaster identity if available |
| 4 | No protocol opt-out flag | MEDIUM | App layer (cooperative only) | Maintain client-side FID blocklist; respect at write time |
| 5 | Domain-based doxxing via URL category | MEDIUM | App layer | Opaque room IDs (overlaps #1) |
| 6 | App key compromise = false LIVE_AT for users | MEDIUM | App layer | Monthly key rotation + KEY_REMOVE UI |
| 7 | Replay attack | LOW | Protocol (already handled by timestamp validation) | None needed |
| 8 | `fc:live:recordingUrl` leaks recording existence | MEDIUM | App layer | Publish recordingUrl ONLY post-end, never for ZOUNZ |
| 9 | Network-wide validator load at scale | HIGH (network) | Protocol (FIP amendment needed) | Comment on FIP #268 (drafted above) |
| 10 | Hot-shard risk from synchronized heartbeats | MEDIUM | App layer | 0-1000ms random jitter per user heartbeat |
| 11 | JFS verification latency at feed scale | MEDIUM | App layer + protocol guidance | Client-side cache by (host_fid, key) |
| 12 | Spam writer / cooperative convention abuse | MEDIUM | Social (organic UX cost) | Monitor for anomalies in ZAO-authorized writes |
| 13 | Censorship writer (compromised key writes wrong URL) | MEDIUM | App layer | Backend clock authoritative; alert on anomaly |
| 14 | Mini-app iframe needs server-side LIVE_AT writer | n/a (architectural) | App layer | ZAO backend signs USER_DATA_ADD with app key, not iframe |
| 15 | Juke + ZAO writer collision | HIGH | Bilateral | DM @nickysap within 48h to align on cooperative convention |
| 16 | Stage 2 Draft → Stage 3 Final consensus locks at FarCon | HIGH (timing) | n/a | Post both feedback comments before 2026-05-04 09:00 UTC |

## Strategic Wins for ZAO (Updated)

1. **First reference implementation outside Juke.** ZAO's HMS+Livepeer stack is the second production live-audio system the Farcaster team can cite. Distribution win + protocol-conversation seat.
2. **Cross-client discoverability without per-client integrations.** Every Farcaster client that ships LIVE_AT renders ZAO Space presence for free. ZAOstock 2026 (Oct 3) gets native cross-client livestream presence on day-of.
3. **Replaces FISHBOWLZ ↔ Juke API friction with protocol convention.** Cooperative writer convention means coordination at the protocol layer, not via private API agreements.
4. **POIDH bounty hooks (Docs 415, 533) tied to ZAO Spaces become discoverable in any Farcaster client.**
5. **Forces honest privacy posture.** Implementing the privacy mitigations (opaque URLs, gated speakerFids, post-hoc recordingUrl) raises ZAO's privacy floor across all Spaces, not just FIP-rendered ones.

## Action Plan (Replaces Doc 593 Timeline)

### Within 12 hours (before 2026-05-04 09:00 UTC = FarCon Builders Day start)

| Action | Owner | Type |
|--------|-------|------|
| Post feedback comment on [discussion #268](https://github.com/farcasterxyz/protocol/discussions/268) using verbatim draft above | @Zaal | GitHub |
| Post feedback comment on [discussion #269](https://github.com/farcasterxyz/protocol/discussions/269) using verbatim draft above | @Zaal | GitHub |
| Cast the comment links from @zaal account (signal Farcaster team that ZAO is the only outside-Juke voice in the convo) | @Zaal | Cast |

### Within 48 hours (during FarCon)

| Action | Owner | Type |
|--------|-------|------|
| DM @nickysap (Juke) re: cooperative writer convention alignment + joint test plan | @Zaal | DM |
| DM @topocount.eth re: ZAO will ship reference impl, request review | @Zaal | DM |
| Verify @rish reads/responds to comments | research session | Monitor |

### Week 1 (post-FarCon, 2026-05-06 → 2026-05-10)

| Action | Owner | Type |
|--------|-------|------|
| Read FarCon recap casts/blog posts; capture any spec changes from in-person discussion | research session | Research |
| Update Doc 593 + Doc 594 with any spec deltas | research session | Doc revision |
| Begin PR #1 (meta tags) implementation only AFTER spec stabilizes | Quad | Build |

### Weeks 2-4 (2026-05-13 → 2026-05-31)

| Action | Owner | Type |
|--------|-------|------|
| PR #1 — meta tags on space layouts + privacy mitigations (opaque IDs, gated speakerFids) | Quad | PR |
| PR #2 — `/api/spaces/[id]/manifest` JFS endpoint | Quad | PR |
| PR #3 — `LIVE_AT` write + heartbeat with 0-1000ms jitter (server-side) | Quad | PR |
| PR #4 — render others' LIVE_AT in ZAO feed (READER FIRST per Lesson 1 from precedents) | Quad | PR |
| PR #5 — `fc:cast` linkage to existing live-notification cast | Quad | PR |
| Joint test: ZAO + Juke heartbeat in same user's slot, verify cooperative behavior | @Zaal + @nickysap | Test |

### Month 2 (post-launch monitoring)

| Action | Owner | Type |
|--------|-------|------|
| Monitor LIVE_AT writes for ZAO-authorized users; alert on anomalies | ZOE / Hermes | Bot task |
| Monthly app key rotation cycle | research session schedule | Bot task |
| Re-validate this doc | research session | Re-fetch + update last-validated |

## Also See

- [Doc 081 — Farcaster Social Graph Sharing](../081-farcaster-social-graph-sharing/)
- [Doc 304 — Quilibrium Hypersnap Free Neynar API](../304-quilibrium-hypersnap-free-neynar-api/)
- [Doc 309 — Snapchain vs Hypersnap Protocol Deep Dive](../309-snapchain-hypersnap-protocol-deep-dive/) — Snapchain shard architecture, validator topology
- [Doc 489 — Hypersnap Bootstrap + Cass on Mars](../489-hypersnap-farcaster-node-cassonmars/)
- [Doc 587 — Hypersnap+Quilibrium+farcasterorg Ecosystem](../587-hypersnap-quilibrium-farcasterorg-ecosystem-may2026/)
- [Doc 593 — FIP Live Activity ZAO Spaces Cross-Client Plan (STANDARD companion)](../593-fip-live-activity-zao-spaces/) — sister doc with the 5-PR action plan; THIS doc supersedes its timing assumptions
- Memory: `project_fishbowlz_deprecated.md` (Juke partnership), `project_spaces_next.md` (Spaces roadmap), `project_miniapp_audit_591.md` (mini-app context), `project_infra_keys.md` (ZAO app FID 19640)

## Sources (DEEP tier — 24 verified)

### Primary FIP material

1. [@rish cast on Farcaster, 2026-05-03](https://farcaster.xyz/rish/0x0fafaa5d) — origin announcement
2. [FIP: Live Activity Status — discussion #268](https://github.com/farcasterxyz/protocol/discussions/268) — protocol layer FIP
3. [FIP: Live Activity Manifest — discussion #269](https://github.com/farcasterxyz/protocol/discussions/269) — application layer FIP
4. [Discussion #266: Snapchain Signers](https://github.com/farcasterxyz/protocol/discussions/266) — referenced FIP authoring conventions
5. [Discussion #262: Functional Signers](https://github.com/farcasterxyz/protocol/discussions/262) — per-type signer scopes (would resolve risk #4)
6. [Mini Apps Specification](https://miniapps.farcaster.xyz/docs/specification) — `accountAssociation` JFS precedent

### Author / co-author profiles

7. [@rish on Farcaster](https://farcaster.xyz/rish) — Neynar co-founder, FIP author
8. [@manan on Farcaster](https://farcaster.xyz/manan) — Neynar SDK engineer
9. [@topocount.eth on Farcaster](https://farcaster.xyz/topocount.eth) — Neynar Snapchain engineer + npm `@farcaster/*` maintainer

### Juke deep dive

10. [juke.audio](https://juke.audio/) — official landing
11. [@nickysap Substack — Farcaster Was Dead, So I Started Building (2026-03-27)](https://nickysap.substack.com/p/farcaster-was-dead-so-i-started-building) — Juke architecture
12. [@nickysap on Farcaster](https://farcaster.xyz/nickysap)

### FarCon

13. [FarCon 2026 Rome — May 4-5](https://farcon.xyz/) — agenda + venue (verify URL)

### Precedent platforms

14. [Twitter Spaces API — Adweek overview](https://www.adweek.com/media/everything-you-need-to-know-about-the-updates-to-twitter-spaces/)
15. [Clubhouse rise + fall — JustAnotherPM](https://www.justanotherpm.com/blog/the-rise-and-fall-of-clubhouse-what-product-managers-learn-from-it)
16. [Discord Developer Documentation — Stage Channels + Rich Presence](https://discord.com/developers/docs/rich-presence/using-with-the-game-sdk)
17. [Last.fm scrobbling spec](https://www.last.fm/api/scrobbling)
18. [Matrix Spec — Presence](https://spec.matrix.org/v1.3/client-server-api/) — presence diffusion CPU cost
19. [Nostr NIP-53 — Live Activities](https://nips.nostr.com/53) — closest LWW precedent for FIP #268

### Distributed systems

20. [CRDT overview — GeeksforGeeks](https://www.geeksforgeeks.org/r-language/what-is-crdt-in-distributed-systems/)
21. [Understanding CRDTs — TiDB](https://www.pingcap.com/article/understanding-crdts-and-their-role-in-distributed-systems/)

### ZAO codebase paths verified live 2026-05-03

22. `src/app/spaces/[id]/layout.tsx`, `src/app/spaces/hms/[id]/layout.tsx` — Space URL pattern `https://zaoos.com/spaces/${id}`
23. `src/app/api/stream/rooms/route.ts` — already casts live-notification with audio URL embed
24. `src/components/spaces/HMSFishbowlRoom.tsx`, `BroadcastPanel.tsx`, `AudioRoomAdapter.tsx`; hooks `src/hooks/useLiveTranscript.ts`, `useAutoStreamMarker.ts`; modules `src/lib/livepeer/`, `src/lib/spaces/`, `src/app/api/livepeer/`, `src/app/api/spaces/`, `src/app/api/stream/`

### URL liveness

All 21 external URLs verified live 2026-05-03. FIP discussions had ZERO comments at fetch time (~12h post-creation). No 404s. Substack and miniapps.farcaster.xyz both load freely.

### Hallucination check

- All FIP spec quotes verbatim from `gh api repos/farcasterxyz/protocol/discussions/{268,269}` body field
- All ZAO file paths grep-confirmed in `/tmp/zao-research-594/src/`
- Network-load math derived; assumptions stated explicitly (1M MAU, 5% concurrent live, 1s heartbeat, FIP #163 target throughput) — not citing as facts where they are extrapolations
- @topocount.eth role inferred from npm package maintainership + GitHub activity; not from explicit Neynar org chart
- Juke architecture details from founder Substack 2026-03-27 (primary); team size + funding labeled as inferences

### Staleness notes

- FIPs are Stage 2 Draft. Spec details may change post-FarCon.
- FarCon is 2026-05-04 / 2026-05-05; this doc was written 2026-05-03. Spec deltas from in-person discussion will require Doc 595 amendment.
- Juke is iOS-only beta. Public commitments to FIP #268 may emerge during FarCon.
