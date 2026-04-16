# 364 -- Multi-Harness Agent Orchestration: OpenClaw + Hermes + Tournament Model

> **Status:** Research complete
> **Date:** April 15, 2026
> **Goal:** Design how ZOE runs multiple agent frameworks (OpenClaw, Hermes, others) side by side, dispatching to whichever is best for each task, with tournament-style competition between harnesses

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Install Hermes alongside OpenClaw** | USE Hermes Agent on VPS alongside existing OpenClaw. Hermes auto-imports OpenClaw settings via `hermes claw migrate`. Different strengths: OpenClaw = broad tool integration (50+ platforms), Hermes = self-improving skills + persistent memory. Run both, let ZOE dispatch |
| **Hybrid architecture** | USE OpenClaw for multi-channel orchestration (Telegram dispatch, cron coordination, GitHub ops) and Hermes for focused execution tasks (research, content, analysis). Best of both per the industry pattern |
| **Tournament model** | USE for high-value tasks: dispatch same task to both OpenClaw agent + Hermes agent, compare results, keep better output. Low cost -- only 2x LLM calls for the same task. $0.01-0.05 per tournament |
| **VPS capacity** | VPS has 8GB RAM, 2 vCPU, 43GB free disk. OpenClaw uses ~1.5GB. Hermes needs ~500MB. Total ~2GB used = 6GB headroom. Plenty for both + more |
| **SKIP ElizaOS for now** | ElizaOS = Web3/blockchain focused but heavier infra (requires separate DB, more config). Revisit if we need token-specific agent behaviors. OpenClaw + Hermes covers our needs |
| **SKIP Mastra/AgentKit** | Mastra = TypeScript agent framework (good but overlaps with our Vercel code). AgentKit = Coinbase wallet SDK (already using Privy). Neither adds enough over OpenClaw + Hermes |
| **ZOE as meta-orchestrator** | ZOE (OpenClaw main agent) becomes the router. Reads task, decides which harness handles it, dispatches, collects result. ZOE doesn't do the work -- she assigns it |

---

## Comparison: Agent Harnesses for ZAO VPS

| Harness | Stars | Self-Improving | Platforms | Memory | Docker | LLM Support | VPS RAM | Security | ZAO Fit |
|---------|-------|---------------|-----------|--------|--------|-------------|---------|----------|---------|
| **OpenClaw** | 345K | NO (stateless per task) | 50+ (Telegram, Discord, WhatsApp, etc.) | SOUL.md + MEMORY.md (manual) | YES (current) | All major + local | ~1.5GB | CVE-2026-25253 (patched) | **KEEP** -- already running, broad integration |
| **Hermes Agent** | 22K | YES (auto skills + memory) | 6 (Telegram, Discord, Slack, WhatsApp, Signal, CLI) | Persistent + FTS5 search + user modeling | YES | All major + OpenRouter 200+ | ~500MB | Cleanest profile, sandboxed | **ADD** -- self-improvement is the killer feature |
| **ElizaOS** | High | Partial (plugin-based) | 5 + blockchain | Plugin memory | YES | Local focus | ~2GB | Memory injection vuln | SKIP -- heavier, Web3-only advantage |
| **Mastra** | Growing | NO | API-only | Custom | N/A | All major | N/A (TypeScript) | Clean | SKIP -- overlaps with Vercel code |
| **Coinbase AgentKit** | Growing | NO | N/A (wallet SDK) | N/A | N/A | All major | N/A | Native x402 | SKIP -- already using Privy |

---

## Architecture: ZOE as Meta-Orchestrator

```
Telegram message from Zaal
    │
    ▼
ZOE (OpenClaw main agent) -- THE ROUTER
    │
    ├── Classify task type:
    │   ├── "research X" → Hermes (self-improving, builds on past research)
    │   ├── "post to Farcaster" → OpenClaw ZOEY (50+ platform integrations)
    │   ├── "send ETH" → OpenClaw WALLET (on-chain ops)
    │   ├── "write a recap" → Hermes (learns your writing style over time)
    │   ├── "check agent status" → OpenClaw ZOE (cron/system ops)
    │   └── "tournament: analyze this" → BOTH, compare results
    │
    ├── OpenClaw agents (existing):
    │   ├── ZOEY — action agent (Farcaster, GitHub, social)
    │   └── WALLET — on-chain ops (wallets, transactions)
    │
    └── Hermes agents (new):
        ├── RESEARCHER — deep research with persistent memory
        ├── WRITER — content creation that learns your voice
        └── ANALYST — data analysis with skill accumulation
```

### Dispatch Logic

```
ZOE receives task:
  1. Classify: is this a COORDINATION task or an EXECUTION task?
  
  COORDINATION (stays with ZOE/OpenClaw):
    - Multi-step workflows
    - Cron scheduling
    - Agent-to-agent delegation
    - Platform-spanning tasks (post to 5 platforms)
  
  EXECUTION (dispatch to best harness):
    - Has this task type been done before? → Check Hermes skills library
    - Is this a creative/analytical task? → Hermes (self-improving)
    - Is this a platform action? → OpenClaw (50+ integrations)
    - Is this high-value? → Tournament (both, compare)
```

### Tournament Mode

For high-value tasks, dispatch to BOTH harnesses:

```
Zaal: "write a newsletter teaser for today's post"

ZOE dispatches to both:
  OpenClaw ZOEY: generates teaser (stateless, no memory of past teasers)
  Hermes WRITER: generates teaser (remembers past teasers, learned voice)

ZOE compares:
  - Which is closer to Zaal's voice? (based on past approvals)
  - Which has better engagement hooks?
  - Send both to Zaal: "Option A (OpenClaw) vs Option B (Hermes)"
  
Zaal picks → winning harness gets +1 score for this task type
Over time, task routing becomes smarter:
  "newsletter teasers → always Hermes (won 8/10 tournaments)"
```

---

## Hermes Installation on VPS

### Step-by-Step

```bash
# SSH into VPS
ssh zaal@31.97.148.88

# Install Hermes (one-line, outside Docker)
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash

# Reload shell
source ~/.bashrc

# Migrate OpenClaw data
hermes claw migrate
# Imports: SOUL.md, MEMORY.md, skills, API keys, messaging config

# Configure LLM (use MiniMax M2.7 -- same as OpenClaw)
hermes model
# Select: MiniMax or OpenRouter

# Launch Hermes (separate from OpenClaw Docker)
hermes
# Runs on CLI, can be backgrounded with screen/tmux

# Or run as Docker container alongside OpenClaw
docker build -t hermes-agent .
docker run -d --name hermes \
  -v ~/.hermes:/root/.hermes \
  -p 8080:8080 \
  hermes-agent
```

### Resource Usage (Both Running)

| Service | RAM | CPU | Disk |
|---------|-----|-----|------|
| OpenClaw (Docker) | ~1.5GB | Low (event-driven) | ~2GB |
| Hermes (Docker or native) | ~500MB | Low (event-driven) | ~1GB |
| System + buffers | ~1.5GB | - | - |
| **Total** | **~3.5GB / 8GB** | **Fine** | **~3GB / 43GB free** |

4.5GB headroom. Could add 2 more harnesses if needed.

---

## What Hermes Adds That OpenClaw Can't

| Capability | OpenClaw | Hermes | Impact for ZAO |
|-----------|----------|--------|---------------|
| **Skill learning** | No -- every task starts fresh | Auto-creates reusable .md skill files after complex tasks | Research skills accumulate, writing improves |
| **User modeling** | No -- SOUL.md is static | Honcho dialectic modeling, deepens over time | Learns Zaal's preferences, voice, priorities |
| **Memory search** | Basic MEMORY.md | FTS5 full-text search across all sessions | "What did we discuss about ZABAL last week?" |
| **Skill market** | 100+ community skills | Compatible with agentskills.io standard | Skills portable between Hermes + Claude Code |
| **Self-correction** | No | Reviews completed tasks, patches outdated skills | Agent gets better at recurring tasks |

---

## Phase Plan

### Phase 1: Install Hermes (today)

```bash
ssh zaal@31.97.148.88
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
hermes claw migrate  # import OpenClaw data
hermes model         # set MiniMax M2.7
```

Test: give Hermes a research task, compare quality to OpenClaw.

### Phase 2: Create Hermes Agents (this week)

Create 3 Hermes agents with specific roles:
- `RESEARCHER` -- deep research, uses persistent memory
- `WRITER` -- content creation, learns voice over time
- `ANALYST` -- data analysis, accumulates analysis skills

### Phase 3: Wire ZOE as Router (next week)

Update ZOE's SOUL.md to know about both harnesses. Add dispatch logic:
- Task classification → harness selection
- Tournament mode for high-value tasks
- Score tracking for harness performance per task type

### Phase 4: Darwinian Evolution Across Harnesses (future)

Not just parameter evolution -- HARNESS evolution. If Hermes consistently beats OpenClaw on research tasks, route ALL research to Hermes. If OpenClaw wins on social posting, route ALL social to OpenClaw. The harnesses compete for task types.

---

## ZAO Ecosystem Integration

### VPS Files

| File | Change |
|------|--------|
| ZOE SOUL.md | Add harness awareness: "You can dispatch to OpenClaw agents OR Hermes agents" |
| ZOE AGENTS.md | Add Hermes agents: RESEARCHER, WRITER, ANALYST |
| New: ~/.hermes/skills/ | Auto-populated by Hermes as it learns |
| New: ~/hermes-workspace/ | Hermes working directory (separate from OpenClaw) |

### Codebase Files

| File | Connection |
|------|-----------|
| `src/lib/agents/evolve.ts` | Darwinian evolution applies to harness selection too |
| `src/lib/agents/types.ts` | Add harness type: 'openclaw' or 'hermes' |
| `.claude/skills/vps/SKILL.md` | Update with Hermes commands |

---

## Sources

- [Hermes Agent GitHub](https://github.com/nousresearch/hermes-agent) -- 22K stars, self-improving
- [Hermes Agent Docs](https://hermes-agent.nousresearch.com/docs/)
- [OpenClaw vs Hermes Comparison (OneClaw)](https://www.oneclaw.net/blog/openclaw-vs-hermes-agent)
- [ElizaOS vs OpenClaw vs Hermes (Medium)](https://medium.com/@alvintoms2136/elizaos-vs-openclaw-vs-hermes-what-actually-matters-in-2026-a5cf7446726f)
- [Hermes vs OpenClaw: Persistent AI Agents (The New Stack)](https://thenewstack.io/persistent-ai-agents-compared/)
- [Doc 363 - Darwinian Agent Evolution](../363-darwinian-agent-evolution/)
- [Doc 253 - AutoAgent](../253-autoagent-self-optimizing-agents/)
