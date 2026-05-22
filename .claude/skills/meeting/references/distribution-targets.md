# Distribution Targets - /meeting

How each target gets the extracted output. Skill reads this when Phase 3 confirm flips a target ON.

## 1. Action tracker (routed by project - SKILL.md Phase 0)

The action target depends on the meeting's project:

| Project | Action target | See |
|---|---|---|
| ZAO Devz / general | cowork-zaodevz `data/actions.json` (GitHub PUT) | 1a below |
| ZAOstock | paste-block for @ZAOstockTeamBot | 1b below |
| ZAO OS / BCZ / WaveWarZ / other | recap doc action table only - no external tracker | n/a |

### 1a. cowork-zaodevz actions.json (project = ZAO Devz / general)

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

### 1b. ZAOstock paste-block (project = ZAOstock)

Do NOT write to cowork-zaodevz. ZAOstock tasks live in the ZAOstock Supabase behind @ZAOstockTeamBot.

v1: print a single fenced paste-block of the action items for Zaal to drop into @ZAOstockTeamBot. Format:

```
ZAOstock meeting YYYY-MM-DD - action items

1. <action> (owner)
2. <action> (owner)
```

Also keep the actions in the recap doc's action table. v2 (deferred): a `zaostock-actions.sh` inserting into ZAOstock Supabase via service-role key, once the ZAOstock task schema is confirmed.

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

## 3. Bonfire knowledge-graph episodes (always-on - doc 680)

**Target:** the ZABAL Bonfire, `POST https://tnt-v2.api.bonfires.ai/knowledge_graph/episode/create`.
**Method:** `scripts/bonfire-episode.sh` - curl POST per episode. Best-effort, never aborts the run.
**Auth:** `$BONFIRE_API_KEY` + `$BONFIRE_ID` (reused from the ZOE bridge, `bot/src/zoe/recall.ts`). Unset => skip + continue.

This is default-ON, every meeting. Goal: the knowledge graph always has full meeting context. Do NOT use the old `content/bonfire-ingest/` file path - that is the bulk-backfill pipeline (research library, GitHub READMEs), wrong tool for per-meeting real-time.

### Episodes JSON

Build `/tmp/meeting-bonfire-episodes.json`:

```json
{
  "episodes": [
    {"name": "meeting:<date>:summary",     "body": "<paragraph: title, date, attendees, project, coverage>", "source_tag": "meeting:<slug>"},
    {"name": "meeting:<date>:decision-<n>", "body": "In the <title> meeting on <date> (<attendees>), the team decided: <text>. Owner: <owner>.", "source_tag": "meeting:<slug>"},
    {"name": "meeting:<date>:action-<n>",   "body": "From the <title> meeting on <date>, <owner> is to <action>. Due: <due or 'no date set'>.", "source_tag": "meeting:<slug>"}
  ]
}
```

One summary + one per decision + one per action. Quotes skipped. Bodies are self-contained prose (Bonfires auto-extracts entities from prose; a node must stand alone).

### Run

```bash
bash ${CLAUDE_SKILL_DIR}/scripts/bonfire-episode.sh /tmp/meeting-bonfire-episodes.json
```

The script secret-scans every body (9 HIGH patterns mirroring `recall.ts` `containsSecret()`), 15s timeout per POST, always exits 0. Episode `name` is deterministic so a re-run updates rather than duplicates.

### Episode payload (what the script sends)

```json
{
  "bonfire_id": "$BONFIRE_ID",
  "name": "meeting:2026-05-19:decision-1",
  "episode_body": "...",
  "source": "text",
  "source_description": "meeting:<slug>",
  "reference_time": "<ISO now>"
}
```

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
