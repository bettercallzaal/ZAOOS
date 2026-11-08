---
topic: agents
type: research
status: research-complete
last-validated: 2026-11-08
original-query: Design how AI agents join FISHBOWLZ rooms as live participants - consuming transcript streams in real-time, contributing to conversations, and providing richer context than post-hoc transcript analysis (reconstructed)
tier: archive-candidate
notes: FISHBOWLZ paused 2026-04-16, killed 2026-05-04. This research on FISHBOWLZ agent features is now superseded by partnership with Juke. Archive recommended.
---

# 290 — FISHBOWLZ Agentic Participants: AI Agents as Live Room Members

> **Status:** Research complete (ARCHIVED — FISHBOWLZ discontinued)
> **Date:** April 6, 2026
> **Goal:** Design how AI agents join FISHBOWLZ rooms as live participants — consuming transcript streams in real-time, contributing to conversations, and providing richer context than post-hoc transcript analysis.

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **MVP approach** | USE text-only agent presence — agent consumes transcript stream via polling, posts responses to room chat. Skip TTS/audio for v1. Zero new infrastructure needed. |
| **Agent runtime** | USE Vercel AI SDK 6 ToolLoopAgent (already recommended in doc 227) for the LLM brain. Agent polls `/api/fishbowlz/transcripts` every 10s, reasons about conversation, posts to `/api/fishbowlz/chat` |
| **Voice agents (v2)** | USE Pipecat (MIT, Daily.co) or LiveKit Agents for full audio participation. Both handle VAD, STT, LLM, TTS pipeline. Evaluate when DJ mode ships. |
| **Multi-agent coordination** | ADOPT the Podium Voices Turn Coordinator pattern — prevents agents from talking over each other. Critical when running summarizer + fact-checker + moderator simultaneously |
| **Agent identity** | USE Farcaster FIDs for agents (ERC-8004). Each agent gets its own FID, can cast room summaries. Aligns with Farcaster Agentic Bootcamp (running now, ends April 10 2026) |
| **Existing scaffolding** | LEVERAGE what's already built — `actor_type: 'agent'` in event logger, `speakerRole: 'agent'` in transcript schema, `source: 'agent_summary'` as transcript source. 80% of the data model exists. |
| **Skip bot-based recording** | SKIP Otter/Fireflies pattern (intrusive bot joins audio). FISHBOWLZ transcripts are already text — agent reads text, not audio. Much simpler. |

## Comparison of Approaches

| Approach | Complexity | Latency | Cost/Room | Audio Required | ZAO Fit |
|----------|-----------|---------|-----------|---------------|---------|
| **Text-only (MVP)** | Low — poll transcripts + post chat | 10-15s | ~$0.02/response (Sonnet) | No | **Best for v1** |
| **Pipecat voice agent** | Medium — Python service + Daily room | 1-3s | ~$0.10/min (STT+LLM+TTS) | Yes | v2 when DJ mode ships |
| **LiveKit Agents** | Medium — separate agent server | 1-3s | ~$0.08/min | Yes | v2 alternative to Pipecat |
| **VideoSDK native agents** | Low — SDK-native, v1.0.0 March 2026 | 1-3s | Pricing TBD | Yes | Watch — newest option |
| **Podium Voices multi-agent** | High — turn coordinator + multiple agents | 2-5s | ~$0.20/min (multiple LLMs) | Yes | v3 for agent panels |

## ZAO OS Integration

### What Already Exists

| File | Agent Support |
|------|--------------|
| `src/lib/fishbowlz/logger.ts:41` | `actor_type: 'human' \| 'agent'` — agent events already distinguished |
| `src/app/api/fishbowlz/transcribe/route.ts:11` | `speakerRole: 'agent'` — agents can post transcript segments |
| `src/app/api/fishbowlz/transcribe/route.ts:15` | `source: 'agent_summary'` — agent summaries as transcript entries |
| `src/app/api/fishbowlz/events/route.ts:12` | `actorType: 'agent'` — agent actions logged distinctly |
| `src/app/api/fishbowlz/rooms/[id]/route.ts` | All 15 event logs hardcoded to `p_actor_type: 'human'` — needs parameterization |

### What Needs to Be Built (MVP — Text-Only Agent)

1. **Agent join API** — New action `join_agent` in `src/app/api/fishbowlz/rooms/[id]/route.ts`. Adds agent to room with `actor_type: 'agent'`, distinct from human speakers/listeners. Agent appears in a new `current_agents` JSONB array.
2. **Agent service** — `src/lib/fishbowlz/agentParticipant.ts`. Polls room transcripts every 10s, maintains conversation context window (last 20 segments), calls LLM with room context + agent persona, posts response to chat or transcript.
3. **Agent personas** — Configurable via room creation: `agentMode: 'summarizer' | 'fact-checker' | 'note-taker' | 'moderator' | 'custom'`. Each mode has a system prompt and response cadence.
4. **Agent API key auth** — Agents authenticate via `X-Agent-Key` header (not Privy/session). Server validates against `FISHBOWLZ_AGENT_KEY` env var.
5. **UI indicator** — Show agent avatar with a bot badge in the room sidebar. Distinct from human listeners.

### Agent Interaction Loop (MVP)

```
Every 10 seconds:
  1. Poll GET /api/fishbowlz/transcripts?roomId={id}&limit=20
  2. Compare against last-seen transcript ID (skip if no new segments)
  3. Build context: room title + description + agent persona + last 20 transcript segments
  4. Call LLM (Sonnet 4.6, ~$0.003/1K input tokens)
  5. If LLM produces a response (not every cycle):
     POST /api/fishbowlz/chat with { roomId, message, senderFid: agentFid, senderUsername: 'ZOE' }
  6. For major topic shifts or every 5 minutes:
     POST /api/fishbowlz/transcribe with { speakerRole: 'agent', source: 'agent_summary', text: summary }
```

### Cost Estimate

- 20 transcript segments ~ 2K tokens input
- Agent persona + room context ~ 500 tokens
- Response ~ 200 tokens output
- Per cycle: ~$0.008 (Sonnet 4.6 at $3/$15 per MTok)
- Per hour (360 cycles, ~30% produce responses): ~$0.86/hour
- Per room session (avg 30 min): ~$0.43

## The Key Insight: Live Context > Post-Hoc Analysis

An agent "in the room" has advantages over reading a transcript after:

1. **Temporal context** — knows what was said 30 seconds ago vs 10 minutes ago. Can reference "what you just said" naturally.
2. **Participant awareness** — tracks who's speaking, who just joined, who left. Can welcome new participants, note speaker changes.
3. **Topic drift detection** — catches when conversation wanders from the room's stated topic. Can gently redirect.
4. **Real-time fact-checking** — can flag claims while they're being discussed, not after everyone's moved on.
5. **Emergent summarization** — builds running summary that evolves, vs one-shot summary of a finished transcript.
6. **Interactive Q&A** — participants can ask the agent questions in chat, get answers informed by the full conversation context.

## Reference Implementations

| Project | Stars | License | Key Pattern |
|---------|-------|---------|-------------|
| [livekit/agents](https://github.com/livekit/agents) | 4K+ | Apache-2.0 | Full WebRTC agent pipeline (VAD+STT+LLM+TTS) |
| [pipecat-ai/pipecat](https://github.com/pipecat-ai/pipecat) | 5K+ | BSD-2 | Pipeline processor model for chaining AI steps |
| [myFiHub/podium-voices](https://github.com/myFiHub/podium-voices) | ~100 | MIT | Multi-agent turn coordinator for audio rooms |
| [videosdk-live/agents](https://github.com/videosdk-live/agents) | New | MIT | Native "Agent Participant" SDK support (v1.0.0, March 2026) |
| [meetingbaas/speaking-bots](https://www.meetingbaas.com/en/projects/speaking-bots) | ~200 | MIT | Pipecat extension — agents with markdown-defined personalities |
| [Zackriya-Solutions/meetily](https://github.com/Zackriya-Solutions/meetily) | ~200 | MIT | Local meeting assistant, captures system audio |

## Farcaster Agentic Bootcamp Context

The [Farcaster Agentic Bootcamp](https://rifio.dev/events/05ff846c-1b33-47fe-8f30-4922dee8174f) (March 30 - April 10, 2026) establishes agents as first-class Farcaster citizens:
- ERC-8004 identity standard for agent FIDs
- Agents can have wallets and transact
- Agents interact with the social graph (cast, react, follow)
- FISHBOWLZ agent could cast room summaries to `/fishbowlz` channel
- See also: doc 278 (Agentic Bootcamp ZAO Agent Squad), doc 281 (Farcaster Agents Landscape)

## Updated 2026-11-08: Framework Maturity

FISHBOWLZ remains dead. The underlying frameworks referenced here have shipped significant updates since 2026-05-21, relevant if ZAO revisits real-time agent audio (e.g. a Juke integration or future audio room product).

**LiveKit Agents** (source: github.com/livekit/agents/releases, fetched 2026-11-08):
- Now at v1.8.11 (released Nov 5, 2026). The 1.5-to-1.8 line shipped adaptive interruption handling, MCP tool support, and native SIP telephony without a Twilio bridge.
- Added Claude Opus 5, Opus 5.5, and Sonnet 5.5 as LLM backends (v1.8.7, Oct 14, 2026).
- LiveKit Inference: a managed agent platform now sits on top of the open framework, adding Responses API, structured output, and web search.
- Security: PII filtering for tool errors, participant restrictions for RoomIO (v1.8.9).
- Assessment: the doc's v2 recommendation for LiveKit Agents for voice agents remains sound; the managed platform lowers the ops burden.

**Pipecat** (source: github.com/pipecat-ai/pipecat/releases, fetched 2026-11-08):
- Shipped stable v1.0.0 in April 2026; now at v1.15.0 (Oct 29, 2026). The doc cited ~5K stars; a third-party July 2026 comparison reported ~13,400 GitHub stars (source: search snippet, not a full page fetch -- UNVERIFIED exact count).
- Key additions: MCP tool integration via MCPClient.tools() (v1.8.0, Aug 26), Pipecat Classifiers for yes/no and scoring decisions (v1.12.0, Sep 26), LLMWithBackend for a fast frontend LLM plus a deeper backend LLM (v1.13.0, Oct 19), expressive conversation with TTS emotion tags (v1.15.0, Oct 29).
- Pipecat Flows merged into the main package; the separate pipecat-ai-flows package is no longer needed.
- Assessment: Pipecat's MCP integration is directly relevant to ZAO's tooling (ZOE already uses MCP). If a live-audio agent is revisited, Pipecat is now the more integrated choice.

**No change to recommendations.** The doc's archive-candidate status is unchanged. FISHBOWLZ is dead. The framework landscape has matured, which strengthens the doc's v2 and v3 patterns for any future audio product.

## Sources

- [LiveKit Agents Framework](https://github.com/livekit/agents) — Apache-2.0
- [Pipecat AI Framework](https://github.com/pipecat-ai/pipecat) — BSD-2
- [Podium Voices Multi-Agent](https://github.com/myFiHub/podium-voices) — MIT
- [VideoSDK Agents v1.0.0 Announcement](https://www.videosdk.live/blog/product-updates-march-2026)
- [Farcaster Agentic Bootcamp](https://rifio.dev/events/05ff846c-1b33-47fe-8f30-4922dee8174f)
- [Claude Agent SDK Streaming](https://platform.claude.com/docs/en/agent-sdk/streaming-output)
- [Daily.co Real-Time AI Meeting Assistant](https://www.daily.co/blog/build-a-real-time-ai-video-meeting-assistant-with-daily-and-openai/)
- [Doc 227 — Agentic Workflows 2026](../227-agentic-workflows-2026/)
- [Doc 278 — Agentic Bootcamp ZAO Agent Squad](../278-agentic-bootcamp-zao-agent-squad/)
