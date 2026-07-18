---
topic: technology, governance, infrastructure
type: research-doc
status: ACTIONABLE — setup takes 10 min; announce recording at Jul 24 Fractal session
last-validated: 2026-07-20
related-docs: 1566-livepeer-agent-mcp-zao-setup, 1560-zao-media-vault-backup-protocol, 665-bonfires-deep-dive-zao-integration
board-tasks: None (responds to "Research doc: ZAO Craig bot idea")
action-owner: Zaal (invites Craig to ZAO Discord); ZOE (starts/stops recording each session)
---

# 1587 — Craig Bot: Automatic Audio Archive for Fractal Democracy Sessions

> **What this is:** Research doc for the board task "Research doc: ZAO Craig bot idea." Craig is a Discord bot that records voice calls with separate per-speaker tracks — exactly what ZAO needs to archive the 64+ Fractal Democracy sessions now and going forward. This doc covers setup, what Craig produces, the integration path to transcription + Bonfire, and the cost.

---

## What Craig Is

**Craig** (`craig.chat`) is the most popular Discord audio recording bot, built specifically for podcast-style multi-track recording. It joins a Discord voice channel on demand, records all speakers simultaneously as separate audio tracks (one file per person), then provides a download link.

**Why Craig matters for ZAO:**
- Every Thursday Fractal Democracy session happens in Discord voice
- 64+ sessions have been recorded on-chain via OREC (governance record) but no audio archive exists
- Craig creates the audio record — the on-chain OREC is the metadata, Craig is the media

**Current state:** ZAO has an OREC on Optimism for every session but zero audio archives. A fire, hard drive loss, or Discord account issue could mean the verbal governance record is gone. Craig fixes this.

---

## What Craig Produces

| Output | Format | What it's good for |
|--------|--------|--------------------|
| Per-speaker FLAC files | `speakers_0.flac`, `speakers_1.flac`, etc. | Highest quality; feed to transcription |
| Mixed MP3 | Single file, all speakers | Quick listen, sharing |
| Per-speaker Opus | Compressed audio | Smaller file, mobile-friendly |
| Per-speaker AAC | Optional | Compatible with iPhones |

**The per-speaker FLAC files are the gold.** With Craig, you get clean audio tracks per speaker — perfect for diarized transcription via Livepeer Agent MCP (doc 1566), which needs audio where speakers are already separated for best accuracy.

---

## Setup: 10 Minutes

### Step 1: Invite Craig to ZAO Discord

Go to `craig.chat` → click "Add to Discord" → select the ZAO Discord server → grant permissions (Connect, Speak, Read Messages in the Fractal Democracy channel).

**Invite URL:** `https://craig.chat/`

### Step 2: Grant Craig Permissions

In the ZAO Discord server settings:
1. Roles → Craig → check: Connect, Speak, Read Text Channels, Use Voice Activity
2. Make sure Craig can see the `#fractal-democracy` or equivalent voice channel

### Step 3: Test Before a Real Session (Do This Week)

In a private Discord voice call:
```
/join
[wait for Craig to join the voice channel]
[have 2 people speak]
/leave
```

Craig will DM you a download link within minutes of stopping.

**What the download link gives you:** A ZIP file with separate FLAC files per speaker and a mixed MP3. Verify the FLAC files have clean audio before the next Fractal session.

---

## Fractal Session Recording Protocol

### Start of Every Session

Before the session opens, ZOE or Zaal runs:
```
/join
```

Craig joins the voice channel and starts recording.

**Announce to participants:** "This session is being recorded by Craig for the ZAO archive. By participating, you consent to the recording. If you don't want to be recorded, you're welcome to turn off your mic or observe via text."

This announcement is standard practice. Fractal participants are governance contributors — they're used to being on the record.

### End of Session

After the closing, run:
```
/leave
```

Craig leaves and sends a DM with the download link. Link is valid for 30 days.

**Before the link expires:** Download the ZIP and save to `~/Documents/ZAO OS V1/Fractal-Archives/[Date]/`.

---

## Integration Path: Craig → Transcript → Bonfire

Once the Craig recording is downloaded, here's the full value chain:

```
Discord Fractal Session
  → Craig multi-track FLAC (speaker-separated)
  → Livepeer Agent MCP diarized-transcription (doc 1566)
  → Speaker-labeled JSON transcript
  → ZOE summarizes key decisions
  → Bonfire episode: "Session [date]: [summary of key decisions]"
  → OREC on Optimism (existing on-chain record, now complemented by text)
```

**Practical workflow (after Livepeer MCP is set up, doc 1566):**

1. Download Craig ZIP after session
2. Extract `speakers_0.flac` (usually the clearest mix)
3. Upload to a temporary public URL (Uploadcare, Cloudinary free tier, or S3)
4. In Claude Code: ask the `livepeer-agent` diarized-transcription tool to process the URL
5. Save the JSON output as `[Date]-fractal-transcript.json` in `~/Documents/ZAO OS V1/Fractal-Archives/`
6. ZOE reads the transcript and writes a 3-5 sentence summary of key decisions
7. ZOE posts the summary as a Bonfire episode: `fractal:2026-07-24:summary`

This workflow takes ~20 min per session after initial setup.

---

## Cost

| Tier | Price | Limits | For ZAO? |
|------|-------|--------|----------|
| Craig Free | $0 | Recording limit: 6 hours/session; bot limited to 1 server at a time | Yes — 6 hours covers any Fractal session |
| Craig Premium | $2/mo | Unlimited recording time; priority support | Worth it if you want auto-recording or longer sessions |

**Recommendation:** Start with Craig Free (zero cost). Upgrade to $2/mo if recording lag or session length becomes an issue.

---

## Alternative: Otter.ai or Granola

The ZOE tasks list also mentions "Sign up Granola Free tier on Mac, run on next standup." Granola is a macOS-native meeting recorder that adds AI notes. Comparison:

| Tool | Platform | Multi-track? | AI notes | Cost |
|------|----------|-------------|----------|------|
| Craig | Discord only | ✅ Yes | ❌ No | Free |
| Granola | macOS native | ❌ No | ✅ Yes | Free tier |
| Otter.ai | Web/macOS | ❌ No | ✅ Yes | $10/mo+ |

**Best combo for ZAO:** Craig for Discord Fractal sessions (multi-track audio archive) + Granola for Zaal's macOS meetings (one-on-one calls, standups). They serve different purposes.

---

## Privacy and Consent Considerations

**Always announce recording at the start of every session.** ZAO's Fractal Democracy is semi-public governance — participants are on-record via OREC already — but audio recording still requires explicit notice.

**Who should have access to Craig archives?**
- FLAC files: Zaal only (raw audio)
- Transcripts: Zaal + core team
- Summary/Bonfire episodes: Public (same as existing OREC)

**Don't post raw FLAC files publicly** — speakers may say things informally that they wouldn't put on the public record. Summaries and key decisions are the right public artifact.

---

## First Session to Try: Jul 24 Fractal Democracy

**Why Jul 24:** The Africa Battle Week charity vote is happening the same day. The Jul 24 Fractal session could include the vote discussion, making it especially valuable to archive. Recording that session creates the first audio entry in the ZAO archive.

**Jul 24 action:** Invite Craig to ZAO Discord before 7pm ET. Start recording at session open with the standard announcement.

---

## Sources

- Craig Discord bot: craig.chat (documentation, invite, pricing)
- Board task: "Research doc: ZAO Craig bot idea"
- Doc 1566: Livepeer Agent MCP setup (diarized-transcription for post-processing)
- Doc 1560: ZAO media vault backup protocol (archive where to store recordings)
- Bonfire skill documentation (episode creation from session summaries)
