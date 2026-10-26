# /handoff bundle template

Single-file markdown bundle. Five fixed sections (A-E) plus a closing "Inline copy-paste block" in this exact order. Paste-anywhere - works in any Claude Code session, claude.ai, or as a research doc for future-you.

Section A is task-first because most receivers are already working on something and want the actionable items, not the backstory. B-E are opt-in.

**`chain:` field** - pick one shape: `none` (first in chain), `<path-to-prior-bundle>` (sequential), or `sibling:<path>` (parallel session, related but not derived).

---

```markdown
# Session handoff - YYYY-MM-DD HH:MM
> from <source machine + branch> -> to <receiver, default "fresh CC terminal">
> doc: <path-to-this-bundle>
> chain: <previous-handoff-path-or-none>

## Receiver instructions (read me FIRST, then do exactly this)

You just received a handoff bundle. Do NOT start work yet. Do this:

1. Read ALL sections below (A through E) before responding to anything.
2. If section C has a diff, decide: apply it (`git apply diff.patch`) or note it for later.
3. Create TaskList entries from section A. These are the "to do" items.
4. Use section B as your "why" - do NOT re-litigate decisions captured there unless new info surfaces.
5. Use section D to know what's still running (background jobs, wakeups, subagents).
6. Use section E as your cold-start map for files, skills, memory state.
7. Once integrated, message back: "Ingested handoff <slug>. <N> tasks queued. Ready."
8. If you /handoff later, your new bundle's `chain:` field points BACK to this bundle's path so the chain is traceable.

## A. Tasks to absorb (paste these into your TODO list)
- [ ] <task 1> - <one-line context>
- [ ] <task 2> - <one-line context>
- [ ] <task 3> - <one-line context>

## B. Why - decisions + pivots + ruled-out paths
- <decision 1> because <reason>. Ruled out <alternative> because <reason>.
- <decision 2> ...
- <pivot> - tried X first, abandoned because Y, switched to Z.

## C. Git state
- Branch: `<branch>` (ahead N, behind M, dirty K files)
- Push status: `<pushed | unpushed | merged>`
- Last commit: `<sha> - <message>`
- Uncommitted diff (apply with `git apply` from repo root):
  ```diff
  <unified diff - inline if under 500 lines, else "see diff.patch sidecar">
  ```
- Untracked files: `<list, or "none">`

## D. In-flight
- Background bash jobs:
  - `<task_id>` - `<description>` - `<status>` (output: `<file>`)
- Subagents pending:
  - `<agent_type>` - `<task description>`
- Scheduled wakeups:
  - `<delaySeconds>` - `<reason>` - fires `<absolute time>`
- Open AskUserQuestion: <yes - "the question" | no>

## E. Cold-start map (read if you are confused)
- Files touched this session:
  - `<path>` - <one-line note about what changed>
- Skills invoked (discrete /skill calls only - skip caveman / startup overlays):
  - `/<skill>` - <count> times - <last-call result note>
- Memory writes:
  - `<memory_slug.md>` - <new | updated> - <one-line>
- Last-known mental model: <2-3 sentences. What were we working on? Where did we leave off? What's next?>
- Open questions for the receiver:
  - <item the receiver should clarify with the user before resuming>

## Inline copy-paste block (for fast receiver paste)

```
Ingest the bundle at <full-path-to-this-README> and follow receiver instructions at the top. <N> tasks to absorb.
```
```

---

## Filling notes

### Section A - voice

Imperative, one-line, ready to drop into a TODO list as-is. Include effort hint if known:
- `[ ] Re-fire bonfire for the 7 May 19-23 meetings (5 min, /tmp/meeting-bonfire-episodes.json)`
- `[ ] Write recap doc 753 from M8 transcript (~30 min, transcript at /tmp/meeting-...)`
- `[ ] Decide PR strategy for doc 754 - same branch as M8 or its own?`

3-5 items typical. Pad less, prioritize more.

### Section B - voice

Declarative, past-tense, named-with-reason. The receiver should be able to read just this section and understand WHY everything in section A makes sense.

Pull from: explicit decisions, pivots, ruled-out alternatives, surprising findings. Skip the obvious.

### Section C - the diff

Inline if under 500 lines. Else write `diff.patch` sidecar in the same directory and inline a one-line-per-file summary:

```
Files modified in uncommitted diff:
- src/foo.ts - added X
- src/bar.ts - refactored Y
- (full diff: diff.patch, 1247 lines)
```

The receiver runs `git apply diff.patch` from repo root to recreate the state.

### Section D - in-flight collection

| What | Where to find it |
|------|------------------|
| Background bash jobs | Conversation memory: any `Bash` calls with `run_in_background: true` that haven't been notified complete |
| Subagents | Conversation memory: any `Agent` calls without a returned summary yet |
| Scheduled wakeups | If `ScheduleWakeup` was used: next-fire delay + reason |
| Open AskUserQuestion | Did the model ask a question with no answer yet? |

### Section E - the mental model

2-3 sentences. Concrete + present-tense. Examples:
- "Just finished writing doc 754 (Bonfire bridge config gap). Three patches applied to bonfire-episode.sh + /bonfire SKILL.md + doc 717. Next: build the /handoff skill from doc 755 spec - user approved spec, said 'build it'."
- "Mid-pipeline on 7 meeting recaps. All transcripts done. Wrote 4 of 7 recap docs. Stopped to research why Bonfire push failed - turned out config gap. Need to finish docs 4-7 and re-fire Bonfire."

### Section E - open questions

If the model needs Zaal's input on something it couldn't decide unilaterally, list it here. Receiver picks up and asks Zaal first.

Examples:
- "Should the diff in section C also include untracked files? They're listed but not in the patch - if receiver needs them, copy manually."
- "PR strategy for doc 754: same branch as M8 or its own ws/research-754? Zaal hasn't decided."

Empty list is OK - means there's nothing blocking.
