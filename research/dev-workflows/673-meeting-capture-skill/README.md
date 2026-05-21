---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-05-21
original-query: Spec Claude Code skill that ingests meeting transcripts recordings Craig Fathom Google Meet Zoom voice memo paste - extracts actions decisions key quotes - distributes to cowork-zaodevz research docs Bonfire Telegram calendar memory (reconstructed)
related-docs: 012, 433, 448, 539, 552, 650, 661, 662, 670, 672
tier: STANDARD
---

# 673 - Meeting Capture Skill Design

> **Goal:** Spec a Claude Code skill that ingests meeting transcripts/recordings (Craig, Fathom, Google Meet, Zoom, Riverside, voice memo, paste), extracts actions + decisions + key quotes, and distributes to the right ZAO surfaces (cowork-zaodevz actions.json, research docs, Bonfire ingest, Telegram, calendar, memory).

## Key Decisions

| # | Decision | Reason |
|---|---|---|
| 1 | **Build as a Claude Code skill at `.claude/skills/meeting/SKILL.md`** — NOT a new bot, NOT a fork of capture.ts | Bot = ZAO Craig (doc 670, separate runtime). Skill = workflow orchestrator that Claude already runs. Reuse existing Claude Code session, zero new infra. |
| 2 | **v1 transcription: Whisper.cpp local OR direct paste** | Free, runs on VPS already. Deepgram (doc 12) is ZAOstock-specific. For Zaal personal/Iman use, Whisper.cpp is enough. Defer Deepgram unless transcript quality blocks. |
| 3 | **v1 distribution: 6 named targets, user-gated per run** | `actions.json` (cowork-zaodevz), research doc (`research/events/NNN-*`), Bonfire ingest queue, Telegram summary DM, memory write, calendar link. Each is optional per meeting. |
| 4 | **Skill scope: single `/meeting` skill with phases (capture → extract → present → distribute)** | NOT 4 sub-skills. Anthropic best practice = one progressive-disclosure entry point; load supporting files as needed (`scripts/transcribe.sh`, `references/output-schemas.md`). |
| 5 | **Project-scoped (`.claude/skills/meeting/`), not personal (`~/.claude/skills/`)** | Distribution targets are ZAO-specific (cowork-zaodevz repo, ZAOOS research dir, ZAOcoworkingBot Telegram). Lives in this repo, version-controlled, ships via PR like other ZAO skills. |
| 6 | **Frontmatter: model-invocable + user-invocable, no auto-trigger gates** | "Pushy" description so Claude fires on "I just had a meeting", "here's a transcript", "process this recording". Per Anthropic doc, undertriggering is the bigger risk. |

## Input modes (v1)

| Mode | Trigger | Pipeline |
|---|---|---|
| Paste-in-chat | Zaal pastes raw text or copies from Fathom/Granola/Zoom summary | skip transcription, go straight to extract |
| Local audio file | `/meeting /path/to/file.m4a` | Whisper.cpp via `${CLAUDE_SKILL_DIR}/scripts/transcribe.sh` → text → extract |
| Voice memo path | `/meeting ~/Documents/voice-memos/2026-05-18.m4a` | same as above |
| Craig URL | `/meeting craig.horse/rec/<id>?key=<key>` | curl download → Whisper → extract |
| Fathom URL | `/meeting fathom.video/share/<id>` | WebFetch to get share-page transcript JSON → extract |
| Telegram voice-note saved to disk | drop into watched folder | same as local audio |
| Discord voice-channel via Craig recording | export through Craig dashboard | same as Craig URL |

Out of scope for v1: live audio capture (= ZAO Craig bot, doc 670), Zoom-native, Riverside cloud (no public transcript API), Google Meet directly (use Fathom or Craig as the recording layer).

## Output schema (extraction)

Claude extracts structured JSON before distribution:

```json
{
  "meeting": {
    "date": "2026-05-18",
    "duration_min": 47,
    "title": "Iman call - ZAO Craig + PizzaDAO Zambia",
    "attendees": ["Zaal", "Iman"],
    "platform": "Telegram voice"
  },
  "decisions": [
    {"id": 1, "text": "Build ZAO Craig bot", "owner": "Zaal", "status": "TODO"},
    {"id": 2, "text": "ZAO Devz fronts $120 if needed", "owner": "Iman", "status": "TODO"}
  ],
  "actions": [
    {"title": "Iman to study RSVPizza repo", "owner": "Iman", "due": "2026-05-22", "category": "WaveWarZ Zambia"},
    {"title": "Pitch PizzaDAO HQ for drinks add-on", "owner": "Iman", "due": "2026-05-22", "category": "WaveWarZ Zambia"}
  ],
  "quotes": [
    {"speaker": "Iman", "text": "The code is ready for phase two in behavior"},
    {"speaker": "Zaal", "text": "Imma make that bot after this meeting"}
  ],
  "research_seeds": ["ZAO Craig live audio + Whisper + autotodo", "PizzaDAO sponsorship proposal format"],
  "memory_updates": [{"slug": "project_zao_craig", "what": "Concept seed - live audio - autotodo bot, doc 670"}]
}
```

## Distribution matrix

For each run, skill asks Zaal which targets to fire. Defaults marked.

| Target | What lands there | Method | Default? |
|---|---|---|---|
| `actions.json` (cowork-zaodevz) | Each `action` becomes an item under correct owner/category | GitHub Contents API PUT (`gh auth token`), bulk append, 1 commit per meeting | YES |
| Research doc (`research/events/NNN-<slug>/README.md`) | Full structured recap (decisions, actions, quotes, context) using doc 670 as the template | Write to repo on a `ws/` branch + PR | YES if >=3 decisions OR explicit ask |
| Bonfire ingest queue | Transcript + recap markdown, secret-scan filtered | Drop file in `content/bonfire-ingest/`, run `scripts/bonfire-ingest/bonfire_client.py` (already exists, PR #568) | OPT-IN |
| Telegram summary | One copyable-bubble msg (no header/footer per `feedback_copyable_content_own_bubble`) to ZAOcoworkingBot DM | bot REST endpoint TBD (Phase 3 doc 672), v1 = manual paste from skill output | OPT-IN |
| Memory write | `project_*` memory for new entities/concepts surfaced | Write to `~/.claude/projects/-Users.../memory/` per existing pattern | OPT-IN |
| Calendar event link | If `meeting.title` matches a Google Cal event, attach recap link in event description | `mcp__claude_ai_Google_Calendar__update_event` | OPT-IN |

## Skill file layout

```
.claude/skills/meeting/
├── SKILL.md                           # 200-300 lines, the entrypoint
├── references/
│   ├── output-schema.md               # full JSON schema + example
│   ├── distribution-targets.md        # how to call each target (actions.json PUT shape, research doc frontmatter, Bonfire format)
│   └── meeting-recap-template.md      # doc 670 distilled as a fillable template
└── scripts/
    ├── transcribe.sh                  # Whisper.cpp wrapper (mac local, or ssh to VPS)
    ├── fetch-craig.sh                 # curl Craig URL + extract audio
    └── append-actions.sh              # Octokit-equivalent in bash (gh api PUT data/actions.json)
```

## Frontmatter (proposed)

```yaml
---
name: meeting
description: Capture meeting transcripts (voice memo, Craig, Fathom, paste) and distribute extracted decisions + action items + quotes to the right ZAO surfaces (cowork-zaodevz actions.json, research docs, Bonfire, Telegram, memory, calendar). Use when the user just finished a meeting, shares a recording or transcript, says "process this call", "extract todos from this", "recap that meeting", or pastes meeting content for analysis.
allowed-tools: Read Write Bash(gh *) Bash(curl *) Bash(whisper *) WebFetch
---
```

`when_to_use` phrases that should fire it (per doc preference: pushy):
- "I just had a meeting"
- "here's the transcript"
- "process this recording"
- "extract todos from this call"
- "recap that meeting"
- "/meeting <path-or-url>"

## Pareto: 3 wires that move 80%

1. **Paste-in-chat → actions.json bulk-append** (zero infra, ships today). The exact path we used at 21:30 UTC to fix the 67-item backlog. Skill formalizes this as a one-command flow.
2. **Local voice-memo → Whisper.cpp → research doc 670-style recap**. Eliminates the manual upload-download-paste loop.
3. **`/meeting` slash-command surface across all input modes**. One command, six inputs, six output targets, user-gated per run.

Everything else (live audio, speaker diarization, calendar auto-link, Bonfire watch folder) is v2.

## What we are NOT building

- Live audio capture bot (= ZAO Craig, doc 670, separate Hermes-pattern runtime).
- Replacing `bot/src/capture.ts` `/gemba /idea /note` (ZAOstock-bot, different surface, different DB).
- Deepgram cloud transcription (doc 12 ZAOstock-only, skill stays free for personal use).
- Real-time speaker diarization in v1 (defer, manual review faster for <10 meetings/wk).
- Auto-create new memories without confirmation (memory writes always confirm).

## Risks

| Risk | Mitigation |
|---|---|
| Whisper local install friction (mac dependencies) | `scripts/transcribe.sh` checks `whisper-cpp` binary, prompts brew install if missing |
| Hallucinated action items (LLM invents owners/dates) | Mandatory user-confirm step before any `actions.json` write. Show extracted JSON in chat first, get OK. |
| Secret leakage via Bonfire ingest | `scripts/bonfire-ingest/secret_scan.py` already filters (PR #568 shipped today) |
| Skill drifts vs ZAO Craig bot when both exist | `references/distribution-targets.md` documents both paths; bot calls skill internally once live |
| `gh auth token` lacks write to cowork-zaodevz | Verified today: `push: true` (commit `c80caff8`) |

## Comparison: 4 reference patterns

| Skill | Pattern Used | What ZAO Borrows | What ZAO Drops |
|---|---|---|---|
| **Anthropic `skill-creator`** | progressive disclosure, references/ scripts/ assets/ | Folder layout, frontmatter format | n/a |
| **dgalarza `process-meeting-transcript`** (Granola-focused) | structured frontmatter output, action item extraction, "capture commitments + technical details" | Output JSON schema, commitment-capture prompt | Granola-only assumption |
| **ComposioHQ `meeting-insights-analyzer`** | 6-step workflow (discover→clarify→analyze→examples→synthesize→follow-up), pattern recognition (conflict avoidance, speaking ratios) | 6-step workflow scaffold; quote-with-context pattern | Behavioral analysis (overkill for ZAO use case) |
| **ZAOOS `/inbox`** (existing sibling) | sender whitelist + label-folder routing | Routing logic per output target | Email-only triggers |

## Also See

- [Doc 012 - ZAOstock meeting AI](../../events/_zaostock-hub/12-meeting-ai.md) - Deepgram + Claude + Telegram Pareto for ZAOstock; this skill is the personal/Iman complement
- [Doc 433 - ZAO media capture pipeline spec](../433-zao-media-capture-pipeline-spec/) - upstream concept (empty stub, this doc supersedes for skill scope)
- [Doc 539 - grill-me skill specs-to-code](../539-grill-me-claude-skill-specs-to-code/) - skill design methodology
- [Doc 552 - ZAO skill library audit](../552-zao-skill-library-audit/) - sibling skill inventory; new skill slots in alongside /inbox /reflect /morning
- [Doc 661 - ZAOcoworkingBot go-live](../../agents/661-zaocoworkingbot-go-live/) - downstream Telegram surface
- [Doc 670 - Iman call May 18 (ZAO Craig)](../../events/670-iman-call-may18-craig-pizzadao/) - bot version of this idea (live audio); this skill is the workflow version, ZAO Craig is the live-capture runtime
- [Doc 672 - ZAOcoworkingBot post-v2.13 audit](../../agents/672-zaocoworking-bot-audit-postv213/) - downstream consumer of actions.json bulk-append pattern proven 2026-05-18

## Execution Status (Re-verified 2026-05-21)

| # | Action | Status | Ship Date |
|---|---|---|---|
| 1 | v1 scope locked | COMPLETE | 2026-05-18 |
| 2 | `.claude/skills/meeting/SKILL.md` + scripts | SHIPPED | PR #570 merged 2026-05-18 |
| 3 | QA on doc 670 transcript + live testing | COMPLETE | 2026-05-18-20 (8 meeting docs created) |
| 4 | PR merged to main | SHIPPED | PR #570 merged 2026-05-18 22:09 UTC |
| 5 | Phases 0-6 shipped (Phase 0 copy-paste, Phases 2.5/3/6 clipboard+ask, all others deferred) | LIVE | 2026-05-20 (git commit `0670384b`) |
| 6 | ZAO Craig live-audio bot (doc 670) | IN PROGRESS | Planned separate runtime |

**MATERIAL CHANGE:** This doc transitioned from "specification" (May 18) to "live implementation" (May 20). Skill is DEPLOYED. See git commit hashes in CLAUDE.md line 47-58 for exact Phase rollout dates.

## Locked decisions (2026-05-18)

| Q | Decision |
|---|---|
| Skill name | `/meeting` |
| Research-doc trigger | Always (every meeting → `research/events/NNN-*`) |
| Telegram method v1 | Print copy-paste block (no bot API dep) |
| Whisper host | Iman's VPS via SSH (no local mac install) |
| Memory writes | Confirm-before-write on every memory (safe default) |

## VPS bootstrap (one-time)

Whisper not yet installed on Iman VPS as of 2026-05-18. Skill preflights, prints exact install:

```bash
ssh root@187.77.3.104 'apt-get install -y ffmpeg && pip install openai-whisper'
```

Then warm cache:
```bash
ssh root@187.77.3.104 'whisper --model base --language en /dev/null 2>/dev/null || echo "model download starts on first real run"'
```

## Sources

- [Claude Code skills docs](https://code.claude.com/docs/en/skills) - SKILL.md structure, frontmatter, progressive disclosure (last-checked 2026-05-18)
- [Anthropic skill-creator on GitHub](https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md) - reference implementation patterns
- [The Complete Guide to Building Skills for Claude (PDF)](https://resources.anthropic.com/hubfs/The-Complete-Guide-to-Building-Skill-for-Claude.pdf) - Anthropic official guide
- [ComposioHQ meeting-insights-analyzer SKILL.md](https://github.com/ComposioHQ/awesome-claude-skills/blob/master/meeting-insights-analyzer/SKILL.md) - 6-step workflow + pattern recognition reference
- [dgalarza process-meeting-transcript](https://claude-plugins.dev/skills/@dgalarza/claude-code-workflows/process-meeting-transcript) - Granola → structured notes pattern
- [glebis/claude-skills](https://github.com/glebis/claude-skills) - skill collection
- ZAOOS internal: [bot/src/capture.ts](../../../bot/src/capture.ts), [scripts/bonfire-ingest/](../../../scripts/bonfire-ingest/), [Doc 670](../../events/670-iman-call-may18-craig-pizzadao/README.md), [Doc 672](../../agents/672-zaocoworking-bot-audit-postv213/README.md)
