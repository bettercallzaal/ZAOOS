# 202 — Multi-Agent Orchestration: OpenClaw Supervising Paperclip + Human-as-Agent

> **Status:** Research complete
> **Date:** March 28, 2026
> **Goal:** Design the agent hierarchy where OpenClaw watches/improves Paperclip worker agents, Zaal acts as Claude Agent in the swarm, and ElizaOS handles always-on social presence

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Orchestration layer** | USE Paperclip (36.7K stars, MIT) as the org-chart/task layer — it already has CEO/Researcher/Engineer agent configs in `agents/ceo/`, heartbeat cycles, atomic task checkout, and budget enforcement |
| **Supervisor/improver** | USE OpenClaw (339K stars, MIT) as the meta-agent that watches Paperclip workers — OpenClaw's SOUL.md + MEMORY.md persistence lets it learn what works and tune worker prompts over time. OpenClaw 3.0's "probabilistic orchestration layer" enables autonomous tool/API selection |
| **Human-in-the-loop** | USE Claude Agent SDK with `"default"` permission mode + tool approval callbacks — Zaal acts as a "human agent" in the swarm who gets consulted on high-stakes decisions. Agent Teams (Feb 2026, Opus 4.6) supports 2-16 coordinated agents with approvePlan/rejectPlan |
| **Always-on social** | USE ElizaOS v1.7.2 (stable, 17.9K stars, MIT) on Railway ($5/month) for Farcaster + Discord + XMTP presence. Managed by Paperclip as a worker, improved by OpenClaw |
| **Agent coordination** | USE Shared Memory MCP Server (haasonsaas/shared-memory-mcp) for 6x token efficiency — context deduplication, incremental updates, lazy loading. All agents share state through Supabase MCP + this coordination layer |
| **Agent identity** | USE SOUL.md per agent (emerging standard: OpenClaw, Edict, Paperclip all use it). Store in `agents/{name}/SOUL.md`. OpenClaw reads these to understand worker personalities when tuning |
| **Self-improvement** | USE autoresearch loop (already built in `.claude/skills/autoresearch/`) — OpenClaw runs 3 experiments/day on worker agent prompts, evaluating via binary checklists (Doc 170 pattern: 56%→92% improvement) |
| **Cost target** | BUDGET $75/month total: Paperclip infra $7 + OpenClaw VPS $5 + ElizaOS Railway $5 + Claude API $40 (Sonnet with 90% caching) + Haiku for ElizaOS $18 |

## Comparison of Orchestration Architectures

| Architecture | Supervisor | Workers | Human Role | Self-Improving | Cost | Complexity |
|-------------|-----------|---------|------------|:-------------:|------|-----------|
| **OpenClaw → Paperclip → ElizaOS (RECOMMENDED)** | OpenClaw (meta-agent) | Paperclip agents (CEO, Researcher, Community Mgr) | Claude Agent SDK with approval callbacks | YES (autoresearch on worker prompts) | ~$75/mo | High but modular |
| **Paperclip-only** | Paperclip CEO agent | Paperclip workers | Manual dashboard | NO (static configs) | ~$30/mo | Medium |
| **Claude Agent Teams** | Claude lead session | 2-16 Claude subagents | Direct in terminal | NO (session-scoped) | ~$60/mo | Low |
| **Edict hierarchy** | Taizi (Crown Prince) agent | 11 ministry agents | Via Edict dashboard | NO | ~$50/mo | High |
| **CrewAI multi-agent** | CrewAI orchestrator | CrewAI crews | Via callback | YES (36.9% token savings via prompt optimization) | ~$40/mo | Medium |

## ZAO OS Integration

### The Three-Layer Agent Hierarchy

```
┌─────────────────────────────────────────────────────┐
│  LAYER 0: HUMAN (Zaal as Claude Agent)              │
│  Claude Agent SDK — "default" mode with approvals   │
│  Can: jump in, add code, approve/reject decisions   │
│  Tool: Claude Code terminal, Agent Teams (2-16)     │
│  File: community.config.ts (defines community)      │
└──────────────────┬──────────────────────────────────┘
                   │ approves/overrides
┌──────────────────▼──────────────────────────────────┐
│  LAYER 1: OPENCLAW (Supervisor/Meta-Agent)          │
│  OpenClaw 3.0 on VPS ($5/month)                     │
│  SOUL.md: "ZAO overseer, improves worker agents"    │
│  MEMORY.md: tracks what worked, accumulates wisdom  │
│  Can: read Paperclip task logs, evaluate outputs,   │
│       tune worker SOUL.md files, run autoresearch   │
│  MCP: Supabase, GitHub, Neynar, shared-memory       │
│  File: openclaw/SOUL.md, openclaw/MEMORY.md         │
└──────────────────┬──────────────────────────────────┘
                   │ manages/improves
┌──────────────────▼──────────────────────────────────┐
│  LAYER 2: PAPERCLIP (Org Chart / Task Management)   │
│  Paperclip server (self-hosted or Zeabur, $7/month) │
│  Defines: agent roles, heartbeats, budgets, tasks   │
│  Agents:                                            │
│  ├── CEO Agent (agents/ceo/SOUL.md) — ALREADY BUILT │
│  ├── Community Manager — onboarding, digest, mod    │
│  ├── Music Curator — taste profiling, playlists     │
│  ├── Governance Assistant — proposals, vote reminders│
│  ├── Researcher — autoresearch, knowledge graph     │
│  └── Security Auditor — OWASP scans, dependency chk │
│  File: agents/*/SOUL.md, HEARTBEAT.md, TOOLS.md     │
└──────────────────┬──────────────────────────────────┘
                   │ delegates social tasks to
┌──────────────────▼──────────────────────────────────┐
│  LAYER 3: ELIZAOS (Always-On Social Presence)       │
│  ElizaOS v1.7.2 on Railway ($5/month)               │
│  Character file: zao-agent.character.json           │
│  Plugins: Farcaster (v1.0.5), XMTP (v1.1.0),       │
│           Discord, Supabase adapter                  │
│  Can: reply to mentions, send DMs, post digests,    │
│       monitor /zao channel 24/7                     │
│  Managed by Paperclip as a worker agent             │
│  Improved by OpenClaw (character file tuning)       │
└─────────────────────────────────────────────────────┘
```

### Existing Code That Agents Connect To

| Resource | Path | What Agents Use It For |
|----------|------|----------------------|
| Neynar API client | `src/lib/farcaster/neynar.ts` | Cast reading/writing, social graph, 23+ functions |
| XMTP client | `src/lib/xmtp/client.ts` | Encrypted DMs, group chats |
| Supabase | `src/lib/db/supabase.ts` | Member data, governance state, music library |
| Respect system | `src/app/api/respect/leaderboard/route.ts` | On-chain Respect balances (Optimism) |
| Music APIs | `src/lib/music/audius.ts`, `src/app/api/music/search/route.ts` | Discovery, search, streaming |
| Knowledge graph | `research/_graph/KNOWLEDGE.json` | 191 indexed research docs for RAG |
| AI assistant | `src/app/api/chat/assistant/route.ts` | MiniMax-powered Q&A with research context |
| Webhooks | `src/app/api/webhooks/neynar/route.ts` | Real-time cast events → trigger agent responses |
| Community config | `community.config.ts` | Admin FIDs, channels, contracts, partners |
| Paperclip agents | `agents/ceo/SOUL.md`, `agents/researcher/SOUL.md` | Agent identity, already written |
| Issue sync | `scripts/sync-issues-to-paperclip.ts` | Community issues → Paperclip tasks |

### How OpenClaw Improves Paperclip Workers

The improvement loop (autoresearch pattern from Doc 170):

```
Every 24 hours, OpenClaw:
1. REVIEW — Read Paperclip task logs from last 24h
   (Which agents completed tasks? Quality scores? User reactions?)
2. EVALUATE — Score each worker against binary checklist:
   - Community Manager: Did digest post? Replies within 15min? No false-positive moderation?
   - Music Curator: Playlist diversity score? Tracks from >3 genres? User engagement?
   - Governance Assistant: Vote reminders posted? Proposal formatting correct?
3. IDEATE — If score < 80%, propose a change to the worker's SOUL.md or HEARTBEAT.md
4. MODIFY — Update the worker's config (via git commit to agents/ directory)
5. VERIFY — Run the modified agent for 24h, measure again
6. DECIDE — If improved, keep. If worse, git revert.
7. LOG — Append result to MEMORY.md for long-term learning
```

This is exactly the Karpathy autoresearch loop applied to agent configs instead of code.

### How Zaal Jumps In as Claude Agent

```
Zaal's workflow:
1. Open Claude Code terminal
2. Run `claude --resume` to pick up agent context
3. See agent activity feed (Paperclip dashboard or Supabase query)
4. Jump in:
   - Override an agent decision: edit agents/{name}/SOUL.md directly
   - Approve a pending action: respond to Claude Agent SDK approval callback
   - Add code: make commits that agents will pick up on next heartbeat
   - Run /autoresearch: manually trigger improvement experiments
   - Chat with agents: use Agent Teams to coordinate live
5. Step away — agents continue autonomously
```

The key: Zaal is NOT a separate system. Zaal IS a Claude Code session that has the same access as the agents (Supabase, GitHub, Neynar MCP) but with human judgment for high-stakes decisions.

## Implementation Phases

### Phase 1: Activate Existing Infrastructure (Week 1)

1. Start Paperclip server (already has agent configs in `agents/`)
2. Activate CEO agent heartbeat
3. Register agent FID on Farcaster via Neynar API (Doc 085 has step-by-step)
4. Create Supabase tables: `agent_logs`, `agent_tasks`, `agent_memory`
5. Wire Neynar webhook → agent dispatcher

### Phase 2: Deploy ElizaOS Social Agent (Week 2)

6. Deploy ElizaOS v1.7.2 on Railway ($5/month)
7. Create `zao-agent.character.json` with personality from CEO SOUL.md
8. Enable Farcaster plugin (v1.0.5) + XMTP plugin (v1.1.0)
9. Connect to Supabase adapter for shared memory
10. Register as Paperclip worker

### Phase 3: Deploy OpenClaw Supervisor (Week 3)

11. Provision VPS ($5/month) or use Hostinger
12. Install OpenClaw with SOUL.md defining supervisor role
13. Connect MCP servers: Supabase, GitHub, shared-memory
14. Write improvement loop (autoresearch on worker configs)
15. Set 24-hour evaluation cycle

### Phase 4: Human-Agent Integration (Week 4)

16. Create `agents.config.ts` defining all agent roles and permissions
17. Build `/admin/agents` dashboard page showing agent activity
18. Wire Claude Agent SDK approval callbacks for high-stakes decisions
19. Set up Agent Teams for live coordination sessions
20. Run first full-swarm test (all 3 layers active)

## Reference Implementations

| Project | Stars | License | What We Can Learn |
|---------|-------|---------|-------------------|
| **openclaw/openclaw** | 339K | MIT | SOUL.md/MEMORY.md patterns, MCP integration, 5,400+ skills registry |
| **paperclipai/paperclip** | 36.7K | MIT | Org-chart agent management, heartbeat cycles, atomic task checkout, budget controls |
| **cft0808/edict** | 13.3K | MIT | Hierarchical supervisor with SOUL.md per agent, `agents.json` topology, real-time dashboard |
| **haasonsaas/shared-memory-mcp** | N/A | MIT | 6x token efficiency for agent coordination, context deduplication |
| **waltstephen/ArgusBot** | 276 | MIT | 24/7 persistent supervisor loop with Telegram monitoring |
| **vibeeval/vibecosystem** | 311 | MIT | Self-learning agents that improve across sessions, 134 agents + 246 skills |
| **ComposioHQ/agent-orchestrator** | 5.6K | MIT | Git worktree isolation for parallel agents, CI/CD-aware |
| **elizaOS/eliza** | 17.9K | MIT | Farcaster plugin v1.0.5, XMTP plugin v1.1.0, Supabase adapter |

## Sources

- [OpenClaw - Wikipedia](https://en.wikipedia.org/wiki/OpenClaw) — 339K stars, MIT, fastest-growing OSS project
- [OpenClaw SOUL.md Guide](https://openclaws.io/blog/openclaw-soul-md-guide) — Identity system for persistent agents
- [Paperclip GitHub](https://github.com/paperclipai/paperclip) — 36.7K stars, MIT, zero-human company orchestration
- [Paperclip Heartbeat Explained](https://paperclipai.info/blogs/explain_heartbeat/) — 9-step agent execution cycle
- [Claude Agent SDK - Agent Loop](https://platform.claude.com/docs/en/agent-sdk/agent-loop) — Permission modes, human-in-the-loop
- [Claude Code Agent Teams](https://claudefa.st/blog/guide/agents/agent-teams) — 2-16 agent coordination, Feb 2026
- [Hyperagents (arXiv 2603.19461)](https://arxiv.org/abs/2603.19461) — Agent self-modification, meta-agent patterns
- [Supervisor-Worker Pattern](https://agentic-design.ai/patterns/multi-agent/supervisor-worker-pattern) — 90% improvement, 3-5 optimal workers
- [CrewAI Self-Evolving Agents](https://blog.crewai.com/orchestrating-self-evolving-agents-with-crewai-and-nvidia-nemoclaw/) — 36.9% token cost reduction
- [Shared Memory MCP Server](https://github.com/haasonsaas/shared-memory-mcp) — 6x token efficiency for agent coordination
- [Agent Orchestration MCP](https://github.com/madebyaris/agent-orchestration) — SQLite-based agent registry + task queues
- [ElizaOS v1.7.2](https://github.com/elizaOS/eliza) — 17.9K stars, Farcaster + XMTP plugins
- [A2A Protocol](https://a2a-protocol.org/) — Google-initiated agent interoperability (Linux Foundation)
- [NemoClaw Security](https://blog.crewai.com/orchestrating-self-evolving-agents-with-crewai-and-nvidia-nemoclaw/) — NVIDIA security sandbox for OpenClaw
