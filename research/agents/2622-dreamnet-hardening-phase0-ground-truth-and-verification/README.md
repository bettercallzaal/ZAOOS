---
topic: agents
type: audit
status: research-complete
last-validated: 2026-10-06
superseded-by:
related-docs: "agents/2170-organism-diagnostic-v1, agents/2171-organism-reaudit-v1, agents/2175-sovereign-agent-deliverables-architect-report, agents/882-zaoscout-audit-and-roadmap"
original-query: "Independent read-only Phase 0 ground-truth inventory for Brandon Ducar's ZAAL x DREAMNET PROTOCOL HARDENING spec, and verification of Antigravity's integration map (doc 2621, PR #3755)"
tier: DEEP
---

# 2622 - DreamNet Protocol Hardening, Phase 0: Ground-Truth Inventory and Verification of Doc 2621

> **Goal:** Before anything is built for Brandon Ducar's "ZAAL x DREAMNET PROTOCOL HARDENING" spec (revoke-safe Farcaster memory, a signer/authority gate, receipts, adversarial eval FC-EVAL-001 "signer revocation / ghost memory"), establish from the code what ZAOOS and the satellite repos actually do today. This is the independent map that Antigravity's Phase 0 integration map is checked against.

**Credit:** the spec, its threat model and the FC-EVAL-001 eval are Brandon Ducar's (DreamNet). This doc only measures the ground those sit on. The spec itself is summarised in `zao-vault notes/brandon-dreamnet-protocol-hardening-mission-2026-10-06.md`; the full text lives in the orchestrator transcript and with Brandon, and is not quoted here.

**Measured against:** ZAOOS `origin/main` at `0d0a8156c` (2026-10-06 10:48 EDT), plus `gh api` reads of the satellite repos the same day. Nothing was run against production. Every "exists" carries a file:line; every "absent" carries the search that was run.

---

## 1. Executive summary (30 seconds)

ZAOOS already has most of the parts Brandon's spec asks for, but none of them are joined to Farcaster identity. It verifies who you are when you log in, and it checks that a signing key belongs to you when you hand it over. After that it never checks again. A Farcaster signer that is revoked tomorrow keeps passing every check in the app for up to seven days, and every cast or memory derived from that person stays trusted forever, because nothing records which signer produced it and nothing removes content when its source goes bad. That is precisely the "ghost memory" case FC-EVAL-001 is designed to catch, so today the eval would fail. The building blocks for the fix exist (a revocation resolver, receipt envelopes with hashes, memory records with provenance and a `revocationRef` field), but they are either unwired, flag-gated OFF, or never read.

## 2. Why this matters

Brandon's thesis is that trust has to survive change: a key that is withdrawn must withdraw its authority, and anything it vouched for must be re-examined. Today the organism's trust is a snapshot taken at login. That is fine while nothing goes wrong, and silently wrong the first time something does. Knowing exactly where the joins are missing turns the spec from a rewrite into a short list of wiring jobs, which is what the spec's own constraints demand (no rewrites, no second memory store, no second event bus).

## 3. Before vs after (what this doc changes)

**Before:** two parallel claims about the estate (doc 2175's map from 2026-08-01, and whatever Antigravity produces), neither checked against today's code for the Farcaster-identity angle.

**After:** a file:line map of every Farcaster ingestion path, every signer path, every memory store and every receipt surface, each marked against the spec section it would serve, and a list of the specific joins that are missing.

---

## 4. The inventory, by spec section

Spec sections A-H as named in the vault summary. Status words: **EXISTS** (code on main, cited), **PARTIAL**, **UNWIRED** (code exists, no non-test caller), **OFF** (flag-gated, default off), **ABSENT** (search shown).

### A. Canonical Farcaster event envelope - UNWIRED

| Thing | Status | Evidence |
|---|---|---|
| A generic inbound envelope type | EXISTS | `src/lib/ears/types.ts:19-31` - `EventEnvelope { source, receivedAt, raw, deliveryId? }`, comment names `'farcaster-stream'` as an example source |
| Any importer of `@/lib/ears` | ABSENT | `grep -rln "@/lib/ears" src bot/src` returned no files |
| A Farcaster-specific event type or envelope table | ABSENT | `grep -rnEi "FarcasterEvent\|event_envelope\|EventEnvelope\|canonical.?event"` matched only the ears files |

**Farcaster ingestion paths today (none uses the envelope):**

| Path | Verifies sender | Writes | Provenance kept |
|---|---|---|---|
| `src/app/api/webhooks/neynar/route.ts` | HMAC-SHA512, constant-time, 503 if secret unset (`:50-70`) | `channel_casts` upsert on hash, `moderation_log`, `hidden_messages`, `song_submissions` | author fid, cast hash, cast timestamp. No signer, no raw-payload hash, no delivery id |
| `src/app/api/miniapp/webhook/route.ts` | `parseWebhookEvent(raw, verifyAppKeyWithNeynar)` (`:11`) | `notification_tokens` | fid, token |
| `src/app/api/chat/messages/route.ts` | n/a (pull from Neynar on user GET) | `channel_casts` with `ignoreDuplicates: true` (`:77-79`) | same as webhook |
| `src/app/api/chat/send/route.ts` | session | write-through of own cast into `channel_casts` (`:62-81`) | server time, not cast time (`:71`) |
| `src/app/api/cron/follower-snapshot/route.ts` | `CRON_SECRET` bearer | `follower_snapshots`, `member_stats_history` | fid |
| `bot/src/zoe/farcaster/event-stream.ts` | none at app level; plain gRPC default (`:61-63`) | no DB; feeds caster pipeline | fid, hash, text, mentions. The message's signer field is not extracted (`:50-55`) |

Only `cast.created` is handled. `grep -rnE "cast\.deleted|reaction\.created|follow\.created|user\.updated" src bot/src scripts` returned nothing, so **a cast deleted upstream stays in `channel_casts` and stays searchable**.

### B. Signer / authority gate - PARTIAL at creation, ABSENT at action time

| Thing | Status | Evidence |
|---|---|---|
| User signer creation (Neynar managed + SignedKeyRequest with `APP_SIGNER_PRIVATE_KEY`) | EXISTS | `src/app/api/auth/signer/route.ts:32-87` |
| Ownership check when a signer is saved | EXISTS | `src/app/api/auth/signer/save/route.ts:30-34` - `getSignerStatus`, 403 if `fid` mismatch |
| Status check on save (is it `approved`?) | ABSENT | same block checks fid only, then `session.signerUuid = ...` (`:37-39`) |
| Signer storage | cookie only | `signerUuid` in iron-session (`src/lib/auth/session.ts:18`), `maxAge` 7 days (`:36`). `signer_uuid` in SQL appears only in `scripts/archive/old/*` (live DB state UNVERIFIED) |
| Short-circuit that reports a stored signer as approved | EXISTS | `auth/signer/route.ts:25-27`: `if (sessionData.signerUuid) return { status: 'approved' }` with no live check |
| Action-time check | presence only | e.g. `src/app/api/neynar/cast/route.ts:13-15` `if (!session?.signerUuid) 401`; same shape in chat/send, users/follow, casts/delete |
| Handling of revoked / invalid signer from Neynar | ABSENT | `grep -rnEi "revoke\|revoked\|revocation\|signer_status\|invalid signer\|deleteSigner"` over src, bot/src, scripts: signer hits only in test mocks; Neynar errors become a generic throw then a 500 (`src/lib/farcaster/neynar.ts:122`), session never cleared |
| Allowlist re-check after login | ABSENT | `getSessionData` (`session.ts:45-59`) does not re-check, so a de-listed member keeps access until cookie expiry |
| Shared app signers from env | EXISTS | `ZAO_OFFICIAL_SIGNER_UUID` (`src/lib/publish/auto-cast.ts:23`), `WAVEWARZ_OFFICIAL_SIGNER_UUID` (`proposals/vote/route.ts:272-274`), `NEYNAR_SIGNER_UUID` (`admin/broadcast/route.ts:33`) |
| Bot signer | EXISTS | local Ed25519 `FARCASTER_SIGNER_PRIVATE_KEY` (`bot/src/zoe/farcaster/signer.ts:9-10`), registered via `KeyGateway.add` (`scripts/register-signer.ts`) |

**Outbound approval:** the only Farcaster write path with a human approval step is the ZOE bot caster (draft, Klearu check, Telegram Approve/Reject: `bot/src/zoe/caster/index.ts:75-119`). `autoCastToZao` posts with the shared app signer with no approval and no audit row from 11 call sites (`grep -rn "autoCastToZao(" src`): member welcome, track of the day, collaborative playlists, stream rooms, two Respect-milestone routes, publish/compose, the daily-digest cron, `src/lib/agents/cast.ts`, and two Juke space events (`src/lib/spaces/jukeWebhookHandlers.ts:243,272`). The admin route `src/app/api/publish/farcaster/route.ts` (admin-only, `ZAO_OFFICIAL_SIGNER_UUID`, `postCast` at `:109`) is a twelfth path. Rate limits exist per route in `src/middleware.ts` (e.g. `/api/chat/send` 10/min). `src/lib/publish/farcaster.ts`, cited in doc 2175, **does not exist on main today**.

### C. Revoke-safe memory ("FarScout") - ABSENT; and the target is ZAOscout, not FarScout

FarScout is retired (doc `agents/882-zaoscout-audit-and-roadmap`). `bettercallzaal/farscout` is **not archived** (last push 2026-09-21, per `gh repo list`), which is why it keeps being named. The live successor is `ZAODEVZ/ZAOscout` (last push 2026-10-05). Its memory is aggregate themes and dedup ID sets; author fid is not persisted (subagent read of `scout/memory.js`, `scout/state.js`; not re-read by this lane - PARTIAL). So ZAOscout holds little that could become ghost memory.

The real ghost-memory surface is in ZAOOS and ZOE:

| Store | Provenance per item | Can it be invalidated by source? |
|---|---|---|
| `channel_casts` (Supabase) | author fid, hash | No signer column; no delete handling (section A) |
| ZABAL Gamez queue into Bonfire (`bot/src/zoe/bonfire-queue.ts`) | fid verified by Quick Auth, but written into the episode **body as text** (`:139-141`) | Only by text search - the best FC-EVAL-001 target |
| Other Bonfire writers (`recall.ts:111-118`, thread-memory, extractors, team-tracker, afferent-digest) | source tag only | No; no Bonfire delete call is used |
| Farcaster wiki (`bot/src/zoe/farcaster/wiki.ts`, `~/.zao/zol/wiki/`) | `fid:N` id, related casts | `deleteWiki` exists (`:310`) but its only caller is its test |
| Hindsight (`src/lib/memory-events.ts`) | `CastReceipt {castHash, authorFid, timestamp}` | No delete in the client interface; `retainEvent` has no non-test caller (subagent; not re-read - PARTIAL) |
| Organism memory (`src/lib/memory/*`) | `source`, `contentHash` | TTL on working memory only |
| DreamNet tenant memory (`src/lib/dreamnet/tenant/memory.ts`) | full provenance block + `revocationRef` (`:64`) | **The field is declared and never read** - `grep -n revocationRef` finds only the schema line; the module defers revocation to the Spore trust layer |

Absence search: `grep -rn -i "tombstone\|forget(\|deleteEpisode\|invalidat"` over `bot/src src/lib` hit only push-token cleanup. **No code deletes, tombstones or expires memory by source author, fid or signer.**

### D. ZAOOS trust gate - EXISTS for federation keys only, OFF

| Thing | Status | Evidence |
|---|---|---|
| Revocation resolver | EXISTS | `RevocationResolver.isRevoked(issuerId, keyId)` (`src/lib/spore/trust.ts:186-187`), applied at `:479` - per issuer key, not per Farcaster fid/signer |
| Tenant layer + canary | OFF | `DREAMNET_TENANT_ENABLED`, `DREAMNET_TENANT_CANARY_ENABLED`, ON only for the string `'true'` (`src/lib/dreamnet/tenant/flags.ts:9-21`) |
| Capability leases with `EXPIRED`/`REVOKED` states | EXISTS, no time check | `capability-lease.ts:15-37`; no function compares `expiresAt` to now |
| Proof drops | OFF | `DREAMNET_PROOF_DROPS_ENABLED` (`src/lib/dreamnet/proof-drop/proof-drop.ts:23`) |
| Callers of the dreamnet module outside itself | ABSENT | `isTenantLayerEnabled` / `isProofDropsEnabled` have definitions and re-exports only |

`grep -rnEi "farcaster|signer|fid" src/lib/dreamnet src/lib/spore` returned nothing: the trust layer and the Farcaster layer have never met.

### E. Sparkz creator auth / publishing - operator-only

`bettercallzaal/sparkz` (last push 2026-09-28; README badge "status-Milestone 1"). Writes are gated on a single `SPARKZ_ADMIN_TOKEN` cookie; no per-creator FID or signer auth yet (subagent read of `src/lib/auth.ts`; PARTIAL). The lane brief calls Sparkz "paused"; the repo itself does not say so, and that status is Zaal's to state, not this doc's.

### F. Recap ingestion ("Zabalbot/Recaps") - ABSENT as a causal pipeline

- ZOE's nightly recap (`bot/src/zoe/recap.ts`) builds from PRs/commits/docs and DMs Zaal; it writes no memory. The only path from recaps to memory is `afferent-digest.ts`, which digests the day's receipts into Bonfire.
- `bettercallzaal/zabalbot`: 189 KB repo, description "v", last push 2026-08-25; the subagent read it as a Vite mini-app, not an ingester (PARTIAL).
- `zabalbot` has zero hits in ZAOOS `bot/src src scripts`.
- Meeting recaps are written by the `/meeting` skill into `~/zao-vault/meetings`, outside this repo.
- **Juke space recaps are the one live recap that touches Farcaster** (found while verifying doc 2621, which maps "Recaps" to them): `room.finished`/`room.ended` posts a "Just wrapped" cast via `autoCastToZao` (`src/lib/spaces/jukeWebhookHandlers.ts:213-243`). The Juke webhook route records each event and drops replays by signature hash before handling (`src/app/api/juke/webhooks/route.ts:62-79`), so a retried delivery does not re-cast. No receipt is emitted. Both `room.finished` and `room.ended` enter the same recap branch (`:213-214`); whether Juke sends both for one room is UNVERIFIED.

### G. Receipts - EXISTS, thin, no identity

| Thing | Status | Evidence |
|---|---|---|
| `receipts` table | EXISTS | `scripts/1410-agent-control-plane.sql:119-156`: agent_identity, capability, tool, action, input_digest, result_type, approval_class, evidence_url |
| Envelope columns (`content_sha256`, `dreamnet_envelope`) | inert | `scripts/2030-dreamnet-receipt-envelope.sql:53-58`: "update emitReceipt to also write ... Until then ... inert". `grep content_sha256\|dreamnet_envelope bot/src/zoe/receipts.ts` = 0 lines |
| `dreamnet.receipt.v1` envelope builder | UNWIRED | `bot/src/zoe/receipt-envelope.ts:46`; `buildReceiptEnvelope` / `verifyEnvelopeIntegrity` have no non-test caller |
| `emitReceipt` callers | 7 sites | afferent-digest `:201`, repo-improver-io `:155`, work-loop `:309,:324`, error-remediation `:359,:375`, hermes runner `:253` |
| Signer / fid / prev-hash in a receipt | ABSENT | not in the SQL nor `ReceiptInput` (`receipts.ts:54-81`) |
| Failure behaviour | swallows | `emitReceipt` catches all errors (`receipts.ts:130-134`) |
| `src/lib/agents/control-plane.ts` | types only | `Receipt` interface (`:119-131`) has no signer field; the module's only importer is its own test (`src/lib/agents/__tests__/control-plane.test.ts:8`). The live control plane is a different module, `src/lib/control-plane/` |
| Chained receipts | EXISTS, other repo | `bettercallzaal/zol src/receipt-journal.js`: `previousReceiptId`, `previousReceiptHash`, redacted evidence (subagent; PARTIAL) |
| Federation receipt schema | EXISTS, other repo | `bettercallzaal/zorca federation/schemas/outcome-receipt.v1.schema.json` and `authority-lease.v1.schema.json` (tree listed by this lane) |

### H. FC-EVAL-001 (signer revocation / ghost memory) - would fail today

Predicted from the code above, not run: revoke a member's signer upstream, then (1) the member's session keeps reporting `approved` and keeps passing every route's signer check for up to 7 days, with Neynar's rejection surfacing as a generic 500; (2) their past casts stay in `channel_casts` and search; (3) any Bonfire episode from their ZABAL Gamez submission stays recallable with nothing marking it. The single upstream defence is that Neynar or the hub would refuse a write from a revoked signer (inferred, UNVERIFIED).

### Heart, for completeness (section G's execution side)

`packages/heart-fleet/src/*` (leases, fencing, outbox, reconcile, liveness), `effect_intents` (`scripts/2148-transactional-outbox.sql:29-44`, channel includes `farcaster`). All four flags are ON only for the string `'true'`: `ZOE_HEART_FLEET_CANARY` (`heart-canary.ts:54`), `ZOE_OUTBOX_DEMO` (`:59`), `ZOE_REPO_IMPROVER_LEASES` (`scheduler.ts:131`), `ZOE_LOOP_LEASES` (`:151`). Their live values on the VPS were not read by this lane (UNKNOWN). Flipping any of them is grill item 31, not this doc.

---

## 5. Architecture diagram - where the joins are missing

```
 Farcaster hub / Neynar
        |  cast.created only (no delete, no signer field kept)
        v
 [ingestion: webhook, poll, gRPC] --X--> ears EventEnvelope (exists, unused)
        |
        v
 channel_casts / Bonfire / wiki / hindsight      <-- no signer, no tombstone
        |
        v
 ZOE recall + reasoning -----> actions (user signer from cookie, checked once)
        |                                   |
        v                                   v
 receipts (no fid/signer, no hash) --X--> dreamnet.receipt.v1 envelope (built, unwired)

 Spore trust: RevocationResolver.isRevoked(issuer,key)  --X-- Farcaster identity
 tenant memory: revocationRef declared                  --X-- never read
```

`--X-->` marks a join that does not exist on main today.

## 6. Evidence classes

- **Proven (read this session, file:line above):** every row marked EXISTS/ABSENT/UNWIRED/OFF in sections A, B, D, G; the `revocationRef` never-read; ears has no importer; envelope columns not written; zol has 72 `loops/*.json` manifests (`gh api .../git/trees/HEAD?recursive=1`); zorca has the four federation schemas.
- **Read by a subagent, spot-checked in part (PARTIAL):** ZAOscout memory shape, Sparkz auth, zabalbot contents, zol receipt-journal fields, Hindsight callers.
- **Not tested:** FC-EVAL-001 itself; live flag values on the VPS; whether `signer_uuid` columns exist in the live DB.

Two subagent claims were wrong and are corrected here: one reported **no** dreamloop manifests in zol (there are 72) and **no** federation schemas in zorca (there are four).

## 7. Risks

- **Security:** a revoked signer or a de-listed member keeps app access until cookie expiry (7 days). Low exploit evidence; real design gap.
- **Data:** deleted casts persist and are searchable; memory has no way to forget by source.
- **Operational:** `emitReceipt` swallows failures, so a receipt that did not land is invisible (silent-failure-guard.md).
- **Process:** the target names in the spec (FarScout, Zabalbot) do not match the live repos, which invites building against a retired repo.

## 8. Remaining work (proposal only, nothing built)

The smallest joins, in order, none of them a rewrite:

1. Record the signer on ingest and on every receipt (one nullable column each, migration is Zaal-gated).
2. Re-check signer status at action time, or on a short TTL, and clear the session on a Neynar 401.
3. Handle `cast.deleted` in the existing Neynar webhook by tombstoning `channel_casts`.
4. Put the fid into Bonfire episodes as structured metadata, not body text.
5. Make `tenant/memory.ts` actually read `revocationRef` through the existing Spore `RevocationResolver`, extended to a Farcaster signer key.
6. Wire `buildReceiptEnvelope` into `emitReceipt` (the 2030 migration's own POST-APPLY note).
7. Only then, write FC-EVAL-001 as a test that runs steps 1-5 against fixtures.

Every new flag defaults OFF.

## 9. Explain it to a 12-year-old

The app checks your ID at the door and then never looks at it again. If your ID is cancelled while you're inside, you can keep using it for a week, and everything you said while inside is remembered forever. Brandon wants the app to notice cancelled IDs and to go back and mark what that person said. Most of the tools for that are already in the building, just not plugged in.

## 10. Teach me something: why revocation is hard

Issuing trust is one event; revoking it is a promise about every future check. A system that checks at the door (authentication) but not at each action (authorisation) cannot honour a revocation, because nobody asks again. And content derived from a revoked source does not carry a label unless someone wrote the source down when it arrived. That is why provenance has to be captured at ingest: you cannot recover it later.

## 11. Confidence

| Conclusion | Confidence | Evidence | Unknown |
|---|---|---|---|
| No action-time signer check | 95% | four routes read, grep for status checks | an upstream middleware I did not read (middleware.ts checked for rate limits only) |
| No memory invalidation by source | 90% | grep for tombstone/forget/invalidate/delete + store table | stores outside these repos (vault, Bonfire server side) |
| FC-EVAL-001 would fail | 80% | inference from the two above | not run |

## 12. Next iteration

Highest leverage: steps 1 and 3 above, because provenance not captured at ingest is lost for good, and every later fix depends on it. Alternative: start with step 2 (action-time check), which closes the live exposure but leaves ghost memory untouched.

## 13. Verification of Antigravity's Phase 0 map

Antigravity's map is ZAOOS PR #3755, `research/agents/2621-zaal-dreamnet-protocol-hardening-phase0-discovery/README.md` (branch `ws/research-2621-dreamnet-hardening-phase0`, commit `c71d26a21`, opened 2026-10-06 12:48 EDT). Read in full; every load-bearing claim below was re-checked against the code or a raw fetch by this lane.

**Verdict: mostly accurate on what it cites, wrong on five points, and it misses the user-signer path, which is the central case for FC-EVAL-001.** Its central design idea (keep content as historical truth, make retrieval eligibility depend on current authority) is sound and matches section 8 here.

### CONFIRMED (12)

| Its claim | Check |
|---|---|
| Webhook drops every event except `cast.created` | `src/app/api/webhooks/neynar/route.ts:79-82` |
| `castToRow` stores no signer | matches section A |
| Webhook moderation is fire-and-forget | `route.ts:104-106` `void (async () => ...` |
| Admin publish route uses the ZAO official signer and calls `postCast` directly, no outbox | `src/app/api/publish/farcaster/route.ts:22-28, :109` |
| `postCast` does no signer-status pre-flight | `src/lib/farcaster/neynar.ts:80` onward |
| Reads go through `FARCASTER_READ_API_BASE`, falling back to Neynar | `neynar.ts:3-5` |
| `MemoryRecord` has no fid/signer; `recall()` is unfiltered | `src/lib/memory/types.ts:36-50`, `memory.ts:54-57` |
| Vector memory "not yet implemented" | `types.ts:11` |
| `effect_intents` + `DurableEffectLedger` exist; only the OFF heart canary uses the outbox | `scripts/2148-transactional-outbox.sql`, `bot/src/zoe/heart-canary.ts:23-25, :59` |
| Proof drops are flag-gated OFF | `proof-drop.ts:23` |
| `emitReceipt` swallows errors; envelope columns are not written | `receipts.ts:8-10`, 2030 migration `:53-58` |
| Juke `room.finished` posts a recap via `autoCastToZao` with no receipt | `jukeWebhookHandlers.ts:213-243` |

Minor: it says `emitReceipt` has 6 call sites; there are 7 (section G). It cites `durable-effect-ledger.ts:62-218`; the file has 217 lines.

### WRONG (5)

1. **"`signer.added` and `signer.revoked` are silently discarded"**, and its grill question 1, "expand the subscribed event types in the Neynar developer portal to include ... signer events". **Neynar webhooks do not offer signer events.** Raw fetch of `https://docs.neynar.com/reference/publish-webhook.md` (curl, 13,503 bytes, 2026-10-06) lists the subscribable types as `cast.created`, `cast.deleted`, `follow.created`, `follow.deleted`, `reaction.created`, `reaction.deleted`, `trade.created`, `user.created`, `user.updated`. A revocation has to be detected another way: polling signer status (`getSignerStatus`, `neynar.ts:261`) or reading on-chain key-registry events from a hub (UNVERIFIED as a source here). `cast.deleted` is real and is the right half of that grill question.
2. **"If the Juke webhook fires twice ... duplicate recap casts are posted."** The route records each event and drops replays by signature hash *before* any handler runs (`src/app/api/juke/webhooks/route.ts:62-79`, "Duplicate - already processed"). A retried delivery does not re-cast. The residual risk is different and smaller: `room.finished` and `room.ended` share one recap branch (section F).
3. **Sparkz "rely on client-side session checks."** Sparkz writes are gated server-side by a fail-closed operator token (`bettercallzaal/sparkz src/lib/auth.ts`, read via `gh api`: "Fails CLOSED: if SPARKZ_ADMIN_TOKEN is unset, no writes are allowed at all"). The local path it cites, `/Users/zaalpanthaki/zao-workspace/repos/sparkz`, is a symlink to `/Users/zaalpanthaki/Documents/sparkz`, which does not exist, so that claim cannot have come from reading that repo.
4. **"ZAOOS already implements receipts and agent runs (`src/lib/agents/control-plane.ts:19-131`)."** That file is pure types (`:9`, "No database calls in this file") and its only importer is its own test. The receipts that run are `bot/src/zoe/receipts.ts` on `scripts/1410-agent-control-plane.sql`.
5. **The doc number.** It is filed as 2621, which this lane had reserved (`refs/tags/doc-2621`, annotated "reserved ... 2026-10-06T16:43Z - dreamnet-protocol-hardening-phase0-ground-truth", four minutes before its commit). The `collision` CI check passed anyway. This doc moved to 2622; the gap in the guard is reported separately.

### UNSUPPORTED (attribution needs confirming)

- **"Zaal rule 1" to "Zaal rule 4"**, quoted as "User rule 2 mandates". Per the orchestrator seat (message to this lane, 2026-10-06), it drafted the wrapper rules (1-8), and Zaal read them and sent them to Antigravity as his own message, opening "these are my rules". So the accurate attribution is: **rules Zaal set for this mission, drafted by the orchestrator seat and sent by Zaal on 2026-10-06.** Doc 2621 states them as Zaal's own rulings with no drafting credit.
- **"Sparkz is paused."** Sourced, but as a paraphrase, not Zaal's words. The processed vault note `meetings/2026-10-05-zaal-x-arun.md` drops it: a case-insensitive grep for "spark" across its 105 lines returns nothing. The raw Gemini notes, `meetings/2026-10-05-zaal-x-arun-gemini-notes.md` (vault `a13d664d`, line 46), carry it in Gemini's third person: "active development on its dedicated infrastructure is temporarily paused due to low current energy around Farcaster ... the core Sparks concept remains active" (00:18:26). So: the dedicated infrastructure is paused, and the concept is not. The Sparkz repo's last push was 2026-09-28.
- "Warpcast Replicate stream" as a fallback source: not checked.
- ZAOscout state file names (`state/seen.json`, `state/memory.json`): this lane's read of ZAOscout found theme and per-mode seen files instead (PARTIAL on both sides; not settled).

### MISSED (present in this inventory, absent from its map)

- **The user signer path**, the main live exposure: a user's signer is checked once and then only for presence in a 7-day cookie, and `/api/auth/signer` reports a stored signer as `approved` with no live check (section B). Its map covers only the shared official signers.
- **The existing `EventEnvelope`** in `src/lib/ears/types.ts:19-31`. It proposes a new `src/lib/farcaster/envelope.ts` instead, a second envelope beside one that exists, which the spec's no-parallel-infrastructure constraint argues against. Extend `ears`.
- **The revocation machinery to reuse:** Spore's `RevocationResolver` (`src/lib/spore/trust.ts:186-187`) and tenant memory's unread `revocationRef` (section D).
- **The Bonfire memory stores**, including the ZABAL Gamez queue that writes fid only as body text (section C), the largest ghost-memory surface in ZOE.
- **The unwired `dreamnet.receipt.v1` envelope builder** (`bot/src/zoe/receipt-envelope.ts`).
- The bot's gRPC ingestion (`bot/src/zoe/farcaster/event-stream.ts`) and the absent allowlist re-check.

## 14. Translation layer

- **Engineer:** auth is checked once; signer and provenance are not recorded on ingest or on receipts; the revocation machinery exists only for federation keys.
- **Architect:** the Eyes (ingestion) and the Memory have no shared notion of identity, so the Spine cannot enforce authority over what the Memory believes.
- **Founder:** we are closer than the spec implies; this is seven wiring jobs, not a new system.
- **Investor:** trust that survives revocation is what separates an agent network people can rely on from one that only works while nothing goes wrong.

---

## Sources

| Source | Method | Status |
|---|---|---|
| ZAOOS `origin/main` 0d0a8156c | `sed -n`, `grep -rn` in this worktree by this lane, plus two read-only Explore subagents whose high-stakes claims were re-read (signer/route.ts, session.ts, neynar/cast route, webhooks/neynar route, ears types, signer/save, scheduler.ts:131, tenant/memory.ts, receipts.ts, 2030 migration, bonfire-queue.ts, control-plane importers) | FULL |
| `bettercallzaal/zol`, `bettercallzaal/zorca`, `bettercallzaal/sparkz`, `bettercallzaal/zabalbot` | `gh api` tree and file reads by this lane | FULL for counts and paths quoted; PARTIAL for subagent-only details |
| `ZAODEVZ/ZAOscout` | subagent `gh api` reads | PARTIAL |
| Docs `agents/2170`, `2171`, `2175`, `882`; vault `notes/brandon-dreamnet-review-2026-10-06.md` and `notes/brandon-dreamnet-protocol-hardening-mission-2026-10-06.md` | read in full | FULL |
| Brandon Ducar's spec text | not read directly; vault summary only | PARTIAL |
| Antigravity's doc 2621 (ZAOOS PR #3755, commit c71d26a21) | `git show` of the PR branch, read in full | FULL |
| Neynar webhook event types | `curl -sL https://docs.neynar.com/reference/publish-webhook.md`, raw text grep | FULL |
| Juke webhook dedup | `sed -n 60,95p src/app/api/juke/webhooks/route.ts` | FULL |

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Correct doc 2621's five WRONG items, or mark them in place, after it merges | Antigravity or dreamnet lane | Edit | after #3755 merges |
| Confirm whether the "Zaal rule 1-4" wording in doc 2621 is Zaal's | Zaal (via grill) | Confirm | before Brandon reads it |
| Get the full spec text to quote section names exactly | orchestrator / Zaal | Read | before any build |
| Decide whether the 7 joins in section 8 become a build plan | Zaal (grill) | Decision | after Brandon reviews Phase 0 |
| Archive `bettercallzaal/farscout` so it stops being named | Zaal | Repo admin | any time |
