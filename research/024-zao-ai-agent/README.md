# 24 — ZAO AI Agent: Research, Architecture & Plan

> **Status:** Research complete, plan drafted
> **Goal:** Build an AI agent that manages the ZAO OS community — onboarding, music discovery, moderation, support, and curation
> **Date:** March 2026

---

## Table of Contents

1. [Current Codebase Integration Points](#1-current-codebase-integration-points)
2. [Agent Framework Comparison](#2-agent-framework-comparison)
3. [Recommended Architecture](#3-recommended-architecture)
4. [Agent Capabilities & Use Cases](#4-agent-capabilities--use-cases)
5. [Memory System Design](#5-memory-system-design)
6. [Farcaster Integration](#6-farcaster-integration)
7. [XMTP Integration](#7-xmtp-integration)
8. [Music Intelligence Layer](#8-music-intelligence-layer)
9. [Deployment & Infrastructure](#9-deployment--infrastructure)
10. [Implementation Plan](#10-implementation-plan)

---

## 1. Current Codebase Integration Points

### What ZAO OS Already Has

| System | Status | Agent Hook |
|--------|--------|------------|
| **Neynar API** (`/lib/farcaster/neynar.ts`) | 23 functions | Cast reading/writing, user lookup, social graph |
| **Neynar Webhooks** (`/api/webhooks/neynar`) | Real-time casts | Event-driven triggers for agent responses |
| **XMTP** (`/lib/xmtp/client.ts`, `/contexts/XMTPContext.tsx`) | DMs + groups | Private messaging channel for agent |
| **Supabase** (`/lib/database/supabase.ts`) | 7 tables | Storage for agent memory, interactions |
| **Allowlist** (`/lib/gates/allowlist.ts`) | FID/wallet gate | Agent can check membership status |
| **Session/Auth** (`/lib/auth/session.ts`) | Iron-session | Agent needs its own signer, not sessions |
| **Music** (`/lib/music/*`, audio providers) | Embeds + queue | Agent can recommend tracks, manage queue |
| **Respect Leaderboard** (`/api/respect/leaderboard`) | On-chain tokens | Agent can reference contribution standings |

### Key API Routes Agent Can Use

```
GET  /api/chat/messages          — Read channel feed
POST /api/chat/send              — Post cast (needs signer)
GET  /api/chat/thread/[hash]     — Read conversation threads
GET  /api/chat/search            — Search casts
GET  /api/users/[fid]/followers  — Social graph
GET  /api/respect/leaderboard    — Community standings
GET  /api/music/submissions      — Music queue
GET  /api/search/users           — Find users
POST /api/webhooks/neynar        — Real-time cast events
```

### What Needs to Be Built

1. **Agent signer** — Dedicated Farcaster account + managed signer for the agent
2. **Agent wallet** — Dedicated wallet for XMTP + potential on-chain actions
3. **Memory tables** — Supabase tables for agent memory (taste profiles, interaction history)
4. **Agent API routes** — New endpoints for agent-specific actions
5. **Agent process** — Persistent Node.js service (separate from Next.js app)

---

## 2. Agent Framework Comparison

### Top Contenders

| Framework | Farcaster | XMTP | Memory | Web3 | Setup | License |
|-----------|-----------|------|--------|------|-------|---------|
| **ElizaOS** | Native plugin | Native plugin | Built-in + MEM0 | 45+ plugins | Medium | MIT |
| **Claude Agent SDK** | Via MCP/tools | Via custom tools | Sessions + long-term | Via custom tools | Medium | Proprietary |
| **Vercel AI SDK v6** | Via custom tools | Via custom tools | You manage | Via custom tools | Easy | Apache 2.0 |
| **XMTP Agent SDK** | No | Native | SQLite | Via AgentKit | Easy | MIT |
| **Neynar Webhooks** | Native | No | You manage | Via custom code | Easy | N/A |
| **LangGraph** | Via custom tools | Via custom tools | Durable state | Via custom tools | Hard | MIT |
| **CrewAI** | No | No | Built-in | No | Medium | MIT |

### Recommendation: Hybrid Approach

**Primary: ElizaOS** — for the always-on agent with native Farcaster + XMTP plugins

**Why ElizaOS:**
- 17,800+ GitHub stars, 583 contributors, very active
- **Native Farcaster plugin** (`@elizaos/plugin-farcaster`) — uses Neynar under the hood
- **Native XMTP plugin** (`@elizaos/plugin-xmtp`) — encrypted DMs + groups
- Built-in memory system + MEM0 plugin for persistent context
- 45+ blockchain plugins (EVM chains, Solana, etc.)
- Character system for personality definition
- MIT license — fully open source
- One-click Railway deploy template
- Supports Claude, GPT-4, Llama, and other LLMs

**Secondary: Claude API** — as the LLM backbone for reasoning, music analysis, and memory extraction

**Why Claude:**
- Best reasoning quality for nuanced music/community context
- Memory extraction (implicit pattern recognition)
- Content moderation and sentiment analysis
- MCP integration for tool use

### Alternative: Vercel AI SDK v6

If we want tighter integration with the existing Next.js app:
- First-class Agent abstraction in TypeScript
- Full MCP support built in
- "Fluid compute" for long-running tasks
- Could run agent logic within Next.js API routes (webhook-driven, not always-on)
- Less mature for multi-platform agent scenarios

---

## 3. Recommended Architecture

```
┌─────────────────────────────────────────────────────┐
│                    ZAO OS Client                     │
│              (Next.js on Vercel)                     │
│                                                      │
│  /chat  /messages  /music  /social  /respect         │
└──────────┬──────────────────┬───────────────────────┘
           │                  │
           │ REST API         │ Webhooks
           ▼                  ▼
┌─────────────────────────────────────────────────────┐
│                  ZAO Agent Service                   │
│              (ElizaOS on Railway)                     │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Farcaster │  │  XMTP    │  │  Agent Brain     │  │
│  │ Plugin    │  │  Plugin  │  │  (Claude API)    │  │
│  │ (Neynar)  │  │          │  │                  │  │
│  └─────┬────┘  └────┬─────┘  └────────┬─────────┘  │
│        │            │                  │             │
│  ┌─────▼────────────▼──────────────────▼──────────┐ │
│  │              Memory Layer                       │ │
│  │  PostgreSQL + pgvector (Supabase)               │ │
│  │  - User taste profiles                          │ │
│  │  - Interaction history                          │ │
│  │  - Music knowledge graph                        │ │
│  │  - Community context                            │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │              Music APIs                         │ │
│  │  Audius · Sound.xyz · Spotify · Spinamp         │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Separation of Concerns

| Component | Where It Lives | Why |
|-----------|---------------|-----|
| **ZAO OS Client** | Vercel (Next.js) | User-facing app, serverless |
| **ZAO Agent** | Railway (ElizaOS) | Persistent process for XMTP streaming + Farcaster monitoring |
| **Database** | Supabase (shared) | Both client and agent read/write to same DB |
| **LLM** | Anthropic Claude API | Reasoning backbone |
| **Music APIs** | External | Agent calls directly for recommendations |

---

## 4. Agent Capabilities & Use Cases

### Phase 1: Community Support Agent

| Capability | How It Works | Channel |
|-----------|-------------|---------|
| **Welcome new members** | Detect new allowlist additions → send welcome DM with getting started guide | XMTP DM |
| **Answer FAQs** | Respond to /help, common questions about features, Respect, roles | Farcaster + XMTP |
| **Explain features** | "How do I earn Respect?", "What is ZAO?", "How do DMs work?" | Both |
| **Troubleshoot issues** | Signer problems, wallet connection, XMTP setup | XMTP DM |
| **Community announcements** | Post scheduled updates, weekly digests | Farcaster channel |

### Phase 2: Music Discovery Agent

| Capability | How It Works | Channel |
|-----------|-------------|---------|
| **Personalized recs** | Analyze listening history + taste profile → suggest tracks | XMTP DM |
| **"You might like..."** | Find members with similar taste, suggest connections | Both |
| **Weekly music digest** | Auto-generate top tracks of the week from community activity | Farcaster |
| **Genre exploration** | "Show me something like [artist] but more electronic" | Both |
| **New release alerts** | Monitor Sound.xyz/Audius for new drops from followed artists | XMTP DM |

### Phase 3: Moderation & Curation Agent

| Capability | How It Works | Channel |
|-----------|-------------|---------|
| **Spam detection** | Analyze cast quality via Neynar score + Claude analysis | Farcaster |
| **Content flagging** | Flag inappropriate content for admin review | Internal |
| **Curation scoring** | Track who submits quality music, reward via Respect | Internal |
| **Weekly leaderboards** | Generate and post curation leaderboards | Farcaster |
| **Role suggestions** | "This member qualifies for Curator based on activity" | Admin |

### Phase 4: Autonomous Agent

| Capability | How It Works | Channel |
|-----------|-------------|---------|
| **ERC-8004 identity** | Register agent on-chain with Identity, Reputation, Validation | On-chain |
| **Respect distribution** | Autonomously award Respect based on contribution metrics | On-chain |
| **Group management** | Create/manage XMTP groups for specific topics/genres | XMTP |
| **Cross-platform** | Post to Hive, share to other channels | Multi-platform |
| **Treasury management** | Manage small community fund for rewards/bounties | On-chain |

---

## 5. Memory System Design

### Schema (PostgreSQL + pgvector in Supabase)

```sql
-- Agent memory: user taste profiles
CREATE TABLE agent_user_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fid INTEGER NOT NULL,
  category TEXT NOT NULL,  -- 'genre', 'artist', 'mood', 'context', 'social'
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  confidence REAL DEFAULT 0.5,  -- 0-1
  source TEXT DEFAULT 'implicit',  -- 'implicit', 'explicit', 'behavioral'
  embedding vector(1536),
  reinforcement_count INTEGER DEFAULT 1,
  decay_rate REAL DEFAULT 0.05,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Agent memory: interaction history
CREATE TABLE agent_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fid INTEGER NOT NULL,
  channel TEXT NOT NULL,  -- 'farcaster', 'xmtp'
  message_type TEXT NOT NULL,  -- 'question', 'recommendation', 'feedback', 'moderation'
  user_message TEXT,
  agent_response TEXT,
  context JSONB,
  satisfaction TEXT,  -- 'positive', 'negative', 'neutral', null
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Agent memory: community-level knowledge
CREATE TABLE agent_community_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,  -- 'trending', 'event', 'decision', 'norm'
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  embedding vector(1536),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Social memory: taste overlaps between members
CREATE TABLE agent_social_graph (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fid_a INTEGER NOT NULL,
  fid_b INTEGER NOT NULL,
  overlap_score REAL DEFAULT 0,  -- 0-1
  shared_genres JSONB DEFAULT '[]',
  shared_artists JSONB DEFAULT '[]',
  interaction_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(fid_a, fid_b)
);
```

### Memory Flow

```
User Action → Implicit Extraction → Store Memory → Build Profile
     ↓                                                    ↓
  Listens to track                              Taste profile grows
  Shares a song                                 Confidence increases
  Reacts to recommendation                      Social graph updates
  Asks a question                               Context enriches
     ↓                                                    ↓
Agent Query → Recall Relevant Memories → Generate Response
```

### Consolidation Pipeline (Daily Cron)

1. Merge duplicate memories (same artist/genre with different confidence)
2. Reinforce frequently-confirmed memories (+0.1 confidence)
3. Decay old unreinforced memories (-decay_rate per week)
4. Compute social overlap scores between active members
5. Generate community-level trending insights
6. Prune memories with confidence < 0.1

---

## 6. Farcaster Integration

### Agent Account Setup

1. **Create dedicated FID** for the agent (e.g., `@zao-agent`)
2. **Register managed signer** via Neynar (same flow as user signers)
3. **Add to allowlist** so agent can participate in gated channels

### ElizaOS Farcaster Plugin

```typescript
// Character definition for ZAO Agent
{
  name: "ZAO",
  bio: "AI community curator for ZAO OS — a web3 music community on Farcaster",
  clients: ["farcaster", "xmtp"],
  modelProvider: "anthropic",
  settings: {
    secrets: {
      NEYNAR_API_KEY: "...",
      NEYNAR_SIGNER_UUID: "...",
      ANTHROPIC_API_KEY: "...",
    },
    farcaster: {
      FARCASTER_FID: "agent-fid",
      FARCASTER_NEYNAR_SIGNER_UUID: "...",
      FARCASTER_POLL_INTERVAL: 30000,  // 30s
    }
  },
  system: `You are ZAO, the AI curator for the ZAO OS music community...`,
}
```

### Trigger Patterns

| Trigger | Action |
|---------|--------|
| **@zao-agent mention** | Parse intent, respond in thread |
| **New cast in /zao channel** | Analyze content, detect music links, update knowledge |
| **Music link shared** | Extract metadata, categorize, update trending |
| **Question detected** | Route to FAQ or generate custom answer |
| **Keyword: "recommend"** | Pull taste profile, suggest tracks |

### Neynar Webhook Events

```typescript
// Subscribe to these webhook events:
{
  "cast.created": {
    channels: ["zao", "zabal", "coc"],
    mentionedFids: [AGENT_FID]
  },
  "reaction.created": {
    targetFids: [AGENT_FID]
  }
}
```

---

## 7. XMTP Integration

### Agent XMTP Setup

```typescript
// ElizaOS XMTP plugin handles:
// 1. Dedicated agent wallet (generated at setup)
// 2. XMTP client initialization on production network
// 3. Message streaming (persistent process)
// 4. DM + group chat support
```

### DM Use Cases

| Command | Agent Response |
|---------|---------------|
| `hi` / `hello` | Welcome message + community status |
| `recommend` | Personalized music recommendations |
| `help` | Feature guide + FAQ |
| `my taste` | Show their taste profile |
| `find someone like me` | Members with similar taste |
| `what's trending` | This week's top tracks |
| `new releases` | Recent drops from followed artists |

### Group Chat Management

- Agent can create genre-specific groups (e.g., "Electronic Music Heads")
- Auto-invite members based on taste profiles
- Moderate group conversations
- Share relevant new releases to genre groups

### Deployment Note

XMTP requires a **persistent process** — cannot run on serverless (Vercel). Must use Railway, Fly.io, or similar.

---

## 8. Music Intelligence Layer

### Data Sources

| Source | What Agent Gets | Auth |
|--------|----------------|------|
| **Audius** | Free streaming, track metadata, trending | No auth needed |
| **Sound.xyz** | NFT drops, collector data, artist releases | API key |
| **Spotify** | 30s previews, audio features (tempo, energy, danceability), recs | OAuth |
| **Spinamp** | Cross-platform aggregation | API key |
| **Last.fm** | Scrobbling, similar artists, listening history | API key |
| **Genius** | Lyrics, annotations, artist bios | API key |

### Music Knowledge Graph

The agent maintains a knowledge graph in Supabase:

```
Track → Artist → Genre → Mood
  ↓        ↓        ↓       ↓
Members who  Members who  Community  Playlist
listened     follow      preference  generation
```

### Recommendation Engine

1. **Content-based**: Audio features (Spotify) + genre tags → similar tracks
2. **Collaborative**: "Members like you also listened to..."
3. **Social**: "Your follows are listening to..."
4. **Trending**: Community-wide activity signals
5. **Serendipity**: Random exploration picks to avoid filter bubbles

---

## 9. Deployment & Infrastructure

### ElizaOS on Railway

| Resource | Spec | Cost |
|----------|------|------|
| **Compute** | Shared CPU, 512MB RAM | ~$5-10/mo |
| **Database** | Supabase (shared with ZAO OS) | Already have |
| **LLM** | Claude API | ~$10-50/mo depending on volume |
| **Music APIs** | Free tiers initially | $0 |
| **Total** | | **~$15-60/mo** |

### Environment Variables (Agent Service)

```env
# ElizaOS
DAEMON_PROCESS=true

# LLM
ANTHROPIC_API_KEY=...

# Farcaster (Neynar)
NEYNAR_API_KEY=...
FARCASTER_FID=...
FARCASTER_NEYNAR_SIGNER_UUID=...

# XMTP
AGENT_WALLET_KEY=...  # Dedicated agent wallet private key

# Database (shared Supabase)
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# Music APIs
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
AUDIUS_APP_NAME=zaoos
SOUND_API_KEY=...
LASTFM_API_KEY=...
```

### Monitoring

- Railway provides built-in logging
- Agent should log all interactions to `agent_interactions` table
- Set up alerts for: agent crashes, high error rates, rate limit warnings
- Weekly analytics: interactions served, satisfaction rates, recommendations made

---

## 10. Implementation Plan

### Phase 1: Foundation (Week 1-2)

**Goal:** Agent that responds to mentions in /zao channel and sends welcome DMs

1. **Set up ElizaOS project** — new repo `zao-agent`
2. **Create agent Farcaster account** — register FID, get managed signer from Neynar
3. **Create agent wallet** — for XMTP signing
4. **Configure ElizaOS character** — personality, system prompt, ZAO context
5. **Enable Farcaster plugin** — connect to Neynar, poll /zao channel
6. **Enable XMTP plugin** — connect agent wallet
7. **Deploy to Railway** — persistent process with `DAEMON_PROCESS=true`
8. **Basic FAQ responses** — answer common questions about ZAO OS
9. **Welcome DMs** — detect new allowlist members, send onboarding message

**Deliverables:**
- `zao-agent` repo with ElizaOS configured
- Agent live on Farcaster as `@zao-agent` (or similar)
- Agent responds to @mentions in /zao channel
- Agent sends welcome DMs via XMTP to new members

### Phase 2: Music Intelligence (Week 3-4)

**Goal:** Agent that understands music and makes recommendations

10. **Add memory tables** to Supabase (agent_user_memories, agent_interactions)
11. **Implicit memory extraction** — watch what members share/react to
12. **Connect music APIs** — Audius, Sound.xyz, Spotify
13. **Track metadata enrichment** — when music links are shared, fetch full metadata
14. **Taste profile building** — auto-build profiles from behavior
15. **Recommendation engine** — "recommend me something" → personalized picks
16. **Weekly digest** — auto-post top tracks of the week to /zao

**Deliverables:**
- Agent builds taste profiles from member activity
- `recommend` command returns personalized music suggestions
- Weekly music digest posted to channel

### Phase 3: Community Management (Week 5-6)

**Goal:** Agent that helps moderate, curate, and manage the community

17. **Spam detection** — flag low-quality casts using Neynar score + Claude analysis
18. **Curation scoring** — track who submits quality music
19. **Leaderboards** — weekly curation leaderboards posted to channel
20. **Role suggestions** — notify admins when members qualify for new roles
21. **Social matching** — "find someone with similar taste"
22. **Genre groups** — auto-create XMTP groups by genre interest

**Deliverables:**
- Spam flagging for admin review
- Weekly curation leaderboards
- Social taste matching
- Genre-based XMTP groups

### Phase 4: Autonomous Agent (Week 7+)

**Goal:** Agent with on-chain identity and autonomous capabilities

23. **ERC-8004 registration** — give agent on-chain identity
24. **Respect distribution** — autonomous Respect awards based on contribution
25. **Treasury management** — small community fund for bounties
26. **Cross-platform posting** — share to Hive, other channels
27. **Consolidation pipeline** — daily memory maintenance cron
28. **Advanced recommendations** — collaborative filtering, audio feature analysis

**Deliverables:**
- Agent has on-chain identity (ERC-8004)
- Autonomous Respect distribution
- Mature recommendation engine
- Full memory system with consolidation

---

## Key Design Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| **Framework** | ElizaOS | Native Farcaster + XMTP plugins, MIT license, large community |
| **LLM** | Claude (Anthropic) | Best reasoning for music/community context |
| **Separate repo** | Yes (`zao-agent`) | Agent is a persistent process, not serverless |
| **Deployment** | Railway | One-click ElizaOS template, ~$5-10/mo |
| **Memory** | Supabase + pgvector | Share DB with ZAO OS, semantic search |
| **Agent account** | Dedicated FID + wallet | Clean separation from app FID |
| **Privacy** | XMTP for sensitive, Farcaster for public | Encrypted DMs for personal recs |

---

## Competitive Advantage

No Farcaster community has:
- An AI agent with **music taste memory** that learns your preferences
- **Personalized recommendations** based on community listening patterns
- **Automated curation scoring** that feeds into a Respect token system
- **Social taste matching** connecting members with similar interests
- **On-chain agent identity** (ERC-8004) for trustless community management

This makes ZAO OS the first **AI-native music community** on Farcaster.

---

## Sources

- [ElizaOS GitHub](https://github.com/elizaOS/eliza) — 17,800+ stars
- [ElizaOS Farcaster Plugin](https://github.com/elizaos-plugins/client-farcaster)
- [ElizaOS XMTP Plugin](https://github.com/elizaos-plugins/client-xmtp)
- [ElizaOS Railway Deploy](https://railway.com/deploy/aW47_j)
- [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- [XMTP Agent SDK](https://www.npmjs.com/package/@xmtp/agent-sdk) — v1.1.16
- [XMTP Agent Examples](https://github.com/ephemeraHQ/xmtp-agent-examples)
- [Neynar Bot Guide](https://docs.neynar.com/docs/how-to-create-a-farcaster-bot)
- [Neynar Managed Signers](https://docs.neynar.com/docs/which-signer-should-you-use-and-why)
- [Vercel AI SDK v6](https://ai-sdk.dev/docs/introduction)
- [Coinbase AgentKit](https://github.com/coinbase/agentkit)
- [ERC-8004 Trustless Agents](https://eips.ethereum.org/EIPS/eip-8004)
- [MCP (Model Context Protocol)](https://www.anthropic.com/news/model-context-protocol)
- [Farcaster MCP Server](https://skywork.ai/skypage/en/unlocking-farcaster-ai-mcp-server/)
- [ETHSkills.com](https://ethskills.com/)
- [LangGraph](https://www.langchain.com/langgraph)
- [CrewAI](https://crewai.com/)
- [Clanker (Reference Agent)](https://clanker.world/about)
