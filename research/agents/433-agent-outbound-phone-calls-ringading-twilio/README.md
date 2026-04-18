# 433 - Agent Outbound Phone Calls: Ring-a-Ding vs DIY Twilio + OpenAI Realtime

> **Status:** Research complete
> **Date:** 2026-04-18
> **Tags:** `#agents` `#voice` `#telephony` `#openai-realtime` `#twilio` `#livekit` `#ringading`
> **Related:** Doc 325 (ElevenLabs Agents), Doc 290 (FISHBOWLZ agentic participants), Doc 234 (OpenClaw)
> **Trigger:** Reddit r/OpenClawInstall post (Apr 17, 2026) on ring-a-ding plus tristanbrotherton comment on DIY Twilio + OpenAI Realtime build

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| Use case for ZAO | USE outbound phone agent for ZAO Stock vendor coordination (Wallace Events tents, sound/stage vendors, Ellsworth venues) and artist outreach follow-ups. Doc 428 confirms Oct 3 2026 event with $5-25K budget and multi-vendor calls |
| Short-term path | USE Ring-a-Ding ($19/mo flat, BYOK OpenAI) for 30-day validation. No SIP, no Twilio account setup, CLI + MCP server ship with it. Personal-assistant ToS blocks sales calls so scope matches ZAO Stock logistics cleanly |
| Medium-term path | BUILD DIY Twilio Media Streams + OpenAI Realtime API (gpt-realtime-1.5) once call volume exceeds 50/month or workflow needs Claude-driven scripting. Reference: Twilio's official speech-assistant-openai-realtime-api-python sample repo |
| Voice stack choice | USE OpenAI Realtime API for demo speed, SWITCH to LiveKit + Deepgram + Claude only if latency spikes above 800ms or cost-per-minute matters more than time-to-ship |
| Legal guardrail | DISCLOSE AI at call start, REQUIRE both-party consent for recording (Maine, California, Florida all two-party). Skip any automated outreach-at-scale pattern. Doc sph130 Reddit comment flagged TCPA + state recording laws |
| ZAO code path | HOST CLI skill in ZOE agent squad. Log call metadata to Supabase table `agent_calls` (to, reason, duration, transcript_url, summary) for audit trail |

---

## Comparison of Options

### Platforms / DIY paths

| Option | Cost | Setup time (diff 1-10) | Who handles SIP | Recording + transcript | Best for |
|--------|------|------------------------|-----------------|------------------------|----------|
| **Ring-a-Ding** (ringading.ai) | $19/mo flat + BYOK OpenAI tokens | 2 | Ring-a-Ding | Included | Validating agent phone flows without plumbing |
| **Twilio Media Streams + OpenAI Realtime** | Twilio $0.0085/min inbound + $0.014/min outbound + ~$0.06/min OpenAI Realtime audio in + $0.24/min out | 6 | You | You (Twilio recording $0.0025/min) | Production, custom scripts, tool calls |
| **LiveKit + Deepgram + Claude** | LiveKit Cloud $0.004/min audio + Deepgram STT $0.0043/min + Claude tokens + Twilio SIP trunk | 7 | You | You | Lowest latency voice agents, swap STT/TTS/LLM independently |
| **ElevenLabs Agents** (Doc 325) | ~$0.08-0.12/min bundled | 4 | ElevenLabs + Twilio SIP | Included | Best voice quality, already researched for FISHBOWLZ |
| **Vapi.ai** | $0.05/min platform + model passthrough | 3 | Vapi | Included | Closest commercial analogue to Ring-a-Ding with more enterprise features |

### Reference implementations (primary sources)

| Repo / doc | Language | What it shows |
|------------|----------|---------------|
| twilio-samples/speech-assistant-openai-realtime-api-python | Python + FastAPI | Full inbound + outbound voice agent, Media Streams WebSocket bridge |
| Twilio blog: Make Outbound Calls with Python + OpenAI Realtime + Twilio Voice | Python | Outbound dial + realtime bridge |
| openai.github.io/openai-agents-js/extensions/twilio | TypeScript | Agents SDK with Twilio transport layer, interruption handling |
| rehan-dev/ai-call-agent GitHub | Node | Alternate minimal outbound dialer pattern |

### Latency + quality numbers to plan against

- OpenAI Realtime API audio-in: ~$0.06/min, audio-out: ~$0.24/min (gpt-realtime-1.5 pricing snapshot Apr 2026)
- Twilio outbound voice US: $0.014/min, inbound: $0.0085/min, recording: $0.0025/min
- Twilio local US number rental: $1.15/month
- Typical end-to-end latency Twilio Media Streams + OpenAI Realtime: 600-900ms p50
- LiveKit + Deepgram Nova-2 + Claude Sonnet 4.6: 400-600ms p50 in published benchmarks

---

## ZAO Ecosystem Integration

### Immediate ZAO Stock use cases (Oct 3 2026 event, $5-25K budget)

- Call Wallace Events on tent availability and confirm delivery window
- Ring sound/stage vendors in Ellsworth + Bangor for quotes, return structured `{vendor, quote, deliverable_date}`
- Follow up with independent artists who RSVP'd but did not confirm set times
- Confirm Franklin St Parklet permit status with Ellsworth city office
- Call Steve Peer at 430 Bayside about house-concert date alignment (ref project_steve_peer memory)

### Where this lives in ZAO OS

- New skill folder: `~/.claude/skills/agent-phone/SKILL.md` per CLAUDE.md skill pattern
- ZOE upgrade path: add to agent squad per doc 245 (ZOE Upgrade Autonomous Workflow)
- Supabase schema addition: `agent_calls` table (mirror `agent_events` log pattern in Supabase, ref `project_agent_squad_dashboard`)
- CLI entry point: `zoe call <purpose>` or Telegram command `/call` to kick off phone tasks from `project_vps_skill`

### Code paths touched

- `src/lib/agents/runner.ts` - register phone tool alongside trading tools (VAULT/BANKER/DEALER pattern)
- `src/lib/agents/types.ts` - add `PhoneCallTool` interface
- `src/app/api/agents/calls/route.ts` - new route for webhook callbacks (status, transcript)
- `community.config.ts` - add phone-agent feature flag per section "community feature flags"
- `scripts/` - Supabase migration for `agent_calls`

### Guardrails (non-negotiable per CLAUDE.md + legal memo)

- AI disclosure on every call open
- Two-party consent before record (Maine is two-party)
- No marketing, no sales, no robocalling -> matches Ring-a-Ding ToS and TCPA
- Store only summary + hashed transcript URL in Supabase, keep raw audio on Twilio/provider side with TTL
- Session check + Zod validation on every `/api/agents/calls` write per `.claude/rules/api-routes.md`

---

## Build Order (if we go DIY)

1. Pilot on Ring-a-Ding 30 days, instrument to Supabase, measure success rate per call type
2. If call volume > 50/mo or need Claude-native tool calls, buy Twilio number and stand up FastAPI or Next.js route handler based on twilio-samples repo
3. Add Deepgram or AssemblyAI STT as backup when OpenAI Realtime latency degrades
4. Wire to ZOE agent squad, log to `agent_events` dashboard
5. Only then evaluate LiveKit swap for latency wins

---

## Open Questions

- Who holds legal responsibility when ZOE calls a vendor: ZAO LLC or BetterCallZaal Strategies? (ref `project_bcz_agency`)
- Do we need a dedicated ZAO Stock outbound number for caller-ID trust?
- Can we piggy-back on existing Twilio account or create new ZAO-scoped sub-account?
- Does the Ring-a-Ding MCP server play with OpenClaw and Claude Code skill tool (Doc 234, 267)?

---

## Sources

- [Ring-a-Ding product page](https://ringading.ai)
- [Twilio: Make Outbound Calls with Python + OpenAI Realtime API + Twilio Voice](https://www.twilio.com/en-us/blog/outbound-calls-python-openai-realtime-api-voice)
- [Twilio sample: speech-assistant-openai-realtime-api-python](https://github.com/twilio-samples/speech-assistant-openai-realtime-api-python)
- [OpenAI Agents SDK Twilio extension](https://openai.github.io/openai-agents-js/extensions/twilio/)
- [AssemblyAI: How to vibe code a voice agent](https://www.assemblyai.com/blog/how-to-vibe-code-a-voice-agent)
- [Reddit r/OpenClawInstall thread (origin of the Ring-a-Ding reference)](https://www.reddit.com/r/OpenClawInstall/)
