# 300 - AI Memory & Agent Infrastructure Tools

> **Status:** Research complete
> **Date:** April 8, 2026
> **Goal:** Evaluate MemPalace, Archivist OSS, and related memory/infrastructure tools for ZAO OS agent stack

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **MemPalace** | INSTALL for personal dev workflow - 96.6% recall, local-only, MIT license, MCP server with 19 tools. Great for Zaal's personal knowledge across projects |
| **Archivist OSS** | SKIP for now - designed for multi-agent fleets with Docker/Qdrant. Overkill for solo dev. Revisit when ZOE agent squad needs shared memory |
| **Oh-My-Mermaid** | INSTALL - generates architecture diagrams from codebase automatically. MIT license. `/omm-scan` produces Mermaid diagrams of ZAO OS structure |
| **Auto-save hooks** | USE MemPalace's Claude Code hooks (save every 15 messages, emergency save before compaction) to prevent context loss |
| **Knowledge graph** | MemPalace has SQLite-based knowledge graph (entity-relationship triples) - complements Graphify's concept graph |
| **For ZOE VPS agents** | Archivist is the right choice LATER when we need fleet memory. Apache 2.0, Docker-native, RBAC, 30 MCP tools |

---

## Comparison of Options

| Tool | Purpose | Recall | Storage | MCP Tools | License | Docker Required | ZAO OS Priority |
|------|---------|--------|---------|-----------|---------|-----------------|-----------------|
| **MemPalace** | Personal AI memory | 96.6% | ChromaDB + SQLite | 19 | MIT | No | HIGH - install now |
| **Archivist OSS** | Fleet memory for agents | 89.7% | Qdrant + SQLite | 30 | Apache 2.0 | Yes | LOW - later for ZOE |
| **Claude auto-memory** | Session persistence | Unknown | Markdown files | 0 | Built-in | No | Already have it |
| **Graphify** (Doc 297) | Code/research graph | N/A | NetworkX JSON | 0 | MIT | No | HIGH - install now |

---

## MemPalace (milla-jovovich/mempalace)

### What It Does

Local-first AI memory system. Stores conversations and project data in a structured "memory palace" (ChromaDB vector store). 96.6% recall on LongMemEval benchmark with zero API calls.

### Palace Architecture

```
Palace
+-- Wings (people/projects)
    +-- Rooms (topics)
        +-- Halls (memory types)
            +-- Facts
            +-- Events
            +-- Discoveries
            +-- Preferences
            +-- Advice
        +-- Tunnels (cross-wing connections)
        +-- Closets (summaries)
        +-- Drawers (verbatim originals)
```

### 4-Layer Memory Stack

| Layer | Content | Tokens | Loaded |
|-------|---------|--------|--------|
| L0 | Identity (who you are, what you're building) | ~50 | Always |
| L1 | Critical facts (decisions, preferences) | ~120 | Always |
| L2 | Project details, recent context | On-demand | When searched |
| L3 | Deep history, verbatim records | On-demand | When searched |

L0 + L1 always loaded = minimal token overhead. L2/L3 searched semantically when needed.

### MCP Server (19 Tools)

Search, store, knowledge graph queries, navigation, agent diary operations. Connect to Claude Code, Cursor, or any MCP-compatible tool.

### Auto-Save Hooks

- Save every 15 messages automatically
- Emergency save before context compaction
- This solves the "lost context" problem in long sessions

### Installation

```bash
pip install mempalace
mempalace init
mempalace mine  # processes existing conversations/projects
```

### Why It Matters for ZAO OS

Zaal works across 15+ repos (ZAO OS, BetterCallZaal, FISHBOWLZ, etc.). MemPalace creates a unified memory across all projects. "What did I decide about XMTP last week?" works even if that conversation was in a different Claude Code session on a different repo.

---

## Archivist OSS (NetworkBuild3r/archivist-oss)

### What It Does

Memory-as-a-Service for AI agent fleets. Single MCP endpoint combining vector search (Qdrant), knowledge graph (SQLite), and BM25 full-text search. 30 MCP tools, RBAC, background curation.

### 10-Stage Retrieval Pipeline

```
Vector Search -> BM25 Fusion -> Graph Augmentation -> Dedup ->
Temporal Decay -> Hotness Scoring -> Threshold Filter -> Rerank ->
Parent Enrichment -> Context Budget -> LLM Refinement -> Synthesis
```

### Key Features

- **Multi-agent RBAC** - namespace-level read/write ACLs
- **Active background curator** - extracts entities, resolves contradictions, compresses stale memories
- **Skill registry** - tracks tool health, failure modes, success rates
- **Trajectory learning** - logs execution with outcomes, extracts tips
- **Benchmarks:** 89.7% recall, 44x faster than context stuffing, 20x fewer tokens

### Why NOT Now

- Requires Docker + Qdrant + OpenAI-compatible LLM endpoint
- Designed for multi-agent fleets, not solo dev
- 40+ Python modules - heavyweight

### Why LATER (for ZOE)

When ZOE + ZOEY + WALLET agents need shared memory on the VPS, Archivist is the right choice:
- Apache 2.0 license (can use commercially)
- Docker-native (VPS already runs Docker)
- RBAC for agent isolation
- 30 MCP tools for comprehensive memory operations
- Trajectory learning = agents learn from past mistakes

---

## Oh-My-Mermaid (oh-my-mermaid/oh-my-mermaid)

### What It Does

AI-powered architecture documentation. Your AI analyzes the codebase and produces Mermaid diagrams + docs organized as "perspectives" (structure, data flow, integrations). Recursive nesting - complex nodes become sub-diagrams.

### How It Works

```bash
npm install -g oh-my-mermaid && omm setup
```

Then in Claude Code:
- `/omm-scan` - generates architecture docs as Mermaid diagrams + markdown
- `/omm-push` - upload to ohmymermaid.com (optional, private by default)

### Output Structure

```
.omm/
+-- perspectives/
    +-- structure/
    +-- data-flow/
    +-- integrations/
    +-- (each with nested .mmd diagrams + descriptions)
```

### Why It Matters for ZAO OS

ZAO OS has 863 source files across auth, music, spaces, governance, messaging, and more. Architecture diagrams would help:
- Onboarding new contributors (fork-friendly goal)
- Understanding data flow between Supabase, Neynar, XMTP, Stream.io
- Documenting the 9-provider music player architecture
- Visualizing the governance system (3 tiers)

MIT-licensed. No external dependencies beyond Node.js.

---

## ZAO OS Integration

### Install Today

```bash
# MemPalace - personal memory across all projects
pip install mempalace && mempalace init

# Oh-My-Mermaid - architecture diagrams
npm install -g oh-my-mermaid && omm setup

# Then in Claude Code:
# /omm-scan (generates architecture docs)
```

### Configure MemPalace MCP

Add to `.claude/settings.json`:
```json
{
  "mcpServers": {
    "mempalace": {
      "command": "mempalace",
      "args": ["mcp"]
    }
  }
}
```

### For ZOE VPS (Future)

When the agent squad needs shared memory:
1. Deploy Archivist on VPS: `docker compose up -d`
2. Configure namespace RBAC for ZOE, ZOEY, WALLET
3. Connect via MCP endpoint
4. Enable trajectory learning for agent self-improvement

### Files to Touch

- `community.config.ts` - no changes needed
- `.claude/settings.json` - add MemPalace MCP server config
- `.omm/` - generated by oh-my-mermaid (add to .gitignore or commit for docs)

---

## Sources

- [MemPalace GitHub](https://github.com/milla-jovovich/mempalace) - MIT, v3.0.0, 96.6% recall
- [Archivist OSS GitHub](https://github.com/NetworkBuild3r/archivist-oss) - Apache 2.0, v1.7.0
- [Oh-My-Mermaid GitHub](https://github.com/oh-my-mermaid/oh-my-mermaid) - MIT, architecture diagrams
- [Nyk's 3-layer memory architecture](https://x.com/nyk_builderz/status/2030904887186514336) - Claude + Obsidian stack
- [MemPalace LongMemEval benchmark](https://github.com/milla-jovovich/mempalace) - 96.6% independently reproduced
