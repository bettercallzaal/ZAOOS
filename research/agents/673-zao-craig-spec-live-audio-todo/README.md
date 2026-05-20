---
topic: agents
type: spec
status: decisions-locked
last-validated: 2026-05-18
related-docs: 247, 464, 474, 605d, 670, 671, 672
tier: STANDARD
---

# 673 - ZAOscribe Spec (live audio -> todo bot)

> **Goal:** Replace the 5-step voice-memo flow (record - download - upload - transcribe - paste) with a one-step Telegram bot. User sends a voice message, ZAOscribe transcribes, extracts action items via LLM, and writes them to the existing cowork-zaodevz tracker. Doc 670 seeded this; doc 671 Phase 3 informs the architecture; doc 672 P3.5 is the optional integration path (not required).

> **Naming note:** Originally drafted as "ZAO Craig" (after the Discord recording bot pattern). Renamed to **ZAOscribe** per Zaal 2026-05-18 - ZAO-native, no upstream-OSS confusion. The Telegram username is **@ZAOscribeBot**.

## Locked Decisions (Zaal, 2026-05-18)

| # | Decision | Status |
|---|----------|--------|
| A | **Standalone backend, no shared REST API** - the bot is its own thing, fresh codebase, fresh identity | LOCKED |
| B | **Telegram username: @ZAOscribeBot** | LOCKED |
| C | **New repo: `bettercallzaal/zaoscribe`** (not inside cowork-zaodevz, not inside ZAOOS) | LOCKED |
| D | **Raw audio kept 24h, then auto-deleted** by a cron sweep | LOCKED |
| E | **LLM provider for action extraction: CASCADE (Haiku 4.5 -> Opus 4.7) with `tool_choice` schema enforcement** | LOCKED via sub-agent research |
| F | **Auto-write items with confidence >0.8**, queue low-confidence for one-tap confirm | LOCKED |
| G | **Transcripts stored in git** at `bettercallzaal/zaoscribe/data/transcripts/<date>-<sender>-<captureId>.md` (frontmatter + body) | LOCKED |
| H | **Multilingual auto-detect from day one** (Whisper.cpp medium / large-v3 multilingual model) | LOCKED |

## Architecture (v1)

### Write path - NO new REST API needed

Since Decision A locked "standalone, fresh own backend," ZAOscribe does NOT depend on a new `/api/v1/items` endpoint on cowork-zaodevz (the doc 672 P3.5 idea). Instead, **ZAOscribe writes directly to `cowork-zaodevz/data/actions.json` via Octokit + SHA-dance** - the same pattern the cowork-zaodevz bot uses today (see `cowork-zaodevz/agent/src/actions-store.ts`).

Two GitHub credentials live on the same VPS:
- `cowork-zaodevz/agent/.env` has GITHUB_TOKEN with write to its repo (already configured).
- `zaoscribe/agent/.env` gets its own GITHUB_TOKEN with write to `cowork-zaodevz/data/actions.json` ONLY (fine-grained PAT scoped to that file path - addresses doc 672 SEC.1).

Trade-off: two writers on the same JSON file means SHA conflicts under concurrent edits. The 409-retry loop already handles this (`mutateActions` in `actions-store.ts`). At 4 users + 10 captures/day there will be ~0 real conflicts.

Future option: if conflicts become a real problem OR Hermes/ZOE also want to write, revisit and build the REST API (doc 672 P3.5). For now: direct Octokit, simpler.

### High-Level Flow

```
[user] ---voice message---> [Telegram]
                                 |
                                 v
                       [@ZAOscribeBot grammy poll]
                                 |
                                 v
              ┌──────────────────┴─────────────────────┐
              |  1. Download audio file (TG API)       |
              |  2. Transcribe (Whisper.cpp multi-lang)|
              |  3. Extract actions (LLM, pattern TBD  |
              |     per E - sub-agent in flight)       |
              |  4. Confidence-gate (>0.8 auto-write,  |
              |     lower = DM with confirm button)    |
              |  5. Octokit write to cowork actions    |
              |  6. Commit transcript .md to own repo  |
              |  7. Reply with summary + item IDs      |
              |  8. Queue raw audio for 24h cleanup    |
              └────────────────────────────────────────┘
                                 |
              ┌──────────────────┴─────────────────────┐
              |    cowork-zaodevz/data/actions.json    |
              |    (existing, shared with cowork bot)  |
              └────────────────────────────────────────┘
```

### Components

- **@ZAOscribeBot** - Telegram bot, grammy framework. Allowlist = same roster as cowork-zaodevz (Zaal, Iman, ThyRev, Samantha).
- **Whisper.cpp** - compiled on VPS 1. Model: `ggml-medium.bin` (1.5 GB, multilingual, good accuracy/speed). Fallback to `ggml-large-v3` if accuracy issues.
- **LLM extractor** - pattern + provider TBD per Decision E sub-agent. Will land before P1 codes.
- **Octokit cowork client** - shared logic re-implemented in zaoscribe (small enough to copy; ~50 lines of SHA-dance).
- **systemd user unit** - `zaoscribe.service` on VPS 1, sibling to `zaocoworking-bot.service`.

### Repo Layout

```
bettercallzaal/zaoscribe/
├── README.md
├── CLAUDE.md
├── .env.example
├── agent/
│   ├── package.json                  # zaoscribe-agent v0.1.0
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                  # grammy entry + bot.on('message:voice')
│       ├── audio.ts                  # download + ffmpeg normalize
│       ├── transcribe.ts             # Whisper.cpp wrapper
│       ├── extract.ts                # LLM extraction (pattern from E)
│       ├── cowork-write.ts           # Octokit SHA-dance to cowork-zaodevz
│       ├── transcript-store.ts       # commit transcript .md to own repo
│       ├── consent.ts                # one-time consent + storage
│       ├── cleanup.ts                # 24h audio file sweep
│       └── types.ts
├── data/
│   └── transcripts/                  # markdown frontmatter + body, git-tracked
│       └── 2026-05/                  # bucket by month
└── scripts/
    └── install-whisper.sh            # compile whisper.cpp + download model
```

## Pipeline (Detailed)

### Step 1 - Receive

```typescript
bot.on('message:voice', async (ctx) => {
  if (!(await isAllowedSender(ctx))) return;
  if (!(await hasConsented(ctx.from.id))) return askForConsent(ctx);
  const dur = ctx.message.voice.duration;
  const capId = await ctx.reply(`[CAPTURED] transcribing ${dur}s audio...`);
  await processVoice(ctx, ctx.message.voice.file_id, capId.message_id);
});
```

### Step 2 - Transcribe

```typescript
async function transcribe(audioPath: string, duration: number): Promise<{ text: string; language: string }> {
  // v1 path: always Whisper.cpp local (per Decision H multilingual)
  // Fallback to OpenAI Whisper API if local fails OR duration > 300s
  const args = [
    '-m', '/opt/whisper.cpp/models/ggml-medium.bin',
    '-l', 'auto',            // auto language detect
    '-f', audioPath,
    '-otxt',
    '--print-progress', 'false',
  ];
  // ... spawn whisper.cpp, parse output
}
```

### Step 3 - Extract (CASCADE pattern, per Decision E sub-agent)

Sub-agent research finding (2026-05-18): Production meeting assistants (Granola, Fireflies, Otter) do NOT use multi-model voting ensembles. They ship single-model with confidence scoring + downstream validation. Multi-model voting adds 3x latency + flaky dedup logic for marginal (~2-5%) recall gains.

The pattern that DOES match Zaal's "compare with another LLM" instinct is CASCADE: cheap model first, expensive model as fallback when confidence is low. The escalation gives you the multi-model signal without paying 3x always.

```typescript
// Both calls use the SAME tool schema for direct comparability.
const TOOL: Anthropic.Tool = {
  name: 'extract_action_items',
  description: 'Extract zero or more action items from the transcript.',
  input_schema: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title:      { type: 'string' },
            owner:      { type: 'string', enum: ['Zaal','Iman','ThyRev','Samantha','Both','Open'] },
            due:        { type: 'string', description: 'YYYY-MM-DD or empty' },
            notes:      { type: 'string' },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
          },
          required: ['title','owner','confidence'],
        },
      },
    },
    required: ['items'],
  },
};

async function extractItems(transcript: string, senderHint: string): Promise<ExtractedItem[]> {
  // Tier 1: Haiku 4.5 (cheap, fast)
  const haiku = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    system: EXTRACTOR_PERSONA,
    tools: [TOOL],
    tool_choice: { type: 'tool', name: 'extract_action_items' },
    messages: [{ role: 'user', content: `Sender hint: ${senderHint}\n\nTranscript:\n${transcript}` }],
  });
  const haikuItems = readToolInput(haiku);

  // Quality gate: escalate to Opus if Haiku is shaky.
  const allConfident = haikuItems.every((i) => i.confidence >= 0.75);
  const hasMalformed = !validateAll(haikuItems);
  const hasRelativeDate = haikuItems.some((i) => i.due && !/^\d{4}-\d{2}-\d{2}$/.test(i.due));
  if (allConfident && !hasMalformed && !hasRelativeDate) {
    return haikuItems;
  }

  // Tier 2: Opus 4.7 (slower, smarter, handles pronouns + relative dates + ambiguity)
  const opus = await anthropic.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 2048,
    system: EXTRACTOR_PERSONA + '\n\nThe cheaper model returned low-confidence or malformed output on this transcript. Be especially careful with relative dates ("next Thursday" -> resolve to ISO) and pronouns.',
    tools: [TOOL],
    tool_choice: { type: 'tool', name: 'extract_action_items' },
    messages: [{ role: 'user', content: `Sender hint: ${senderHint}\n\nTranscript:\n${transcript}` }],
  });
  return readToolInput(opus);
}
```

**Why this wins:**
- 60-70% of captures land at Haiku (~$0.001 each). Opus only fires when needed.
- `tool_choice: {type: 'tool', name: ...}` is the STRONGEST constraint - the model literally cannot emit text outside the tool call. Doc 671's hallucination class is structurally impossible here.
- Both tiers use the SAME schema, so escalation is a swap, not a rewrite.
- v2 path (deferred): A/B log Haiku + Opus in parallel for 2 weeks, measure recall delta empirically, decide if a TRUE ensemble or judge pattern is worth adding.

**Cost at 10 captures/day, ~90s avg transcript (~2k tokens):**
- 100% Haiku: ~$0.30/mo
- 100% Opus: ~$3/mo
- Cascade (70/30 split): ~$1/mo

**Latency:**
- Haiku alone: ~1-2s median
- Cascade worst-case (Haiku + Opus): ~5-7s
- All within Telegram's "typing..." indicator UX

### Step 4 - Confidence gate (Decision F)

```typescript
for (const item of extractedItems) {
  if (item.confidence >= 0.8) {
    await coworkWrite.createItem(item);   // auto-write
    confirmedIds.push(coworkWrite.lastId);
  } else {
    queuedForConfirm.push(item);          // DM with confirm button
  }
}
```

### Step 5 - Write to cowork-zaodevz

```typescript
// cowork-write.ts - mirrors cowork-zaodevz/agent/src/actions-store.ts pattern
const OWNER = 'songchaindao-dot';
const REPO = 'cowork-zaodevz';
const PATH = 'data/actions.json';

async function createItem(item: ExtractedItem): Promise<string> {
  // SHA dance with up to 3 retries on 409 (concurrent writes from cowork bot)
  return mutateActions(async (data) => {
    const newItem = makeActionItem({
      title: item.title,
      owner: item.owner,
      createdBy: `zaoscribe (${item.captureSender})`,
      notes: `[ZAOscribe ${item.captureId}] ${item.notes}`,
      due: item.due || undefined,
    }, data.items);
    data.items.push(newItem);
    return {
      data,
      commitMessage: `zaoscribe: extract #${newItem.id} (${newItem.owner}) ${newItem.title}`,
      result: newItem.id,
    };
  });
}
```

### Step 6 - Transcript audit trail

```typescript
const transcriptMd = `---
captureId: ${captureId}
sender: ${senderName}
duration: ${duration}s
language: ${detectedLang}
extractedIds: [${confirmedIds.join(',')}]
queuedIds: [${queuedForConfirm.length}]
---

${rawTranscript}
`;
await octokit.repos.createOrUpdateFileContents({
  owner: 'bettercallzaal',
  repo: 'zaoscribe',
  path: `data/transcripts/${monthBucket}/${captureId}.md`,
  message: `zaoscribe: capture ${captureId} from ${senderName}`,
  content: Buffer.from(transcriptMd).toString('base64'),
});
```

### Step 7 - Reply

```
[CAPTURED] 1:23 audio from Zaal (lang=en)
transcribed (12 lines)

added 3 items to cowork:
  #26 (Iman) review the RSVPizza repo - due 2026-05-22
  #27 (Zaal) ship Craig v1 spec to VPS
  #28 (Both) cohost ZABAL Games drop Wednesday

flagged 1 low-confidence (tap to confirm):
  [confirm "?? (?) maybe also do that flyer thing"]

transcript: github.com/bettercallzaal/zaoscribe/blob/main/data/transcripts/2026-05/cap-2026-05-18-1430-zaal.md
```

### Step 8 - Cleanup

```typescript
// cleanup.ts - cron every hour
const cutoff = Date.now() - 24 * 60 * 60 * 1000;
for (const file of audioFiles()) {
  if (file.mtime < cutoff) await fs.unlink(file.path);
}
```

## Build Phases

P0 (REST API) is REMOVED - Decision A killed it. Direct Octokit write means no backend prereq.

| Phase | Effort | Output | Blockers |
|-------|--------|--------|----------|
| **P0 - Repo + skeleton** | 2 hr | `bettercallzaal/zaoscribe` created, agent skeleton committed, `.env.example` documented, Whisper install script | None |
| **P1 - Core capture loop** | 6-8 hr | @ZAOscribeBot live on VPS. TG voice receive, Whisper local transcribe, LLM extract (per E), direct Octokit write to cowork actions, transcript commit, summary reply | P0 + Decision E resolved + new GH PAT for the cross-repo write |
| **P2 - Confidence-gate UI** | 2-3 hr | Inline-keyboard confirm buttons for low-confidence items (matches cowork v2.13 callback pattern) | P1 |
| **P3 - Mac / iOS Shortcut** | 2-3 hr | Native share-sheet target on Mac + iPhone. Tap "share to ZAOscribe" from any audio source | P1 |
| **P4 - Multilingual edge cases** | 2-3 hr | Handle ffmpeg-normalize step before Whisper for .oga/.ogg variants from non-Telegram sources; per-language model swap if needed | P3 |
| **P5 - Diarization (multi-speaker)** | 6-10 hr | pyannote.audio adds speaker labels. Useful for multi-voice meetings. Models ~2GB disk. | P1. Defer until clear need. |
| **P6 - Live TG voice chat capture** | 15-20 hr | TDLib client (NOT Bot API) joins voice chats, records, processes in 30-sec windows | P5. Major scope. Defer until clear need. |

**P0 + P1 + P2 = ~10-13 hours = one sprint.** P3 is fast-follow.

## Cost Model

| Volume | Whisper.cpp local | LLM extract (TBD provider) | Total/month |
|--------|------------------|----------------------------|-------------|
| 10/day x 90s | $0 | ~$1/mo (cascade 70/30) | ~$1/mo |
| 30/day x 90s | $0 | ~$3/mo (cascade 70/30) | ~$3/mo |

Multilingual model is heavier than English-only (`ggml-medium.bin` 1.5 GB vs `ggml-base.en.bin` 74 MB), so VPS RAM + disk cost is the bigger constraint than transcription dollars. CPU time for 90s audio: ~10-15 sec on Hostinger KVM 2 with medium model. Acceptable.

## Risk Register

| Risk | Probability | Mitigation |
|------|-------------|------------|
| SHA conflicts between zaoscribe + cowork writing to same actions.json | Low (4 users, low rate) | 3x retry in mutateActions already; revisit if real |
| LLM extracts noise as actions ("um let me think") | Medium | Confidence gate + low-confidence review queue (P2). Persona examples teach skip-filler. |
| Owner-detection wrong | Medium | Item is still created; user /assign correctly. Single-tap fix cost. |
| Voice contains sensitive content (BCZ client calls, finance) | Medium | 24h raw retention + opt-in consent + roster gating. Don't ingest unallowlisted senders. |
| LLM provider outage | Low | Queue locally, retry. If E lands as ensemble, partial output from healthy providers still ships. |
| Whisper.cpp crashes on weird audio format | Medium | ffmpeg normalize step before whisper call (P4) |
| New GitHub PAT needed for cross-repo write | Cert | Just generate one scoped to `cowork-zaodevz/data/actions.json` only. Doc the procedure in zaoscribe README. |

## Integration Touchpoints

- **cowork-zaodevz**: ZAOscribe writes new items directly to its `data/actions.json` via Octokit. ZAOscribe items show in `/mine` for the assigned owner just like manual ones. No coordination required beyond agreeing not to break the JSON schema (which is enforced by `actions-store.ts` types).
- **Bonfire** ([[project_zoe_soul_architecture]] + ZABAL knowledge graph): future. Transcripts in `bettercallzaal/zaoscribe/data/transcripts/` are ingestion-ready for the Bonfire pipeline. Each transcript has `extractedIds` in frontmatter for cross-graph linking.
- **Hermes**: complementary, not coupled. Hermes ships PR fixes; ZAOscribe captures intent + decisions from voice.
- **ZOE**: ZOE drafts content / does recall. ZAOscribe captures voice. If ZOE wants to "summarize this week's voice captures" later, point her at the transcripts dir.

## Cross-Repo Findings

`grep.app` + `searchGitHub bettercallzaal`:
- No prior audio-capture bot in the ZAO ecosystem. ZAOscribe is the first.
- The cowork-zaodevz `actions-store.ts` SHA-dance pattern is the template to mirror.
- ZOE has voice-output research (doc 605d) but not voice-input. Different problem.

## Next Actions

| # | Action | Owner | Effort | By When |
|---|--------|-------|--------|---------|
| 1 | ~~Sub-agent: research multi-LLM ensemble vs single-provider extraction patterns~~ DONE - locked Cascade (Haiku -> Opus) | Claude | done | 2026-05-18 |
| 2 | Register `@ZAOscribeBot` on BotFather + grab token | Zaal | 1/10 | Before P0 |
| 3 | Generate fine-grained GH PAT scoped to `songchaindao-dot/cowork-zaodevz/data/actions.json` write only | Zaal | 1/10 | Before P1 |
| 4 | Create `bettercallzaal/zaoscribe` GitHub repo + push the skeleton | Zaal | 2/10 | This week |
| 5 | Compile Whisper.cpp + download multilingual medium model on VPS (~1.5 GB disk + ~5 min build) | Zaal | 2/10 | Before P1 |
| 6 | Ship P0 (skeleton) + P1 (core capture loop) + P2 (confidence UI) | Zaal | 9/10 | One sprint |
| 7 | Test with Iman: send 30-sec voice memo with 2-3 actions, verify they land in `/mine` on the cowork bot | Zaal + Iman | 1/10 | After P1 |
| 8 | Update `project_zaocoworkingbot.md` memory: add ZAOscribe as a sibling bot in the ZAO bot taxonomy | Claude | 1/10 | After P1 ships |
| 9 | Update [[feedback_prefer_claude_max_subscription]] memory based on final E decision (CLI vs API) | Claude | 1/10 | After E resolves |
| 10 | Decom Zaal's manual 5-step voice-memo flow after P1 stable for 1 week | Zaal | 1/10 | Week+1 |

## Also See

- [Doc 670](../../events/670-iman-call-may18-craig-pizzadao/) - **SEED** for this bot (Iman call, thread 1)
- [Doc 671](../671-llm-fictional-permission-hallucination-fixes/) - Phase 3 architecture (direct LLM API + `tool_choice`) informs Decision E
- [Doc 672](../672-zaocoworking-bot-audit-postv213/) - P3.5 was the REST API path; Decision A skipped it for now. SEC.1 (PAT scoping) applies to the new ZAOscribe write PAT.
- [Doc 605d](../605-agentic-tooling-may-2026/605d-voice-agents/) - voice agents survey (ZOE voice REPLY, not ZAOscribe voice CAPTURE - complementary)
- [Doc 474](../474-bcz101-bot-transcript-rag/) - transcript storage patterns, future RAG tie-in
- [Doc 464](../464-zoe-telegram-reply-context-ship-pr/) - grammy + Telegram patterns
- [Doc 247](../247-top-50-local-ai-models-2026/) - local model survey, informs Whisper.cpp choice
- [project_zaocoworkingbot](../../../../../.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/project_zaocoworkingbot.md) - VPS + roster context
- [project_hermes_canonical](../../../../../.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/project_hermes_canonical.md) - the framework pattern this bot mirrors

## Sources

- doc 670 (2026-05-18 Iman call transcript - audio bot idea verbatim)
- doc 671 (3-dispatch research, recommended Anthropic API direct + `tool_choice` to remove hallucination surface)
- doc 672 (cowork-zaodevz audit, post-v2.13)
- [Whisper.cpp GitHub](https://github.com/ggerganov/whisper.cpp) - local transcription, MIT
- [OpenAI Whisper API pricing](https://openai.com/api/pricing/) - $0.006/min as of 2026
- [pyannote-audio](https://github.com/pyannote/pyannote-audio) - speaker diarization, MIT
- [grammy voice handling](https://grammy.dev/guide/messages-and-media) - bot.on('message:voice') pattern

## Changelog

- 2026-05-18 first draft as "ZAO Craig" with 8 open decisions
- 2026-05-18 renamed to "ZAOscribe" per Zaal; A,B,C,D,F,G,H locked; E pending sub-agent
- 2026-05-18 E locked: Cascade (Haiku 4.5 -> Opus 4.7) + `tool_choice` schema enforcement, per sub-agent research citing Granola / Fireflies / Otter production patterns. ALL 8 DECISIONS NOW LOCKED.
