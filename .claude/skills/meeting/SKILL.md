---
name: meeting
description: Capture meeting transcripts (voice memo, Craig recording, Fathom URL, paste-in-chat) and distribute extracted decisions, action items, and key quotes to the right ZAO surfaces - cowork-zaodevz actions.json, a research/events/NNN-* recap doc, Bonfire ingest queue, Telegram copy-paste block, memory, and calendar. Use when the user just finished a meeting, shares a recording or transcript, says "process this call", "extract todos from this", "recap that meeting", or types "/meeting <path-or-url>". Always fires on meeting context - undertriggering wastes the capture.
allowed-tools: Read Write Edit Bash WebFetch
---

# /meeting - ZAO Meeting Capture

Turn any meeting recording or transcript into:
- Action items in [cowork-zaodevz `actions.json`](https://github.com/songchaindao-dot/cowork-zaodevz/blob/main/data/actions.json)
- A research recap doc in `research/events/NNN-<slug>/README.md` (always, per doc 673 decision)
- A copy-paste Telegram bubble for sharing
- Optional Bonfire ingest, memory write, calendar update

One command, six inputs, six output targets. User-gated per run.

Doc 673 has full design + decisions. Read it if context is needed beyond this file.

## When to fire

- Zaal pastes a transcript, meeting notes, or "Iman just said X, Y, Z" dump
- Zaal types `/meeting <path-or-url>`
- Zaal says "I just had a call with...", "process this recording", "extract todos from this call", "recap that meeting"
- Zaal shares a `craig.horse`, `fathom.video`, voice memo path, or audio file path

Undertriggering is the bigger risk. Fire on weak signal; ask one clarifier before doing destructive writes.

## Input detection

Detect mode from `$ARGUMENTS`:

| If `$ARGUMENTS` matches | Mode |
|---|---|
| starts with `https://craig.horse/` | craig_url |
| starts with `https://fathom.video/` | fathom_url |
| ends with `.m4a`, `.mp3`, `.wav`, `.mp4`, `.opus` and file exists | local_audio |
| empty (no args) AND last user message is >200 chars of text | paste |
| anything else | ask user to clarify |

If user just talks about the meeting in chat ("Iman said X then Zaal said Y..."), treat as paste mode using the conversation context as transcript.

## Phase 1 - Acquire transcript

### Mode: paste
Use the pasted text directly. Skip Phase 1.

### Mode: local_audio
Audio file is on Zaal's mac. Transcribe via Iman's VPS (per doc 673 decision).

```bash
bash ${CLAUDE_SKILL_DIR}/scripts/transcribe.sh "$AUDIO_PATH"
```

The script:
1. Checks Whisper is installed on VPS. If not, prints install command and exits.
2. SCPs the audio file to `root@187.77.3.104:/tmp/meeting-input.<ext>`
3. Runs `whisper --model base --language en /tmp/meeting-input.<ext> --output_dir /tmp/meeting-output/`
4. SCPs the `.txt` back, prints transcript path.

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

Read the transcript. Output JSON matching the schema in [references/output-schema.md](references/output-schema.md):

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
    {"id": 1, "text": "...", "owner": "Zaal|Iman|Both|ThyRev|Samantha", "status": "TODO"}
  ],
  "actions": [
    {"title": "...", "owner": "...", "due": "YYYY-MM-DD or empty", "category": "Site / Tech|Ops|WaveWarZ Zambia|ZAO Devz|Bounty|Social|Other"}
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
- If owner is ambiguous, set `owner: "Both"` and surface in the user-confirm step.
- If due date is ambiguous, leave empty. Never invent.
- Category must come from the enum above (matches actions.json schema).
- 3-8 quotes max - pick load-bearing ones (decisions, commitments, surprising info).
- `memory_updates` only if a NEW person, project, or strategy decision appeared (not for things already in `~/.claude/projects/.../memory/MEMORY.md`).

## Phase 3 - Present + confirm

Show the extracted JSON inline as a markdown table for each section. Ask Zaal:

> "Extracted N decisions, M actions, K quotes. Edits? If clean, which targets fire?"
>
> Targets:
> - [x] actions.json bulk append (default ON)
> - [x] research/events/NNN-<slug>/README.md (default ON, every meeting per doc 673)
> - [ ] Bonfire ingest queue (opt-in)
> - [ ] Telegram copy-paste block (opt-in, default OFF - print only on request)
> - [ ] Memory writes (opt-in, confirm each)
> - [ ] Calendar event update (opt-in if title matches a Google Cal event)

Wait for Zaal's reply before any destructive write.

## Phase 4 - Distribute

For each enabled target, follow the playbook in [references/distribution-targets.md](references/distribution-targets.md). Summary:

### actions.json (cowork-zaodevz)
```bash
bash ${CLAUDE_SKILL_DIR}/scripts/append-actions.sh /tmp/extracted-actions.json
```
Script reads the actions array, fetches current `data/actions.json` from GitHub, appends new items starting at `max(existing.id) + 1`, PUTs back via `gh api` with sha. One commit per meeting.

### research/events/NNN-<slug>/README.md
- Find next number: `find research -maxdepth 3 -type d -name '[0-9]*' | grep -oE '/[0-9]+' | tr -d '/' | sort -n | tail -1`
- Slug from meeting title: lowercase, hyphens, no special chars, max 50 chars.
- Use the template at [references/meeting-recap-template.md](references/meeting-recap-template.md). Doc 670 is the gold-standard worked example.
- Write file, do NOT commit yet - leave for Zaal review in current `ws/` branch.

### Bonfire ingest queue
- Write transcript + recap to `content/bonfire-ingest/meeting-YYYY-MM-DD-<slug>.md`.
- Run `python3 scripts/bonfire-ingest/secret_scan.py <file>` to filter secrets.
- Do NOT run `bonfire_client.py` ingest automatically - Zaal triggers when ready (PR #568 just shipped, integration still warm).

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

Print to user a one-line per-target summary:

```
[OK] actions.json - 7 items appended (commit abc1234)
[OK] research/events/674-iman-call-may18 - draft written, review before commit
[--] Bonfire - skipped
[OK] Telegram - block printed above
[OK] Memory - 1 entry written (project_zao_craig.md)
[--] Calendar - no matching event
```

Then suggest the natural next step: "Review research doc at <path>. Commit + PR when ready, or want me to ship it as a PR off ws/<branch> now?"

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
- Do NOT install Whisper locally on Zaal's mac - all transcription runs on Iman's VPS (per doc 673 decision).
- Do NOT use emojis in any output (per global `feedback_no_emojis`).
- Do NOT use em dashes (per global `feedback_no_em_dashes`).

## References

- [output-schema.md](references/output-schema.md) - JSON schema + worked example from doc 670
- [distribution-targets.md](references/distribution-targets.md) - per-target API/file shapes
- [meeting-recap-template.md](references/meeting-recap-template.md) - research doc template (doc 670 distilled)

## Scripts

- `scripts/transcribe.sh` - SCP to VPS, run Whisper, SCP back
- `scripts/fetch-craig.sh` - curl Craig recording URL, extract audio
- `scripts/append-actions.sh` - `gh api` PUT for `data/actions.json` bulk append
