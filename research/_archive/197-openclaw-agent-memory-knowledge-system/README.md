# 197 — OpenClaw Agent Memory & Knowledge System for ZAO OS

> **Status:** Research complete
> **Date:** March 28, 2026
> **Goal:** Build an OpenClaw-compatible AI agent memory layer that turns ZAO OS's 196 research docs + codebase into a queryable knowledge base for autonomous agents

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Agent framework** | USE **OpenClaw** — self-hosted, MCP-native, markdown memory, 50+ messaging integrations, $5/mo VPS |
| **Memory architecture** | USE **3-layer system**: research knowledge graph (JSON) + CLAUDE.md project memory + OpenClaw MEMORY.md session memory |
| **Knowledge retrieval** | USE **QMD MCP server** — hybrid BM25 + vector search over markdown files, native OpenClaw tool |
| **Hosting** | USE **Hostinger KVM 2** ($5.99/mo, 4GB RAM) or **Oracle Cloud Always Free** ($0/mo, 24GB ARM) |
| **LLM backend** | USE **Claude API** (already have key) + **Ollama** (local fallback for $0) |
| **Skip** | SKIP AutoGPT (autonomous loops, not personal agent), SKIP CrewAI (multi-agent overkill for ZAO's scale) |

## Comparison of Agent Frameworks

| Framework | Memory System | MCP Support | Web3 Native | Self-Hosted | Messaging | Cost | Best For |
|-----------|--------------|-------------|-------------|-------------|-----------|------|----------|
| **OpenClaw** | Markdown files + SQLite RAG | Yes (native) | No (but extensible) | Yes (Node.js) | 50+ platforms | $5/mo VPS | Personal agent, knowledge base |
| **ElizaOS** | PostgreSQL + vector | No | Yes ($25M+ AUM) | Yes (Node.js) | Discord, Twitter, Telegram | $10-20/mo | Web3 token agents |
| **AutoGPT** | File-based | Limited | No | Yes (Python) | Web UI only | $10/mo | Autonomous task loops |
| **CrewAI** | Shared state | No | No | Yes (Python) | None built-in | Free (OSS) | Multi-agent workflows |
| **Claude Code** | MEMORY.md + file-based | Yes (native) | No | CLI only | None | $20/mo (API) | Dev assistant (current) |

**OpenClaw wins for ZAO** because:
1. Markdown-native memory — matches our 196 research docs exactly
2. MCP server support — QMD gives semantic search over our knowledge base
3. Messaging integration — Telegram, Discord, Farcaster (via custom MCP)
4. Self-hosted — data stays with us, $5/mo fixed cost
5. Skills system — markdown instruction files, identical to our `.claude/skills/` pattern

## How OpenClaw Memory Maps to ZAO OS

### Current ZAO OS Knowledge Architecture

```
ZAO OS Knowledge (Today)
├── research/                    # 196 markdown docs (human-curated)
│   ├── _graph/KNOWLEDGE.json    # Machine-readable index (building now)
│   ├── _categories/             # Category indexes
│   └── 001-196/README.md        # Individual research docs
├── .claude/                     # Claude Code memory
│   ├── MEMORY.md                # Session memory index
│   └── skills/                  # 9 project skills
├── docs/superpowers/            # Design specs + implementation plans
│   ├── specs/                   # 15 design documents
│   └── plans/                   # Implementation plans
├── community.config.ts          # Community configuration
└── CLAUDE.md                    # Project instructions
```

### Proposed OpenClaw Integration

```
ZAO OS Knowledge (With OpenClaw)
├── research/_graph/             # Knowledge Graph (JSON indexes)
│   ├── KNOWLEDGE.json           # Master index — tags, relations, supersession
│   ├── by-tag.json              # Tag → doc IDs
│   ├── by-code-path.json        # src/path → doc IDs
│   └── supersession.json        # Which docs replace which
│
├── openclaw/                    # OpenClaw Agent Home
│   ├── openclaw.json            # Agent configuration
│   ├── MEMORY.md                # OpenClaw's working memory (auto-managed)
│   ├── memory/                  # Daily logs + long-term facts
│   │   ├── 2026-03-28.md        # Today's session log
│   │   └── facts.md             # Durable knowledge
│   ├── skills/                  # OpenClaw skills (same format as .claude/skills)
│   │   ├── zao-research/SKILL.md
│   │   ├── community-manager/SKILL.md
│   │   └── broadcast-manager/SKILL.md
│   └── mcp/                     # MCP server configs
│       ├── qmd/                 # QMD — semantic search over research/
│       ├── supabase/            # Direct Supabase access
│       └── neynar/              # Farcaster API access
│
├── research/                    # Existing 196 docs (unchanged)
└── .claude/                     # Claude Code memory (coexists)
```

### The 3-Layer Memory System

| Layer | What | Persistence | Access Pattern |
|-------|------|-------------|----------------|
| **L1: Working Memory** | Current conversation context | Session only | Auto-managed by OpenClaw |
| **L2: Project Memory** | `research/_graph/KNOWLEDGE.json` + `MEMORY.md` facts | Permanent, file-based | MCP tool: `mcp__qmd__query` |
| **L3: Knowledge Base** | 196 research docs + codebase | Permanent, git-tracked | QMD semantic search + keyword grep |

## ZAO OS Integration

### Files That Already Exist

| Path | What It Does | OpenClaw Use |
|------|-------------|--------------|
| `research/*/README.md` | 196 research documents | L3 knowledge base — indexed by QMD |
| `.claude/projects/*/memory/MEMORY.md` | Claude Code session memory | Can sync to OpenClaw MEMORY.md |
| `.claude/skills/zao-research/SKILL.md` | Research skill instructions | Port to OpenClaw skill format |
| `community.config.ts` | Community configuration | Agent reads for context |
| `src/lib/auth/session.ts` | Auth system | Agent uses for API calls |
| `src/app/api/` | All API routes | Agent can call via MCP |

### New Files to Create

```
openclaw/
├── openclaw.json                # Agent config (LLM, memory, MCP servers)
├── skills/
│   ├── community-manager/       # Monitor Farcaster, respond to mentions
│   ├── broadcast-manager/       # Schedule rooms, manage broadcasts
│   ├── research-assistant/      # Search knowledge base, answer questions
│   └── onboarding-guide/        # Help new members navigate ZAO OS
└── mcp/
    └── zao-api/                 # Custom MCP server wrapping ZAO OS APIs
        ├── package.json
        └── index.ts             # Exposes ZAO OS API routes as MCP tools
```

### What OpenClaw Agents Can Do for ZAO

| Agent | Platform | What It Does |
|-------|----------|-------------|
| **@zao-bot** | Telegram + Discord | Answer questions about ZAO, search research docs, onboard new members |
| **@dj-bot** | In-app (via API) | Auto-DJ rooms, curate playlists based on Respect-weighted preferences |
| **@broadcast-bot** | Background | Schedule rooms, auto-go-live on connected platforms, post highlights |
| **@research-bot** | Claude Code | Enhanced `/zao-research` with semantic search via QMD |

## Implementation Plan

### Phase 1: Knowledge Graph (Building Now)
- `research/_graph/KNOWLEDGE.json` — master index
- `research/_graph/by-tag.json` — tag lookup
- `research/_graph/by-code-path.json` — code path lookup
- `research/_graph/supersession.json` — doc chains
- **Status:** Agent building this right now

### Phase 2: OpenClaw Setup ($5/mo)
1. Provision Hostinger VPS KVM 2 (Ubuntu 22.04, 4GB RAM)
2. Install Docker + OpenClaw via template
3. Configure `openclaw.json` with Claude API key
4. Set up QMD MCP server pointing at `research/`
5. Create `community-manager` skill
6. Connect to Telegram + Discord
- **Effort:** ~2 hours setup
- **Cost:** $5.99/mo (Hostinger) + ~$5/mo (Claude API)

### Phase 3: Custom ZAO MCP Server
Build a custom MCP server that exposes ZAO OS APIs as OpenClaw tools:
- `zao_search_research(query)` — semantic search over 196 docs
- `zao_get_members()` — fetch community member list
- `zao_create_room(title, provider)` — create an audio room
- `zao_broadcast(platforms)` — start broadcasting
- `zao_post_cast(text)` — publish to Farcaster
- `zao_get_respect(fid)` — look up member's Respect
- **Effort:** ~4 hours
- **Stack:** TypeScript MCP server using `@modelcontextprotocol/sdk`

### Phase 4: Agent Autonomy
- Scheduled tasks (cron): daily standup, weekly research digest
- Event-driven: respond to Farcaster mentions, new member joins
- Memory consolidation: daily logs → long-term facts
- **Effort:** ~8 hours

## VPS Hosting Comparison

| Provider | RAM | CPU | Storage | Monthly | Annual | Notes |
|----------|-----|-----|---------|---------|--------|-------|
| **Hostinger KVM 2** | 4GB | 2 vCPU | 50GB SSD | $5.99 | $3.59/mo | OpenClaw template available |
| **Oracle Cloud Free** | 24GB | 4 ARM | 200GB | $0 | $0 | Always Free tier, ARM64 |
| **DigitalOcean** | 4GB | 2 vCPU | 80GB SSD | $24 | $24/mo | Reliable but expensive |
| **Hetzner** | 4GB | 2 vCPU | 40GB SSD | €4.15 | €4.15/mo | EU-based, cheapest paid |

**Recommendation:** Start with **Hostinger KVM 2** ($5.99/mo) for the pre-built OpenClaw template. Move to **Oracle Cloud Free** later if you want $0/mo.

## Security Architecture

```
Internet → Firewall (UFW) → SSH (key-only) → Docker → OpenClaw Container
                                                          ├── Claude API (encrypted)
                                                          ├── Telegram Bot (webhook)
                                                          ├── Discord Bot (webhook)
                                                          └── SQLite memory (local)
```

| Layer | Protection |
|-------|-----------|
| **Firewall** | UFW: deny all, allow SSH (22) only |
| **SSH** | Key-based auth, root login disabled, fail2ban |
| **Docker** | Container isolation, resource limits |
| **OpenClaw** | Non-root user, API key in env vars |
| **Memory** | SQLite on local disk, not exposed |

## What Makes This Different from Generic OpenClaw

Most OpenClaw setups are generic assistants. ZAO's version is unique because:

1. **196 research docs as persistent memory** — the agent knows everything about Farcaster, music streaming, on-chain governance, audio rooms, cross-platform publishing
2. **Knowledge graph for retrieval** — not just keyword search, semantic relationships between docs
3. **Direct ZAO OS API access** — the agent can actually DO things (create rooms, broadcast, post casts)
4. **Community-specific context** — knows the 40+ members, their Respect scores, their roles
5. **Music domain expertise** — trained on 22 music-specific research docs covering 9 audio platforms

## Sources

- [OpenClaw Official Docs](https://docs.openclaw.ai/concepts/memory)
- [OpenClaw MCP Server (GitHub)](https://github.com/freema/openclaw-mcp)
- [OpenClaw Specs (Architecture)](https://gist.github.com/sdolgin/bc15d2844268e8e55459c94cb54b3799)
- [Self-Host OpenClaw Guide](https://cognio.so/clawdbot/self-hosting)
- [OpenClaw Hardware Requirements](https://macaron.im/blog/openclaw-hardware-requirements)
- [ElizaOS vs OpenClaw vs Hermes Comparison](https://medium.com/@alvintoms2136/elizaos-vs-openclaw-vs-hermes-what-actually-matters-in-2026-a5cf7446726f)
- [OpenClaw vs AutoGPT](https://openclaw-ai.net/en/blog/openclaw-vs-autogpt)
- [QMD MCP Server (RAG over markdown)](https://news.ycombinator.com/item?id=46847406)
- [OpenClaw Skills Guide](https://openclawmcp.com/blog/openclaw-skills-guide)
- [Doc 024 — ZAO AI Agent](../../_archive/024-zao-ai-agent/)
- [Doc 026 — Hindsight Agent Memory](../../agents/026-hindsight-agent-memory/)
- [Doc 083 — ElizaOS 2026 Update](../../_archive/083-elizaos-2026-update/)
- [Doc 090 — AI-Run Community Agent OS](../../agents/090-ai-run-community-agent-os/)
