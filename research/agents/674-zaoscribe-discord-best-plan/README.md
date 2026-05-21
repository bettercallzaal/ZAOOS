---
topic: agents
type: spec
status: research-complete
last-validated: 2026-05-20
original-query: What's the best architecture for a Discord audio-to-action-items bot with native diarization and the cleanest extraction pipeline? (reconstructed)
related-docs: 247, 327, 464, 474, 605d, 670, 671, 672, 673
tier: DEEP
supersedes: 673
---

# 674 - ZAOscribe: Discord Audio -> Action Items (Best-of + Build Plan)

> **Goal:** Ship the BEST possible audio-capture-to-todo bot for the 4-person ZAO core team (Zaal + Iman + ThyRev + Samantha). The pivot from doc 673 v2: this is a **Discord bot, not Telegram**. Discord exposes per-speaker audio streams natively, which gives us free diarization, sub-second per-user file isolation, and the entire CraigChat playbook to draft from. Combined with the cascade extraction pattern from doc 671/673, this is the cleanest path to a production-quality voice-to-task pipeline.

> **Supersedes doc 673** (Telegram architecture). 673 is kept for the cowork-zaodevz integration patterns it documented; the architecture sections are obsolete.

## Why Discord beats Telegram for this use case

Doc 673 originally specced @ZAOscribeBot as a Telegram bot. Three things change that call:

1. **Free per-speaker diarization.** Discord's `@discordjs/voice` library (v0.19+) exposes a SEPARATE audio stream per user via `connection.receiver.subscribe(userId)`. Telegram voice messages are mono mixed. With Discord, "who said what" comes free as `audio/<userId>-<ts>.opus` files. No pyannote.audio, no diarization model, no speaker-embedding step.
2. **Live voice channel capture is a first-class feature.** The original "Craig" naming was a nod to `github.com/CraigChat/Craig` - the Discord-native recording bot with 270+ years of audio captured annually. Telegram Bot API can't even read voice-chat audio (requires MTProto/TDLib). Discord makes this trivial.
3. **Concurrent multi-user audio.** Team standups + creative jams happen with multiple voices overlapping. Discord per-stream isolation handles this natively; Telegram doesn't.

## Locked Decisions (Zaal, 2026-05-18 - Discord pivot)

| # | Decision | Status |
|---|----------|--------|
| A | **Standalone backend** - writes direct to `cowork-zaodevz/data/actions.json` via Octokit SHA-dance; no new REST API | LOCKED (from 673) |
| B | **Bot name: @ZAOscribeBot** (Discord username + invite link) | LOCKED (from 673) |
| C | **Repo: `bettercallzaal/zaoscribe`** | LOCKED (from 673) |
| D | **Raw audio retention: 24h then auto-delete** | LOCKED (from 673) |
| E | **Cascade extraction: Haiku 4.5 -> Opus 4.7 with `tool_choice`** | LOCKED (from 673) |
| F | **Auto-write at confidence > 0.8; low-confidence DM with confirm button** | LOCKED (from 673) |
| G | **Transcripts in `bettercallzaal/zaoscribe/data/transcripts/` git** | LOCKED (from 673) |
| H | **Multilingual auto-detect from day one** | LOCKED (from 673) |
| I | **Platform: Discord (replaces Telegram from 673)** | LOCKED today |
| J | **Capture trigger: HYBRID** - auto-join when allowed user speaks in the dedicated coworking VC; explicit `/scribe start` slash command in any other VC | LOCKED today |
| K | **Identity map: auto-match Discord username -> roster name** (case-insensitive). Fallback `/scribe link <name>` for edge cases (display-name changes, nicknames) | LOCKED today |

## Architecture (post-Discord pivot)

### High-Level Flow

```
[user joins #zao-coworking voice channel + speaks]
            |
            v
     [ZAOscribeBot auto-joins, posts "[REC] capturing..."]
            |
            v
[per-speaker Opus streams written to /tmp/audio/<userId>-<ts>.opus]
            |
            v          (on speaker silence > 100ms OR /scribe stop)
            v
   [FFmpeg normalise .opus -> 16kHz mono WAV]
            |
            v
   [Whisper.cpp ggml-medium.bin multilingual transcribe]
            |
            v
   [Cascade extract: Haiku 4.5 classify + extract -> escalate to
    Opus 4.7 if confidence <0.75 or pronoun/relative-date detected]
            |
            v
   [Confidence gate: >=0.8 auto-write; <0.8 DM owner with confirm button]
            |
            v
   [Octokit SHA-dance write to cowork-zaodevz/data/actions.json]
            |
            v
   [Commit transcript .md to zaoscribe/data/transcripts/YYYY-MM/<captureId>.md]
            |
            v
   [Reply in original Discord channel with summary + item IDs]
            |
            v
   [24h cron sweeps /tmp/audio/ - delete raw .opus + .wav]
```

### Components

| Component | Choice | Why |
|-----------|--------|-----|
| Discord lib | `discord.js` v14 + `@discordjs/voice` v0.19+ | Mature, TypeScript-native, per-user subscribe primitive, active maintenance |
| Audio codec on disk | Opus (raw stream, no transcode) | Discord streams Opus packets at 48kHz stereo. Pass-through to disk; transcode only for Whisper. |
| Transcode | FFmpeg subprocess `-ar 16000 -ac 1 -acodec pcm_s16le` | Whisper.cpp wants 16kHz mono PCM WAV |
| Transcription | Whisper.cpp `ggml-medium.bin` (1.5 GB, multilingual) | Local on VPS 1 = $0 marginal. Multilingual per Decision H. |
| LLM extract | Anthropic API direct, cascade Haiku -> Opus, `tool_choice: {type: 'tool', name: 'extract_action_items'}` | Doc 671 + 673-E findings; no Claude Code CLI subprocess |
| Action store | Octokit Contents API to `cowork-zaodevz/data/actions.json` | Shared with @ZAOcoworkingBot; no new REST API needed |
| Transcript store | Octokit to own repo `bettercallzaal/zaoscribe/data/transcripts/<YYYY-MM>/<captureId>.md` | Git audit + future RAG-ability |
| Identity map | Auto-match Discord username case-insensitively against `OWNERS` enum; `/scribe link` fallback | Per Decision K |
| Deployment | systemd user unit `zaoscribe.service` on VPS 1 | Sibling to `zaocoworking-bot.service` |

### Decision J - Hybrid Trigger (detail)

Two modes, gated by which voice channel the bot is invited to OR observing:

| VC | Behaviour | Reasoning |
|----|-----------|-----------|
| **#zao-coworking** (the team's dedicated coworking VC, ID stored in env) | Auto-join the moment any allowlisted user speaks. Auto-leave when last allowed user leaves. Continuous capture. | This is the canonical team workspace - if anyone's in there talking, it's worth capturing. |
| **All other VCs** | Wait for explicit `/scribe start` slash command from an allowlisted user. Stop on `/scribe stop` OR when invoking user leaves. | Other VCs may be social, brainstorming, or third-party. Default to OFF. |

Both modes display the same consent indicator: bot nickname becomes `@ZAOscribeBot [REC]` while recording, posts `[REC] capturing audio - say "/scribe stop" to end early` on entry, removes both on exit.

### Decision K - Auto-match Identity (detail)

Algorithm at capture time:

```typescript
function discordIdToOwner(member: GuildMember): Owner {
  // 1. Explicit link wins (set via /scribe link)
  const linked = await getLinkedOwner(member.id);
  if (linked) return linked;
  
  // 2. Auto-match display name case-insensitively
  const name = member.displayName.toLowerCase();
  for (const owner of OWNERS) {
    if (name === owner.toLowerCase()) return owner;
    if (name.startsWith(owner.toLowerCase())) return owner; // "iman a" -> Iman
  }
  
  // 3. Auto-match username (handle @ tag)
  const username = member.user.username.toLowerCase();
  for (const owner of OWNERS) {
    if (username === owner.toLowerCase()) return owner;
  }
  
  // 4. Fallback - log + return Open. User can run /scribe link to fix.
  console.warn(`[zaoscribe] no owner match for ${member.id} (${member.displayName})`);
  return 'Open';
}
```

Edge cases:
- Someone changes display name -> next capture may mismatch. Log a warning. They run `/scribe link <name>` once to lock it.
- Two members with similar names (e.g. "Iman" and "Imanu"): first-match wins; the second one needs `/scribe link`.
- Bot accounts in same VC (music bots, etc.): filtered before owner-match step via `member.user.bot` check.

### Slash Commands

| Command | Allowlist | Behaviour |
|---------|-----------|-----------|
| `/scribe start` | Roster | Bot joins user's current VC, starts capture |
| `/scribe stop` | Roster | Bot finishes current speaker, processes everything, leaves VC |
| `/scribe link <name>` | Roster (self-only) | Map caller's `discord_id` to a roster name (overrides auto-match) |
| `/scribe upload` | Roster | Process an attached voice message (async, no live VC needed) |
| `/scribe last` | Roster | Show last 5 captures + their extracted item IDs |
| `/scribe transcript <id>` | Roster | Reply with GitHub link to the transcript .md |
| `/scribe status` | Roster | Show current recording state (active VC, speakers, elapsed) |
| `/scribe delete <id>` | Self-only (the speaker) | GDPR-style: remove that captureId's audio + transcript + items (best-effort) |

### Cowork Integration

ZAOscribe does NOT introduce a new write surface. It uses the same `cowork-zaodevz/data/actions.json` that @ZAOcoworkingBot uses today. Mirror the SHA-dance pattern from `cowork-zaodevz/agent/src/actions-store.ts`:

```typescript
// zaoscribe/agent/src/cowork-write.ts
const OWNER = 'songchaindao-dot';
const REPO = 'cowork-zaodevz';
const PATH = 'data/actions.json';

export async function createCoworkItem(item: ExtractedItem): Promise<string> {
  // 409-retry SHA-dance loop (3 attempts, exponential backoff)
  // ... mirrors cowork-zaodevz mutateActions ...
}
```

Two writers on the same file is rare-enough at 4 users + ~10 captures/day that the existing 409-retry covers it. Future: if conflicts grow OR Hermes/ZOE also need to write, build the REST API per doc 672 P3.5.

**Schema add to `cowork-zaodevz/data/team.json`** (one-time edit):

```json
{
  "members": [
    {
      "name": "Iman",
      "telegram_id": 7955994215,
      "discord_id": "<TBD - get from /scribe link>",
      ...
    }
  ]
}
```

### Privacy & Consent (Discord-specific)

| Element | Implementation |
|---------|----------------|
| Visible indicator | Bot nickname becomes `@ZAOscribeBot [REC]` while capturing; reverts on stop. Discord shows the bot in the VC member list. |
| Entry announcement | On join, bot posts `[REC] capturing this VC. /scribe stop to end. Audio kept 24h, transcripts in git.` |
| Per-server scope | Hard-coded `GUILD_ID` env var. Bot REFUSES to operate in any other guild. |
| Per-user opt-out | `/scribe optout` flips a flag; that user's stream is dropped before write. Per-guild, persists in `~/.zaoscribe/optouts.json` |
| Music-bot filter | Filter `member.user.bot === true` before subscribing - excludes other bots' audio |
| Raw audio retention | 24h via cron; transcripts kept indefinitely in git |
| GDPR-style delete | `/scribe delete <captureId>` removes audio + transcript + best-effort removes the resulting cowork items |

## Best-of: Research-Backed Wins (from sub-agent dispatch)

### 1. Per-user audio streams (free diarization)

```typescript
import { joinVoiceChannel, EndBehaviorType } from '@discordjs/voice';
import { createWriteStream } from 'fs';
import { join } from 'path';

const connection = joinVoiceChannel({
  channelId: vc.id,
  guildId: vc.guild.id,
  adapterCreator: vc.guild.voiceAdapterCreator,
  selfDeaf: false,
});

connection.receiver.speaking.on('start', (userId) => {
  if (!isAllowedUser(userId)) return; // roster gate
  if (isMusicBot(userId)) return;     // other-bot filter
  
  const stream = connection.receiver.subscribe(userId, {
    end: { behavior: EndBehaviorType.AfterSilence, duration: 100 },
  });
  
  const path = join(audioDir, `${userId}-${Date.now()}.opus`);
  stream.pipe(createWriteStream(path));
  stream.on('end', () => queueForTranscription(path, userId));
});
```

`EndBehaviorType.AfterSilence` ends the stream when speech pauses for 100ms. Each "utterance" is its own .opus file. Whisper transcribes them in parallel; the resulting transcript is naturally segmented by speaker + turn.

### 2. Cascade extraction (validated in doc 671/673)

Same code as doc 673 v2 step 3. Haiku tier handles 60-70% of transcripts. Opus tier escalates on:
- Any item with `confidence < 0.75`
- Any `due` field that isn't ISO 8601 (probably a relative date like "next Thursday")
- Pronouns in titles ("they should do X" - Opus resolves "they")
- Malformed JSON from Minimax-grade providers (not in our stack but defence)

`tool_choice: {type: 'tool', name: 'extract_action_items'}` is Anthropic's strongest constraint - the model literally cannot emit free text outside the tool call. Doc 671's "approve in system dialog" hallucination class is structurally impossible.

### 3. Octokit SHA-dance for shared write

Same `mutateActions` pattern as `cowork-zaodevz/agent/src/actions-store.ts`. 3-attempt 409-retry covers concurrent writes. ZAOscribe just needs its OWN fine-grained PAT scoped to that one file path (per doc 672 SEC.1).

### 4. Production-bot-grade reliability

- WS reconnect: `@discordjs/voice` v0.19+ has built-in retry; wrap with our own outer reconnect loop that logs every disconnect to systemd journal.
- Transcription fallback: if Whisper.cpp errors (rare, but heavy accent + bad mic combo can do it), fall back to OpenAI Whisper API (`whisper-1`) on the same .wav file. ~$0.006/min - covered by budget.
- GitHub rate limit: API allows 5000 reqs/hour authenticated. ZAOscribe writes 1 commit per item batch. At 10 captures/day x ~3 items each = 30 commits/day. ~6000% headroom.
- Audio leak protection: systemd `ExecStopPost=/bin/rm -rf /tmp/zaoscribe-audio` ensures crash doesn't strand files. Belt-and-suspenders to the 24h cron.

## Build Plan (Concrete, Sequenced)

7 phases, ~10 calendar days of focused work for a single dev. Each phase ends with a working commit + a demoable state.

### Phase 1 - Repo skeleton + Discord auth (Difficulty 3/10, ~3 hr)

**Output:** `bettercallzaal/zaoscribe` repo exists, bot logs in, prints `online as @ZAOscribeBot` in systemd journal.

Files:
- `README.md`, `CLAUDE.md`, `.env.example`, `package.json`, `tsconfig.json`
- `agent/src/index.ts` - grammy-equivalent: discord.js Client + InteractionCreate handler
- `agent/src/auth.ts` - resolve `GUILD_ID` env, refuse other guilds
- `scripts/register-commands.ts` - one-shot to push slash commands to Discord

Commit: `feat: discord.js skeleton + auth gate`

Prereqs you do (Zaal):
- Create Discord application + bot at https://discord.com/developers/applications
- Grab token, GUILD_ID, CLIENT_ID
- Invite bot to your server with `applications.commands` + `bot` + voice scopes

### Phase 2 - Slash commands + roster + auto-match (Difficulty 2/10, ~3 hr)

**Output:** All 8 slash commands respond. `/scribe link Iman` writes to `~/.zaoscribe/links.json`. `/scribe status` shows fake "idle".

Files:
- `agent/src/commands/` - one file per command
- `agent/src/identity.ts` - the `discordIdToOwner` function from above
- `agent/src/storage.ts` - JSON load/save for links + optouts

Commit: `feat: slash commands + identity map`

### Phase 3 - VC join + per-speaker capture (Difficulty 5/10, ~6 hr)

**Output:** `/scribe start` joins the user's VC. Bot nickname becomes `[REC]`. .opus files appear in `/tmp/zaoscribe-audio/`. `/scribe stop` leaves cleanly + removes [REC].

Files:
- `agent/src/voice.ts` - `joinVoiceChannel` + receiver.subscribe loop
- `agent/src/audio-store.ts` - per-speaker .opus writes
- `agent/src/presence.ts` - nickname [REC] toggle

Commit: `feat: per-speaker opus capture`

Test: open a VC, type `/scribe start`, speak for 30 sec, `/scribe stop`. Check `/tmp/zaoscribe-audio/`. Expect one .opus file per speaker.

### Phase 4 - Whisper transcribe + cascade extract (Difficulty 6/10, ~8 hr)

**Output:** `/scribe stop` triggers full pipeline. Bot replies with `transcript ready: <link>` + lists extracted items. Items NOT yet written to cowork (next phase).

Files:
- `agent/src/transcribe.ts` - ffmpeg convert + whisper.cpp shell-out
- `agent/src/extract.ts` - Anthropic SDK + cascade pattern
- `scripts/install-whisper.sh` - compile whisper.cpp + download ggml-medium.bin on VPS

Commit: `feat: whisper transcribe + cascade extraction`

Test: same as Phase 3, then verify the LLM extracts items from the test recording.

### Phase 5 - Cowork write + transcript commit (Difficulty 4/10, ~4 hr)

**Output:** Items appear in `/mine` on the cowork Telegram bot. Transcripts committed to `zaoscribe/data/transcripts/YYYY-MM/`. Bot reply includes the cowork item IDs.

Files:
- `agent/src/cowork-write.ts` - Octokit SHA-dance to cowork-zaodevz
- `agent/src/transcript-write.ts` - Octokit commit transcript .md to zaoscribe repo
- `data/transcripts/.gitkeep`

Commit: `feat: cowork action write + transcript audit`

Prereqs you do (Zaal):
- Generate fine-grained GitHub PAT scoped to `songchaindao-dot/cowork-zaodevz/data/actions.json` write only (per doc 672 SEC.1)
- Put it in `.env` as `COWORK_GITHUB_TOKEN`
- Generate a second PAT scoped to `bettercallzaal/zaoscribe/data/transcripts/*` write
- Put as `ZAOSCRIBE_GITHUB_TOKEN`

Test: Iman should see new items in `/mine` after a capture.

### Phase 6 - Auto-join coworking VC + consent UI (Difficulty 4/10, ~4 hr)

**Output:** Bot auto-joins the dedicated `#zao-coworking` VC when any allowed user speaks there. Other VCs still require `/scribe start`. Low-confidence items get DM with inline-button confirm (same pattern as cowork v2.13 `/autoconfirm` callback).

Files:
- `agent/src/auto-join.ts` - voiceStateUpdate listener
- `agent/src/confirm-flow.ts` - inline-button DM + handler

Commit: `feat: hybrid trigger + confirmation flow`

### Phase 7 - Production hardening (Difficulty 5/10, ~6 hr)

**Output:** Bot survives Discord WS hiccups. 24h audio cleanup runs. Logs to journalctl with sane prefixes. Fallback to OpenAI Whisper API if local errors. Health check endpoint for monitoring.

Files:
- `agent/src/reconnect.ts` - WS retry + exponential backoff
- `agent/src/cleanup.ts` - 24h cron sweep
- `agent/src/fallback-transcribe.ts` - OpenAI Whisper API fallback
- `infra/zaoscribe.service` - systemd unit with `ExecStopPost` cleanup

Commit: `feat: production hardening + monitoring`

Deploy to VPS:
```bash
ssh root@187.77.3.104
git clone bettercallzaal/zaoscribe.git /root/zaoscribe
cd /root/zaoscribe/agent && npm install
cp /root/zaoscribe/.env.example /root/zaoscribe/.env
# edit .env with tokens
chmod 600 /root/zaoscribe/.env
mv /root/zaoscribe/infra/zaoscribe.service ~/.config/systemd/user/
systemctl --user enable --now zaoscribe.service
```

### Total

- 7 phases, ~34 hours of focused dev = realistically 2 sprints / 1.5 weeks calendar
- $0 marginal API cost in phase 1-5 (Anthropic API only kicks in at phase 4, ~$1/mo at 10 captures/day)
- Hardware: VPS 1 (existing). Disk: +1.5 GB for Whisper model + ~100 MB/day audio buffer
- Risk: Discord ToS - we're recording with explicit `[REC]` indicator + opt-out + 24h retention. Within ToS for first-party use on a private guild.

## Risk Register (Discord-specific)

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Discord WS drops mid-capture | High (it WILL happen monthly) | Medium | `@discordjs/voice` v0.19+ auto-reconnect + outer retry loop + journal log every disconnect |
| Whisper fails on heavy accent / overlap | Medium | Medium | OpenAI Whisper API fallback; cost ~$0.006/min |
| Identity auto-match collisions (2 Imans, name changes) | Medium | Low | `/scribe link` explicit override; log + warn on first mismatch |
| SHA conflicts with cowork bot writing same actions.json | Low (4 users, low rate) | Low | 3-attempt 409-retry mirrors cowork pattern |
| GitHub rate limit | Very low (~30 commits/day vs 5000/hr) | Low | Batch up to 5 items per commit; debounce 30s |
| Discord recording-bot ToS gray area | Low (private guild, opt-out, [REC] indicator) | Medium | Public ToS-compliant pattern from CraigChat; private servers only; document the consent flow |
| Bot crashes leaving raw audio behind | Low | High | systemd `ExecStopPost=rm -rf /tmp/zaoscribe-audio` + 24h cron |
| Music bot audio contamination | Medium | Low | `member.user.bot === true` filter before subscribe |
| User in VC who isn't on roster (visitor) | Medium | Medium | Skip subscribe entirely for unrostered IDs; log the skip |

## Cost Model (final)

| Volume | Whisper.cpp | Whisper API fallback (5%) | Cascade extract (Anthropic) | Total |
|--------|-------------|-----------------------------|----------------------------|-------|
| 10 captures/day x 90s | $0 | ~$0.10 | ~$1 | ~$1/mo |
| 30 captures/day x 90s | $0 | ~$0.30 | ~$3 | ~$3.50/mo |
| 100 captures/day x 5 min (heavy use, real meetings) | $0 (large model still local) | ~$5 | ~$15 | ~$20/mo |

Well under Zaal's existing Anthropic budget. Hardware costs zero marginal (VPS already running cowork bot).

## What This Replaces

- The current 5-step voice-memo flow (record on phone → download → upload to clipboard → ChatGPT transcribe → paste into cowork bot). Replaced with `[user speaks in VC]`.
- The diarization gap. ZAO has no other transcription-with-speakers tool.
- The "I forgot to write that down" failure mode. Captures pass through git audit + cowork tracker; nothing is lost.

## Integration Touchpoints

- **cowork-zaodevz** (Telegram bot): shares `data/actions.json`. Items show in `/mine` on the existing cowork bot. Same `data/team.json` (with new `discord_id` field).
- **Hermes** (`bot/src/hermes/` in ZAOOS): can future-write `done` items via the same Octokit pattern.
- **ZOE**: can summarise weekly captures from `zaoscribe/data/transcripts/`.
- **Bonfire knowledge graph**: transcripts are ingestion-ready (markdown + frontmatter per [[doc 474]] patterns).

## Open Questions (Non-Blocking - Can Resolve During Build)

1. **Which Discord server / guild?** Need a server with the 4 team members already in it. If none exists yet, create `ZAO Core` server (private, invite-only). Zaal sets this up before Phase 1.
2. **Coworking VC name + ID** - the auto-join VC. Suggestion: `#zao-coworking` or `#voice-cowork`. Zaal creates + adds VC ID to `.env`.
3. **Should the bot also respond to text-channel posts** (e.g. "ZAOscribe summarise this thread")? Out of v1 scope. Can add as `/scribe summary` later.
4. **Bonfire ingestion** - when do transcripts auto-flow into the knowledge graph? Defer to a separate doc once Phase 5+ is shipped.

## Next Actions

| # | Action | Owner | Effort | By When |
|---|--------|-------|--------|---------|
| 1 | Mark doc 673 as `superseded-by: 674` + add a one-line note linking here | Claude | 1/10 | Now (as part of this PR) |
| 2 | Create Discord application + bot, grab `DISCORD_TOKEN` + `CLIENT_ID` | Zaal | 1/10 | Before Phase 1 |
| 3 | Identify or create the team's Discord server + the dedicated coworking VC; grab `GUILD_ID` + `COWORKING_VC_ID` | Zaal | 1/10 | Before Phase 1 |
| 4 | Create `bettercallzaal/zaoscribe` GitHub repo | Zaal | 1/10 | Before Phase 1 |
| 5 | Generate fine-grained PATs - `COWORK_GITHUB_TOKEN` (scoped to `songchaindao-dot/cowork-zaodevz/data/actions.json` write) + `ZAOSCRIBE_GITHUB_TOKEN` (scoped to `bettercallzaal/zaoscribe/data/transcripts/*` write) | Zaal | 1/10 | Before Phase 5 |
| 6 | Add `discord_id` field to `cowork-zaodevz/data/team.json` schema; populate from `/scribe link` over time | Claude | 1/10 | During Phase 6 |
| 7 | Ship Phase 1 (skeleton + auth) | Claude | 3/10 | Day 1 |
| 8 | Ship Phase 2-5 (commands -> capture -> transcribe -> cowork write) | Claude | 7/10 | Days 2-5 |
| 9 | Ship Phase 6-7 (hybrid trigger + production hardening) | Claude | 5/10 | Days 6-7 |
| 10 | Test with Iman + Samantha + ThyRev: hop into the coworking VC, hold a 5-min mock standup, verify items land + transcript is searchable | Zaal + team | 1/10 | After Phase 7 |
| 11 | Update memory `project_zaocoworkingbot.md` + create `project_zaoscribe.md` + update [[feedback_prefer_claude_max_subscription]] caveats (chat bots use API direct, coding bots use Max CLI) | Claude | 1/10 | After Phase 7 stable |
| 12 | Mark current 5-step manual voice-memo flow as deprecated in Zaal's habits | Zaal | 1/10 | After 1 week of clean Phase 7 ops |

## Also See

- [Doc 673](../673-zao-craig-spec-live-audio-todo/) - SUPERSEDED. Telegram architecture; locked decisions A-H carry over to this Discord version.
- [Doc 670](../../events/670-iman-call-may18-craig-pizzadao/) - SEED for the whole audio-bot thread
- [Doc 671](../671-llm-fictional-permission-hallucination-fixes/) - Why direct Anthropic API + `tool_choice` is non-negotiable for the extraction layer
- [Doc 672](../672-zaocoworking-bot-audit-postv213/) - cowork-zaodevz audit; the SHA-dance pattern from `agent/src/actions-store.ts` is what we mirror. SEC.1 (PAT scoping) directly applies to ZAOscribe's PAT.
- [Doc 605d](../605-agentic-tooling-may-2026/605d-voice-agents/) - voice-agents survey; complementary (covers VOICE REPLY for ZOE, not VOICE CAPTURE)
- [Doc 474](../474-bcz101-bot-transcript-rag/) - transcript storage + RAG patterns
- [Doc 464](../464-zoe-telegram-reply-context-ship-pr/) - Bot conversation buffer patterns
- [Doc 327](../../music/327-open-source-speech-to-text-whisper-alternatives/) - Whisper alternatives if Whisper.cpp insufficient
- [Doc 247](../247-top-50-local-ai-models-2026/) - Local model survey
- [project_zaocoworkingbot](../../../../../.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/project_zaocoworkingbot.md) - VPS + roster context
- [project_hermes_canonical](../../../../../.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/project_hermes_canonical.md) - sibling bot framework

## Sources

- [discord.js v14 + @discordjs/voice docs](https://discordjs.dev/docs/packages/voice/main) - VoiceReceiver, EndBehaviorType
- [CraigChat/Craig GitHub](https://github.com/CraigChat/Craig) - MIT, 507 stars, the reference Discord recording bot (study only, do not fork)
- [Whisper.cpp GitHub](https://github.com/ggml-org/whisper.cpp) - audio format reqs (16kHz mono PCM), multilingual model
- [Whisper.cpp diarization PR](https://github.com/ggml-org/whisper.cpp/pull/3732) - ECAPA-TDNN per-segment speaker ID (merged 2026-03); BACKUP if Discord per-stream insufficient
- [Anthropic tool_choice docs](https://platform.claude.com/docs/agents-and-tools/tool-use/define-tools) - the `tool_choice: tool` constraint
- [Octokit createOrUpdateTextFile plugin](https://github.com/octokit/plugin-create-or-update-text-file.js) - SHA-dance pattern
- [Hihumanzone/Gemini-Live-discord](https://github.com/hihumanzone/Gemini-Live-discord) - reference for VAD threshold tuning, barge-in gating
- [vctools.app privacy patterns](https://vctools.app/privacy) - consent + blacklist model for Discord recording bots
- Sub-agent dispatch (2026-05-18) - Discord audio bot architecture deep dive

## Changelog

- 2026-05-18 first draft as doc 674; pivot from doc 673 Telegram architecture to Discord. Sub-agent research finding: per-speaker audio streams are FREE in Discord, eliminating diarization need. Cascade extraction pattern from doc 671/673 ported over unchanged. Decisions A-H from doc 673 v2 inherited; J + K added (hybrid trigger; auto-match identity). 7-phase build plan, ~34 dev-hours.
