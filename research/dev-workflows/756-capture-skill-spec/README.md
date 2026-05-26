---
topic: dev-workflows
type: skill-spec
status: research-complete
last-validated: 2026-05-25
related-docs: "670, 673, 676, 753"
original-query: "/meeting Reel was mis-routed - spawn /capture skill distinct from /meeting for content-source captures (Reels, YouTube, articles, podcasts)"
tier: STANDARD
spawned-from: "doc 753 - pjdlifts ADVANCED Reel mis-routed through /meeting"
skill-location: "~/.claude/skills/capture/SKILL.md (local, not in this repo)"
---

# 756 - /capture skill spec - content-source captures distinct from /meeting

> **Goal:** Document the design + decisions behind the new `/capture` skill so future Claude sessions know why it exists, how it differs from `/meeting`, and what the file shapes are. The skill itself lives at `~/.claude/skills/capture/SKILL.md` (local user-global, mirrors /meeting + /clipboard + other Zaal-personal skills); this doc is the canonical ZAO-repo trace.

---

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **Spawn `/capture` as a sibling to `/meeting`** rather than overload /meeting with content-as-source mode. | doc 753 proved /meeting cannot honestly handle content captures - its hard guardrail bans inventing attendees / decisions / actions, but content (Reels, YouTube, articles, podcasts) has none of those. Forcing the flow either produces fake data or breaks the skill's own rules. A sibling skill is cleaner than a mode flag. |
| 2 | **Reuse /meeting scripts, do NOT duplicate.** /capture calls `~/.claude/skills/meeting/scripts/transcribe.sh` + `extract-frames.sh` directly. | mlx-whisper local-first transcription + ffmpeg frame extraction are pure utilities. Duplicating them creates drift (e.g., the Doc 709 catastrophic-loop fix had to land in one place; /capture should inherit it for free). Skip `diarize.sh` for captures since they are typically single-speaker. |
| 3 | **New output path: `research/captures/NNN-<slug>/`** (parallel to `research/events/`). NOT under events/. | events/ is meeting recap territory; the meetings-index.md "every meeting" rule would be violated by mixing in captures. Captures get their own index, their own routing, their own type frontmatter. |
| 4 | **Doc 753 stays in events/ as historical artifact** (do not retro-move). | The case that spawned the skill should not be erased - it serves as the worked example. New captures from 2026-05-25 onward route to `research/captures/`. If a batch-rehome ever happens, that is a separate Zaal-approved migration; default = leave it. |
| 5 | **Default OFF: Bonfire, Airtable, tracker, Telegram block, calendar.** Default ON: only the recap doc + captures-index. | Captures of anonymous productivity gurus pollute the Bonfire graph and create CRM contact rows for people Zaal will never meet. Tracker actions from captures are self-imposed personal todos that do not belong on the team Kanban. Opt-in flags (`--bonfire`, `--tracker`, `--clipboard`) flip them on for the rare capture that warrants it. |
| 6 | **Required field: `framework_or_claim` with verbatim quotes per component.** Captures live or die on accurate verbatims; paraphrase = noise. | The whole value-add of /capture vs a raw transcript dump is the structured framework + the verbatim quote that lets Zaal re-find / re-quote the source. If you can't name a framework, the content probably isn't worth capturing - the skill prompts "no clear framework, skip?" before writing. |
| 7 | **Required section: `maps_to_zaal_stack`** - cross-check every component against `~/.claude/projects/.../memory/` and ZAO research docs. | Doc 753 demonstrated this: mapping ADVANCED letters against `user_zaal_schedule.md` surfaced the genuine gap (5-7pm dip protocol missing). Without the cross-check, a capture is just a re-typed transcript. With it, the capture is actionable personal-planning input. |
| 8 | **Inverse heuristic: /capture detects multi-speaker, suggests `/meeting` re-route. /meeting detects single-speaker monologue, suggests `/capture` re-route.** | The two skills should be a checked pair, not silo'd. Today's case (doc 753) required Zaal to manually re-route mid-flow; the inverse heuristic catches both directions automatically going forward. Implementation lives in each skill's Phase 0.5. |

## What `/capture` does NOT do

These are deliberate skips, not gaps - documenting them prevents future "should we add X?" scope creep:

| Surface | Why skipped |
|---|---|
| Telegram copy-paste block | Captures are personal, not shared. If Zaal wants to share a captured framework, that's a `/socials` post, not a /capture target. |
| Airtable CRM write | No real attendees. Adding "ZAO CRM contact: @pjdlifts" would be noise; Zaal isn't tracking creators-he-watched as relationships. |
| Calendar event update | Not applicable - no event happened. |
| Meetings index entry | Different artifact, different invariant. Captures get `_captures-index.md`. |
| Auto-watcher on `~/Movies/` | False-positive risk: every screen-recording, every meeting Craig dump, every QuickTime test would trigger. Explicit `/capture <path>` only. |
| `decisions[]` extraction | The creator made claims, Zaal hasn't decided anything yet. Decisions are a /meeting concept. /capture has `framework_or_claim` instead. |

## Skill file layout

```
~/.claude/skills/capture/
  SKILL.md                              # the skill itself (frontmatter + flow)
  references/
    capture-template.md                 # the recap-doc shape (modeled on doc 753)
  scripts/                              # empty for v1 - reuses /meeting scripts
```

## Repo file layout (ZAOOS)

```
research/captures/
  _captures-index.md                    # one canonical list of every capture, auto-maintained
  NNN-<slug>/
    README.md                           # the capture doc
    [transcript.md]                     # optional, if transcript is long
```

The `research/captures/` folder is created the first time `/capture` runs in this repo. Empty seed not committed; the skill's "create file if missing" logic handles it.

## Comparison vs `/meeting`

| Dimension | /meeting | /capture |
|---|---|---|
| Input type | Human-to-human call (voice memo, Craig, Fathom, paste, recording) | Content-as-source (Reel, YouTube, podcast, article, recording of a creator) |
| Extraction primitive | `decisions[]`, `actions[]`, `quotes[]`, `attendees[]` | `framework_or_claim`, `key_quotes[]`, `maps_to_zaal_stack[]` |
| Output folder | `research/events/NNN-<slug>/` | `research/captures/NNN-<slug>/` |
| Index | `research/events/_meetings-index.md` | `research/captures/_captures-index.md` |
| Bonfire | Default ON (per doc 680) | Default OFF (opt-in `--bonfire`) |
| Airtable CRM | Default ON if env present (per doc 737) | Always OFF |
| Tracker writes | Default ON for ZAO Devz project (per doc 713) | Default OFF (opt-in `--tracker` for self-imposed actions) |
| Telegram block | Opt-in | Skipped entirely |
| Clipboard | Default ON for next-actions (Phase 6) | Opt-in `--clipboard` |
| Diarization | Yes - speaker labels matter | No - single-speaker assumption |
| Frame extraction | Yes (12 cap) | Yes (12 cap) - same script |
| Calendar update | Opt-in | Skipped |

## Spawn case

Doc 753 (`research/events/753-pjdlifts-advanced-acronym-reel-capture/`) - Zaal screen-recorded an Instagram Reel by @pjdlifts on 2025-12-15 during productivity-planning mode. Five months later (2026-05-25) Zaal asked `/meeting` to process the recording. The skill correctly identified it as not-a-meeting and asked Zaal to confirm routing; Zaal picked "content-capture note" route, and the doc was filed under `research/events/` because `research/captures/` did not yet exist.

That session was the proof. This skill exists so the next session does it automatically.

## What still needs to happen (not in scope for this doc)

| Item | Owner | Type |
|---|---|---|
| First real `/capture` invocation on new content - validates the skill end-to-end. | @Zaal | Personal test |
| Patch `/meeting` skill to add Phase 0.5 inverse heuristic (suggest /capture for single-speaker monologue input). | @Zaal | Skill PR |
| Decide whether to retro-move doc 753 to `research/captures/753-.../`. Default: leave it; documenting the spawn case in-place is more honest. | @Zaal | Migration decision |
| If /capture proves load-bearing, write `evals/` fixture set after 5+ real captures. | @Zaal | Skill maturity |

## Also See

- [Doc 670 - Meeting recap gold standard](../../events/670-...) (closest doc number; verify slug)
- [Doc 673 - Meeting capture skill design](../../events/673-...) - the design doc /capture inherits from
- [Doc 676 - Skill engineering best practices](../../events/676-...) - multi-pass extraction, confidence thresholding (only partially applicable since /capture is single-pass)
- [Doc 680 - Bonfire always-on episode posting](../../agents/680-...) - why /meeting defaults Bonfire ON and /capture defaults OFF
- [Doc 713 - Cowork tracker actions.json migration](../../agents/713-...) - why /meeting writes to Supabase tracker
- [Doc 737 - Airtable agentic CRM v3](../../business/737-airtable-agentic-crm-v3/) - why /meeting writes contacts + activity; why /capture does not
- [Doc 753 - ADVANCED Reel capture](../../events/753-pjdlifts-advanced-acronym-reel-capture/) - the spawn case

## Sources

- [Doc 753 README](../../events/753-pjdlifts-advanced-acronym-reel-capture/README.md) [FULL - read in this session]
- [/meeting SKILL.md](file:///Users/zaalpanthaki/.claude/skills/meeting/SKILL.md) [FULL - read in this session as the routing reference]
- [/capture SKILL.md (just-written)](file:///Users/zaalpanthaki/.claude/skills/capture/SKILL.md) [FULL - this doc is its companion]
- [/capture references/capture-template.md](file:///Users/zaalpanthaki/.claude/skills/capture/references/capture-template.md) [FULL]
- CLAUDE.md Primary Surfaces section [FULL - confirmed /capture is a skill (Zaal-personal workflow) not a new bot (would violate "no new bots without doc" rule)]

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Test `/capture` on next screen-recorded content - validates end-to-end. | @Zaal | Personal | Next time content worth capturing surfaces |
| Patch `/meeting` Phase 0.5 to suggest /capture re-route on single-speaker input. | @Zaal | Skill PR | After 2-3 /capture runs prove the pattern |
| Decide retro-move of doc 753 to `research/captures/`. | @Zaal | Repo migration | Whenever convenient (default: never) |
| If pattern recurs across 5+ captures, write `evals/` fixtures + harden the framework-extraction prompt. | @Zaal | Skill v2 | After v1 has 5 real captures |
