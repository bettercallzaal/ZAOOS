---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-04-29
related-docs: 432, 471, 558
tier: STANDARD
---

# 560 - OpenWhisp: Local Speech-to-Text for ZAO Content + Voice Notes

> **Goal:** Decide whether to install OpenWhisp on Zaal's Mac for voice-to-text capture across the ZAO content pipeline (newsletter, 1-pagers, Telegram replies, research notes). Memory `project_research_followups_apr21` lists OpenWhisp as a parked install - this doc unparks it.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Install OpenWhisp on Zaal's MacBook Pro (Apple Silicon) | **YES** | MIT, 138 stars, local-only (no API), runs Whisper Base Multilingual + Ollama-powered text refinement. Hold-Fn-and-speak UX. Removes typing friction for voice-first capture. |
| Use OpenWhisp as the default voice-to-text path for newsletter + 1-pager + Telegram drafts | **YES** | ZAO's content workflow already routes through `/newsletter`, `/onepager`, `/socials` skills. OpenWhisp output drops cleanly into any of them as a starting draft. |
| Pair with Anbeeld's WRITING.md rules (Doc 558) as the "speak first, refine second" pipeline | **YES** | Speak draft -> OpenWhisp polishes -> Doc 558 5-rule check -> ZAO content skill ships final. |
| Use for sensitive / private content (legal, financial, internal) | **YES** | Local-only is the killer feature. No API call leaves the laptop. Aligns with `feedback_oss_first_no_platforms` + `feedback_never_accept_pasted_secrets`. |
| Use for podcast / interview transcription (e.g. BCZ YapZ episodes) | **NOT YET** | OpenWhisp is dictation-mode (Hold Fn). For batch transcription of long audio, vanilla Whisper + a Whisper-server tool is better. Revisit if OpenWhisp adds batch mode. |

## What OpenWhisp Is (Verified 2026-04-29)

| Field | Value |
|---|---|
| Repo | `github.com/giusmarci/openwhisp` |
| License | MIT |
| Stars | 138 |
| Platform | macOS (Apple Silicon recommended) |
| ASR engine | Whisper Base Multilingual (~150 MB) via `@huggingface/transformers` |
| Refinement | Local Ollama LLM (filter levels: No / Soft / Medium / High; styles: Conversation, Vibe Coding) |
| UX | Hold `Fn`, speak, release. Output pasted into focused app. |
| Disk | ~10 GB for models + Ollama |
| Network use | None at runtime (after model download) |

### Install

```bash
git clone https://github.com/giusmarci/openwhisp.git
cd openwhisp
npm install && npm run build:native && npm run dev
```

Native build because of macOS audio-capture bridges. First launch downloads the Whisper model + warms Ollama.

## Why ZAO Wants This

### Use case 1 - Voice-first newsletter draft

Today: Zaal types newsletter posts. `/newsletter` skill drafts in Zaal's voice from a prompt.

With OpenWhisp: Hold Fn, speak the day's idea raw. Release. Get polished prose pasted into the editor. Pipe through `/newsletter` for final voice + structure pass.

Time saved: ~5-10 min per post. Compounds across daily posts.

### Use case 2 - 1-pager + pitch capture

Today: Zaal opens a doc, stares, types.

With OpenWhisp: Speak the pitch as if to a sponsor on the phone. Get clean text. `/onepager` skill structures it.

Direct fit for ZAOstock sponsor outreach (memory `project_zao_stock_team`, `project_zaostock_master_strategy`).

### Use case 3 - Telegram replies (ZAO Stock team, RaidSharks, etc.)

Today: thumb-typing on phone or keyboard sprint at desk.

With OpenWhisp: speak reply, release Fn, send.

Caveat: keep an eye on tone - OpenWhisp's Ollama polish can sand off voice. Use "No Filter" for casual chat, "Medium" for formal.

### Use case 4 - Research note capture

Today: idea hits during a walk, gets lost.

With OpenWhisp on iPhone Voice Memo + AirDrop -> macOS Hold Fn paste: zero loss. Or simpler: Voice Memo -> OpenWhisp transcribes when at desk.

(OpenWhisp itself is desktop-only; iPhone Voice Memo is the mobile capture step.)

## What It's Not

- Not a server-side ASR (use Whisper directly via OpenAI API or self-host whisper.cpp for that)
- Not a real-time live captioning tool (dictation mode only)
- Not a podcast transcriber for hour-long audio (batch mode missing as of 2026-04-29)

For BCZ YapZ episode transcription, keep using whatever current pipeline (likely OpenAI Whisper API per `feedback_oss_first_no_platforms` cost-cheap exception). Revisit if OpenWhisp ships a batch CLI.

## Filter Levels - Pick Defaults

| Level | When to use |
|---|---|
| No Filter | Telegram casual chat, raw research notes |
| Soft | Newsletter draft, internal docs |
| Medium | 1-pager, pitch, public blog draft |
| High | Press release, formal email, board update |

| Style | When |
|---|---|
| Conversation | Default for most ZAO content |
| Vibe Coding | When dictating into code comments / commit messages |

## Pairing with Other ZAO Tools

| Tool | Pair pattern |
|---|---|
| `/newsletter` | OpenWhisp captures raw idea -> `/newsletter` does voice + structure pass |
| `/socials` | OpenWhisp captures core thought -> `/socials` adapts per platform (X, Farcaster, LinkedIn, GCs) |
| `/onepager` | OpenWhisp captures pitch -> `/onepager` formats into ZAOstock template |
| `/inbox` | OpenWhisp drafts replies to ZOE inbox forwards |
| `/clipboard` | OpenWhisp output -> `/clipboard` if sharing externally |
| Anbeeld WRITING.md (Doc 558) | OpenWhisp output -> 5-rule check before publish |

## Risks

| Risk | Mitigation |
|---|---|
| Ollama model on disk consumes ~10 GB | Mac Pro has the space; check before install |
| Whisper Base accuracy < Large for technical jargon | Acceptable for first-pass dictation; final pass via skill |
| `Fn` key already mapped on Zaal's MBP | OpenWhisp may allow rebind; check at install |
| macOS audio-capture permissions | Grant Microphone access on first run |
| Sensitive transcripts cached locally | Verify cache location + add to backup-exclude list |

## Action Bridge

| Action | Owner | Type | By When |
|---|---|---|---|
| Clone + build OpenWhisp on MBP, run first dictation | Zaal | One-shot | Today |
| Verify Apple Silicon performance + Ollama warm-up time | Zaal | Spike | Same |
| Decide default filter level + style (recommended: Soft + Conversation) | Zaal | Config | Same |
| Test OpenWhisp -> `/newsletter` draft loop | Zaal | Workflow | This week |
| Update memory `project_research_followups_apr21` to mark OpenWhisp = installed | Zaal | Memory edit | After install |
| If batch mode ships, re-evaluate for BCZ YapZ transcription | Zaal | Conditional | Quarterly |

## Also See

- [Doc 558 - Anbeeld WRITING.md](../558-anbeeld-writing-md/) - companion polish layer
- [Doc 471 - Vercel OAuth + Claude solo quick wins](../../security/471-) (referenced in memory `project_research_followups_apr21` as parked items)
- Memory `project_research_followups_apr21` - lists OpenWhisp as parked install (this doc unparks it)
- Memory `feedback_oss_first_no_platforms` - aligns with local-first philosophy
- Memory `feedback_never_accept_pasted_secrets` - local-only ASR avoids cloud transcription of sensitive content
- Existing skills: `/newsletter`, `/socials`, `/onepager`, `/inbox`, `/clipboard`

## Sources

- [giusmarci/openwhisp on GitHub](https://github.com/giusmarci/openwhisp) - 138 stars, MIT, ~10 GB disk, fetched 2026-04-29
- `@huggingface/transformers` - bundled Whisper Base Multilingual
- Ollama - local LLM for refinement layer

## Staleness Notes

Watch for batch mode ship + filter-level changes. Re-validate by 2026-07-29 or on major repo update.
