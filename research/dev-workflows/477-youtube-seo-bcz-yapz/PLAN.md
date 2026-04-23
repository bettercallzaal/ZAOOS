# /bcz-yapz-description Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a Claude Code skill at `~/.claude/skills/bcz-yapz-description/SKILL.md` that, given a transcript filename (e.g. `2026-04-22-dish-clanker`), reads `content/transcripts/bcz-yapz/<arg>.md`, renders the BCZ YapZ YouTube description template (doc 477), validates it, writes the output to `content/youtube-descriptions/bcz-yapz/`, and copies it to the clipboard.

**Architecture:** Skill is a single `SKILL.md` prompt that orchestrates Read / Grep / Write / Bash tools. The skill itself contains no code — it instructs Claude how to parse frontmatter, extract chapters from inline `[HH:MM:SS]` markers, resolve entity URLs from a JSON link-map, generate the 3 Zaal-voice paragraphs, and render + validate the template. Ships with a seed link-map and a gaps sidecar for unknown URLs.

**Tech Stack:** Markdown (SKILL.md), JSON (link-map), YAML frontmatter parsing (in-prompt), Bash for clipboard via `pbcopy`, existing `/clipboard` skill as fallback, Read/Write/Grep tools.

**Validation strategy:** No automated pytest. Validation is empirical — run the skill against the 3 posted episodes (Nikoline, Dish, Hannah) and compare output to each episode's actual YouTube description (which Zaal posted 2026-04-22). Capture diffs; if large, patch the skill; re-run until output is paste-ready on first try.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `~/.claude/skills/bcz-yapz-description/SKILL.md` | Main skill prompt. All instructions, validation rules, and output format live here. |
| `content/templates/bcz-yapz-link-map.json` | Seed lookup table mapping entity names to canonical URLs (ZAO/BCZ ecosystem). Read-only reference data. |
| `content/templates/bcz-yapz-link-map.gaps.md` | Human-editable list of entities the skill couldn't resolve. Skill appends to it; Zaal fills URLs when convenient. |
| `content/youtube-descriptions/bcz-yapz/` | Output folder. Skill writes `<date>-<guest-slug>.md` here containing final description body + tags + skill metadata. |
| `content/youtube-descriptions/bcz-yapz/.gitkeep` | Keep the output folder in git. |
| `research/dev-workflows/477-youtube-seo-bcz-yapz/validation/` | Reference outputs from the 3 posted episodes for regression checking. One file per episode. |

**Why this decomposition:** SKILL.md is self-contained prompt logic. Link-map is pure data so it can be edited without touching the prompt. Gaps sidecar is write-append-only so it doesn't conflict with the read-only link map. Validation folder lives next to the spec so future edits to the skill can be regressed against known-good outputs.

---

## Task 1: Scaffold skill directory + link-map seeds

**Files:**
- Create: `~/.claude/skills/bcz-yapz-description/SKILL.md` (placeholder)
- Create: `content/templates/bcz-yapz-link-map.json`
- Create: `content/templates/bcz-yapz-link-map.gaps.md`
- Create: `content/youtube-descriptions/bcz-yapz/.gitkeep`
- Create: `research/dev-workflows/477-youtube-seo-bcz-yapz/validation/.gitkeep`

- [ ] **Step 1: Create the directories**

```bash
mkdir -p "$HOME/.claude/skills/bcz-yapz-description"
mkdir -p "/Users/zaalpanthaki/Documents/ZAO OS V1/content/youtube-descriptions/bcz-yapz"
mkdir -p "/Users/zaalpanthaki/Documents/ZAO OS V1/research/dev-workflows/477-youtube-seo-bcz-yapz/validation"
```

- [ ] **Step 2: Write the link-map seed**

Write `content/templates/bcz-yapz-link-map.json` with known ZAO/BCZ ecosystem entities. Keys are normalized entity names (lowercase, stripped of parentheses and qualifiers), values are canonical URLs.

```json
{
  "_notes": "Map of entity_name -> canonical_url for BCZ YapZ description rendering. Keys are lowercase, trimmed. Skill normalizes input the same way. Add new entries as they appear. If an entity has no URL yet, omit it here; the skill will route it to bcz-yapz-link-map.gaps.md.",
  "_schema_version": 1,
  "orgs": {
    "the zao": "https://thezao.com",
    "zao": "https://thezao.com",
    "clanker": "https://clanker.world",
    "farcaster": "https://farcaster.xyz",
    "coinbase": "https://coinbase.com",
    "base": "https://base.org",
    "coinbase / base": "https://base.org",
    "hubs network": "https://hubsnetwork.org",
    "akasha foundation": "https://akasha.org",
    "akasha hub": "https://akasha.org",
    "radical exchange": "https://radicalxchange.org",
    "web3 privacy now": "https://web3privacy.info",
    "logos": "https://logos.co",
    "farm drop": "https://farmdrop.co",
    "bettercallzaal": "https://bettercallzaal.com",
    "bettercallzaal strategies": "https://bettercallzaal.com"
  },
  "projects": {
    "clanker": "https://clanker.world",
    "empire builder": "https://empirebuilder.world",
    "plural events": "https://pluralevents.org",
    "agora citizen": "https://agoracitizen.network",
    "polis": "https://pol.is",
    "farm drop": "https://farmdrop.co"
  },
  "people": {
    "jack dishman (dish)": "https://farcaster.xyz/dish",
    "dish": "https://farcaster.xyz/dish",
    "nikoline": "https://farcaster.xyz/nikoline",
    "audrey tang": "https://audreyt.org"
  }
}
```

- [ ] **Step 3: Write the gaps sidecar header**

Write `content/templates/bcz-yapz-link-map.gaps.md`:

```markdown
# BCZ YapZ Link Map - Unresolved Entities

Entities that appeared in BCZ YapZ transcripts but have no canonical URL in
`bcz-yapz-link-map.json`. The `/bcz-yapz-description` skill appends here.

Fill the URL + move the entry into `bcz-yapz-link-map.json` when convenient.

Format per line:
- `<entity_name>` (first seen: <episode slug>, category: orgs|projects|people)

## Unresolved

(empty)
```

- [ ] **Step 4: Write SKILL.md placeholder (replaced in Task 2)**

Write `~/.claude/skills/bcz-yapz-description/SKILL.md`:

```markdown
---
name: bcz-yapz-description
description: Render a BCZ YapZ YouTube description + tags from a transcript file. Input: transcript slug (e.g. `2026-04-22-dish-clanker`). Output: paste-ready description + tags written to content/youtube-descriptions/bcz-yapz/ and copied to clipboard.
---

# Placeholder - implemented in Task 2+.
```

- [ ] **Step 5: Create .gitkeep anchors**

```bash
touch "/Users/zaalpanthaki/Documents/ZAO OS V1/content/youtube-descriptions/bcz-yapz/.gitkeep"
touch "/Users/zaalpanthaki/Documents/ZAO OS V1/research/dev-workflows/477-youtube-seo-bcz-yapz/validation/.gitkeep"
```

- [ ] **Step 6: Commit**

```bash
git -C "/Users/zaalpanthaki/Documents/ZAO OS V1" add content/templates/bcz-yapz-link-map.json content/templates/bcz-yapz-link-map.gaps.md content/youtube-descriptions research/dev-workflows/477-youtube-seo-bcz-yapz/validation
git -C "/Users/zaalpanthaki/Documents/ZAO OS V1" commit -m "docs(content): scaffold bcz-yapz description skill assets (doc 477)"
```

---

## Task 2: Write the SKILL.md argument contract + frontmatter

**Files:**
- Modify: `~/.claude/skills/bcz-yapz-description/SKILL.md` (full rewrite of placeholder)

- [ ] **Step 1: Write the skill frontmatter + argument contract**

Replace the placeholder SKILL.md with the frontmatter and the "Inputs & Invocation" section. Nothing else yet.

```markdown
---
name: bcz-yapz-description
description: Render a BCZ YapZ YouTube description + tags from a transcript file. Input: transcript slug (e.g. `2026-04-22-dish-clanker` or `undated-deepa-grantorb`). Output: paste-ready description + tags written to content/youtube-descriptions/bcz-yapz/ and copied to clipboard via pbcopy.
---

# BCZ YapZ Description Skill

Generate a paste-ready YouTube description + tags for a BCZ YapZ episode from
its transcript file.

Spec: `research/dev-workflows/477-youtube-seo-bcz-yapz/README.md`
Template: `content/templates/bcz-yapz-youtube-description.md`
Tags template: `content/templates/bcz-yapz-youtube-tags.txt`
Link map: `content/templates/bcz-yapz-link-map.json`

## Inputs & Invocation

Invoked via `/bcz-yapz-description <transcript-slug>`.

The slug is the filename under `content/transcripts/bcz-yapz/` without the `.md` extension.

Examples:
- `/bcz-yapz-description 2026-04-22-dish-clanker`
- `/bcz-yapz-description 2026-04-14-nikoline-hubs-network`
- `/bcz-yapz-description undated-deepa-grantorb`

If no argument is passed, list the available slugs (via `ls content/transcripts/bcz-yapz/`) and ask the user which one.

The project root is `/Users/zaalpanthaki/Documents/ZAO OS V1`. All file paths in this skill are relative to that root unless absolute.
```

- [ ] **Step 2: Commit**

```bash
git -C "/Users/zaalpanthaki/Documents/ZAO OS V1" add -A
git -C "/Users/zaalpanthaki/Documents/ZAO OS V1" commit -m "feat(skill): bcz-yapz-description frontmatter + invocation contract"
```

---

## Task 3: Add "Step 1 - Parse transcript" instructions to SKILL.md

**Files:**
- Modify: `~/.claude/skills/bcz-yapz-description/SKILL.md` (append)

- [ ] **Step 1: Append the transcript-parsing section**

Append this section to SKILL.md:

```markdown
## Step 1: Read + Parse Transcript

1. Read `content/transcripts/bcz-yapz/<slug>.md` via the Read tool.
2. Split the file at the first occurrence of `## Transcript` (case-sensitive). Everything above is YAML frontmatter; everything below is the body.
3. Parse the frontmatter in-prompt (do NOT call an external parser). Extract these fields:
   - `title`, `show`, `episode` (optional), `guest`, `guest_alias` (optional; fall back to first token of `guest`), `guest_org`, `guest_links` (array of `"platform: handle"` or `"platform: url"` strings), `host`, `date` (ISO or "undated" if missing), `duration_min`, `topics` (array), `keywords` (array), `entities.orgs`, `entities.people`, `entities.projects`, `summary`, `action_items`, `status`.
4. If `date` is missing or the filename starts with `undated-`, set `date_display = "TBD"` and `date_iso = null`. Otherwise use the frontmatter `date` (or `published` if set).
5. Normalize:
   - `guest_alias` defaults to the first whitespace-separated token of `guest` if not set.
   - `guest_slug` = lowercased, hyphenated `guest_alias`.
   - For each `guest_links` entry, split on first `:` into `{platform, value}`. Trim both sides.
6. Store the raw body text for chapter extraction in Step 3.
```

- [ ] **Step 2: Commit**

```bash
git -C "/Users/zaalpanthaki/Documents/ZAO OS V1" add -A
git -C "/Users/zaalpanthaki/Documents/ZAO OS V1" commit -m "feat(skill): bcz-yapz step 1 transcript parsing"
```

---

## Task 4: Add "Step 2 - Resolve entity URLs" to SKILL.md

**Files:**
- Modify: `~/.claude/skills/bcz-yapz-description/SKILL.md` (append)

- [ ] **Step 1: Append entity-resolution logic**

```markdown
## Step 2: Resolve Entity URLs via Link Map

1. Read `content/templates/bcz-yapz-link-map.json`.
2. For each entity in `entities.orgs`, `entities.projects`, `entities.people`:
   a. Normalize the lookup key: lowercase, trim whitespace.
   b. Look up in the matching category map (`orgs` / `projects` / `people`).
   c. If found: attach `url = <value>` to the entity.
   d. If NOT found: attach `url = null` and add the entity to an in-memory `gaps` list with `(entity_name, category, source_slug)`.
3. After all entities are resolved, if `gaps` is non-empty:
   a. Read `content/templates/bcz-yapz-link-map.gaps.md`.
   b. For each gap, append a bullet under the `## Unresolved` section (create the section if the user replaced it) in the format:
      `- \`<entity_name>\` (first seen: <slug>, category: <orgs|projects|people>)`
   c. Deduplicate against existing bullets — do NOT append if the same `(entity_name, category)` pair already appears.
   d. Write the updated file back.
4. DO NOT block rendering on gaps. Render the description with plain entity names (no URLs) for unresolved entries; the "Mentioned" block then lists `{Name}` without a URL instead of `{Name} - <url>`.
```

- [ ] **Step 2: Commit**

```bash
git -C "/Users/zaalpanthaki/Documents/ZAO OS V1" add -A
git -C "/Users/zaalpanthaki/Documents/ZAO OS V1" commit -m "feat(skill): bcz-yapz step 2 entity URL resolution"
```

---

## Task 5: Add "Step 3 - Extract chapters" to SKILL.md

**Files:**
- Modify: `~/.claude/skills/bcz-yapz-description/SKILL.md` (append)

- [ ] **Step 1: Append chapter-extraction logic**

```markdown
## Step 3: Extract 10-15 Chapters from Transcript Body

Transcripts carry inline `[HH:MM:SS]` markers every few seconds. The job is to
pick 10-15 of them as YouTube chapter boundaries.

### 3.1 Scan + segment

1. Find every `[HH:MM:SS]` marker in the body. Capture the position + the 200 surrounding characters of context.
2. Convert each timestamp to total seconds (HH*3600 + MM*60 + SS).
3. Let `duration_sec = max(timestamp_seconds)`. This is the effective video length.
4. Target chapter count = `clamp(round(duration_sec / 150), 10, 15)` — one chapter every ~2.5 min, clamped to [10, 15]. Floor 8 / ceiling 18 as hard bounds if the clamp produces out-of-range.

### 3.2 Candidate boundaries

Mark a timestamp as a candidate chapter boundary if ANY of these signal in the following 200 chars of context:

| Signal | Example phrase |
|--------|----------------|
| Named project/org/person appears (check against resolved entities from Step 2) | "so Clanker is...", "Lorenzo from Nasha..." |
| Zaal transition phrase | "let's talk about", "tell me about", "switching gears", "one last thing", "moving on to", "I wanted to ask you about" |
| Guest new story arc | "so I started", "originally I", "before I got into", "now we're building", "what's next" |
| Explicit topic question from Zaal | "why did you...", "how does...", "what is...", "when did you..." |

### 3.3 Reduce to target count

1. The first chapter MUST be at `0:00` with title `Welcome + who is <guest_alias>`.
2. The last chapter MUST be in the last 3 minutes of the video with title `Outro + where to find <guest_alias>` or similar (use `action_items[0]` content if it fits).
3. From the remaining candidates, select the target count minus 2 by:
   a. Enforce minimum gap of 60 seconds between consecutive chapters.
   b. If too many candidates, prefer those with named-entity signals over transition phrases.
   c. If too few, relax transition-phrase threshold or insert time-based boundaries at even intervals.
4. Round each selected timestamp DOWN to the nearest 5-second mark: `seconds -= (seconds % 5)`.
5. Convert to `mm:ss` format. If `HH > 0`, use `h:mm:ss`. Single digit minutes are OK (`2:45`, not `02:45`). Seconds always 2-digit (`2:05`, not `2:5`).

### 3.4 Title each chapter

For each selected boundary, write a chapter title under 50 chars using the surrounding 200 chars of context:
- Use actual project / person / org names that appear in the window.
- NEVER use generic labels ("Part 1", "Topic 2", "Discussion", "More on crypto").
- Prefer specific noun phrases: "GameStop NFT era + getting into crypto", "Capsule Social, Blogchain, Paris detour".
- If the context is ambiguous, pull the most concrete noun + verb: "Launching Clanker on Farcaster".

### 3.5 Output

Produce a list of `{timestamp_display, title}` pairs ordered by time.
```

- [ ] **Step 2: Commit**

```bash
git -C "/Users/zaalpanthaki/Documents/ZAO OS V1" add -A
git -C "/Users/zaalpanthaki/Documents/ZAO OS V1" commit -m "feat(skill): bcz-yapz step 3 chapter extraction"
```

---

## Task 6: Add "Step 4 - Generate prose in Zaal voice" to SKILL.md

**Files:**
- Modify: `~/.claude/skills/bcz-yapz-description/SKILL.md` (append)

- [ ] **Step 1: Append the prose-generation section**

```markdown
## Step 4: Generate the 3 Zaal-Voice Paragraphs

Input: parsed frontmatter (`guest`, `guest_org`, `summary`, `action_items`, `topics`, `entities`) + full transcript body.

Write 3 paragraphs, total 800-1100 chars, first-person Zaal voice.

### Paragraph 1 (P1) - Set the scene

Start with the exact phrasing: `I sat down with <guest> (<role_at_org>) to talk <core_topic>.`

- `<role_at_org>` = guest's role inferred from frontmatter `guest_org` + summary context (e.g., "builder at Clanker", "organizer at Hubs Network"). Keep it under 40 chars.
- `<core_topic>` = single phrase pulled from `summary`, 3-7 words.
- Follow with 1-2 sentences of context on who the guest is + why this conversation matters. Pull from `summary` + transcript opening.

### Paragraph 2 (P2) - What we actually covered

3 to 5 concrete beats from the episode. Rules:
- Name specific projects, people, orgs that appear in `entities`.
- No hype words: skip "amazing", "incredible", "game-changing", "revolutionary". Use plain descriptions: "walks through", "breaks down", "shares how".
- Grounded only — if it wasn't in the transcript, don't write it.
- Prefer verbs that reflect the conversation: "we talk about", "Dish explains", "Nikoline shares", "he walks through".

### Paragraph 3 (P3) - Why it matters

Tie the episode to The ZAO / builders / musicians / web3 coordination through-line. One or two sentences.
- Connect to `topics` and `action_items` when possible.
- If the guest has a near-term CTA from `action_items[0]`, include it here (e.g., "Plural Event on May 14 - Nikoline wants local hosts").

### Voice + style constraints

- First-person singular: "I sat down", "we talked", "I asked". NEVER "we sat down", "BCZ sat down".
- No emojis. No em dashes. Use hyphens.
- Say "Farcaster" not "Warpcast".
- No hashtags.
- No exclamation points.
- Contractions OK (I'd, we're, it's).
- Length target: 800-1100 chars across all 3 paragraphs combined. If over 1150, trim P2. If under 700, expand P2 with another concrete beat.

### Output

Return `{p1, p2, p3}` as 3 plain strings. No leading/trailing whitespace. No markdown formatting.
```

- [ ] **Step 2: Commit**

```bash
git -C "/Users/zaalpanthaki/Documents/ZAO OS V1" add -A
git -C "/Users/zaalpanthaki/Documents/ZAO OS V1" commit -m "feat(skill): bcz-yapz step 4 prose generation rules"
```

---

## Task 7: Add "Step 5 - Render template + validate" to SKILL.md

**Files:**
- Modify: `~/.claude/skills/bcz-yapz-description/SKILL.md` (append)

- [ ] **Step 1: Append render + validate section**

```markdown
## Step 5: Render Template + Validate

### 5.1 Render the description body

1. Read `content/templates/bcz-yapz-youtube-description.md`.
2. Extract the section between `--- START BODY ---` and `--- END BODY ---`. Discard the comment header + markers.
3. Substitute placeholders:
   - `{{guest}}` -> frontmatter.guest
   - `{{guest_alias}}` -> resolved guest_alias
   - `{{guest_role_at_org}}` -> inferred role string
   - `{{guest_org}}` -> frontmatter.guest_org
   - `{{core_topic}}` -> 3-7 word topic from summary
   - `{{summary_hook}}` -> 40-60 char distilled hook
   - `{{keyword_1}}` / `{{keyword_2}}` -> first two entries in frontmatter.keywords (underscores replaced with spaces)
   - `{{one_line_context}}` -> 1 sentence about guest + why
   - `{{paragraph_2}}` -> P2 string
   - `{{paragraph_3}}` -> P3 string
   - Chapter placeholders (`{{mm:ss}}`, `{{chapter_N_title}}`, lines 10-11) -> substitute chapters from Step 3. If fewer than 10 chapters were extracted (shouldn't happen but guard): pad by repeating lines 2 through N-1. If more than 11: extend the chapter block with additional lines in the same format before the Outro line.
   - `{{entities.people}}` -> comma-separated list. Each item is `{Name} (@handle)` if handle known, otherwise `{Name}`. If empty, omit the `People:` line entirely.
   - `{{entities.projects}}` -> comma-separated `{Project} - {url}` items. If URL is null: `{Project}`. If empty, omit line.
   - `{{entities.orgs}}` -> same pattern. If empty, omit line.
   - If all three entity lines are empty, omit the entire `MENTIONED IN THIS EPISODE` section header + block.
   - `{{guest_links}}` -> one line per `guest_links` entry: `- {platform}: {value}`. If empty, omit the entire `FOLLOW {{guest}}` block including the header.
   - `{{playlist_url}}` -> `https://youtube.com/@bettercallzaal` (channel page fallback until a pinned playlist exists).

### 5.2 Render tags

1. Read `content/templates/bcz-yapz-youtube-tags.txt`.
2. Take the single non-comment, non-blank line.
3. Substitute:
   - `{{guest}}`, `{{guest_alias}}`, `{{guest_org}}` from frontmatter.
   - `{{topics}}` -> frontmatter.topics joined by `, ` with hyphens replaced by spaces.
   - `{{keywords}}` -> first 5 of frontmatter.keywords, hyphens replaced by spaces, joined by `, `.
4. Deduplicate tags (case-insensitive). Strip trailing comma.

### 5.3 Validators (all must pass - if any fail, fix the rendered output and re-run validators)

Run these checks against the rendered body + tags:

| # | Check | Action if fail |
|---|-------|----------------|
| 1 | Body length 2,000 <= chars <= 4,800 | If <2,000: expand P2. If >4,800: trim P2 first, then chapter titles. |
| 2 | Chapter count >= 10 and <= 15 | If <10: revisit Step 3 reduction. If >15: drop weakest transition-phrase candidates. |
| 3 | First chapter line starts with `0:00 - ` | Replace first chapter with `0:00 - Welcome + who is <guest_alias>`. |
| 4 | Every chapter title <= 50 chars | Truncate at the last space before char 50. |
| 5 | No blank lines between chapter lines | Strip blank lines inside the CHAPTERS block. |
| 6 | Tags line <= 480 chars | Drop trailing `{{keywords}}` entries until under 480. |
| 7 | Contains `@zaal` (not `@bettercallzaal`) in the "BCZ YAPZ" Farcaster line | Replace. |
| 8 | Contains `/zao` (not `/thezao` or `/the-zao`) in the "THE ZAO" Farcaster-channel line | Replace. |
| 9 | Contains `Farcaster` and does NOT contain `Warpcast` | Replace any `Warpcast` with `Farcaster`. |
| 10 | Contains no emoji characters (U+1F000-U+1FFFF range) | Strip. |
| 11 | Contains no em dash (U+2014) | Replace with hyphen-space-hyphen or reword. |
| 12 | Contains no `#` hashtag tokens in body (except at start of lines for section headers which must use uppercase headers like `CHAPTERS`, not `# Chapters`) | Strip hashtags. |
```

- [ ] **Step 2: Commit**

```bash
git -C "/Users/zaalpanthaki/Documents/ZAO OS V1" add -A
git -C "/Users/zaalpanthaki/Documents/ZAO OS V1" commit -m "feat(skill): bcz-yapz step 5 render + validation rules"
```

---

## Task 8: Add "Step 6 - Output + clipboard" to SKILL.md

**Files:**
- Modify: `~/.claude/skills/bcz-yapz-description/SKILL.md` (append)

- [ ] **Step 1: Append output section**

```markdown
## Step 6: Write Output + Copy to Clipboard

### 6.1 Write the output file

Path: `content/youtube-descriptions/bcz-yapz/<slug>.md`

Where `<slug>`:
- For dated transcripts: same as input slug (e.g. `2026-04-22-dish-clanker`).
- For `undated-<x>` transcripts: same slug (preserves the `undated-` prefix; rename when date is known).

File format:

```
---
source_transcript: content/transcripts/bcz-yapz/<slug>.md
generated_by: /bcz-yapz-description
generated_at: <ISO 8601 timestamp>
date_iso: <date_iso or null>
date_display: <date_display>
char_count_body: <int>
chapter_count: <int>
tag_char_count: <int>
gaps_flagged: <int>  # how many entities routed to gaps.md this run
---

## YouTube Description Body

<rendered body>

## YouTube Tags

<rendered tags line>

## Skill Run Notes

- Chapters extracted: <count>
- Entities resolved: <count> / <total>
- Gaps appended: <count>  (see content/templates/bcz-yapz-link-map.gaps.md)
```

### 6.2 Copy body to clipboard

Run via Bash:

```bash
pbcopy < /tmp/bcz-yapz-body.txt
```

Where `/tmp/bcz-yapz-body.txt` is a temp file you wrote containing ONLY the rendered body (NOT the tags, NOT the YAML frontmatter, NOT the skill metadata).

Clean up the temp file after.

### 6.3 Final response to the user

Respond with:

```
Generated: content/youtube-descriptions/bcz-yapz/<slug>.md
Body: <char_count> chars, <chapter_count> chapters
Tags: <tag_char_count> chars
Gaps: <n> (appended to bcz-yapz-link-map.gaps.md) / "none"
Body copied to clipboard. Paste into YouTube description.
Tags: <rendered tags line>
```

Keep the response to under 10 lines. No emojis.
```

- [ ] **Step 2: Commit**

```bash
git -C "/Users/zaalpanthaki/Documents/ZAO OS V1" add -A
git -C "/Users/zaalpanthaki/Documents/ZAO OS V1" commit -m "feat(skill): bcz-yapz step 6 output + clipboard"
```

---

## Task 9: Capture reference outputs from the 3 posted episodes

**Files:**
- Create: `research/dev-workflows/477-youtube-seo-bcz-yapz/validation/2026-04-14-nikoline-hubs-network.reference.md`
- Create: `research/dev-workflows/477-youtube-seo-bcz-yapz/validation/2026-04-22-dish-clanker.reference.md`
- Create: `research/dev-workflows/477-youtube-seo-bcz-yapz/validation/2026-04-22-hannah-farmdrop.reference.md`

These files hold the actual YouTube descriptions Zaal posted for each episode. They are the ground truth for diff-comparing future skill runs.

- [ ] **Step 1: Ask Zaal for the live YouTube URLs for each of the 3 posted episodes**

Message template:

```
Need the 3 YouTube video URLs you just posted (Nikoline, Dish, Hannah). I'll
pull the descriptions as reference outputs so future skill runs can be
regression-tested against them.
```

- [ ] **Step 2: For each URL, fetch the description via `yt-dlp` or manual copy-paste**

```bash
yt-dlp --skip-download --write-description --output "%(id)s" "<YT_URL>"
```

Copy the `<id>.description` file contents into the matching reference file under `research/dev-workflows/477-youtube-seo-bcz-yapz/validation/`.

Format each reference file as:

```markdown
---
youtube_url: <url>
captured_at: <ISO timestamp>
source_transcript: content/transcripts/bcz-yapz/<slug>.md
---

## Body (as posted)

<pasted description>

## Tags (as posted)

<pasted tags, or "unknown - tags field not exposed via API">
```

- [ ] **Step 3: Commit**

```bash
git -C "/Users/zaalpanthaki/Documents/ZAO OS V1" add research/dev-workflows/477-youtube-seo-bcz-yapz/validation/
git -C "/Users/zaalpanthaki/Documents/ZAO OS V1" commit -m "docs(477): capture reference YT descriptions for Nikoline/Dish/Hannah"
```

---

## Task 10: Dry-run the skill on the Nikoline transcript

**Files:**
- Modify: `~/.claude/skills/bcz-yapz-description/SKILL.md` (iterate based on diff)

- [ ] **Step 1: Invoke the skill**

In a fresh Claude Code conversation (to avoid context bleed):

```
/bcz-yapz-description 2026-04-14-nikoline-hubs-network
```

- [ ] **Step 2: Compare output to reference**

```bash
diff "/Users/zaalpanthaki/Documents/ZAO OS V1/content/youtube-descriptions/bcz-yapz/2026-04-14-nikoline-hubs-network.md" "/Users/zaalpanthaki/Documents/ZAO OS V1/research/dev-workflows/477-youtube-seo-bcz-yapz/validation/2026-04-14-nikoline-hubs-network.reference.md"
```

- [ ] **Step 3: Categorize each diff**

For each diff block, categorize:
- **Accept** - skill output is fine, reference was improvised by Zaal, no action.
- **Fix skill** - skill got something wrong (e.g. chapter title too generic, wrong tone). Patch SKILL.md, re-run.
- **Fix reference** - Zaal's posted version had a typo or missing section. Leave the reference unchanged; note the drift.

Record categorizations in `research/dev-workflows/477-youtube-seo-bcz-yapz/validation/nikoline-diff-notes.md`.

- [ ] **Step 4: Iterate up to 3 times**

If the diff is >25% of the body by line count, patch the skill and re-run. Stop after 3 iterations even if not perfect — the goal is close-to-paste-ready, not byte-identical.

- [ ] **Step 5: Commit**

```bash
git -C "/Users/zaalpanthaki/Documents/ZAO OS V1" add -A
git -C "/Users/zaalpanthaki/Documents/ZAO OS V1" commit -m "test(skill): validate bcz-yapz-description on Nikoline episode"
```

---

## Task 11: Dry-run on the Dish transcript

**Files:**
- Modify: `~/.claude/skills/bcz-yapz-description/SKILL.md` (iterate based on diff)

- [ ] **Step 1: Invoke**

```
/bcz-yapz-description 2026-04-22-dish-clanker
```

- [ ] **Step 2: Diff vs reference**

```bash
diff "/Users/zaalpanthaki/Documents/ZAO OS V1/content/youtube-descriptions/bcz-yapz/2026-04-22-dish-clanker.md" "/Users/zaalpanthaki/Documents/ZAO OS V1/research/dev-workflows/477-youtube-seo-bcz-yapz/validation/2026-04-22-dish-clanker.reference.md"
```

- [ ] **Step 3: Categorize diffs** (same protocol as Task 10)

Record in `research/dev-workflows/477-youtube-seo-bcz-yapz/validation/dish-diff-notes.md`.

- [ ] **Step 4: Iterate up to 3 times**

- [ ] **Step 5: Commit**

```bash
git -C "/Users/zaalpanthaki/Documents/ZAO OS V1" add -A
git -C "/Users/zaalpanthaki/Documents/ZAO OS V1" commit -m "test(skill): validate bcz-yapz-description on Dish episode"
```

---

## Task 12: Dry-run on the Hannah transcript

**Files:**
- Modify: `~/.claude/skills/bcz-yapz-description/SKILL.md` (iterate based on diff)

- [ ] **Step 1: Invoke**

```
/bcz-yapz-description 2026-04-22-hannah-farmdrop
```

- [ ] **Step 2: Diff vs reference**

```bash
diff "/Users/zaalpanthaki/Documents/ZAO OS V1/content/youtube-descriptions/bcz-yapz/2026-04-22-hannah-farmdrop.md" "/Users/zaalpanthaki/Documents/ZAO OS V1/research/dev-workflows/477-youtube-seo-bcz-yapz/validation/2026-04-22-hannah-farmdrop.reference.md"
```

- [ ] **Step 3: Categorize diffs** (same protocol as Task 10)

Record in `research/dev-workflows/477-youtube-seo-bcz-yapz/validation/hannah-diff-notes.md`.

- [ ] **Step 4: Iterate up to 3 times**

- [ ] **Step 5: Commit**

```bash
git -C "/Users/zaalpanthaki/Documents/ZAO OS V1" add -A
git -C "/Users/zaalpanthaki/Documents/ZAO OS V1" commit -m "test(skill): validate bcz-yapz-description on Hannah episode"
```

---

## Task 13: Backlog smoke-test on one undated transcript

**Files:**
- Writes: `content/youtube-descriptions/bcz-yapz/undated-deepa-grantorb.md` (Deepa picked as canary since she was ep1)

- [ ] **Step 1: Invoke**

```
/bcz-yapz-description undated-deepa-grantorb
```

- [ ] **Step 2: Confirm `date_display: TBD` in the output frontmatter**

```bash
grep "^date_display:" "/Users/zaalpanthaki/Documents/ZAO OS V1/content/youtube-descriptions/bcz-yapz/undated-deepa-grantorb.md"
```

Expected: `date_display: TBD`

- [ ] **Step 3: Confirm body renders without errors and all validators pass**

Read the output file. Run the same 12 validators from Task 7 manually. If any fail, patch SKILL.md and re-run.

- [ ] **Step 4: Commit**

```bash
git -C "/Users/zaalpanthaki/Documents/ZAO OS V1" add -A
git -C "/Users/zaalpanthaki/Documents/ZAO OS V1" commit -m "test(skill): smoke-test bcz-yapz-description on undated Deepa transcript"
```

---

## Task 14: Update doc 477 with Phase 2 completion + flip index

**Files:**
- Modify: `research/dev-workflows/477-youtube-seo-bcz-yapz/README.md`
- Modify: `research/dev-workflows/README.md`

- [ ] **Step 1: Update doc 477 README status + Phase 2 section**

Change the status line from `Design complete, Phase 1 templates shipped` to `Phase 2 shipped`. Replace the Phase 2 spec section with a short "Shipped - see `~/.claude/skills/bcz-yapz-description/SKILL.md`" pointer + a short usage example.

Exact edit (use Edit tool on the README):

Replace:
```
> **Status:** Design complete, Phase 1 templates shipped
```
with:
```
> **Status:** Phase 2 shipped (`/bcz-yapz-description` skill live)
```

Replace the entire `## Phase 2 - /bcz-yapz-description Skill Spec` section with:

```
## Phase 2 - /bcz-yapz-description Skill (shipped)

Skill file: `~/.claude/skills/bcz-yapz-description/SKILL.md`.

Invoke:

\`\`\`
/bcz-yapz-description <transcript-slug>
\`\`\`

The skill reads the transcript, resolves entities via the link-map, extracts 10-15 chapters, generates Zaal-voice prose, renders the template, validates the output, writes to `content/youtube-descriptions/bcz-yapz/`, and copies the body to the clipboard.

Validation references for regression testing: `research/dev-workflows/477-youtube-seo-bcz-yapz/validation/`.

Implementation plan (this doc's sibling): `research/dev-workflows/477-youtube-seo-bcz-yapz/PLAN.md`.
```

- [ ] **Step 2: Update the dev-workflows index**

Edit `research/dev-workflows/README.md` - change the doc 477 summary to reflect Phase 2 completion:

Replace the existing `| 477 |` row with:

```
| 477 | [BCZ YapZ YouTube Description + Timestamp Template](./477-youtube-seo-bcz-yapz/) | CANONICAL | Archive-first (RAG > SEO > guest) template. 6-zone story-first layout, 10-15 chapters, entities block for BCZ 101 bot ingestion, Zaal first-person voice. Phase 1 templates + `/bcz-yapz-description` skill shipped. Validates output per-run. Locks `/zao` Farcaster channel + `@zaal` handle. |
```

- [ ] **Step 3: Commit**

```bash
git -C "/Users/zaalpanthaki/Documents/ZAO OS V1" add research/dev-workflows/
git -C "/Users/zaalpanthaki/Documents/ZAO OS V1" commit -m "docs(477): mark phase 2 shipped, update skill pointer"
```

---

## Task 15: Open PR

**Files:** none new.

- [ ] **Step 1: Push the branch**

```bash
git -C "/Users/zaalpanthaki/Documents/ZAO OS V1" push -u origin HEAD
```

- [ ] **Step 2: Open PR**

```bash
gh -R bettercallzaal/zao-os pr create \
  --title "feat(skill): /bcz-yapz-description + youtube description templates (doc 477)" \
  --body "$(cat <<'EOF'
## Summary

- Ships `/bcz-yapz-description` skill at `~/.claude/skills/bcz-yapz-description/SKILL.md` (global skill).
- Adds BCZ YapZ YouTube description + tags templates at `content/templates/`.
- Adds link-map JSON + gaps sidecar for entity URL resolution.
- Adds validation references for the 3 posted episodes (Nikoline, Dish, Hannah).
- Doc 477 tracks design, rules, validators, phases.

## Test plan

- [ ] Run /bcz-yapz-description on Nikoline, Dish, Hannah - diff vs reference <25% body.
- [ ] Run on undated Deepa - confirms `date_display: TBD` path.
- [ ] Validators pass on all 4 runs: char budget, chapter count, handles, no emoji, no em dash.
- [ ] Clipboard receives body only (no YAML, no tags).
- [ ] gaps.md grows with any entity not in link-map.
EOF
)"
```

---

## Self-Review

**Spec coverage check (vs doc 477 README):**
- Reader priority stack -> covered by overall skill output structure (Task 5, 7).
- Structure style C -> Task 7 (render + Mentioned block).
- Chapter depth B (10-15) -> Task 5 target-count clamp.
- Link policy C -> Task 4 + Task 7 guest/projects/orgs/host/series blocks.
- Voice A (Zaal 1st person) -> Task 6 explicit phrasing rule.
- Generation workflow C (template + skill) -> template already shipped; Task 1-8 ship skill.
- Zone ordering (story-first) -> uses existing template file which is story-first.
- Char budget + tag budget -> Task 7 validators 1 + 6.
- `@zaal` + `/zao` -> Task 7 validators 7 + 8.
- Phase 3 backlog (13 undated) -> Task 13 smoke-test proves the path; actual backlog fill happens manually after skill is stable.

**Placeholder scan:** searched for TBD/TODO/fill-in -> no application-code TBDs. `date_display: TBD` in Task 13 is a valid expected output value, not a plan placeholder.

**Type consistency:**
- `guest_alias` normalized the same way in Tasks 3, 5, 6, 7 (first token of guest, lowercased for slug purposes).
- `duration_sec` and `seconds_rounded` referenced consistently in Task 5.
- `entities.{orgs,projects,people}` referenced consistently in Tasks 3, 4, 7.
- Validators numbered 1-12 in Task 7 are referenced by number in Task 13 step 3. Consistent.

**Scope check:** one skill, one set of templates, one validation loop. Single focused plan. No decomposition needed.

**Open ambiguities flagged:**
- Task 9 step 1 requires Zaal to provide 3 YouTube URLs - this is an external dependency. Acceptable because the skill still functions without references; validation becomes heuristic-only in that case.
- `{{playlist_url}}` uses a channel URL fallback - documented in Task 7 step 1 and in the template header. Acceptable placeholder.
