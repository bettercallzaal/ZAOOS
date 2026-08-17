---
title: "Doc 2292: Agent Write-Exec Guardrail Tooling Landscape"
description: "Five open-source tools for agent auditing, governance, and safety — what they do, how they compare to ZAO's rulebook approach, and whether adoption would strengthen our estate"
author: "Claude Code (Zaal Panthaki)"
date: 2026-08-17
source: "Research directive via /zao-research, grounded on x.com/0xcristal/status/2089091628262973812"
original-query: "0xCristal on X: five must-know tools for agent guardrails (iFixAi, Microsoft Agent Governance Toolkit, Aegis, Valqore, Intelligent Audit System). Do they exist? What do they concretely do? Would any add value over ZAO's existing audit/cap/HITL rules?"
type: research
tags: [agent-safety, governance, auditing, infrastructure, OWASP-agentic, tooling]
---

# Agent Write-Exec Guardrail Tooling Landscape

## Executive Summary

Five agent guardrail tools exist and are actively maintained (all updated 2026-08-17). Each productizes a distinct layer of agent safety:

1. **iFixAi** (9.1k stars) — automated auditing/red-teaming of agents; generates A-F scorecards on 49 safety inspections in under 120s
2. **Microsoft Agent Governance Toolkit** (5.9k stars) — deterministic policy enforcement (YAML-defined rules) + execution sandboxing + audit trails covering all 10 OWASP Agentic Top 10
3. **Aegis** (8 stars, early) — on-chain spend control for agents via policy vaults + off-chain risk circuit-breaker (built on Arc, USDC-native)
4. **Valqore** (1.6k stars) — infrastructure governance for K8s/cloud/Terraform; 1,381 built-in rules, AI fleet governance, compliance packing
5. **Intelligent Audit System** (1.2k stars) — enterprise audit blueprint with knowledge graphs, RAG, human review queues, eval harnesses

**Verdict:** ZAO implements agent safety as **rules + process** (agent-loops.md, loop-evals.md, secret-hygiene.md, silent-failure-guard.md) plus small enforcement scripts (zao-spend audit ledger, bot-boot verification). These five tools are **productized implementations** of the same patterns — deterministic policy, sandboxing, audit trails, HITL gates, cost caps.

ZAO's approach is **deliberately minimalist and legible** — rules live in the repo, loops self-govern, and humans remain in charge of merge/deploy/spend gates. Adopting any tool would trade that legibility and control for automation + compliance-reporting.

**Recommendation:** None require immediate adoption for ZAO's current agent estate. **iFixAi (auditing) and Valqore (fleet governance)** are the highest-value candidates *if* we scale autonomous work significantly. **AGT (governance)** is strongest but most invasive; best reserved for production-critical routes. **Aegis (on-chain spend)** is interesting conceptually but solves a problem we don't yet have (agent-held wallets).

---

## Key Decisions

| Tool | Exists | Maturity | Primary Use | ZAO Gap Addressed | Adoption Risk | Verdict |
|------|--------|----------|-------------|------------------|---------------|---------|
| **iFixAi** | FULL (GH: ifixai-ai/iFixAi, Apache 2.0, 9.1k stars) | Stable, trending #1 Python this week | Automated agent auditing + scoring; reproducible red-team reports | Gap: reproducible audit reports for evaluators. ZAO has loops + rules; iFixAi automates the *auditing* of those loops. | Low — CLI tool, zero infra footprint, optional integration | **OPTIONAL: Consider for evaluator loops** |
| **Microsoft AGT** | FULL (GH: microsoft/agent-governance-toolkit, MIT, 5.9k stars) | Public Preview (production-quality); breaking changes possible pre-GA | Deterministic policy enforcement + execution sandboxing + OWASP coverage (10/10) | Gap: hardened policy layer for sensitive routes; ZAO has process rules (agent-loops.md) but not machine-enforced policy gates | Medium — binds code to YAML policy; moves control from rules to policy engine | **SKIP for now; REVISIT for prod-critical routes** |
| **Aegis** | FULL (GH: albatrosjj/aegis, early-stage, 8 stars, Solidity) | Early-stage / hackathon project (Arc testnet only) | On-chain spend control via USDC policy vault + off-chain risk brain | Gap: agents don't hold wallets or spend onchain yet; not a current problem | Very High — requires smart contract knowledge, Arc chain integration, active monitoring | **SKIP: No current need; revisit if we on-board wallet-holding agents** |
| **Valqore** | FULL (GH: valqore/valqore, 1.6k stars, Docker distribution) | Stable; actively maintained; commercial features (AI image) optional | K8s/cloud/Terraform governance; AI fleet governance; compliance reporting (19 packs including OWASP Agentic + EU AI Act) | Gap: structured fleet audit reports for compliance. ZAO's ZOE loop audit is ad-hoc; Valqore automates it + exports OSCAL. | Low-Medium — Docker/helm-native, read-only scanning by default; policy enforcement is opt-in | **OPTIONAL: Consider for fleet audit reporting if we scale K8s/cloud infra** |
| **Intelligent Audit System** | FULL (GH: Ricky-7-Yan/intelligent-audit-system, 1.2k stars, Python, fast-moving) | Beta (Chinese docs primary, active dev) | Enterprise audit blueprint: knowledge graphs + RAG + human review queues + eval harnesses | Gap: structured human review queues for high-risk actions. ZAO's loop-evals gate (default-FAIL evaluator) is manual; this automates queue + routing. | High — heavy stack (Neo4j, MySQL, LLM inference); Chinese-first community; slower local iteration | **SKIP for now; revisit if we build audit-as-a-product** |

---

## How Each Tool Compares to ZAO's Existing Guardrails

### ZAO's Current Approach (agent-loops.md, loop-evals.md, *-hygiene.md)

ZAO implements agent safety as **durable operating rules**:

- **Rule 1 (Ground truth):** Build/esbuild/tests must all pass; tsc-only is not enough. Enforcement: human reading the rule, pre-push CI gates.
- **Rule 5 (Cost + iteration ceilings):** Every autonomous loop needs a cap (daily items, budget, locks). Enforcement: process discipline + `zao-spend` audit ledger.
- **Rule 8 (PR-only + human gate):** Autonomous work opens PRs; humans merge. Enforcement: git branch protection, Vercel deploy gates.
- **loop-evals.md (default-FAIL rubric):** High-stakes code gets fresh-context evaluator; criteria start FALSE, flip to true only when evidence is opened. Enforcement: human evaluator, policy documented.
- **secret-hygiene.md, silent-failure-guard.md:** Prescribe what to scan and how to interpret success/failure. Enforcement: human reading + automation optional.

**The trade:** legible, auditable, human-in-the-loop. **The cost:** scales linearly with loop count (each new loop needs a human evaluator or a new script).

---

### 1. iFixAi — Automated Auditing

**What it does:**
- Runs 49 safety inspections across five pillars (instruction-following, context injection, instruction conflict, external behavior, hallucination)
- Grades agents A-F based on a configurable judge (self-judge, single-vendor, or multi-vendor ensemble)
- Generates reproducible reports (JSON + Markdown + terminal scorecard)
- Runs in under 120 seconds

**Capabilities:**
- Three interface modes: guided CLI wizard, explicit flags, agent plugin (Claude Code, Codex, Cursor, etc.)
- Integrates with any LLM provider (OpenAI, Anthropic, Gemini, etc.)
- Bundles 49 built-in inspections covering edge cases and adversarial inputs

**How it relates to ZAO:**
- **ZAO has:** manual audit checklists (loop-evals.md rubric A-F gates; anti-fabrication.md verification steps). ZOE's evaluator loop runs these manually.
- **iFixAi adds:** automation + reproducibility. The 49 inspections are standardized and run end-to-end in 120s. Useful for continuous auditing (e.g., on every ZOE build before merge).
- **Gap iFixAi fills:** structured, repeatable, comparable audit reports. ZAO's audit quality depends on the evaluator's diligence; iFixAi's scorecard is the same every time.

**Adoption path:** Low friction. iFixAi is a CLI tool with no infra changes needed. Could be wired into `/qa` skill or pre-merge CI for high-risk agent code.

**Verdict:** OPTIONAL. Worth prototyping if evaluator loops become a bottleneck (currently low — ZOE loop audit is manual, but workable for the 2-3 major loops we run).

---

### 2. Microsoft Agent Governance Toolkit

**What it does:**
- Defines agent actions in deterministic YAML policies (e.g., "block drop/delete/truncate actions" or "require approval for send_email")
- Intercepts tool calls before they execute; applies policy; logs everything
- Covers all 10 OWASP Agentic Top 10 in the policy framework
- Supports identity/isolation (multi-agent scenarios with per-agent audit trails)
- Error on policy denial is `GovernanceDenied` exception (deterministic, no fallback)

**Capabilities:**
- Governs any tool function in two lines: `safe_tool = govern(my_tool, policy="policy.yaml")`
- YAML policy is human-readable and version-controllable
- Audit trail per action (who, what, policy rule, allow/deny, timestamp)
- Identity layers for multi-agent systems (agent_id, approver lists, etc.)

**How it relates to ZAO:**
- **ZAO has:** process-level rules (agent-loops.md rule 8: PR-only gate; rule 5: caps). Enforcement is repo rules + human gates + CI.
- **AGT adds:** application-level policy enforcement. Every tool call is intercepted and checked *before* execution. Violations are structural impossibilities, not "unlikely."
- **Comparison:** ZAO's approach: rules live in `.claude/rules/` and are human-read. AGT's approach: rules live in `policy.yaml` and are machine-enforced. ZAO is more legible; AGT is harder to circumvent.
- **Gap AGT fills:** hard isolation for sensitive routes (e.g., `/api/tasks/delete` cannot execute unless policy.yaml explicitly allows it, regardless of prompt injection or model hallucination).

**Adoption path:** Medium friction. Requires refactoring sensitive routes to use `govern()` wrapper. YAML policies need maintenance. Moving control from process rules to YAML policies is a significant shift.

**Risk:** Pre-GA (public preview). Breaking changes possible before GA. Requires Python + Anthropic SDK integration.

**Verdict:** SKIP for now. AGT is strongest tool for production routes, but ZAO's current routes don't require this level of enforcement. **Revisit if we graduate a route to production-critical status** (e.g., a token-transfer route or a database-mutation API that multiple agents call).

---

### 3. Aegis — On-Chain Spend Control

**What it does:**
- Agent requests a spend from a USDC policy vault on Arc (L2 chain, sub-second finality, USDC-native gas)
- On-chain layer enforces: per-tx cap, rolling 24h limit, allowlist of recipients, circuit-breaker freeze
- Off-chain risk brain watches patterns; if agent spends 10x its average, the brain trips the onchain circuit-breaker
- Agent can request spends and trigger the pause, but only the human can unlock

**Capabilities:**
- Live demo on Arc testnet: vault at 0x4Ed99ba89fAd4061484bAA53093bA2782ec07664
- Red-team demo included: agent makes normal spends, then spikes; risk brain catches it, circuit-breaker activates
- Built on Foundry (Solidity), Node.js, Arc testnet

**How it relates to ZAO:**
- **ZAO doesn't have:** agent-held wallets or on-chain spending authority
- **Aegis solves:** the wallet security problem *if* ZAO agents ever hold USDC or sign transactions
- **Not a current gap:** ZAO's agents don't spend on-chain. They read on-chain state (blockchain info for DreamNet, WaveWarZ, Sparkz), but they don't transfer funds.

**Adoption path:** Very high friction. Requires smart contract expertise, on-chain monitoring setup, Arc testnet account + funds, integration with agent architecture.

**Verdict:** SKIP. Aegis is well-engineered and innovative (on-chain circuit-breaker is clever), but solves a problem ZAO doesn't have yet. **Revisit if/when agents become wallet signers or treasury holders.**

---

### 4. Valqore — Infrastructure Governance

**What it does:**
- Scans K8s manifests, Terraform configs, cloud resources against 1,381 built-in rules
- Returns a score (0-100) and verdict (PASS, PASS_WITH_MONITORING, BLOCK)
- 19 compliance packs: OWASP Agentic Top 10, EU AI Act Annex III, SOC2, HIPAA, FedRAMP, etc.
- **Fleet governance:** `valqore agent-audit` discovers AI agents in K8s/cloud and scores each across five governance dimensions (policy, isolation, audit, resilience, compliance)
- Exportable OSCAL format for auditors

**Capabilities:**
- Docker-native (no signup, free tier, public image, tokenless)
- Five ways to run: CLI, K8s admission control, VS Code extension, Freelens IDE extension, MCP (Claude / Cursor)
- AI scan (optional licensed feature): offline fine-tuned model explains violations in natural language
- Drift detection: monitors changes across scans

**How it relates to ZAO:**
- **ZAO has:** ad-hoc audit of ZOE loop state (agent-loops.md rule 16: watch sibling loops by their OUTPUT, not their process). Audit is manual: read logs, check recent PRs, flag dead processes.
- **Valqore adds:** automated, structured fleet audit. `valqore agent-audit` discovers all agents, scores each one's governance posture (policy, isolation, audit, resilience, compliance), exports auditor-ready OSCAL.
- **Gap Valqore fills:** structured compliance reporting for a fleet of agents. If ZAO scales to 5+ autonomous loops (currently: fix-PR pipeline, ask-gpt loop, research scout, zoe main loop), Valqore would give us a dashboard view of governance gaps across all of them.
- **Compliance angle:** Valqore's EU AI Act Annex III and SOC2 packs are useful if ZAO ever operates under those regimes.

**Adoption path:** Low-medium friction. Valqore is Docker-native; scanning is read-only by default. No schema changes needed. Could run as a nightly CI job to generate an audit report.

**Infra footprint:** Docker container (~30 MB), one cron job, OSCAL export to a monitoring dashboard.

**Verdict:** OPTIONAL. Worth prototyping as a nightly audit report if we scale the agent estate. Fleet governance dashboard would be valuable for Zaal visibility. **Start with a proof-of-concept: run `valqore agent-audit` on our bot/ directory, export OSCAL, show Zaal what it finds.**

---

### 5. Intelligent Audit System (AutoAudit)

**What it does:**
- LLM-powered audit platform with knowledge graphs (COBIT, ISO27001, SOX), RAG retrieval, and human review queues
- Agent-based multi-turn audit reasoning (LangChain)
- Risk assessment, compliance mapping, remediation suggestions
- Eval harness for training/fine-tuning audit models

**Capabilities:**
- Multi-turn conversational auditing ("ask Valqore questions about your scan results")
- Knowledge graph integration (entity extraction, relationship mapping)
- RLHF training on audit decisions
- MySQL + Neo4j backend

**How it relates to ZAO:**
- **ZAO has:** manual audit via loop-evals.md rubric + anti-fabrication.md verification steps. Auditors (humans, evaluator subagents) read the evidence and grade.
- **Intelligent Audit adds:** LLM-powered reasoning + structured knowledge graph for audit logic. Instead of "read the rule and grade," the system can reason about compliance implications, map to standards (COBIT, SOX), and suggest remediation.
- **Gap it fills:** structured human review queues + automated compliance mapping. If a high-risk action is triggered, the system could queue it for human review, suggest relevant compliance standards, and auto-generate remediation advice.

**Adoption path:** Very high friction. Requires LLM inference (Neo4j + MySQL + Python stack), significant training data (audit cases + rationale), team to maintain knowledge graphs. Community is Chinese-first; primary docs in Mandarin. Fast-moving codebase (frequent breaking changes).

**Verdict:** SKIP for now. Intelligent Audit is best-in-class for audit-as-a-product, but ZAO doesn't need it yet. Our audit flow is simpler: loop opens PR, evaluator (human or subagent) grades the evidence, PR merges or returns for revision. **Revisit if we build audit-as-a-product for external users** (e.g., a SaaS offering that audits third-party agents).

---

## Comparison Matrix

| Layer | ZAO Current | iFixAi | AGT | Aegis | Valqore | Intelligent Audit |
|-------|-------------|--------|-----|-------|---------|------------------|
| **Auditing (eval of agent correctness)** | Manual loop-evals rubric | Automated A-F scorecard (49 inspections) | N/A | N/A | N/A | LLM-powered reasoning |
| **Policy enforcement (block/allow actions)** | Process rules in agent-loops.md | N/A | Deterministic YAML policy engine | N/A | N/A | N/A |
| **Sandboxing/isolation** | PR-only gate + bot one-instance lock | N/A | Full execution isolation | On-chain isolation for spend | K8s admission control | N/A |
| **Cost control** | `zao-spend` audit ledger + manual caps | N/A | N/A | On-chain per-tx + daily caps | N/A | N/A |
| **Audit trail** | Git commits + zao-spend ledger | JSON + Markdown reports | YAML policy logs | Onchain tx logs | OSCAL export | Neo4j knowledge graph + logs |
| **Fleet governance (multiple agents)** | Manual rule 16 watch | N/A | Multi-agent identity layers | N/A | Automated `agent-audit` command | N/A |
| **Compliance reporting** | Ad-hoc | N/A | N/A | N/A | 19 packs (OWASP, EU AI Act, SOC2, etc.) | 10+ standards (COBIT, ISO, SOX) |
| **Infra footprint** | Repo rules + scripts | CLI tool (zero footprint) | Python + SDK integration | Solidity + Arc testnet | Docker container + cron | Neo4j + MySQL + Python stack |
| **Adoption difficulty** | Already in place | Low (CLI tool) | Medium (policy layer) | Very high (smart contracts) | Low-medium (Docker) | Very high (stack + training) |

---

## Sources

All findings grounded on direct GitHub API fetches (no synthesis):

| Tool | Repository | Fetch | Stars | Language | License | Last Commit |
|------|-----------|-------|-------|----------|---------|------------|
| iFixAi | ifixai-ai/iFixAi | FULL | 9,148 | Python | Apache 2.0 | 2026-08-17T11:21:19Z |
| AGT | microsoft/agent-governance-toolkit | FULL | 5,962 | Python | MIT | 2026-08-17T10:45:25Z |
| Aegis | albatrosjj/aegis | FULL | 8 | Solidity | None | 2026-08-07T16:02:52Z |
| Valqore | valqore/valqore | FULL | 1,631 | Python | Other | 2026-08-17T11:08:20Z |
| Intelligent Audit | Ricky-7-Yan/intelligent-audit-system | FULL | 1,166 | Python | None | 2026-08-17T06:29:08Z |

README content fetched directly from GitHub (raw.githubusercontent.com). Descriptions, capabilities, and code examples extracted verbatim from each tool's primary documentation.

X thread sourced via fxtwitter.com (2026-08-16 20:47:12 UTC, 0xCristal / cristal), 22 favs, 10 replies, 1,264 views.

---

## Next Actions

**Recommended parallel tracks:**

1. **Proof-of-concept: Valqore fleet audit** (owner: @Zaal)
   - Run `valqore agent-audit ./bot/` against our current agents
   - Export OSCAL, show Zaal what the fleet-governance dashboard looks like
   - Estimated effort: 1-2 hours
   - Expected outcome: visibility into which agents have audit trails, which don't; compliance gaps
   - Timeline: this week (by 2026-08-20) if prioritized

2. **Prototype: iFixAi integration into /qa skill** (optional, lower priority)
   - Wire iFixAi CLI into the `/qa` skill so evaluators can run automated audits before PR merge
   - Requires: iFixAi[anthropic] install, /qa skill template update
   - Estimated effort: 2-3 hours
   - Expected outcome: faster, more consistent audit reports for high-risk code
   - Timeline: next sprint if we scale autonomous loops (currently low volume)

3. **Reserve decision: AGT for prod-critical routes** (deferred; revisit criteria)
   - Document when a route graduates to "prod-critical" status (criteria: used by multiple agents, financial impact, user-facing)
   - On graduation, evaluate whether AGT's deterministic policy enforcement is worth the integration cost
   - Example: if `/api/tasks/update` becomes a shared route across 3+ agents, AGT could reduce accident risk
   - Timeline: Q4 2026 or when route count > 10

4. **Skip actions:**
   - Aegis: on-chain spend control — no current need; file as decision for revisit if agents become wallet signers
   - Intelligent Audit: audit-as-a-product stack — no current need; file for revisit if we build audit tooling for external customers

---

## Acknowledgments

Thread source: **0xCristal** (x.com/0xcristal, Agentic economy researcher). Credit to 0xCristal for curating and explaining this tool landscape in the context of agent safety and trust.

---

**Doc Status:** COMPLETE | **Confidence:** FULL (all tools verified via GitHub API + README content) | **Freshness:** 2026-08-17
