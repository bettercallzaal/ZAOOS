# Resource Release - whatever a run creates, the same file says how it is released

Doc 2444 finding 7 asked for this rule on 2026-08-29 and it was never written.
Six weeks and a third leak later it is written, on card 10050.

A tab, a session, a worktree, a held message: each is cheap to create and each
outlives the run that created it unless something releases it. Nothing fails
when it is not released. It accumulates until a different thing breaks.

## The three instances (all measured)

| When | What leaked | How it showed up |
|---|---|---|
| 2026-08-29 | Orca's `organizer-tick` automation opened one terminal tab per run and closed none: **136 tabs** | Filed as ZAOOS#3361 that day, closed 2026-10-06. The root cause, `reuseSession: false`, had no flag to change it |
| 2026-08-29 | **50 Claude sessions against 40 panes**, 13 idle for two to three days | Swap at 95 percent |
| 2026-10-10 | **26 git worktrees, about 3.2 GB**, in one lane's session scratchpads; 24 were clean and already merged | The Mac's disk, already at 296 Mi free the day before, hit `ENOSPC`. Every command in this lane failed, and it could not even check what the VPS was running |

The third is the instructive one. Each worktree was created correctly, by the
rule that says to build in a worktree off `origin/main` (`agent-loops.md` rule
25). That rule ends "then `git worktree remove`", and it was not followed: each
worktree was kept "in case the review asks for a fix", and nothing ever came
back for it. A release with no named moment is a release that does not happen.
Seventeen came out with `git worktree remove` in one command and free space
went from about 290 MB to 2.7 GB.

A fourth cost appeared the same day: Orca lists every worktree of a tracked
repo as an in-progress workspace, so four finished scratch worktrees sat on
Zaal's screen as work that looked open.

## The rule (behavior-changing)

**1. The file that creates a per-run resource names its release, next to the
create.** Not in a README, not in a cleanup script somebody runs later. If the
line that opens it and the line that closes it are in different files, the
second one is the one that gets forgotten.

**2. Release at the natural boundary, not at the end of the session.** The
boundary is when the thing it was for is safe somewhere else:

| Resource | Created by | Release it when | With |
|---|---|---|---|
| git worktree | `git worktree add` | its branch is pushed and its PR is open. A review fix later gets a NEW worktree from the pushed branch; that costs seconds | `git worktree remove <exact path>`, then `git worktree prune` |
| terminal tab or pane | an automation, `zj new`, a spawn | the run it was opened for has reported | the tool that opened it; reuse a session where the tool allows |
| Claude session | a lane boot, a subagent | its handoff is written and its lane is idle more than a day (`handoff-discipline.md` rule 5) | write the brief, set `status: ready`, close the pane |
| scratch file | a test, a red control, a one-off script | the command that needed it has finished | `rm -f <exact path>`, a single file the agent itself made (`no-rm-rf.md` carve-out) |
| background process | `run_in_background`, `nohup`, a tmux session | its result has been read | stop it by pid or by session name, then confirm it is gone |

**3. Check before releasing, and say what was checked.** For a worktree: the
tracked files are clean, and the local head equals the remote branch head, or
the PR is merged. A worktree with uncommitted tracked changes, or commits that
are on no remote, is somebody's work. It is reported and left.

**4. A release is by exact path or exact id.** Never a glob, never a parent
directory, never "everything under my scratchpad". `git worktree remove` on a
path the agent created is git's own cleanup and is allowed; `rm -rf` on the
same directory is not (`no-rm-rf.md`). When the two would have the same
effect, the first is still the only one to use.

**5. Only your own.** A worktree, tab or session another lane created is
theirs, even when it is clean and merged. Name it to the seat and move on.

**6. Count them when a session starts and when it ends.** `git worktree list`
in each repo the session touched. A number that only goes up is the leak, and
it is visible weeks before the disk is.

## What this does not ask for

- A reaper that deletes things on a timer. `zao-sweep-tabs` exists because the
  root cause of #3361 could not be fixed at the time, and it is deliberately
  narrow: bare-shell tabs with one title shape, newest three kept. A general
  sweeper that guesses what is safe to remove is how work gets lost.
- Releasing early. A worktree whose PR is not open yet is still the only copy
  of the change on this machine.

## The tell

You are about to run a create command and cannot point at the line that will
undo it. Write that line first.

## Source

Doc 2444 (`research/agents/2444-always-on-orchestrator/`), finding 7 and its
Next Actions row, 2026-08-29, re-checked 2026-09-25. ZAOOS#3361 (opened
2026-08-29, closed 2026-10-06). Siblings: `agent-loops.md` rule 25 (build
in a worktree, which this rule completes), `no-rm-rf.md` (what a release may
not be), `handoff-discipline.md` rule 5 (lane lifecycle), `vanishing-dependencies.md`
(the opposite failure: a thing that should have been kept), `agent-spend.md`.

### Where the 2026-10-10 worktree figures are recorded

A reviewer could not open a record for this instance (ZAOOS#3896, 2026-10-11),
so each figure is tied to its record here, and the ones with no record say so.

- **26 worktrees, about 3.2 GB, mostly the zoe lane's; 296 Mi free on
  2026-10-09 and 2.0 Gi free the next morning.** Vault `handoffs/dreamnet.md`,
  the 10-10 delta (zao-vault commit `cd0e8c0d3956801413a3e294eba941a47b2ddeff`,
  2026-10-10 08:23 EDT), written by the dreamnet lane, which found them in the
  shared scratch area and reported them to the seat without touching them.
- **`ENOSPC` on every command in the zoe lane, 24 of the 26 clean, 17 removed by
  exact path with `git worktree remove`, and `df` reading 2.7 GiB free
  afterwards.** Measured in the zoe lane's own session on 2026-10-10 (the
  `ENOSPC` reports at about 07:15 EDT, the removal at 07:27 EDT). The "24 clean"
  count was given to the zoe lane in the message that asked for the cleanup; the
  rest it ran itself. **These are in that session's transcript and in no other
  record.** This section is the write-up.
- **The worktrees were not the whole cause.** The disk was nearly full before
  them, and this lane's session notes say Zaal later freed a 19.8 GB video file
  (not re-measured here). The 3.2 GB of leftovers is the part a lane created and
  the part a lane could release itself, which is why it is the instance this
  rule is built on. The earlier wording, that 26 worktrees "filled the disk",
  said more than was measured.
