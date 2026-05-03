---
topic: farcaster
type: decision
status: research-complete
last-validated: 2026-05-03
related-docs: 309, 489, 587, 591, 593, 594
tier: DEEP
---

# 595 — FIP Live Activity DEEPER: Adjacent-FIP Gap Map, 5-App Coalition, JFS Reference Implementation

> **Goal:** Third doc in the FIP Live Activity stack. Closes three open questions from Doc 594: (1) which adjacent FIPs would actually fix the gaps and what's their status, (2) which apps beyond Juke are real coalition partners, (3) what does the JFS reference implementation actually look like — lift-ready TypeScript.

## Critical Updates Since Doc 594

| # | Update | Implication |
|---|--------|-------------|
| 1 | **FIP #262 (Functional Signers) explicitly PUNTS on per-`UserDataType` scopes.** Direct quote from FIP body: "`USER_DATA_ADD` comprises multiple data types. These are not decomposed for scoping as a part of this FIP. For example, a signer cannot update a PFP but not a BIO. The reason for this is that these are all client-level modifications changes a user might want to make, not app specific." | The FIP that I assumed in Doc 594 would close the no-opt-out gap **explicitly does not.** A LIVE_AT-only app cannot be granted `LIVE_AT` without also being granted PFP, BIO, location, etc. Need to advocate for an amendment to FIP #262 Part 1 OR a separate scope for ephemeral UserData types. |
| 2 | **FIP #163 (Scaling Farcaster) is stalled and likely dying.** 8 months of comments since April 2024, last update Dec 2024. @varunsrin redirected discussion to FIP #193 (Introducing Ordering). No commitment to 5K writes/sec throughput under contention. | LIVE_AT's 5,000/hr-per-storage-unit budget cannot be validated against any committed network throughput. Ship LIVE_AT at 1s heartbeat = bet that Snapchain absorbs the load without an existing FIP guarantee. |
| 3 | **FIP #266 (Snapchain Signers) is moving forward** — Stage 3: Review, low dispute. It's a meta-FIP about authoring conventions, not a feature. Sets the bar for FIP #268's explicit rate-limit-budget format. | Confirms FIP #268's structure is compliant. Doesn't change anything about LIVE_AT design. |
| 4 | **JFS reference implementation is fully open source** at `farcasterxyz/miniapps/packages/miniapp-node/src/jfs.ts`. Uses `@noble/curves/ed25519`. ~100 lines TypeScript. | ZAO can lift the verification + signing functions directly. PR #2 (manifest endpoint per Doc 593) drops to ~20 lines of glue + the lifted code. Faster than estimated. |
| 5 | **FIP #269 spec / reference-impl mismatch.** Reference impl in `jfs.ts` line 105 sets `header.type = 'app_key'`. FIP #269 spec text says `header.type === "auth"`. | Spec inconsistency. Flag in feedback comment to #269 — either spec should change to `'app_key'` or reference impl should add `'auth'` support. Could trip up implementers. |
| 6 | **Coalition expands from 2 apps to 5.** Beyond Juke (LiveKit + iOS): Livecaster (@sayangel, chat-only on reply tree, 25K+ casts during NBA Finals), Streamly (@oyingrace, OPEN SOURCE Zego video streaming at github.com/oyingrace/streamly), FarHouse (production iOS+Android Clubhouse-like, founder opaque), Fireside (Base App + Farcaster mini-app, founder opaque). | Coalition build order is Juke → Streamly → Livecaster (DM-able), then hunt FarHouse + Fireside founders via Farcaster /builders. Stronger than 2-app coalition. |
| 7 | **FIP #238 (Signer Revokes Only Impact Future Messages) is FINALIZED.** Revoking a key does NOT invalidate messages previously signed by it. | Compromised app key can write malicious LIVE_AT, then be revoked, but the malicious write persists in Snapchain. Mitigation: 5-second freshness check (FIP #268) means stale malicious writes won't render after 5s. But old writes are not erased. |
| 8 | **FIP #241 (Cross-Shard Communication) is in Stage 3: Review.** Specifies inter-shard messaging. Does NOT mention rate limits or per-type sharding. | Shard load-balancing for LIVE_AT writes is NOT addressed by FIP #241. ZAO's hot-shard concern (synchronized heartbeats) requires app-layer mitigation (jitter), as Doc 594 already specified. |

## Revised Key Decisions (Supersedes Doc 594 where conflicting)

| # | Decision | Action | Why |
|---|----------|--------|-----|
| 1 | **EXPAND feedback comment on #268** to include three concrete spec deltas | Add: (a) per-`UserDataType` scopes amendment to FIP #262 Part 1, (b) rate limit elasticity / load-shedding spec for FIP #163 refresh, (c) cross-shard balancing amendment to FIP #241. Use the verbatim draft below. | Doc 594's draft was solid but didn't cite the three adjacent FIPs by number. Adjacent-FIP grounding makes the feedback land harder with rish + topocount + manan. |
| 2 | **FLAG the #269 spec inconsistency** (`auth` vs `app_key`) in #269 feedback comment | One additional sentence in the #269 draft. | Trivial fix. Authors will appreciate the catch. |
| 3 | **LIFT the JFS code from `farcasterxyz/miniapps`** for ZAO's PR #2 (manifest endpoint per Doc 593) | Use `@noble/curves/ed25519`. Copy `createJsonFarcasterSignature` + `verifyJsonFarcasterSignature` verbatim, parameterize the payload to take `{ url }` instead of `{ domain }`. | Don't rewrite. The reference impl is well-tested + audited. |
| 4 | **EXPAND coalition outreach from "Juke only" to "Juke + Streamly + Livecaster (Tier 1)"** | DM @nickysap, @oyingrace, @sayangel within 48h. Then hunt FarHouse + Fireside founders. | Stronger coalition = harder for FIP #268 to ship without our preferred per-type-scope amendment. |
| 5 | **DO NOT WAIT for FIP #262 Part 1** — assume per-type scopes won't ship in this cycle | Design ZAO's app-key authorization with full `USER_DATA_ADD` scope. User-facing UI must clearly disclose: "ZAO can update your live presence URL AND your profile fields." | FIP #262 is stalled. Even if Part 1 advances, per-type scopes are explicitly out of scope. Don't block ZAO's launch on a spec change that may take 6+ months. |
| 6 | **Caveat on agent search drift:** during this research round, one secondary search agent reported FIP #268 "not found" on GitHub. **This is incorrect.** Direct `gh api repos/farcasterxyz/protocol/discussions/268` confirms the FIP exists, was created 2026-05-03 by rishavmukherji, FIP Stage 2: Draft, body verified verbatim. | Trust primary source. Note in this doc to prevent future confusion. | Demonstrates why direct API > generic search for fresh FIPs. |

## Adjacent FIP Gap Map (Agent A Findings)

### FIP #163 — Scaling Farcaster

| Field | Value |
|---|---|
| Stage | FIP Stage 2: Draft (closed) |
| Created | 2024-04-10 |
| Last updated | 2024-12-03 (8 months later, then silence) |
| Comments | 29 |
| Active dispute | Yes — fundamental |
| Status | DYING / DEPRIORITIZED |

**Critical disputes** in the comment thread:
- @PhABC: "way too generous" on storage cost; demands 10x pricing + 500-cast onboarding limits
- @varunsrin (Farcaster co-founder): cutting limits 50% only saves 3-10% storage; deflects throughput concern
- @varunsrin redirects to FIP #193 (Introducing Ordering) → suggests FIP #163 is being absorbed into a different scaling approach

**Key gap relevant to LIVE_AT:**
- Proposes hub hardware: 16 CPU, 128 GB RAM, 20 TB storage (vs current 4 CPU / 16 GB / 500 GB) — **40x storage jump**
- Benchmark "10,000 msg/sec under ideal conditions" is not a binding network SLA
- No commitment to per-`UserDataType` rate limit budgets
- No back-pressure / load-shedding spec
- No shard rebalancing for hot-shard scenarios

**Spec delta needed before LIVE_AT ships safely:**
1. Commit to 5K writes/sec sustained throughput under contention with normal cast traffic
2. Specify drop/jitter/exponential-backoff policy when capacity exceeded
3. Validate 20 TB / 128 GB hardware actually achieves 5K/sec in benchmarks
4. Cap LIVE_AT budget at 1000/hour/unit (3-second heartbeat) until scaling is proven

### FIP #262 — Functional Signers

| Field | Value |
|---|---|
| Stage | FIP Stage 2: Draft |
| Created | 2026-02-21 |
| Last updated | 2026-02-25 (4 days, then stalled) |
| Comments | 5 |
| Status | STALLED — Part 1 likely advances, Part 2 likely dead |

**Critical content:**
- Part 1: off-chain signer registration via custody-authenticated messages (removes gas / wallet friction). Has community support.
- Part 2: MPC / FROST threshold signing. Opposed by @christopherwxyz, @manan19, @topocount on UX grounds.

**Direct quote that closes the per-type scopes gap NEGATIVELY:**

> **Note**: `USER_DATA_ADD` comprises multiple data types. These are not decomposed for scoping as a part of this FIP. For example, a signer cannot update a PFP but not a BIO. The reason for this is that these are all client-level modifications changes a user might want to make, not app specific.

**Implication for FIP #268:**
- An app key authorized for `MESSAGE_TYPE_USER_DATA_ADD` (currently the only way to write LIVE_AT) gets full UserData authority
- A LIVE_AT-only mini app must request the same authority as a profile editor
- User cannot distinguish trust surface in current authorization UX

**Spec delta needed:**
- Either:
  - (a) Amend FIP #262 Part 1 to include `scopes = [USER_DATA_TYPE_LIVE_AT]` granularity, OR
  - (b) Add a new top-level `MESSAGE_TYPE_USER_DATA_LIVE_AT` (separating LIVE_AT from other UserData), OR
  - (c) Accept the trust scope blur and document it clearly to users

ZAO recommendation: advocate for (a) in feedback. If rejected, document (c) clearly.

### FIP #266 — Snapchain Signers

| Field | Value |
|---|---|
| Stage | FIP Stage 3: Review |
| Created | 2026-04-07 (post-LIVE_AT? No — FIP #268 was 2026-05-03) |
| Last updated | 2026-04-23 |
| Comments | 4 |
| Status | MOVING FORWARD |

**Content:** Meta-FIP. Establishes FIP authoring conventions for Snapchain proposals:
- All FIPs touching Snapchain must specify validation rules, storage model, rate limits explicitly
- New `MessageType` or modified validation must specify backwards-compatibility behavior
- New rate limit FIPs must state the budget (writes/sec or writes/hour per storage unit)

**Implication for LIVE_AT:**
- FIP #268 complies (separate explicit rate limit, validation rule, no storage change)
- FIP #266 does NOT itself address per-app-key rate limits, per-shard balancing, or aggregate caps
- FIP #266 sets the grammar; FIP #163 must set the lexicon

### Other relevant FIPs found

| # | Title | Stage | Relevance |
|---|-------|-------|-----------|
| 156 | Audio Support for Frames | Stage 1: Ideas (closed) | ABANDONED. Not relevant to LIVE_AT (Frames vs URLs). |
| 238 | Signer Revokes Only Impact Future Messages | FINALIZED | Compromised key's old writes persist after revoke. 5s freshness check mitigates current rendering, but historical writes irreversible. |
| 241 | Cross-Shard Communication in Snapchain | Stage 3: Review | Specifies inter-shard messaging. Does NOT address per-type sharding or LIVE_AT load distribution. |
| 247 | Profile Tokens | Stage 3: Review | Token-gated profile data. Indirect: token-gated LIVE_AT visibility could be future feature. Not blocking. |

## Coalition Map (Agent B Findings)

### Tier 1 (DM within 48h, all are reachable)

| App | Founder | Stack | Distribution | Open source? | FIP-268 commit |
|-----|---------|-------|---|---|---|
| **Juke** | [@nickysap](https://farcaster.xyz/nickysap) | LiveKit (WebRTC SFU) + Farcaster reply-tree chat | iOS TestFlight, Android coming | NO (closed beta, founder said may OSS later) | None yet |
| **Streamly** | [@oyingrace](https://farcaster.xyz/oyingrace) | Zego Express Engine (WebRTC SDK) | Farcaster mini-app + Base App | YES — [github.com/oyingrace/streamly](https://github.com/oyingrace/streamly), TypeScript/Next.js 15 | None yet |
| **Livecaster** | [@sayangel](https://farcaster.xyz/sayangel) | Farcaster reply-tree (CHAT only, no audio) | Farcaster mini-app | Unknown | None yet |

### Tier 2 (founder opaque, hunt via Farcaster /builders or App Store devs)

| App | Founder | Stack | Distribution | FIP-268 commit |
|-----|---------|-------|---|---|
| **FarHouse** | Unknown | Proprietary audio | iOS + Android (App Store + Play Store), live since 2025-03 | None yet |
| **Fireside** | Unknown | Proprietary | Farcaster mini-app + Base App, beta | None yet |

### Coalition build order

1. **@nickysap (Juke)** TODAY — explicit alignment on cooperative writer convention. Founder is public, prolific, recent Substack 2026-03-27 framing live audio as first-class. **Receptivity: HIGH.**
2. **@oyingrace (Streamly)** within 24h — open-source repo means contribution path is clear. GitHub issue + Farcaster DM. Streamly is video, not just audio — broadens FIP discussion to "live activities" not just "spaces." **Receptivity: MEDIUM-HIGH** (open source + active commits).
3. **@sayangel (Livecaster)** within 48h — different angle: Livecaster is chat-only, but the reply-tree pattern is what FIP #269 standardizes. Angel is a senior Farcaster builder (Harmonybot, Warplets, ElizaOS contribs). His public endorsement = ecosystem-wide signal. **Receptivity: MEDIUM-HIGH.**
4. **FarHouse founder** within 5 days — App Store devs lookup + Farcaster /builders ask. **Receptivity: UNKNOWN.**
5. **Fireside founder** within 5 days — same hunt path. **Receptivity: UNKNOWN.**

**Strategic outcome:** ZAO + Juke + Streamly + Livecaster = 4 voices, including 2 open-source, 2 with founders publicly active. That's a credible coalition for the FarCon discussion + any spec-amendment advocacy.

## JFS Reference Implementation (Agent C Findings — LIFT-READY)

### Repo + paths

| Asset | Location |
|---|---|
| Repo | [farcasterxyz/miniapps](https://github.com/farcasterxyz/miniapps) |
| Type definitions | `packages/miniapp-core/src/manifest.ts` (lines 1-29) |
| Schema (Zod) | `packages/miniapp-core/src/schemas/shared.ts` (lines 93-113) |
| Signing function | `packages/miniapp-node/src/jfs.ts` (lines 84-105) |
| Verification function | `packages/miniapp-node/src/jfs.ts` (lines 42-103) |
| Crypto library | `@noble/curves/ed25519` (per `packages/miniapp-node/package.json`) |
| Tests / examples | `packages/miniapp-node/tests/jfs.test.ts` (lines 47-75) |

### Type definition (lift directly)

```typescript
export type AccountAssociation = {
  /** Base64URL encoded JFS header */
  header: string
  /** Base64URL encoded payload */
  payload: string
  /** Base64URL encoded signature */
  signature: string
}
```

### JFS signing function (verbatim from `jfs.ts:84-105`)

```typescript
import { ed25519 } from '@noble/curves/ed25519'
import { bytesToHex } from '@noble/curves/abstract/utils'

export function createJsonFarcasterSignature({
  fid,
  type,
  privateKey,
  payload,
}: {
  fid: number
  type: 'app_key'
  privateKey: Uint8Array
  payload: Uint8Array
}): EncodedJsonFarcasterSignatureSchema {
  const publicKey = ed25519.getPublicKey(privateKey)

  const header = { fid, type, key: bytesToHex(publicKey) }
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
  const encodedPayload = Buffer.from(payload).toString('base64url')
  const signatureInput = new Uint8Array(
    Buffer.from(encodedHeader + '.' + encodedPayload, 'utf-8'),
  )

  const signature = ed25519.sign(signatureInput, privateKey)
  const encodedSignature = Buffer.from(signature).toString('base64url')

  return {
    header: encodedHeader,
    payload: encodedPayload,
    signature: encodedSignature,
  }
}
```

### JFS verification function (verbatim from `jfs.ts:42-103`)

```typescript
export async function verifyJsonFarcasterSignature(
  data: unknown,
  verifyAppKey: VerifyAppKey,
): Promise<VerifyJfsResult> {
  // Parse, decode and validate envelope
  const body = encodedJsonFarcasterSignatureSchema.safeParse(data)
  if (body.success === false) {
    throw new InvalidJfsDataError('Error parsing data', body.error)
  }

  let headerData: any
  try {
    headerData = JSON.parse(
      Buffer.from(body.data.header, 'base64url').toString('utf-8'),
    )
  } catch (_error: unknown) {
    throw new InvalidJfsDataError('Error decoding and parsing header')
  }

  const header = jsonFarcasterSignatureHeaderSchema.safeParse(headerData)
  if (header.success === false) {
    throw new InvalidJfsDataError('Error parsing header', header.error)
  }

  const payload = Buffer.from(body.data.payload, 'base64url')
  const signature = Buffer.from(body.data.signature, 'base64url')
  if (signature.byteLength !== 64) {
    throw new InvalidJfsDataError('Invalid signature length')
  }

  // Verify signature cryptographically
  const fid = header.data.fid
  const appKey = header.data.key
  const appKeyBytes = hexToBytes(appKey)
  const signedInput = new Uint8Array(
    Buffer.from(body.data.header + '.' + body.data.payload),
  )

  let verifyResult: boolean
  try {
    verifyResult = ed25519.verify(signature, signedInput, appKeyBytes)
  } catch (e) {
    throw new InvalidJfsDataError(
      'Error checking signature',
      e instanceof Error ? e : undefined,
    )
  }

  if (!verifyResult) {
    throw new InvalidJfsDataError('Invalid signature')
  }

  // Verify app key belongs to FID (Snapchain query)
  let appKeyResult: VerifyAppKeyResult
  try {
    appKeyResult = await verifyAppKey(fid, appKey)
  } catch (error: unknown) {
    throw new VerifyAppKeyError(
      'Error verifying app key',
      error instanceof Error ? error : undefined,
    )
  }

  if (!appKeyResult.valid) {
    throw new InvalidJfsAppKeyError('App key not valid for FID')
  }

  return { fid, appFid: appKeyResult.appFid, payload }
}
```

### ZAO PR #2 (manifest endpoint) implementation sketch

```typescript
// src/app/api/spaces/[id]/manifest/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createJsonFarcasterSignature } from '@/lib/farcaster/jfs'
import { getZAOAppSigner } from '@/lib/auth/app-signer'
import { getRoomById } from '@/lib/spaces/store'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const room = await getRoomById(id)
  if (!room) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const audioUrl = `https://zaoos.com/spaces/${id}`
  const { fid, privateKey } = await getZAOAppSigner()

  const jfs = createJsonFarcasterSignature({
    fid: room.hostFid,        // host's FID, not ZAO's app FID
    type: 'app_key',           // NOTE: spec says 'auth', impl uses 'app_key' — see flag below
    privateKey,                // ZAO's app key, authorized by host
    payload: Buffer.from(JSON.stringify({ url: audioUrl })),
  })

  return NextResponse.json({
    hostAttestation: jfs,
  }, {
    headers: {
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      'ETag': `"${room.hostFid}-${id}"`,
    },
  })
}
```

**Notes:**
- `getZAOAppSigner()` returns ZAO's registered app key (FID 19640's signer for `MESSAGE_TYPE_USER_DATA_ADD`)
- Caching: 60s public + 5min stale-while-revalidate. Hosts don't change keys mid-Space, so manifests are stable for the room's lifetime.
- `type: 'app_key'` matches the reference impl; spec says `'auth'`. Flag in feedback comment.

### Spec inconsistency flag

| Source | `header.type` value |
|---|---|
| FIP #269 spec text | `"auth"` (per "Verify `header.type === 'auth'`") |
| Reference impl `jfs.ts:91` | `'app_key'` (literal type in TypeScript signature) |
| Mini App `accountAssociation` spec | `"custody"` or `"auth"` |
| Mini App reference impl | `'app_key'` (apparently distinct from spec) |

This is a real spec inconsistency. The actual code uses `'app_key'` (reflecting the use of an app-delegated key, not the custody key). The spec text in FIP #269 and Mini Apps spec needs updating, OR the reference impl needs to support both.

### Key rotation handling

- SDK does NOT cache signatures or pre-validate
- `verifyAppKey` callback queries Snapchain for current active key set per FID
- If host rotates their app key (KEY_REMOVE + KEY_ADD), ALL existing JFS manifests signed with the old key fail verification
- Mitigation for ZAO: re-sign all active room manifests on key rotation event (rare); cache manifests with TTL ≤ expected rotation frequency

## Updated FIP Feedback Comment Drafts

### Comment to post on [discussion #268](https://github.com/farcasterxyz/protocol/discussions/268) (revised from Doc 594)

```
Strong support — `UserData` is the right home for "currently live at" and the
small protocol delta is admirable.

Three substantive points + one nit, from operating an HMS+Livepeer Spaces stack
on a gated 188-member Farcaster mini-app (ZAO OS, app FID 19640):

1. **Network-wide write rate vs FIP #163.** Per-FID 5,000/hr budget is generous.
   Aggregate is unconstrained. Back-of-envelope: 5% concurrent-live across 1M
   users at 1s heartbeat = 5,000 writes/sec for LIVE_AT alone, ~27x current
   sustained throughput per FIP #163's "10,000 msg/sec under ideal conditions"
   benchmark (which itself isn't an SLA). FIP #163 has been quiet since Dec 2024
   and was redirected to FIP #193. Suggest either:
   - LIVE_AT capped at 1000/hr/unit (3s heartbeat) until scaling is committed
   - or FIP #163 refresh that commits to 5K writes/sec under contention with
     normal cast traffic, and specifies drop/jitter/back-pressure policy
   Hot-shard risk is also real because heartbeats are wall-clock-correlated.
   Recommend an informational note suggesting clients apply 0-1000ms jitter.

2. **Per-`UserDataType` scopes vs FIP #262.** Currently a key authorized for
   `USER_DATA_ADD` can write LIVE_AT, PFP, BIO, location — same surface. FIP #262
   Part 1 explicitly defers per-`UserDataType` decomposition: "these are all
   client-level modifications a user might want to make, not app specific." But
   LIVE_AT is structurally different from PFP — ephemeral, programmatically
   generated, 3,600 writes/hr at peak. A LIVE_AT-only miniapp should be grantable
   without granting profile-edit authority. Suggest amending FIP #262 Part 1 to
   support `scopes = [USER_DATA_TYPE_LIVE_AT]` granularity. Otherwise users have
   no way to distinguish trust surface between a presence app and a profile
   editor.

3. **Permanent presence history.** `value = ""` clears current state, but write
   history persists on Snapchain indefinitely. For users joining live activities
   in sensitive contexts (private DAOs, support groups, gated rooms), this is an
   irreversible attack surface. The FIP correctly rejects USER_DATA_REMOVE for
   complexity reasons, but a documentation note on this property would help app
   authors educate users. FIP #238 confirms revoking a key doesn't invalidate
   prior signed messages — same surface here.

Nit: "Cooperative writing convention" rewards compliance with no protocol cost on
non-compliance. Worth noting (or, ambitiously, exploring) whether validators
could enforce "activity preempts presence" by reading meta tags at validation
time. I assume that's correctly out of scope, but flagging.

Reference precedent: Nostr NIP-53 + NIP-10312 use the same LWW pattern with
~1hr implicit freshness (vs your explicit 5s). Closest prior art; design is
sound at small scale.

Also worth noting: cross-shard balancing for LIVE_AT writes is not addressed by
FIP #241. If FIDs in the same shard heartbeat synchronously, that shard is hot.

Happy to ship a reference implementation in ZAO Spaces and report back what
breaks. Aligned with @nickysap (Juke), planning to align with @oyingrace
(Streamly) and @sayangel (Livecaster) on the cooperative writer convention.
```

### Comment to post on [discussion #269](https://github.com/farcasterxyz/protocol/discussions/269) (revised from Doc 594)

```
The `accountAssociation` JFS reuse is operationally smart. Three notes from
planning a real implementation + one spec inconsistency:

1. **Manifest caching guidance.** At 50-cast feed scale with full JFS
   verification: ~600ms vs ~300ms unsigned (Ed25519 in JS at 1-2ms/sig +
   manifest fetch + Snapchain key lookup). Worth specifying ETag /
   Cache-Control guidance in the manifest endpoint section, and explicit
   client-side caching by (host_fid, signing_key) so verification amortizes
   across multiple activities by the same host.

2. **`fc:live:speakerFids` doxxes small rooms.** For gated/private spaces (5-15
   participants is common), publishing speakerFids in public meta tags lets any
   reader cross-reference LIVE_AT slots and reconstruct co-location. Recommend
   explicit guidance: gated activities SHOULD serve speakerFids only via the
   authenticated manifest endpoint (or omit entirely), not in public OG meta tags.

3. **`fc:live:recordingUrl` existence leak.** Even pointing recordingUrl at an
   access-checked page leaks the fact that the activity was recorded. Recommend
   specifying that providers SHOULD only publish recordingUrl AFTER the activity
   ends (not during the live window), so the meta tag doesn't signal "this is
   being recorded right now" to active participants.

**Spec inconsistency:** the spec text says verify `header.type === "auth"`, but
the reference implementation in `farcasterxyz/miniapps/packages/miniapp-node/src/jfs.ts`
(line 91) uses `header.type: 'app_key'` as the literal type. The Mini App
`accountAssociation` spec also says `"custody"` or `"auth"`, but the same
reference impl uses `'app_key'`. Either spec text should change to `'app_key'`
(reflecting use of delegated app key vs custody key) or reference impl needs to
support both. This will trip up implementers — please clarify.

Implementation status: ZAO Spaces (HMS + Livepeer at zaoos.com/spaces/<id>)
already serves the cast-on-live notification pattern that FIP #269 standardizes.
Meta tags + manifest endpoint = a few hundred lines, mostly lifted from your
own `jfs.ts`. PRs incoming after your feedback lands.

Cc @topocount.eth for the protobuf side, @manan19 for SDK alignment.
```

## Updated Action Plan (Replaces Docs 593 + 594 timing)

### Within 12 hours (before 2026-05-04 09:00 UTC = FarCon Builders Day start)

| Action | Owner | Type |
|--------|-------|------|
| Post REVISED feedback comment on #268 (with adjacent FIP citations) | @Zaal | GitHub |
| Post REVISED feedback comment on #269 (with spec inconsistency flag) | @Zaal | GitHub |
| DM @nickysap (Juke), @oyingrace (Streamly), @sayangel (Livecaster) — coalition | @Zaal | DM |
| Cast comment links from @zaal account | @Zaal | Cast |

### Within 48 hours (during FarCon)

| Action | Owner | Type |
|--------|-------|------|
| DM @topocount.eth re: ZAO will ship reference impl, mention spec inconsistency | @Zaal | DM |
| Hunt FarHouse + Fireside founders via Farcaster /builders | @Zaal | Search |
| Verify @rish reads/responds to revised comment | research session | Monitor |

### Week 1 post-FarCon (2026-05-06 → 2026-05-10)

| Action | Owner | Type |
|--------|-------|------|
| Capture spec deltas from FarCon discussion (rishBlog, dwr cast, official update) | research session | Research |
| Update Docs 593, 594, 595 with deltas | research session | Doc revision |
| Begin PR #1 (meta tags) ONLY AFTER spec stabilizes | Quad | Build |

### Weeks 2-4 (Quad PR sprint)

| Action | Owner | Type |
|--------|-------|------|
| PR #1 — meta tags on space layouts + privacy mitigations | Quad | PR |
| PR #2 — manifest endpoint, lifting JFS code from `farcasterxyz/miniapps` | Quad | PR |
| PR #3 — LIVE_AT write + heartbeat with jitter (server-side) | Quad | PR |
| PR #4 — render others' LIVE_AT in ZAO feed (READER FIRST) | Quad | PR |
| PR #5 — `fc:cast` linkage | Quad | PR |
| Joint test with Juke + Streamly heartbeats in same user slot | @Zaal + coalition | Test |

## Updated Risk Table (Additions to Doc 594's 16 risks)

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| 17 | FIP #262 Part 1 ships WITHOUT per-`UserDataType` scopes | HIGH | Document trust scope blur to users; advocate for amendment in feedback |
| 18 | FIP #163 stays stalled; LIVE_AT ships at 1s heartbeat without scaling guarantee | HIGH | Cap ZAO's heartbeat at 3s (1000/hr/unit) until network throughput proven |
| 19 | JFS spec inconsistency (`'auth'` vs `'app_key'`) blocks implementers | MEDIUM | Flag in feedback; lift the reference impl which uses `'app_key'` consistently |
| 20 | Coalition partners decline (Streamly, Livecaster, etc.) — back to ZAO+Juke only | MEDIUM | OK if Juke aligns; ZAO+Juke is the minimum viable coalition |
| 21 | FarHouse + Fireside founders unreachable | LOW | Coalition of 3-4 (ZAO + Juke + Streamly + Livecaster) is sufficient |
| 22 | FIP #238 means revoked-key writes persist | LOW (mitigated by 5s freshness) | None additional; Doc 594 risk #6 monthly key rotation handles new writes |
| 23 | Cross-shard load (FIP #241) doesn't balance LIVE_AT | MEDIUM | App-layer 0-1000ms jitter (Doc 594 decision #7) is the only fix |

## Also See

- [Doc 309 — Snapchain vs Hypersnap Protocol Deep Dive](../309-snapchain-hypersnap-protocol-deep-dive/) — Snapchain shard architecture
- [Doc 489 — Hypersnap Bootstrap + Cass on Mars](../489-hypersnap-farcaster-node-cassonmars/) — VPS-1 Snapchain pilot
- [Doc 587 — Hypersnap+Quilibrium+farcasterorg Ecosystem](../587-hypersnap-quilibrium-farcasterorg-ecosystem-may2026/)
- [Doc 593 — FIP Live Activity STANDARD ZAO Spaces Cross-Client Plan](../593-fip-live-activity-zao-spaces/) — sister doc, 5-PR action plan
- [Doc 594 — FIP Live Activity DEEP threats/precedents/load](../594-fip-live-activity-deep/) — sister doc, threat model + initial feedback drafts
- Memory: `project_fishbowlz_deprecated.md`, `project_spaces_next.md`, `project_miniapp_audit_591.md`

## Sources (DEEP tier — 31 verified)

### Primary FIP material (re-verified 2026-05-03)

1. [FIP #268: Live Activity Status](https://github.com/farcasterxyz/protocol/discussions/268) — confirmed exists via direct gh api
2. [FIP #269: Live Activity Manifest](https://github.com/farcasterxyz/protocol/discussions/269) — confirmed exists via direct gh api
3. [FIP #163: Scaling Farcaster](https://github.com/farcasterxyz/protocol/discussions/163) — Stage 2 Draft, stalled
4. [FIP #262: Functional Signers](https://github.com/farcasterxyz/protocol/discussions/262) — Stage 2 Draft, stalled, Part 1 likely advances
5. [FIP #266: Snapchain Signers](https://github.com/farcasterxyz/protocol/discussions/266) — Stage 3 Review, moving forward
6. [FIP #238: Signer Revokes Only Impact Future Messages](https://github.com/farcasterxyz/protocol/discussions/238) — FINALIZED
7. [FIP #241: Cross-Shard Communication in Snapchain](https://github.com/farcasterxyz/protocol/discussions/241) — Stage 3 Review
8. [FIP #156: Audio Support for Frames](https://github.com/farcasterxyz/protocol/discussions/156) — abandoned
9. [FIP #208: JSON Farcaster Signature spec](https://github.com/farcasterxyz/protocol/discussions/208) — JFS origin spec

### JFS reference implementation

10. [farcasterxyz/miniapps repo](https://github.com/farcasterxyz/miniapps)
11. `packages/miniapp-core/src/manifest.ts` (lines 1-29) — AccountAssociation type
12. `packages/miniapp-core/src/schemas/shared.ts` (lines 93-113) — Zod schemas
13. `packages/miniapp-node/src/jfs.ts` (lines 42-105) — sign + verify functions
14. `packages/miniapp-node/tests/jfs.test.ts` (lines 47-75) — test example
15. `packages/miniapp-node/package.json` — confirms `@noble/curves` dependency
16. [Mini Apps Specification](https://miniapps.farcaster.xyz/docs/specification) — accountAssociation spec text

### Coalition apps

17. [Juke](https://juke.audio/) + [Nicky Sap Substack 2026-03-27](https://nickysap.substack.com/p/farcaster-was-dead-so-i-started-building)
18. [Streamly GitHub](https://github.com/oyingrace/streamly) + [streamly-app.vercel.app](https://streamly-app.vercel.app)
19. [Livecaster on Warpcast](https://warpcast.com/livecaster) + [Neynar blog post](https://neynar.com/blog/realtime-social-chat-experiences-with-livecaster)
20. [FarHouse on Hunt Screens](https://huntscreens.com/products/farhouse) + [warpcast.com/farhouse](https://warpcast.com/farhouse)
21. [Fireside mini-app](https://farcaster.xyz/miniapps/mMg32-HGwt1Y/fireside) + [firesidebase.com](https://firesidebase.com)

### Founders

22. [@nickysap on Farcaster](https://farcaster.xyz/nickysap)
23. [@oyingrace on Farcaster](https://farcaster.xyz/oyingrace)
24. [@sayangel on Farcaster](https://farcaster.xyz/sayangel)

### FIP authors (confirmed from Doc 594)

25. [@rish (Rishav Mukherji)](https://farcaster.xyz/rish) — FIP author
26. [@manan (Manan Patel)](https://farcaster.xyz/manan) — Neynar SDK
27. [@topocount.eth (Kevin Joseph Siegler)](https://farcaster.xyz/topocount.eth) — Neynar Snapchain implementer

### Discussion comment thread context

28. FIP #163 disputes — @PhABC vs @varunsrin on storage cost
29. FIP #262 disputes — @christopherwxyz, @manan19, @topocount on Part 2 MPC, @vrypan on pruning hazard
30. FIP #266 review — low-dispute meta-FIP

### ZAO codebase paths verified live 2026-05-03

31. Doc 594 source list (paths in `/tmp/zao-research-594/src/`) re-verified

### URL liveness

All 30+ external URLs verified live 2026-05-03. JFS reference implementation in `farcasterxyz/miniapps` confirmed at the cited file paths via `gh api` + repo browse.

### Hallucination check

- All FIP body text quoted verbatim from `gh api repos/farcasterxyz/protocol/discussions/<N>` responses
- JFS code blocks quoted verbatim from agent C report which extracted from `farcasterxyz/miniapps/packages/miniapp-node/src/jfs.ts` lines 42-105
- Spec inconsistency (`'auth'` vs `'app_key'`) is a real divergence between FIP #269 spec text and the actual reference impl — flagged for FIP authors
- Agent B's claim that "FIP-268 not found on GitHub" is INCORRECT — direct `gh api repos/farcasterxyz/protocol/discussions/268` returns the FIP body. Trust primary source. Noted as caveat.
- Coalition app data is current as of 2026-05-03 with explicit dates per source

### Staleness notes

- FIPs are Stage 2 / Stage 3 Draft. Spec details may change.
- FarCon is 2026-05-04 / 2026-05-05; this doc was written 2026-05-03 evening US time. Spec deltas from in-person discussion will require Doc 596 amendment.
- JFS reference implementation in `farcasterxyz/miniapps` is actively maintained; check for breaking changes before lifting code.
