# Meeting Recap Template

Use this as the body of `research/events/NNN-<slug>/README.md`. Distilled from doc 670 (the gold-standard worked example).

Fill placeholders `{LIKE_THIS}`. Drop empty sections.

```markdown
---
topic: events
type: meeting-recap
status: research-complete
last-validated: {YYYY-MM-DD}
related-docs: {comma-separated doc numbers from memory_updates linked entries + research_seed matches}
tier: STANDARD
---

# {NNN} - {Meeting Title}

> **Goal:** Lock in action items + decisions from {YYYY-MM-DD} {platform} call with {attendees} covering {topic 1}, {topic 2}, {topic 3}.

## Key Decisions

| # | Decision | Owner | Status |
|---|----------|-------|--------|
| 1 | **{Decision text - bolded short version}** - {expanded context if useful} | {Owner} | {TODO|WIP|DONE} |
| 2 | ... | ... | ... |

## Thread {N} - {Topic Name}

### The Idea

{1-3 paragraphs from transcript about what was discussed.}

### Why It Matters

{Why this is on the docket. From transcript context.}

### Decisions Pending

{Things explicitly flagged as not-decided.}

### Next Step

{What the owner committed to as the next move.}

(Repeat per major thread.)

## Action Items

| # | Action | Owner | Category | Due |
|---|--------|-------|----------|-----|
| 1 | {title} | {Owner} | {category} | {YYYY-MM-DD or "TBD"} |
| 2 | ... | ... | ... | ... |

## Key Quotes

> "{quote text}" - {speaker}

> "{quote text}" - {speaker}

## Research Seeds

{Topics worth a doc later. Each as a bullet.}

- {seed 1}
- {seed 2}

## Memory Updates

Files written to `~/.claude/projects/.../memory/`:

- `{slug}.md` - {what changed}

## Also See

- [Doc {N}](../../{folder}/{N}-{slug}/) - {one-line context}
- [Doc {N}](../../{folder}/{N}-{slug}/) - {one-line context}

## Distribution Log

- actions.json: {N} items appended (commit `{sha}`)
- Bonfire ingest: {queued | skipped}
- Telegram: {block printed | skipped}
- Calendar: {event updated | no match | skipped}
- Memory writes: {count} entries

## Transcript

Full transcript: [transcript.md](transcript.md)
```

The raw transcript is written to a sibling file `transcript.md` in the same folder - NOT inline in the README. The README stays lean (decisions + actions + quotes are the signal); the transcript is one click away for anyone who needs the raw record.

`transcript.md` format:

```markdown
# Transcript - {Meeting Title} ({date})

{full transcript text - Whisper output or original paste, verbatim}
```

## Style notes

- No emojis. No em-dashes (use hyphens).
- Bold the load-bearing word in each decision.
- Pull quotes from the transcript verbatim - never paraphrase.
- If a decision is conditional ("we do X only if Y"), state the condition in the decision row.
- Owner column uses canonical first-names matching memory slugs.
- Due column: absolute dates only. "TBD" if transcript was vague.

## Length target

- 400-1200 lines for a 30-60 min meeting.
- 1500+ if the call spanned 3+ major threads.
- Less than 300 = probably not worth a doc; reconsider whether `--doc` flag should be off.
