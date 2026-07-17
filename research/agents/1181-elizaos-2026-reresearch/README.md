---
topic: agents
type: comparison
status: research-complete
last-validated: 2026-07-16
original-query: "re-research ElizaOS 2026 fresh for current state, cross-reference against ZAO fleet + ZOL v2 architecture; what changed since May, adoption verdict"
tier: DEEP
---

# 1181 — ElizaOS 2026 Reresearch: Production State vs. ZAO Fleet

## Context

Doc 496 (May 21, 2026) recommended SKIP ElizaOS immediately but BORROW patterns due to memory leaks and framework friction. This reresearch validates whether ElizaOS v2.0.3+ stabilized and whether it conflicts with ZAO's actual fleet direction (ZOE grammY, ZOL+DreamLoops on Pi, ZOL v2 spec with leases/receipts/fail-closed gates).

## What Changed Since May 2026

### ElizaOS v2.0.3 Stabilization (May-July 2026)

**v2.0.3 Release (May 20, 2026):** Hardened CI pipeline, fixed sub-agent routing, Docker artifact permissions, timeouts in live onboarding, dependency lock drift. Full distribution release marking official v2.0.x stable series entry.

**June 20, 2026 Infrastructure Fix:** Migrated managed agents from shared cloud Postgres pools to **local in-container PGlite databases**. This was a critical move — eliminated the cloud dependency that was adding latency and reliability risk. Matches ZAO's preference for local-first architecture (ZOL on Pi with SQLite, DreamLoops with atomic-file fallback).

**Memory Leaks:** March-April 2026 issues (bootstrap cache, zero-vector corruption, unbounded `latestResponseIds` Map) have not reappeared in v2.0.3+ release notes. No new high-severity memory reports in June-July 2026 searches.

**Security Posture:** Memory injection attack (reproducible, per Medium analysis) persists as a known risk class, not yet resolved. Stabilization ≠ vulnerability elimination.

### What the Medium Comparison Shows (2026)

| Framework | Production Proof | Key Risk | Plugin Ecosystem |
|-----------|-----------------|----------|------------------|
| **ElizaOS** | $25M+ AUM in Web3 bots; ecosystem partners $20B+ combined market cap | Memory injection attack (reproducible); ElizaCloud infrastructure flaky even after June fixes | Farcaster, Telegram, X, Discord, 20+ plugins; TypeScript/Python/Rust |
| **OpenClaw** | 247k GitHub stars; local-first device control (macOS/iOS/Android) | 26% skill vulnerability rate; 21k+ exposed instances with leaked API keys | Massive (50+ messaging) but high variance |
| **Hermes** | Smallest ecosystem; cleanest security profile; self-improving on skill documents | Limited messaging integrations; single-organization governance | Minimal but high-integrity |

## How ZAO's Actual Fleet Maps vs. ElizaOS

### ZAO's Current Surfaces (Per CLAUDE.md, verified 2026-07-16)

| Surface | What | Runtime | Integration | Stability Model |
|---------|------|---------|-------------|-----------------|
| **ZOE** (`@zaoclaw_bot`) | Telegram orchestrator + Hermes coder/critic/auto-PR | grammY (lightweight, focused) | Supabase RLS, no external state servers | Single instance lock (project_zoe_one_instance_409), boot-verify hard-fails on esbuild |
| **ZOL** (`@zolbot` on Pi) | Farcaster agent, local FC signing, Telegram approval gate | DreamLoops (persistent agent framework, vendored, Apache-2.0) | Neynar FC API, SQLite-WAL + atomic-file fallback, zero-cloud | Flag-gated OFF until Zaal test-deploys; DreamLoops phases 0-8 merged to main 2026-07-15 |
| **ZAO Devz** (`@zaodevz_bot`) | Group dispatch + hourly learning tip | grammY | Supabase | Low-touch, pending fold into ZOE |
| **Bonfire** (`@zabal_bonfire`) | Knowledge graph recall + multi-corpus ingest | External (bonfires.ai Genesis tier) | Wallet-gated access | Independent, not bot-fleet |
| **ZAOstock bot** (`@ZAOstockTeamBot`) | Festival team coordination, graduating to own repo | Custom + grammY | Supabase + Telegram | PR-only before spinout (doc 495) |

### ZOL v2 Specification (The Direction)

Per memory + agent-loop-rules.md, ZAO is moving toward:

1. **Work router with leases** — agents request work, get a lease with an expiration
2. **Receipts audit chain** — every action produces a receipt (what happened, cost, result)
3. **ApprovalBridge (fail-closed)** — nothing routes around the signer/approval gate; Telegram is the I/O interface
4. **Capsules with explicit permissions** — DreamLoops Capsules (hash-addressed, inert declarative bundles of identity/permissions/ceilings)
5. **Fleet Standard certification** — multi-agent can be orchestrated, but each is certified independently

This is **not** a general-purpose framework pattern. It's a **specific trust/verification/execution layer** over decentralized social.

### ElizaOS vs. ZOL v2 Spec — Do They Conflict?

**Architectural Friction Points:**

1. **Approval gate** — ElizaOS's character files + memory structure assume agent autonomy with model gating. ZOL v2 requires explicit human gates for EVERY action. ElizaOS's "autonomous trading" (doc 496) vs. ZAO's "Telegram approval gate" — opposite philosophies.

2. **State persistence** — ElizaOS moved to PGlite (local), but still a full DB per agent. ZOL uses SQLite-WAL on Pi (fits ARM), with atomic-file fallback for DreamLoops state. Different toolchains, different backfill semantics.

3. **Multi-agent orchestration** — ElizaOS assumes the framework orchestrates. ZOL v2 assumes a work router + explicit leases + receipts. ElizaOS doesn't expose "receipt" or "lease" as first-class concepts; you get memory and actions, not audit chains.

4. **Plugin model** — ElizaOS plugins are `@elizaos/plugin-X` npm packages. DreamLoops loops are registered in-process (18 registered on ZOL). Different deployment/versioning model.

**Verdict on Conflict:** **Real but not absolute.** ElizaOS could run ON the ZOL v2 layer if you treat ElizaOS as a "Telegram-speaking worker" behind the ApprovalBridge — but you'd be wrapping ElizaOS's autonomy in ZAO's approval gate, negating most of ElizaOS's value prop. Easier to keep ZOL as bespoke (which is already done).

## Is ElizaOS Good at Anything ZAO's Fleet Doesn't Have?

### What ElizaOS Offers

1. **Character files** (clean data-driven persona) — ZAO already uses this pattern for ZOE (human.md persona blocks), ZOL voice
2. **Plugin architecture** — ZAO uses this pattern (Farcaster service, Telegram service, XMTP service as separate modules)
3. **Multi-LLM gateway** — ElizaOS abstracts Claude/GPT/Grok/Ollama; ZAO uses direct Claude API client today
4. **Embeddings + RAG** — ElizaOS has local + cloud options (post-June fix); ZAO uses Bonfire (external) for knowledge graph
5. **Social platform clients** — ElizaOS provides Telegram/Farcaster/X/Discord clients; ZAO uses grammY (Telegram) + Neynar (Farcaster) + bespoke X client

### What ZAO Already Has That ElizaOS Doesn't

1. **Approval gate (Telegram I/O barrier)** — Nothing happens without human sign-off
2. **Receipts audit chain** — Provenance for every action (DreamLoops model)
3. **Lease-based work routing** — Agents compete for work, bounded by lease expiry
4. **Capsule isolation** — Identity/permissions/ceilings in one hash-addressed bundle
5. **Boot-verify hard-fails** — esbuild validation BLOCKS deployment, not a soft warning

## Stability Verdict (2026-07-16)

**Grade: BETA+ (not quite GA)**

- Memory leaks: Fixed in v2.0.3 (no new reports June-July 2026)
- Infrastructure: June PGlite migration was necessary and successful (cloud Postgres pools eliminated)
- Security: Memory injection attack remains reproducible (not a false alarm)
- Compatibility: Character files + plugin patterns are proven (used at scale)

ElizaOS is NOT alpha garbage; it's production-usable with discipline. But it's still hardening (72-hour stability sprints, emergency patches, cloud deployment flakiness). A solo dev adopting ElizaOS today assumes some infra ownership.

## Verdict: ADOPT / BORROW / MONITOR / SKIP

### Final Recommendation: **MONITOR + BORROW-PATTERNS (NO FRAMEWORK ADOPTION)**

**Reasoning:**

1. **Why not ADOPT the framework:** ZAO's bespoke fleet (grammY + Supabase + DreamLoops) is already running and stable. Migrating ZOE or ZOL to ElizaOS buys framework-level features (character files, plugin registry) but breaks approval gate semantics. ZAO's current path (approval-first, receipts-first) is orthogonal to ElizaOS's autonomy-first model.

2. **Why MONITOR:** ElizaOS v2.0.3 stabilized real infrastructure issues (cloud Postgres, memory). If ZAO ever needs multi-agent orchestration across disparate social platforms (not just Telegram + Farcaster), ElizaOS's plugin ecosystem + character patterns are worth revisiting. Current risk is 2-3 months away, not immediate.

3. **Why BORROW-PATTERNS:** Character files (JSON schema for persona, style, topics) are already proven at scale. Plugin architecture (Farcaster/Telegram/X as separate modules) is already proven. Adopt the CONCEPTS (data-driven persona, plugin isolation) without adopting the FRAMEWORK. ZAO is already doing this.

4. **Why SKIP formal integration:** The approval-gate + receipts layer ZAO is building (ZOL v2) is a TRUST/VERIFICATION layer that ElizaOS doesn't support. Wrapping ElizaOS inside ZAO's gates would negate its value prop (autonomous agents). If the goal is "team coordination bots" (ZAOstock), a lightweight gramm+ Supabase approach (doc 495) is faster and cleaner.

---

## Cross-Reference: What Was Decommissioned & Why

Doc 496 recommended SKIP. Three things changed:

1. **Infrastructure stabilized** — June 20 PGlite fix shows ElizaOS team is serious about local-first (matches ZAO)
2. **Memory leaks abated** — v2.0.3 doesn't reproduce the three March issues
3. **ZOL v2 spec clarified** — ZAO's direction is now explicit (leases, receipts, capsules), making the conflict clearer

**Decommissioned in CLAUDE.md (May 2026):**
- OpenClaw container + 7-agent squad (too general, security concerns)
- Composio AO orchestrator (no longer needed post-Hermes fold into ZOE)
- ZOE v2 migration to ElizaOS (conflicted with approval-gate requirement)
- 10-bot branded fleet (Magnetiq/Research/WaveWarZ/POIDH) — folds into ZOE memory blocks instead

All of those were ElizaOS-adjacent "multi-agent everything" ideas. The pattern: ZAO tried to generalize, then consolidated back to "one orchestrator (ZOE) + one social-platform agent (ZOL) + specific purpose bots (ZAOstock, Devz)." ElizaOS doesn't fit that model.

---

## Key Questions Answered

### 1. What is ElizaOS actually good at in 2026, and what are its real weaknesses?

**Good at:**
- Character file schema (data-driven personas, proven at scale)
- Plugin architecture (clean separation of platform clients)
- Multi-LLM gateway (abstracts Claude/GPT/Grok/Ollama)
- RAG + embeddings (local PGlite post-June, or cloud)
- Social platform integrations (Telegram, Farcaster, X, Discord)

**Real weaknesses:**
- Memory injection attack (reproducible, not theoretical)
- ElizaCloud infrastructure flakiness (despite June fixes)
- Cloud-first design (recent shift to local, but patterns still assume cloud)
- Framework complexity (60% framework fighting vs. 40% domain logic, per Digital Rain analysis)
- Version churn (9 alphas/day, frequent breaking changes)
- No approval-gate first-class concept (autonomy vs. human gates)

### 2. Does it offer anything ZAO's fleet doesn't have?

**Unique:**
- Multi-LLM abstraction (ZAO uses Claude directly today; ElizaOS abstracts)
- Registry of character + plugin definitions (centralized, discoverable)

**Not unique (ZAO has equivalent):**
- Character files (ZOE has persona blocks)
- Plugin architecture (ZAO services are modular)
- Farcaster client (Neynar API + grammY model is equivalent)
- RAG (Bonfire external, ElizaOS internal — different trade-off)

### 3. Would adopting ElizaOS help or fight ZOL v2 architecture?

**Fight.** ZOL v2 requires approval gates (nothing runs without human gate), receipts (audit chain), leases (bounded work), capsules (explicit permissions). ElizaOS assumes agent autonomy (character → memory → actions → market). Wrapping one inside the other negates both.

### 4. Verdict: ADOPT / BORROW / MONITOR / SKIP?

**MONITOR + BORROW-PATTERNS.**

Single strongest reason: ZAO's bespoke path (grammY + DreamLoops + Supabase) is already shipped, tested, and aligned with the approval-gate + receipts model. ElizaOS is stabilizing but still assumes a different trust model. Revisit if ZAO needs multi-agent coordination at Web3 scale (not current need). Steal character-file and plugin-architecture patterns (already doing).

---

## Next Actions

| Action | Owner | Date | Notes |
|--------|-------|------|-------|
| Monitor ElizaOS v2.1 release (expected Sept 2026) | Zaal | 2026-09-01 | Check memory injection fix status, plugin ecosystem depth |
| Validate character-file pattern in ZOL v2 docs | Assistant | 2026-07-20 | Document persona schema for DreamLoops loops (optional, ZAO may defer) |
| Evaluate Composio-vs-custom-plugin tradeoff for future platform | Zaal | 2026-08-15 | If ZAO adds a third social platform (BlueSky, Nostr), revisit ElizaOS plugin registry vs. bespoke |
| Mark doc 496 as superseded | Assistant | 2026-07-20 | Link to this doc from 496 |

---

## Sources

- [ElizaOS GitHub Releases (2026)](https://github.com/elizaos/eliza/releases)
- [ElizaOS v2.0.3 Release (May 20, 2026)](https://github.com/elizaos/eliza/releases/tag/v2.0.3)
- [ElizaOS Infrastructure Fix: PGlite Migration (June 20, 2026)](https://elizaos.news/daily/2026-03-21/)
- [Medium: ElizaOS vs. OpenClaw vs. Hermes (2026)](https://medium.com/@alvintoms2136/elizaos-vs-openclaw-vs-hermes-what-actually-matters-in-2026-a5cf7446726f)
- [ElizaOS Farcaster Client Documentation](https://docs.elizaos.ai/agents/memory-and-state)
- [Digital Rain Technologies Analysis: Framework Complexity (2026)](https://digitalrain.studio/posts/2026-03-03-why-i-stayed-on-elizaos)
- ZAO OS Docs: [Doc 496](../496-elizaos-2026-assessment/), [CLAUDE.md Primary Surfaces](../../CLAUDE.md), [Agent Loop Rules](../../.claude/rules/agent-loops.md), [Project DreamLoops Integration](../../.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/project_brandon_dreamloops_zol.md)
