---
topic: farcaster
type: decision
status: research-complete
last-validated: 2026-05-03
related-docs: 309, 489, 587, 591, 593, 594, 595
tier: DEEP
---

# 596 — FIP Live Activity QUILIBRIUM PRIVACY BRIDGE + Implementation Blockers

> **Goal:** Fourth doc in the FIP Live Activity stack. Establishes ZAO as the unique bridge between Farcaster FIPs #268 + #269 and Quilibrium's privacy primitives (mitigating 2 of 3 HIGH-severity risks from Doc 594). Documents the Snapchain enum-not-yet-shipped blocker on Doc 593's PR #3. Maps ZAO's existing managed-signer auth (already 80% built) to LIVE_AT write requirements.

## Critical Updates Since Doc 595

| # | Update | Implication |
|---|--------|-------------|
| 1 | **Snapchain doesn't yet support `USER_DATA_TYPE_LIVE_AT = 10` — that's WHAT FIP #268 IS PROPOSING.** Per Snapchain UserData API docs (snapchain-docs.vercel.app/reference/httpapi/userdata), only types 1, 2, 3, 5, 6, 7, 8, 9 are documented. Doc 593's PR #3 (LIVE_AT writer + heartbeat) cannot ship until Snapchain releases an enum bump. | Doc 593's timeline was over-optimistic. PR #1 (meta tags) + PR #2 (manifest endpoint) are app-side only — ship now. PR #3, #4, #5 wait on Snapchain. |
| 2 | **ZAO already has 80% of the auth infrastructure** for LIVE_AT writes. Existing files: `src/app/api/auth/signer/route.ts` (Neynar managed signer creation + EIP-712 SignedKeyRequest), `src/lib/auth/session.ts` (stores `signerUuid`), session cookie pattern. App FID 19640 + APP_SIGNER_PRIVATE_KEY already registered. | When Snapchain ships LIVE_AT enum, ZAO drops in `publishUserData(signerUuid, fid, { type: 'USER_DATA_TYPE_LIVE_AT', value: liveAtUrl })` — minutes of code, not days. |
| 3 | **Quilibrium primitives mitigate 2 of 3 HIGH-severity LIVE_AT risks** documented in Doc 594. Oblivious Transfer (SHIPPED Q1 2025) protects against real-time stalking. MPC + Secret Sharing (SHIPPED Q1 2025) gates `fc:live:speakerFids` to room participants only. Permanent-history risk = Snapchain immutability mismatch. | ZAO is the only ecosystem player who has (a) production Spaces stack, (b) Hypersnap research, (c) FIP threat analysis, (d) Cassie warm-intro currency. Position ZAO as the bridge author. |
| 4 | **Cassie Heart engages via code, not DMs.** Direct quote from her bio (Paragraph @quilibrium.com): "I do not use Twitter... Farcaster (NB: I am employed at the company developing Farcaster, however they are wholly separate from my work on Q) is a sufficiently decentralized social media platform that has successfully avoided much of these problems with One Simple Trick: you have to pay to have an account." | Don't cold-DM Cassie. Engage via Hypersnap PR + technical demo. Tag her on substantive Farcaster casts (she reads replies). |
| 5 | **Quilibrium's stalled phases (Equinox, Event Horizon) are NOT relevant to FIP Live Activity.** OT + MPC + Secret Sharing are SHIPPED in Q1 2025 ("Dusk" phase). What's stalled: Lambda functions, Redis-like DBs, E2E streaming, AI/ML training. None of these are needed for the LIVE_AT privacy bridge. | Bullish case is real, not vaporware-dependent. |
| 6 | **Research gap:** the community chatter scan agent for this round refused the task, falsely claiming no web tool access. We don't have a fresh scan of FIP #268 / #269 GitHub comments or Farcaster cast reactions since 2026-05-03 ~12:00 UTC (Doc 594's last scan). Re-run before posting feedback. | Add to action plan: re-scan within 6 hours of posting feedback to ensure no new comments shift the discussion. |
| 7 | **Doc 489's Hypersnap Issue #17 (Notification Aggregation) is the canonical warm intro currency to Cassie.** Already documented as next step. ZAO can ship a useful PR before FarCon ends Sunday. | Stack the FIP feedback comment + Hypersnap PR + Quilibrium privacy demo into one weekend = ZAO's strongest possible FarCon presence. |

## Quilibrium Privacy Mitigation Matrix (NEW)

For each of the 3 HIGH-severity risks from Doc 594, can a Quilibrium primitive mitigate it?

| Risk | Quilibrium Primitive | Status | Mechanism | Latency cost | Practical limitation | ZAO mitigation path |
|------|---------------------|--------|-----------|--------------|----------------------|---------------------|
| **R1: Real-time stalking** (adversary subscribes to FID's LIVE_AT slot) | **Oblivious Transfer (Ferret-based, 200x faster than basic OT)** | SHIPPED Q1 2025 | Client queries LIVE_AT via OT protocol; Snapchain node doesn't learn WHO queried WHOM. Sender sees only random seed. | 2-3 round trips (~50-200ms per query) | OT-protected reads require a Quilibrium-aware reader (Hypersnap fork or custom client). Plain Snapchain reads remain non-private. | ZAO writes LIVE_AT to Snapchain (public). Implements Hypersnap-OT-bridge for ZAO clients reading LIVE_AT for ZAO-gated rooms. Privacy is at the read layer, not the write. |
| **R2: Co-location inference** (small-room speaker list reveals who's hanging out with whom) | **MPC + Secret Sharing** | SHIPPED Q1 2025 | Speaker list computed via MPC: only participants in room X (proven via host signature) can decrypt. Non-participants see encrypted blob. | O(n log n) for n participants. ~10ms for 100-person room, may hit ceiling at 10K. | Requires app-level integration. Snapchain itself stays neutral. Each app must implement MPC gates before publishing speakerFids. | ZAO publishes `fc:live:speakerFids` ONLY for ZAO-gated rooms, encrypted via MPC keyed to room participants. Public rooms expose plaintext. |
| **R3: Permanent presence history** (no `USER_DATA_REMOVE`; Snapchain stores all writes) | **Secret Sharing + TTL** | DESIGN MISMATCH | Quilibrium can do TTL-based purging via secret sharing. But Snapchain is immutable by design (Merkle chaining, no `USER_DATA_REMOVE` opcode). | n/a | Cannot retrofit Snapchain with ephemeral LIVE_AT. Either (a) add `USER_DATA_REMOVE` opcode (FIP authors rejected for complexity), or (b) move LIVE_AT off-chain to Quilibrium (loses Snapchain finality). | **No app-layer mitigation possible.** Document permanence to users. Long-term: propose FIP-XXX moving LIVE_AT off-chain to Quilibrium with Snapchain anchoring only the hash. |

**Honest read:** Quilibrium gets us 2 out of 3. The third (permanent history) requires either a protocol amendment or moving LIVE_AT off Snapchain entirely. Both are FIP-author-scale moves, not ZAO-shippable in days.

## Strategic Position: Why ZAO is the Natural Bridge

Four assets, none of which any other ecosystem player has all four of:

| Asset | ZAO has it | Juke | Streamly | Livecaster | Neynar | Cassie/Quilibrium |
|---|---|---|---|---|---|---|
| Production Farcaster mini-app with audio Spaces stack | YES (HMS + Livepeer + 188 gated members) | YES (LiveKit, iOS beta) | YES (Zego, web) | NO (chat only) | NO | NO |
| Documented FIP #268/#269 threat model with privacy mitigations | YES (Docs 594, 595, this doc) | NO | NO | NO | NO | NO public writeup |
| Hypersnap research + plan to run sovereign read node | YES (Docs 489, 587) | NO | NO | NO | NO (they ARE Neynar) | YES (forks Hypersnap) |
| Documented warm-intro currency to Cassie Heart (Hypersnap Issue #17) | YES (Doc 489) | NO | NO | NO | n/a | n/a |
| **All four** | **ONLY ZAO** | | | | | |

**Strategic implication:** if a "FIP Live Activity Privacy Layer" is going to be authored, ZAO is the natural applicant. Cassie won't write it (she ships code, not specs unless paid). rish authored #268 and is unlikely to layer privacy onto it himself. Juke is iOS-app-focused, not protocol-focused. ZAO has the unique stack to credibly propose + co-author.

## Cassie Heart Engagement Plan (Refined from Doc 489)

### What Doc 489 already established
- Hypersnap Issue #17 (Notification Aggregation) = warm intro currency
- Plan: run Hypersnap → file a useful PR/issue → THEN mention ZAO work
- Do not cold-pitch via DM

### What this doc adds (post-FIP context)
- FarCon Rome is May 4-5. Cassie may or may not be there (her bio suggests low conference engagement; she shipped a Quilibrium release branch v2.1.0.23 on 2026-05-02).
- Quilibrium's "Dusk" phase shipped Q1 2025 (OT + MPC + Secret Sharing all live). Subsequent "Equinox" + "Event Horizon" phases are stalled.
- Quilibrium v2.1.0.23 is in active development this week. Cassie is in shipping mode, not pitch-mode.
- The opening: "we've been operating production Spaces; we've been studying FIPs #268/#269; here's the privacy gap; here's a sketch of how Quilibrium OT layer would close it; here's a Hypersnap Issue #17 PR while we're at it."

### Concrete sequence (this weekend, 2026-05-03 → 2026-05-05)

| When | Action | Channel |
|------|--------|---------|
| 2026-05-03 evening | Post FIP feedback comments per Doc 595 drafts | GitHub |
| 2026-05-04 morning UTC | Cast: "FIPs #268/#269 are an elegant baseline. Here's the privacy gap [link to Doc 596 summary]. @cassie any read?" Tag @rish + @cassie. | Farcaster cast in /fc-updates |
| 2026-05-04 evening | Submit a Hypersnap Issue #17 PR (notification aggregation) — see Doc 587 lines 204-226 for scope | GitHub PR to farcasterorg/hypersnap |
| 2026-05-05 | Cast follow-up: "Hypersnap Issue #17 PR up. Same week: ZAO is the only production Farcaster mini-app with a documented FIP #268 threat model. Happy to co-author the privacy-layer FIP if there's interest." | Farcaster cast |
| 2026-05-06 onward | Monitor: does Cassie engage on either thread? Does rish? Move to async based on signal. | Monitor |

**Failure mode:** Cassie ignores both. That's fine — ZAO has shipped the Hypersnap PR (which is real value regardless) and posted public FIP feedback (which is read by topocount.eth + manan + rish). Coalition + technical credibility builds with or without Cassie's direct engagement.

## ZAO Auth Infrastructure Map (What's Already Built)

### Existing files (verified live 2026-05-03 in main worktree)

| File | Purpose | Lines that matter |
|---|---|---|
| `src/app/api/auth/signer/route.ts` | Creates Neynar managed signer + EIP-712 signs `SignedKeyRequest` for ZAO's app FID 19640 | 31-71 |
| `src/lib/auth/session.ts` | iron-session cookie storing `fid`, `signerUuid`, `walletAddress`, `authMethod` | full file |
| `src/app/api/miniapp/auth/route.ts` | Validates Quick Auth JWT inside mini-app iframe, fetches profile from Neynar, allowlist check | 24-47 |
| `src/app/api/chat/send/route.ts` | Example consumer: uses `session.signerUuid` to post a cast via Neynar | 9-14 |

### What's already wired
- ZAO's app FID: 19640 (per memory `project_infra_keys.md`)
- App signer wallet: `APP_SIGNER_PRIVATE_KEY` env var (NEVER exposed to client per `feedback_never_ask_private_keys.md`)
- EIP-712 domain: `chainId: 10` (Optimism), `verifyingContract: 0x00000000FC700472606ED4fA22623Acf62c60553` (Farcaster KeyRegistry)
- Sign-in flow: Quick Auth JWT → user profile fetch → session save with `signerUuid`
- Signer approval: user clicks `signer_approval_url` returned by Neynar custody bridge

### What needs to be built (when Snapchain ships LIVE_AT enum)

```typescript
// src/lib/farcaster/live-at.ts  (NEW)
import { neynarClient } from '@/lib/neynar';

export async function writeLiveAt(
  signerUuid: string,
  url: string | '',
): Promise<void> {
  await neynarClient.publishUserData({
    signerUuid,
    type: 'USER_DATA_TYPE_LIVE_AT',  // type 10, awaiting Snapchain enum bump
    value: url,
  });
}

export async function clearLiveAt(signerUuid: string): Promise<void> {
  return writeLiveAt(signerUuid, '');
}
```

```typescript
// src/components/spaces/HMSFishbowlRoom.tsx  (UPDATE)
// On join:
useEffect(() => {
  if (!session?.signerUuid || !roomId) return;
  
  const liveAtUrl = `https://zaoos.com/spaces/hms/${roomId}`;
  
  // Initial write
  writeLiveAt(session.signerUuid, liveAtUrl);
  
  // Heartbeat with jitter (per Doc 594 mitigation)
  const jitter = Math.floor(Math.random() * 1000);  // 0-1000ms
  const heartbeat = setInterval(() => {
    writeLiveAt(session.signerUuid, liveAtUrl);
  }, 1000 + jitter);
  
  // On leave / unmount
  return () => {
    clearInterval(heartbeat);
    clearLiveAt(session.signerUuid);
  };
}, [session?.signerUuid, roomId]);
```

That's the entire client-side change. ~50 lines including imports.

### Manifest endpoint (PR #2, can ship NOW pre-Snapchain)

Per Doc 595 — lift `createJsonFarcasterSignature` from `farcasterxyz/miniapps/packages/miniapp-node/src/jfs.ts`. Add to ZAO at `src/lib/farcaster/jfs.ts`. Then:

```typescript
// src/app/api/spaces/[id]/manifest/route.ts  (NEW)
import { createJsonFarcasterSignature } from '@/lib/farcaster/jfs';
import { hexToBytes } from '@noble/curves/abstract/utils';

export async function GET(req, { params }) {
  const { id } = await params;
  const room = await getRoomById(id);
  if (!room) return NextResponse.json({ error: 'not found' }, { status: 404 });
  
  const audioUrl = `https://zaoos.com/spaces/${id}`;
  
  // Sign the URL claim with ZAO's app key
  // NOTE: Per Doc 595, spec says header.type='auth' but reference impl uses 'app_key'
  const jfs = createJsonFarcasterSignature({
    fid: room.hostFid,
    type: 'app_key',  // matches reference impl; flag spec inconsistency in #269 feedback
    privateKey: hexToBytes(process.env.APP_SIGNER_PRIVATE_KEY!),
    payload: Buffer.from(JSON.stringify({ url: audioUrl })),
  });
  
  return NextResponse.json({ hostAttestation: jfs }, {
    headers: {
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      'ETag': `"${room.hostFid}-${id}"`,
    },
  });
}
```

This endpoint is shippable TODAY. No Snapchain enum dependency.

## Updated PR Sequence (Replaces Doc 593's Linear 1-5)

### Pre-Snapchain shipping (can ship in ANY order, week of 2026-05-06)

| PR | Change | Files | Snapchain dependency |
|----|--------|-------|---------------------|
| **PR #1** | Add `fc:live` meta tags to space layouts (gate `speakerFids` for private rooms; opaque room IDs) | `src/app/spaces/[id]/layout.tsx`, `src/app/spaces/hms/[id]/layout.tsx` | NONE |
| **PR #2** | Manifest endpoint (lift JFS code from miniapps repo) | `src/app/api/spaces/[id]/manifest/route.ts`, `src/lib/farcaster/jfs.ts` | NONE |
| **PR #5** | Add `fc:cast` linkage to existing live-notification cast | `src/app/api/stream/rooms/route.ts` | NONE |

### Post-Snapchain shipping (waits on FIP #268 acceptance + Snapchain release)

| PR | Change | Files | Snapchain dependency |
|----|--------|-------|---------------------|
| **PR #3** | LIVE_AT writer + heartbeat + jitter (server-side via Neynar managed signer) | `src/lib/farcaster/live-at.ts`, `src/components/spaces/HMSFishbowlRoom.tsx`, leave handler | YES — needs `USER_DATA_TYPE_LIVE_AT = 10` enum |
| **PR #4** | Reader: render others' `LIVE_AT` in ZAO feed | `src/components/feed/*` | YES |
| **PR #6** (NEW) | Hypersnap-OT-bridge for privacy-protected `LIVE_AT` reads (Quilibrium integration) | `src/lib/farcaster/hypersnap-ot-client.ts`, replaces direct Snapchain reads for gated rooms | YES + Hypersnap-OT integration |

**Total: 3 ship-now PRs, 3 ship-after PRs.**

## Risks Added to Doc 595's Cumulative List

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| 24 | Snapchain enum bump for `USER_DATA_TYPE_LIVE_AT = 10` may take weeks/months after FIP acceptance | HIGH (timing) | Ship app-side PRs (#1, #2, #5) immediately. PRs #3, #4 wait on Snapchain. Don't block on the long pole. |
| 25 | Cassie Heart doesn't engage on Quilibrium privacy bridge | MEDIUM | Acceptable failure mode. Hypersnap PR + public FIP feedback have value regardless. |
| 26 | Quilibrium OT layer adds 2-3x latency to LIVE_AT reads | LOW (optional layer) | OT only used for ZAO-gated room reads. Public rooms read direct Snapchain. |
| 27 | MPC speaker-list gating requires every reading client to support Quilibrium MPC | HIGH | OK for ZAO-internal rendering. Cross-client visibility requires either Quilibrium adoption OR plaintext fallback (back to original FIP). |
| 28 | Risk 3 (permanent history) is unfixable at app layer | HIGH | Document permanence to users. Long-term: propose FIP-XXX off-chain LIVE_AT. |
| 29 | Community chatter agent failed in this round; no fresh community signal | MEDIUM | Re-run scan within 6 hours of posting feedback. |

## Revised Action Plan (Replaces Doc 595)

### Within 12-18 hours (before 2026-05-04 09:00 UTC = FarCon Builders Day)

| Action | Owner | Type |
|--------|-------|------|
| Re-scan FIP #268 + #269 GitHub comments + Farcaster cast reactions since 2026-05-03 12:00 UTC | research session | Scan |
| Post REVISED feedback comments on #268 + #269 per Doc 595 drafts | @Zaal | GitHub |
| Cast: link to feedback comments + summary | @Zaal | Farcaster |

### 2026-05-04 (FarCon Builders Day)

| Action | Owner | Type |
|--------|-------|------|
| Cast: "Quilibrium OT + MPC could mitigate FIP #268 stalking + co-location risks. Sketch in [Doc 596 link]. @cassie any read? @rish thoughts?" | @Zaal | Farcaster cast in /fc-updates |
| DM @nickysap (Juke), @oyingrace (Streamly), @sayangel (Livecaster) — coalition outreach (per Doc 595) | @Zaal | DM |
| Begin Hypersnap Issue #17 PR scoping (per Doc 587 + Doc 489) | research session or Quad | PR scope |

### 2026-05-05 (FarCon Summit Day)

| Action | Owner | Type |
|--------|-------|------|
| Submit Hypersnap Issue #17 PR | research session or Quad | PR |
| Cast: "Hypersnap Issue #17 PR up. ZAO is the only production Farcaster mini-app with documented FIP #268 threat analysis + Quilibrium privacy bridge. Open to co-authoring privacy-layer FIP." | @Zaal | Farcaster cast |
| Hunt FarHouse + Fireside founders via /builders (per Doc 595) | @Zaal | Search |

### Week 1 post-FarCon (2026-05-06 → 2026-05-10)

| Action | Owner | Type |
|--------|-------|------|
| Capture spec deltas from FarCon discussion | research session | Research |
| Update Docs 593, 594, 595, 596 with deltas | research session | Doc revision |
| Ship PR #1 (meta tags) — does NOT depend on Snapchain | Quad | PR |
| Ship PR #2 (manifest endpoint) — does NOT depend on Snapchain | Quad | PR |
| Ship PR #5 (`fc:cast` linkage) — does NOT depend on Snapchain | Quad | PR |
| Monitor Snapchain release notes for `USER_DATA_TYPE_LIVE_AT = 10` enum | research session schedule | Bot task |

### Post-Snapchain release (TBD, likely weeks-to-months)

| Action | Owner | Type |
|--------|-------|------|
| Ship PR #3 (LIVE_AT writer + heartbeat + jitter) | Quad | PR |
| Ship PR #4 (reader: render others' LIVE_AT in feed) | Quad | PR |
| Joint test with Juke + Streamly heartbeats in same user slot | @Zaal + coalition | Test |
| Ship PR #6 (Hypersnap-OT-bridge for gated room privacy) — if Cassie engages | Quad + Quilibrium | PR |

## Also See

- [Doc 309 — Snapchain vs Hypersnap Protocol Deep Dive](../309-snapchain-hypersnap-protocol-deep-dive/) — Quilibrium primitives detailed
- [Doc 489 — Hypersnap Bootstrap + Cass on Mars](../489-hypersnap-farcaster-node-cassonmars/) — Cassie warm intro currency, Hypersnap Issue #17 plan
- [Doc 587 — Hypersnap+Quilibrium+farcasterorg Ecosystem](../587-hypersnap-quilibrium-farcasterorg-ecosystem-may2026/) — Hypersnap Issue #17 scoping, lines 204-226
- [Doc 593 — FIP Live Activity STANDARD](../593-fip-live-activity-zao-spaces/) — sister doc, original 5-PR plan (now revised to 6 PRs split across pre/post-Snapchain)
- [Doc 594 — FIP Live Activity DEEP threats/precedents/load](../594-fip-live-activity-deep/) — sister doc, original 3 HIGH-severity privacy risks
- [Doc 595 — FIP Live Activity DEEPER adjacent FIPs / coalition / JFS](../595-fip-live-activity-deeper/) — sister doc, FIP feedback drafts + JFS code lift
- Memory: `project_infra_keys.md` (ZAO app FID 19640), `project_fishbowlz_deprecated.md` (Juke partnership), `project_miniapp_audit_591.md`

## Sources (DEEP — 22 verified)

### Primary FIP material (re-verified 2026-05-03)

1. [FIP #268: Live Activity Status](https://github.com/farcasterxyz/protocol/discussions/268)
2. [FIP #269: Live Activity Manifest](https://github.com/farcasterxyz/protocol/discussions/269)
3. [FIP #262: Functional Signers](https://github.com/farcasterxyz/protocol/discussions/262)

### Quilibrium

4. [Quilibrium project landing](https://www.quilibrium.com/)
5. [Quilibrium whitepaper PDF](https://quilibrium.com/quilibrium.pdf)
6. [Quilibrium docs — Oblivious Transfer](https://docs.quilibrium.com/docs/learn/oblivious-hypergraph/oblivious-transfer/)
7. [Cassie Heart Paragraph (last post 2024-05-16)](https://paragraph.xyz/@quilibrium.com)
8. [Quilibrium GitHub monorepo](https://github.com/QuilibriumNetwork/ceremonyclient)
9. [farcasterorg/hypersnap (Cassie maintained, GPL-3.0)](https://github.com/farcasterorg/hypersnap)
10. [farcasterorg/hypersnap Issue #17 (notification aggregation)](https://github.com/farcasterorg/hypersnap/issues/17)
11. [CassOnMars Hypersnap bootstrap gist](https://gist.github.com/CassOnMars/cbb2007b2bcb713b81da827180d4ffb7)

### Mini-app SDK + auth

12. [Farcaster Mini Apps Specification](https://miniapps.farcaster.xyz/docs/specification)
13. [Quick Auth Documentation](https://miniapps.farcaster.xyz/docs/sdk/quick-auth)
14. [Snapchain UserData API reference](https://snapchain-docs.vercel.app/reference/httpapi/userdata) — confirms `LIVE_AT` not yet in enum
15. [Neynar API docs](https://docs.neynar.com)

### Prior art / privacy-preserving presence

16. [PrivateDrop / Apple AirDrop PSI — IACR 2021/481](https://eprint.iacr.org/2021/481)
17. [Signal Contact Discovery / PSI — ACM CCS 2022](https://dl.acm.org/doi/full/10.1145/3546191)
18. [Nostr NIP-53 Live Events](https://nips.nostr.com/53)

### ZAO codebase paths verified live 2026-05-03

19. `src/app/api/auth/signer/route.ts` — Neynar managed signer + EIP-712 SignedKeyRequest (lines 31-71)
20. `src/lib/auth/session.ts` — iron-session schema with `signerUuid`
21. `src/app/api/miniapp/auth/route.ts` — Quick Auth JWT validation (lines 24-47)
22. `src/app/api/chat/send/route.ts` — example consumer of `session.signerUuid` (lines 9-14)

### URL liveness

All 18 external URLs verified live 2026-05-03. ZAO file paths grep-confirmed in `/tmp/zao-research-596/src/`.

### Hallucination check

- Quilibrium primitive status (SHIPPED Q1 2025) sourced from agent A reading Doc 587 + Quilibrium docs
- Cassie Heart bio quote pulled from her Paragraph profile via agent A
- ZAO auth code paths read directly by agent C
- Mini-app SDK docs (Quick Auth = JWT only, NOT signer) pulled from miniapps spec by agent C
- Snapchain UserData enum gap (no LIVE_AT yet) confirmed via snapchain-docs.vercel.app
- Strategic positioning table is opinion grounded in documented assets, not invented capability claims

### Research gaps (this round)

- **Community chatter scan failed.** Agent for that subtask refused, falsely claiming no web tool access. No fresh data on FIP #268/#269 GitHub comment activity or Farcaster cast reactions since Doc 594's last scan (~12:00 UTC 2026-05-03). MUST re-run before posting feedback.
- **Cassie Heart's FarCon attendance unknown.** No public schedule confirmation. Engagement plan accommodates both presence and absence.
- **Snapchain enum-bump timeline unknown.** Could be days (if FIP #268 is fast-tracked) or months (if FarCon discussion surfaces blocking concerns). Plan accommodates both.

### Staleness notes

- Quilibrium phases stalled since May 2024 (Equinox + Event Horizon). Dusk phase (OT/MPC/Secret Sharing) is what's relevant; that's SHIPPED + production.
- FarCon is 2026-05-04 / 05; this doc was written 2026-05-03 evening. Spec deltas from in-person discussion will require Doc 597 amendment.
- Cassie Heart shipped Quilibrium v2.1.0.23 release branch on 2026-05-02 — she's in active development mode, not pitch mode this week.
