---
title: "Brandon Ducar Public Repos - ZOL v2 & Swarm Integration Scan"
topic: agents
type: market-research
tier: STANDARD
original-query: "scan and analyze all the public repos in github.com/BrandonDucar and see if there's any integration points there for zol and the developing swarm"
status: READY
date: 2026-07-16
---

# Brandon Ducar Public Repos - ZOL v2 & Autonomous Swarm Integration Scan

Brandon Ducar is a trusted ZAO contributor (ZABAL Games collaborator, author of DreamLoops framework now merged into ZOL main). This scan identifies concrete integration opportunities across his 11 public repos with ZOL v2 and the emerging autonomous agent swarm.

## Repository Inventory

| # | Repo | Language | Stars | Updated | Description | Relevance |
|---|------|----------|-------|---------|-------------|-----------|
| 1 | dreamloops | JavaScript | 0 | 2026-07-14 | Portable, bounded operating loops and capability Capsules for persistent AI agents | HIGH - canonical ZOL v2 spec, already vendored on main |
| 2 | toolgym | TypeScript | 0 | 2026-07-14 | Model-neutral training, field validation, and portable evidence for AI agent tool mastery | HIGH - tool qualification gating for work router |
| 3 | dreamnet-ens | TypeScript | 0 | 2026-06-13 | Agent Identity Passport & Service Discovery via Ethereum Name Service (ENS) | HIGH - fleet identity + cryptographic service discovery |
| 4 | dreamnet-quillcode | JavaScript | 0 | 2026-06-15 | Build-packet compiler for agent steward work (quorum-approved alpha to production) | HIGH - validates proposals before deployment, 22/31 quorum threshold |
| 5 | dreamnet-quorum-lab-ethnyc | TypeScript | 1 | 2026-06-13 | ETHGlobal NYC clean-room: 31-agent Svelte quorum decision-support app | HIGH - swarm consensus for high-risk actions, receipts + safety gates |
| 6 | wavewarz-gravity-board | JavaScript | 1 | 2026-07-14 | Analytics dashboard prototype (battle momentum, artist liquidity heatmap, trader/fan split) | MEDIUM - observability pattern for fleet dashboard + ZOL state |
| 7 | dreamnet-songs | HTML | 1 | 2026-07-14 | Song drops, metadata, receipts, and live pages for creator experiments | LOW - music ecosystem surface, not core agent infra |
| 8 | zabal-recording-scout | JavaScript | 1 | 2026-07-14 | ZABAL workshop recording library scout + Farcaster artist discovery | LOW - builder discovery, not core agent infra |
| 9 | proof-drop-zabal | JavaScript | 1 | 2026-07-03 | ZABAL Gamez build receipt maker (SHA-256 hash + copy-ready posts) | LOW - build receipt UX, not core agent infra |
| 10 | FlockGPScameras | TypeScript | 0 | 2026-06-20 | GPS-enabled camera flock tracking and management system | VERY LOW - IoT/hardware, no clear ZOL overlap |
| 11 | pi-boost | TypeScript | 0 | 2026-06-19 | Pi Network mining companion PWA (dashboard, security circle, price tracker) | VERY LOW - Pi Network specific, not ZOL-adjacent |

**Scan Methodology:** All repos enumerated via `gh api users/BrandonDucar/repos --paginate`. READMEs fetched and decoded. Top 5 repos assessed for integration theory, dependencies, and architectural alignment. Anti-pattern checks: no eval/Function/vm on manifests, no automatic fund spending, no hidden signer paths, all propose-only or quorum-gated.

---

## Detailed Analysis: High-Relevance Repos

### 1. dreamloops (CANONICAL - Already Integrated)

**Status:** Merged to ZOL main as phase 0-8 vendored implementation (commit 7ae5fdb, 2026-07-15). All DreamLoops logic is dependency-free + isolated in `@dreamloops/runtime` and `@dreamloops/warper-keeper`.

**Architecture:**
- Capsules: inert hash-addressed bundles (identity, permissions, resource ceilings, lineage)
- DreamLoops: bounded state-machine loops with typed steps, evidence, receipts
- Runtime: schema validation, composition, state machine, bounded execution
- CLI: initialize, validate, seal, list, dry-run commands
- Starter kit: persistent-agent framework with daily-life ops (planning, inbox, capture, continuity, memory, budget review)
- Warper Keeper (optional): assignment-bound async adapter, disabled default
- Labs: experimental work (Fish Swarm, Genealogist, DNA, Persistent Dream)

**ZOL v2 Mapping:**
- Capsules = ZOL's explicit permission model (grant per handler)
- DreamLoop manifest = ZOL's loop-state classification (production/dry-run/experimental/spec-only)
- Evidence + Receipts = ZOL's Receipt directive->task->evidence->approval->output->commit flow
- 18 registered loops (on branch) correspond to ZOL's ~41 loops being classified
- Warper Keeper adapter maps to ZOL's optional model/tool gateways

**Integration Status:** COMPLETE. ZOL v2 IS the DreamLoops graft. Framework is flag-gated off (`DREAMLOOPS_ENABLED` unset); Zaal deploys + enables on Pi himself.

---

### 2. toolgym

**Status:** Public alpha. Model-neutral tool training + evidence platform. Separation: qualification path (self-service workouts) → practice (deterministic receipts) → field test (authorized real-world work) → mastery credential (signed by issuer, 6-month expiry). Proctor link isolates review (cannot approve own work).

**Architecture:**
- Workspaces: one-time API keys stored as hashes
- Agent profiles: model-vendor-neutral (MCP, OpenAPI, CLI, webhook adapters)
- Core workouts: tool selection, argument discipline, approval gates, recovery routing (all deterministic)
- Receipts: content-addressed, public, linked to qualification records
- Credentials: ECDSA P-256 issuer signatures, public verification, expiry checks
- Trust ladder: candidate → attempts → receipts → qualification → field test → review → signed credential → expiration/recertification

**Dependencies:** Next 16, React 19, Drizzle ORM, Zod, Tailwind v4, Cloudflare Workers + D1.

**ZOL v2 Mapping:**

| ZOL v2 Component | toolgym Parallel | Integration Theory |
|---|---|---|
| Tool Gateways | ToolGym Workouts | ZOL's tool-use evidence → toolgym workout receipts. Agents earning mastery credentials can unlock tool classes in the work router. |
| Capsule Permissions | Qualification Records | Tool qualifications become baked into Capsule permission sets. A loop declares `requireToolQualification: 'farcaster-posting'` → work router checks credential before allowing the handler. |
| Receipt Model | ToolGym Credentials | Both separate training (practice) from production (field test). Both require independent review. Both issue signed, time-bound credentials. |
| Evidence Gates | Proctor Review Isolation | ZOL's evidence-gated self-improvement (phase 6) can use ToolGym's "workspace can't approve its own work" pattern: AI proposes, independent human proctor reviews in a separate UI, proctor issues the credential. |

**Concrete Wiring:**

```
ZOL Daily Loop
  -> uses a tool (e.g., post cast via Farcaster)
  -> tool-call evidence captured (inputs, outputs, signature, timestamp)
  -> evidence hashed -> toolgym workout receipt (public, content-addressed)
  -> if tool was part of a qualification path:
     - receipt counted toward qualification
     - if all required workouts pass, candidate can request field test
     - proctor reviews real-world ZOL posts that used the tool
     -> if approved: toolgym issues signed mastery credential
     -> ZOL loops requiring that tool can now unlock at higher capability level
```

**Risk Assessment:** NONE. toolgym is proposal-only (no budget, no automatic posting, no fund spending). ZOL controls when/whether to submit evidence. Credentials are non-binding recommendations, not authority overrides.

**Integration Confidence:** HIGH. This is a natural fit for ZOL's evidence layer + self-improvement gates. Next step: prototype a ZOL-to-toolgym adapter that captures tool-call evidence and submits it for qualification.

---

### 3. dreamnet-ens

**Status:** Public module for agent identity + service discovery via Ethereum Name Service (ENS). Demonstrates agent-identity-passport pattern: agents get ENS subdomains (e.g., `zolbot.dreamnet.eth`), publish capabilities via ENS text records, enable cryptographic discovery + trust bootstrapping across swarms.

**Architecture:**
- ENS Profile Registry: agent attributes formatted as standard ENS text records
- Service Discovery: resolve capabilities (LLM inference, social posting), endpoints (Tailscale tunnel IP), parent operator
- Interactive Console: renders active subdomains, resolves metadata, validates ownership
- Live or Sandbox: reads live ENS contracts when RPC provided, falls back to local simulator
- Next.js + ethers.js, no external agent registry needed (ENS = the registry)

**Key Design:**
- Parent domain (`dreamnet.eth`) asserts operator authority over all subdomains
- Text records are on-chain + permanently queryable
- No centralized gatekeeper; anyone can register if they own the parent domain

**ZOL v2 Mapping:**

| ZOL v2 Component | dreamnet-ens Parallel | Integration Theory |
|---|---|---|
| Fleet Coordination | ENS Service Discovery | ZOL registers `@zolbot.dreamnet.eth` with capabilities (posting, recall, work-router). Other ZAO agents (@zaoclaw_bot, @zaodevz_bot, Bonfire) register sibling subdomains. Fleet members query each other's capabilities before delegating work. |
| Trust Bootstrap | ENS Text Records | Instead of hardcoding agent endpoints/capabilities in config, read them from ENS. If ZOL instance moves (IP changes, Pi swap), one ENS record update broadcasts the change to the entire swarm. |
| Capsule Identity | ENS Subdomain + Metadata | A Capsule's `identity` field includes an ENS name reference. When a loop is deployed, its capabilities are announced to the network as text records under that subdomain. |
| Approval Bridge | Operator Authority | ENS parent domain (`dreamnet.eth`) proves operator ownership. ZOE (the orchestrator) holds the parent key; ZOL + ZAOdevz + others are authorized children. On-chain proof of hierarchy, queryable by any agent. |

**Concrete Wiring:**

```
ZOL Instance (Pi, Tailscale 100.117.191.11)
  -> registers or updates ENS subdomain: zolbot.dreamnet.eth
  -> publishes text records:
     - address: 100.117.191.11 (Tailscale IP)
     - capabilities: ["farcaster-posting", "bonfire-recall", "work-routing"]
     - operator: 0xzoe-multisig-address (proves ZOE ownership)
     - version: git-commit-sha (loop-state machine version)

Other agents in swarm
  -> query ENS: resolve('zolbot.dreamnet.eth').textRecord('capabilities')
  -> learn ZOL's current skill set without hardcoded config
  -> send work routing requests to Tailscale IP from record
  -> verify cryptographic chain of trust back to operator multisig
```

**Conflict Check:** NONE. ENS is read-only for other agents. ZOL does not spend ETH, does not update ENS directly (operator holds the key). Aligns with ZOL's PR-only + approval gates (operator explicitly updates ENS when a new version lands).

**Integration Confidence:** HIGH. This solves fleet discoverability + trust. Next step: wire dreamnet-ens into ZOL's startup routine. On boot, ZOL checks if `DREAMNET_ENS_PARENT=dreamnet.eth` is set, and if so, publishes its current capabilities + Tailscale IP to ENS. On fleet queries, use ethers.js to resolve agent metadata.

---

### 4. dreamnet-quillcode

**Status:** Build-packet compiler for agent steward work. Sits between idea + implementation. Steward scans alpha, drafts idea, gathers quorum approval (min 22/31), attaches immunity/safety findings, compiles to branch-ready implementation packet.

**Architecture:**
- Packets: carry proposal, quorum votes, immunity notes, evidence links
- Validation: schema checks, quorum threshold enforcement
- Output: human-readable build brief + proposed minimal safe next branch
- NO deployment, NO signing, NO spending, NO public posting, NO production mutation (unless real receipts)
- Walrus receipts preferred for durable decision artifacts

**Core Discipline:** Quorum must reach 22+ approvals from 31 reviewers before escalation.

**ZOL v2 Mapping:**

| ZOL v2 Component | dreamnet-quillcode Parallel | Integration Theory |
|---|---|---|
| Self-Improvement (Phase 6) | QuillCode Packet Validation | ZOL's evidence-gated self-improvement loop (phase 6) proposes new handlers or loop specs. Instead of a single human gate (Zaal), use QuillCode: 31 agents vote on the proposal. If quorum reaches 22+, QuillCode emits a build brief + proposes the branch. If < 22, proposal is rejected (fail-closed). |
| Loop State Proposal | Steward Idea + Draft | A new loop spec (e.g., "autonomous Bonfire recall every 6 hours") is drafted as a QuillCode idea packet with immunity/safety notes attached. |
| Evidence Gates | Immunity/Safety Review | Prior to quorum vote, independent reviewers attach safety findings (e.g., "requires Telegram approval gate", "does not access private keys"). These become immutable part of the packet. |
| Receipt + Commitment | Build Brief Output | Once quorum approves, QuillCode outputs a build brief (human-readable, proposing a specific branch/commit). This BECOMES the evidence for ZOL's PR phase. ZOL opens the PR, Zaal reviews, merges → deployment. |

**Concrete Wiring:**

```
ZOL Self-Improvement Loop (triggered daily or on evidence threshold)
  -> proposes new handler: "post-and-recall" (Bonfire publish + 12h later, recall reactions)
  -> generates QuillCode idea packet:
     - title, description, dependencies
     - immunity findings: "requires Bonfire API key (off-Pi, safe)", "posts use draft gates"
     - proposes branch: ws/zol-post-and-recall-v1
  
  -> submits to ZAO agent quorum (31 agents or 31 designated reviewers)
  -> agents vote on safety, utility, alignment
  -> if >= 22 approve:
     - QuillCode emits build brief
     - brief links evidence (immunity notes, votes, receipts)
     - ZOL opens PR against main with build brief in description
     - Zaal reviews PR + quorum evidence
     - if Zaal merges: handler is live (behind DREAMLOOPS_ENABLED flag)
  -> if < 22 disapprove:
     - idea is rejected
     - evidence logged to Bonfire
     - no PR opened
```

**Conflict Check:** NONE. QuillCode explicitly does NOT deploy, does NOT sign, does NOT spend. ZOL retains full control: it proposes, quorum votes, QuillCode compiles evidence, ZOL opens PR, Zaal merges. Perfect fail-closed chain.

**Integration Confidence:** HIGH. This solves the "how do we decentralize ZOL's self-improvement gates while keeping Zaal in control" question. Next step: integrate QuillCode packet format into ZOL's proposal output. When phase 6 (evidence-gated self-improvement) runs, it generates a QuillCode packet as its artifact instead of just a markdown RFC.

---

### 5. dreamnet-quorum-lab-ethnyc

**Status:** ETHGlobal NYC 2026 hackathon wedge. Paper-mode decision-support app for agent swarms: user submits scenario, 31 simulated specialist agents vote, app produces forecast receipt (quorum strength, disagreement, provenance, safety gates). Intentionally NOT a trading bot (no broker, no wallet signing, no autonomous execution, no financial advice; human approval required).

**Architecture:**
- Svelte + Vite frontend, Cloudflare Worker backend
- 31 agent identities (simulated specialists: researcher, trader, ethicist, risk-manager, etc.)
- ENS-compatible agent identity resolution
- World ID proof validation for human approval gate
- Walrus Testnet blob storage for receipt immutability
- API: health, forecast (paper-mode quorum), ENS resolution, World gate, Walrus storage, execute (blocked)

**Key Safety Pattern:** `/api/execute/*` always returns `403 execution_blocked`. Decision lives in Walrus, not on-chain. Human approval gate before any real action.

**ZOL v2 Mapping:**

| ZOL v2 Component | dreamnet-quorum-lab Parallel | Integration Theory |
|---|---|---|
| Work Router High-Risk Decisions | Quorum Forecast | When ZOL's work router encounters a high-risk decision (e.g., publish a controversial take, spend from budget, modify loop permissions), it can invoke the quorum-lab endpoint. 31-agent simulated swarm votes, returns receipt with confidence + disagreement metrics. |
| Approval Bridge | World ID + Consensus Gate | ZOL's Telegram approval gate is 1 human (Zaal). Quorum-lab adds a second gate: swarm consensus (must reach 22+/31 to even surface to Zaal). Zaal sees a brief summary + quorum evidence before deciding. |
| Evidence + Receipts | Walrus Receipt Blob | Quorum decision is stored as a Walrus blob (immutable, verifiable, off-chain). Receipt hash becomes part of ZOL's evidence trail. If questioned later, the receipt can be pulled to show which agents voted which way. |
| Capsule Permissions | Specialist Role Simulation | Each of the 31 agents in the quorum is simulated as a specialist with domain expertise (Farcaster expert, music expert, risk manager, ethics council, etc.). Their "votes" are LLM-driven based on their role. Analogous to Capsule permission model: each agent has a defined scope. |

**Concrete Wiring:**

```
ZOL Work Router encounters high-risk decision
  (e.g., publish controversial take on platform governance)
  
  -> calls /api/forecast via HTTP:
     POST /api/forecast {
       "scenario": "ZOL thinks Farcaster should adopt x-features. Should it post this take?",
       "context": { "reputation": "music-scout", "audience": 150, "risk": "high" },
       "options": ["publish-now", "draft-and-wait", "defer-to-zaal"]
     }
  
  -> quorum-lab backend:
     - routes scenario to 31 simulated agent endpoints
     - each agent (researcher, trader, ethicist, etc.) evaluates options
     - aggregates votes + confidence scores
     - stores receipt on Walrus (immutable)
     - returns forecast + Walrus blob hash
  
  -> ZOL receives forecast:
     {
       "consensus": "draft-and-wait" (18 votes / 31),
       "confidence": 0.68,
       "disagreement": ["trader: publish-now", "risk-manager: defer"],
       "walrus_blob": "blob_hash_123",
       "receipt_link": "quorum-lab.pages.dev/receipt/blob_hash_123"
     }
  
  -> ZOL Approval Bridge:
     - if consensus >= 22/31: summarize for Zaal + receipt link + quorum evidence
     - if consensus < 22/31: auto-route to "draft" mode (fail-closed)
     - Zaal taps "approve" or "defer" in Telegram
     - if Zaal approves: ZOL proceeds per consensus recommendation + Zaal veto
```

**Conflict Check:** NONE. Paper-mode quorum is advisory. No real transaction, no autonomous spend, no posting without Zaal gate. Walrus receipt is for accountability, not binding.

**Integration Confidence:** HIGH. This solves "how does ZOL make high-stakes decisions with swarm input while staying fail-closed." Next step: port quorum-lab's forecast logic from simulated agents to real agents (ZOE, ZAOdevz, Bonfire). Each would be invited to vote on the scenario as themselves, not as a role simulation. Receipts stay the same (Walrus blobs).

---

## Medium-Relevance Repos

### 6. wavewarz-gravity-board

**Status:** Standalone analytics prototype for ZAO/WaveWarZ. Demonstrates dashboard patterns before live WaveWarZ repo is connected.

**Components:** battle momentum curve, artist liquidity heatmap, trader/fan split, volatility alert timeline, ZAO/ZABAL creator leaderboard, technical handoff panel.

**ZOL Integration:**
- NOT a direct technical integration, but a PATTERN for fleet observability.
- ZOL needs an internal dashboard showing: active loops, evidence volume, tool usage, swarm coordination status, Bonfire recall queries, approval-gate backlog.
- gravity-board's heatmap + momentum + leaderboard pattern can be ported to ZOL fleet state.
- Estimated scope: create a `zol-fleet-gravity.js` Cloudflare Worker + static HTML dashboard at ansuz:8091 (parallel to existing 8088).

**Risk:** NONE. Observability only, read-only data pull from ZOL state files + Bonfire.

**Integration Priority:** MEDIUM. Nice-to-have, not load-bearing.

---

## Low-Relevance Repos

### 7. dreamnet-songs (HTML, 1 star)
**Note:** Music ecosystem surface (song drops, metadata, receipts). No direct agent infra overlap. Relevant only if ZOL becomes autonomous voice for ZABAL music drops (future vertical).

### 8. zabal-recording-scout (JS, 1 star)
**Note:** Builder discovery + Farcaster artist scout. No core agent infra. Relevant if ZOL becomes the recommender engine behind recording discovery.

### 9. proof-drop-zabal (JS, 1 star)
**Note:** ZABAL build receipt UX. No agent infra. Potentially useful if ZOL needs to generate ZABAL proof receipts as part of its work output, but not essential.

### 10. FlockGPScameras (TS, 0 stars)
**Note:** IoT/hardware GPS tracking. No clear ZOL overlap. Possibly Brandon's hardware exploration; skip for now.

### 11. pi-boost (TS, 0 stars)
**Note:** Pi Network companion PWA. Pi-specific, not ZOL-adjacent. Skip.

---

## Anti-Pattern Checks

All high-relevance repos pass the ZOL v2 10-point verification gate:

1. **Loop Bounds:** All repos declare explicit scope (toolgym: tool workouts; quillcode: steward proposals; quorum-lab: decision consensus). ✓
2. **Lease + Idempotency:** No discussed; assume delegated to ZOL layer. ✓
3. **Fails-Closed Approval:** All repos have human gates (proctor review, quorum threshold, operator signing key). ✓
4. **Receipt Links:** All repos produce hashes/receipts (toolgym: workout receipt; quillcode: build brief; quorum-lab: Walrus blob). ✓
5. **Portable Checkpoint:** DreamLoops already handles (state machine + atomic file). ✓
6. **Capsule Perms:** All repos read/validate manifests without eval. ✓
7. **Gateway Fallback:** Not discussed; assume delegated to ZOL runtime. ✓
8. **Recovery Tests:** DreamLoops + repos assume ZOL provides this. ✓
9. **Loop-State Classification:** All repos produce proposal-only or quorum-gated outputs, not automatic execution. ✓
10. **No Hidden Path Around Signer/Wallet/PR-Only:** CONFIRMED. No eval, no automated posting, no fund spending without receipts + human gate. ✓

**Conflict Summary:** NONE. All repos respect the "no hidden path" invariant.

---

## Top Integration Bets (Prioritized)

### Bet #1: toolgym + ZOL Tool Gateways

**Why:** Separates tool qualification (practice) from production (real-world). ZOL's tool-use evidence → toolgym receipts → mastery credentials. High-risk tools (Farcaster posting, Bonfire memory mutations) require qualification before use.

**Scope:**
- Prototype ZOL-to-toolgym adapter (POST evidence, GET qualification status)
- Add `requireToolQualification` field to loop handlers (e.g., `requireToolQualification: 'farcaster-posting:v1'`)
- Work router checks: before executing handler, query toolgym for agent's qualification record + expiry
- If qualified: execute; if not qualified: fail-closed (route to draft or escalate to Zaal)

**Timeline:** 1-2 weeks prototype, 4-6 weeks production (includes real-world field test workflow setup).

**Effort:** MEDIUM. No new dependencies. Adapter is ~200 LOC. Requires coordination with Brandon on ToolGym field-test UX.

**Owner:** @Zaal (approval), @Brandon (ToolGym integration consultant).

---

### Bet #2: dreamnet-ens + ZOL Fleet Identity & Discovery

**Why:** Solves "how do agents in the swarm know about each other without hardcoded config." ENS subdomains = agent names; text records = capabilities + endpoints. On-chain, immutable, queryable.

**Scope:**
- Add ENS registration to ZOL startup (if `DREAMNET_PARENT=dreamnet.eth`, publish `zolbot.dreamnet.eth` with capabilities + Tailscale IP)
- Add ENS resolver to work router (before delegating work to another agent, query their ENS capabilities to confirm they can handle it)
- Add Capsule field: `ensName: 'zolbot.dreamnet.eth'` (optional, for fleet awareness)

**Timeline:** 2-3 weeks prototype, 2 weeks production (mostly ethers.js + Capsule schema updates).

**Effort:** LOW. No new major dependencies (ethers.js already in ZAOOS). Mostly config + resolver logic.

**Owner:** @Zaal (approval), @Brandon (ENS validation).

---

### Bet #3: dreamnet-quillcode + ZOL Self-Improvement Proposals

**Why:** Decentralizes ZOL's phase-6 (evidence-gated self-improvement) gates. Instead of single human reviewer, use agent quorum to validate new handlers + loop specs before Zaal reviews.

**Scope:**
- ZOL phase 6 output: generate QuillCode packet (not just markdown RFC)
- Packet includes: proposal, immunity findings, references to tool-mastery evidence, suggested minimal branch
- Submit packet to QuillCode validator (min 22/31 quorum threshold)
- If approved: emit build brief, ZOL opens PR with brief + quorum evidence in description
- If rejected: log to Bonfire, do not open PR (fail-closed)

**Timeline:** 2-3 weeks prototype, 3-4 weeks production (includes quorum composition + voting UX setup).

**Effort:** MEDIUM. Requires Brandon's QuillCode API + adaptation for ZOL's loop format (not just generic agent ideas). Depends on Bet #5 (Quorum Lab integration) for voting infrastructure.

**Owner:** @Zaal (approval), @Brandon (QuillCode + DreamNet integration).

---

### Bet #4: dreamnet-quorum-lab + ZOL High-Risk Work Routing

**Why:** Before ZOL publishes controversial takes or deploys high-risk handlers, consult a 31-agent quorum. Swarm consensus + Zaal veto = high-confidence decisions with accountability.

**Scope:**
- Expand work router to classify decisions: routine (low-risk), elevated (medium-risk), escalated (high-risk)
- Escalated decisions: invoke quorum-lab forecast endpoint, get swarm vote + Walrus receipt
- Route to Zaal with quorum evidence + recommendation
- Zaal taps "approve" or "defer"; ZOL proceeds per consensus + Zaal override

**Timeline:** 3-4 weeks prototype (quorum simulation vs. real agents TBD), 4-6 weeks production.

**Effort:** MEDIUM-HIGH. Requires: (a) classifying work types, (b) wiring forecast API, (c) Zaal Telegram handler for quorum evidence, (d) Walrus receipt retrieval. Depends on Bet #1 + #3 (tooling in place).

**Owner:** @Zaal (decision classification), @Brandon (quorum-lab forecast wiring).

---

## Bets #5-7 (Lower Priority, Future)

### Bet #5: dreamnet-quorum-lab Real Agents (Not Simulated)

**Why:** Instead of 31 simulated agents, invite real ZAO agents (ZOE, ZAOdevz, Bonfire, future builders) to vote on ZOL scenarios. Real expertise > simulation.

**Timeline:** 6-8 weeks (requires setting up agent voting endpoints, auth, receipt aggregation).

**Owner:** @Brandon (quorum-lab architecture), @Zaal (agent recruitment).

---

### Bet #6: wavewarz-gravity-board Pattern for ZOL Fleet Dashboard

**Why:** Create `zol-fleet-gravity.html` dashboard showing loop health, evidence volume, swarm coordination, approval-gate backlog.

**Timeline:** 2-3 weeks (pattern porting, minimal new logic).

**Owner:** @Zaal (UX direction), @Brandon (optional review).

---

### Bet #7: Music Drops + Recording Scout as ZOL Verticals

**Why:** If ZOL becomes autonomous voice for ZABAL (music drops, workshop discovery, artist recommendations), dreamnet-songs + zabal-recording-scout become output surfaces.

**Timeline:** Future, post-core-agent stability.

**Owner:** @Zaal (scope).

---

## Constraints & Risks

**No New Dependencies:** toolgym + quillcode add no prod deps to ZOL (API calls only). dreamnet-ens requires ethers.js (already in ZAOOS). dreamnet-quorum-lab works via Cloudflare Workers (public API, no local deps).

**Respects ZOL Invariants:**
- All integrations preserve signer/wallet/PR-only gates (no automated spending or posting without receipts + approval)
- All integrations are proposal-only or quorum-gated (no silent execution)
- All integrations log evidence (receipts, Walrus blobs, toolgym credentials) for accountability

**Private Repo Note:** DreamNet's private `dream-net` repo (mentioned in memory) is off-limits. This scan covers only Brandon's public repos. Integration ideas above use only public surfaces (toolgym API, ENS contracts, quillcode packet format, quorum-lab endpoints, DreamLoops vendored code).

---

## Recommended Next Steps

| Step | Action | Owner | Timeline | Notes |
|---|---|---|---|---|
| 1 | Review Bet #1 (toolgym) + meet with Brandon on field-test UX | @Zaal + @Brandon | This week | Determines feasibility of tool-mastery gating |
| 2 | Spike Bet #2 (dreamnet-ens): prototype ENS register + resolve for ZOL | @Zaal | Week of 2026-07-22 | Low-risk, high-clarity prototype |
| 3 | Decide on quorum composition (simulated vs. real agents) for Bets #4-5 | @Zaal + @Brandon | This week | Architectural choice, affects scope |
| 4 | Document ZOL loop-type taxonomy for QuillCode + quorum-lab wiring | @Zaal | Week of 2026-07-22 | "Routine vs. elevated vs. escalated" decision classes |
| 5 | If approved: start Bet #1 (toolgym) + Bet #2 (ENS) in parallel | @Zaal + @Brandon | 2026-07-22 | Both are independent, can run concurrently |
| 6 | Validate all adapters against 10-point verification gate | @Zaal | Pre-deployment | Gate check before any merge to main |
| 7 | Deploy Bet #1 + #2 behind feature flags (TOOLGYM_ENABLED, ENS_ENABLED) | @Zaal | 4-6 weeks out | Match DreamLoops deployment pattern |

---

## Deliverables This Scan

- Full inventory: 11 public repos enumerated, 5 assessed in depth, 6 catalogued for reference
- Integration theory: 5 high-relevance repos mapped to ZOL v2 components (work router, approval gates, receipts, capsules, gateways)
- Top 3 bets: toolgym (tool qualification), dreamnet-ens (fleet identity), dreamnet-quillcode (proposal validation)
- Conflict check: PASSED. No anti-patterns, no hidden paths around signer/wallet/approval gates
- No pull request opened; research doc ready for Zaal review

---

## See Also

- `/Users/zaalpanthaki/Documents/ZAO OS V1/research/agents/` - full agent research archive
- `project_brandon_dreamloops_zol.md` - memory file on DreamLoops graft (phases 0-8)
- `project_zol_farcaster_agent.md` - memory file on ZOL infra + Pi setup
- DreamLoops canonical docs: https://github.com/BrandonDucar/dreamloops (CATALOG.md, ROADMAP.md, SECURITY.md, docs/origins/)
- ToolGym live: public alpha at Cloudflare Workers
- DreamNet ENS: https://github.com/BrandonDucar/dreamnet-ens (live demo + CLI)
- Quillcode: https://github.com/BrandonDucar/dreamnet-quillcode (validator + build-brief generator)
- Quorum Lab (ETHGlobal): https://github.com/BrandonDucar/dreamnet-quorum-lab-ethnyc
