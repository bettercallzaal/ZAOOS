# Distribution Targets - /meeting

How each target gets the extracted output. Skill reads this when Phase 3 confirm flips a target ON.

## 1. actions.json (cowork-zaodevz)

**Target:** `data/actions.json` on `main` of `songchaindao-dot/cowork-zaodevz`.
**Method:** GitHub Contents API PUT via `gh api`. Bulk append in one commit.
**Auth:** `gh auth token` (verified push perm `c80caff8` 2026-05-18).

### Script call

```bash
bash ${CLAUDE_SKILL_DIR}/scripts/append-actions.sh /tmp/meeting-extracted.json
```

Where `/tmp/meeting-extracted.json` is the full extraction JSON. The script reads `.actions[]`, maps to actions.json schema, appends, commits.

### Per-item mapping

Extracted -> actions.json item:

| Extracted field | actions.json field | Default |
|---|---|---|
| `title` | `title` | - |
| `owner` | `owner` | - |
| `due` | `due` | "" |
| `category` | `category` | "Other" |
| (computed) | `id` | `String(max(existing.id) + index + 1)` |
| (constant) | `createdBy` | `"Claude (/meeting skill)"` |
| (constant) | `status` | `"TODO"` |
| (constant) | `important` | `false` |
| (computed) | `urgent` | `due == today OR due within 3 days` |
| (constant) | `phase` | `"Define"` |
| (constant) | `notes` | `""` |
| (now) | `createdAt` | ISO |
| (now) | `updatedAt` | ISO |
| (constant) | `priority` | `"P2"` (or P1 if urgent) |

Also bump top-level `actions.json.updatedAt`.

### Commit message format

```
chore(actions): meeting recap YYYY-MM-DD <title slug> (+N items)

Source: research/events/NNN-<slug>/README.md
```

## 2. Research doc (research/events/NNN-<slug>/README.md)

**Target:** New folder + README.md in this repo.
**Method:** `Write` tool to filesystem. NOT committed by skill - leave on `ws/` branch.

### Numbering

```bash
NEXT=$(find research -maxdepth 3 -type d -name '[0-9]*' \
  | grep -oE '/[0-9]+' | tr -d '/' | sort -n | tail -1)
NEXT=$((NEXT + 1))
```

### Slug

From `meeting.title`:
- Lowercase
- Replace spaces + `+` + special chars with `-`
- Max 50 chars
- Trim trailing dashes

Example: `Iman call - ZAO Craig + PizzaDAO Zambia` -> `iman-call-zao-craig-pizzadao-zambia`.

### Template

Use `references/meeting-recap-template.md` filled with extracted data. Doc 670 is the reference example.

### Frontmatter

```yaml
---
topic: events
type: meeting-recap
status: research-complete
last-validated: YYYY-MM-DD
related-docs: <comma-separated based on memory_updates linked memories + research_seeds matches>
tier: STANDARD
---
```

## 3. Bonfire ingest queue

**Target:** `content/bonfire-ingest/meeting-YYYY-MM-DD-<slug>.md`.
**Method:** Write file, run secret-scan, do NOT trigger ingest client (Zaal triggers when ready).

### File structure

```markdown
# Meeting: <title>

**Date:** YYYY-MM-DD
**Attendees:** <comma-separated>
**Platform:** <platform>

## Transcript

<full transcript here>

## Recap

(insert recap doc body here from template)
```

### Secret-scan gate

```bash
python3 scripts/bonfire-ingest/secret_scan.py content/bonfire-ingest/meeting-<date>-<slug>.md
```

If exit code != 0, abort write + surface to Zaal. Reference `.claude/rules/secret-hygiene.md`.

## 4. Telegram copy-paste block

**Target:** chat output only (no API call in v1).
**Method:** Print to console, user long-press-copies into Telegram.

### Format

NO header text. NO footer. Single fenced block. Per `feedback_copyable_content_own_bubble`:

```
[Meeting] <title> | YYYY-MM-DD | <attendees>

Decisions
1. <text> (X)
2. <text> (Y)

Actions
- <title> (X, due YYYY-MM-DD)
- <title> (Y)

Quotes
"<quote>" - X
"<quote>" - Y
```

Use pipes `|` not em-dashes (per global feedback). No emojis (per global feedback). No "GM" / "GN" prefixes.

## 5. Memory writes

**Target:** `~/.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/<slug>.md`.
**Method:** Write tool. CONFIRM-FIRST per entry. Update `MEMORY.md` index.

### Pre-flight per entry

For each `memory_updates[i]`:
1. Check `~/.claude/projects/.../memory/MEMORY.md` for existing slug. If exists, show diff vs new content + confirm Edit.
2. If new, propose file content + one-line MEMORY.md entry. Get OK.
3. Write file + Edit MEMORY.md.

### Frontmatter pattern

```yaml
---
name: <slug>
description: <one-line, 80-150 chars>
metadata:
  node_type: memory
  type: project | feedback | user | reference
  originSessionId: <current session id if available>
---

<body>
```

### MEMORY.md index line

```
- [<title>](<slug>.md) - <one-line hook under 150 chars>
```

## 6. Calendar event update

**Target:** Google Calendar event matching `meeting.title` + `meeting.date`.
**Method:** `mcp__claude_ai_Google_Calendar__*` tools.

### Find event

```
mcp__claude_ai_Google_Calendar__list_events(
  calendar_id="primary",
  time_min="<meeting.date>T00:00:00Z",
  time_max="<meeting.date>T23:59:59Z",
  q="<first 3 words of meeting.title>"
)
```

If 0 matches: skip silently.
If 1 match: proceed.
If >1: surface to Zaal, ask which.

### Update

Append to existing description:

```
---
Recap: https://github.com/bettercallzaal/ZAOOS/blob/main/research/events/NNN-<slug>/README.md
Actions filed: <count> items to cowork-zaodevz
```

Use `mcp__claude_ai_Google_Calendar__update_event` with the event_id + appended description.
