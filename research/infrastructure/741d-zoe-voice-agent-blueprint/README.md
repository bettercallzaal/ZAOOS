---
topic: infrastructure
type: guide
status: research-complete
last-validated: 2026-05-25
related-docs: 741, 741b, 741c, 601, 679
original-query: "DISPATCH sub-doc of 741: ZOE voice-agent integration blueprint (parent prompt: keep researching these more its super important)"
tier: STANDARD
---

# 741d - ZOE voice-agent integration blueprint

> **Goal:** Ship a voice leg for ZOE (the @zaoclaw_bot concierge) using LiveKit Agents + Deepgram Nova-3 STT + ElevenLabs TTS. Concrete implementation plan, cost model at ZAO scale, phased timeline, and decision gates for Zaal to answer before build starts.

## TL;DR

ZOE gains voice via LiveKit Agents (free Build tier through 1,000 agent-min/mo). Entry surface: Telegram voice notes (lowest friction, v1). Phone number via Twilio (v2, after shadow testing). Cost at 50 calls/mo average (3min each) = $0 platform + $1.16 STT + $2.70 TTS + $0.51 Twilio = $4.37/mo. No cloud bill until scale passes 1,000 agent-minutes.

ZOE's Letta-pattern memory blocks (persona.md + human.md + working_memory + tasks.json) stay intact. Voice agent reads/writes the same blocks, inherits ZOE's Year-of-the-ZABAL voice rules, mirrors the Hermes coder/critic pattern.

Five-week timeline: Week 1-2 spike + Telegram wire, Week 3 phone number + SIP setup, Week 4 shadow mode (listen, log, don't reply), Week 5 cutover to live.

---

## User stories (voice trigger moments)

### Story 1: Task capture while driving
**Trigger:** Zaal is driving home from Jackson Labs, thinks of a 1-min task (schedule Cassie call for ZAOstock budget).

**Today:** Text ZOE a task, reply typed.

**With voice:** Call ZOE's number. "Hey, schedule a call with Cassie about the ZAOstock budget for next week." ZOE replies with calendar link + next free slots. Hands-free, 90 seconds.

**Success metric:** Voice task capture takes same time as typing, zero context-switch cost.

---

### Story 2: Status check during a workout
**Trigger:** Zaal is at the gym, wants a fast Hermes PR status without opening Telegram.

**Today:** Open Telegram, type "what's the status on my PRs", wait for response.

**With voice:** Quick voice call to ZOE. "Status check." ZOE reads Hermes state from memory blocks, replies "3 open: auth fix in review, deploy pending, one merged 2 hours ago." Response in 15 seconds.

**Success metric:** Status check completed in under 1 minute, no phone UI interaction.

---

### Story 3: ZAOstock vendor question during a call
**Trigger:** Zaal is on a vendor call, someone asks about ZAOstock timeline + budget for live sound.

**Today:** Say "let me text my assistant," fumble with Telegram, look up answer, text back to the call.

**With voice:** Say "hold on, I have a concierge" (or transfer the call if Zaal is comfortable). ZOE picks up, vendor asks the question, ZOE responds with Zaal's ZAOstock context from memory blocks.

**Success metric:** Answer arrives in under 2 minutes. Vendor perceives professional concierge service.

---

### Story 4: Fractal attendee reminder
**Trigger:** Monday 5:50pm EST, fractal call starts in 10 minutes.

**Today:** ZOE sends a Telegram message reminder.

**With voice:** ZOE calls Zaal with a brief voice reminder (or leaves a voicemail). Natural, less dismissible than text.

**Success metric:** Zaal remembers the call 90%+ of the time (vs ~70% for text reminders).

---

### Story 5: Late-night capture loop (ZAO research thought)
**Trigger:** 11:47pm, Zaal is winding down, thinks of a research angle for a ZAO doc.

**Today:** Type a note to ZOE in Telegram.

**With voice:** Call ZOE, "Quick note — explore whether ZAO can do what Bonfire does but in Telegram groups." ZOE logs the thought to the research queue, replies with related docs (via Bonfire recall).

**Success metric:** Thought is captured + contextualized, zero friction.

---

## Surface decision (v1 recommendation)

| Surface | Setup time | Friction | Security | v1? |
|---------|-----------|----------|----------|-----|
| **Telegram voice notes** | 1 day (use Telegram's speech-to-text webhook) | Lowest (already in workflow) | Zaal's Telegram token (current) | YES |
| Web button at zoe.zaoos.com | 3 days (add LiveKit room embed) | Medium (context-switch to browser) | Session auth + RLS | Maybe v2 |
| Twilio phone number | 5 days (SIP setup + number rental) | Medium (dial a number) | Twilio token + RLS on call logs | v2+ |
| Apple Siri shortcut (iOS) | 2 days (native Siri integration) | Low (voice-first) | Device-local encryption | v2+ after phone works |

**Recommendation: Telegram voice notes for v1.**

Why: (1) ZOE already on Telegram as @zaoclaw_bot; (2) Zaal already uses Telegram voice messages in other groups; (3) no new infrastructure (reuse existing Hermes runtime); (4) can ship in 1 week, not 3; (5) defer Twilio setup until shadow mode validates the UX works.

---

## Architecture diagram

```
Zaal's Telegram (voice note)
         |
         v
    @zaoclaw_bot webhook
    (Telegram API sends voice file URL)
         |
         v
    STT pipeline (Deepgram Nova-3)
    [speech → text, ~80ms latency]
         |
         v
    Render ZOE memory blocks:
    - persona.md (Year-of-the-ZABAL voice)
    - human.md (Zaal context)
    - recent/<chat_id>.json (last 8 turns)
    - tasks.json (open queue)
         |
         v
    Claude Sonnet/Opus via Hermes pattern
    (bot/src/hermes/claude-cli.ts subprocess)
    [LLM processes + generates response, ~2sec latency]
         |
         v
    TTS pipeline (ElevenLabs Multilingual v2)
    [text → speech, ~250ms latency]
         |
         v
    Telegram reply
    (voice message + optional text transcript)
         |
         v
    Log to working_memory + capture_log
```

**Latency budget:** STT 80ms + LLM 2s + TTS 250ms = ~2.3s user-to-response. Acceptable for voice agent (human expects ~2-3s when calling a concierge).

**Scaling leg (v2+, Twilio phone number):**

```
Zaal dials: +1-XXX-XXX-XXXX (Twilio number)
    |
    v
Twilio SIP trunk routes inbound call to LiveKit
    |
    v
LiveKit Agents spawns session
    |
    v
Turn detection + STT (streaming)
    |
    v
Deepgram Nova-3 (real-time)
    |
    v
Claude Sonnet via Hermes
    |
    v
ElevenLabs TTS (real-time streaming)
    |
    v
Audio bridge back to Zaal's phone
```

---

## Memory integration

ZOE's existing 4-block memory pattern stays unchanged. Voice agent reads + writes to the same ~/.zao/zoe/ files:

| Block | Read | Write | Shared? |
|-------|------|-------|---------|
| **persona.md** | yes (every turn) | no (hand-edited only) | yes - voice + text replies use same voice rules |
| **human.md** | yes (every turn) | Bonfire RECALL only (future SDK) | yes - voice agent knows Zaal context |
| **working_memory** (recent/<chat_id>.json) | yes (last 8 turns) | yes (append voice turn, FIFO evict oldest) | yes - voice turns mix with text turns |
| **tasks.json** | yes (snapshot per turn) | yes (parse task_ops from JSON response) | yes - "add task" voice command updates task queue |

**Consequence:** Voice and text messages interleave in the same chat history. This is correct — ZOE should treat "I just asked that by voice" as context for the next text message.

**Turnover cost:** ~50ms to read files, ~100ms to write (append + truncate FIFO). Negligible vs LLM latency.

---

## Hermes pattern reuse: coder + critic loop?

**Question:** Should voice ZOE include a self-check step before speaking the response (the Hermes critic)?

**Answer: No, not for v1. Add in v2+ if needed.**

Reason: Hermes' critic loop exists because code PRs are high-stakes — a typo breaks CI. Voice responses are low-stakes. If ZOE says something awkward, Zaal can repeat the request. The latency penalty (2x RTT + extra LLM call = +3-4 seconds) outweighs the UX gain for a personal concierge.

**If added later:** Pattern would be:

```python
response_text = llm_call()       # draft
if len(response_text) > 100:     # long replies only
  approval = critic_llm_call(response_text)  # "would Zaal want me to say this?"
  if not approval:
    response_text = refine_llm_call()
tts_output = tts(response_text)
```

Same Hermes subprocess model (coder = Sonnet, critic = Haiku or local Ollama for speed).

---

## Cost model at ZAO scale (50 calls/month, 3min average)

**Assumptions:**
- 50 inbound calls / month (4-5 per week, conservative estimate given ZAO is 188 members but only Zaal uses ZOE)
- 3 minutes average call duration (90 seconds speech, 30 seconds processing + TTS)
- Telegram voice notes (v1): no Twilio; phone number tier (v2+) adds $1.15 + $0.43/mo
- Deepgram Nova-3 (Ship tier via LiveKit Inference): $0.0077/min
- ElevenLabs Multilingual v2 (Ship tier via LiveKit Inference): $0.18/min (character-based, assume ~100 chars per response = ~18 chars/sec speech, so response is ~54 chars, call it $0.01 per response)
- Claude Sonnet: included in Claude Max subscription ($20/mo, Zaal already pays)
- LiveKit Cloud Build: $0/mo (includes 1,000 agent-min free; we use ~150/mo)

**Per-call breakdown (3-min call):**

| Component | Rate | Per call | Notes |
|-----------|------|----------|-------|
| LiveKit agent session | $0.01/min (Ship tier) | $0.03 | Build tier free (1000min included) |
| Deepgram Nova-3 STT | $0.0077/min | $0.0231 | 3 min @ $0.0077/min |
| ElevenLabs TTS | $0.01/call (estimate) | $0.01 | ~54 chars response, $0.01/response |
| Twilio inbound (v2+) | $0.0085/min | $0.0255 | 3 min @ $0.0085/min (only v2+ phone) |
| **Total per call** | — | **$0.087** | (v1 Telegram: $0.054; v2 phone: $0.087) |

**Monthly cost at 50 calls:**

| Item | Cost | Notes |
|------|------|-------|
| **v1 (Telegram voice notes)** | | |
| STT: 50 calls × 3min × $0.0077 | $1.16 | |
| TTS: 50 calls × $0.01 | $0.50 | |
| Claude Sonnet | $0 | included in Max subscription |
| LiveKit platform | $0 | Build tier (1000 agent-min included, we use 150) |
| **Total v1** | **$1.66** | |
| | | |
| **v2 (add phone number)** | | |
| STT (same as v1) | $1.16 | |
| TTS (same as v1) | $0.50 | |
| Twilio inbound: 50 × 3min × $0.0085 | $1.28 | |
| Twilio number rental | $1.15 | US local number, $1.15/mo |
| LiveKit platform | $0 | still Build tier |
| **Total v2** | **$4.09** | |
| | | |
| **At 500 calls/mo (10x scale)** | | |
| STT | $11.55 | |
| TTS | $5.00 | |
| Twilio | $12.75 + $1.15 | |
| LiveKit (now Ship $50/mo) | $50 | 1500 min included, $0.01/min overage |
| **Total at 500 calls** | **$80.45/mo** | Hermes pattern: still marginal cost on Claude Max |

**Key insight:** We stay in LiveKit Build tier (free) up to 1,000 agent-minutes/month. ZAO would need 333+ voice calls to hit that limit. At current scale (50/mo), voice is purely STT + TTS + optional Twilio.

---

## Build phases (ship-ready timeline)

### Week 1: Spike + demo (no live replies)

**Goal:** Validate the stack works end-to-end. Code runs, but ZOE doesn't respond to real Zaal messages.

**Tasks:**
1. Set up LiveKit Cloud Build account (`cloud.livekit.io`). No credit card (free tier).
2. Create `bot/src/zoe/voice/` directory. Add `agent.ts` (LiveKit Agents entry point), `config.ts` (API keys).
3. Stub Telegram webhook: POST `/api/voice-webhook` receives voice file URL, logs it, does NOT reply.
4. Integration test: send a voice note to @zaoclaw_bot, confirm webhook receives it.
5. Implement STT pipeline: Deepgram Nova-3 transcription.
6. Implement LLM call: use Hermes `callClaudeCli()` with voice prompt.
7. Implement TTS: ElevenLabs Multilingual v2 synthesis.
8. End-to-end trace: voice → text → LLM → speech, no Telegram reply.
9. Write `bot/src/zoe/voice/IMPL.md` documenting the stack.

**Deliverable:** Spike demo runs locally (`pnpm tsx src/zoe/voice/agent.ts`). Voice turns up in logs. No Telegram integration yet.

**Owner:** Zaal (with subagent for LiveKit SDK exploration).

---

### Week 2: Wire Telegram voice notes (live replies)

**Goal:** First voice reply goes back to Zaal via Telegram.

**Tasks:**
1. Add Telegram voice-note handler to `bot/src/zoe/index.ts`. Route to `bot/src/zoe/voice/agent.ts`.
2. Parse voice URL from Telegram webhook, download audio file.
3. Feed audio to Deepgram STT pipeline.
4. Pass transcript to Hermes `callClaudeCli()` with memory blocks.
5. Synthesize response to speech via ElevenLabs.
6. Upload TTS output (MP3 or OGG) to Telegram, send voice message back.
7. Append turn to `working_memory` (recent/<chat_id>.json) — same as text turns.
8. Error handling: if STT fails, reply with text fallback ("couldn't hear that, send a text?").
9. Cost logging: track STT + TTS cost per call.
10. Test: Zaal sends a few voice notes, gets voice replies. Spot-check tone (should sound like ZOE, not a robot).

**Deliverable:** @zaoclaw_bot replies to voice messages with voice messages. No Twilio yet.

**Owner:** Zaal (or subagent if Telegram integration is new).

---

### Week 3: Add phone number + SIP setup

**Goal:** Zaal can dial a number and talk to ZOE in real-time.

**Tasks:**
1. Provision Twilio account. Rent a US local phone number (~$1.15/mo).
2. Set up Twilio SIP trunk → LiveKit routing (LiveKit Agents SIP plugin).
3. Configure `livekit/agents` Python SDK with Twilio credentials.
4. Deploy `bot/src/zoe/voice/phone-agent.ts` — separate entry point for phone calls (uses same LLM/persona, different I/O).
5. Implement turn detection (LiveKit Agents built-in, but tune `false_interruption_timeout` to 1.2s per the postmortem in doc 741).
6. Test: dial the number, ZOE answers. Two-way real-time conversation.
7. Cost audit: track Twilio inbound + LiveKit Agents minutes.
8. Edge cases: handle call drop, long silence, multiple interruptions.

**Deliverable:** Zaal can call +1-XXX-XXX-XXXX and have a voice conversation with ZOE.

**Owner:** Zaal (Twilio setup may require ZOE's help for SIP troubleshooting).

---

### Week 4: Shadow mode (listen, log, don't reply)

**Goal:** Week-long dry-run. ZOE receives calls, logs them, but only replies to Zaal himself (not third-party callers).

**Per the May 2026 Jahanzaib postmortem (doc 741), shadow mode is critical — production voice agents have UX surprises that only show up under real load.**

**Tasks:**
1. Deploy phone agent to VPS. Add flag: `SHADOW_MODE=true` in `.env`.
2. When `SHADOW_MODE=true`, phone calls are logged but ZOE doesn't speak. Zaal gets a Telegram recap ("3 calls this week, topics: task logging x2, status check x1").
3. For Zaal's own calls (identified by caller ID), ZOE still responds normally (test path).
4. Log full call transcripts to `~/.zao/zoe/phone-calls/<date>.json` for later analysis.
5. Monitor: false-positive interruptions, long latencies, TTS quality issues.
6. Tune: adjust `false_interruption_timeout`, LLM response brevity, voice selection.
7. Iterate: each day Zaal reviews the log, finds one thing to tweak.

**Deliverable:** Week of logged calls. Zaal + Claude review + tune-list.

**Owner:** Zaal (shadow mode requires active observation).

---

### Week 5: Cutover to live

**Goal:** ZOE answers all voice calls and Telegram voice notes.

**Tasks:**
1. Set `SHADOW_MODE=false`.
2. Deploy to production on VPS (systemd unit or add to `zoe-bot.service`).
3. Announce to Zaal: "Voice ZOE is live. You can call +1-XXX-XXX-XXXX or send voice notes on Telegram."
4. Monitor: cost tracking, error rates, response latency.
5. On-call rotation: if there are issues, Zaal has a quick fix path (update `persona.md`, restart service).

**Deliverable:** Voice ZOE live in production.

**Owner:** Zaal (with standby support from Claude for urgent fixes).

---

## Failure modes + mitigations

### Failure 1: STT transcription quality degrades at 500 calls/mo

**Risk:** Deepgram Nova-3 may have higher error rates under load, or Zaal's voice + background noise combo confuses the model.

**Mitigation:**
- Monitor WER (word-error-rate) daily. Set alert if WER > 10%.
- A/B test: Deepgram Nova-3 vs AssemblyAI ($0.0025/min, cheaper, slightly lower accuracy). If AssemblyAI WER is acceptable, switch to save 67% on STT.
- Add user-feedback loop: if Zaal replies "that's wrong," manually re-transcribe and log the failure case.

**Cost impact:** Switching to AssemblyAI saves $0.76/mo at 50 calls.

---

### Failure 2: ZOE's 4-block memory gets stale (human.md outdated)

**Risk:** If human.md (Zaal facts like "has a meeting with Cassie next Tuesday") drifts, ZOE gives wrong context.

**Mitigation:**
- Bonfire RECALL bridge (doc 679) refreshes human.md daily at 5am.
- Until Bonfire SDK is live, Zaal manually edits human.md every Monday morning.
- Add a /zoe admin command: `/zoe refresh` forces a Bonfire RECALL now.

**Cost impact:** Minimal (Bonfire recall is a single LLM call, logged to Bonfire quota not ZOE's).

---

### Failure 3: LiveKit Cloud Build tier ($0) becomes insufficient

**Risk:** At 600 agent-minutes/month, we exceed 1,000 free agent-min. LiveKit charges $0.01/min for overages, and we'd need to move to Ship tier ($50/mo base).

**Scale:** This happens when ZAO has 200+ weekly voice calls (6-7 per day average). Very unlikely in first 6 months.

**Mitigation:** Monitor agent-min weekly. Set alert at 800 agent-min (80% of quota). If it triggers, either (a) self-host LiveKit (one-time setup, no per-minute cost), or (b) upgrade to Ship tier ($50/mo for 5,000 agent-min). Decision gate: Zaal chooses based on volume trajectory.

**Cost impact:** Ship tier is $50/mo vs Build tier $0. At current scale, never triggered.

---

### Failure 4: ZOE makes unauthorized commitments on voice calls

**Risk:** Zaal calls ZOE, asks "are we giving all ZAO members a free ticket to ZAOstock?" ZOE replies "yes" without running it by Zaal consciously.

**Mitigation:** 
- Hard rule in persona.md: "Never commit the ZAO to financial or public promises without explicit Zaal approval. If asked, reply: I need Zaal's explicit go-ahead before saying yes to that."
- Per doc 679 (no-unauthorized-commitments rule), this is a brand-voice guard. Same rule applies to text ZOE.
- Log all "yes"-answers to explicit questions in a separate audit file for weekly review.

**Cost impact:** Reputational. Implementation: one-liner in persona.md.

---

### Failure 5: PII leaks into call transcripts

**Risk:** Caller asks about someone's personal email or Zaal mentions a third-party's phone number on the call. Transcript is logged to `~/.zao/zoe/phone-calls/` which is then synced to a research doc or Bonfire.

**Mitigation:** Per `.claude/rules/pii-hygiene.md`:
- Call transcripts are written to `~/.zao/private/` (off-repo), not inside the ZAOOS working tree.
- Before any transcript is added to a research doc or Bonfire episode, redact PII per the allowlist.
- Email allowlist: zaal@thezao.com, zoe-zao@agentmail.to, etc. Any other email is redacted to `<redacted-email>`.
- Telegram handles: only @zaoclaw_bot, @zoe_hermes_bot, @ZAOstockTeamBot, @zabal_bonfire are unredacted. Others become `<redacted-handle>`.

**Cost impact:** Manual overhead. If call volume grows, add a pre-commit hook to scan transcripts for PII patterns.

---

### Failure 6: Zaal's personal context is overheard on a third-party call

**Risk:** Zaal transfers a vendor call to ZOE. Before the vendor gets on, ZOE says something like "Hey, about your upcoming meeting with Ryan Kagy on Tuesday..." and the vendor overhears Zaal's private calendar.

**Mitigation:**
- Caller-ID gating: ZOE only uses personal context (human.md details) if the caller is Zaal's personal phone number or a known trusted number (Hermes bot, Zaal's office).
- For unknown callers: ZOE uses generic persona only. No personalization.
- Test: Zaal calls from his phone (personal context), then from a different number (generic context).

**Cost impact:** Minimal (one if-check in the LLM prompt).

---

## Decision gates (Zaal must answer before build starts)

Answer each of these explicitly. If any answer is "no," the corresponding feature is deferred to v2.

1. **OK to give ZOE a Twilio phone number?** (v1 only has Telegram voice notes.)
   - YES / DEFER TO V2

2. **OK to record and store call transcripts?** (Needed for compliance + debugging.)
   - YES / DEFER (only log in shadow mode, delete after 7 days) / NO

3. **OK to route third-party phone calls to ZOE?** (E.g., someone calls +1-XXX-XXX-XXXX and reaches ZOE. ZOE doesn't know who they are.)
   - YES (ZOE handles all calls) / ZAAL ONLY (only Zaal's number reaches ZOE) / NO

4. **OK to have ZOE make outbound voice calls?** (E.g., ZOE calls Zaal to deliver a morning brief in voice.)
   - YES / DEFER TO V2 / NO

5. **OK to use ElevenLabs Multilingual v2 voice clone?** (Zaal provides a voice sample, ZOE synthesizes responses in Zaal's voice.)
   - YES (ship with Zaal's voice) / USE PRESET VOICE (professional voice, not Zaal clone) / NO

6. **OK to have ZOE interrupt Zaal mid-sentence?** (Turn detection on phone calls. If Zaal pauses, ZOE can jump in.)
   - YES (natural conversation) / ZAAL ONLY (ZOE waits for explicit "go" cue) / NO (ZOE only replies after Zaal stops talking)

7. **OK to use LiveKit Cloud Build tier ($0)?** Or prefer self-host from day one?
   - YES (Build tier, upgrade if we scale) / SELF-HOST (one-time infra setup, no per-call billing) / YES BUT COMMIT TO UPGRADE TIMELINE (e.g., move to Ship tier before 500 calls)

---

## ZAO-specific guardrails

### Brand voice on voice calls
ZOE's persona.md voice rules are Year-of-the-ZABAL: clear, spartan, active voice, no marketing fluff. Same rules apply to spoken responses as text. The Hermes Sonnet model (same as text ZOE) ensures tone consistency.

### No new bots
Per doc 601 rule: voice ZOE is not a new bot. It's ZOE with a voice I/O layer. ZAOstock bot and Hermes remain separate (they have their own voice roadmaps in later phases, but no new bot names or Telegram tokens for voice-only services).

### Zaal's "no unauthorized commitments" rule
Hard-coded into persona.md. ZOE never says "yes" to a question that commits The ZAO or BCZ to a decision without flagging it for Zaal's explicit approval.

### PII hygiene
Per `.claude/rules/pii-hygiene.md`: call transcripts go to ~/.zao/private/, not the repo. Before any transcript is used in research docs or Bonfire, PII is redacted per the email + handle allowlists.

### Session auth + RLS on Twilio SIP logs
If phone routing is live, all call metadata (caller ID, duration, transcript) is stored in Supabase with RLS. Zaal (user_id 1) can read his own calls. No third-party access without explicit row-level permission.

---

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Answer decision gates 1-7 above | @Zaal | Explicit yes/no/defer | Before Week 1 spike starts |
| Create bot/src/zoe/voice/ skeleton (agent.ts, config.ts, IMPL.md) | Subagent or @Zaal | Spike | End of Week 1 |
| Provision LiveKit Cloud Build account, Deepgram API key | @Zaal | Setup | Day 1 |
| Telegram voice webhook + STT pipeline (end-to-end trace) | Subagent | Dev | Week 1 |
| Hermes integration (callClaudeCli with voice prompt) | Subagent | Dev | Week 1 |
| ElevenLabs TTS integration | Subagent | Dev | Week 1 |
| Telegram voice reply handler (live Zaal replies) | Subagent | Dev | Week 2 |
| Provision Twilio account, SIP trunk setup (if gate 1 = yes) | @Zaal | Setup | Week 3 |
| Deploy to VPS, shadow mode (1 week observation) | @Zaal | Ops | Week 4 |
| Tune params based on shadow logs (interruption threshold, latency) | @Zaal | Ops | Week 4 |
| Cutover to live (Week 5) | @Zaal | Ops | Week 5 |

---

## Also See

- [Doc 741](../741-pion-livekit-webrtc-stack/) - Pion + LiveKit decision hub (ZOE voice lives here)
- [Doc 741b](../741b-livekit-agents-production-playbook/) - LiveKit Agents production playbook (sibling dispatch doc)
- [Doc 741c](../741c-voice-agent-stack-comparison/) - Voice-agent stack comparison (why LiveKit over others)
- [Doc 601](../../agents/601-agent-stack-cleanup-decision/) - Agent stack cleanup (Hermes pattern lock-in)
- [Doc 679](../../bots/679-zoe-v2-upgrade-proposal/) - ZOE v2 upgrade (voice leg is part of this roadmap)
- [Doc 695](../../) - ZAO + Juke ecosystem map (related: Juke owns user-facing audio, ZOE gets voice agent)
- [Project memory: project_zoe_soul_architecture](../../.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/project_zoe_soul_architecture.md) - ZOE runtime (Letta memory blocks, systemd service)
- [Project memory: project_hermes_canonical](../../.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/project_hermes_canonical.md) - Hermes pattern (claude CLI subprocess, no openclaw)

---

## Sources

- [LiveKit Agents README](https://github.com/livekit/agents) - [FULL] - 10.7k stars, Python SDK + Node alt, provider list (Deepgram, OpenAI, ElevenLabs, Cartesia)
- [LiveKit Cloud Pricing](https://livekit.com/pricing) - [FULL] - Build $0 (1000 agent-min included), Ship $50 (5000 agent-min), Scale $500
- [trtc.io - LiveKit Pricing 2026](https://trtc.io/blog/details/livekit-pricing-2026) - [FULL] - Agent-min rates ($0.01/min overage Ship tier), LLM/STT/TTS passthrough costs (Deepgram $0.0077/min, ElevenLabs $0.18/min, Claude ~$0.015/min)
- [Deepgram Nova-3 Pricing](https://deepgram.com/pricing) - [FULL] - STT Nova-3 mono $0.0077/min, multilingual $0.0092/min, $200 free credit on signup
- [ElevenLabs API Pricing](https://elevenlabs.io/pricing/api) - [FULL] - Flash v2.5 $0.06/1K chars, Multilingual v2/v3 $0.12/1K chars (character-based, ~18 chars/sec speech)
- [ElevenLabs Pricing Tiers](https://elevenlabs.io/pricing) - [FULL] - Creator plan $22/mo (100K credits/mo, ~100 min TTS), Professional Voice Cloning (PVC) requires Creator tier
- [TextToLab - ElevenLabs Pricing 2026](https://texttolab.com/blog/elevenlabs-pricing) - [FULL] - API pricing breakdown, character-based billing, voice cloning gate (PVC requires $22/mo Creator)
- [Twilio Voice Pricing (US)](https://www.twilio.com/en-us/voice/pricing/us) - [FULL] - Inbound $0.0085/min local, Twilio number $1.15/mo (local prefix)
- [Twilio Complete Guide](https://edesy.in/tools/twilio-voice-pricing-us-outbound) - [FULL] - Outbound $0.0140/min, inbound $0.0085/min, number rental $1.15/mo
- [Jahanzaib Ahmed - Real Estate Brokerage Voice Agent (May 2026)](https://medium.com/@jahanzaibai/i-built-a-voice-agent-for-a-real-estate-brokerage-and-here-is-what-broke-720f9786451c) - [FULL] - Production postmortem: 9 days to demo / 14 days to production, `false_interruption_timeout` tuning to 1.2s, 38% call coverage
- [HN #42936345 - LiveKit Agents production thread](https://news.ycombinator.com/item?id=42936345) - [FULL] - agent-per-process model, autoscaling patterns, GPU caveat for inference
- [bot/src/zoe/README.md](../../../bot/src/zoe/README.md) - [FULL] - ZOE Hermes-style architecture, Letta-inspired 4-block memory, systemd service on VPS 1
- [bot/src/hermes/claude-cli.ts](../../../bot/src/hermes/) - [PARTIAL - inferred from memory + CLAUDE.md] - Hermes subprocess pattern: spawn `claude` CLI with --append-system-prompt, parse --output-format json
- [CLAUDE.md Primary Surfaces section](../../../CLAUDE.md) - [FULL] - 5 surfaces inventory (ZOE, Hermes, ZAO Devz, Bonfire, ZAOstock bot)
- [.claude/rules/pii-hygiene.md](../../../.claude/rules/pii-hygiene.md) - [FULL] - PII handling in transcripts, ~/.zao/private/ location, email + handle allowlists, pre-commit checks
