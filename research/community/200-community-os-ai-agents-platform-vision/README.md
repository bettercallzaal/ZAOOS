# 200 — The Definitive Community OS: AI Agents, Platform Architecture & Vision

> **Status:** Research complete
> **Date:** March 28, 2026
> **Goal:** Define what makes ZAO OS the best community operating system — AI agent strategy, competitive landscape, platform architecture, and the path to a forkable community OS that any group can deploy

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **AI Agent Framework** | USE Claude Agent SDK (TypeScript) as primary — drops directly into Next.js stack, native MCP support, session persistence. Cost: ~$20/month with 90% prompt caching on Sonnet. ElizaOS as secondary for always-on Farcaster/Discord presence ($20/month on Railway) |
| **Agent Architecture** | BUILD three specialized agents: (1) Community Manager (onboarding, daily digest, moderation), (2) Music Curator (taste profiling, playlist generation, discovery), (3) Governance Assistant (proposal drafting, vote reminders, fractal ceremony coordination) |
| **Agent Memory** | USE Supabase pgvector for persistent agent memory — already in the stack, shares DB with app. Store conversation embeddings, taste profiles, and community knowledge graph |
| **Fork-Friendly Architecture** | KEEP `community.config.ts` as the single fork point — this pattern is unique (no other open-source project does this). Add an `agents.config.ts` for agent personality/tools configuration |
| **On-Chain Roles** | USE Hats Protocol (already integrated, tree #226 on Optimism) to formalize Community Member / Contributor / Steward tiers. Map Respect thresholds to hat assignments |
| **Competitive Position** | ZAO OS is the ONLY open-source project combining: Farcaster social + music player + DAO governance + Respect system + community config. No competitor exists in this intersection |
| **Community OS Layers** | ZAO OS covers 6/7 layers of the Community OS framework. The missing layer is AI Automation — filling this makes ZAO OS feature-complete |
| **Agent Deployment** | USE Vercel serverless for Claude Agent SDK (event-driven, scales to zero). USE Railway ($5/month) for ElizaOS (always-on, persistent connections to Farcaster/Discord) |

## Comparison of Community OS Platforms

| Platform | Open Source | Farcaster Native | Music | Governance | AI Agents | Fork-Friendly | Token Gating | Price |
|----------|:----------:|:----------------:|:-----:|:----------:|:---------:|:-------------:|:------------:|-------|
| **ZAO OS** | MIT | YES | 44 components, 9 platforms | 3 systems (Fractals, Snapshot, Hats) | Planned (Q4 2026) | YES (`community.config.ts`) | YES (allowlist + NFT) | Free (self-host) |
| **Guild.xyz** | No license | NO | NO | Role-based | NO | NO | YES (100+ integrations) | Free tier |
| **Coordinape** | AGPL | NO | NO | GIVE circles | NO | NO | YES (wallet) | Free |
| **CharmVerse** | Closed | NO | NO | Proposal mgmt | NO | NO | YES (wallet + NFT) | Free tier |
| **Farcastle** | MIT | YES | NO | Moloch v3 | NO | NO | YES (DAO shares) | Free (gas only) |
| **Circle** | Closed | NO | NO | Basic polls | YES (AI member matching) | NO | NO | $89-419/month |
| **Mighty Networks** | Closed | NO | NO | Basic polls | YES (AI matching) | NO | NO | $79+/month |
| **ONEARMY** | MIT | NO | NO | NO | NO | YES (multi-community) | NO | Free (self-host) |
| **Discourse** | GPL | NO | NO | Plugin-based | Plugin-based | YES | Plugin-based | Free (self-host) |
| **Forem** | AGPL | NO | NO | NO | NO | YES | NO | Free (self-host) |

**ZAO OS wins on:** breadth (only platform with music + governance + social + messaging in one), Farcaster-native (the only one), fork-friendly open-source (MIT with single config file), and on-chain reputation (Respect system has no equivalent in any competitor).

## Comparison of AI Agent Frameworks

| Framework | Stars | License | TypeScript | MCP Support | Persistence | Farcaster Plugin | Cost (100-member community) |
|-----------|-------|---------|:----------:|:-----------:|:-----------:|:----------------:|----------------------------|
| **Claude Agent SDK** | New | Proprietary (SDK) | YES | Native | Session resume | Via MCP | ~$20/mo (Sonnet + 90% cache) |
| **ElizaOS** | 17,951 | MIT | YES | Via plugins | SQLite/Postgres | YES (v1.0.5) | ~$20/mo (Railway + Haiku) |
| **CrewAI** | 44,600 | MIT | Python only | Native | Task passing | NO | ~$30/mo (API costs) |
| **LangGraph** | ~27K | MIT | YES | Via LangChain | Checkpointing | NO | ~$40/mo (API + platform) |
| **AutoGen/AG2** | ~35K | MIT | NO (Python) | Via plugins | In-memory | NO | ~$60/mo (high token count) |
| **OpenAI Agents SDK** | New | MIT | YES | Via tools | Ephemeral | NO | ~$19/mo (GPT-5 mini) |

**Best combo for ZAO:** Claude Agent SDK for intelligent tasks (research, proposals, curation scoring) + ElizaOS for always-on community presence (Farcaster replies, Discord monitoring, XMTP DMs).

## ZAO OS Integration: What's Built vs What's Missing

### Platform Inventory (Current State — March 28, 2026)

| Domain | Files | Status | Key Path |
|--------|-------|--------|----------|
| **Auth & Identity** | 12 API routes | Production | `src/lib/auth/session.ts`, `src/app/api/auth/` |
| **Social (Farcaster)** | 11 components, 6 routes | Production | `src/components/social/`, `src/app/api/social/` |
| **Messaging (XMTP)** | 7 components, 5 routes | Production | `src/lib/xmtp/`, `src/components/messages/` |
| **Music** | 44 components, 24 routes | Production | `src/components/music/`, `src/providers/audio/` |
| **Spaces/Rooms** | 15 components, 4 routes | Production | `src/components/spaces/`, `src/app/spaces/` |
| **Governance** | 6 components, 4 routes | Production | `src/components/governance/`, `src/app/api/fractals/` |
| **Respect/Reputation** | 1 module, 6 routes | Production | `src/lib/respect/`, `src/app/api/respect/` |
| **Directory/Profiles** | 2 routes + pages | Production | `src/app/api/directory/`, `src/app/(auth)/directory/` |
| **Notifications** | 3 routes + bell UI | Production | `src/app/api/notifications/` |
| **Cross-Platform Publishing** | 8 lib modules, 7 routes | Production | `src/lib/publish/`, `src/app/api/publish/` |
| **Admin** | 4 pages, 12 routes | Production | `src/app/(auth)/admin/` |
| **AI Assistant** | 2 routes + page | Functional | `src/app/api/chat/minimax/`, `src/app/(auth)/assistant/` |
| **Community Config** | 1 file | Complete | `community.config.ts` |

**Total:** 184 API routes, 164 UI components, 68 library modules, 30 pages.

### The 7 Layers of a Community OS

| Layer | Description | ZAO OS Status | Gap |
|-------|-------------|:-------------:|-----|
| 1. **Identity & Access** | Who you are, what you can do | COMPLETE | None — SIWE + Farcaster + Hats + allowlist |
| 2. **Communication** | Public feeds + private messaging | COMPLETE | None — Farcaster casts + XMTP E2E DMs |
| 3. **Governance** | Decision-making mechanisms | COMPLETE | None — Fractals + Snapshot + Hats + ZOUNZ Governor |
| 4. **Compensation** | How contributors get rewarded | COMPLETE | None — Respect tokens (OG + ZOR on Optimism) |
| 5. **Knowledge** | Docs, research, institutional memory | COMPLETE | None — 200+ research docs, library system |
| 6. **Automation (AI Agents)** | Onboarding, moderation, curation | MISSING | **This is the gap** — Minimax assistant exists but no autonomous agents |
| 7. **Culture** | Shared experiences binding community | COMPLETE | None — music rooms, fractal ceremonies, listening parties |

**ZAO OS is 6/7 complete. Layer 6 (AI Agents) is the final piece.**

## Part 1: The AI Agent Architecture

### Three Specialized Agents

**Agent 1: Community Manager** (always-on, ElizaOS on Railway)
- **Onboarding:** Welcome new members in Farcaster /zao channel + XMTP DM within 15 minutes of joining
- **Daily Digest:** Post 8am ET summary to /zao channel — top tracks, governance activity, upcoming events, member milestones
- **Moderation:** Flag content via Perspective API scoring (already in `src/lib/moderation/moderate.ts`), auto-hide if score > 0.8, notify admin if 0.6-0.8
- **Fractal Coordination:** Post ceremony reminders (Mondays 6pm EST), manage breakout rooms, record results
- **Tools:** Neynar API (cast/reply), XMTP SDK (DMs), Supabase (member data, governance state)

**Agent 2: Music Curator** (event-driven, Claude Agent SDK on Vercel)
- **Taste Profiling:** Build per-member taste vectors using pgvector embeddings from listening history (data already in `songs` table with `play_count`, `last_played_at`)
- **Discovery:** Search Audius trending + community library, recommend tracks matching user's taste profile
- **Playlist Generation:** Create weekly "ZAO Picks" playlist from highest-Respect-weighted tracks
- **Track of the Day:** Auto-select based on community engagement signals + diversity (genre, artist rotation)
- **Tools:** Audius API (`src/lib/music/audius.ts`), Supabase pgvector, `/api/music/search`

**Agent 3: Governance Assistant** (event-driven, Claude Agent SDK on Vercel)
- **Proposal Drafting:** Help members write proposals with correct format, reference relevant research docs
- **Vote Reminders:** Post daily updates on active proposals, time remaining, current vote counts
- **Respect Analytics:** Track Respect distribution, flag concentration (one member > 20% of supply), suggest rebalancing
- **Research Integration:** Answer governance questions by searching the 200+ research library
- **Tools:** Snapshot API (`src/lib/snapshot/client.ts`), Supabase, ORNODE API, research docs

### Agent Memory Architecture

```
┌─────────────────────────────────────────┐
│           Supabase (shared DB)           │
├─────────────────────────────────────────┤
│ agent_conversations   │ Chat history     │ ← pgvector embeddings for semantic search
│ agent_memory          │ Long-term facts  │ ← Key-value with TTL and confidence score
│ taste_profiles        │ Music vectors    │ ← pgvector embeddings per member
│ agent_actions         │ Action log       │ ← What agents did, when, outcome
│ community_knowledge   │ Research index   │ ← Embeddings of 200+ research docs
└─────────────────────────────────────────┘
```

All agents share the same Supabase instance as ZAO OS itself — no separate database needed. pgvector is already supported by Supabase (just needs the extension enabled).

### Cost Estimate

| Component | Monthly Cost |
|-----------|-------------|
| Claude Sonnet API (Music Curator + Governance, ~500 calls/day, 90% cached) | $20 |
| ElizaOS on Railway (Community Manager, always-on) | $20 |
| Claude Haiku for ElizaOS LLM calls (~1000/day) | $15 |
| Neynar API (already paid for ZAO OS) | $0 |
| Supabase pgvector (already on ZAO's plan) | $0 |
| **Total** | **~$55/month** |

Fits within the $50 target from Doc 090 with $5 buffer. Haiku 4.5 at $1/$5 per M tokens makes the always-on agent affordable.

## Part 2: Fork-Friendly Community OS Design

### The `community.config.ts` Pattern (Unique to ZAO)

No other open-source project uses a single config file to define an entire community. This is ZAO OS's strongest architectural advantage for forkability.

**Current config scope:**
```typescript
// community.config.ts already contains:
name, colors, farcaster channels, adminFids, respect contracts,
hats tree, snapshot space, music radio, cross-posting targets,
partners, wavewarz, zounz, navigation pillars
```

**Proposed additions for full Community OS:**
```typescript
// agents.config.ts (NEW)
export const agentConfig = {
  communityManager: {
    enabled: true,
    personality: 'friendly, music-savvy, uses emoji sparingly',
    digestTime: '08:00', // ET
    onboardingDelay: 15, // minutes after join
    moderationThreshold: 0.8,
  },
  musicCurator: {
    enabled: true,
    playlistName: 'ZAO Picks',
    trackOfDayTime: '12:00',
    genreWeights: { 'hip-hop': 0.3, 'electronic': 0.25, 'lo-fi': 0.2, 'r&b': 0.15, 'other': 0.1 },
  },
  governanceAssistant: {
    enabled: true,
    voteReminderFrequency: 'daily',
    respectAlertThreshold: 0.2, // flag if one member > 20% of supply
  },
}
```

**Fork workflow for a new community:**
1. `git clone https://github.com/bettercallzaal/ZAOOS my-community`
2. Edit `community.config.ts` (name, colors, channels, contracts)
3. Edit `agents.config.ts` (personality, schedule, thresholds)
4. `npm install && npm run dev`
5. Deploy to Vercel

### What Other Communities Could Fork ZAO OS For

| Community Type | Config Changes | Features They'd Use |
|----------------|---------------|---------------------|
| **Music collective** (like ZAO) | Channel name, radio playlists, genre weights | Music player, curation, listening rooms, Respect |
| **Art DAO** | Swap music for gallery, add NFT minting | Governance, Respect, directory, publishing |
| **Developer community** | Add GitHub integration, swap music for code review | Governance, Respect, knowledge library, AI assistant |
| **Local community** | Add events/calendar, location-based features | Directory, messaging, governance, publishing |
| **Creator economy** | Add payments, subscription model | Publishing, directory, Respect, AI curation |

## Part 3: Competitive Landscape Deep Dive

### Why ZAO OS Wins

**1. No competitor combines all 7 layers.**
- Guild.xyz does gating (Layer 1) but nothing else
- Coordinape does compensation (Layer 4) but nothing else
- Farcastle does governance (Layer 3) but nothing else
- Circle/Mighty Networks do communication (Layer 2) but are closed-source, Web2, $89-419/month

**2. Farcaster-native is a moat.**
- Farcaster has ~50K DAU, growing developer ecosystem
- Neynar acquired Farcaster (Jan 2026), consolidating API + protocol under one company
- No other open-source community platform is Farcaster-first
- ZAO OS already depends on Neynar APIs — the acquisition is net positive

**3. Music is the cultural differentiator.**
- 44 music components, 9 platform integrations, respect-weighted curation
- No DAO tool, no governance platform, no community OS has music as a first-class feature
- Music creates the "culture layer" (Layer 7) that binds community — this is what Discord servers try to do with Spotify bots but fail at

**4. `community.config.ts` is a unique innovation.**
- Searched GitHub: no other TypeScript project uses a single community config file for branding, channels, contracts, and features
- ONEARMY/community-platform (1,359 stars, MIT) is the closest analog but uses environment variables, not a structured config
- This single-file fork point makes ZAO OS the easiest community platform to customize

### Key Risks

| Risk | Mitigation |
|------|-----------|
| Neynar/Farcaster direction change | ZAO OS already abstracts Neynar behind `src/lib/farcaster/neynar.ts` — could swap to direct hub access |
| ElizaOS instability (v2.0 alpha) | Pin to v1.7.2 stable. Monitor v2 but don't migrate until stable release |
| Small community (100 members) | Features scale down gracefully. AI agent costs are proportional to activity. Focus on depth over breadth |
| Spotify API restrictions (Feb 2026) | Already mitigated — Audius is primary, Spotify is secondary. See Doc 167 |

## Part 4: The Path to "Best Community OS"

### Phase 1: AI Agents (Next 4 weeks)

1. **Enable pgvector** on Supabase — `CREATE EXTENSION vector;`
2. **Build Community Manager agent** with ElizaOS on Railway
   - Farcaster plugin for /zao channel monitoring
   - XMTP plugin for welcome DMs
   - Daily digest generation
3. **Build Music Curator agent** with Claude Agent SDK
   - Taste profiling from `songs.play_count` + `user_song_likes`
   - Weekly playlist generation
   - Track of the Day auto-selection
4. **Create `agents.config.ts`** — personality, schedule, thresholds

### Phase 2: Agent Intelligence (Weeks 5-8)

5. **Knowledge graph from research library** — embed 200+ docs into pgvector for agent RAG
6. **Governance Assistant** — proposal help, vote reminders, Respect analytics
7. **Self-improving agents** via autoresearch — 3 experiments/day on digest format, welcome tone, recommendation accuracy
8. **Agent-to-agent coordination** — Community Manager routes music questions to Music Curator, governance questions to Governance Assistant

### Phase 3: Fork Infrastructure (Weeks 9-12)

9. **Fork documentation** — step-by-step guide for forking ZAO OS
10. **Fork CLI** — `npx create-community-os` scaffolding tool
11. **Theme system** — expand `community.config.ts` with full theme (fonts, spacing, component variants)
12. **Plugin architecture** — allow communities to add/remove feature modules (music, governance, messaging) via config

### Phase 4: Ecosystem (Ongoing)

13. **Community marketplace** — share configs, themes, agent personalities between forks
14. **Cross-community features** — federated governance, shared music libraries, inter-community Respect
15. **Mobile app** — Capacitor/Expo wrapper for iOS/Android (solves PWA background audio limitation)

## Reference Implementations

| Project | Stars | License | What We Can Learn |
|---------|-------|---------|-------------------|
| **elizaOS/eliza** | 17,951 | MIT | Agent runtime, Farcaster/XMTP plugins, memory system |
| **ONEARMY/community-platform** | 1,359 | MIT | Fork-friendly multi-community architecture |
| **guildxyz/guild.xyz** | 3,499 | No license | Token gating engine, role/requirement primitives |
| **snapshot-labs/snapshot** | 9,150 | MIT | Gasless governance UX patterns |
| **BuilderOSS/nouns-builder** | 105 | MIT | NFT-based DAO contracts (ZOUNZ upstream) |
| **Hats-Protocol/hats-protocol** | 98 | AGPL | On-chain role hierarchies, Zodiac integration |
| **coordinape/coordinape** | 87 | AGPL | Peer-to-peer GIVE allocation UX (study patterns only) |
| **resonatecoop/stream** | 170 | GPL-3.0 | Cooperative music streaming, stream-to-own economics |

## Sources

- [Claude Agent SDK Overview](https://platform.claude.com/docs/en/agent-sdk/overview) — TypeScript SDK, native MCP, session persistence
- [ElizaOS GitHub](https://github.com/elizaOS/eliza) — 17,951 stars, MIT, 90+ plugins
- [Guild.xyz](https://guild.xyz/) — Token-gated community platform, 100+ integrations
- [Hats Protocol](https://www.hatsprotocol.xyz/) — On-chain roles, protoREP reputation
- [Coordinape](https://coordinape.com/) — Peer-to-peer GIVE allocation for DAOs
- [Farcastle](https://farcastle.net/) — Farcaster channel → DAO via Moloch v3
- [Neynar Acquires Farcaster (The Block)](https://www.theblock.co/post/386549/haun-backed-neynar-acquires-farcaster-after-founders-pivot-to-wallet-app)
- [A2A Protocol](https://a2a-protocol.org/) — Google-initiated agent interoperability, Linux Foundation
- [MCP Ecosystem 2026](https://use-apify.com/blog/mcp-standard-ecosystem-2026) — 10,000+ servers, $1.8B market
- [AI Agent Framework Comparison (Turing)](https://www.turing.com/resources/ai-agent-frameworks) — LangGraph, CrewAI, AutoGen, ElizaOS
- [Claude API Pricing](https://platform.claude.com/docs/en/about-claude/pricing) — Haiku $1/$5, Sonnet $3/$15, 90% cache savings
- [ONEARMY/community-platform](https://github.com/ONEARMY/community-platform) — 1,359 stars, MIT, fork-friendly
- [ZAO OS Doc 050 — Complete Guide](../../community/050-the-zao-complete-guide/) — Canonical project reference
- [ZAO OS Doc 090 — AI-Run Community Agent OS](../../agents/090-ai-run-community-agent-os/) — Self-improving agent design
