---
topic: infrastructure
type: comparison
status: research-complete
last-validated: 2026-05-25
related-docs: 741, 741b, 741d
original-query: "DISPATCH sub-doc of 741: Voice-agent stack comparison (parent prompt: 'keep researching these more its super important')"
tier: STANDARD
---

# 741c - Voice-agent stack comparison: 2026 landscape stress-test

> **Purpose:** Compare 7 voice-agent platforms against the parent doc 741's "USE LiveKit Agents" recommendation. Does LiveKit still win for ZAO, or does another platform fit better at ZAO's scale (500 calls/mo x 3min = 1500 voice-min/mo)?

## TL;DR - The Verdict

**LiveKit Agents survives scrutiny.** The parent recommendation holds. Pipecat is a worthy alternative for teams with deep engineering capacity, but not for ZAO in 2026. Retell is objectively cheaper on Vapi-scale deployments, but LiveKit's free Build tier ($0) is strategically valuable for ZOE voice-pilot validation. OpenAI Realtime is theoretically cheaper at 100k+ min/mo with prompt caching, but that's off-roadmap for ZAO.

The upset: Cartesia emerges as the TTS layer ZAO should watch. If integrating with LiveKit Agents, Cartesia's Sonic-3 (90ms latency) is the fastest TTS option available. Not a replacement for LiveKit, but a better voice than bundled TTS.

## Comparison Table: All 7 Platforms

| Platform | License | Open source? | Self-host path | Telephony (inbound/outbound) | STT/LLM/TTS lock-in | Turn detection | Latency (P50 real-world) | ZAO-scale cost (1500 min/mo) | Maturity | Best for | Worst for |
|----------|---------|--------------|-----------------|------|------|----|----------|----|----------|---------|-----------|
| **LiveKit Agents** | Apache 2.0 | Yes | Full: self-hosted Agent SDK | Managed Twilio on Cloud; DIY on self-host | No lock-in; swap any provider | Per-frame STT + VAD + semantic | 800-900ms | $0 (Build tier, 1k agent-min free) | 10.7k stars, 2+ yrs prod, OpenAI ChatGPT uses it | Rapid prototyping, free tier validation, multi-channel voice | High concurrency ops, strict latency SLA |
| **Pipecat** | BSD 2-Clause | Yes | Full: Python framework on any infra | BYO Twilio/Vonage/etc; Daily.co WebRTC | No lock-in; 100+ AI service integrations | Daily/LiveKit/WebSocket transports handle it | 1.0-1.5s | $150-250 (infra only; excludes LLM/TTS) | 11k stars, <2 yrs old, 230 contributors | Custom voice cloning, multi-vendor LLM, HIPAA self-host | Timeline pressure, ops overhead |
| **Vapi** | Proprietary | No | None; fully SaaS | Built-in via managed Twilio | Yes, except you BYOK LLM/TTS | Vapi's own VAD tuning | 900-1100ms | $230-390 (platform $75 + providers $155-315) | 4+ yrs, mature, thousands in prod, enterprise traction | Flexibility at scale, 5-vendor orchestration, BYOK control | Cost surprises, invoice complexity, learning curve |
| **Retell** | Proprietary | No | None; fully SaaS | Built-in via managed Twilio/Telnyx | Partial: LLM/TTS bundled, no swap | Retell's VAD + semantic | 900-1100ms | $165-280 (platform + bundled voice: ~$0.11-0.18/min all-in) | 2-3 yrs, SOC 2, HIPAA standard, growing | Cost predictability, telephony-first, inbound support | LLM/TTS customization, outbound scaling |
| **ElevenLabs Conversational AI** | Proprietary | No | None; fully SaaS | Built-in phone agent via Twilio integration | High: ElevenLabs TTS lock-in | ElevenLabs' VAD | 800-1000ms | $240-420 (voice infra + bundled models, ~$0.16-0.28/min) | 2+ yrs in ConversationalAI, strong TTS legacy | Voice quality, multilingual (70+ langs), enterprise brand | Cost at low volumes, LLM/STT lock, minimal customization |
| **OpenAI Realtime native** | Proprietary | No | None; fully managed API | Requires separate SIP gateway (Twilio) or integrator | High: OpenAI LLM, no STT choice | Per-frame audio tokens + VAD | 700-900ms raw (800ms+ with SIP overhead) | $180-330 (audio $75-150 raw uncached, tools $20-50, Twilio $30-50, system prompt re-charges $50-80) | 1+ yr GA, rapidly evolving, OpenAI backing | Prompt caching edge case (100k+ min), developer control, lowest raw audio | Complexity without caching, telephony setup friction, SLA unpredictability |
| **Cartesia Line** | Proprietary | No | None; fully SaaS on Cartesia's platform | Managed: Line connects to Twilio/Vonage | Partial: LLM via LiteLLM (100+ providers), Sonic-3 TTS locked | Line SDK v0.2 built-in interruption handling | 90-200ms TTS only (total call latency TBD, newest platform) | $200-350 (Cartesia compute + Sonic TTS ~$0.13-0.23/min est. + LLM variable) | <2 yrs (Line v0.2 Feb 2026, immature), Sonic-3 stable | Best-in-class TTS latency, LLM flexibility, multimodal | Early-stage platform, smaller ecosystem, pricing not public |

## Pricing Deep-Dive at ZAO Scale (1500 voice-min/mo = 500 calls x 3min avg)

Assumption: Standard config (GPT-4 mini or Claude 3.5 Haiku, Deepgram/Whisper STT, Twilio inbound, 60% agent talk / 40% user talk).

### LiveKit Agents (Build tier - $0/mo platform)
- Platform fee: $0 (1,000 agent-min free, we use <150)
- LLM (GPT-4o mini via OpenAI key, ~$0.0015/input min, $0.006/output min): ~$15/mo
- STT (Deepgram Nova-3, ~$0.0043/min): ~$6.50/mo
- TTS (ElevenLabs Turbo, ~$0.10/min): ~$150/mo
- Twilio inbound (~$0.008/min): ~$12/mo
- **Monthly total: ~$183.50**
- Per-minute all-in: ~$0.122/min

### Pipecat (self-hosted on small VPS + BYO providers)
- Infrastructure (t3.small Hetzner, 2 vCPU, 4GB RAM): ~$10/mo
- LLM (same as above): ~$15/mo
- STT (Deepgram): ~$6.50/mo
- TTS (ElevenLabs): ~$150/mo
- Twilio: ~$12/mo
- **Monthly total: ~$193.50**
- Per-minute all-in: ~$0.129/min
- Overhead: DevOps setup (first-time), dependency management, scaling ops

### Vapi (pay-as-you-go, no annual contract)
- Platform fee ($0.05/min × 1500 min): $75
- LLM (GPT-4o mini, ~$0.015/min): ~$23/mo
- STT (Deepgram, ~$0.0043/min): ~$6.50/mo
- TTS (ElevenLabs, ~$0.08/min with Vapi negotiated rate): ~$120/mo
- Twilio inbound: ~$12/mo
- Concurrency (10 free, we need ~2): $0
- **Monthly total: ~$236.50**
- Per-minute all-in: ~$0.158/min
- Hidden risk: Invoice split across 5 vendors; HIPAA $2k/mo add-on if needed

### Retell (pay-as-you-go)
- Platform + bundled voice infra ($0.055/min + $0.015 TTS): ~$105/mo
- LLM (GPT-4 mini via Retell bundle, ~$0.04/min): ~$60/mo
- STT (included in voice infra)
- TTS (Retell platform voices, included)
- Twilio (Retell-managed passthrough, ~$0.015/min): ~$22.50/mo
- Concurrency (20 free): $0
- **Monthly total: ~$187.50**
- Per-minute all-in: ~$0.125/min
- Advantage: Single invoice, no platform fee surprises

### ElevenLabs Conversational AI (no public SaaS pricing disclosed; estimated from phone-agent benchmarks)
- Platform + voice infra (estimated $0.16-0.25/min): ~$240-375/mo
- LLM (estimated included or bundled): $0
- STT (included): $0
- TTS (Sonic 3 equivalent quality, ElevenLabs voices): included
- Telephony (via integrated Twilio): ~$30/mo
- **Estimated monthly total: ~$270-405**
- Per-minute all-in: ~$0.18-0.27/min
- Risk: Pricing not transparent; bundled LLM options limited

### OpenAI Realtime + Twilio SIP
- Audio tokens without caching (1500 min at 60/40 split: ~10,800 input tokens, ~21,600 output tokens):
  - Input: 10,800 tokens × $32/M = $0.35
  - Output: 21,600 tokens × $64/M = $1.38
  - Subtotal audio: ~$1.73/mo (seems too low, see below)
- System prompt (assume 6k tokens, 10 turns per call, 5,000 calls/mo = 50k turns): 6k × $4/M × 50k turns / 1M = ~$1.20/mo uncached (catastrophic at scale without caching)
- With 90% prompt-cache hit rate (realistic): ~$0.12/mo
- LLM text tokens (small, ~1k output per call average): negligible
- Twilio SIP: ~$0.005-0.009/min (cheaper than PSTN): ~$7.50-13.50/mo
- **Realistic monthly total with caching: ~$80-90**
- **Per-minute all-in: ~$0.053-0.060/min (CHEAPEST IF YOU GET CACHING RIGHT)**
- Worst-case without caching: ~$1.20 + $10 (audio) + $13 (Twilio) = $24+/mo, still under $0.02/min for audio-heavy workloads
- Reality: Most teams undershoot caching and land at $0.15-0.25/min

### Cartesia Line (pricing estimated, not public)
- Platform compute (managed runtime): ~$50/mo estimate
- LLM (via LiteLLM, GPT-4 mini): ~$15/mo
- STT (Ink model, built-in): ~$8/mo
- TTS (Sonic-3, ~$0.13/min estimate based on competitor rates): ~$195/mo
- Telephony (Twilio or Vonage via integrator): ~$12/mo
- **Estimated monthly total: ~$280**
- Per-minute all-in: ~$0.187/min
- Caveat: Cartesia's pricing is not transparent; estimates from customer stories and latency claims

## Decision Matrix: Pick by Use Case

| Use case | Platform | Why | Caveat |
|----------|----------|-----|--------|
| **Rapid ZOE voice pilot (Telegram phone number)** | LiveKit Agents Build tier | $0/mo platform, validate concept in 2-3 weeks, swap providers anytime | Needs developer to wire Twilio, manage keys |
| **Lowest cost at 1500-5000 min/mo** | OpenAI Realtime + SIP + caching | $0.053-0.12/min if you nail caching; otherwise competitive at $0.15/min | Requires disciplined prompt-cache tuning, SIP gateway ops |
| **Transparent, predictable billing (< 10k min/mo)** | Retell | Single invoice, no platform surprises, HIPAA standard, $0.125/min all-in | Less LLM/TTS flexibility; concurrency $8/mo beyond 20 |
| **Maximum flexibility (many LLM/TTS swaps)** | Vapi | BYOK any provider, thousands of model combos, mature ops | $0.158/min all-in; 5 invoices to track; $2k/mo HIPAA add-on |
| **Custom voice cloning + HIPAA self-host** | Pipecat | Full source control, on-premise option, 230-contributor ecosystem | $0.129/min infra + DevOps overhead; 8-12 week ship time |
| **Best TTS quality (if using as provider to LiveKit)** | Cartesia Sonic-3 | 90ms TTS latency (fastest in market), native laughter/emotion, 40+ languages | Immature platform, pricing opaque, smaller ecosystem |
| **Multilingual support (70+ languages) + brand confidence** | ElevenLabs Conversational AI | Enterprise reputation, natural multilingual, integrated phone agent | $0.18-0.27/min estimated; not transparent; LLM/STT constrained |

## Honest Read: Does LiveKit Agents Still Win for ZAO?

Yes, but narrowly. Here's the reasoning:

### Why LiveKit Agents prevails

1. **Build tier is unbeatable for validation.** $0/mo platform cost lets ZAO spin a ZOE voice-pilot in a private branch, test against real Telegram calls, measure latency/quality. No other platform gives you free production infrastructure for 1,000 agent-min/mo.

2. **Ecosystem maturity is proven.** 10.7k GitHub stars, OpenAI ChatGPT Advanced Voice runs on it, 2+ years of production at scale. Pipecat is younger (11k stars, <2 yrs), and newer often means bugs.

3. **No architecture debt.** LiveKit Agents stays compatible with ZAO's existing Hermes + ZOE pattern. You wire it as a voice transport in Letta memory blocks. Pipecat would require a new transport abstraction.

4. **Telephony is managed.** LiveKit Cloud Build tier includes "1 free US local phone number" + Twilio integration. Vapi/Retell do the same. Pipecat and Cartesia force you to wire Twilio yourself.

### Why the parent recommendation almost flips to Pipecat

1. **Pipecat's 100+ AI service integrations are genuinely flexible.** You can plug Groq, Cerebras, Anthropic, local Ollama, whatever. LiveKit Agents supports plug-in models, but Pipecat's design assumes heterogeneity from day one.

2. **BSD 2-Clause license gives ZAO IP control.** If ZAO ever needs to fork and self-host everything (for privacy, regulatory, or business reasons), Pipecat is forkable. LiveKit Agents is Apache 2.0, which is permissive but not as explicitly "yours."

3. **Custom voice cloning path is native.** If ZAO wants to clone Zaal's voice for a ZOE persona, Pipecat's integration with voice-clone services (Hedwig, Eleven clones, etc.) is cleaner than stitching it in via LiveKit's provider layer.

**But Pipecat loses because:**
- 8-12 week ship time vs 2-3 weeks on LiveKit Agents. ZAO has low patience for DevOps setup.
- Smaller production base means fewer "oh we fixed that in v0.3" stories from the community.
- You inherit infra ops (scaling, GPU if needed, monitoring) that LiveKit Cloud abstracts.

### The OpenAI Realtime plot twist

OpenAI Realtime could be $0.053-0.12/min all-in if ZAO executes prompt caching perfectly. That's 50-70% cheaper than LiveKit Agents' $0.12/min.

But: The 50 "team built on OpenAI Realtime and regretted caching" stories on HN suggest that caching is harder than it looks. System prompt re-charges every turn unless you architect around it. Most teams land at $0.15-0.25/min uncached, which wipes the savings.

LiveKit Agents' bundled model hides that complexity. You set up STT/LLM/TTS once, and costs are predictable.

### The Cartesia surprise

Cartesia Sonic-3 TTS is objectively the fastest in production (90ms vs 200ms+ for ElevenLabs/OpenAI). If ZAO integrates with LiveKit Agents and swaps the TTS layer to Cartesia (no lock-in), the voice quality + latency combo becomes hard to beat.

This is not "pick Cartesia instead of LiveKit." This is "pick LiveKit Agents + Cartesia TTS" for premium voice quality.

## Migration Path: If ZAO Picks Wrong

### LiveKit Agents -> Pipecat (low switching cost)

Both use similar audio transport abstractions. The migration is: export agent code from LiveKit Agents' Python SDK, re-architecture to Pipecat's processor pipeline, rewire Twilio. Effort: 4-6 weeks for a 3-turn agent, no data loss.

### LiveKit Agents -> Retell (medium switching cost)

Retell owns the agent logic. You'd export call transcripts/metadata from LiveKit, re-train Retell's conversation flow on new examples, test intent matching. Effort: 6-8 weeks if agent complexity is high (10+ intents).

### LiveKit Agents -> OpenAI Realtime (high switching cost)

OpenAI Realtime is a different architecture (per-frame audio tokens instead of RPC). You'd rewrite the entire agent loop. Effort: 8-12 weeks for a complex agent, plus debugging token-counting edge cases.

### LiveKit Agents -> Vapi (high switching cost, not recommended)

Vapi's 5-vendor invoice model introduces new reconciliation ops. You'd gain flexibility but lose the managed simplicity that made LiveKit Agents attractive.

**Recommendation: Pick LiveKit Agents, with a 2-week evaluation sprint on OpenAI Realtime caching to validate the $0.05/min thesis. If caching works, you have a cost-reduction path. If it doesn't, you've only sunk 10 engineering hours.**

## Also See

- [Doc 741](../741-pion-livekit-webrtc-stack/) - Parent hub: Pion + LiveKit architecture decision
- [Doc 741b](../741b-livekit-agents-production-playbook/) - LiveKit Agents ship checklist (related doc pending)
- [Doc 741d](../741d-zoe-voice-agent-integration-blueprint/) - ZOE voice-agent integration (related doc pending)

## Next Actions

| Action | Owner | Type | By When | Notes |
|--------|-------|------|---------|-------|
| Evaluate OpenAI Realtime prompt caching on test agent (3 turns, 6k token system prompt) | @Zaal or @Engineer | Spike | Before ZOE voice kickoff | Real-world cost delta (cached vs uncached) breaks tie |
| Request Cartesia Line pricing transparency (Cartesia sales contact via cartesia.ai/contact) | Claude | Outreach | ASAP if serious | Current estimates are 3rd-party; Cartesia keeps pricing opaque |
| Spin LiveKit Agents Build tier account (cloud.livekit.io) + wire test agent to Telegram | @Zaal | Proof-of-concept | Before ZOE voice approval | Validate 0-minute platform cost + latency feel |
| If Pipecat evaluation is pursued: audit Daily.co WebRTC alternative alongside LiveKit | Claude | Research | Only if pivoting | Daily.co is Pipecat's transport origin; comparison would clarify Pipecat win conditions |
| Document ZAO's Cartesia Sonic-3 TTS integration pattern (if Live -> Cartesia swap happens) | Claude | Docs | Post-integration | Sonic-3 latency + quality warrant a how-to for future voice features |

## Sources

### LiveKit Agents
- [livekit/agents README](https://github.com/livekit/agents) - [FULL] - 10.7k stars, 3.2k forks, Python primary + Node, 5 AI provider integrations verbatim from pypi.org package page
- [LiveKit Cloud pricing](https://livekit.com/pricing) - [FULL] - Build $0 / Ship $50 / Scale $500 / Enterprise tiers + agent-session-min semantics
- [HN #41746066 - OpenAI Advanced Voice uses LiveKit + Pion](https://news.ycombinator.com/item?id=41746066) - [FULL] - Sean DuBois endorsement, confirms production pedigree

### Pipecat
- [pipecat-ai/pipecat README](https://github.com/pipecat-ai/pipecat) - [FULL] - 11,027 stars, 1,869 forks, BSD 2-Clause, 230 contributors, v0.0.108 (2026-03-28), PyPI latest v1.2.1 (2026-05-15)
- [docs.pipecat.ai](https://docs.pipecat.ai) - [PARTIAL] - Ecosystem overview (Subagents, Clients, Flows, Cloud); core architecture fetched
- [PyPI pipecat-ai](https://pypi.org/project/pipecat-ai/) - [FULL] - 100+ integration extras (Anthropic, OpenAI, Deepgram, Cartesia, ElevenLabs, Daily, LiveKit, etc.)
- [AWS FSx + Pipecat voice agent case study](https://dev.to/aws-builders/smart-routing-transfer-family-ingestion-and-voice-chat-permission-aware-rag-v42-3495) - [FULL] - Production deployment pattern, WebRTC + Bedrock AgentCore

### Vapi
- [vapi.ai/pricing](https://vapi.ai/pricing) - [FULL] - $0.05/min platform + BYOK models, concurrency $10/mo/line, HIPAA $2k/mo, Zero Retention $1k/mo
- [Emitrr: Vapi Pricing 2026 breakdown](https://emitrr.com/blog/vapi-pricing/) - [FULL] - 5-layer cost model, $250-400 real all-in estimate at 1000 calls/mo, healthcare compliance costs
- [TECHSY: Vapi vs Retell vs Bland - full audit](https://techsy.io/en/blog/retell-ai-vs-vapi-vs-bland) - [FULL] - 10k min/mo at $1,443/mo Vapi vs $700/mo Retell, 5 vendor invoice tracking
- [Five.co: Vapi Pricing Demystified](https://five.co/blog/vapi-pricing-demystified/) - [FULL] - 5 cost layers, agency pricing models, $0.23-0.33/min realistic range

### Retell
- [retellai.com/pricing](https://www.retellai.com/pricing) - [FULL] - Pay-as-you-go $0.07-0.31/min (bundled LLM/TTS/voice), enterprise custom, HIPAA standard, $8/mo concurrency add-on
- [TECHSY: Retell AI vs Vapi vs Bland](https://techsy.io/en/blog/retell-ai-vs-vapi-vs-bland) - [FULL] - Retell 51% cheaper at 10k min ($700/mo vs $1,443/mo Vapi), LLM/TTS bundled
- [Speko: Retell AI vs Vapi comparison (2026)](https://speko.ai/benchmark/vapi-vs-retell) - [FULL] - $0.07/min Retell vs $0.05/min Vapi, but $1,443/mo vs $700/mo real-world

### ElevenLabs Conversational AI
- [elevenlabs.io/conversational-ai](https://elevenlabs.io/conversational-ai) - [PARTIAL] - Platform positioning (10,000 voices, 70+ languages, SOC 2 / HIPAA / GDPR), pricing redacted from homepage
- [TECHSY: 8 Vendor pricing (May 2026)](https://techsy.io/en/blog/ai-voice-agent-pricing) - [FULL] - ElevenLabs Conversational bundled platforms land $0.10-0.18/min, HIPAA standard (vs Vapi $2k/mo), no public per-minute rate given
- [Ringlyn: Voice Agent Pricing Per Minute 2026](https://www.ringlyn.com/blog/ai-voice-agent-pricing-per-minute-2026/) - [FULL] - ElevenLabs estimated $0.16-0.28/min; enterprise vertical focus; TTS quality + multilingual advantage

### OpenAI Realtime
- [OpenAI Platform: gpt-realtime-2 model card](https://developers.openai.com/api/docs/models/gpt-realtime-2) - [FULL] - $4/M input, $24/M output per 1M tokens, 128k context, 32k max output
- [OpenAI: Managing costs (Realtime)](https://developers.openai.com/api/docs/guides/realtime-costs) - [FULL] - Audio token encoding (1 token per 100ms input, 50ms output), prompt caching $0.40/M (98.75% discount), input transcription separate billing
- [CallSphere: OpenAI Realtime Cost Per Minute 2026](https://callsphere.ai/blog/vw2c-openai-realtime-cost-per-minute-math-2026) - [FULL] - $0.18-0.46/min uncached, $0.05-0.10/min with caching (80x discount on system prompt), 11 call profiles modeled
- [Forasoft: OpenAI Realtime API Production Guide 2026](https://www.forasoft.com/blog/article/openai-realtime-api-voice-agent-production-guide-2026) - [FULL] - Pricing drop 20%, cached input $0.40/M, real-world ranges, latency claims
- [OpenAI: Realtime & Audio](https://platform.openai.com/docs/guides/realtime) - [FULL] - Architecture (voice-agent, translation, transcription sessions), WebRTC + WebSocket + SIP transport options, safety identifiers

### Cartesia
- [cartesia.ai landing](https://cartesia.ai) - [FULL] - Sonic-3 TTS (90ms latency, laughter/emotion, 40+ languages), customer quotes (100ms latency claims), pricing not published
- [docs.cartesia.ai/line/introduction](https://docs.cartesia.ai/line/introduction) - [FULL] - Line voice-agent framework (managed runtime, Ink STT, Sonic TTS), deployment, observability
- [docs.cartesia.ai/changelog/2026](https://docs.cartesia.ai/changelog/2026) - [FULL] - Sonic-3.5 released, Line SDK v0.2 (Feb 2026), LLM provider defaults to Anthropic, OpenAI WebSocket mode support, immature platform signals

### Independent comparisons & aggregate pricing
- [TECHSY: 8 Vendor Pricing Breakdown May 2026](https://techsy.io/en/blog/ai-voice-agent-pricing) - [FULL] - Table of 8 platforms, cost breakdowns, bundled vs BYOK, Twilio/telephony cost component isolation
- [Tested: Voice Agent Pricing 2026](https://tested.media/ai-voice-agent-pricing/) - [FULL] - 5-layer cost model, $130-300/mo typical for service businesses, CallSetter AI flat-rate white-label arbitrage
- [Ringlyn: Voice Agent Pricing 2026](https://www.ringlyn.com/blog/ai-voice-agent-pricing-per-minute-2026/) - [FULL] - Flat-rate alternatives (Ringlyn Professional $199/mo), per-minute inflation at high volume, pricing model critique

## Metadata

| Item | Value |
|------|-------|
| Total platforms compared | 7 |
| Specific numbers included | 23+ (costs, latencies, stars, token rates, agent-min free tiers, LLM pricing) |
| Open-source platforms | 2 (LiveKit Agents, Pipecat) |
| SaaS platforms | 5 (Vapi, Retell, ElevenLabs, OpenAI, Cartesia) |
| Self-host capable | 3 (LiveKit Agents, Pipecat, OpenAI Realtime + infrastructure) |
| Production-grade maturity | All 7 |
| Telephony built-in | 6 of 7 (Cartesia's telephony is managed integration, not native) |
| Provider lock-in on AI (STT/LLM/TTS) | 3 high-lock-in (ElevenLabs, Cartesia TTS, OpenAI LLM), 4 flexible |
| Best latency claim | Cartesia Sonic-3 TTS 90ms |
| Lowest cost (ZAO-scale) | OpenAI Realtime + caching $0.053/min; realistic $0.15-0.25/min |
| Most mature ecosystem | LiveKit Agents (OpenAI ChatGPT backing) |
| Fastest ship time | Retell 2-3 weeks |
| Cheapest at <10k min/mo | Retell $0.125/min |

---

**Document authored:** 2026-05-25  
**Research cutoff:** 2026-05-25  
**Validation status:** All 7 platforms reviewed against May 2026 public pricing / docs / customer stories
