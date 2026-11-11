---
topic: agents
type: research
status: research-complete
last-validated: 2026-11-11
original-query: Extract actionable patterns from bootcamp days 3-5 for FISHBOWLZ agent participants - event-driven agents, stateful memory, and ERC-8004 identity (reconstructed)
tier: high
notes: Core patterns (event-driven, stateful memory, ERC-8004 identity) remain valuable even though FISHBOWLZ project paused. Apply to ZOE/agent stack.
---

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

## Updated 2026-11-11

Radar revalidation. Sources: WebSearch + full page fetch of github.com/sudeepb02/awesome-erc8004 (FULL). External hosts neynar.com, miniapps.farcaster.xyz, eips.ethereum.org, ai-sdk.dev, paragraph.com blocked in this session (FAILED); search snippets used for those items and marked accordingly.

**ERC-8004 ecosystem status (FULL — github.com/sudeepb02/awesome-erc8004 fetched 2026-11-11):**
- Identity and Reputation registries are deployed and audited. The Validation Registry is still under active revision. The 3-registry system is therefore incomplete; the doc's "REGISTER admin agent" recommendation applies to the Identity registry only.
- Deployed on roughly 20 EVM mainnets as of the resource list, including Ethereum, Base, Arbitrum, Optimism, Polygon, BNB Chain, and Celo. Base deployment confirmed — directly relevant since ZAO is Base-native. The original doc cost estimate (~$5 gas) remains in range for Base.
- ERC-8004 remains Draft status in the official EIP process as of October 2026 (search snippet, PARTIAL — eips.ethereum.org blocked). Contract deployments are live; the spec itself is not yet Final.
- The awesome-erc8004 resource list shows no new entries after April 2026, suggesting the community curation slowed after the March 17, 2026 mainnet launch.

**Neynar signer changes (PARTIAL — search snippet, neynar.com blocked):**
- One search snippet from Neynar's SIWN docs said "new integrations should use Neynar-managed signers instead" with a stop date for new SIWN connections of August 14, 2026. A second search targeting this found no corroborating deadline and found Neynar docs still listing SIWN as a current option. The status is UNVERIFIED — check docs.neynar.com before choosing between SIWN and managed signers for any new ZAO agent integration.

**Vercel AI SDK agent pattern (PARTIAL — search snippets):**
- The doc recommends "AI SDK 6 ToolLoopAgent." Search results from April and May 2026 conflict: one calls AI SDK 6 beta, another says v5 is the stable line and v6 is in development. The current stable release is UNVERIFIED — check ai-sdk.dev before building a new agent loop against v6.

**Farcaster Mini App SDK (PARTIAL — search snippet, miniapps.farcaster.xyz blocked):**
- Two changelog entries from post-May 2026: July 30, 2026 — query parameters are now forwarded when a mini app declares its own button.action.url; October 27, 2026 — full-screen actions added (requestFullScreen, exitFullScreen, supportsFullScreen manifest property). These affect mini-app-based agent UIs but are low-impact for server-side agents.
- Base App (April 9, 2026) separated from Farcaster mini-app spec; Base now treats all apps as standard web apps. If ZAO builds FISHBOWLZ agent surfaces targeting Base App, the Farcaster manifest is no longer needed there.

**ZAO impact summary:**
- ERC-8004 agent identity registration on Base is now live and confirmed multi-chain. The ZAO gap (no ERC-8004 registration) from the original doc remains open — no evidence it was closed.
- Verify Neynar signer choice before building new agent casting flows.
- Verify AI SDK version before building against ToolLoopAgent.

## Sources

- [Farcaster Agentic Bootcamp — Rifio](https://rifio.dev/events/05ff846c-1b33-47fe-8f30-4922dee8174f)
- [ERC-8004: Trustless Agents](https://eips.ethereum.org/EIPS/eip-8004)
- [awesome-erc8004](https://github.com/sudeepb02/awesome-erc8004)
- [Neynar: Building AI Agents on Farcaster](https://neynar.com/blog/building-ai-agents-on-farcaster)
- [Builders Garden GitHub](https://github.com/builders-garden)
- [Doc 278 — Agentic Bootcamp Gap Analysis](../278-agentic-bootcamp-zao-agent-squad/)
- [Doc 227 — Agentic Workflows 2026](../227-agentic-workflows-2026/)
- [Doc 290 — FISHBOWLZ Agentic Participants](../290-fishbowlz-agentic-participants/)
- [awesome-erc8004 (fetched 2026-11-11, FULL)](https://github.com/sudeepb02/awesome-erc8004)
- [Farcaster Mini App SDK changelog (search snippet, PARTIAL)](https://miniapps.farcaster.xyz/docs/sdk/changelog)
- [Base and Farcaster Split the Mini App Stack (search snippet, PARTIAL)](https://paragraph.com/@arcabot/base-and-farcaster-split-the-mini-app-stack)
