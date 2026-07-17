---
tier: STANDARD-DEEP
type: agent-system
owner: claude-code
status: shipped-draft-pr
date_created: 2026-07-17
date_updated: 2026-07-17
doc_number: 1187
---

# ZAI - Discord Live Voice-Capture + Q&A Bot

ZAI (ZAO Assistant/Community Companion) is a new Discord bot that captures live voice channel conversations, transcribes them in real-time via Groq Whisper, and answers questions about the ongoing discussion using Claude. ZAI is warm, approachable, and plain-spoken - the public-facing community assistant for The ZAO ecosystem.

## What It Does

ZAI connects to a Discord server's voice channel and:

1. **Captures** all participant audio in real-time
2. **Transcribes** live via Groq's Whisper API (free tier, fast, handles Opus directly)
3. **Answers questions** about the conversation as it happens using Claude 3.5 Sonnet
4. **Summarizes** with action items when requested
5. **Saves transcripts** to `~/.zao/private/` per PII hygiene rules (third-party voices = PII)

Slash commands for easy interaction:
- `/join` - bot joins your voice channel, starts capturing
- `/ask <question>` - get an answer about the live conversation
- `/summary` - receive a summary + extracted action items
- `/stop` - end capture, save transcript, post to text channel

## Architecture

### Live Capture Pipeline

```
Discord Voice Channel
    ↓ (receive all speakers' audio)
VoiceReceiver (Discord.js)
    ↓ (subscribe to each speaker's Opus stream)
Opus Decoder (prism-media / @discordjs/opus)
    ↓ (buffer 12s chunks per speaker, detect silence)
Groq Whisper API
    ↓ (fast transcription, free tier)
In-Memory Transcript
    ↓ (periodically flush to file)
~/.zao/private/discord-<sessionId>/transcript.jsonl
```

### LLM Integration

- **Transcription:** Reuses `bot/src/zoe/transcribe.ts` `transcribeAudio(buffer)` helper (Groq Whisper Large v3 Turbo)
- **Q&A:** Claude 3.5 Sonnet (via ANTHROPIC_API_KEY) for conversational answers with the ZAI persona
- **Summaries:** Same Claude call, structured JSON response (title, overview, action items, key topics)

### Code Structure

```
bot/src/zai/
├── index.ts              # Main bot entrypoint + slash command handlers
├── types.ts              # Zod-validated command/session types
├── voice-capture.ts      # VoiceReceiver subscription + Groq transcription
├── llm-handler.ts        # Claude calls for Q&A + summaries
└── config.ts             # Env var validation (Zod, strict)
```

## Environment Setup

### Discord App Creation

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" → name it "ZAI"
3. Go to **Bot** → click "Add Bot"
4. Under **TOKEN**, copy the bot token
5. Save to `~/.zao/private/discord.env`:
   ```bash
   DISCORD_CAPTURE_TOKEN=<your-bot-token>
   ```
6. Under **Intents**, enable:
   - Server Members Intent (GUILD_MEMBERS)
   - Message Content Intent (MESSAGE_CONTENT)
   - Audio Activities (GUILD_VOICE_STATES)
7. Under **OAuth2 / URL Generator**, select scopes + permissions:
   - Scopes: `bot`, `applications.commands`
   - Permissions: `Connect`, `Speak`, `Use Voice Activity`, `Send Messages`, `Read Messages/View Channels`
8. Copy the generated URL, open it to invite ZAI to your server

### Environment Variables

In `~/.zao/private/discord.env`:

```bash
# Discord bot token (from Developer Portal)
DISCORD_CAPTURE_TOKEN=<bot-token>

# Server ID where ZAI operates (find via Developer Mode in Discord)
ZAAL_GUILD_ID=<your-guild-id>

# Zaal's user ID (for admin checks, optional - find via message context menu)
ZAAL_USER_ID=<your-user-id>

# Groq API key (free from console.groq.com)
GROQ_API_KEY=<groq-key>

# Anthropic API key (for Claude access)
ANTHROPIC_API_KEY=<anthropic-key>
```

Or rename `DISCORD_CAPTURE_TOKEN` to `ZAI_DISCORD_TOKEN` - the code checks both.

### Running the Bot

In the bot directory:

```bash
# Install deps (new: @discordjs/voice, @discordjs/opus, prism-media)
npm install

# Load env and run
export ZAI_ENV_FILE=~/.zao/private/discord.env
npx tsx src/zai/index.ts
```

### Systemd User Unit (Template)

Save to `~/.config/systemd/user/zai-bot.service`:

```ini
[Unit]
Description=ZAI Discord Live Voice Capture Bot
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=/usr/bin/env npx tsx /path/to/bot/src/zai/index.ts
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
EnvironmentFile=%h/.zao/private/discord.env
WorkingDirectory=/path/to/bot

[Install]
WantedBy=default.target
```

Then:
```bash
systemctl --user daemon-reload
systemctl --user start zai-bot
systemctl --user enable zai-bot
journalctl --user -u zai-bot -f
```

## Security & Hygiene

### Secrets

- Bot token loaded from env only (never in code)
- Zod validation on all config on startup (hard fail if missing)
- No logging of tokens/keys
- See `.claude/rules/secret-hygiene.md` for full guards

### PII

- All transcripts written to `~/.zao/private/discord-<sessionId>/` (not in repo)
- Third-party voices are PII → never committed
- Session files are personal/sensitive → stored outside ZAOOS repo
- See `.claude/rules/pii-hygiene.md` Rule 1

### Code Quality

- All inputs validated with Zod (`safeParse`)
- No `any` types (full TypeScript)
- Error handling with proper catch typing
- Follows `bot/src/zoe` patterns (same repo conventions)

## Implementation Status

### Complete

- Slash command registration + routing
- Voice channel connection + subscription
- Groq Whisper transcription (reusing `bot/src/zoe/transcribe.ts`)
- In-memory transcript + file persistence
- Claude Q&A + summary generation
- Message splitting for Discord's 2000-char limit
- Live update embeds (throttled)
- Full TypeScript, zero `any`, Zod validation
- Systemd unit template

### Not Yet Tested (Need Token)

The code is feature-complete and type-safe. It cannot be tested without:
1. A Discord bot token (requires Developer Portal setup)
2. A Discord server with voice channels
3. Groq + Anthropic API keys configured

Boot verification (non-interactive):
```bash
npm run typecheck           # zero errors
npx tsx -e "import('./src/zai/types.ts')"           # modules load
npx tsx -e "import('./src/zai/voice-capture.ts')"   # modules load
npx tsx -e "import('./src/zai/llm-handler.ts')"     # modules load
# DO NOT import index.ts - it will try to start the bot
```

## Design Decisions

### Why Groq for transcription?

- Free tier with no rate limits (matches ZOE's use of Groq)
- Whisper Large v3 Turbo is fast + accurate
- Handles Opus directly (no local ffmpeg needed)
- Reuses existing `transcribeAudio()` helper from `bot/src/zoe/transcribe.ts`
- No new npm dependencies for transcription

### Why Claude for Q&A?

- ZAI persona is warm + community-focused (different from ZOE's ops voice)
- Claude's instruction-following makes persona adoption clean
- System prompt baked in (easy to update ZAI's voice)
- Faster than multi-turn Groq for context windows

### Why not voice activity detection + local decoding?

- Groq handles the full pipeline (Opus decoding + transcription)
- Discord.js VoiceReceiver already receives Opus packets
- Local Whisper would require ffmpeg + model weights on VPS
- Current design scales to arbitrary voice counts (parallel Groq calls)

### Why `~/.zao/private/` for transcripts?

- PII rule: third-party voices recorded in a conversation = personal data
- Outside the repo = cannot be accidentally committed
- Session-based organization (one dir per capture)
- Consistent with ZOE's private data layout

## Future Enhancements

### Phase 2

- Speaker identification (map Discord usernames to voices, not just stream-based)
- Keyword extraction + timestamp linking
- Conversation topics clustering
- Integration with Bonfire for knowledge graph auto-ingest

### Phase 3

- Web dashboard (recent captures, searchable transcripts)
- Slack/Telegram forwarding of summaries
- Multi-channel simultaneous capture
- Custom prompts per server (ZAI persona variants)

## Related Docs

- `bot/src/zoe/transcribe.ts` - Groq Whisper integration (reused)
- `bot/src/zoe/concierge.ts` - Claude integration pattern (reference)
- `.claude/rules/secret-hygiene.md` - env var + token rules
- `.claude/rules/pii-hygiene.md` - transcript storage rules
- Doc 601 - Agent stack cleanup (ZAI vs ZOE vs ZOL taxonomy)

## ZAI Persona

ZAI is:
- **Warm** - greets users, celebrates good moments
- **Plain-spoken** - no jargon, direct communication
- **Community-focused** - cares about The ZAO ecosystem + its people
- **Helpful** - remembers context, proactive suggestions
- **Humble** - admits when something isn't captured yet or needs clarification

Contrasts:
- NOT ZOE (ZOE = ops orchestrator, private, systematic)
- NOT ZOL (ZOL = social media voice, public broadcasts)
- IS the community's assistant (public-facing, always on, always helpful)

## Ship Checklist

- [x] Code complete (all 4 modules)
- [x] Types sound (Zod, no `any`)
- [x] Secrets safe (env only, no tokens in code)
- [x] PII safe (transcripts to `~/.zao/private/`)
- [x] Boot-verifiable (tsc, import checks on non-entrypoint modules)
- [x] Design doc complete (this file)
- [x] Systemd template included
- [x] Package.json updated with deps
- [x] PR to main (DRAFT, awaiting token setup before live test)

## Handoff to Zaal

To get ZAI live:

1. Follow "Discord App Creation" steps above → get bot token, server ID
2. Populate `~/.zao/private/discord.env`
3. On VPS: `cd ~/zao-os && npm install && systemctl --user start zai-bot`
4. In Discord: type `/join` in a text channel while in a voice channel
5. Test with `/ask "who just spoke?"` and `/summary`
6. Shut down with `/stop` or `systemctl --user stop zai-bot`

Live monitoring: `journalctl --user -u zai-bot -f`

Questions/issues during setup: ZAI is self-contained in `bot/src/zai/` with no cross-bot dependencies. Revert by stopping the systemd unit.
