# 234 — OpenClaw Comprehensive Guide: Agent Memory, Knowledge Graphs, MCP Servers & Context Management

> **Status:** Research complete
> **Date:** April 1, 2026
> **Tags:** `#openclaw` `#agent-memory` `#knowledge-graph` `#mcp` `#context-management` `#soul-md`
> **Supersedes:** Partial — Doc 197 (memory system), Doc 204 (setup runbook), Doc 226 (best practices)
> **Builds on:** Doc 202 (multi-agent orchestration), Doc 205 (deployment plan), Doc 208 (skills & capabilities)

---

## tl;dr

OpenClaw is an open-source AI agent orchestration platform (339K+ GitHub stars, MIT license) that runs LLM agents in Docker containers with persistent markdown-based memory, knowledge graphs, 100+ skills, MCP server integration, and 10+ messaging platform channels. This doc consolidates everything: official architecture, SOUL.md/MEMORY.md/AGENTS.md patterns, knowledge graph options (Cognee, Graphiti, LightRAG), MCP server configurations, context management strategies, and token optimization. It is the single canonical reference for all OpenClaw operations.

---

## 1. OpenClaw Architecture Overview

### What OpenClaw Is

OpenClaw is a free, open-source autonomous AI agent that runs as a single Gateway process on your own machine or server. It bridges messaging platforms (Telegram, Discord, WhatsApp, Slack, Signal, iMessage, etc.) to LLM backends, with persistent memory, skills, and tool access.

- **Creator:** Peter Steinberger (joined OpenAI Feb 14, 2026; project moved to open-source foundation)
- **License:** MIT
- **Stars:** 339K+ (fastest-growing OSS project of 2025-2026)
- **Language:** Node.js/TypeScript
- **Install:** `npm install -g openclaw` or Docker

### Core Components

```
Internet/Messaging
    |
    v
┌──────────────────────────────────────────────────────┐
│  GATEWAY (single long-lived process per host)        │
│  ├── Channel Adapters (Telegram, Discord, etc.)      │
│  ├── Agent Runtime (SOUL.md + AGENTS.md + MEMORY.md) │
│  ├── Plugin System (skills, extensions, MCP)         │
│  ├── Memory Engine (SQLite + FTS5 + embeddings)      │
│  ├── WebSocket Server (127.0.0.1:18789)              │
│  └── Cron System (~/.openclaw/cron/)                 │
└──────────────────────────────────────────────────────┘
```

**Gateway:** Always-on daemon managing all messaging surfaces. WebSocket server on configurable bind host (default `127.0.0.1:18789`). Emits typed events: `agent`, `chat`, `presence`, `health`, `heartbeat`, `cron`.

**Channels:** Each messaging platform is a separate adapter normalizing messages into a common format. 10+ channels available: Telegram, Discord, WhatsApp, Slack, Signal, Matrix, IRC, Nostr, Twitch, MS Teams.

**Agent System:** Agents run in isolated workspaces. Multiple agents can share one Gateway process, each with their own SOUL.md, AGENTS.md, and memory files. Agents can spawn sub-agents via `sessions_spawn`.

**Wire Protocol:** WebSocket text frames with JSON payloads. Handshake required on first frame. Request/response + server-push events. Optional token-based authentication.

### Security Model

- Default: loopback-only binding (`gateway.bind: "loopback"`)
- Remote access via SSH tunnels or Tailscale Serve (never public ports)
- Device pairing with approval flow and challenge nonce signing
- All clients include device identity on connect
- Metadata pinning on reconnect prevents hijacking

### Deployment

```bash
# Install
npm install -g openclaw

# Setup (interactive)
openclaw setup

# Run Gateway
openclaw gateway run    # foreground
# OR
openclaw gateway        # daemon mode with systemd/launchd
```

**Docker:**
```bash
docker compose up -d    # Uses official Docker template
```

**ZAO VPS:** Running on Hostinger KVM 2 (31.97.148.88), Ubuntu 24.04, Docker v29.3.1, port 18789 tunneled via SSH.

---

## 2. Workspace Files: The Complete System

OpenClaw agents are defined through plain-text markdown files in a workspace directory. These form the agent's complete identity, behavior, and memory.

### File Hierarchy

```
~/.openclaw/workspace/          # Default workspace
├── SOUL.md                     # WHO — personality, values, boundaries
├── AGENTS.md                   # HOW — procedures, workflows, rules
├── USER.md                     # WHO YOU SERVE — human context & preferences
├── TOOLS.md                    # WHAT — tool usage guidelines
├── IDENTITY.md                 # DISPLAY — name, ID, routing metadata
├── HEARTBEAT.md                # WHEN — scheduled/autonomous tasks
├── MEMORY.md                   # WHAT I KNOW — persistent cross-session facts
└── memory/                     # DAILY LOGS
    ├── 2026-04-01.md           # Today's session log
    ├── 2026-03-31.md           # Yesterday's (auto-loaded)
    └── ...
```

### SOUL.md — Agent Personality & Boundaries

**Purpose:** Defines WHO the agent is. Loaded into every prompt as system-level context.

**Structure (4 sections):**
1. **Identity** — Name, role, 1-2 sentence description
2. **Communication Style** — Tone, formality, response length, formatting preferences
3. **Rules** — Non-negotiable behavioral boundaries and safety constraints
4. **Domain Knowledge** — Contextual information the agent always needs

**Best Practices:**
- Keep under 2,000 words (loaded into every prompt, dilutes important rules if bloated)
- Start with ~10 lines; add rules only when observing unwanted behavior
- Be specific: "Max 5 bullet points, confirm before file deletion" beats "be concise"
- Add anti-patterns: List specific phrases/behaviors to avoid ("I'd be happy to help", "As an AI")
- Test with 5 edge-case scenarios: expertise question, brainstorm, "I don't know", frustration, ambiguous request
- Iterate monthly: Ask agent "suggest improvements to your SOUL.md"
- Separate identity from workflow: SOUL.md is WHO, AGENTS.md/HEARTBEAT.md is WHAT/WHEN

**ZAO's Current SOUL.md** (`/home/zaal/openclaw-workspace/SOUL.md`):
- Identity: ZAO Orchestrator — strategic brain, not a coder
- Voice: Direct, no fluff, founder tone
- Rules: Never code, never push to main, never expose secrets
- Context: Repo, stack, community, governance, research library
- **Improvements needed:** Add anti-patterns section, add expertise domains (deep vs working), add voice specificity ("2-3 sentence default")

### AGENTS.md — Operating Manual & Procedures

**Purpose:** Defines HOW the agent operates. Procedural workflows, not personality.

**Contents:**
- Session initialization/completion steps
- Memory logging and retention policies
- File access patterns and timing
- Numbered workflows for common tasks
- Handoff procedures between agents
- Memory protocol rules

**Key rule to include:**
```markdown
## Memory Protocol
- Before answering questions about past work: search memory first
- Before starting any new task: check memory/today's date for active context
- When you learn something important: write it to the appropriate file immediately
- When corrected on a mistake: add the correction as a rule to MEMORY.md
- When a session is ending or context is large: summarize to memory/YYYY-MM-DD.md
```

### USER.md — Human Context & Preferences

**Purpose:** Persistent knowledge about the human being served. Read at session start.

**Contents:** Name, timezone, background, expertise level, communication preferences, permission levels.

**Warning:** Never commit to public repositories (contains personal information).

### TOOLS.md — Capability Documentation

**Purpose:** Tells the agent HOW to use tools it already has. Not permissions (those are in config).

**Contents:** Available tools list, timeout/config parameters, external service details, explicit constraints.

### HEARTBEAT.md — Scheduled Tasks

**Purpose:** Cron expressed in natural language. Enables proactive agent behavior.

**Contents:** Polling operations, monitoring routines, scheduled reports, health checks.

### IDENTITY.md — Display & Routing

**Purpose:** Lightweight metadata for agent identification. Name, ID, role, avatar.

---

## 3. Memory System: Complete Architecture

### The Core Principle

**"If it's not written to a file, it doesn't exist."** Instructions given only in conversation vanish during compaction. All durable information must be persisted to disk.

### Memory File Structure

| File | Purpose | Loaded When | Persistence |
|------|---------|-------------|-------------|
| `MEMORY.md` | Long-term durable facts, preferences, decisions | Every session start | Permanent, user-managed |
| `memory/YYYY-MM-DD.md` | Daily session logs, running context | Today + yesterday auto-loaded | Permanent, agent-managed |
| `SOUL.md` | Identity (not memory per se) | Every session start | Permanent, user-managed |
| `AGENTS.md` | Procedures | Every session start | Permanent, user-managed |

### Memory Tools

| Tool | What It Does |
|------|-------------|
| `memory_search` | Semantic search across all memory files. Hybrid: vector similarity + keyword matching |
| `memory_get` | Read specific memory files or line ranges |

### Memory Backends

| Backend | Type | Best For |
|---------|------|----------|
| **Builtin (default)** | SQLite + FTS5 + embeddings | Most setups, works without dependencies |
| **QMD** | Local sidecar with reranking | Large vaults (500+ files), multiple collections |
| **Honcho** | AI-native cross-session | Multi-agent with user modeling |

### Embedding Providers

OpenClaw auto-detects from available API keys:
- OpenAI, Gemini, Voyage, Mistral (cloud)
- Local: `embeddinggemma-300m` via GGUF (no API needed)
- `nomic-embed-text-v2-moe` (768d, 100+ languages, 7ms on GPU)

### Hybrid Search Configuration

```json
{
  "agents": {
    "defaults": {
      "memorySearch": {
        "enabled": true,
        "provider": "local",
        "local": {
          "modelPath": "hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf"
        },
        "query": {
          "hybrid": {
            "enabled": true,
            "vectorWeight": 0.7,
            "textWeight": 0.3
          }
        },
        "cache": { "enabled": true }
      }
    }
  }
}
```

### Index External Docs (extraPaths)

Search files outside the workspace without moving them:

```json
{
  "agents": {
    "defaults": {
      "memorySearch": {
        "extraPaths": [
          "~/openclaw-workspace/zaoos/research/**/*.md",
          "~/openclaw-workspace/zaoos/docs/**/*.md"
        ]
      }
    }
  }
}
```

### QMD Backend (For Large Knowledge Bases)

```json
{
  "memory": {
    "backend": "qmd",
    "qmd": {
      "searchMode": "search",
      "includeDefaultMemory": true,
      "sessions": { "enabled": true },
      "paths": [
        { "name": "research", "path": "~/openclaw-workspace/zaoos/research", "pattern": "**/*.md" },
        { "name": "docs", "path": "~/openclaw-workspace/zaoos/docs", "pattern": "**/*.md" }
      ]
    }
  }
}
```

### MEMORY.md Organization Best Practices

- Keep under 100 lines
- Include: decisions with rationale, user preferences, rules from past mistakes, behavioral constraints
- Never store: API keys, secrets, raw logs
- Version control: `git init` in workspace with auto-commit via cron
- Weekly hygiene: Review daily logs, promote durable decisions to MEMORY.md, archive completed tasks

### Memory Consolidation Workflow

```
Daily: Agent writes observations to memory/YYYY-MM-DD.md
Weekly: Review daily logs → promote important items to MEMORY.md
Monthly: Review MEMORY.md → prune stale items, update rules
```

### Compaction Defense

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "reserveTokensFloor": 40000,
        "memoryFlush": {
          "enabled": true,
          "softThresholdTokens": 4000,
          "systemPrompt": "Session nearing compaction. Store durable memories now.",
          "prompt": "Write any lasting notes to memory/YYYY-MM-DD.md; reply with NO_REPLY if nothing to store."
        }
      }
    }
  }
}
```

### Context Pruning (Separate from Compaction)

```json
{
  "agents": {
    "defaults": {
      "contextPruning": {
        "mode": "cache-ttl",
        "ttl": "5m"
      }
    }
  }
}
```

Pruning trims old tool results without modifying conversation history. Lossless and temporary.

### CLI Commands

```bash
openclaw memory status          # Check index status and provider
openclaw memory search "query"  # Search from command line
openclaw memory index --force   # Rebuild index
```

### Failure Mode Diagnosis

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Forgotten preference" | Never written to MEMORY.md | Add to MEMORY.md |
| "Forgot tool output" | Session pruning trimmed it | Increase TTL or save to memory |
| "Lost entire thread" | Compaction summarized or session reset | Use pre-compaction flush |

---

## 4. Knowledge Graph Options

Three main approaches for giving OpenClaw agents structured knowledge retrieval beyond flat file search.

### Option A: Cognee (Knowledge Graph Plugin)

**What it is:** Syncs MEMORY.md and memory/*.md to Cognee's knowledge engine, enabling graph traversal across documents, concepts, and relationships.

**Installation:**
```bash
openclaw plugins install @cognee/cognee-openclaw
```

**Configuration:**
```yaml
plugins:
  entries:
    cognee-openclaw:
      enabled: true
      config:
        baseUrl: "http://localhost:8000"
        apiKey: "${COGNEE_API_KEY}"
        datasetName: "zao-knowledge"
        searchType: "GRAPH_COMPLETION"
        autoRecall: true
        autoIndex: true
```

**How it works:**
1. **Indexing:** Scans memory files, syncs additions/modifications/deletions to Cognee (content hashing avoids redundant calls)
2. **Recall:** Before each agent execution, searches Cognee for relevant memories, injects as context
3. **Sync:** After runs, rescans memory files for agent-made changes

**Search types:**
- `GRAPH_COMPLETION` — Traverses knowledge graph for comprehensive answers (recommended)
- `CHUNKS` — Returns matching text excerpts
- `SUMMARIES` — Provides summary-level results

**Best for:** Agents that need to traverse relationships between documents, concepts, and evolving knowledge.

### Option B: Graphiti (Temporal Knowledge Graph)

**What it is:** Temporal knowledge graph memory powered by Graphiti + Neo4j. Tracks when facts became true and when they were superseded.

**Installation:**
```bash
openclaw plugins install @robertogongora/graphiti
```

**Configuration:**
```json
{
  "plugins": {
    "entries": {
      "graphiti": {
        "enabled": true,
        "config": {
          "url": "http://localhost:8100",
          "groupId": "zao",
          "autoRecall": true,
          "autoCapture": true,
          "recallMaxFacts": 10,
          "minPromptLength": 10
        }
      }
    }
  }
}
```

**Features:**
- **Auto-recall:** Searches knowledge graph for relevant facts before each conversation turn, injects into context
- **Auto-capture:** On compaction/session reset, ingests conversations for entity/relationship extraction
- **Native tools:** `graphiti_search` and `graphiti_ingest` available as agent tools
- **Temporal tracking:** Facts have validity windows (when became true, when superseded)

**Requires:** Neo4j 5 Community + OpenAI API key for entity extraction

**Docker Compose** (Neo4j + Graphiti):
```yaml
services:
  neo4j:
    image: neo4j:5-community
    ports: ["7474:7474", "7687:7687"]
    environment:
      NEO4J_AUTH: neo4j/password
  graphiti:
    image: getzep/graphiti:latest
    ports: ["8100:8100"]
    environment:
      NEO4J_URI: bolt://neo4j:7687
      OPENAI_API_KEY: ${OPENAI_API_KEY}
```

**Warning:** Occupies OpenClaw's memory slot exclusively, disabling default memory-core.

**Best for:** Agents that need temporal fact tracking, entity resolution, and relationship evolution over time.

### Option C: Custom 12-Layer Architecture (Advanced)

Community project (`coolmanns/openclaw-memory-architecture`) implementing a full-scale memory system:

| Layer | Name | Latency | What |
|-------|------|---------|------|
| 0 | Lossless Context (LCM) | 0ms | All messages in SQLite + FTS5, summary DAG during compaction |
| 1 | Always-Loaded Files | 0ms | SOUL.md, AGENTS.md, identity anchors |
| 2 | MEMORY.md | 0ms | Curated long-term wisdom |
| 3 | PROJECT.md | On-demand | Per-project institutional knowledge |
| 4 | facts.db | <1ms | Structured entity/key/value, 770+ facts, Hebbian activation model |
| 5 | Continuity Archive | 7ms | 384d embeddings, semantic vector search with temporal re-ranking |
| 5a | File-Vec Index | 7ms | Workspace document search |
| 5b | LightRAG | ~200ms | Domain GraphRAG (PostgreSQL + pgvector) |
| 6 | Daily Logs | On-demand | Raw session history |
| 10 | Continuity Plugin | Runtime | Context budgeting, topic tracking, cross-session anchors |
| 11 | Stability Plugin | Runtime | Entropy monitoring, principle alignment |
| 12 | Metabolism Plugin | Runtime | LLM-based fact extraction every 5 min |
| 13 | Contemplation Plugin | Nightly | 3-pass deep inquiry (explore/reflect/synthesize) |

**Activation/Decay System:** Facts tracked via `decay_score` (temporal aging), `activation` (access frequency), `importance` (manual priority). Nightly cron ages scores. Hot/Warm/Cool tiers.

**Unified Search:** One `memory_search` tool queries 4 backends in parallel: continuity (semantic vectors), facts (structured + FTS5), files (workspace docs), LCM (lossless messages).

**Best for:** Production agents needing deep domain expertise, metacognitive capabilities, and long-term knowledge evolution.

### Comparison

| Approach | Complexity | Infrastructure | Cost | Scale |
|----------|-----------|---------------|------|-------|
| **Default (SQLite + FTS5)** | Low | None | $0 | Up to ~500 files |
| **extraPaths (index external docs)** | Low | None | $0 | Up to ~1,000 files |
| **QMD backend** | Medium | QMD sidecar | $0 | 1,000+ files |
| **Cognee plugin** | Medium | Docker (Cognee) | $0 (self-hosted) | Unlimited |
| **Graphiti plugin** | High | Neo4j + Graphiti | $0 (self-hosted) | Unlimited |
| **12-Layer architecture** | Very High | Multiple services | ~$20/mo (GPU) | Enterprise |

### ZAO Recommendation

**Start with:** Default memory + `extraPaths` pointing to `research/**/*.md` (225+ docs, ~2MB). This is sufficient at current scale.

**Graduate to:** QMD backend when research library exceeds 500 docs or when semantic similarity matching becomes important.

**Consider:** Cognee plugin when agents need to traverse relationships between research docs, member profiles, and governance decisions.

---

## 5. MCP Server Configurations

### What MCP Servers Do for Agents

MCP (Model Context Protocol) servers expose external tools to agents. Each server adds 200-800 tokens of tool descriptions to context. Per-agent routing reduces overhead.

### Recommended Stack for ZAO (5 Servers)

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}" }
    },
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@anthropic/brave-search-mcp"],
      "env": { "BRAVE_API_KEY": "${BRAVE_API_KEY}" }
    },
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server"],
      "env": {
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/zaal/openclaw-workspace"]
    },
    "tavily": {
      "command": "npx",
      "args": ["-y", "tavily-mcp"],
      "env": { "TAVILY_API_KEY": "${TAVILY_API_KEY}" }
    }
  }
}
```

### Per-Agent MCP Routing

```json
{
  "agents": {
    "ceo": { "mcpServers": ["github", "brave-search"] },
    "engineer": { "mcpServers": ["github", "supabase", "filesystem"] },
    "researcher": { "mcpServers": ["brave-search", "tavily", "filesystem"] },
    "community-manager": { "mcpServers": ["supabase", "brave-search"] }
  }
}
```

### Top 10 MCP Servers for Agent Workflows

| Server | Package | Purpose | Cost |
|--------|---------|---------|------|
| **GitHub** | `@modelcontextprotocol/server-github` | Repo management, PRs, issues, code search | Free |
| **Brave Search** | `@anthropic/brave-search-mcp` | Web research, fact-checking | Free (2K queries/mo) |
| **Supabase** | `@supabase/mcp-server` | Database access, member data | Free (existing plan) |
| **Filesystem** | `@modelcontextprotocol/server-filesystem` | Local file operations | Free |
| **Tavily** | `tavily-mcp` | AI-optimized web search | Free (1K searches/mo) |
| **PostgreSQL** | `@crystaldba/postgres-mcp` | Direct SQL, schema exploration | Free |
| **Playwright** | `@playwright/mcp` | Browser automation, testing | Free |
| **Slack** | `https://mcp.slack.com/mcp` (SSE) | Team communication | Free |
| **Notion** | `@notionhq/notion-mcp-server` | Docs, knowledge management | Free |
| **Linear** | `@mcp-devtools/linear` | Issue tracking, sprint management | Subscription |

### MCP Security Best Practices

1. **Least privilege:** If agent only reads, don't give write access
2. **Segregate by sensitivity:** Read paths separate from write paths
3. **Store configs in git:** Make them reproducible and PR-reviewable
4. **Use environment variables:** Never hardcode API keys in config files
5. **Start small:** 2-3 servers, add more as workflows mature
6. **Monitor token budgets:** 10+ servers may exhaust token budgets in longer conversations
7. **Use `stdio` for local:** Credentials never hit the network
8. **Use HTTP+SSE for remote:** Works with existing infrastructure (load balancers, CDNs)

### Token Overhead

| Servers | Approximate Overhead |
|---------|---------------------|
| 3 servers | ~1,200 tokens |
| 5 servers | ~2,400 tokens |
| 10 servers | ~5,000 tokens |
| Per-agent routing | Reduces to ~800-1,200 per agent |

---

## 6. Agent Context Management

### The Context Problem

Every time an agent receives a message, it sends the entire conversation history to the LLM. Context accumulation is the #1 cost driver (40-50% of typical token usage). Without management, agents use the full context window of the model, reloading everything on each request.

### Context Budget Strategy

```
Token Budget = Model Max - Reserved for Output - Reserved for Tools
Example (200K model): 200,000 - 40,000 (output) - 5,000 (tools) = 155,000 usable
```

### Strategies to Prevent Context Overload

**1. Hierarchical Memory (Most Important)**
- L1: Working memory (current conversation) — always in context
- L2: Project memory (MEMORY.md, SOUL.md) — loaded at session start
- L3: Knowledge base (research docs, codebase) — retrieved on demand via search
- L4: Archive (old daily logs) — only via explicit `memory_search`

**2. Compaction with Pre-Flush**
Before compaction summarizes the conversation, trigger a memory flush that saves important context to files. This prevents permanent loss.

**3. Context Pruning**
Trim old tool results without modifying conversation history. Lossless and temporary.

**4. Memory Decay**
- Cosine similarity + recency decay (0.9 factor) for retrieval ranking
- Older information doesn't dilute relevance
- 92% accuracy in multi-turn dialogues vs 75% standard RAG

**5. Relevance Scoring**
- Hybrid BM25 + vector similarity surfaces contextually appropriate memories first
- Deterministic retrieval ranking outperforms probabilistic by 20-30%

**6. Token Budget Optimization**
- Route to budget models for simple tasks (Minimax M2.7 for ZAO = ~$5/mo)
- Cache repeated system prompts
- Use `contextPruning.mode: "cache-ttl"` with 5-minute TTL
- Avoid reasoning/thinking mode unless needed (10-50x token explosion)

### Bootstrap Files & Truncation

All bootstrap files (SOUL.md, AGENTS.md, USER.md, TOOLS.md, MEMORY.md) load at session start. If they exceed limits, they get truncated.

**Limits:**
- Per-file: `bootstrapMaxChars` (default 20,000 chars)
- Aggregate: `bootstrapTotalMaxChars` (default 150,000 chars)

**Diagnosis:** Run `/context list` to see loaded files, truncation status, and token counts.

### RAG Patterns for Agents

**1. Retrieve-then-Generate (Standard RAG)**
Search knowledge base -> inject relevant chunks -> generate response. Good for factual answers.

**2. Memory-Augmented RAG**
Combine RAG with persistent memory. Agent learns which docs are useful and remembers retrieval patterns.

**3. GraphRAG**
Use knowledge graph structure (entities + relationships) instead of flat chunks. Better for complex queries requiring multi-hop reasoning.

**4. Adaptive RAG**
Agent decides whether to search at all. If question is in working memory, skip retrieval. If ambiguous, search multiple sources.

### Context Verification

```
/context list    — View loaded files, truncation status, token counts
/verbose         — Confirm memory_search and memory_get tool calls
/new or /reset   — Start fresh session when stuck in overflow
```

---

## 7. Token Cost Optimization

### Why OpenClaw Burns Tokens

1. **Full conversation history** sent every request (40-50% of cost)
2. **Bootstrap files** loaded every session (SOUL.md, AGENTS.md, etc.)
3. **MCP tool descriptions** add 200-800 tokens per server
4. **Thinking/reasoning mode** can 10-50x usage
5. **Long heartbeat intervals** accumulate context between compactions

### Cost Reduction Strategies

| Strategy | Savings | Effort |
|----------|---------|--------|
| Use budget models (Minimax M2.7) | 80-90% | Config change |
| Per-agent MCP routing | 30-50% | Config change |
| Aggressive compaction | 40-60% | Config change |
| Context pruning (cache-ttl: 5m) | 20-30% | Config change |
| Disable thinking mode | 50-90% | Config change |
| Reduce heartbeat frequency | Proportional | Config change |
| Local embeddings (no API) | 100% on embeddings | Setup |
| Set `plugins.allow` explicit list | 10-20% startup | Config change |

### ZAO Cost Targets

| Agent | Model | Heartbeat | Monthly Budget |
|-------|-------|-----------|---------------|
| CEO | Minimax M2.7 | 5 min | $10 |
| Engineer | Claude (via Paperclip) | Manual | $15 |
| Researcher | Minimax M2.7 | Manual | $10 |
| Community Manager | Minimax M2.7 | 10 min | $5 |
| **Total** | | | **$40/mo** |

---

## 8. Multi-Agent Setup

### Running Multiple Agents

OpenClaw supports multiple fully isolated agents in one Gateway. Each agent has its own workspace, SOUL.md, AGENTS.md, and memory files. They share the same server process and config.

### Agent CLI

```bash
openclaw agents add researcher --workspace ~/openclaw-workspace/researcher
openclaw agents list
openclaw agents config set researcher model minimax/MiniMax-M2.7
```

### Per-Agent Configuration

Each agent can have:
- Own SOUL.md (personality)
- Own MCP servers (tool access)
- Own model (LLM backend)
- Own memory (separate workspace)
- Own heartbeat schedule

### Sub-Agent Spawning

Agents can spawn sub-agents programmatically:
```
sessions_spawn → child runs in own context with timeout → returns results to parent
```

### ZAO's 4-Agent Setup

| Agent | Role | MCP Servers | Heartbeat |
|-------|------|------------|-----------|
| **CEO** | Strategy, decompose goals into issues | GitHub, Brave Search | 300s |
| **Engineer** | Code tasks from issues | GitHub, Supabase, Filesystem | Manual |
| **Researcher** | Knowledge synthesis, web research | Brave, Tavily, Filesystem | Manual |
| **Community Manager** | Social, digest, onboarding | Supabase, Brave | 600s |

---

## 9. Cron & Automation

### Schedule Types

| Type | Syntax | Example |
|------|--------|---------|
| `cron` | Standard 5-field | `0 9 * * *` (9am daily) |
| `every` | Interval in ms | `every 3600000` (hourly) |
| `at` | One-shot ISO timestamp | `at 2026-04-01T09:00:00Z` |

### Session Styles

| Style | Use Case |
|-------|----------|
| `main` | Tasks needing full agent memory (CEO reviewing strategy) |
| `isolated` | Tasks starting fresh (digests, reminders — no context pollution) |
| `current` | Continue existing conversation (follow-up research) |
| `session:<key>` | Named persistent session (weekly report accumulating data) |

### ZAO Recommended Schedules

| Job | Schedule | Agent | Session | Delivery |
|-----|----------|-------|---------|----------|
| Daily community digest | `0 9 * * *` | Community Manager | isolated | Telegram |
| Weekly fractal reminder | `0 22 * * 1` | Community Manager | isolated | Telegram + Discord |
| Research staleness check | `0 14 * * 1` | Researcher | isolated | Direct to Zaal |
| Nightly GitHub sync | `0 2 * * *` | CEO | main | Internal |
| Knowledge base pull | `0 */6 * * *` | (crontab) | N/A | Git pull |

---

## 10. Skills System

### Skill Format

Skills are markdown files in `~/.openclaw/skills/{name}/SKILL.md` containing metadata and instructions for tool usage. Same pattern as Claude Code's `.claude/skills/`.

### ZAO Skills to Create

| Skill | Purpose | Priority |
|-------|---------|----------|
| `zao-research` | Search 225+ research docs, conduct web research | P0 |
| `community-digest` | Generate daily activity summary | P0 |
| `issue-decomposer` | Break goals into actionable GitHub issues | P1 |
| `gh-issues` | Auto-process GitHub issues via Telegram | P1 |
| `blogwatcher` | Monitor music/web3 RSS feeds | P2 |

### Porting Claude Code Skills

| Claude Code Skill | OpenClaw Equivalent | Effort |
|-------------------|-------------------|--------|
| `zao-research` | `zao-research` | 30 min (reformat SKILL.md) |
| `autoresearch` | Not portable (requires Claude Code runtime) | Skip |
| Custom skills (qa, review, ship) | Available as `coding-agent` skill | Config only |

---

## 11. ZAO-Specific Integration

### Files Connecting to OpenClaw

| Path | Purpose | Agent Connection |
|------|---------|-----------------|
| `scripts/openclaw-update-soul.sh` | Update SOUL.md on VPS | Run when persona changes |
| `scripts/openclaw-setup-github.sh` | Configure GitHub MCP + SOUL.md | One-time setup |
| `research/_graph/KNOWLEDGE.json` | Research index for retrieval | Filesystem MCP |
| `community.config.ts` | Community context | All agents reference |
| `.github/workflows/sync-to-paperclip.yml` | Issue sync | Triggers on issue events |

### VPS Configuration Files

| Path on VPS | Purpose |
|-------------|---------|
| `/home/zaal/openclaw/openclaw.json` | Gateway config: model, MCP servers, channels |
| `/home/zaal/openclaw/.env` | API keys and secrets |
| `/home/zaal/openclaw-workspace/SOUL.md` | Agent identity |
| `/home/zaal/openclaw-workspace/zaoos/` | Git clone of ZAO OS repo |
| `~/.openclaw/cron/` | Persistent cron storage |
| `~/.openclaw/skills/` | Skill definitions |

### Knowledge Retrieval Priority

Agents should search in this order:
1. `KNOWLEDGE.json` — Check tags and metadata first (fast, structured)
2. `research/*/README.md` — Read full doc when KNOWLEDGE.json points to it
3. `src/` — Check source code for implementation details
4. Web search — Use Brave/Tavily MCP when internal knowledge is insufficient

---

## 12. Immediate Action Items

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 1 | Update SOUL.md with anti-patterns + expertise domains + voice specificity | 15 min | Higher persona quality |
| 2 | Add `extraPaths` to memory config pointing to `research/**/*.md` | 5 min | 225+ docs searchable |
| 3 | Add Brave Search + Filesystem MCP servers | 10 min | Web search + file access |
| 4 | Add Supabase MCP server | 10 min | Direct database access |
| 5 | Configure per-agent MCP routing | 15 min | Reduced token overhead |
| 6 | Set up 3 cron routines (digest, fractal reminder, staleness check) | 20 min | Automated community ops |
| 7 | Git clone repo into workspace + auto-pull cron | 10 min | Full knowledge base |
| 8 | Set `plugins.allow` explicit list | 5 min | Faster startup, less memory |
| 9 | Add pre-compaction memory flush config | 5 min | Prevent context loss |
| 10 | Create `zao-research` skill in OpenClaw format | 15 min | Research retrieval |

**Total setup: ~110 minutes. Monthly cost: ~$40 (agent API) + $0 (MCP servers on free tiers).**

---

## Sources

### Official Documentation
- [OpenClaw GitHub (339K stars)](https://github.com/openclaw/openclaw)
- [OpenClaw Official Docs](https://docs.openclaw.ai/)
- [OpenClaw Memory Concepts](https://docs.openclaw.ai/concepts/memory)
- [OpenClaw Architecture](https://github.com/openclaw/openclaw/blob/main/docs/concepts/architecture.md)
- [OpenClaw Wikipedia](https://en.wikipedia.org/wiki/OpenClaw)
- [OpenClaw Token Usage & Costs](https://docs.openclaw.ai/reference/token-use)

### SOUL.md & Agent Identity
- [SOUL.md Guide — OpenClaw Blog](https://openclaws.io/blog/openclaw-soul-md-guide)
- [SOUL.md Generator (aaronjmars)](https://github.com/aaronjmars/soul.md)
- [OpenClaw Workspace Files Explained (Capodieci)](https://capodieci.medium.com/ai-agents-003-openclaw-workspace-files-explained-soul-md-agents-md-heartbeat-md-and-more-5bdfbee4827a)
- [SOUL.md Configuration Guide (Blink)](https://blink.new/blog/openclaw-heartbeat-soul-memory-configuration-guide-2026)
- [OpenClaw SOUL.md Personality (OpenClawConsult)](https://openclawconsult.com/lab/openclaw-soul-md)

### Memory System
- [OpenClaw Memory Masterclass (VelvetShark)](https://velvetshark.com/openclaw-memory-masterclass)
- [OpenClaw Memory Study (gaodalie)](https://gaodalie.substack.com/p/i-studied-openclaw-memory-system)
- [Memsearch (extracted memory system)](https://milvus.io/blog/we-extracted-openclaws-memory-system-and-opensourced-it-memsearch.md)
- [Manage OpenClaw Memory (TrilogyAI)](https://trilogyai.substack.com/p/how-to-manage-your-openclaw-memory)
- [OpenClaw Memory MasterClass Module 5 (tenten)](https://tenten.co/openclaw/en/docs/masterclass/module-05-memory)
- [Hindsight Memory Plugin](https://hindsight.vectorize.io/blog/2026/03/06/adding-memory-to-openclaw-with-hindsight)
- [Local RAG with SQLite (PingCAP)](https://www.pingcap.com/blog/local-first-rag-using-sqlite-ai-agent-memory-openclaw/)

### Knowledge Graph
- [Cognee-OpenClaw Integration](https://docs.cognee.ai/integrations/openclaw-integration)
- [Cognee OpenClaw Architecture (Blog)](https://www.cognee.ai/blog/integrations/what-is-openclaw-ai-and-how-we-give-it-memory-with-cognee)
- [Graphiti Plugin](https://openclawdir.com/plugins/graphiti-bw4y50)
- [Graphiti GitHub (openclaw-graphiti)](https://github.com/mgkcloud/openclaw-graphiti)
- [12-Layer Memory Architecture](https://github.com/coolmanns/openclaw-memory-architecture)
- [Graphiti Real-Time Knowledge Graphs (Zep)](https://github.com/getzep/graphiti)
- [GraphRAG & Knowledge Graphs (Fluree)](https://flur.ee/fluree-blog/graphrag-knowledge-graphs-making-your-data-ai-ready-for-2026/)

### MCP Servers
- [25 Best MCP Servers (PremAI)](https://blog.premai.io/25-best-mcp-servers-for-ai-agents-complete-setup-guide-2026/)
- [MCP Server Best Practices (CData)](https://www.cdata.com/blog/mcp-server-best-practices-2026)
- [MCP vs A2A Protocol Guide](https://dev.to/pockit_tools/mcp-vs-a2a-the-complete-guide-to-ai-agent-protocols-in-2026-30li)
- [MCP Security (Qualys)](https://blog.qualys.com/product-tech/2026/03/19/mcp-servers-shadow-it-ai-qualys-totalai-2026)
- [Building AI Agents with MCP (Red Hat)](https://developers.redhat.com/articles/2026/01/08/building-effective-ai-agents-mcp)

### Context Management
- [Agent Context Windows 2026 (Sparkco)](https://sparkco.ai/blog/agent-context-windows-in-2026-how-to-stop-your-ai-from-forgetting-everything)
- [LLM Context Problem (LogRocket)](https://blog.logrocket.com/llm-context-problem-strategies-2026)
- [Context Engineering for Agents (Weaviate)](https://weaviate.io/blog/context-engineering)
- [AI Agent Memory Best Practices (47billion)](https://47billion.com/blog/ai-agent-memory-types-implementation-best-practices/)
- [6 Best AI Agent Memory Frameworks (MLMastery)](https://machinelearningmastery.com/the-6-best-ai-agent-memory-frameworks-you-should-try-in-2026/)

### Token Optimization
- [ContextEngine Deep Dive (OpenClaw Blog)](https://openclaws.io/blog/openclaw-contextengine-deep-dive)
- [Token Cost Optimization (LaoZhang)](https://blog.laozhang.ai/en/posts/openclaw-cost-optimization-token-management)
- [Token Consumption Guide (Apiyi)](https://help.apiyi.com/en/openclaw-token-consumption-high-prompt-9600-solution-guide-en.html)

### Multi-Agent & Orchestration
- [OpenClaw Multi-Agent Setup (LumaDock)](https://lumadock.com/tutorials/openclaw-multi-agent-setup)
- [OpenClaw Agents Commands (Meta Intelligence)](https://www.meta-intelligence.tech/en/insight-openclaw-agents-guide)
- [9-Agent Setup (shenhao-stu)](https://github.com/shenhao-stu/openclaw-agents)
- [OpenClaw Handbook (codextech)](https://github.com/codextech/openclaw-handbook)

### ZAO Internal Research
- [Doc 197 — OpenClaw Agent Memory & Knowledge System](../197-openclaw-agent-memory-knowledge-system/)
- [Doc 202 — Multi-Agent Orchestration](../202-multi-agent-orchestration-openclaw-paperclip/)
- [Doc 204 — OpenClaw Setup Runbook](../204-openclaw-setup-runbook/)
- [Doc 205 — Deployment Plan](../205-openclaw-paperclip-elizaos-deployment-plan/)
- [Doc 207 — VPS Agent Stack Session Log](../207-zao-vps-agent-stack-session-log/)
- [Doc 208 — OpenClaw Skills & Capabilities](../208-openclaw-skills-capabilities/)
- [Doc 214 — ZAO Knowledge Graph](../214-zao-knowledge-graph/)
- [Doc 226 — Paperclip + OpenClaw Best Practices](../226-paperclip-openclaw-best-practices/)
