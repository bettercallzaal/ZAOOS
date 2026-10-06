---
topic: agents
type: discovery-and-audit
status: research-complete
last-validated: 2026-10-06
superseded-by:
related-docs: "882, 2030, 2145, 2148, 2176, 2184, 2551"
original-query: "Brandon Ducar (DreamNet) ZAAL x DREAMNET PROTOCOL HARDENING - Phase 0 Discovery and Integration Map"
tier: DEEP
---

# 2621 - Zaal x DreamNet Protocol Hardening: Phase 0 Discovery and Integration Map

> **Spec Source and Attribution:** Brandon Ducar / DreamNet (github.com/BrandonDucar).
>
> **Goal:** Execute Phase 0 discovery across the Zaal ecosystem to integrate DreamNet protocol-hardening capabilities into existing Zaal architecture without replacing working systems or creating unnecessary parallel infrastructure. Produce the complete integration map (`EXISTING COMPONENT -> GAP -> PROPOSED HARDENING -> FILES/SERVICES AFFECTED`) and stop for review by Brandon Ducar and Zaal Panthaki before any implementation.

> **CORRECTIONS 2026-10-06 (dreamnet lane).** Every claim in this doc was re-checked against the code, and the full check is in `research/agents/2622-dreamnet-hardening-phase0-ground-truth-and-verification/` (section 13). Twelve claims were confirmed. The text below is left as it was written, and these corrections apply to it:
>
> 1. **Neynar webhooks have no `signer.added` or `signer.revoked` events.** The subscribable types are `cast.created`/`deleted`, `follow.created`/`deleted`, `reaction.created`/`deleted`, `trade.created` and `user.created`/`updated` (raw fetch of `docs.neynar.com/reference/publish-webhook.md`). Map row 1 and grill question 1 are wrong on signer events. Revocation has to be detected another way: polling signer status (`src/lib/farcaster/neynar.ts:261`) or on-chain key events. `cast.deleted` is real.
> 2. **Juke recap retries do not double-cast.** The Juke route records each event and drops replays by signature hash before any handler runs (`src/app/api/juke/webhooks/route.ts:62-79`). The smaller real risk is that `room.finished` and `room.ended` share one recap branch.
> 3. **Sparkz auth is server-side and fails closed.** Writes are gated on a `SPARKZ_ADMIN_TOKEN` cookie (`bettercallzaal/sparkz src/lib/auth.ts`). There are no client-side session checks. The local path cited, `/Users/zaalpanthaki/zao-workspace/repos/sparkz`, is a symlink to a directory that does not exist.
> 4. **`src/lib/agents/control-plane.ts` is types only.** Its only importer is its own test. The receipts that actually run are `bot/src/zoe/receipts.ts` on `scripts/1410-agent-control-plane.sql`.
> 5. **Attribution.** "Zaal rule 1-4" means *rules Zaal set for this mission, drafted by the orchestrator seat and sent by Zaal on 2026-10-06*. "Sparkz is paused" comes from Gemini's third-person paraphrase of Zaal on the 2026-10-05 Arun call (vault `meetings/2026-10-05-zaal-x-arun-gemini-notes.md`, line 46). Per that note, the dedicated infrastructure is paused and the core concept is not.
> 6. **Missed.** The user-signer path, which is FC-EVAL-001's central case: it is checked once and then only for presence in a 7-day cookie. Also missed: the existing `EventEnvelope` in `src/lib/ears/types.ts:19-31`, which should be extended instead of adding `src/lib/farcaster/envelope.ts`; Spore's `RevocationResolver` and the unread `revocationRef`; and the Bonfire memory stores.
> 7. **Number.** 2621 had already been reserved by another lane (`refs/tags/doc-2621`, 16:43Z). This doc keeps the number now that it is merged, and the other doc moved to 2622.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **PHASE 0 ONLY FIRST: Stop for review before implementation.** | Zaal rule 1: Brandon and Zaal must review and align on the integration map and architectural boundaries before any code changes or migrations are made. |
| 2 | **Map ZAOscout as the scout target: FarScout is retired.** | Zaal rule 2 and research doc 882 (`research/agents/882-zaoscout-audit-and-roadmap/README.md:14-24`): FarScout was superseded by `ZAODEVZ/ZAOscout`. ZAOscout runs a keyless Haatz mirror (`bin/scout-farcaster`), which currently lacks cryptographic signer keys and authority gating. |
| 3 | **Map Sparkz integration, but freeze build: Sparkz is paused.** | Zaal rule 2: Sparkz creator-token infrastructure is paused. The integration map details creator auth and server-side verification, but no active code or migration will be built on it in this phase. |
| 4 | **Reuse existing primitives: do not invent parallel infrastructure.** | Zaal rule 3: ZAOOS already implements receipts and agent runs (`src/lib/agents/control-plane.ts:19-131`), the transactional outbox (`scripts/2148-transactional-outbox.sql:29-53`), `DurableEffectLedger` (`packages/heart-fleet/src/durable-effect-ledger.ts:1-80`), and Spore proof drops (`src/lib/dreamnet/proof-drop/proof-drop.ts:1-90`). |
| 5 | **Separate historical truth from current authority (prevent ghost memory).** | Core DreamNet principle: content existing historically does not make it currently valid, retrievable, authorized, or safe. Revocation invalidates downstream retrieval eligibility without destroying historical audit provenance. |
| 6 | **Feature flags default OFF with rollback paths for all migrations.** | Zaal rule 4: All proposed hardening mechanisms must sit behind feature flags that default to OFF. Zero destructive migrations; every database change requires explicit sign-off from Zaal. |

---

## Executive Summary and Core Principle

The mission defined by Brandon Ducar (DreamNet) addresses a critical failure mode in decentralized agent and social systems: **the conflation of historical existence with current operational authority.**

When an identity, signer, or credential is compromised or revoked, naive systems either:
1. Erase records destructively, destroying audit history, provenance, and thread integrity; or
2. Allow stale caches, vector databases, search indices, and autonomous agents to continue citing revoked content as operational truth ("ghost memory").

To eliminate this vulnerability across the Zaal ecosystem, the protocol enforces strict separation across seven distinct layers:
1. **CONTENT:** The immutable payload of what was said or posted (text, media, embed hashes).
2. **IDENTITY:** The durable entity (Farcaster FID, ENS, ZID, wallet address).
3. **SIGNER:** The cryptographic keypair or credential instance authorized to produce messages for an identity.
4. **AUTHORITY:** The temporal validity status of a signer or statement (valid, revoked, expired, quarantined).
5. **MEMORY:** Working, episodic, or persistent storage holding observations for future context.
6. **DERIVED STATE:** Summaries, embeddings, indices, and permission claims calculated from observations.
7. **PROVENANCE:** The tamper-evident trace linking derived state back to the original event, signer, and verification receipt.

```
+-----------------------------------------------------------------------------------+
|                            CANONICAL EVENT PIPELINE                               |
|                                                                                   |
|  [ Inbound Event ] (Neynar Webhook / Haatz / Hub / Internal Agent Action)         |
|         |                                                                         |
|         v                                                                         |
|  [ Canonical Event Envelope ] (dreamnet.farcaster.v1 / assignment.v1)             |
|         |                                                                         |
|         v                                                                         |
|  [ Authority Resolution Gate ] (Validates Signer Status: Active / Revoked)        |
|         |                                                                         |
|         +---> If Revoked: Invalidate retrieval eligibility; preserve provenance   |
|         |                                                                         |
|         v (If Active)                                                             |
|  [ Transactional Outbox (effect_intents) ] (Durable idempotent claim lock)        |
|         |                                                                         |
|         v                                                                         |
|  [ Application Projections ] (Feeds, Memory Layers, Channels, Bots)               |
|         |                                                                         |
|         v                                                                         |
|  [ Afferent Receipt Loop ] (ProofDropV1 / emitReceipt -> receipts table)          |
+-----------------------------------------------------------------------------------+
```

---

## Integration Map

The following map cross-references every component in the Zaal ecosystem against Brandon Ducar's protocol-hardening specification. Every claim of existing code or missing functionality is cited with exact `file:line` references.

| Existing Component | Gap | Proposed Hardening | Files / Services Affected |
|---|---|---|---|
| **1. Farcaster Webhook Ingestion** (`src/app/api/webhooks/neynar/route.ts:51-140`) | `route.ts:79-82` drops all events where `payload.type !== 'cast.created'`, ignoring `cast.deleted`, `signer.added`, `signer.revoked`, and `identity.updated`. `route.ts:26-49` (`castToRow`) does not store `signer_uuid`, signer public key, content digest, or schema version. Direct write to `channel_casts` (`route.ts:98`) has no causal checkpointing or event replay protection. | Normalize inbound payloads into a typed `FarcasterEventEnvelope` (`dreamnet.farcaster.v1`). Ingest and handle lifecycle events (`cast.created`, `cast.deleted`, `signer.revoked`). Persist event provenance and monotonic sequence numbers. Flag-gated behind `FARCASTER_CANONICAL_ENVELOPE_ENABLED`. | `src/app/api/webhooks/neynar/route.ts:51-140`<br>`src/lib/farcaster/envelope.ts` (new)<br>`src/lib/farcaster/neynar.ts:1-78` |
| **2. Signer Authority Resolution Gate** (Missing central layer; scattered in `src/lib/farcaster/neynar.ts:80-120` and `src/app/api/publish/farcaster/route.ts:26-28`) | Signer handling is ad-hoc: applications supply `signer_uuid` directly to `postCast` (`src/lib/farcaster/neynar.ts:80-94`) with zero verification of whether the signer is currently active, expired, or revoked. No shared authority cache exists. Revocation of a signer leaves previously ingested casts fully visible in feed queries and agent prompts. | Implement `AuthorityResolver` service (`src/lib/farcaster/authority.ts`). Caches signer status from Neynar with fail-closed TTL. Exposes `isSignerAuthoritative(fid, signerId, timestamp)`. Gated retrieval layer ensures revoked signer casts remain in historical tables for provenance but are excluded from active feed/read queries. | `src/lib/farcaster/authority.ts` (new)<br>`src/lib/farcaster/neynar.ts:80-120`<br>`src/app/api/publish/farcaster/route.ts:26-28`<br>`src/lib/publish/auto-cast.ts:22-58` |
| **3. ZAOscout Memory Architecture (Target 1, superseding FarScout)** (`ZAODEVZ/ZAOscout`, doc 882) | FarScout is retired (`research/agents/882-zaoscout-audit-and-roadmap/README.md:14-24`). ZAOscout uses the keyless Haatz mirror (`bin/scout-farcaster:1-60`), which returns public cast JSON without signer UUIDs or cryptographic signatures. Memory in `scout/memory.js:1-50` and `scout/state.js:1-40` consists of unauthenticated flat JSON files (`state/seen.json`, `state/memory.json`) and markdown briefs without provenance envelopes or revocation gates. | Map ZAOscout as the scout target. Add an optional authenticated Farcaster ingestion mode via Neynar/Hubs for environments requiring signer authority tracking, while keeping keyless Haatz as fallback. Wrap remembered entries in a provenance envelope containing `(fid, signer_id, cast_hash, ingested_at, authority_status)`. Add a retrieval validity check to `scout/memory.js` so revoked signer content is excluded from daily briefs. | `ZAODEVZ/ZAOscout` (`scout/memory.js`, `scout/watch.js`, `bin/scout-farcaster`)<br>`research/agents/882-zaoscout-audit-and-roadmap/README.md:14-24` |
| **4. ZAOS Memory and Trust Gate (Target 2)** (`src/lib/memory/types.ts:1-89`, `src/lib/memory/memory.ts:22-78`) | `MemoryRecord` (`src/lib/memory/types.ts:36-50`) stores `(id, kind, subjectKey, contentHash, observedAt, storedAt, source, payload)` but lacks `fid`, `signerId`, and `authorityStatus`. `Memory.recall()` (`src/lib/memory/memory.ts:54-58`) returns raw records without authority verification. Line 11 notes that vector memory is "not yet implemented". | Extend `MemoryRecord` to include optional `provenance: { fid, signerId, authorityStatus, eventId }`. Introduce an authority filter in `Memory.recall()` that cross-checks current signer status before returning memories to agents. Add tombstoning for derived summaries when underlying observations lose authority. | `src/lib/memory/types.ts:36-50`<br>`src/lib/memory/memory.ts:33-58`<br>`src/lib/memory/working-memory.ts:1-70`<br>`src/lib/memory/episodic-memory.ts:1-60` |
| **5. Sparkz Creator Auth and Publishing (Target 3, PAUSED)** (`bettercallzaal/sparkz`, docs 2144, 2197, 2238) | Sparkz infrastructure is paused per Zaal rule 2. In the existing repo (`/Users/zaalpanthaki/zao-workspace/repos/sparkz`), creator token launches and social publishing rely on client-side session checks without server-side cryptographic signer verification or durable outbox ledgering. | Design the hardening path for when Sparkz unpauses: enforce server-side Neynar signer validation before mint/publish, record publication intents in `effect_intents`, and produce verifiable `Receipt` records with `(creator_fid, signer_id, timestamp, scope)`. Keep in paused state; do not execute code changes. | `/Users/zaalpanthaki/zao-workspace/repos/sparkz`<br>`research/music/2197-web3-music-monetization-post-mortem/README.md`<br>`research/security/2144-fleet-repo-audit-jul30/README.md` |
| **6. Zabalbot / Recaps Causal Event Ingestion (Target 4)** (`src/lib/spaces/jukeWebhookHandlers.ts:70-120`, `src/lib/publish/auto-cast.ts:22-58`) | Space recap publishing via `autoCastToZao` (`src/lib/publish/auto-cast.ts:22-58`) is fire-and-forget. It does not enforce idempotency, does not route through the transactional outbox (`scripts/2148-transactional-outbox.sql:29-53`), does not emit a `Receipt`, and does not track causal room event IDs. Webhook retries can cause duplicate public recap casts. | Wire recap publishing through `DurableEffectLedger` (`packages/heart-fleet/src/durable-effect-ledger.ts:1-80`) with deterministic key `recap:${spaceId}:${channel}`. Enforce monotonic checkpoints and deduplication. Emit machine-readable `Receipt` (`src/lib/agents/control-plane.ts:119-131`). | `src/lib/publish/auto-cast.ts:22-58`<br>`src/lib/spaces/jukeWebhookHandlers.ts:70-120`<br>`packages/heart-fleet/src/durable-effect-ledger.ts:1-80` |
| **7. Durable Outbox and Effect Ledger** (`scripts/2148-transactional-outbox.sql:29-53`, `packages/heart-fleet/src/durable-effect-ledger.ts:1-80`) | `effect_intents` table and `DurableEffectLedger` are fully implemented in the repo, but the outbox pattern is only active in ZOE canary tests (`bot/src/zoe/heart-canary.ts:42-112`). Web publishing routes (`src/app/api/publish/farcaster/route.ts:108-150`) bypass the outbox and call Neynar directly. | Expand outbox coverage to all external Farcaster mutations. Use `claimIntent -> markDispatched -> postCast -> markCommitted` sequence to guarantee at-most-once delivery across crashes and network timeouts. Gated behind `DURABLE_OUTBOX_MUTATIONS_ENABLED`. | `scripts/2148-transactional-outbox.sql:29-53`<br>`packages/heart-fleet/src/durable-effect-ledger.ts:1-80`<br>`src/app/api/publish/farcaster/route.ts:108-150` |
| **8. Machine-Readable Receipts and Afferent Loop** (`src/lib/agents/control-plane.ts:119-131`, `bot/src/zoe/receipts.ts:1-188`, `bot/src/zoe/afferent-digest.ts:1-60`) | `Receipt` interface exists (`src/lib/agents/control-plane.ts:119-131`) and `emitReceipt` exists in `bot/src/zoe/receipts.ts:99-135`. However, `emitReceipt` is fire-and-forget with swallowed errors (`receipts.ts:8-10`). It is called in only 6 places across the codebase. Farcaster webhook processing and publish routes emit zero receipts. The afferent digest (`afferent-digest.ts:1-60`) runs nightly but is blind to authority invalidations. | Update `emitReceipt` to populate `content_sha256` and `dreamnet_envelope` per `scripts/2030-dreamnet-receipt-envelope.sql:21-27`. Emit receipts on every authority decision (signer revocation, content invalidation, recap dispatch). Trigger immediate afferent cache reconciliation when an invalidation receipt is recorded. | `src/lib/agents/control-plane.ts:119-131`<br>`bot/src/zoe/receipts.ts:1-188`<br>`bot/src/zoe/afferent-digest.ts:1-60`<br>`scripts/2030-dreamnet-receipt-envelope.sql:1-60` |
| **9. Spore Conformance and Proof Drops** (`src/lib/dreamnet/proof-drop/proof-drop.ts:1-90`, `src/lib/dreamnet/tenant/conformance.ts:1-60`) | `ProofDropV1` is fully implemented with deterministic hashing (`dreamnet-sorted-json:v0` + sha256), but is flag-gated OFF (`isProofDropsEnabled()` in `proof-drop.ts:22-24`). It is not connected to Farcaster moderation or signer revocation events. | Anchor authority invalidations to `ProofDropV1`: when a signer is revoked or a cast is flagged, create an immutable Proof Drop anchoring the claim to the signed webhook or Hub event evidence. Retain proof drops in cold storage for cryptographic auditability. | `src/lib/dreamnet/proof-drop/proof-drop.ts:1-90`<br>`src/lib/dreamnet/tenant/conformance.ts:1-60`<br>`src/app/api/webhooks/neynar/route.ts:104-140` |
| **10. Adversarial Evaluation Harness (FC-EVAL-001)** (Missing e2e test suite) | No automated test exists to verify that signer revocation causes instant downstream retrieval invalidation while preserving historical provenance without ghost memory citations. | Implement `FC-EVAL-001` test suite in `src/lib/farcaster/__tests__/fc-eval-001-revocation.test.ts`. Tests full lifecycle: User U -> Signer A -> Casts ingested -> Signer A revoked -> Verify retrieval ineligible, ghost citations = 0, thread reconciled -> Resubmit under Signer B -> Verify accepted with distinct provenance. | `src/lib/farcaster/__tests__/fc-eval-001-revocation.test.ts` (new)<br>`src/lib/farcaster/authority.ts` (new) |

---

## Detailed Discovery Findings

### 1. Farcaster Ingestion Pipeline

**Current Architecture:**
- Reads: `src/lib/farcaster/neynar.ts:3-78` routes read requests through the free Hypersnap proxy (`ENV.FARCASTER_READ_API_BASE`), falling back to Neynar API (`NEYNAR_BASE = 'https://api.neynar.com/v2/farcaster'`).
- Webhook Ingestion: `src/app/api/webhooks/neynar/route.ts:51-78` verifies incoming requests using HMAC-SHA512 with `ENV.NEYNAR_WEBHOOK_SECRET`.
- Storage: Rows are upserted into `channel_casts` via Supabase admin (`route.ts:98`).

**Measured Vulnerabilities:**
1. Event Filter Blindness: Line 80 of `route.ts` executes `if (payload.type !== 'cast.created') return NextResponse.json({ ok: true });`. Any event indicating a cast deletion (`cast.deleted`), a signer addition (`signer.added`), or a signer revocation (`signer.revoked`) is silently discarded.
2. Missing Signer Provenance: `castToRow` (`route.ts:26-49`) extracts author metadata (`fid, username, display_name, pfp_url`), text, timestamp, embeds, reactions, and replies count, but completely omits `signer_uuid` or signer public key. Once written to `channel_casts`, it is impossible to determine which signer authorized the cast without querying Neynar again.
3. Fire-and-Forget Moderation: Lines 106-139 execute AI content moderation asynchronously without blocking or awaiting database commits. If the process crashes during moderation, the cast remains unmoderated and no failure receipt is logged.

### 2. Signer and Authority Handling

**Current Architecture:**
- Publishing: `src/lib/farcaster/neynar.ts:80-120` (`postCast`) sends a POST request to `/cast` with `signer_uuid`, `text`, and `channel_id`.
- Official Posting: `src/app/api/publish/farcaster/route.ts:26-28` reads `ENV.ZAO_OFFICIAL_SIGNER_UUID` and `ENV.ZAO_OFFICIAL_FID`.
- Automated Posting: `src/lib/publish/auto-cast.ts:23-28` reads `process.env.ZAO_OFFICIAL_SIGNER_UUID` and `process.env.ZAO_OFFICIAL_NEYNAR_API_KEY`.

**Measured Vulnerabilities:**
1. Zero Pre-flight Signer Validation: Neither `postCast` nor `autoCastToZao` verifies whether the configured `signer_uuid` is active or revoked prior to dispatching messages.
2. Missing Authority Status in Read Views: When querying `channel_casts` in chat, feed, or agent retrieval views, queries check only channel or author filters. There is no filter for whether the signer that authorized the cast has since been revoked.
3. Conflation of Historical Proof and Current Authority: The system lacks a distinction between:
   - Historical Truth: "Cast 0x123 was published at timestamp T0 signed by Key A."
   - Current Truth: "Key A was revoked at timestamp T1; Cast 0x123 must not be returned in search results, agent context, or governance feeds."

### 3. Target 1: ZAOscout (Superseding Retired FarScout)

**Current Architecture:**
- As documented in research doc 882 (`research/agents/882-zaoscout-audit-and-roadmap/README.md:14-24`), FarScout was retired and superseded by `ZAODEVZ/ZAOscout`.
- ZAOscout provides a keyless social research scout using a keyless fetch trio:
  - Reddit via Redlib (`bin/scout-reddit`)
  - X/Twitter via FxTwitter (`bin/scout-x`)
  - Farcaster via Haatz mirror (`bin/scout-farcaster`)
- Memory and State: Managed via `scout/memory.js` and `scout/state.js`, persisting simple JSON files (`state/seen.json`, `state/memory.json`) and markdown briefs (`state/feed.md`).

**Gap Analysis Against Brandon's Requirements:**
Brandon's specification designates FarScout as the primary target for revoke-safe memory:
- Put the authority/provenance gate between ingestion and memory/retrieval.
- Memory objects retain provenance: FID, signer, cast/event, authority state.
- On signer revocation:
  1. Affected casts become retrieval-ineligible immediately.
  2. Stale cached results cannot bypass the gate.
  3. Related thread state reconciles.
  4. Derived summaries are marked stale or recomputed.
  5. Vector records are invalidated or tombstoned.
  6. Permissions derived from invalid data are reevaluated.
  7. Audit history remains available.

**What ZAOscout Currently Lacks:**
1. Keyless Haatz Mirror Limitation: `bin/scout-farcaster` reads public casts from Haatz without API keys or authentication. Haatz responses do not include signer UUIDs, signer public keys, or signer approval status.
2. Unauthenticated Memory Objects: `state/memory.json` stores basic post content and timestamps without cryptographic signer identifiers or authority status fields.
3. No Retrieval Filter: `scout/digest.js` and `scout/watch.js` read memory without verifying current signer authority.

**Proposed Hardening for ZAOscout:**
1. Dual-Mode Farcaster Ingestion: Introduce an authenticated ingestion mode using Neynar or a Hub when ZAOscout runs in hardened environments, preserving keyless Haatz as a zero-config fallback.
2. Provenance Memory Wrapper: Upgrade memory records in `scout/memory.js` to store `(fid, signer_id, cast_hash, ingested_at, authority_status)`.
3. Digest Filtering: Ensure the synthesis engine (`scout/brain.js`) filters out any item whose signer has been marked revoked before generating briefs.

### 4. Target 2: ZAOS Trust Gate & Memory Subsystem

**Current Architecture:**
- Memory Core: `src/lib/memory/types.ts:1-89` defines the layered memory organ (`working`, `episodic`, `semantic`, `vector`, `receipt`, `archive`, `swarm`, `organism-state`).
- Working Memory: `src/lib/memory/working-memory.ts:1-70` stores bounded in-memory items with TTL.
- Episodic Memory: `src/lib/memory/episodic-memory.ts:1-60` stores an ordered log of events.
- Observation Mapping: `src/lib/memory/memory.ts:33-44` maps an `Observation` to a `MemoryRecord`.

**Measured Gaps:**
1. `MemoryRecord` Definition (`src/lib/memory/types.ts:36-50`):
   ```typescript
   export interface MemoryRecord {
     id: string;
     kind: string;
     subjectKey: string;
     contentHash: string;
     observedAt: string | null;
     storedAt: string;
     source: string;
     payload: unknown;
   }
   ```
   Lacks `fid`, `signerId`, and `authorityStatus`.
2. Unfiltered Recall: `Memory.recall()` (`src/lib/memory/memory.ts:54-58`) returns matching records directly from layers without checking if the underlying signer is revoked.
3. Vector Layer Inactive: Line 11 of `src/lib/memory/types.ts` notes `vector - embeddings for similarity recall (not yet implemented)`. Vector stores are not yet running in core ZAOOS (Hindsight vector memory was evaluated in doc 2599 as an MCP server for ZOE/ZOL).

**Proposed Hardening for ZAOS:**
1. Attach `provenance` metadata to `MemoryRecord`.
2. Add an authority gate to `Memory.recall()`: when querying records of kind `farcaster_cast`, the gate verifies signer status and suppresses revoked items from agent prompt injection.
3. When an invalidation event is received, emit an invalidation receipt and mark derived summaries as stale.

### 5. Target 3: Sparkz Creator Auth / Publishing (PAUSED)

**Current Status:**
- User rule 2 mandates: "Sparkz infrastructure is paused, so map it but do not build on it yet."
- The Sparkz repo lives at `/Users/zaalpanthaki/zao-workspace/repos/sparkz` and is referenced across multiple research docs (`research/security/2144-fleet-repo-audit-jul30/README.md`, `research/music/2197-web3-music-monetization-post-mortem/README.md`).

**Mapped Integration Architecture (For Post-Pause Activation):**
1. Server-side Signer Authentication: Replace client-only session verification with server-side validation against Neynar/Hubs to verify that the creator's signer is active and authorized for the specified FID.
2. Publishing Outbox: Route creator announcements and token launcher broadcasts through `DurableEffectLedger` (`effect_intents`), ensuring at-most-once publishing.
3. Receipt Logging: Emit a `Receipt` on every creator token deployment and broadcast action recording:
   - `creator_fid`
   - `signer_id`
   - `timestamp`
   - `scope_granted`
   - `contract_or_cast_hash`

### 6. Target 4: Zabalbot / Recaps Causal Event Ingestion

**Current Architecture:**
- Juke / LiveKit Spaces Integration: `src/lib/spaces/jukeWebhookHandlers.ts:70-120` listens for space wrap-up events (`room.finished`).
- Auto-Cast Helper: `src/lib/publish/auto-cast.ts:22-58` publishes recap casts to the `/zao` channel via `@thezao` official account.

**Measured Gaps:**
1. No Idempotency or Deduplication: `autoCastToZao` (`src/lib/publish/auto-cast.ts:22-58`) receives raw `(text, embedUrl)` and calls `postCast` directly. If the Juke webhook fires twice or retries after a network blip, duplicate recap casts are posted to the public channel.
2. Missing Causal Tracking: Webhook handlers do not record monotonic sequence numbers or causal predecessor IDs.
3. Zero Receipts: Recap casts produce console logs (`logger.info`) but emit no machine-readable `Receipt` or `ProofDrop`.

**Proposed Hardening for Recaps:**
1. Connect `autoCastToZao` to `DurableEffectLedger` (`packages/heart-fleet/src/durable-effect-ledger.ts:1-80`).
2. Use deterministic effect keys: `effect_key = `recap:${spaceId}:${channelId}``.
3. Monotonic Checkpointing: Verify that `room.finished` has not already been processed for the specified `spaceId`.
4. Emit a formal `Receipt` (`src/lib/agents/control-plane.ts:119-131`) capturing the recap hash, input audio/transcript digest, and posting timestamp.

---

## Primitives to Reuse

Rather than building redundant parallel infrastructure, the protocol hardening will build directly on existing, battle-tested primitives in ZAOOS:

```
+-----------------------------------------------------------------------------------------+
|                              REUSABLE PRIMITIVES INVENTORY                              |
|                                                                                         |
|  1. Control Plane Types & Envelopes                                                     |
|     src/lib/agents/control-plane.ts:19-66   -> AssignmentEnvelope                       |
|     src/lib/agents/control-plane.ts:87-112  -> AgentRun                                 |
|     src/lib/agents/control-plane.ts:119-131 -> Receipt                                  |
|                                                                                         |
|  2. Transactional Outbox & Durable Effect Ledger                                        |
|     scripts/2148-transactional-outbox.sql:29-53              -> effect_intents Table    |
|     packages/heart-fleet/src/durable-effect-ledger.ts:1-80    -> DurableEffectLedger    |
|                                                                                         |
|  3. Spore Conformance & Proof Drops                                                     |
|     src/lib/dreamnet/proof-drop/proof-drop.ts:1-90            -> ProofDropV1 Structure  |
|     src/lib/dreamnet/tenant/conformance.ts:1-60              -> Conformance Engine     |
|                                                                                         |
|  4. Receipt Emitter & Afferent Digest Loop                                              |
|     bot/src/zoe/receipts.ts:1-188                             -> emitReceipt / Batch    |
|     bot/src/zoe/afferent-digest.ts:1-60                       -> Afferent Digest Bridge |
+-----------------------------------------------------------------------------------------+
```

1. **Receipts and Agent Runs (`src/lib/agents/control-plane.ts`):**
   - `AssignmentEnvelope` (`control-plane.ts:19-66`): Standard work directive schema with idempotency keys, budget limits, approval policies, and required capabilities.
   - `AgentRun` (`control-plane.ts:87-112`): Complete run lifecycle with status transitions (`created`, `ready`, `leased`, `running`, `waiting_approval`, `blocked`, `verifying`, `recovering`, `completed`, `failed`, `cancelled`, `quarantined`).
   - `Receipt` (`control-plane.ts:119-131`): Pure schema for machine-readable evidence indexing `(id, runId, agentIdentity, capability, tool, action, inputDigest, resultType, approvalClass, evidenceUrl, createdAt)`.

2. **Durable Effect Ledger (`packages/heart-fleet/src/durable-effect-ledger.ts` and `scripts/2148-transactional-outbox.sql`):**
   - `effect_intents` table (`scripts/2148-transactional-outbox.sql:29-53`): Primary key `(run_id, effect_key)` provides crash-safe at-most-once execution locks using atomic `INSERT ... ON CONFLICT DO NOTHING`.
   - `DurableEffectLedger` (`packages/heart-fleet/src/durable-effect-ledger.ts:62-218`): Implements `claimIntent -> markDispatched -> markCommitted` protocol across distributed agent workers.

3. **Proof Drops and Conformance (`src/lib/dreamnet/`):**
   - `ProofDropV1` (`src/lib/dreamnet/proof-drop/proof-drop.ts:34-50`): Cryptographic evidence anchoring with `dreamnet-sorted-json:v0` canonicalization and sha256 hashing.
   - Tenant Conformance (`src/lib/dreamnet/tenant/conformance.ts:1-60`): Reusable stage-0 conformance verification engine validating namespace isolation, sovereignty manifests, and boundary matrices.

4. **Receipt Emitter and Afferent Loop (`bot/src/zoe/`):**
   - `emitReceipt` (`bot/src/zoe/receipts.ts:99-135`): Standard receipt emission into Postgres.
   - Afferent Digest (`bot/src/zoe/afferent-digest.ts:1-60`): Nightly bridge converting receipts into durable memory records.

---

## Adversarial Evaluation Plan: FC-EVAL-001

To ensure protocol correctness without relying on unvalidated assumptions, the implementation phase will introduce the `FC-EVAL-001` adversarial evaluation suite in `src/lib/farcaster/__tests__/fc-eval-001-revocation.test.ts`.

### Test Sequence

```
[ Step 1: Identity Setup ]      Establish user U with FID 99999.
                                     |
[ Step 2: Signer A Authorized ] Authorize Signer Key A for User U.
                                     |
[ Step 3: Ingestion under A ]   Submit 4 casts under Signer A:
                                - Cast C1: Standalone root post.
                                - Cast C2: Thread parent post.
                                - Cast C3: Reply to C2.
                                - Cast C4: High-engagement post ingested into agent memory and daily digest.
                                     |
[ Step 4: Verification 1 ]      Assert all 4 casts appear in:
                                - Active channel feed query.
                                - Memory recall.
                                - Thread tree representation.
                                - Derived summary context.
                                     |
[ Step 5: Signer A Revoked ]    Emit SIGNER_REVOKED event for Signer A.
                                     |
[ Step 6: Verification 2 ]      Assert immediate invalidation:
                                - C1, C2, C3, C4 become RETRIEVAL-INELIGIBLE in feeds.
                                - Memory recall returns ZERO citations from Signer A.
                                - Cache reads cannot resurrect C1-C4.
                                - Thread state reconciles (no dangling broken tree nodes).
                                - Derived summaries are flagged as stale or recomputed.
                                - Historical audit log retains C1-C4 records marked as revoked.
                                - Signer A has ZERO current authority.
                                     |
[ Step 7: Resubmission under B] Authorize Signer Key B for User U.
                                Resubmit identical text payload for C1 under Signer B (yielding Cast C1_B).
                                     |
[ Step 8: Final Verification ]  Assert:
                                - C1_B is accepted as currently authoritative.
                                - Signer B has distinct provenance and authority.
                                - Signer A is NOT resurrected.
                                - User U identity does not fork.
                                - Ghost citations from Signer A remain ZERO.
```

### Measured Failure Injection Scenarios
The evaluation will also subject the pipeline to edge cases:
1. Duplicate Webhooks: Replaying the identical `cast.created` event 10 times results in exactly 1 persisted row and 0 duplicate outbound side-effects.
2. Out-of-Order Delivery: Delivering `signer.revoked` before `cast.created` results in the cast being immediately stored in `revoked` state without ever becoming retrieval-eligible.
3. Mid-Flight Crash: Injecting a simulated process kill after `claimIntent` but before `markCommitted` in the outbox allows the reconciler to safely resume without duplicate casts.

---

## Phase 1 Implementation Plan (Proposed Post-Review)

*Note: In accordance with Zaal rule 1, no implementation from this plan will begin until Brandon and Zaal provide explicit approval.*

1. **Step 1: Canonical Farcaster Event Envelope Schema**
   - Create `src/lib/farcaster/envelope.ts` defining `FarcasterEventEnvelope` (`dreamnet.farcaster.v1`).
   - Define event types: `CAST_CREATED`, `CAST_DELETED`, `SIGNER_ADDED`, `SIGNER_REVOKED`, `IDENTITY_UPDATED`.
   - Add unit tests validating schema parsing and canonicalization.

2. **Step 2: Signer Authority Resolution Service**
   - Create `src/lib/farcaster/authority.ts` with in-memory TTL caching and offline-safe fallback.
   - Implement `isSignerAuthoritative(fid, signerId)`.
   - Feature flag: `process.env.FARCASTER_AUTHORITY_GATE_ENABLED = 'false'` (default OFF).

3. **Step 3: Webhook Route Upgrade**
   - Update `src/app/api/webhooks/neynar/route.ts` to ingest all lifecycle events under the feature flag.
   - Store `signer_id` and `authority_status` on ingested records.

4. **Step 4: Outbox Integration for Publishing**
   - Wrap `autoCastToZao` and `src/app/api/publish/farcaster/route.ts` with `DurableEffectLedger`.
   - Guarantee idempotent, crash-safe dispatch.

5. **Step 5: ZAOscout Memory Adaptation**
   - Propose PR to `ZAODEVZ/ZAOscout` adding optional signer metadata tracking and digest authority filtering.

6. **Step 6: FC-EVAL-001 Automated Test Suite**
   - Add `src/lib/farcaster/__tests__/fc-eval-001-revocation.test.ts` executing the complete adversarial lifecycle.

---

## Rules of Engagement and Operational Constraints

1. **PHASE 0 ONLY:** All work stops at this integration map. No implementation code or migrations will be executed prior to joint review.
2. **Feature Flags Default OFF:** Any newly introduced routes, envelopes, or authority checks must default to OFF.
3. **No Unapproved Migrations:** No Supabase schema changes will be applied without explicit confirmation from Zaal and a documented rollback script.
4. **Shared Workspace Isolation:** Orca terminals and other agent workspaces remain untouched (`no orca terminal send`).
5. **Auto-Resolve Script Untouched:** `com.zao.auto-resolve` remains completely unloaded from `launchctl` and `~/bin/zao-auto-resolve` will not be edited.
6. **No Emojis, No Em Dashes:** Strictly maintained across all documentation, commits, and PR descriptions.
7. **Credit Attribution:** Brandon Ducar / DreamNet credited as the author and originator of the protocol-hardening specification.

---

## for the grill

Questions for ZaalPanthaki and Brandon Ducar to clarify during review:

1. **Farcaster Ingestion Depth: Neynar Webhook vs Direct Hub Replicate**
   - Recommended Default: Continue using Neynar webhooks with HMAC-SHA512 verification (`src/app/api/webhooks/neynar/route.ts:51-78`), but expand the subscribed event types in the Neynar developer portal to include `cast.deleted` and signer events.
   - Fallback: Connect directly to a Farcaster Hubble instance (or Warpcast Replicate stream) for raw protobuf-level event streams.
   - Rationale: Neynar webhooks already exist and require zero additional infrastructure; expanding event types is a configuration flip rather than standing up new daemons.

2. **ZAOscout Ingestion Architecture: Dual-Mode vs Neynar-Only**
   - Recommended Default: Maintain ZAOscout's keyless Haatz mirror (`bin/scout-farcaster`) as the default free mode, and add an authenticated Neynar/Hub adapter that activates only when `NEYNAR_API_KEY` is provided.
   - Fallback: Force ZAOscout to require Neynar API keys for all Farcaster operations.
   - Rationale: Preserves ZAOscout's defining architectural feature (doc 882: keyless social research scout) while giving protocol-hardened environments full cryptographic authority tracking.

3. **Storage Strategy for Revocation: Soft-Delete Flag vs Dedicated Authority Table**
   - Recommended Default: Add an `authority_status` column (`active`, `revoked`, `quarantined`) to `channel_casts` with an index on `(channel_id, authority_status, timestamp)`. Read queries filter `authority_status = 'active'`.
   - Fallback: Create a separate `farcaster_signer_authority` table that is joined at query time.
   - Rationale: A single column with partial indexing prevents expensive multi-table joins on high-frequency feed queries while guaranteeing that historical cast rows are never deleted.

4. **Transactional Outbox Rollout to Public Publishing**
   - Recommended Default: Enable `DurableEffectLedger` (`effect_intents`) for governance proposal publishing (`src/app/api/publish/farcaster/route.ts`) and space recaps (`src/lib/publish/auto-cast.ts`) behind a feature flag `DURABLE_OUTBOX_MUTATIONS_ENABLED=false`.
   - Fallback: Keep outbox restricted to ZOE agent canary loops.
   - Rationale: Closes the documented duplicate recap risk on network timeouts without touching production behavior until tested.
