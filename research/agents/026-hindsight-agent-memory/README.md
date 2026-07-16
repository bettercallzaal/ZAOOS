# 26 — Hindsight: Agent Memory System (vectorize-io/hindsight)

---
topic: agents
type: research
status: research-complete
last-validated: 2026-07-16
original-query: Evaluate Hindsight as a memory layer for ZAO OS AI agents (reconstructed)
tier: reference
---

> **Status:** Research complete
> **Source:** github.com/vectorize-io/hindsight
> **Goal:** Evaluate Hindsight as the memory layer for ZAO OS's AI agent
> **Date:** March 2026
> **Verdict:** Strong candidate — state-of-the-art agent memory, MIT license, TypeScript SDK, MCP support

---

## What Is Hindsight?

An open-source **agent memory system** by Vectorize.io that organizes memories the way human cognition works. Instead of basic vector store + retrieval, it uses "biomimetic data structures" with distinct memory pathways.

**Key achievement:** 91.4% on LongMemEval benchmark — first system to cross 90%. Independently verified by Virginia Tech and The Washington Post. Outperforms Mem0, Zep, LangMem, and Memobase.

---

## How It Works

### Three Core Operations

| Operation | What It Does |
|-----------|-------------|
| **Retain** | Ingest information. LLM extracts facts, entities, relationships, temporal data. Normalizes into canonical entities, time series, and search indexes. |
| **Recall** | Retrieve memories via 4 parallel strategies: semantic (vector), keyword (BM25), graph (entity/temporal/causal), temporal (time range). Merged via reciprocal rank fusion + cross-encoder reranking. |
| **Reflect** | Deep analysis over existing memories. Forms new connections, builds mental models, generates insights from accumulated knowledge. |

### Memory Pathways

| Pathway | Description | ZAO OS Mapping |
|---------|-------------|----------------|
| **World Facts** | Objective facts about the world | Community knowledge, music metadata |
| **Experiences** | Agent's own past interactions | Conversation history, user interactions |
| **Mental Models** | Synthesized understanding from reflection | User taste profiles, community trends |
| **Opinions** | Beliefs with confidence scores that evolve | "This user prefers ambient > techno" |

### Memory Banks

Memories are organized into **banks** (isolated memory spaces). Each bank can have metadata for per-user isolation.

```
ZAO Agent Memory
├── Bank: user_{fid}        — Per-user taste + interaction history
├── Bank: community         — Community-wide knowledge + trends
├── Bank: music_knowledge   — Track/artist/genre relationships
└── Bank: moderation        — Content patterns + decisions
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Core Server** | Python (uv workspace) |
| **Database** | PostgreSQL (embedded or external) |
| **Client SDKs** | TypeScript/Node.js, Python, Go, Rust |
| **LLM Providers** | OpenAI, Anthropic, Gemini, Groq, Ollama, LMStudio |
| **Deployment** | Docker, docker-compose, Helm (K8s), embedded Python mode |
| **Protocol** | HTTP REST API + MCP (Model Context Protocol) server |

### TypeScript Client

```typescript
import { HindsightClient } from '@vectorize-io/hindsight-client';

const client = new HindsightClient({ baseUrl: 'http://localhost:8123' });

// Store a memory
await client.retain({
  bank: `user_${fid}`,
  content: "User shared a Boards of Canada track and said it's their favorite artist",
});

// Recall relevant memories
const memories = await client.recall({
  bank: `user_${fid}`,
  query: "What kind of music does this user like?",
});

// Generate insights
const insights = await client.reflect({
  bank: `user_${fid}`,
  prompt: "Based on everything you know, what 3 artists would this user enjoy?",
});
```

---

## Repo Stats

| Metric | Value |
|--------|-------|
| **Stars** | ~18,500 (as of July 16, 2026) |
| **Forks** | ~1,100 |
| **License** | MIT |
| **Created** | October 2025 |
| **Current Version** | v0.8.4 (July 1, 2026) |
| **Activity** | Multiple commits daily, 100+ contributors |
| **Latest Release** | July 1, 2026 |
| **Paper** | arXiv:2512.12818 |

---

## How It Helps ZAO OS

### 1. AI Agent Memory Layer (Primary Use Case)

Replace the custom pgvector memory system planned in research/24 with Hindsight:

| Planned Custom Build | Hindsight Equivalent |
|---------------------|---------------------|
| `agent_user_memories` table + pgvector | Per-user memory banks with automatic entity extraction |
| Manual taste profile building | Mental models pathway (auto-synthesized) |
| `agent_interactions` table | Experiences pathway |
| `agent_community_memory` table | Community memory bank with world facts |
| `agent_social_graph` table | Graph-based recall (entity relationships) |
| Daily consolidation pipeline | Reflect operation (on-demand or scheduled) |

### 2. Music Taste Memory

The mental models feature maps directly to taste profiles:
- User shares music → Hindsight retains entities (artist, genre, mood)
- Over time, reflect builds mental models: "This user gravitates toward artists blending jazz and electronic"
- Recall with temporal awareness: "What has this user's taste shifted toward recently?"

### 3. Community Knowledge Base

Feed community conversations into a shared bank:
- "What has the community been discussing about web3 music?"
- "Which genres are trending this month?"
- "What's the consensus on Sound.xyz vs Audius?"

### 4. Personalized Recommendations

Reflect powers recommendation logic:
- "Based on user X's taste + recent community discussions, suggest 3 artists"
- "Find members with overlapping mental models (similar taste)"
- "What new releases match this user's profile?"

---

## Architecture with ZAO OS

```
┌─────────────────────────────────────────┐
│           ZAO OS Client                  │
│         (Next.js on Vercel)              │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│          ZAO Agent Service               │
│        (ElizaOS on Railway)              │
│                                          │
│  ┌──────────┐  ┌──────────┐             │
│  │ Farcaster │  │  XMTP    │             │
│  │ Plugin    │  │  Plugin  │             │
│  └─────┬────┘  └────┬─────┘             │
│        │            │                    │
│  ┌─────▼────────────▼──────────────────┐│
│  │         Claude API (LLM)            ││
│  └─────────────┬───────────────────────┘│
│                │                         │
│  ┌─────────────▼───────────────────────┐│
│  │      Hindsight Memory Server        ││
│  │    (Docker on Railway, ~$5/mo)      ││
│  │                                     ││
│  │  Banks:                             ││
│  │  - user_{fid} (per member)          ││
│  │  - community (shared knowledge)     ││
│  │  - music (track/artist graph)       ││
│  │                                     ││
│  │  Operations:                        ││
│  │  - retain (store memories)          ││
│  │  - recall (retrieve context)        ││
│  │  - reflect (generate insights)      ││
│  └─────────────────────────────────────┘│
└──────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Supabase (PostgreSQL)            │
│  (Application data — casts, allowlist,   │
│   sessions, songs, scheduled_casts)      │
└──────────────────────────────────────────┘
```

### Separation of Concerns

| Data | Where |
|------|-------|
| **Application data** (casts, users, allowlist) | Supabase PostgreSQL |
| **Agent memory** (taste, interactions, insights) | Hindsight |
| **Real-time events** | Neynar webhooks → Agent → Hindsight retain |

---

## Hindsight vs Alternatives

| System | LongMemEval Score | Strengths | Weaknesses |
|--------|------------------|-----------|------------|
| **Hindsight** | **91.4%** | SOTA accuracy, MIT license, MCP support, TypeScript SDK | Young (5 months), Python server, extra infra |
| **Mem0** | ~75% | Most mature, most integrations, 80% token reduction | Lower accuracy, expensive cloud tier |
| **Zep** | ~70% | Best temporal knowledge graphs | Lower accuracy, more complex setup |
| **LangMem** | ~65% | Free, tight LangGraph integration | Requires managing own infra |
| **Custom pgvector** | N/A | Already in stack, full control | No entity extraction, no reflection, no temporal modeling |
| **Letta (MemGPT)** | ~72% | Self-editing memory, agent framework | Different paradigm, more opinionated |

---

## MCP Integration

Hindsight ships as an **MCP server** — meaning Claude can connect to it directly as a tool:

```json
{
  "mcpServers": {
    "hindsight": {
      "command": "docker",
      "args": ["run", "-p", "8123:8123", "vectorize/hindsight"]
    }
  }
}
```

This means the Claude Agent SDK can use Hindsight's retain/recall/reflect as native tools without any custom integration code.

---

## Deployment

### Self-Hosted (Recommended for ZAO OS)

```bash
# Docker (v0.6.2 - May 2026)
export OPENAI_API_KEY=sk-xxx
docker run --rm -it --pull always -p 8888:8888 -p 9999:9999 \
  -e HINDSIGHT_API_LLM_API_KEY=$OPENAI_API_KEY \
  -v $HOME/.hindsight-docker:/home/hindsight/.pg0 \
  ghcr.io/vectorize-io/hindsight:latest

# Or with external PostgreSQL
docker run -p 8123:8123 \
  -e LLM_PROVIDER=anthropic \
  -e ANTHROPIC_API_KEY=... \
  vectorize/hindsight:latest
```

### Docker Compose with PostgreSQL

Latest deployment pattern (v0.6.0+) via docker-compose in `docker/docker-compose/` directory.

### Enterprise: Oracle 23ai Backend

As of v0.6.0 (May 2026), Hindsight supports Oracle Database 23ai as an alternative to PostgreSQL. Full feature parity with unified Alembic migration system.

### Railway

Deploy as a separate Railway service alongside agents:
- ~$5-10/mo for container
- PostgreSQL included (embedded) or connect to external

### Cost Breakdown

| Component | Cost |
|-----------|------|
| Hindsight server (Railway) | ~$5-10/mo |
| LLM calls for memory extraction | ~$5-20/mo (depends on volume) |
| Total added cost | **~$10-30/mo** |

---

## Implementation Plan

### Phase 1: Deploy & Connect

1. Deploy Hindsight Docker on Railway
2. Configure Anthropic as LLM provider
3. Create memory banks: `community`, `music_knowledge`
4. Connect TypeScript client in `zao-agent` repo

### Phase 2: Per-User Memory (v0.6.0+)

5. Create `user_{fid}` banks as members interact
6. Retain from: music shares, reactions, conversations, taste signals
7. Recall before generating recommendations or responses
8. Reflect weekly to build/update taste mental models
9. Use multi-strategy retrieval (TEMPR): semantic + BM25 + graph + temporal

### Phase 3: Community Intelligence

10. Feed all /zao channel activity into community bank
11. Reflect on community trends (weekly cron)
12. Generate "This Week in ZAO" summaries from reflect
13. Social taste matching via cross-bank recall
14. Leverage shared multi-agent memory patterns (guide: hindsight.vectorize.io/guides/building-multi-agent-systems)

### Phase 4: Advanced

15. MCP integration with Claude Agent SDK + Dify/n8n workflows (v0.6.0 integration option)
16. Music knowledge graph from artist/genre/track relationships
17. Temporal taste evolution tracking (entity co-occurrence timestamps fixed in v0.6.0)
18. A/B test recommendation quality vs baseline
19. AWS Bedrock AgentCore integration option (v0.6.0)

---

## Key Decision

**Use Hindsight instead of building custom pgvector memory system.**

Why:
- 91.4% accuracy vs building from scratch
- Entity extraction, temporal modeling, graph recall built-in
- Mental models = taste profiles, auto-generated
- Reflect operation = recommendation engine, built-in
- MCP support = direct Claude integration
- MIT license, actively maintained, ~$10-30/mo total cost
- TypeScript SDK fits our stack

Keep Supabase/pgvector for application data. Use Hindsight exclusively for agent memory.

---

## Sources [FULL - May 21, 2026]

- [GitHub: vectorize-io/hindsight](https://github.com/vectorize-io/hindsight) - 13,745 stars, v0.6.2 May 2026
- [Hindsight Docs](https://hindsight.vectorize.io/) - Full documentation + Cookbook
- [What's New in Hindsight 0.6.0](https://hindsight.vectorize.io/blog/2026/05/05/version-0-6-0) - Oracle 23ai, Dify/n8n, SmolAgents, AWS Bedrock integrations
- [Building Multi-Agent Systems with Shared Memory Guide](https://hindsight.vectorize.io/guides/2026/04/21/guide-building-multi-agent-systems-with-shared-memory) - Bank patterns, cross-team memory
- [Building AI Agents That Actually Learn](https://vectorize.io/blog/hindsight-building-ai-agents-that-actually-learn)
- [Hindsight MCP Agent Memory](https://hindsight.vectorize.io/blog/2026/03/04/mcp-agent-memory)
- [Research Paper (arXiv:2512.12818)](https://arxiv.org/abs/2512.12818) - Biomimetic memory structures
- [Agent Memory Comparison 2026](https://dev.to/anajuliabit/mem0-vs-zep-vs-langmem-vs-memoclaw-ai-agent-memory-comparison-2026-1l1k)
- [Vectorize.io](https://vectorize.io/) - Company homepage

Updated 2026-05-21: Stars 3.6K → 13.7K in 2 months. v0.6.0 adds enterprise Oracle backend, 4 new framework integrations (Dify, n8n, SmolAgents, AWS Bedrock), and reliability fixes for multi-agent deployments. Hindsight is now production-grade for enterprise multi-agent teams.

Updated 2026-07-16: Version jumped v0.6.2 → v0.8.4 (July 1, 2026); stars grew 13.7K → ~18.5K; forks 786 → ~1,100. v0.8.0 (June 8) added direct **Claude Agent SDK integration** (critical for ZAO: no custom glue needed), LangGraph + OpenAI Agents support, semantic deduplication of near-duplicate observations (0.97 threshold default), LLM prompt-prefix caching across all providers, and bank-to-bank document export/import for cross-instance migration. v0.8.4 (July 1) added **GitHub Copilot + Devin Desktop (formerly Windsurf) via MCP**, Aider session-bracketing memory, Eve agent-framework MCP helper, multi-LLM failover/round-robin config, configurable recency decay (linear/exponential/none), and cron-scheduled mental-model refresh. The 91.4% LongMemEval score (Gemini-3) is still accurate overall; Hindsight now also claims 94.6% on the single-session assistant category of LongMemEval-S. Competitor ByteRover entered the benchmark at 92.8% (LongMemEval-S) but with self-reported scores. No breaking changes in v0.8.x. Sources: https://github.com/vectorize-io/hindsight/releases — verified via full GitHub fetch July 16, 2026.
