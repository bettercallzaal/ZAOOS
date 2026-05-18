---
topic: agents
type: decision
status: research-complete
last-validated: 2026-05-04
related-docs: 325, 433, 560, 601
tier: STANDARD
---

# 605d - Voice agents for ZOE

> **Goal:** Decide if ZOE gets a voice mode (phone-callable + Telegram voice messages) and which stack.

**Decision:** BUILD via LiveKit Agents (OSS) + Cartesia Sonic-3 TTS, Phase 2 post-ZAOstock spinout.

---

## Overview

ZOE concierge currently responds to Telegram DMs (text only). Voice mode would let Zaal interact via Telegram voice messages or phone calls - ideal for commute captures, hands-free updates during gym/build sessions, async reflections.

This doc surveys 6 platforms and recommends an approach optimized for ZAO's constraints: self-hosted on VPS 1 when possible, no vendor lock-in, integrated into existing Telegram flow.

---

## Platform Comparison

| Platform | Type | Cost | Latency | BYOLLM | OSS | Best For |
|----------|------|------|---------|--------|-----|----------|
| **Vapi** | SaaS | $0.30-0.33/min ($1,443/mo @ 10K min) | 500-800ms | No (fixed models) | No | Fast MVP, low setup |
| **Retell AI** | SaaS | $0.07-0.31/min ($700-2,100/mo) | ~600ms | Limited | No | Transparent pricing, 3min deploy |
| **OpenAI Realtime** | API-first | ~$0.003/min (embedded in API) | ~500ms | No | No | High-volume, simple flows |
| **LiveKit Agents** | OSS Framework | Self-hosted (only compute) | Variable (50-200ms) | Yes | Yes (Apache-2.0) | Full control, no per-call fees |
| **ElevenLabs Agents** | SaaS | $0.02-0.10/min + concurrent seat fees | ~400ms | Yes | No | Voice cloning, voice quality focus |
| **Cartesia Sonic-3** | SaaS TTS component | $0.001-0.01/min (TTS only) | 90ms first-chunk | N/A (TTS) | Integrates with OSS (Pipecat/LiveKit) | Emotional expression, streaming latency |

---

## Detailed Findings

### Vapi AI

**Pros:**
- Production-ready, many integrations
- No hidden integrations (integrated platform)

**Cons:**
- Expensive: true cost $0.30-0.33/min after bundling STT, TTS, LLM, platform
- At ZOE scale (10 calls/day @ 5min avg = 50min/mo): ~$15-17/mo passable, but scales poorly
- Requires Vapi-managed workflow, harder to customize ZOE memory blocks

**Verdict:** Only if speed-to-market > cost. Skip for ZAO's OSS-first ethos.

---

### Retell AI

**Pros:**
- Transparent, modular pricing: $0.07-0.31/min depending on LLM + STT/TTS choices
- Drag-and-drop UI (3 min setup vs 2-12 weeks competitors)
- HIPAA/SOC2 compliant
- Can use Claude Sonnet/Opus via API selector

**Cons:**
- Still SaaS, per-call billing
- ~$700/mo at scale (100K minutes)
- Phone-focused (not optimal for Telegram voice message integration)

**Verdict:** Strong fallback if LiveKit setup hits friction.

---

### OpenAI Realtime API

**Pros:**
- Native speech-to-speech with gpt-realtime
- ~500ms API latency (near-instant for US clients)
- Multimodal (audio + text + images)
- Cost: included in API usage (~$0.003/min for voice if using cheaper models, higher for o1-preview)

**Cons:**
- Not designed for self-hosting
- Best for simple text-then-voice flows, not agentic memory recall
- Requires Max Plan subscription (or API billing) already available to Zaal

**Verdict:** Treat as **Phase 2 upgrade** if ZOE migrates to gpt-realtime backbone (higher quality). Today: skip, too entangled with OpenAI bias.

---

### LiveKit Agents (OSS)

**Pros:**
- **Open source (Apache-2.0)** - deploy on VPS 1, zero per-call licensing
- Flexible: MultimodalAgent (uses OpenAI realtime) or VoicePipelineAgent (STT then LLM then TTS)
- Supports 200+ LLMs via plugins (Anthropic Claude included)
- Handles turn detection, interruptions, streaming natively
- Python or Node.js - integrates with existing ZOE Hermes runtime
- Community active; Pipecat (BSD-2) alternative also solid

**Cons:**
- Requires infra setup: LiveKit server + agent process on VPS 1
- Need to wire Telegram voice message then LiveKit room then ZOE concierge
- More code than SaaS drag-and-drop (2-4 weeks vs 3 minutes)

**Verdict:** **Recommended for BUILD phase.** Cost-optimal long-term, aligns with ZAO values, compatible with Hermes stack.

---

### ElevenLabs Agents

**Pros:**
- Voice cloning from short clips (useful for personal brand)
- Brings-your-own-LLM: plug Claude via API
- Lower latency than Vapi (~400ms)
- Built-in knowledge base + tool calling

**Cons:**
- SaaS pricing: ~$0.02-0.10/min + seat fees (exact pricing opaque)
- Requires ElevenLabs API key in ZOE flow
- Phone-oriented, Telegram integration custom-built

**Verdict:** Strong alternative if voice cloning / voice quality > cost. Reserve for Phase 3 if ZOE brand voice needed.

---

### Cartesia Sonic-3

**Pros:**
- Lowest latency TTS: 90ms first-chunk (sub-200ms full token)
- Emotional expressiveness (laughter, tone control)
- Integrates into LiveKit + Pipecat pipelines seamlessly
- Cost: pay-per-token TTS usage only

**Cons:**
- TTS component only, not full agent
- Requires orchestration layer (LiveKit or Pipecat)

**Verdict:** **Pair with LiveKit Agents** for optimal latency + quality. Cartesia becomes the TTS backbone of the VoicePipelineAgent.

---

## Recommended Architecture

### Phase 2 Build Option (RECOMMENDED)

```
Telegram voice message (Zaal speaks)
  ↓ (via webhook)
LiveKit Agent (Python, on VPS 1)
  ├─ STT: AssemblyAI or OpenAI Whisper (free tier)
  ├─ LLM: Anthropic Claude (via ZOE concierge subprocess, existing)
  ├─ TTS: Cartesia Sonic-3 (streaming, 90ms latency)
  └─ Memory blocks: load from ~/.zao/zoe/ (same as text)
  ↓
Telegram reply (voice message or text)
```

**Cost:** ~$2-5/mo (Cartesia TTS only, Whisper free tier)
**Latency:** 200-400ms end-to-end
**Setup:** 2-4 weeks
**Maintenance:** Self-hosted, no vendor lock-in

---

### Phase 2 Alternative (Speed > Cost)

If Zaal wants voice mode live within 1 week without VPS work:

- **Retell AI** for phone + Telegram integration via webhook
- Use Claude via Retell's LLM selector
- Cost: ~$20-50/mo for typical usage
- Trade-off: recurring SaaS bill

---

### Phase 3 Upgrade (Optional)

If voice quality / brand matters:

- **ElevenLabs Agents** with voice cloning of Zaal's voice
- Or: **OpenAI Realtime** if ZOE fully migrates to gpt-realtime model
- Unlock emotional nuance, multilingual support

---

## Decision

**BUILD: LiveKit Agents + Cartesia Sonic-3**

Why:
1. **Cost:** $2-5/mo vs $15-50/mo competitors
2. **Control:** Self-hosted, full customization, ZOE memory blocks wired in
3. **Brand:** OSS aligns with ZAO values (ZABAL, Respect, self-custody narrative)
4. **Integration:** Python + Hermes stack, no new vendor relationships

**When:** Post-ZAOstock spinout. Voice mode is nice-to-have, not P0. Zaal can still use text Telegram in interim.

**Blocker:** None identified. LiveKit docs clear, Cartesia integration proven (see Pipecat examples).

---

## Codebase Touchpoint

- File: `bot/src/zoe/index.ts` - currently grammy `bot.on('message:text')` handler. Voice mode adds `bot.on('message:voice')` that downloads the file_id, pipes to Whisper STT, runs through `concierge.ts`, then TTS-encodes the reply via Cartesia.
- File: `bot/src/zoe/concierge.ts` - no change needed. Voice path reuses the same memory blocks.

## Next Actions

| Action | Owner | Type | Trigger |
|--------|-------|------|---------|
| Spike LiveKit + Cartesia integration (proof of concept on VPS 1) | @Zaal | Spike branch | After ZAOstock spinout 2026-W19 |
| Sign up for Cartesia API key + budget cap at $5/mo | @Zaal | Procurement | Phase 2 kickoff |
| Wire `bot/src/zoe/index.ts` voice handler | Claude | PR | After spike validates latency |
| Decide BYO Whisper (OSS) vs AssemblyAI free tier | Claude | Doc note | During spike |

## Sources

1. [Vapi Pricing & Review - CloudTalk](https://www.cloudtalk.io/blog/vapi-ai-pricing/)
2. [Retell AI Pricing Comparison (2025) - Retell AI](https://www.retellai.com/resources/voice-ai-platform-pricing-comparison-2025)
3. [OpenAI Realtime API - Developers](https://developers.openai.com/api/docs/guides/realtime)
4. [LiveKit Agents Framework - GitHub](https://github.com/livekit/agents)
5. [ElevenLabs Voice Agents Documentation](https://elevenlabs.io/docs/eleven-agents/overview)
6. [Cartesia Sonic-3 & TTS API - Cartesia](https://cartesia.ai/product/python-text-to-speech-api-tts)
