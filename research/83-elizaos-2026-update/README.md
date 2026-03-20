# 83 — ElizaOS March 2026 Update: Current State for ZAO Community Bot

> **Status:** Research complete
> **Goal:** Update doc 24 findings with ElizaOS current state (March 2026) — versions, v2 changes, plugin status, deployment
> **Date:** March 19, 2026
> **Supersedes:** Portions of doc 24 (framework comparison + version info)

---

## Table of Contents

1. [Version Status](#1-version-status)
2. [V1 to V2 Breaking Changes](#2-v1-to-v2-breaking-changes)
3. [Farcaster Plugin](#3-farcaster-plugin)
4. [XMTP Plugin](#4-xmtp-plugin)
5. [Database & Memory](#5-database--memory)
6. [Character File Format](#6-character-file-format)
7. [LLM Providers & Cost](#7-llm-providers--cost)
8. [Deployment](#8-deployment)
9. [Music Plugins](#9-music-plugins)
10. [GitHub Health & Ecosystem](#10-github-health--ecosystem)
11. [Alternatives Comparison 2026](#11-alternatives-comparison-2026)
12. [Impact on Doc 24 Plan](#12-impact-on-doc-24-plan)

---

## 1. Version Status

| Metric | Value |
|--------|-------|
| **Latest stable (v1)** | v1.7.2 (released Jan 19, 2026) |
| **Latest alpha (v2)** | v2.0.0-alpha.76 (released Mar 19, 2026 — today) |
| **Release velocity** | Extremely high — 9 alpha releases on Mar 19 alone (alpha.67–76) |
| **Total releases** | 345+ |
| **GitHub stars** | 17,800+ |
| **Language mix** | TypeScript 51.5%, Rust 21.6%, Python 11.2%, JS 6.2%, Solidity 4.9% |

### Version Decision for ZAO

**Use v1.7.2 (stable)** for initial deployment. V2 is in rapid alpha churn — multiple releases per day suggests it is not production-ready. The v1 branch has the stable Farcaster + XMTP plugins documented in doc 24.

**Watch v2 for migration** once it reaches beta/RC. The v2 architecture (event-driven, HTN task planning) is superior but not stable enough yet.

### Install Commands

```bash
# V1 (stable, production)
bun i -g @elizaos/cli
elizaos create
elizaos start

# V2 (alpha, experimental)
bun i -g @elizaos/cli@alpha
```

---

## 2. V1 to V2 Breaking Changes

V2 introduces a fundamentally different architecture. Key breaking changes from the migration guide:

### Package Renames
- `@ai16z/eliza` renamed to `@elizaos/core` (this happened in 0.x → 1.x, already reflected in doc 24)

### Architecture Changes (v1 → v2)
| Area | v1 | v2 |
|------|----|----|
| **Architecture** | Request/response | Event-driven with Hierarchical Task Networks (HTN) |
| **Entity model** | User/Participant | Entity/Room/World paradigm |
| **Wallet** | Per-plugin wallets | Unified wallet system (multi-chain from single interface) |
| **Task planning** | Simple actions | HTN — agents break complex tasks into structured steps |
| **Plugin system** | Direct imports | Package registry + CLI management |
| **Build tool** | Various | Standardized on tsup |
| **Test framework** | Vitest | Bun's built-in test runner |
| **Linting** | Biome | Prettier |

### API Breaking Changes
| v1 | v2 |
|----|----|
| `generateText()` | `useModel()` |
| `ensureUserExists()` | `ensureConnection()` |
| `evaluate()` returns `string[]` | Returns `Evaluator[]` objects |
| Actions return `{ text: "..." }` | Must return `ActionResult` with `success` field |
| `vi.fn()` (Vitest) | `mock()` (Bun test) |
| Plugin class-based imports | `import { farcasterPlugin }` functional imports |

### What This Means for ZAO

Doc 24's code examples use v1 patterns (character files with `clients`, `modelProvider`). These will work on v1.7.2 but will need updating for v2. The character file format itself appears largely unchanged — the breaking changes are primarily in plugin internals and runtime APIs.

---

## 3. Farcaster Plugin

### Package: `@elizaos/plugin-farcaster` v1.0.5

| Feature | Status | Details |
|---------|--------|---------|
| **Post casts** | Yes | Autonomous casting with configurable intervals |
| **Reply to casts** | Yes | Threaded conversations, reply chains |
| **Read mentions** | Yes | Polls for @mentions and processes with AI |
| **Channel support** | Yes | Configurable channel list (e.g., `/zao`, `/music`) |
| **Likes/recasts** | Yes | Engagement capabilities |
| **Media support** | Yes | Images, links, frames in casts |
| **Neynar SDK** | Yes | Uses `@neynar/nodejs-sdk` under the hood |
| **Channel joining** | Not confirmed | No explicit channel join/leave API found |

### Required Configuration

```env
FARCASTER_NEYNAR_API_KEY=...       # Neynar API key
FARCASTER_NEYNAR_SIGNER_UUID=...   # Managed signer UUID
FARCASTER_FID=...                  # Agent's Farcaster ID
```

### Character Settings for Farcaster

```json
{
  "settings": {
    "farcaster": {
      "channels": ["/zao", "/music"],
      "replyProbability": 0.8
    }
  }
}
```

### Key Limitation

The `client-farcaster` GitHub repo is **archived** and marked for migration to the newer `plugin-farcaster` structure. Use the npm package `@elizaos/plugin-farcaster` v1.0.5 (published ~Jan 2026).

### Issue to Watch

[GitHub Issue #5943](https://github.com/elizaOS/eliza/issues/5943) — "Update Neynar SDK (Farcaster)" — suggests the Neynar SDK version may be outdated. Check compatibility with current Neynar API.

---

## 4. XMTP Plugin

### Package: `@elizaos/plugin-xmtp` v1.1.0

| Feature | Status | Details |
|---------|--------|---------|
| **DMs** | Yes | 1:1 encrypted messaging |
| **Group chats** | Yes | Multi-agent multi-human MLS groups |
| **E2E encryption** | Yes | MLS protocol (Messaging Layer Security) |
| **XMTP version** | MLS-based | Compatible with XMTP's MLS infrastructure |
| **EOA wallets** | Yes | Standard Ethereum wallets |
| **Smart contract wallets** | Yes | SCW support with chain ID config |
| **Metadata protection** | Yes | No tracking of IPs, routes, timestamps |

### Required Configuration

```env
WALLET_KEY=...              # Agent's wallet private key
XMTP_SIGNER_TYPE=EOA        # or SCW for smart contract wallets
XMTP_ENV=production          # dev, local, or production
```

### XMTP Network Status (March 2026)

XMTP mainnet was expected to launch around March 2026. This is significant — the ZAO agent should target the production XMTP network rather than dev/testnet.

### Key Consideration

XMTP requires a **persistent process** (streaming messages). Cannot run on Vercel serverless. Confirmed: Railway or similar always-on hosting required. This aligns with doc 24's architecture.

---

## 5. Database & Memory

### Available Adapters

| Adapter | Package | Use Case |
|---------|---------|----------|
| **Supabase** | `@elizaos/adapter-supabase` | Production — integrates with existing ZAO OS Supabase |
| **PostgreSQL** | `@elizaos/adapter-postgres` | Production — pgvector support for semantic search |
| **PGLite** | `@elizaos/adapter-pglite` | Development/testing — embedded, no setup |
| **plugin-sql** | Built-in | Default — supports PostgreSQL + PGLite |

### Supabase Adapter Details

- Official plugin: [`elizaos-plugins/adapter-supabase`](https://github.com/elizaos-plugins/adapter-supabase)
- Requires running `schema.sql` migration for ElizaOS tables
- Handles: memory storage, relationship tracking, knowledge management
- **Compatible with ZAO OS's existing Supabase instance** (shared database)

### PostgreSQL Adapter Details

- Vector embedding storage with `pgvector` extension
- Supports multiple embedding models: OpenAI, Ollama, GaiaNet
- Semantic search capabilities for memory retrieval

### ZAO Recommendation

Use the **Supabase adapter** since ZAO OS already uses Supabase. The agent's memory tables (from doc 24: `agent_user_memories`, `agent_interactions`, `agent_community_memory`, `agent_social_graph`) can coexist in the same database. Run ElizaOS's `schema.sql` migration alongside the custom ZAO agent tables.

---

## 6. Character File Format

The character file is JSON with these fields:

```json
{
  "name": "ZAO",
  "bio": "AI community curator for The ZAO — a web3 music community on Farcaster",
  "description": "High-level summary of identity and purpose",
  "plugins": [
    "@elizaos/plugin-farcaster",
    "@elizaos/plugin-xmtp",
    "@elizaos/plugin-knowledge",
    "@elizaos/plugin-openai"
  ],
  "modelProvider": "anthropic",
  "lore": [
    "ZAO stands for ZTalent Artist Organization",
    "Founded to empower independent musicians through web3",
    "Backstory elements the AI draws from but doesn't reveal directly"
  ],
  "knowledge": [
    "Small knowledge snippets embedded directly",
    "For larger knowledge, use @elizaos/plugin-knowledge"
  ],
  "messageExamples": [
    [
      { "user": "member", "content": { "text": "What is Respect?" } },
      { "user": "ZAO", "content": { "text": "Respect is our community token on Optimism..." } }
    ]
  ],
  "postExamples": [
    "Weekly music digest: here are the top tracks shared in /zao this week..."
  ],
  "topics": ["web3 music", "Farcaster", "independent artists", "music discovery"],
  "style": {
    "all": ["Warm but knowledgeable", "Music-first perspective"],
    "chat": ["Conversational", "Helpful"],
    "post": ["Engaging", "Community-focused"]
  },
  "adjectives": ["knowledgeable", "supportive", "music-obsessed", "community-minded"],
  "settings": {
    "secrets": {
      "ANTHROPIC_API_KEY": "...",
      "NEYNAR_API_KEY": "..."
    },
    "farcaster": {
      "channels": ["/zao"],
      "replyProbability": 0.8
    }
  }
}
```

### Key Points

- **Minimal requirement**: `name`, `bio`, and `plugins` — everything else optional
- **`lore`** is backstory the agent draws from indirectly (not revealed verbatim)
- **`style`** has separate keys for `all`, `chat`, and `post` contexts
- **`knowledge`** can include inline snippets or use the `plugin-knowledge` for larger RAG
- **`modelProvider`** supports: `anthropic`, `openai`, `ollama`, `google`, `grok`

---

## 7. LLM Providers & Cost

### Supported Models

ElizaOS supports all major LLM providers:

| Provider | Models | Config Value |
|----------|--------|-------------|
| **Anthropic** | Claude Sonnet 4, Opus 4 | `anthropic` |
| **OpenAI** | GPT-4o, GPT-4.1 | `openai` |
| **Google** | Gemini 2.5 | `google` |
| **Meta** | Llama 3+ (via Ollama) | `ollama` |
| **xAI** | Grok | `grok` |
| **Local** | Any Ollama model | `ollama` |

### Cost Estimate for ZAO Agent

| Component | Monthly Cost |
|-----------|-------------|
| Claude API (Sonnet 4 for most tasks) | $10–50 depending on volume |
| Railway compute | $5–10 |
| Neynar API | Free tier (1,000 req/day) or $9/mo |
| Supabase | Already paid |
| **Total** | **$15–70/mo** |

Doc 24's cost estimate of $15–60/mo remains accurate. Slight increase possible if using Claude Opus 4 for complex reasoning tasks.

---

## 8. Deployment

### Railway (Recommended)

- **One-click deploy template**: [railway.com/deploy/aW47_j](https://railway.com/deploy/aW47_j)
- Supports Docker and Nixpacks builds
- Managed PostgreSQL available (though ZAO uses Supabase)
- Built-in logging and monitoring
- Cost: ~$5–10/mo for shared CPU, 512MB RAM

### Docker

ElizaOS includes a Dockerfile at the repo root. Can deploy to:
- Railway (recommended for simplicity)
- Fly.io
- Any VPS (DigitalOcean, Hetzner)
- Self-hosted

### Vercel Compatibility

**ElizaOS cannot run on Vercel.** It requires a persistent process for:
- XMTP message streaming
- Farcaster polling
- Memory consolidation

The ZAO OS Next.js app stays on Vercel. The agent runs separately on Railway. Both share the same Supabase database. This matches doc 24's architecture diagram.

### Eliza Cloud

ElizaOS now offers "Eliza Cloud" as a hosted option. Details sparse — likely a managed hosting service. Worth monitoring but Railway remains the self-hosted recommendation.

---

## 9. Music Plugins

### Available Music Plugins

| Plugin | Package | What It Does |
|--------|---------|-------------|
| **Udio** | `@elizaos/plugin-udio` | AI music generation from text prompts |
| **Suno** | `@elizaos/plugin-suno` | AI music generation with style/tempo/key control |

### Assessment for ZAO

These plugins are for **music generation** (text-to-music), not **music discovery/recommendation**. The ZAO agent needs:
- Music metadata extraction from shared links
- Taste profile building from listening behavior
- Recommendation engine based on community patterns

**None of these exist as ElizaOS plugins.** The music intelligence layer from doc 24 (Section 8) must be custom-built as a ZAO-specific plugin connecting to Audius, Sound.xyz, Spotify, and other APIs.

The Udio/Suno plugins could be interesting for Phase 4+ (agent-generated playlists, community jingles) but are not core requirements.

---

## 10. GitHub Health & Ecosystem

| Metric | Value | Assessment |
|--------|-------|------------|
| **Stars** | 17,800+ | Very high for a Web3 AI framework |
| **Contributors** | 583+ (from doc 24) | Large contributor base |
| **Release frequency** | Multiple per day (alpha) | Extremely active development |
| **Total releases** | 345+ | Mature release pipeline |
| **Plugin ecosystem** | 90+ plugins | Extensive — Discord, Telegram, Farcaster, XMTP, blockchain, etc. |
| **Production usage** | $25M+ AUM managed by ElizaOS bots | Real production traction |
| **Ecosystem market cap** | $20B+ (partners) | Significant Web3 ecosystem |
| **License** | MIT | Fully open source, fork-friendly |
| **Core packages** | `@elizaos/server`, `@elizaos/client`, `@elizaos/cli`, `@elizaos/core` | Well-structured monorepo |
| **Desktop app** | Tauri-based (`@elizaos/app`) | New since doc 24 |
| **Dashboard** | Professional web UI for managing agents | New since doc 24 |

### Community & Governance

ElizaOS has its own token (ELIZAOS) and DAO governance. The framework is the most widely adopted Web3 AI agent framework as of March 2026.

---

## 11. Alternatives Comparison 2026

### Updated Landscape

| Framework | Best For | Farcaster | XMTP | Web3 | Maturity |
|-----------|----------|-----------|------|------|----------|
| **ElizaOS** | Web3 AI agents | Native plugin | Native plugin | 45+ plugins, unified wallet (v2) | High — 17.8k stars, production-proven |
| **LangGraph** | Complex stateful workflows | Custom tools | Custom tools | Custom tools | High — enterprise-focused |
| **CrewAI** | Role-based multi-agent | No | No | No | Medium |
| **Microsoft AutoGen** | Multi-agent conversations | No | No | No | Medium — enterprise |
| **Microsoft Semantic Kernel** | Enterprise LLM integration | No | No | No | High — enterprise |
| **OpenClaw** | Local-first personal agents | Unknown | Unknown | Unknown | New in 2026 — watch |
| **Hermes** | Terminal-based persistent agents | Unknown | Unknown | Unknown | New in 2026 — niche |
| **Vercel AI SDK** | Next.js integrated agents | Custom tools | Custom tools | Custom tools | High — but not agent-first |
| **XMTP Agent SDK** | XMTP-native agents | No | Native | Via AgentKit | Medium — messaging-focused |

### Verdict

ElizaOS remains the clear winner for ZAO's requirements:
- Only framework with **both** native Farcaster and XMTP plugins
- Largest Web3 AI agent ecosystem
- MIT license
- Production-proven at scale ($25M+ AUM)
- Active development with strong community

The new competitors (OpenClaw, Hermes) are interesting but lack the Farcaster/XMTP plugin ecosystem. LangGraph/CrewAI are powerful but require building all social integrations from scratch.

---

## 12. Impact on Doc 24 Plan

### What's Still Valid in Doc 24

Almost everything. Doc 24 was well-researched. Specifically:
- Architecture diagram (ElizaOS on Railway + ZAO OS on Vercel + shared Supabase) -- **still correct**
- Phase 1-4 implementation plan -- **still valid**
- Character file structure -- **still valid for v1.7.2**
- Memory schema design -- **still valid**
- Cost estimates -- **still valid** ($15-70/mo)
- Deployment to Railway -- **still valid, one-click template exists**

### What Needs Updating

| Item | Doc 24 | Update |
|------|--------|--------|
| **Version to use** | Not specified | Use v1.7.2 (stable). V2 is alpha with multiple releases/day |
| **V2 awareness** | Not mentioned | V2 exists with event-driven architecture, HTN, unified wallet. Track for future migration |
| **Farcaster plugin version** | Generic | Use `@elizaos/plugin-farcaster` v1.0.5. Old `client-farcaster` repo is archived |
| **XMTP plugin version** | Generic | Use `@elizaos/plugin-xmtp` v1.1.0. MLS-based, group chat supported |
| **XMTP network** | Dev/test implied | XMTP mainnet launching ~March 2026. Target production network |
| **Neynar SDK issue** | Not mentioned | Issue #5943 — Neynar SDK may need updating. Verify compatibility |
| **Eliza Cloud** | Not mentioned | New hosted option exists. Monitor but stick with Railway |
| **Desktop app** | Not mentioned | Tauri desktop app now available (`@elizaos/app`) — not relevant for ZAO bot |
| **Dashboard** | Not mentioned | Professional web UI for managing agents — useful for monitoring |
| **Music plugins** | Custom build planned | Udio + Suno plugins exist (generation only). Music discovery still needs custom build |
| **Install method** | Not specified | Use `bun` (not npm): `bun i -g @elizaos/cli` |

### Migration Path to V2

When v2 reaches stable:
1. Update package imports (`@ai16z/eliza` patterns already gone)
2. Switch action returns to `ActionResult` with `success` field
3. Replace `generateText()` with `useModel()`
4. Update entity model from User/Participant to Entity/Room/World
5. Switch test framework from Vitest to Bun test
6. Benefit from unified wallet system (simplifies multi-chain)
7. Benefit from HTN task planning (better complex workflow handling)

---

## Key Recommendations

1. **Start with v1.7.2** — stable, documented, production-proven
2. **Pin plugin versions** — `@elizaos/plugin-farcaster@1.0.5`, `@elizaos/plugin-xmtp@1.1.0`
3. **Use Supabase adapter** — shares database with ZAO OS
4. **Deploy to Railway** — one-click template, ~$5-10/mo
5. **Use Claude as LLM** — set `modelProvider: "anthropic"` in character file
6. **Build custom music plugin** — no existing plugin covers music discovery/recommendation
7. **Monitor v2 alpha** — migrate when stable (likely Q2-Q3 2026 at current pace)
8. **Check Neynar SDK compatibility** — Issue #5943 may affect Farcaster integration

---

## Sources

- [ElizaOS GitHub](https://github.com/elizaOS/eliza) — 17,800+ stars, v1.7.2 stable, v2.0.0-alpha.76 latest
- [ElizaOS Releases](https://github.com/elizaOS/eliza/releases) — 345+ releases
- [ElizaOS Documentation](https://docs.elizaos.ai/) — quickstart, plugin registry, migration guide
- [ElizaOS v1-v2 Migration](https://docs.elizaos.ai/plugins/migration) — breaking changes documentation
- [ElizaOS Official Site](https://elizaos.ai/)
- [@elizaos/plugin-farcaster npm](https://www.npmjs.com/package/@elizaos/plugin-farcaster) — v1.0.5
- [Farcaster Plugin Developer Guide](https://docs.elizaos.ai/plugin-registry/platform/farcaster/developer-guide)
- [client-farcaster GitHub](https://github.com/elizaos-plugins/client-farcaster) — archived, migrated to plugin-farcaster
- [Neynar SDK Update Issue #5943](https://github.com/elizaOS/eliza/issues/5943)
- [client-xmtp GitHub](https://github.com/elizaos-plugins/client-xmtp) — v1.1.0, MLS group chat
- [adapter-supabase GitHub](https://github.com/elizaos-plugins/adapter-supabase)
- [adapter-postgres GitHub](https://github.com/elizaos-plugins/adapter-postgres) — pgvector support
- [Character File Docs](https://elizaos.github.io/eliza/docs/core/characterfile/)
- [Character JSON Guide](https://www.elizacloud.ai/docs/character-json)
- [ElizaOS Railway Deploy](https://railway.com/deploy/aW47_j) — one-click template
- [plugin-udio GitHub](https://github.com/elizaos-plugins/plugin-udio) — AI music generation
- [plugin-suno GitHub](https://github.com/elizaos-plugins/plugin-suno) — AI music generation
- [Delphi Digital v2 Analysis](https://www.panewslab.com/en/articles/w30ucwb8)
- [ElizaOS vs OpenClaw vs Hermes (2026)](https://medium.com/@alvintoms2136/elizaos-vs-openclaw-vs-hermes-what-actually-matters-in-2026-a5cf7446726f)
- [Top AI Agent Frameworks 2026 (Turing)](https://www.turing.com/resources/ai-agent-frameworks)
- [Top AI Agent Frameworks 2026 (Vellum)](https://vellum.ai/blog/top-ai-agent-frameworks-for-developers)
- [XMTP Review 2026](https://cryptoadventure.com/xmtp-review-2026-decentralized-messaging-mls-group-chats-and-the-mainnet-transition/) — mainnet launch timeline
- [XMTP Agent FAQ](https://docs.xmtp.org/agents/get-started/faq)
- [ElizaOS Next.js Starter](https://github.com/elizaOS/eliza-nextjs-starter) — v2 demo
- [ElizaOS IQ.wiki](https://iq.wiki/wiki/eliza-ai) — ecosystem overview
