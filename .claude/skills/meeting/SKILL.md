---
name: meeting
description: Capture meeting transcripts (voice memo, Craig recording, Fathom URL, paste-in-chat) and distribute extracted decisions, action items, and key quotes to the right ZAO surfaces - cowork-zaodevz actions.json, a research/events/NNN-* recap doc, the ZABAL Bonfire knowledge graph, a meetings index, Telegram copy-paste block, memory, and calendar. Use when the user just finished a meeting, shares a recording or transcript, says "process this call", "extract todos from this", "recap that meeting", or types "/meeting <path-or-url>". Always fires on meeting context - undertriggering wastes the capture.
allowed-tools: Read Write Edit Bash WebFetch Skill AskUserQuestion
---

# /meeting - ZAO Meeting Capture

Turn any meeting recording or transcript into:
- Action items in the right project's tracker (cowork-zaodevz `actions.json`, ZAOstock bot - routed in Phase 0)
- A research recap doc in `research/events/NNN-<slug>/README.md` (always ZAOOS, per doc 673)
- A row in `research/events/_meetings-index.md` - the one canonical list of every past meeting
- A copy-paste Telegram bubble for sharing
- A next-actions clipboard page the moment the meeting ends (Phase 6)
- Episodes posted to the ZABAL Bonfire knowledge graph - always-on, so the graph always has full meeting context (doc 680)
- Optional memory write, calendar update

One command, multiple inputs, project-routed output targets. User-gated per run.

Doc 673 has full design + decisions. Read it if context is needed beyond this file.

## When to fire

- Zaal pastes a transcript, meeting notes, or "Iman just said X, Y, Z" dump
- Zaal types `/meeting <path-or-url>`
- Zaal says "I just had a call with...", "process this recording", "extract todos from this call", "recap that meeting"
- Zaal shares a `craig.horse`, `fathom.video`, voice memo path, or audio file path

Undertriggering is the bigger risk. Fire on weak signal; ask one clarifier before doing destructive writes.

## When NOT to fire

- Live audio capture / real-time transcription = the ZAO Craig bot (doc 670), a separate runtime. This skill is post-meeting only.
- ZAOstock `/gemba /idea /note` quick-notes = `bot/src/capture.ts`, different DB. Not this skill.
- A general "summarize this article/doc" request with no meeting context.

## Input detection

Look at what the user supplied (the slash-command argument, a pasted block, or just chat context) and pick the mode:

- **craig_url** - the input is a URL starting `https://craig.horse/`
- **fathom_url** - the input is a URL starting `https://fathom.video/`
- **local_audio** - the input is a path ending `.m4a` / `.mp3` / `.wav` / `.mp4` / `.mov` / `.opus` and the file exists. A video file (mp4/mov) additionally triggers frame extraction - see Phase 1.
- **paste** - the input (or the last user message) is a block of transcript / meeting-notes text, roughly 200+ chars. Also covers the user narrating the meeting in chat ("Iman said X, then Zaal said Y...") - use the conversation context as the transcript.
- **unclear** - none of the above. Ask the user one question: paste the transcript, give a file path, or give a Craig/Fathom URL.

Do not echo the raw argument back into a table - just classify it and proceed.

## Phase 0 - Project routing

A meeting belongs to a project. The project decides WHERE actions + the Telegram summary go. Ask Zaal in Phase 3 if not obvious; infer from attendees + topic if it is.

| Project | Action target | Telegram target | Recap doc |
|---|---|---|---|
| **ZAO Devz / general** (default) | cowork-zaodevz `data/actions.json` (GitHub PUT) | @ZAOcoworkingBot DM | ZAOOS `research/events/` |
| **ZAOstock** | paste-block for @ZAOstockTeamBot (its tasks live in ZAOstock Supabase, not GitHub) | @ZAOstockTeamBot group | ZAOOS `research/events/` + cross-link in `research/events/_zaostock-hub/` |
| **ZAO OS dev** | recap doc action table only (no external tracker) | none | ZAOOS `research/events/` |
| **BCZ / WaveWarZ / other** | recap doc action table only | none | ZAOOS `research/events/` |

**Rule that does NOT change per project: the recap doc ALWAYS lands in ZAOOS `research/events/`.** Research is permanent institutional memory and never graduates out of ZAOOS (CLAUDE.md monorepo-as-lab). One repo = one searchable archive of every meeting, across every project. Do not scatter recaps into graduated repos.

What DOES route per project is the **action tracker** and the **Telegram destination**. A ZAOstock meeting's todos belong in the ZAOstock tracker, not the cowork-zaodevz tracker.

## Phase 1 - Acquire transcript

### Mode: paste
Use the pasted text directly. Skip Phase 1.

### Mode: local_audio (audio OR video file)

The file is on Zaal's mac. Transcription runs locally - no upload, no VPS round-trip.

**Step 1 - extract video frames (video files only).** If the file has a video
stream (mp4, mov), pull representative still frames first. Frames give the
Phase 2 extraction passes visual context the audio cannot: shared slides,
screenshares, whiteboards, and the call UI's participant name tags.

```bash
bash ${CLAUDE_SKILL_DIR}/scripts/extract-frames.sh "$MEDIA_PATH"
```

The script prints a frames directory path, or the literal `NO_VIDEO` for an
audio-only file (then skip straight to Step 2). Scene-change detection catches
slide flips and screenshare switches; a fixed-interval fallback covers static
talking-head calls. Capped at 24 frames. Keep the frames dir path for Phase 2.

**Step 2 - transcribe.**

```bash
bash ${CLAUDE_SKILL_DIR}/scripts/transcribe.sh "$MEDIA_PATH"
```

The script is local-first:
1. If `mlx-whisper` is installed (Apple Silicon), it transcribes locally with
   `whisper-large-v3-turbo` - fast, offline, accurate on names. Handles mp4/mov
   directly (ffmpeg strips the audio track). First run for a model downloads it.
2. If local tooling is absent (non-Mac machine), it falls back to Whisper on
   Iman's VPS - SCP up, transcribe, SCP the `.txt` back.

One-time local setup: `uv tool install mlx-whisper`. For a hard-to-hear or
many-name meeting, pass a bigger model:
`transcribe.sh "$MEDIA_PATH" --model mlx-community/whisper-large-v3`.

### Mode: craig_url
Download Craig recording, transcribe.

```bash
bash ${CLAUDE_SKILL_DIR}/scripts/fetch-craig.sh "$CRAIG_URL"
# outputs /tmp/craig-<id>.flac
bash ${CLAUDE_SKILL_DIR}/scripts/transcribe.sh "/tmp/craig-<id>.flac"
```

### Mode: fathom_url
Use WebFetch on the share URL to extract transcript JSON from the page. Fathom share pages typically embed transcript in JSON-LD or a script tag. If WebFetch returns no transcript, ask Zaal to paste it manually.

## Phase 2 - Extract structure

Multi-pass extraction, NOT one monolithic prompt (doc 676 - monolithic extraction hallucinates). Run these passes in order, each over the same transcript:

**Video input - read the frames first.** If Phase 1 produced a frames directory,
`Read` every JPG in it before Pass A. Use what the frames show - slide text,
shared screens, whiteboards, participant name tags - as corroborating context
across all five passes: they disambiguate attendees (Pass A), surface decisions
shown on a slide but not said aloud (Pass B/C), and confirm name spellings
against the brand glossary. A frame is corroboration, never a substitute for the
transcript - if a frame and the transcript conflict, the transcript wins and the
item is flagged `confidence: low`.

1. **Pass A - meeting metadata.** date, duration, title, attendees, platform. Date never invented - from transcript, file mtime, or ask.
2. **Pass B - decisions.** Things explicitly decided/agreed in the call. Verbatim-anchored.
3. **Pass C - actions.** Concrete follow-ups with an owner. One owner each.
4. **Pass D - quotes.** 3-8 load-bearing verbatim quotes.
5. **Pass E - research seeds + memory updates.** New topics / new entities only. Before deciding `memory_updates`, run an entity cross-check (see below) - a name already documented gets LINKED, not re-created.

Output one JSON object matching the schema in [references/output-schema.md](references/output-schema.md):

```json
{
  "meeting": {
    "date": "YYYY-MM-DD",
    "duration_min": 0,
    "title": "...",
    "attendees": ["..."],
    "platform": "Telegram voice | Google Meet | Zoom | in-person | Discord/Craig | Fathom"
  },
  "decisions": [
    {"id": 1, "text": "...", "owner": "Zaal|Iman|Both|ThyRev|Samantha", "status": "TODO", "confidence": "high|medium|low"}
  ],
  "actions": [
    {"title": "...", "owner": "...", "due": "YYYY-MM-DD or empty", "category": "Site / Tech|Ops|WaveWarZ Zambia|ZAO Devz|Bounty|Social|Other", "confidence": "high|medium|low"}
  ],
  "quotes": [
    {"speaker": "...", "text": "..."}
  ],
  "research_seeds": ["topic 1", "topic 2"],
  "memory_updates": [{"slug": "project_xyz", "what": "what changed and why"}]
}
```

**Rules for extraction:**
- Verbatim where possible for quotes. No paraphrasing of decisions.
- Every decision + action carries a `confidence` field:
  - `high` - explicit in transcript, clear owner, clear intent.
  - `medium` - implied or owner/scope slightly fuzzy.
  - `low` - inferred, ambiguous owner, or transcript span was garbled.
- If owner is ambiguous, set `owner: "Both"` + `confidence: "low"` and surface it in Phase 3. Never guess a specific owner.
- If due date is ambiguous, leave empty + `confidence: "medium"` or lower. Never invent. Relative dates ("by Thursday") -> absolute, anchored to `meeting.date`.
- Category must come from the enum above (matches actions.json schema).
- 3-8 quotes max - pick load-bearing ones (decisions, commitments, surprising info).
- `memory_updates` only if a NEW person, project, or strategy decision appeared (not for things already in `~/.claude/projects/.../memory/MEMORY.md`).
- Never silently drop an uncertain item. A `low`-confidence item still goes in the JSON - Phase 3 surfaces it for Zaal.

### Entity cross-check (Pass E)

For EVERY attendee and every referenced person/project name, before deciding it is "new":

```bash
grep -ril "<name>" "/Users/zaalpanthaki/Documents/ZAO OS V1/research/" 2>/dev/null | head -3
grep -i "<name>" ~/.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/MEMORY.md
```

- **Hit in research/** - the entity exists. Link the doc number in the recap (e.g. "Tyler Stambaugh, doc 473"). Do NOT create a memory.
- **Hit in MEMORY.md** - the entity has a memory. Link `[[slug]]`. Do NOT create a duplicate.
- **No hit anywhere** - genuinely new. Add a `memory_updates` entry.

This stops the skill re-introducing known people as if they were new (test run 1 missed Tyler Stambaugh = doc 473).

## Phase 2.5 - Clarify gaps

Before the Phase 3 confirm, scan the extraction for genuine gaps and ask Zaal about them in ONE batched question round. Ask only when the answer changes the doc - not for things you can infer.

Ask about:
- A referenced person with zero context AND no hit in the Pass E cross-check (who are they, what role).
- A decision/action where the owner is genuinely unknown (not just "Both").
- A name that could be a mis-transcription (surface both spellings).
- A project-routing call that is not obvious from attendees + topic.

If the extraction is clean and nothing is genuinely ambiguous, skip Phase 2.5 and go straight to Phase 3. Do not invent questions to fill the phase. Zaal has said he is fine with the skill asking questions when they are real - so ask the real ones here, before the confirm, not after.

## Phase 3 - Present + confirm

Show the extracted JSON inline as a markdown table for each section (decisions, actions, quotes).

**Before the confirm prompt, render a VERIFY block** listing every `confidence: low` (and optionally `medium`) decision + action:

```
VERIFY - low-confidence extractions, confirm or correct each:
- [action] "<title>" - owner unclear, transcript said "..."
- [decision] "<text>" - inferred, not explicit
```

If the VERIFY block is non-empty, Zaal must resolve those items before any actions.json write. Do not write low-confidence items unedited.

Then ask Zaal:

> "Extracted N decisions, M actions, K quotes (J flagged to verify above).
> Project: <inferred project> - correct? (ZAO Devz / ZAOstock / ZAO OS / other)
> Edits? If clean, which targets fire?"
>
> Targets (action target depends on project - see Phase 0):
> - [x] Action tracker for `<project>` (default ON)
> - [x] research/events/NNN-<slug>/README.md (default ON, every meeting, always ZAOOS)
> - [x] Bonfire knowledge-graph episodes (default ON - the graph should always have meeting context, doc 680)
> - [ ] Telegram copy-paste block (opt-in, default OFF - print only on request)
> - [ ] Memory writes (opt-in, confirm each)
> - [ ] Calendar event update (opt-in if title matches a Google Cal event)

Wait for Zaal's reply before any destructive write. Confirm the project before touching any tracker - a ZAOstock meeting must not write into the cowork-zaodevz tracker.

## Phase 4 - Distribute

For each enabled target, follow the playbook in [references/distribution-targets.md](references/distribution-targets.md). Summary:

### Action tracker (routed by project - Phase 0)

**Project = ZAO Devz / general:** write to cowork-zaodevz `data/actions.json`.
```bash
bash ${CLAUDE_SKILL_DIR}/scripts/append-actions.sh /tmp/extracted-actions.json
```
Script reads the actions array, fetches current `data/actions.json` from GitHub, appends new items starting at `max(existing.id) + 1`, PUTs back via `gh api` with sha. One commit per meeting.

**Project = ZAOstock:** do NOT write to cowork-zaodevz. ZAOstock tasks live in the ZAOstock Supabase behind @ZAOstockTeamBot. v1: print a paste-block of the action items for Zaal to drop into @ZAOstockTeamBot (`/note` or task command). Also note them in the recap doc's action table. (v2: a `zaostock-actions.sh` that inserts into ZAOstock Supabase via service-role key - deferred until the ZAOstock task schema is confirmed.)

**Project = ZAO OS / BCZ / WaveWarZ / other:** no external tracker. Actions live only in the recap doc's action table.

### research/events/NNN-<slug>/README.md
- Find next number: `find research -maxdepth 3 -type d -name '[0-9]*' | grep -oE '/[0-9]+' | tr -d '/' | sort -n | tail -1`
- Slug from meeting title: lowercase, hyphens, no special chars, max 50 chars.
- Use the template at [references/meeting-recap-template.md](references/meeting-recap-template.md). Doc 670 is the gold-standard worked example.
- **Raw transcript goes in a SEPARATE file**, not inline in the README. Write the full transcript to `research/events/NNN-<slug>/transcript.md`. The README's "Transcript" section is a one-line link: `Full transcript: [transcript.md](transcript.md)`. Keeps the recap README lean and grep-friendly; a 10k-word transcript inline buries the signal.
- Write both files, do NOT commit yet - leave for Zaal review in current `ws/` branch.

### Meeting index (always - every run)

Prepend a row to `research/events/_meetings-index.md` so there is ONE canonical list of every meeting ever captured. This is the answer to "show me all past meetings" - a single grep-free file, newest first.

If `research/events/_meetings-index.md` does not exist, create it with this header:

```markdown
# Meetings Index

Every meeting processed by /meeting, newest first. Maintained automatically by the skill.

| Date | Title | Project | Attendees | Doc | Actions |
|------|-------|---------|-----------|-----|---------|
```

Then insert the new meeting as the first data row:

```
| 2026-05-19 | ZAOstock advisor call | ZAOstock | Zaal, failoften | [678](678-zaostock-advisor-call-may19/) | 12 |
```

This is not optional and not project-routed - every meeting, every project, one index. Commit it alongside the recap doc.

### Bonfire knowledge-graph episodes (always-on - doc 680)

Post the meeting into the ZABAL Bonfire so the knowledge graph always has full context. This is default-ON, not opt-in.

Build an episodes JSON file at `/tmp/meeting-bonfire-episodes.json`:

```json
{
  "episodes": [
    {"name": "meeting:<date>:summary", "body": "<one paragraph: title, date, attendees, project, what it covered>", "source_tag": "meeting:<slug>"},
    {"name": "meeting:<date>:decision-1", "body": "In the <title> meeting on <date> (<attendees>), the team decided: <decision text>. Owner: <owner>.", "source_tag": "meeting:<slug>"},
    {"name": "meeting:<date>:action-1", "body": "From the <title> meeting on <date>, <owner> is to <action title>. Due: <due or 'no date set'>.", "source_tag": "meeting:<slug>"}
  ]
}
```

- One summary episode + one per decision + one per action. Quotes are skipped (low KG value as standalone nodes).
- Episode bodies are natural-language prose, self-contained (name the meeting + date + people) - Bonfires auto-extraction reads prose, and a node must make sense alone.
- Then run:

```bash
bash ${CLAUDE_SKILL_DIR}/scripts/bonfire-episode.sh /tmp/meeting-bonfire-episodes.json
```

The script POSTs each episode to `POST /knowledge_graph/episode/create` (Bearer `$BONFIRE_API_KEY`, `$BONFIRE_ID`). It is best-effort: secret-scans every body, 15s timeout per POST, always exits 0 - a Bonfire failure never aborts the run. If `$BONFIRE_API_KEY` is unset it prints "skipped (no key)" and continues.

Do NOT use the old `content/bonfire-ingest/` file path - that is the bulk-backfill pipeline (research library, READMEs), wrong tool for per-meeting real-time. See doc 680.

### Telegram copy-paste block
Print a single fenced block ready for long-press-copy. No header/footer (per `feedback_copyable_content_own_bubble`). Format:

```
[Meeting] <title> · YYYY-MM-DD · <attendees>

Decisions:
1. <text> (owner: X)
2. ...

Actions:
- <title> (owner: X, due: YYYY-MM-DD)
- ...

Key quotes:
"<quote>" - speaker
```

### Memory writes
For each `memory_updates` entry, show the proposed memory file content first. Get Zaal's OK per entry. Then write to `~/.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/<slug>.md` with proper frontmatter (see existing memories for format). Update `MEMORY.md` index with one-line entry.

### Calendar event update
Use `mcp__claude_ai_Google_Calendar__list_events` to find an event matching `meeting.title` and `meeting.date`. If found, `update_event` to append "Recap: <link to research doc on GitHub>" to description. If not found, skip silently.

## Phase 5 - Report

Print to user a one-line per-target summary. `[OK]` = done, `[--]` = skipped. One line per target that exists this run:

```
[OK] Actions - <N> items -> <tracker> (cowork-zaodevz commit <sha> | ZAOstock paste-block)
[OK] Recap doc - research/events/<NNN>-<slug>/README.md - draft written, review before commit
[OK] Transcript - research/events/<NNN>-<slug>/transcript.md
[--] Bonfire - skipped
[OK] Telegram - block printed above
[OK] Memory - <N> entries (<slugs>)
[--] Calendar - no matching event
[OK] Clipboard - next-actions page opened
```

Use the real values from this run. Do not copy the placeholders. The recap-doc number must be the one actually used (collision-safe pick, not a guess).

Then suggest the natural next step: "Review research doc at <path>. Commit + PR when ready, or want me to ship it as a PR off ws/<branch> now?"

## Phase 6 - Next-actions clipboard (default ON)

After the report, auto-hand-off the next-actions to the `/clipboard` skill so Zaal has a clean copyable page the moment the meeting ends. This is the "what do I do now" surface - distinct from the Telegram block (which is for sharing the recap).

Build a plain next-actions list - owner-grouped, due-sorted:

```
Next actions - <meeting title> (<date>)

ZAAL
- <action> (due <date>)
- <action>

IMAN
- <action> (due <date>)

BOTH
- <action>
```

Then invoke the `/clipboard` skill with that list as the content. `/clipboard` opens a local browser page with the text ready to copy in one click (or copies to the macOS clipboard via pbcopy).

Rules:
- Default ON. Skip only if Zaal says "no clipboard" or there are zero actions.
- Next-actions list = the `actions[]` array only. Not decisions, not quotes - this is the do-now list.
- Owner-grouped so Zaal can paste each person's slice into their DM/GC directly.
- If a single owner (e.g. all Zaal), skip the grouping headers - just the flat list.
- This runs AFTER the tracker write, so the clipboard list and the tracker agree.

## Hard guardrails

- **Never auto-write to actions.json without Phase 3 user-confirm.** The 67-item bulk fix (commit `c80caff8`) was authorized explicitly; default skill behavior must always confirm.
- **Never invent owners, dates, or decisions not present in the transcript.** If unclear, surface as "ambiguous - need clarification" in Phase 3.
- **Never commit a research doc without Zaal's review.** Write the file, leave on `ws/` branch, Zaal commits or asks for edits.
- **Run secret-scan on Bonfire ingest input** before any write to `content/bonfire-ingest/`. Pattern from `.claude/rules/secret-hygiene.md`.
- **Allowlist for owner field** in actions: Zaal, Iman, Both, ThyRev, Samantha. Anything else surfaces as "unknown owner".

## Anti-patterns

- Do NOT propose a new Telegram bot for meeting capture (= ZAO Craig, separate doc 670 work).
- Do NOT replace `bot/src/capture.ts` `/gemba /idea /note` (ZAOstock bot, different DB, different scope).
- Do NOT use Deepgram (ZAOstock-only per doc 12; this skill stays free for personal use).
- Transcription is local-first: mlx-whisper on Zaal's Apple Silicon mac (fast, offline). The VPS is the fallback for non-Mac machines only. This supersedes the doc 673 VPS-only decision - the VPS has no GPU, so local Apple Silicon is faster and has no upload step.
- Do NOT use emojis in any output (per global `feedback_no_emojis`).
- Do NOT use em dashes (per global `feedback_no_em_dashes`).

## Doc numbering (collision-safe)

When creating the recap doc, parallel Claude sessions may race for the same number. Pick the next number defensively: `git fetch origin` first, scan `research/` for the max, and if the chosen folder already exists, increment again. Per doc 663 collision-tolerance, a small gap in numbering is fine - a collision is not.

## References

- [output-schema.md](references/output-schema.md) - JSON schema + worked example from doc 670
- [distribution-targets.md](references/distribution-targets.md) - per-target API/file shapes
- [meeting-recap-template.md](references/meeting-recap-template.md) - research doc template (doc 670 distilled)

## Scripts

- `scripts/transcribe.sh` - local-first transcription: mlx-whisper on Apple Silicon, VPS Whisper fallback
- `scripts/extract-frames.sh` - pull scene-change + interval still frames from a meeting video
- `scripts/fetch-craig.sh` - curl Craig recording URL, extract audio
- `scripts/append-actions.sh` - `gh api` PUT for `data/actions.json` bulk append (ZAO Devz project only)
- `scripts/bonfire-episode.sh` - POST meeting episodes to the ZABAL Bonfire KG (always-on, best-effort, doc 680)

## Evals

- `evals/README.md` - regression fixtures (doc 670 + doc 675 transcripts). Run after editing this skill.

## Engineering basis

Skill structure follows doc 676 (skill-engineering best practices): multi-pass extraction, confidence thresholding, human-review fallback, progressive disclosure. Read doc 676 before refactoring this skill.
