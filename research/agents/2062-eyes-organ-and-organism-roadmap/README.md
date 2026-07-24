---
topic: agents
type: decision
status: research-complete
last-validated: 2026-07-23
related-docs: 2027, 2030
original-query: "evolve the organism deeper - build the Eyes organ (pure observation), then a roadmap for the remaining organs (Ears, Hands, Nose, Skin, Immune, Memory, Nervous System)"
tier: DEEP
---

# 2062 - Eyes organ + the ZAO organism roadmap

> **Goal:** Evolve ZAO from a set of services into a modular digital organism where every organ has a single responsibility and clean interfaces, cooperating through the Spine. This doc designs the Eyes organ (shipped as `src/lib/eyes/`) and roadmaps the remaining organs.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **Build deeper, not wider.** Complete the organism one biological system at a time instead of adding more features. | The foundation (Brain/Spine/Heart/Mouth) is strong; the value now is clean separation of responsibility, not more surface. |
| 2 | **Eyes = observe only. No thinking, deciding, or executing.** Enforced in code: a Sensor's only output is `Observation[]`; there is no action/write/decide surface in the interfaces. | A perception organ that could act would collapse the separation the organism depends on. The boundary must be structural, not a comment. |
| 3 | **Standardized `Observation` object** with source, timestamps, confidence, provenance, content hash, evidence, and health metadata. | One contract lets the Brain, Spine, and Memory consume any sensor's output uniformly, and lets multiple Eyes be reconciled later. |
| 4 | **Multiple Eyes can observe the same subject independently; the Eyes never decide what is true.** `subjectKey` + `contentHash` cluster matching reports for downstream consensus. | Truth is a reasoning concern (Brain/Spine), not a perception concern. Eyes report; consumers reconcile. |
| 5 | **ZAO's own vocabulary. No external protocol/branding coupling.** | Clean interfaces and separation of responsibility are the goal, not shared branding. |

## The Eyes organ (shipped)

Code: `src/lib/eyes/` - `types.ts`, `observation.ts`, `registry.ts`, `sensors/filesystem-sensor.ts`, `index.ts`, `__tests__/eyes.test.ts`.

- **Purpose:** perceive the outside world and emit structured Observations.
- **Responsibilities:** GitHub, browser, OCR, vision, filesystem, search, blockchain, market feeds, logs, telemetry, and API observation - each as a hot-swappable sensor.
- **Boundaries:** read-only. It does NOT think, decide, or execute. It never reconciles or asserts truth.
- **Inputs:** an `ObserveContext` (observerId, a read-only cursor, read-only config, a deterministic `now`). Read-only.
- **Outputs:** `Observation` objects (schemaVersion `zao.observation.v1`): `{ observationId, sensor, observerId, kind, subjectKey, observedAt, capturedAt, confidence, provenance{method,endpoint,query}, contentHash, payload, evidence[], health }`.
- **Interfaces:** `Sensor { manifest; observe(ctx): Promise<ObserveResult>; health() }`, `SensorRegistry` (register/replace/unregister/list/runOnce/runAll/healthOf), the `createObservation` factory, and `clusterForConsensus` (clusters, never picks a winner).
- **Internal components:** the Observation factory (canonical hashing), the sensor registry (validation + hot-swap + cursors), per-sensor manifests, a rolling health model, and the sensors themselves.
- **Health model:** per-sensor rolling window of ok/fail -> status `healthy | degraded (>=2 consecutive fails) | failing (>=5) | stopped`, plus latency, errorRate, lastOkAt, consecutiveFailures, totals. Each Observation embeds a health snapshot at capture time.
- **Failure modes:** a sensor throws, times out, returns malformed data, or a source rate-limits. Each is isolated: `runOnce`/`runAll` catch per-sensor, record the failure, and never take down the registry or sibling sensors.
- **Recovery strategy:** failures are per-sensor and self-healing (consecutive-failure counter resets on the next success); cursors make polling incremental and replayable; a bad sensor can be hot-swapped (`replace`) without restarting the organ. Observations are content-hashed so a replay is deduplicable.
- **Test strategy:** pure factory + registry + one reference sensor with an injectable filesystem, covering hash stability across independent Eyes, tamper detection, consensus clustering, hot-swap, failure isolation, status escalation, and cursor-diffed change detection. (Runs on CI; local `src/lib` vitest is blocked by a rolldown native-binding issue on this Mac.)
- **Future evolution:** add sensors per manifest (github, browser via Playwright, OCR/vision, chain via RPC, market feeds, log/telemetry tails); add subscribe-strategy sensors (webhooks/streams) alongside poll; persist Observations to Memory; add an observation cache + replay log; add cross-Eye reconciliation as a Brain capability (never inside Eyes).

## Roadmap - the remaining organs

Each is a modular organ with one responsibility, clean interfaces, and independent evolution, cooperating through the Spine.

### Ears - event listeners and subscriptions
- **Purpose:** receive pushed events (the passive/subscribe complement to Eyes' active polling).
- **Responsibilities:** webhooks, Telegram/Discord/Farcaster streams, chain event subscriptions, message queues, SSE/websockets.
- **Boundaries:** receive + normalize only. Does not poll (that is Eyes), does not act, does not decide.
- **Inputs:** inbound events from subscribed sources. **Outputs:** the same `Observation` contract (kind `*.event`), so Ears and Eyes are interchangeable to consumers.
- **Interfaces:** `Listener { manifest; onEvent(raw): Observation[]; subscribe()/unsubscribe() }`, a listener registry mirroring the sensor registry.
- **Internal components:** subscription manager, dedup (by contentHash), backpressure buffer, replay log.
- **Health model:** per-listener connected/lagging/dropped + lag + reconnect count. **Failure modes:** dropped connection, event storm, duplicate delivery, malformed payload. **Recovery:** auto-reconnect with backoff, replay from last acked offset, dedup on contentHash. **Test:** fake event injectors, dedup + backpressure + reconnect cases. **Future:** exactly-once via the transactional outbox, per-source priority.

### Hands - skills, tools, external actions
- **Purpose:** the ONLY organ that acts on the outside world.
- **Responsibilities:** skills, MCP tools, external API writes, on-chain transactions, posting, PR creation.
- **Boundaries:** acts ONLY on an explicit, authorized instruction FROM THE SPINE. Never self-initiates; never decides what to do (that is the Brain). Every action carries an approval class and emits a receipt.
- **Inputs:** an authorized action envelope from the Spine. **Outputs:** an outcome + a receipt (dreamnet.receipt.v1-shaped, already shipped) with evidence.
- **Interfaces:** `Tool { manifest{riskTier, requiredApproval}; execute(action, approval): Result }`, a tool registry with capability + risk declarations.
- **Internal components:** tool registry, approval gate, budget/rate limiter, receipt emitter, idempotency keys.
- **Health model:** per-tool success rate, latency, spend vs budget. **Failure modes:** partial execution, unauthorized attempt, budget breach, external error. **Recovery:** idempotency + compensating actions (saga), hard budget stop, rollback. **Test:** dry-run mode, approval-gate enforcement, idempotency, budget caps. **Future:** the compensating-action layer (the discovered gap from doc 2027), per-tool canary.

### Nose - anomaly and opportunity detection
- **Purpose:** smell what is off or promising in the stream of Observations.
- **Responsibilities:** anomaly detection (errors spiking, metrics drifting), opportunity detection (a mention, a market move, a new contributor).
- **Boundaries:** flags signals; does NOT decide or act. Emits scented signals to the Brain/Nervous System.
- **Inputs:** Observations (from Eyes/Ears) + Memory baselines. **Outputs:** `Signal { kind, severity, subjectKey, confidence, evidence[] }`.
- **Interfaces:** `Detector { manifest; scan(observations, baseline): Signal[] }`, a detector registry.
- **Internal components:** rolling baselines, threshold/statistical detectors, dedup, a signal ranker.
- **Health model:** detector precision/recall proxy (how often its signals were acted on / were real), false-positive rate. **Failure modes:** alert fatigue (too noisy), missed signal (too quiet), stale baseline. **Recovery:** self-tune thresholds from the advisory-sandbox-style ground-truth loop, decay stale baselines. **Test:** replay known incidents, assert detect/no-detect. **Future:** learned detectors trained on the receipt + outcome history.

### Skin - identity, authentication, trust surface
- **Purpose:** the boundary between inside and outside - who is who, and what they are allowed to touch.
- **Responsibilities:** identity (Farcaster/wallet/session), authentication, authorization, the trust surface for every inbound request and outbound action.
- **Boundaries:** decides identity + permission ONLY; does not decide business logic or act. Advisory to Hands (Hands must check Skin before acting).
- **Inputs:** credentials, tokens, signatures. **Outputs:** a verified `Principal { id, roles, trustTier }` or a rejection, with provenance.
- **Interfaces:** `verify(credential): Principal`, `authorize(principal, action): allow|deny`, a policy source.
- **Internal components:** verifiers (Farcaster Quick Auth, wallet sig, session), role/trust registry, a constant-time comparison layer, audit log.
- **Health model:** auth success/failure rates, anomalous-attempt rate. **Failure modes:** token expiry (today's real incident), key compromise, replay, privilege drift. **Recovery:** fail-closed, short-lived tokens, key rotation, re-auth prompts. **Test:** expired/forged/replayed tokens, role escalation attempts. **Future:** ZAO Respect + on-chain reputation as trust tiers.

### Immune System - policy, safety, rollback, threat detection
- **Purpose:** protect the organism from harmful actions and states.
- **Responsibilities:** policy enforcement, safety gates, rollback, threat detection, quarantine.
- **Boundaries:** can BLOCK and ROLL BACK, but does not create business actions. It is the veto + the antibody, not the actor.
- **Inputs:** proposed actions (from Spine/Hands), Observations, Signals. **Outputs:** allow/block/quarantine verdicts + rollback commands.
- **Interfaces:** `check(action): allow|block+reason`, `rollback(runId)`, `quarantine(target)`.
- **Internal components:** policy engine, the secret/PII scanners (already exist as rules), the advisory sandbox (already shipped), circuit breakers, the quarantine store.
- **Health model:** blocks issued, false-block rate, incidents caught vs missed, mean-time-to-rollback. **Failure modes:** over-blocking (organism paralyzed), under-blocking (harm slips through), slow rollback. **Recovery:** tunable policy tiers, tested rollback paths (the recovery suite, doc 2027), kill switch. **Test:** red-team injected harmful actions, assert block + rollback. **Future:** learned threat detection from the receipt corpus.

### Memory - episodic, semantic, receipts, knowledge
- **Purpose:** remember - so the organism has continuity, context, and proof.
- **Responsibilities:** episodic (what happened), semantic (what is known), receipts (what was done + proof), knowledge graph (Bonfire).
- **Boundaries:** stores + retrieves; does not decide or act. Read/write of records only.
- **Inputs:** Observations, Signals, receipts, decisions. **Outputs:** retrieval results, baselines, context packs for the Brain.
- **Interfaces:** `store(record)`, `recall(query): records[]`, `baseline(kind)`.
- **Internal components:** episodic store (agent_runs/receipts, shipped), semantic store, the Bonfire graph, an embedding/index layer, retention + compaction (the context-hygiene work, doc 2036).
- **Health model:** write success, recall latency/relevance, storage growth, staleness. **Failure modes:** unbounded growth (real - see doc 2036), stale recall, lost writes (the silent-db-failure incident this session). **Recovery:** compaction, the config preflight (shipped) so a dead store is loud not silent, receipt content-hash dedup. **Test:** round-trip store/recall, retention, dedup. **Future:** portable receipt envelopes (shipped, doc 2030), cross-agent shared memory.

### Nervous System - signals, interrupts, priorities, reflexes
- **Purpose:** route urgency - carry signals to the right organ at the right priority, and fire reflexes.
- **Responsibilities:** signal routing, interrupts, prioritization, reflex arcs (fast pre-Brain responses to critical Signals).
- **Boundaries:** routes + prioritizes; does not decide strategy (Brain) or act (Hands). A reflex may trigger a pre-authorized Hands action for critical, pre-approved cases only.
- **Inputs:** Signals (Nose), Observations (Eyes/Ears), health from every organ. **Outputs:** prioritized dispatches to the Spine, interrupts, reflex triggers.
- **Interfaces:** `route(signal)`, `interrupt(priority)`, `reflex(signal): preAuthorizedAction | none`.
- **Internal components:** priority queue, interrupt controller, reflex table (pre-approved signal->action pairs), backpressure.
- **Health model:** dispatch latency, queue depth, dropped-signal rate, reflex-misfire rate. **Failure modes:** priority inversion, signal storm, reflex misfire. **Recovery:** backpressure, bounded reflex table with the Immune System as override, replay. **Test:** priority ordering, storm handling, reflex-authorization enforcement. **Future:** learned prioritization from outcome history.

## The whole organism (target)

```
Eyes (observe, poll) ─┐
Ears (observe, subscribe) ─┤─> Nose (detect signals) ─> Nervous System (prioritize/route)
                          │                                        │
                       Memory (remember) <──────────────────────> Brain (reason/decide)
                          │                                        │
Skin (identity/trust) ── gate ──> Spine (sole executor) ── authorize ──> Hands (act) ─> receipts -> Memory
                                        │
                                Immune System (policy, block, rollback) wraps the Spine/Hands path
Heart (heartbeat, leases, recovery) + Mouth (communication) run throughout.
```

Every organ: one responsibility, a manifest, a health model, failure isolation, and a clean interface. Each evolves independently; they cooperate only through the Spine.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Merge the Eyes organ PR (contracts + registry + reference sensor + tests) | Zaal | PR | 2026-07-30 |
| Add a real GitHub sensor (the first non-reference Eye) | Zaal | PR | 2026-08-06 |
| Build Ears next (subscribe-strategy listeners), reusing the Observation contract | Zaal | build | 2026-08-13 |
| Wire Eyes Observations into Memory + a Nose baseline | Zaal | build | when Eyes has 2+ live sensors |

## Sources

- [FULL] The shipped Eyes code in this PR (`src/lib/eyes/`).
- [FULL] Brandon's organism directive (relayed 2026-07-23) + [[project_brandon_organism_directives]].
- [FULL] Doc 2027 (Heart recovery suite), Doc 2030 (DreamNet receipt envelope), Doc 2036 (context hygiene) - prior organism work this design builds on.
