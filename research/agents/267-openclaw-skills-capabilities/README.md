# 267 — OpenClaw Skills & Capabilities Reference

> **Status:** Research complete
> **Date:** March 29, 2026
> **Goal:** Document all available OpenClaw skills, extensions, and channel integrations for ZAO OS agent operations

## Current Setup

| Component | Value |
|-----------|-------|
| **Container** | `openclaw-openclaw-gateway-1` (Docker) |
| **Health** | `http://localhost:18789/health` |
| **Model** | `minimax/MiniMax-M2.7` (204K context, 131K max tokens) |
| **MCP Servers** | GitHub (`@modelcontextprotocol/server-github`) |
| **Active Channel** | Telegram (`@zaoclaw_bot`) |
| **Resources** | ~500MB RAM, <1% CPU |

## Channel Integrations (10 available)

All extensions are installed. Only Telegram is currently enabled.

| Channel | Extension | Status | ZAO Relevance |
|---------|-----------|--------|---------------|
| **Telegram** | `telegram` | **Active** | Primary control channel for Zaal |
| **Discord** | `discord` | Available | High — ZAO community server (~40 members) |
| **WhatsApp** | `whatsapp` | Available | Medium — personal/artist DMs |
| **Slack** | `slack` | Available | Low — team doesn't use it |
| **Nostr** | `nostr` | Available | High — decentralized, fits ZAO ethos |
| **Twitch** | `twitch` | Available | Medium — music streams |
| **Signal** | `signal` | Available | Low |
| **Matrix** | `matrix` | Available | Low |
| **IRC** | `irc` | Available | Low |
| **MS Teams** | `msteams` | Available | Low |

## Skills (52 installed)

### Development & Automation

| Skill | Description | Requires |
|-------|-------------|----------|
| **coding-agent** | Delegate coding to Claude Code, Codex, Pi, or OpenCode agents via background process. Builds features, reviews PRs, refactors codebases | `claude`, `codex`, `opencode`, or `pi` CLI |
| **gh-issues** | Fetch GitHub issues, spawn sub-agents to implement fixes and open PRs, monitor review comments. Usage: `/gh-issues [owner/repo] [--label bug] [--limit 5]` | `curl`, `git`, `gh` |
| **github** | Full GitHub ops via `gh` CLI: issues, PRs, CI runs, code review, API queries | `gh` |
| **skill-creator** | Create, edit, improve, or audit AgentSkills (SKILL.md files) | None |
| **clawhub** | Search, install, update, and publish skills from clawhub.com marketplace | `clawhub` CLI |
| **mcporter** | List, configure, auth, and call MCP servers/tools directly | `mcporter` CLI |

### Research & Content

| Skill | Description | Requires |
|-------|-------------|----------|
| **summarize** | Summarize/transcribe URLs, podcasts, YouTube videos, local files | `summarize` CLI |
| **blogwatcher** | Monitor blogs and RSS/Atom feeds for updates | `blogwatcher` CLI |
| **xurl** | Full Twitter/X API: post tweets, reply, quote, search, read, DMs, upload media | `xurl` CLI |
| **nano-pdf** | Edit PDFs with natural-language instructions | `nano-pdf` CLI |
| **oracle** | Prompt + file bundling for multi-model AI queries | `oracle` CLI |

### Music & Media

| Skill | Description | Requires |
|-------|-------------|----------|
| **songsee** | Generate spectrograms and audio feature visualizations | `songsee` CLI |
| **spotify-player** | Terminal Spotify playback and search via `spogo` or `spotify_player` | `spogo` or `spotify_player` |
| **sag** | ElevenLabs text-to-speech with voice storytelling | `sag` CLI + `ELEVENLABS_API_KEY` |
| **voice-call** | Start voice calls via OpenClaw voice-call plugin | voice-call extension |
| **video-frames** | Extract frames or clips from videos using ffmpeg | `ffmpeg` |
| **gifgrep** | Search GIF providers, download results, extract stills | `gifgrep` CLI |

### Communication & Messaging

| Skill | Description | Requires |
|-------|-------------|----------|
| **discord** | Discord ops via the message tool | `channels.discord.token` config |
| **slack** | Slack messaging | Slack config |
| **wacli** | Send WhatsApp messages or search/sync WhatsApp history | `wacli` CLI |
| **imsg** | iMessage integration | macOS only |
| **bluebubbles** | BlueBubbles iMessage bridge | BlueBubbles server |
| **himalaya** | CLI email via IMAP/SMTP: list, read, write, reply, search | `himalaya` CLI |

### Infrastructure & Monitoring

| Skill | Description | Requires |
|-------|-------------|----------|
| **healthcheck** | Host security hardening, firewall/SSH auditing, risk posture review | None |
| **paperclip** | AI team management — tasks, agent coordination, governance | Paperclip API |
| **model-usage** | Per-model usage/cost summaries from CodexBar | `codexbar` CLI |
| **session-logs** | Session logging and retrieval | None |
| **node-connect** | Diagnose OpenClaw node connection/pairing failures | None |

### Productivity & Utilities

| Skill | Description | Requires |
|-------|-------------|----------|
| **gog** | Google Workspace: Gmail, Calendar, Drive, Contacts, Sheets, Docs | `gog` CLI |
| **weather** | Current weather and forecasts via wttr.in or Open-Meteo | `curl` |
| **goplaces** | Google Places API: text search, details, reviews | `goplaces` CLI |
| **canvas** | Display HTML content/dashboards on connected OpenClaw nodes | Node app |
| **tmux** | Terminal multiplexer management | `tmux` |
| **1password** | 1Password CLI integration | `op` CLI |
| **notion** | Notion integration | Notion config |
| **obsidian** | Obsidian vault integration | Obsidian |
| **trello** | Trello board management | Trello config |
| **bear-notes** | Bear Notes integration | macOS only |
| **things-mac** | Things 3 task manager | macOS only |

### Hardware & Smart Home

| Skill | Description | Requires |
|-------|-------------|----------|
| **camsnap** | Capture frames/clips from RTSP/ONVIF cameras | Camera access |
| **peekaboo** | Capture and automate macOS UI | macOS only |
| **openhue** | Philips Hue lighting control | Hue Bridge |
| **blucli** | BluOS speaker discovery, playback, grouping | BluOS speakers |
| **eightctl** | Eight Sleep pod control (temp, alarms, schedules) | Eight Sleep |
| **sonoscli** | Sonos speaker control | Sonos speakers |

## Extensions (82 installed)

Model providers available but not configured:
- `anthropic`, `openai`, `deepseek`, `groq`, `together`, `ollama`, `mistral`, `xai`, `venice`, `perplexity`, `huggingface`, `nvidia`
- `amazon-bedrock`, `anthropic-vertex`, `cloudflare-ai-gateway`, `vercel-ai-gateway`, `litellm`, `vllm`

Search/web extensions:
- `brave`, `tavily`, `duckduckgo`, `exa`, `firecrawl`

Media extensions:
- `elevenlabs`, `deepgram`, `fal`, `image-generation-core`, `media-understanding-core`, `speech-core`

Other:
- `browser`, `memory-core`, `memory-lancedb`, `diagnostics-otel`, `diffs`, `thread-ownership`

## Recommended Next Steps for ZAO

### Priority 1 — Enable Now
1. **Discord channel** — Connect bot to ZAO community server for member interaction
2. **`gh-issues` automation** — Auto-process `bettercallzaal/ZAOOS` issues via Telegram
3. **`plugins.allow` lockdown** — Only load needed extensions (telegram, minimax, github, brave, browser) to cut startup time and memory

### Priority 2 — Set Up This Sprint
4. **`blogwatcher`** — Monitor music industry/web3 RSS feeds, auto-digest into research library
5. **`healthcheck` cron** — Schedule weekly VPS security audits
6. **`summarize`** — Use for research: transcribe YouTube music tech talks, podcast episodes

### Priority 3 — Explore Later
7. **`xurl`** — Twitter/X integration for ZAO social presence
8. **`nostr`** — Decentralized messaging channel
9. **`coding-agent`** — Let OpenClaw delegate coding tasks to Claude Code
10. **`clawhub`** — Browse community skill marketplace for new capabilities
11. **`songsee`** — Audio visualizations for WaveWarZ or SongJam features

## Known Issues (as of 2026-03-29)

| Issue | Impact | Fix |
|-------|--------|-----|
| `MiniMax-M2.7-highspeed` not supported by token plan | Was causing infinite fallback loop | Removed from fallbacks — fixed |
| `plugins.allow` empty | All 82 extensions auto-load (34MB, slower startup) | Set explicit allowlist |
| `tlon` skill path not found | Harmless log warning | Remove tlon extension or ignore |
| Paperclip API not reachable (`localhost:3100`) | Team management unavailable | Deploy Paperclip or remove from SOUL.md |
