# 291 — Farcaster Agentic Bootcamp Days 3-5: Agents, Memory, Identity

> **Status:** Research complete
> **Date:** April 6, 2026
> **Goal:** Extract actionable patterns from bootcamp days 3-5 for FISHBOWLZ agent participants — event-driven agents, stateful memory, and ERC-8004 identity.

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Event-driven pattern (Day 3)** | USE Neynar webhooks for room lifecycle events (room.created, room.ended, speaker.joined). Agent subscribes to events, decides whether to act, posts response. Already have `src/app/api/fishbowlz/events/route.ts` with `actorType: 'agent'` support. |
| **Stateful memory (Day 4)** | USE sliding window context — last 20 transcript segments + room metadata + participant list. Store agent memory per-room in Supabase JSONB (new `agent_context` column on `fishbowl_rooms`). Reset on room end. |
| **Agent identity (Day 5)** | REGISTER FISHBOWLZ admin agent on ERC-8004 mainnet registry (~$5 gas) + get a dedicated Farcaster FID (~$1 on Optimism). Agent gets verifiable on-chain identity for trust when joining rooms. |
| **Neynar Managed Signers** | USE Managed Signers for agent casting — handles key rotation, rate limits, permissions. Agent can post room summaries to `/fishbowlz` channel without API key hassles. |
| **BYOK personal agents** | USE user-provided API keys stored encrypted in Supabase. Agent runs server-side with user's key, never exposed to client. Open-source model support via OpenRouter ($0.001-0.01/call). |
| **Skip custom framework** | SKIP building a custom agent framework. USE Vercel AI SDK 6 ToolLoopAgent (doc 227 recommendation) — TypeScript-native, Next.js App Router compatible, streaming, provider-agnostic. |

## Bootcamp Days 3-5 Curriculum

| Day | Date | Topic | Key Pattern | ZAO Status |
|-----|------|-------|-------------|------------|
| 3 | Apr 1 | Agents 101 | Event-driven: subscribe to FC events via webhooks, apply logic, take action | AHEAD — 7 agents, dispatch protocol |
| 4 | Apr 2 | Memory, Context & Reasoning | Stateful agents with conversation history, user context, social graph awareness | AHEAD — 3-layer memory, 225+ doc knowledge base |
| 5 | Apr 3 | Agent Identity (ERC-8004) | On-chain NFT-based identity with name, endpoints, payment address, reputation | GAP — no ERC-8004 registration |

## Comparison: Agent Identity Standards for FISHBOWLZ

| Standard | Chain | Cost | Registered | Portable | Reputation | ZAO Fit |
|----------|-------|------|-----------|----------|------------|---------|
| **ERC-8004** | Ethereum/Base | ~$5 gas | 20,000+ agents | Yes — NFT-based | Built-in registry | **Best** — verifiable agent identity |
| **Farcaster FID** | Optimism | ~$1 | 800K+ | Yes — protocol-native | Via social graph | **Required** — agents need FID to cast |
| **Neynar Managed Signer** | N/A (API) | Free tier | N/A | No — API-bound | No | **Required** — signing without key mgmt |
| **ENS subname** | Ethereum L1 | $10-50 | N/A | Yes | No built-in | MEDIUM — nice-to-have (zoey.zaoos.eth) |

## Comparison: Agent Memory Patterns for Audio Rooms

| Pattern | Persistence | Context Window | Cost | Best For |
|---------|------------|----------------|------|----------|
| **Sliding window (20 segments)** | Per-room, in-memory + JSONB | ~2.5K tokens | ~$0.008/cycle | MVP — simple, cheap |
| **Full transcript history** | Supabase query | Unlimited but expensive | ~$0.05/cycle | Post-room analysis |
| **Vector embeddings** | pgvector in Supabase | Semantic search | ~$0.02/cycle + embedding cost | Advanced context retrieval |
| **Conversation graph** | Custom data structure | Tracks threads, topics, speakers | ~$0.03/cycle | Multi-topic rooms |

## How Day 3-5 Patterns Map to FISHBOWLZ Agent Tiers

### Tier 1: Admin Agent (Day 3 pattern — event-driven)
- Subscribes to room lifecycle events via existing `/api/fishbowlz/events` endpoint
- Enforces room rules (duration limits, speaker caps, content moderation)
- Auto-generates summaries when rooms end
- Posts room announcements to Farcaster `/fishbowlz` channel
- Runs server-side on Vercel, no user interaction needed

### Tier 2: ZOEY — Zaal's Personal Agent (Day 4 pattern — stateful memory)
- Maintains rich context of Zaal's preferences, past rooms, relationships
- Acts as Zaal's proxy when AFK — "Zaal's agent says he'd love to hear more about that topic"
- Takes notes in Zaal's style, flags important moments
- Can reference past fishbowls: "Last time you discussed this in the music curation room..."
- Authenticated via Zaal's FID, posts as ZOEY with bot badge

### Tier 3: BYOK Personal Agents (Day 5 pattern — identity + Day 4 memory)
- User provides API key (OpenAI, Anthropic, OpenRouter) or selects open-source model
- Agent gets a pseudo-identity derived from user's FID (no separate ERC-8004 needed for personal agents)
- Primary use case: "catch me up" — summarizes what happened while user was away
- Secondary: live note-taker, question-asker, topic tracker
- Key stored encrypted in Supabase, agent runs server-side

## ZAO OS Integration

### Existing Files
| File | Relevance |
|------|-----------|
| `src/app/api/fishbowlz/events/route.ts` | Already accepts `actorType: 'agent'` — Day 3 event-driven pattern ready |
| `src/lib/fishbowlz/logger.ts:41` | `actor_type: 'human' \| 'agent'` — agent events distinguished |
| `src/app/api/fishbowlz/transcribe/route.ts:11` | `speakerRole: 'agent'` + `source: 'agent_summary'` — agents can post transcripts |
| `src/app/api/fishbowlz/rooms/[id]/route.ts` | 15 event logs with `p_actor_type` — needs parameterization from hardcoded `'human'` |
| `community.config.ts` | App FID 19640 — admin agent would use a separate FID |

### New Files Needed
```
src/lib/fishbowlz/agentService.ts       — Core agent loop (poll, reason, respond)
src/lib/fishbowlz/agentPersonas.ts      — Persona definitions (admin, ZOEY, custom)
src/app/api/fishbowlz/agent/join/route.ts   — Agent join room endpoint
src/app/api/fishbowlz/agent/config/route.ts — BYOK key management endpoint
src/components/fishbowlz/AgentBadge.tsx  — Bot badge UI indicator
```

## Bootcamp Resources

| Resource | URL | Relevance |
|----------|-----|-----------|
| Event page | [rifio.dev](https://rifio.dev/events/05ff846c-1b33-47fe-8f30-4922dee8174f) | Schedule, 238 attendees |
| Luma page | [lu.ma](https://luma.com/f7ok6tbp) | Registration, community |
| ERC-8004 spec | [EIPs](https://eips.ethereum.org/EIPS/eip-8004) | Agent identity standard |
| awesome-erc8004 | [GitHub](https://github.com/sudeepb02/awesome-erc8004) | Curated resources |
| Neynar agent guide | [neynar.com/blog](https://neynar.com/blog/building-ai-agents-on-farcaster) | Read/Write APIs, Managed Signers, Webhooks |
| Builders Garden templates | [GitHub](https://github.com/builders-garden) | base-minikit-starter, miniapp-next-template |

## Sources

- [Farcaster Agentic Bootcamp — Rifio](https://rifio.dev/events/05ff846c-1b33-47fe-8f30-4922dee8174f)
- [ERC-8004: Trustless Agents](https://eips.ethereum.org/EIPS/eip-8004)
- [awesome-erc8004](https://github.com/sudeepb02/awesome-erc8004)
- [Neynar: Building AI Agents on Farcaster](https://neynar.com/blog/building-ai-agents-on-farcaster)
- [Builders Garden GitHub](https://github.com/builders-garden)
- [Doc 278 — Agentic Bootcamp Gap Analysis](../278-agentic-bootcamp-zao-agent-squad/)
- [Doc 227 — Agentic Workflows 2026](../227-agentic-workflows-2026/)
- [Doc 290 — FISHBOWLZ Agentic Participants](../290-fishbowlz-agentic-participants/)
