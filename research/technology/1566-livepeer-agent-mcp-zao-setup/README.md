---
topic: technology, infrastructure, AI
type: action-guide
status: DO NOW — Due Jul 22; 15 min setup
last-validated: 2026-07-18
related-docs: 932-livepeer-zao-ecosystem, 992-zao-videoclip-livepeer-highlight-detection
board-tasks: ee7bbb98 (Livepeer Agent MCP — add to Claude Code, test diarized-transcription runner)
action-owner: Zaal (runs `claude mcp add` in terminal; ~15 min)
---

# 1566 — Livepeer Agent MCP: ZAO Setup Guide

> **What this is:** A 15-minute setup guide for the Livepeer Agent MCP — a Daydream/Livepeer AI tool server that exposes video generation, diarized transcription, and vision capabilities directly inside Claude Code. Board task `ee7bbb98` asks Zaal to install it and test the diarized-transcription runner by Jul 22. Full background research in doc 932.

---

## What You're Installing

**Livepeer Agent** (Daydream MCP) is a Model Context Protocol server at `storyboard.daydream.monster/api/mcp` exposing 60+ AI capabilities from the Livepeer network. Launched July 14, 2026 in private alpha.

**Why ZAO cares:**
- **Diarized-transcription runner**: Speaker-identified transcript from audio/video files. Use case: COC Concertz recordings, WaveWarZ battle audio → searchable, quotable transcripts with speaker labels.
- **Florence-2 vision runner**: Frame-level scene understanding. Use case: auto-detect highlight moments in COC Concertz video for clip pipeline (doc 992).
- **Direct Claude Code integration**: Tools appear in Claude's tool list after install — ZOE or assistant can call them inline during sessions.

**Alpha status:** "Expect shaky performance" per Livepeer Foundation Discord. Pricing currently subsidized/free; update promised later. Trial cheaply, don't build critical-path infra on it yet.

---

## Step 1 — Get a Daydream API Key (5 min)

1. Open `app.daydream.live` in browser
2. Sign in (or create account — Google/GitHub auth)
3. Navigate to **Keys** → **New API Key**
4. Name it `zao-claude-code` → Create
5. Copy the key: starts with `sk_...`

Store in `~/.zao/private/livepeer.env`:
```bash
echo 'export DAYDREAM_API_KEY=sk_...' >> ~/.zao/private/livepeer.env
```

---

## Step 2 — Install the MCP in Claude Code (5 min)

Run this in Zaal's terminal (type `! <command>` in Claude Code prompt, or open a new terminal):

```bash
source ~/.zao/private/livepeer.env

claude mcp add livepeer-agent \
  https://storyboard.daydream.monster/api/mcp \
  --transport http \
  --header "Authorization: Bearer $DAYDREAM_API_KEY"
```

**Alternative — install script:**
```bash
curl -fsSL https://storyboard.daydream.monster/install.sh | bash
```

**Verify installation:**

In Claude Code, type `/mcp` — you should see `livepeer-agent` listed with its available tools. Look for `diarized-transcription` and `florence-2-vision` in the tool list.

---

## Step 3 — Test the Diarized-Transcription Runner (5 min)

Use a real ZAO audio file. A short WaveWarZ battle recording or a COC Concertz clip works well.

**Option A: Test with a public audio URL**

In a Claude Code session, ask:
```
Use the livepeer-agent diarized-transcription tool on this audio:
https://[any short MP3 URL]
```

**Option B: Test with a local ZAO recording**

Upload a short audio clip to a publicly accessible URL first (e.g., temporary Cloudinary or Uploadcare link), then use that URL in the Claude Code prompt.

**What a successful response looks like:**

```json
{
  "transcript": [
    {"speaker": "SPEAKER_00", "start": 0.0, "end": 2.3, "text": "Welcome to COC Concertz..."},
    {"speaker": "SPEAKER_01", "start": 2.5, "end": 5.1, "text": "Let me introduce tonight's lineup..."}
  ],
  "language": "en",
  "duration_s": 47.2
}
```

**Log the result** back to this doc (or a follow-up Telegram note) so there's a record of the test.

---

## Step 4 — Test the Florence-2 Vision Runner (Optional, 5 min)

The vision runner scores video frames — useful for the future ZAO clip pipeline (doc 992).

In Claude Code:
```
Use the livepeer-agent florence-2-vision tool on this image:
https://[screenshot URL or frame from COC Concertz recording]

Ask it to: describe the scene, identify people if visible, rate the visual energy level 1-10.
```

This validates whether Florence-2's scene understanding is good enough to auto-detect concert highlight moments (crowd energy, performer movement, visual peak moments).

---

## Step 5 — Cost Report

After testing, check what was spent:

In Claude Code:
```
Use the livepeer-agent get_cost_report tool to see what I've spent.
```

Pricing is subsidized/free in alpha. This is just to understand the cost model before ZAO relies on it for longer recordings.

---

## What to Report Back

After the test, note in Telegram or in this doc:
- [ ] `/mcp` shows `livepeer-agent` installed and tools listed
- [ ] Diarized-transcription returned speaker-labeled JSON (or note failure mode)
- [ ] Florence-2 vision returned scene description (or note failure mode)
- [ ] Cost report: what one transcription costs (currently ~$0 in alpha)
- [ ] Qualitative: speaker labels accurate enough for COC Concertz use case?

---

## ZAO Use Cases (After Alpha Stabilizes)

| Use case | Tool | Status |
|----------|------|--------|
| COC Concertz recording transcripts (searchable, quotable) | `diarized-transcription` | Test now in alpha |
| WaveWarZ battle audio → judge sheet | `diarized-transcription` | Test now |
| COC Concertz video highlight detection | `florence-2-vision` | Validate now; integrate after doc 992 clip pipeline |
| ZAOville (Jul 25) recording → immediate transcript | `diarized-transcription` | Evaluate alpha stability before event |
| ZAOstock (Oct 3) full-day recording → recap | `diarized-transcription` | Plan for stable release |

**Near-term recommend:** Use alpha for COC Concertz post-event transcripts (low stakes, good test data). Do NOT depend on it for ZAOville Jul 25 (alpha is unstable) — have a backup plan (Whisper local or Otter.ai).

---

## Technical Reference

| Item | Value |
|------|-------|
| MCP endpoint | `https://storyboard.daydream.monster/api/mcp` |
| Transport | `http` (HTTP-SSE, not stdio) |
| Auth header | `Authorization: Bearer sk_...` |
| Install script | `curl -fsSL https://storyboard.daydream.monster/install.sh | bash` |
| Docs | `dd.mintlify.app/api/quickstart` |
| Source | `github.com/livepeer/storyboard` |
| Alpha status | Private alpha as of Jul 14, 2026; pricing unconfirmed |
| LIVEPEER_API_KEY | Already set in ZAO env from Studio pilot (doc 932) — separate from Daydream key |

**Note:** The existing `LIVEPEER_API_KEY` (Livepeer Studio) is different from the Daydream `sk_...` API key. You need a separate Daydream key for the MCP; the Studio key won't work.

---

## Sources

- Doc 932: Livepeer ZAO ecosystem deep research (updated Jul 15, 2026 with Agent alpha section)
- Doc 992: ZAO VideoClip highlight-detection pipeline (doc 992 — the downstream use case)
- Board task `ee7bbb98`: "Livepeer Agent MCP — add to Zaal's Claude Code environment, test diarized-transcription runner. Owner: Zaal. By: 2026-07-22."
- Livepeer Foundation Discord: Agent alpha announcement Jul 14, 2026
- `github.com/livepeer/storyboard`: full architecture + install instructions
