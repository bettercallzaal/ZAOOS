---
topic: agents
type: decision
status: research-complete
last-validated: 2026-07-23
related-docs: 2062, 2027, 2030
original-query: "build the sensory + circulatory systems (Eyes, Bloodstream), Memory as a layered organ, a persistent runtime + Control Plane with Edge/Core/Data/Observability layers, and repo governance"
tier: DEEP
---

# 2064 - Organism runtime, Control Plane, Memory, and governance

> **Goal:** The operational substrate that lets many organs run as one long-lived organism: a persistent runtime, a Control Plane (operational nervous system), layered Memory, the Edge/Core/Data/Observability architecture, and repository governance so the ecosystem can grow without losing modularity.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **Infrastructure before more organs.** Build the runtime + Control Plane now. | Each new organ multiplies coordination cost; a Control Plane makes that cost flat. |
| 2 | **Organs are independently deployable but discoverable through the Control Plane** - never coupled directly. | Independent evolution + one place to answer "what exists, what is healthy, what can it do." |
| 3 | **Memory is layered, interfaces-first, tech-agnostic.** Define the layer interface; back each layer with whatever store fits. | One datastore cannot serve working/episodic/semantic/vector/receipt/archive with the right retention + indexing each needs. |
| 4 | **The Control Plane holds references, never secret values;** it registers + discovers, it never executes (that is the Spine). | Keeps the safety + execution boundaries the organism already enforces. |
| 5 | **Governance is set before the ecosystem grows** (licensing, contribution, versioning, compatibility, public/internal, ADRs, release). | Cheaper to establish now than to retrofit across many organs + repos. |

## Shipped this cycle

- **Eyes** (`src/lib/eyes/`) - perception, observe-only. Observation contract + registry + reference sensor. (Doc 2062.)
- **Ears** (`src/lib/ears/`) - event listeners; reuse the Observation contract; dedup + backpressure.
- **Bloodstream** (`src/lib/bloodstream/`) - circulatory: Vacuum Spikes ingest external sources, normalize to Observations, enrich, cache/dedup, and distribute to subscribers so no organ polls twice.
- **Control Plane** (`src/lib/control-plane/`) - organ registry + discovery; every organ publishes identity/version/capabilities/dependencies/health/metrics/status/endpoints; secrets as references only.

## Memory - the layered organ (design, interfaces-first)

- **Purpose:** remember, so the organism has continuity, context, and proof.
- **Responsibilities:** hold and retrieve information across layers with different lifetimes.
- **Boundaries:** stores + retrieves; does not decide or act.
- **Inputs:** Observations (from Bloodstream/Eyes/Ears), Signals, receipts, decisions. **Outputs:** retrieval results, baselines, context packs.
- **Interface (define first, implement per layer):**
  `MemoryLayer { id; kind; put(record): void; get(query): MemoryRecord[]; forget(policy): number; stats(): LayerStats }` and a `MemoryRouter` that routes a record to the right layer(s) and queries across them. `MemoryRecord { id, kind, subjectKey, contentHash, payload, provenance, createdAt, ttl?, embedding? }` - deliberately the Observation contract's cousin (same content-addressing).
- **The layers** (each different retention/indexing/retrieval/sync):
  - Working - seconds/minutes, in-process, hot context. RAM/Map.
  - Episodic - what happened; agent_runs/receipts (shipped). Append-only, time-indexed.
  - Semantic - what is known; facts/entities. Keyed, updatable.
  - Vector - embeddings for similarity recall. Vector index.
  - Receipt/provenance - proof of actions; dreamnet.receipt.v1 (shipped, doc 2030). Immutable, content-addressed.
  - Long-term archive - cold storage, rarely read. Object store.
  - Shared swarm memory - cross-agent, synchronized. Needs a sync/consistency strategy.
  - Organism state - the Control Plane snapshot + current goals. Small, always-fresh.
- **Health:** write success, recall latency/relevance, growth, staleness per layer. **Failure modes:** unbounded growth (real - doc 2036), stale recall, lost writes (the silent-db incident), embedding drift. **Recovery:** compaction + retention policies, the config preflight so a dead layer is loud, receipt content-hash dedup, re-embed on model change. **Metrics:** per-layer size, hit rate, latency, eviction count. **Testing:** round-trip put/get per layer, retention/forget, cross-layer query, dedup. **Future:** shared swarm memory with CRDT-style sync; learned retrieval ranking.

## Persistent runtime

Always-on services + background workers + schedulers, with automatic restarts, health monitoring, secrets management, logging, metrics, internal networking, horizontal scaling, and service discovery. Concretely for ZAO: systemd `--user` units on the VPS today (ZOE + bots) are the v0 runtime; the path forward is a supervisor contract each organ implements (start/stop/health/heartbeat) registered with the Control Plane, so restarts + discovery + scaling are uniform rather than per-service. Secrets stay as references resolved at execution time (never in the Control Plane, never in code - the secret-hygiene rule already in place).

## The four layers

- **Edge Layer** - edge workers, identity, authentication, API gateways, tunnels, CDN, request routing. (Skin/Identity lives here; Vercel edge functions + Tailscale funnels are the current substrate.)
- **Core Runtime** - Brain, Spine, Heart, Bloodstream, workers, schedulers, organ controllers.
- **Data Plane** - operational DB (Supabase), cache, event streaming, long-term storage, vector memory, object storage. (Memory's layers map here.)
- **Observability** - logs, metrics, tracing, dashboards, alerts. (The Control Plane snapshot + per-organ health feed this; ztui/the menu bar are the current dashboards.)

Every organ is independently deployable and discoverable through the Control Plane, regardless of layer.

## Repository governance

- **Licensing:** the organism core (contracts + organs) is open per ZAO's OSS-first stance; per-repo LICENSE files, default permissive (MIT/Apache-2.0) unless a repo has a reason to differ. Each repo MUST have a LICENSE file (the SchellingPoint ambiguity - README says MIT, no LICENSE - is the anti-pattern to avoid).
- **Contributor guidelines:** CONTRIBUTING.md per repo: PR-only, never push main, tests + typecheck green, no secrets, no emojis/em-dashes, the review + human-gate-at-merge model.
- **Versioning:** semver on each organ's contract (the schemaVersion pattern - `zao.observation.v1` - is the model). Breaking a contract bumps the major and both versions coexist during migration.
- **Compatibility guarantees:** a published contract (Observation, OrganRegistration, ReceiptEnvelope) is stable within a major; consumers pin the major. Additive changes only within a major.
- **Public vs internal interfaces:** `index.ts` exports are the public surface; everything else is internal and may change freely. Organs consume each other ONLY through published index exports + the Control Plane, never internal files.
- **ADRs:** architecture decisions captured as numbered research docs (this doc, 2062, 2027, 2030 are ADRs). Each significant boundary decision gets one.
- **Release process:** merge to main behind green CI + human merge; organ contracts version independently; the Control Plane version registry is the source of truth for what is deployed.

## Roadmap - remaining organs

Each: purpose / responsibilities / inputs / outputs / interfaces / health / failure modes / recovery / metrics / testing / future.

### Hands - skills, tools, external actions
The ONLY organ that acts on the world. Acts only on an authorized instruction FROM THE SPINE; never self-initiates or decides. In: an authorized action envelope. Out: outcome + a receipt with evidence. Interface: `Tool { manifest{riskTier, requiredApproval}; execute(action, approval): Result }` + registry. Health: per-tool success rate, latency, spend vs budget. Failure: partial execution, unauthorized attempt, budget breach. Recovery: idempotency + compensating actions (the doc-2027 gap), hard budget stop, rollback. Metrics: actions, success rate, spend. Testing: dry-run, approval-gate enforcement, idempotency, budget caps. Future: compensating-action layer, per-tool canary.

### Immune System - policy, safety, rollback, threat detection
Can BLOCK and ROLL BACK; never creates business actions. In: proposed actions, Observations, Signals. Out: allow/block/quarantine verdicts + rollback commands. Interface: `check(action): allow|block+reason`, `rollback(runId)`, `quarantine(target)`. Health: blocks issued, false-block rate, mean-time-to-rollback. Failure: over-blocking (paralysis), under-blocking (harm). Recovery: tunable policy tiers, tested rollback (recovery suite doc 2027), kill switch. Metrics: blocks, incidents caught vs missed. Testing: red-team injected harmful actions. Future: learned threat detection from the receipt corpus. (The advisory sandbox + secret/PII scanners are its first components.)

### Skin / Identity - authentication, authorization, trust surface
The boundary of who is who and what they may touch. Decides identity + permission only; does not act. In: credentials/tokens/signatures. Out: a verified Principal or rejection, with provenance. Interface: `verify(credential): Principal`, `authorize(principal, action): allow|deny`. Health: auth success/failure, anomalous-attempt rate. Failure: token expiry (today's real incident), key compromise, replay. Recovery: fail-closed, short-lived tokens, key rotation, re-auth. Metrics: auth rates, denials. Testing: expired/forged/replayed tokens, escalation attempts. Future: ZAO Respect + on-chain reputation as trust tiers.

### Nervous System - signals, interrupts, priorities, reflexes
Routes urgency to the right organ at the right priority; fires reflexes. Routes + prioritizes; does not decide strategy (Brain) or act (Hands). In: Signals (Nose), Observations, organ health. Out: prioritized dispatches to the Spine, interrupts, reflex triggers. Interface: `route(signal)`, `interrupt(priority)`, `reflex(signal): preAuthorizedAction | none`. Health: dispatch latency, queue depth, dropped-signal rate, reflex-misfire rate. Failure: priority inversion, signal storm, reflex misfire. Recovery: backpressure, bounded reflex table with the Immune System as override. Metrics: latency, queue depth, reflex fires. Testing: priority ordering, storm handling, reflex-authorization enforcement. Future: learned prioritization from outcome history.

(Nose - anomaly/opportunity detection - is specced in doc 2062 and consumes the Observations Eyes/Ears/Bloodstream now produce.)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Merge the Bloodstream + Control Plane PRs | Zaal | PR | 2026-07-30 |
| Implement the Memory layer interface + working-memory + receipt-memory backers | Zaal | build | 2026-08-06 |
| Add a supervisor contract each organ implements, registered with the Control Plane | Zaal | build | 2026-08-13 |
| Add LICENSE + CONTRIBUTING to each ZAO organism repo (governance) | Zaal | chore | 2026-08-13 |

## Sources

- [FULL] The shipped code this cycle (`src/lib/eyes|ears|bloodstream|control-plane/`).
- [FULL] Brandon's directives (relayed 2026-07-23) + [[project_brandon_organism_directives]].
- [FULL] Doc 2062 (Eyes + roadmap), 2027 (Heart recovery), 2030 (receipt envelope), 2036 (context hygiene).
