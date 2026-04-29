---
topic: agents
type: decision
status: research-complete
last-validated: 2026-04-29
related-docs: 506, 507, 548, 555
tier: STANDARD
---

# 559 - Wetware (`ww`): P2P OS for Autonomous Agents

> **Goal:** Decide whether `wetware/ww` (P2P OS, capability-based security, libp2p + Cap'n Proto + WASM) belongs in ZAO's agent stack alongside QuadWork / ECC / 1code.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Adopt `ww` as a runtime for ZAO agents (ZOE, VAULT, BANKER, DEALER, etc.) | **NO** | 16 stars on GitHub. Rust-only. ZAO is TypeScript/JavaScript-native. Adoption cost > current ceiling, even though the architecture is interesting. |
| Track as a research signal for "where capability-based security + agent meshes are heading" | **YES** | Niche but coherent: WASM agents + capability tokens + libp2p + Cap'n Proto. If multi-agent ZAO ever needs sandbox isolation across machines, this is a reference design. |
| Lift the **capability-based security pattern** as a design check for ZAO agents | **YES, AS DESIGN PRINCIPLE** | "Replaces ambient authority with capability-based security" maps cleanly to ZAO agent budgets (memory `feedback_no_unsolicited_features` + autonomous trading). Use as a code-review checklist item. |
| Adopt the membrane / epoch-scoped capabilities pattern for ZAO agent token-spend limits | **CONDITIONAL** | If we re-architect agent budgeting (`x402` skill is a closer fit; see Doc 555 follow-up), revisit. Otherwise hold. |
| Replace QuadWork / 1code with `ww` | **NO** | Wrong layer. `ww` is an agent runtime, QuadWork/1code are dev orchestrators. Different problems. |

## What `ww` Is (Verified 2026-04-29)

| Field | Value |
|---|---|
| Repo | `github.com/wetware/ww` |
| Description | "P2P operating system for autonomous agents" |
| Language | Rust (96.9%) |
| Stars | **16** |
| Total commits | 916 |
| License | Not stated in fetched content |
| Install | `curl -sSL https://wetware.run/install \| sh` |
| Platforms | Linux/Unix + container (Podman/Docker) |

### Architecture

- **Sandboxed WASM agents** running on `wasm32-wasip2` target
- **Capability-based security** - no ambient authority; each agent gets explicit capability tokens
- **Cap'n Proto RPC** - typed serialization, low overhead
- **Membrane system** - "epoch-scoped capabilities" (capabilities expire per epoch boundary)
- **Glia shell** - Clojure-inspired language with first-class capabilities, used to orchestrate
- **Cell modes**:
  - `vat` - RPC service mesh
  - `raw` - libp2p streams
  - `HTTP/WAGI` - HTTP request handling

### Networking Stack

- libp2p swarm (port 2025)
- IPFS via Kubo
- Cap'n Proto for the RPC layer

## Why It's Interesting (Even Though We Won't Adopt)

ZAO has agents (ZOE, VAULT, BANKER, DEALER, ROLO + more per memory `project_agent_squad_dashboard`) that increasingly need:

1. **Sandbox isolation** - so a misbehaving agent can't drain wallets
2. **Token / budget caps** - per memory `feedback_no_unsolicited_features` + autonomous-trading guards
3. **Cross-machine deployment** - VPS 1 + Mac dev + future infra
4. **Auditability** - what did each agent do, with what authority

`ww` is a coherent answer to all four, just in the wrong language for us.

## Pattern Lifts (No Code, Just Principles)

### Pattern 1 - Capability tokens > ambient authority

**Today:** ZAO agents inherit env vars (`ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`). Any agent can do anything within its env.

**`ww` pattern:** Each agent gets a *capability token* describing what it can do (e.g. "post to Telegram channel X", "read Supabase table Y"). Capabilities expire per epoch.

**ZAO application:** in `src/lib/agents/runner.ts`, wrap agent calls in a capability shim that injects only the env vars needed. Reject capability requests that exceed budget. Skill: `/security-review` from ECC catches absent capability checks.

### Pattern 2 - Membrane / epoch boundary

**Today:** ZAO agents run continuously; budget is checked per call.

**`ww` pattern:** Capabilities live for one epoch (e.g. 1 hour, 1 day). Renewal requires explicit grant.

**ZAO application:** ZOE / VAULT / BANKER / DEALER could rotate capability tokens daily. After 24h, agent must re-request from a Head agent. Aligns with QuadWork's Head-Dev-Reviewer pattern (Doc 555).

### Pattern 3 - WASM as the agent boundary

**Today:** ZAO agents run as Node processes inheriting full host access.

**`ww` pattern:** Agents are WASM modules. Host controls every syscall via WASI capabilities.

**ZAO application:** **defer.** WASM-ifying TypeScript agents is a major refactor and the security gain is offset by the operational complexity. Watch wasm32-wasip2 ecosystem maturity.

## Why ZAO Picks Different Tools

| ZAO need | Tool we use | Why not `ww` |
|---|---|---|
| Multi-agent dev squad | QuadWork v1.12.0 | Different layer (dev orchestration, not agent runtime) |
| Code generation by agents | Claude Code CLI | Different layer |
| Agent budget enforcement | `x402` skill (per `everything-claude-code:agent-payment-x402`) | Solves the same budget problem in our stack |
| Cross-machine deploy | VPS 1 + Cloudflare Tunnel | Existing infra; `ww`'s libp2p mesh is overkill for 1-VPS setup |
| Sandbox isolation | Vercel Functions (per route) + RLS (per row) | Adequate for current scale |

## Risks (If We Did Adopt)

| Risk | Severity |
|---|---|
| Rust skill gap on the team | High |
| 16-star repo - bus factor unknown | High |
| No license - cannot redistribute / fork safely | High |
| WASM agent toolchain still maturing | Medium |
| `wasm32-wasip2` target is recent (2025+) | Medium |

## Action Bridge

| Action | Owner | Type | By When |
|---|---|---|---|
| Add capability-token check to `src/lib/agents/runner.ts` review checklist | Zaal | Code-review item | This sprint |
| Document `x402` skill as canonical agent-budget tool (closer fit than `ww`) | Zaal | Memory or skill note | This week |
| Re-check `wetware/ww` star count + license + activity quarterly | n/a | Calendar | 2026-07-29 |
| If `ww` ever ships TS bindings or hits 1K stars, re-open this doc | n/a | Conditional | n/a |

## Also See

- [Doc 506 - TRAE skip](../../dev-workflows/506-trae-ai-solo-bytedance-coding-agent/) - canon agent-stack picks
- [Doc 555 - Agent harness shootout](../../dev-workflows/555-agent-harness-shootout/) - sister doc on dev-orchestration layer
- [Doc 548 - Lazer Mini Apps CLI](../../farcaster/548-lazer-miniapps-cli-evaluation/) - shares "skill ships source" pattern, different layer
- `everything-claude-code:agent-payment-x402` skill - direct fit for ZAO budget needs
- Memory `project_agent_squad_dashboard` - 8+ ZAO agents that would benefit from capability tokens

## Sources

- [wetware/ww on GitHub](https://github.com/wetware/ww) - 16 stars, 916 commits, Rust 96.9%, no license stated, last fetched 2026-04-29
- [wetware.run install endpoint](https://wetware.run/install) - one-line install
- libp2p, Cap'n Proto, IPFS Kubo - all referenced as deps in fetched content

## Staleness Notes

Niche project at 16 stars. Re-validate quarterly. If activity stalls, mark as superseded by whatever capability-OS pattern wins.
