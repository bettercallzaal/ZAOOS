---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-05-25
related-docs: "673, 676, 717, 734, 754"
original-query: "Can we make a skill to /summarize a claude code terminal session to move it somewhere else - get the github, all the files necessary, to just pick up with no context lost. Assume the receiver is already working on a session that's compiling something and tell it to add this in its list of things to do. Build a ZAO-native version (we have not used the existing everything-claude-code save-session / resume-session skills)."
tier: STANDARD
---

# 755 - /handoff - ZAO session handoff skill spec

> **Goal:** Spec a ZAO-native `/handoff` skill that compresses the current Claude Code session into a single self-contained markdown bundle the receiver can paste into a different session (same mac, different machine, or claude.ai) and resume from with zero context loss. Default mental model: the receiver is already mid-work; the bundle leads with tasks to absorb into their existing todo list, the rest is opt-in.

## Key Decisions

| # | Decision | Reason |
|---|----------|--------|
| 1 | **Single fat markdown bundle, 5 fixed sections (A-E).** One file, paste-anywhere. | Universal: works in claude.ai (no filesystem), works in a fresh Claude Code session (the receiver pastes it), works as a research-doc artifact for future-you. Multi-file splits force the receiver to fetch more than once. |
| 2 | **Skill name `/handoff`.** | Verb. Action-oriented. Matches what is happening - handing the session off. Not `/summarize-session` (too long) or `/save-context` (too generic). |
| 3 | **Default voice: receiver is mid-work, not cold.** Section A is a `## A. Tasks to absorb` block of 3-5 bullets ready to drop into the receiver's existing todo list. Sections B-E are opt-in. | Most-likely use case is "hey, on another session, please add these to your list" - not "rebuild the whole session." Speak to that case first. |
| 4 | **Lands as `research/events/session-YYYY-MM-DD-<slug>/README.md` + sidecars.** Same `research/events/` namespace as `/meeting` recaps. Optional `diff.patch`, `inflight.json` sidecars. | Reuses the recap-doc pattern that already works. Future-you can grep `research/events/session-*` to find all session handoffs. |
| 5 | **Bonfire push: default-on, best-effort.** Posts the session as a `session:<date>:summary` episode + one per task + one per decision. Uses the `bonfire-episode.sh` path now that doc 754 Patch 1 has it sourcing `~/.zao/zao.env`. | Same KG-as-institutional-memory pattern as `/meeting`. If doc 754 ships, this works automatically. |
| 6 | **NOT a wrapper around `everything-claude-code:save-session`.** Build native. | ECC save/resume are generic Claude Code session save/restore. ZAO needs the cowork-tracker hook, the Bonfire push, the research-doc convention, the memory-delta surface. A native skill is the right amount of code; wrapping adds an indirection without value. |
| 7 | **Auto-clipboard the bundle on save.** `/handoff` writes the doc, then hands the bundle off to `/clipboard` so Zaal can paste it into another session in one Cmd+V. | Mirrors `/meeting` Phase 6. Removes the "find the file, copy its contents" step. |

## The bundle shape

A single markdown file with exactly these five sections, in this order:

```markdown
# Session handoff - YYYY-MM-DD HH:MM
> from <source machine + session id> -> to <receiver, default "next session">
> doc: research/events/session-YYYY-MM-DD-<slug>/

## A. Tasks to absorb (paste these into your TODO list)
- [ ] <task 1> - <one-line context>
- [ ] <task 2> - <one-line context>
- [ ] <task 3> - <one-line context>

## B. Why - decisions + pivots + ruled-out paths
- <decision 1> because <reason>. Ruled out <alternative> because <reason>.
- <decision 2> ...

## C. Git state
- Branch: `<branch>` (ahead N, behind M, dirty K files)
- Push status: `<pushed | unpushed | merged>`
- Uncommitted diff (apply with `git apply` from repo root):
  ```diff
  <unified diff of staged + unstaged + untracked, redacted of secrets>
  ```
- Untracked files: `<list>`

## D. In-flight
- Background bash jobs: `<task_id>` - `<description>` - `<status>` (output file)
- Subagents pending: `<agent_type>` - `<task description>`
- Scheduled wakeups: `<delaySeconds>` - `<reason>`
- Open AskUserQuestion: <yes/no, and which question if open>

## E. Cold-start map (read if you are confused)
- Files touched this session: <relative paths + brief note>
- Skills invoked: `<skill_name>` - <count> - <last result>
- Memory writes: `<memory_slug>` - <new | updated> - <one-line>
- Last-known mental model: <2-3 sentences - what we were working on, where we left off, what is next>
- Open questions for the receiver: <items the receiver should clarify with the user before resuming>
```

## Design choices

### Why single-file (not multi-file)

Multi-file splits (e.g. TASKS.md + CONTEXT.md) force the receiver to know which file to read, fetch them in order, and remember the relationship. With one file, the receiver gets the whole shape on first paste, and the section headers let them skim to what they need. The cost is a longer paste - but the receiver's eye can jump to `## A.` instantly.

### Why default to "append to existing list"

Most handoffs are between sessions on the same person's mac, where a session is already mid-flow. "Here is everything you need to start from scratch" is the wrong opening - it implies the receiver discards their current state. "Add these tasks to your list, read the rest if you care" is the right opening - it implies politeness toward the receiver's in-flight work.

Cold-start (target 4, future-you weeks later) is the second-most-common case. The same section A still works for cold-start because the section header is `Tasks to absorb` - the cold-start receiver has no existing tasks, so they just adopt section A wholesale.

### Why `research/events/session-*` lives next to `/meeting` recaps

A handoff is a kind of event - it captures a moment-in-time state. Same shape as a meeting recap (decisions + actions + cold-start). Putting them in the same folder makes `research/events/` the canonical "what happened, when" stream. Grep across both with `ls research/events/session-* research/events/*-may*-*` etc.

### Why Bonfire integration is default-on

If session handoffs land in Bonfire as KG episodes, the receiver (next session, next agent, future-you) can query "what happened in the May 25 evening session" and get a node back, even without remembering the doc number. Same value proposition as meetings.

### Why NOT git-stash or git-bundle

`git stash` is local-only, fragile (can be dropped), and does not carry the why. `git bundle` is a binary blob - can't be pasted into claude.ai. Inline unified diff inside the markdown bundle is paste-anywhere, applicable with `git apply`, and human-readable.

## Concrete implementation

### Files (new)

```
~/.claude/skills/handoff/
  SKILL.md               # the spec the model reads
  scripts/
    handoff-build.sh     # collect git state, in-flight, file touches; emit the markdown bundle
    handoff-bonfire.sh   # post the bundle's A + B sections to Bonfire (wraps bonfire-episode.sh)
  references/
    bundle-template.md   # the markdown template from this doc
    inflight-collectors.md  # how to inspect background bash + subagents
```

### Skill flow (when Zaal types `/handoff`)

1. **Gather**: pull git state (`git status --porcelain`, `git diff HEAD`, `git stash list`), background-bash job listing, TaskList output, ScheduleWakeup pending count, memory dir diff vs session start, files touched (from tool-call audit), skills invoked.
2. **Synthesize**: ask the model (Claude itself) to write sections A + B + E from the conversation. C + D are mechanical from step 1.
3. **Ask the user**: section A draft + confirm the receiver context ("paste into another CC session? web? cold-start?"). Default is `another CC session, same mac`.
4. **Write**: `research/events/session-YYYY-MM-DD-<slug>/README.md` + sidecar `diff.patch` if dirty + `inflight.json` if jobs running.
5. **Bonfire**: build episodes JSON, run `bonfire-episode.sh` (best-effort).
6. **Clipboard**: hand the bundle markdown to `/clipboard` skill so Zaal can paste in one Cmd+V.
7. **Report**: one-line `[OK] handoff -> research/events/session-<slug>/ + clipboard ready`.

### What Section A items come from

- Open TaskList items (`pending` + `in_progress`)
- Explicit "TODO" Zaal said in chat
- Background bash jobs that did not complete cleanly
- ScheduleWakeup prompts (those are literal "to do later" tasks)
- PR / commit pending steps the conversation has not yet executed

### What Section B captures

Pulled from the model's read of the conversation - explicit decisions ("we chose X because Y"), pivots ("we tried Z first, abandoned because W"), ruled-out alternatives. This is the expensive-to-reconstruct part and is the highest-value section.

### Section C diff size limits

If `git diff HEAD` is over ~500 lines, the script writes the full diff to `diff.patch` sidecar and embeds only a one-line-per-file summary in the bundle. The receiver does `cat diff.patch | git apply -` if they want the full patch. Keeps the markdown bundle small enough to paste in any context.

### Section D collection

| What | How |
|------|-----|
| Background bash jobs | `BashOutput` task listing - the Claude Code harness tracks active jobs. The script reads the in-memory state. |
| Subagents | Same harness state. Pending Agent tool calls that have not returned. |
| Scheduled wakeups | If `ScheduleWakeup` was used this session, the next-fire time. |
| Open AskUserQuestion | If `AskUserQuestion` is awaiting a response, flag it. |

Note: the Claude Code harness only exposes some of this to the running model. The script collects what it can; the model fills in from conversation memory what the harness does not surface.

### Section E

| Sub-field | Source |
|-----------|--------|
| Files touched | grep tool-call log for `Write` / `Edit` paths |
| Skills invoked | grep tool-call log for `Skill` invocations |
| Memory writes | `diff` of `~/.claude/projects/.../memory/` against session-start snapshot |
| Mental model | model-generated, 2-3 sentences |
| Open questions | model-generated, items the receiver should clarify |

## Options Compared

| Option | Where the bundle lives | Receiver paste flow | Verdict |
|--------|------------------------|---------------------|---------|
| **A. Single fat markdown bundle** | One file in `research/events/session-*/README.md`, optional `diff.patch` sidecar | Receiver pastes the README into the new session; if same-mac, `git apply diff.patch` | RECOMMEND - what this doc specs |
| B. Two-file split (TASKS + CONTEXT) | Two files | Receiver pastes TASKS first, opens CONTEXT only if stuck | Tempting but the receiver has to know which file to grab first. Adds friction. SKIP. |
| C. Five `/clipboard` pages, one per section | Five HTML pages in `~/.zao/clipboard/` | Receiver browses, clicks the section they want, copies | Useful for async paste-as-needed but adds 5 pages of overhead vs one bundle. SKIP unless multi-context paste becomes the bottleneck. |
| D. Wrap `everything-claude-code:save-session` | ECC manages save/load; we add a thin ZAO layer | Receiver runs ECC `resume-session` | ECC is generic - missing Bonfire push, cowork tracker file, research-doc convention. A native skill is simpler. SKIP. |

## Open questions (resolve during build)

1. **Slug auto-pick**. Default = first 4-6 words of the section-B headline. Override via `/handoff <slug>`.
2. **Doc-number collision**. Sessions land as `session-YYYY-MM-DD-<slug>/` so they do not need numbered slots like research docs do. No collision risk. Confirmed.
3. **Bonfire dedup**. If `/handoff` is run twice the same day, episode `name` collisions update rather than duplicate (per `/bonfire` skill - "A re-post with the same `name` updates rather than duplicates"). Good - re-running is idempotent.
4. **Secret-scan on Section C diff**. If the uncommitted diff includes a `.env` modification, the script must redact per `.claude/rules/secret-hygiene.md` patterns before writing the bundle. Borrow the existing `bonfire-episode.sh` secret-regex.
5. **PII-scan on Section A / E** - per `.claude/rules/pii-hygiene.md`. Owner names in task bullets are fine if they are ZAO ecosystem people; third-party emails get redacted.
6. **How does the receiver "accept" the bundle?** Two flows: (a) paste the markdown into chat - the model reads it and integrates; (b) `/pickup <slug>` skill that reads `research/events/session-<slug>/README.md` and ingests it. v1 ships flow (a) only; v2 adds (b).
7. **Multi-machine git** - if the receiver is on a different machine and the branch is unpushed, the bundle's Section C diff is the ONLY way to move the work. The script should auto-suggest `git push origin <branch>` if it can detect the branch exists on remote, else "your diff sidecar is the source of truth - apply with `git apply diff.patch`."

## Sources

- `~/.claude/skills/meeting/SKILL.md` [FULL] - the recap-doc + Bonfire pattern this skill borrows from
- `~/.claude/skills/meeting/scripts/bonfire-episode.sh` [FULL] - the Bonfire push transport (post doc 754 Patch 1, this works with `~/.zao/zao.env`)
- `~/.claude/skills/clipboard/skill.md` [PARTIAL - skill name + intent confirmed; not re-read this session] - the clipboard handoff target
- `~/.claude/skills/bonfire/SKILL.md` [FULL] - the dual-key-location architecture this skill inherits
- [Doc 754 - meeting Bonfire bridge config gap](../../agents/754-meeting-bonfire-bridge-config-gap/) [FULL] - the prerequisite that unlocks Bonfire push
- [Doc 717 - posting /meeting Bonfire via VPS](../../agents/717-meeting-bonfire-posting-via-vps/) [FULL] - the upstream architecture decision
- [Doc 673 / 676 - /meeting skill design](../../agents/676-skill-engineering-best-practices/) [PARTIAL - referenced as the multi-phase pattern this skill mirrors; not re-read]
- [Doc 734 - Hermes Orchestrator framework](../../agents/734-hermes-orchestrator-framework/) [PARTIAL - referenced as the env-source-agnostic adapter pattern; not re-read]

No community sources fetched - this is internal skill design grounded in our own surfaces.

## Also See

- [Doc 754](../../agents/754-meeting-bonfire-bridge-config-gap/) - the Bonfire push unblock; `/handoff` depends on it
- [Doc 717](../../agents/717-meeting-bonfire-posting-via-vps/) - the SSH-vs-local-env architecture
- `everything-claude-code:save-session` - generic Claude Code session-save (we are NOT wrapping it, but Zaal may want to compare against once `/handoff` ships)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Build `~/.claude/skills/handoff/SKILL.md` + scripts per this spec | Claude | Skill build | Next coding pass |
| Build `~/.claude/skills/handoff/scripts/handoff-build.sh` (gather + emit bundle) | Claude | Bash script | Same pass |
| Build `~/.claude/skills/handoff/references/bundle-template.md` from this doc's "Bundle shape" section | Claude | Reference file | Same pass |
| Pilot: run `/handoff` on this current session as the first real test, paste the bundle into a fresh CC terminal, verify the receiver can resume | Zaal + Claude | Manual test | After build |
| Iterate the bundle template after pilot - shrink sections that turned out noisy, expand sections that turned out thin | Claude | Edit | Post-pilot |
| Add `/pickup <slug>` companion skill (v2) - reads a session bundle from `research/events/` and ingests it | Claude | Skill build | v2, after `/handoff` proves out |
| Document `/handoff` in the ZAO OS `CLAUDE.md` skills section + the Doc 154 skills reference | Zaal | Edit | Once shipped |
| Optional: hook `/handoff` to auto-fire on `/compact` so a session compression also writes a handoff doc | Zaal | Hook | Once shipped + tested |
