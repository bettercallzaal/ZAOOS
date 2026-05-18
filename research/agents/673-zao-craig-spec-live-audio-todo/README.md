---
topic: agents
type: spec
status: research-complete
last-validated: 2026-05-18
related-docs: 247, 464, 474, 605d, 670, 671, 672
tier: STANDARD
---

# 673 - ZAO Craig Spec (live audio -> todo bot)

> **Goal:** Replace the current 5-step voice-memo flow (record - download - upload - transcribe - paste) with a one-step live-capture bot. User sends a voice message or starts a live recording, ZAO Craig transcribes, extracts action items, and writes them to the cowork-zaodevz action tracker. Doc 670 seeded this; doc 671 Phase 3 informs the architecture; doc 672 P3.5 unblocks the integration.

## Key Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Standalone bot @ZAOcraigBot, not a feature of @ZAOcoworkingBot** | Separation of concerns - Craig is a transcription pipeline, coworking is a task tracker. Different deps (audio libs), different update cadence, can graduate to own repo cleanly per [[project_zaoos_monorepo_as_lab]]. |
| 2 | **Input modes (priority order)** | v1.0: forwarded Telegram voice messages (easiest, grammy has built-in support). v1.1: macOS Shortcut + iOS Shortcuts upload (5-second push from any audio source). v2.0 (DEFERRED): live Telegram voice chat audio - requires TDLib/MTProto, not Bot API. |
| 3 | **Transcription: Whisper.cpp local on VPS for short clips, OpenAI Whisper API fallback for long-form** | Whisper.cpp on the existing VPS is $0/turn for clips under ~2 min (which is 95% of voice memos). Whisper API costs $0.006/min - cheap enough for the 5% edge case (30-min calls). Cost ceiling ~$2/month even with daily use. |
| 4 | **Owner detection v1: LLM-guess from transcript context** | Most captures are 1-2 voices Zaal already knows (himself + Iman). LLM-as-classifier is good enough for 2-speaker. Upgrade to pyannote.audio diarization in v2 only if Zaal hits multi-speaker confusion. |
| 5 | **Action emission: direct Anthropic API with `tool_choice: {type: "any"}`** | Builds on doc 671 Phase 3 architecture. Forces the LLM to emit ONLY tool calls (no narrated preamble), which is what we want from a transcription pipeline. Single `create_action_item` tool with strict schema. |
| 6 | **Writes go to cowork-zaodevz via HTTP API, not direct Octokit** | Per [[doc 672]] P3.5 - the cowork-zaodevz tracker is the single source of truth. Multiple bots (Craig, Hermes, ZOE) should write through a thin REST surface, NOT each maintain their own Octokit credentials + SHA dance. **This is a prerequisite for ZAO Craig.** |
| 7 | **Privacy: explicit "recording captured" prefix + 24h auto-delete of raw audio** | When Craig receives a voice, reply within 2 seconds: `[CAPTURED] transcribing 0:32 audio from <user>...`. After processing, the raw audio is deleted from disk (transcript kept). No always-on listening, no background capture. |
| 8 | **Consent model: 1-time per allowlisted user, persistent** | First voice message from a roster member gets `consent prompt - reply "yes I consent" to enable audio capture going forward`. Stored as `consented_at` in user prefs. Aligns with the team's existing roster (Zaal/Iman/ThyRev/Samantha) - no new opt-in needed beyond that. |

## Architecture

### High-Level Flow

```
[user] ---voice message---> [Telegram]
                                 |
                                 v
                       [@ZAOcraigBot grammy poll]
                                 |
                                 v
              ┌──────────────────┴──────────────────┐
              |  1. Download audio file (TG API)    |
              |  2. Transcribe (Whisper local/API)  |
              |  3. Extract actions (Anthropic API  |
              |     with tool_choice: any)          |
              |  4. POST each action to cowork API  |
              |  5. Reply summary + item IDs        |
              |  6. Delete raw audio file           |
              └─────────────────────────────────────┘
                                 |
                                 v
                     [cowork-zaodevz /api/v1/items]
                                 |
                                 v
                       [data/actions.json on GitHub]
```

### Components

- **@ZAOcraigBot** - separate Telegram bot, separate repo (`bettercallzaal/zao-craig` or stays in `songchaindao-dot/cowork-zaodevz` as a sibling to `agent/` - decision needed)
- **Whisper.cpp** - compiled locally on VPS 1. Already battle-tested, ~5x realtime on the box's CPU. Models: `ggml-base.en.bin` (74 MB, fast) for English, `ggml-small.en.bin` (244 MB) if accuracy lags
- **Anthropic SDK** - direct API, paid via Zaal's key (NOT Claude Max CLI subprocess - per doc 671 Phase 3 rationale: tool_choice + zero-tool-leak surface)
- **cowork-zaodevz REST API** - new addition required FIRST. Bearer-auth `/api/v1/items` POST endpoint
- **systemd user unit** - `zao-craig.service`, mirrors `zaocoworking-bot.service` layout on VPS

### File Layout (proposed)

```
zao-craig/
├── agent/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── src/
│       ├── index.ts                 # grammy entry
│       ├── audio.ts                 # download + Whisper wrapper
│       ├── transcribe.ts            # local-vs-API routing
│       ├── extract.ts               # Anthropic API + tool_choice
│       ├── cowork-client.ts         # HTTP wrapper for cowork API
│       ├── consent.ts               # one-time consent storage
│       └── types.ts
└── README.md
```

## Pipeline (Detailed)

### Step 1 - Receive

```typescript
bot.on('message:voice', async (ctx) => {
  if (!(await isAllowedSender(ctx))) return;
  if (!(await hasConsented(ctx.from.id))) return askForConsent(ctx);
  await ctx.reply(`[CAPTURED] transcribing ${ctx.message.voice.duration}s audio...`);
  const fileId = ctx.message.voice.file_id;
  // ... download + process
});
```

### Step 2 - Transcribe

Route by duration:
- Under 120 seconds: `whisper.cpp` local. Spawn subprocess, ~5-15s for 1min audio.
- 120 seconds and up: OpenAI Whisper API (`whisper-1`). Faster for long files, $0.006/min.

Output: plain text transcript + (optional) word-level timestamps.

### Step 3 - Extract actions

```typescript
const tools: Anthropic.Tool[] = [{
  name: 'create_action_items',
  description: 'Emit zero or more action items extracted from the transcript.',
  input_schema: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Action verb + object, e.g. "ship v2.13 to VPS"' },
            owner: { type: 'string', enum: ['Zaal','Iman','ThyRev','Samantha','Both','Open'] },
            due: { type: 'string', description: 'YYYY-MM-DD or empty' },
            notes: { type: 'string', description: 'context from the transcript' },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
          },
          required: ['title','owner','confidence'],
        }
      }
    },
    required: ['items']
  }
}];

const resp = await anthropic.messages.create({
  model: 'claude-opus-4-7',
  max_tokens: 2048,
  system: PERSONA,
  messages: [{ role: 'user', content: `Transcript from ${speakerLabel}:\n\n${transcript}` }],
  tools,
  tool_choice: { type: 'tool', name: 'create_action_items' },
});
```

The `tool_choice: {type: 'tool', name: ...}` is a STRONGER constraint than `{type: 'any'}` - forces this exact tool. Per doc 671 verification, the model cannot emit prose before/after the tool call.

### Step 4 - Write to cowork-zaodevz

```typescript
for (const item of suggestedItems) {
  if (item.confidence < 0.5) {
    queueForReview(item); // low-confidence -> ask user before writing
    continue;
  }
  await coworkClient.createItem({
    title: item.title,
    owner: item.owner,
    due: item.due,
    notes: `[ZAO Craig ${captureId}] ${item.notes}`,
    createdBy: senderDisplayName,
  });
}
```

### Step 5 - Reply

```
[CAPTURED] 1:23 audio from Zaal
transcribed (12 lines)

added 3 items:
  #26 (Iman) review the RSVPizza repo
  #27 (Zaal) ship Craig v1 spec to VPS
  #28 (Both) cohost ZABAL Games drop Wednesday

flagged 1 low-confidence (reply "yes" to add):
  ?? (?)  "...maybe we should also do that flyer thing"

transcript: <link to git-tracked transcript file>
```

### Step 6 - Cleanup

Raw audio file deleted from VPS disk. Transcript pushed to `cowork-zaodevz/data/transcripts/<date>-<sender>-<captureId>.md` via Octokit (audit trail + searchable via grep). Optional: also embed for future RAG per doc 474 patterns.

## Build Phases

| Phase | Effort | Output | Blockers |
|-------|--------|--------|----------|
| **P0 - cowork-zaodevz REST API** | 4-6 hr | `POST /api/v1/items` + bearer auth via `HERMES_API_KEY` env. Webhook out optional. | None - prerequisite for Craig + Hermes integration per doc 672 P3.5. |
| **P1 - Craig v1.0 (TG voice forward)** | 6-8 hr | @ZAOcraigBot live on VPS. Whisper local, Anthropic API extract, posts to cowork API. | P0. Anthropic API key (Zaal's existing). |
| **P2 - macOS / iOS Shortcut** | 2-3 hr | Native share-sheet target on Mac + iPhone. Tap "share to Craig" from any voice memo, recording, or call. | P1. |
| **P3 - low-confidence review flow** | 2 hr | Items below threshold get queued, bot DMs Zaal a button to confirm/reject. | P1. |
| **P4 - diarization (multi-speaker)** | 6-10 hr | pyannote.audio adds speaker labels to transcripts. Useful when more than 2 voices. | P1. Models hit ~2GB disk. |
| **P5 - live TG voice chat capture** | 15-20 hr | TDLib client (not Bot API) joins a voice chat, records, processes in 30-second windows. | P4. Major scope - decide if Zaal actually wants it before building. |

P0 + P1 + P2 = realistically ~12-15 hours total. Single sprint.

## Open Decisions (Block These Before Coding)

| # | Decision | Options | Default |
|---|----------|---------|---------|
| A | **REST API on cowork-zaodevz first, or stub backend for Craig?** | (a) Build /api/v1/items first (P0), then Craig integrates. (b) Craig writes Octokit directly, refactor later. | **(a) - clean architecture; doc 672 P3.5 already flags the API gap. Hermes will use it too.** |
| B | **Bot username** | `@ZAOcraigBot`, `@zao_craig_bot`, `@zaocraig`. | `@ZAOcraigBot` - matches `@ZAOcoworkingBot` casing. Verify availability on BotFather. |
| C | **Repo location** | (a) New `bettercallzaal/zao-craig` repo. (b) Add to `songchaindao-dot/cowork-zaodevz` as sibling to agent/. (c) Add as a sibling in ZAOOS `bot/` directory. | **(a) - matches the per-bot-per-repo pattern; clean graduation per ZAOOS lab model.** |
| D | **Raw audio retention** | (a) Delete immediately after transcript. (b) Keep 24h then delete. (c) Keep indefinitely on encrypted disk. | **(b) - 24h window for debug if something goes wrong, then delete.** |
| E | **Anthropic key vs Claude Max CLI** | Doc 671 Phase 3 said API direct. But CLI is $0 marginal cost. | **API direct - the `tool_choice: tool` guarantee is THE feature here. Cost at ~10 captures/day, Opus = ~$3/month. Within budget.** |
| F | **Bot OWNS the suggestion or always confirms?** | (a) High-confidence (>0.8) writes directly, low-confidence asks. (b) Always asks the user to confirm. | **(a) - matches /autoconfirm pattern already shipped; reduces friction.** |
| G | **Where transcripts live (long-term)** | (a) `cowork-zaodevz/data/transcripts/*.md` (git audit). (b) Supabase. (c) Local VPS disk only. | **(a) - aligns with the project's existing "everything in git" pattern; cheap, searchable, audit-trail-friendly.** |
| H | **Multi-language support** | English only v1? Or `--language auto`? | **English-only v1 (matches Zaal+Iman's working language). Auto in P4+.** |

## Cost Model

| Volume | Whisper (local) | Anthropic Opus extract | Total/month |
|--------|----------------|------------------------|-------------|
| 10 captures/day, avg 90s each | $0 (CPU only) | ~$3 ($0.01/extract) | $3 |
| 30 captures/day, avg 90s | $0 | ~$9 | $9 |
| 100 captures/day, avg 90s | ~$2 (occasional API fallback for long ones) | ~$30 | $32 |

Cap below Zaal's existing Anthropic API budget. The 4-person team is unlikely to exceed 30/day in practice.

## Risk Register

| Risk | Probability | Mitigation |
|------|-------------|------------|
| Whisper local accuracy issues with accents / poor mic | Medium | Fallback to OpenAI Whisper API on user-flag. Or upgrade base model -> small.en. |
| LLM extracts noise as actions ("uh let me think about that" -> action item) | Medium | Confidence threshold + low-confidence review queue (P3). Persona examples teach the LLM to skip filler. |
| Owner-detection wrong | Medium | Item is still created; user can /assign correctly. The cost of a wrong owner is low (one /assign). |
| Voice messages contain sensitive content (BCZ client calls, finance) | Medium | 24h raw-audio retention + opt-in consent. Don't ingest unallowlisted senders. |
| Anthropic API outage | Low | Queue locally, retry. If down >30 min, alert Zaal via cowork-zaodevz bot. |
| Whisper.cpp crashes on edge file formats (.oga, .ogg variants) | Medium | ffmpeg normalize step before whisper call. |

## Integration Touchpoints

- **cowork-zaodevz**: needs the new `/api/v1/items` endpoint (P0). Bearer token `HERMES_API_KEY`. POST schema mirrors the json-suggest shape that the bot already understands.
- **Hermes**: same API key, same endpoint. When Hermes ships a PR fix, it can POST a `done` item with the PR URL in notes.
- **ZOE**: future. When ZOE handles a tip-to-PR flow, it can also POST status items.
- **ZAOOS doc 670 action 12** ("send Iman the transcript"): Craig pattern is the long-term solution - just send him voice messages, get transcripts auto-piped.

## Next Actions

| # | Action | Owner | Effort | By When |
|---|--------|-------|--------|---------|
| 1 | Lock the 8 open decisions A-H above. Most have defaults - just confirm. | Zaal | 1/10 | Before coding starts |
| 2 | Register `@ZAOcraigBot` on BotFather + grab the token | Zaal | 1/10 | Before P1 |
| 3 | Ship P0: `POST /api/v1/items` on cowork-zaodevz with `HERMES_API_KEY` bearer auth | Zaal | 4/10 | Before P1 |
| 4 | Create `bettercallzaal/zao-craig` repo (assuming Decision C = option a) | Zaal | 1/10 | Before P1 |
| 5 | Ship P1: Craig v1.0 (TG voice forward + Whisper local + Anthropic extract + cowork POST) | Zaal | 7/10 | This week if decisions lock today |
| 6 | Ship P2: macOS/iOS Shortcuts upload | Zaal | 3/10 | Next sprint |
| 7 | Test with Iman: send a 30-second voice memo containing 2-3 actions, verify they land in /mine | Zaal + Iman | 1/10 | After P1 |
| 8 | Update memory `project_zaocoworkingbot.md` to add Craig as a sibling bot in the ZAO operating-surface taxonomy | Zaal | 1/10 | After P1 ships |
| 9 | Decommission the current 5-step voice-memo flow from Zaal's habits (delete Mac Shortcut, retrain reflex) | Zaal | 1/10 | After P1 stable for a week |

## Also See

- [Doc 670](../../events/670-iman-call-may18-craig-pizzadao/) - **SEED** for ZAO Craig (Iman call, thread 1)
- [Doc 671](../671-llm-fictional-permission-hallucination-fixes/) - Phase 3 architecture (direct Anthropic API + `tool_choice`) directly used in this spec
- [Doc 672](../672-zaocoworking-bot-audit-postv213/) - P3.5 (REST API) is the prerequisite this spec depends on
- [Doc 605d](../605-agentic-tooling-may-2026/605d-voice-agents/) - voice-agents survey; complementary (ZOE voice REPLY, not Craig voice CAPTURE)
- [Doc 474](../474-bcz101-bot-transcript-rag/) - transcript storage + RAG patterns; future tie-in for searching past Craig captures
- [Doc 464](../464-zoe-telegram-reply-context-ship-pr/) - grammy Telegram patterns (consent, conversation buffer)
- [Doc 247](../247-top-50-local-ai-models-2026/) - local model survey; informs Whisper.cpp choice
- [Doc 661](../661-zaocoworkingbot-go-live/) - sibling bot deployment patterns
- [project_zaocoworkingbot](../../../../../.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/project_zaocoworkingbot.md) - VPS + roster context
- [project_hermes_canonical](../../../../../.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/project_hermes_canonical.md) - the framework pattern Craig should mirror

## Sources

- doc 670 (2026-05-18 Iman call transcript - Craig idea was raised verbatim)
- doc 671 (3-dispatch research, recommended Anthropic API direct + `tool_choice` for hallucination-free tool calls)
- doc 672 (P3.5 REST API gap surfaced as a prereq)
- [Whisper.cpp GitHub](https://github.com/ggerganov/whisper.cpp) - local transcription, MIT
- [OpenAI Whisper API pricing](https://openai.com/api/pricing/) - $0.006/min as of 2026
- [pyannote-audio](https://github.com/pyannote/pyannote-audio) - speaker diarization, MIT
- [Anthropic tool_choice docs](https://platform.claude.com/docs/agents-and-tools/tool-use/define-tools) - `tool_choice` semantics for forced tool calls
- [grammy voice handling](https://grammy.dev/guide/messages-and-media) - bot.on('message:voice') pattern
