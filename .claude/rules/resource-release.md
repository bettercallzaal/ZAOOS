# Resource Release - whatever a run creates, the same file says how it is released

Three measured leaks (136 tabs, 50 sessions on 40 panes, 26 leftover worktrees on a disk that hit ENOSPC on 2026-10-10). Instances, what this does not ask for, and sources: `research/dev-workflows/2649-rules-history/archive/resource-release.md`.

1. **The file that creates a per-run resource names its release, next to the create.** Not in a README, not in a cleanup script somebody runs later.
2. **Release at the natural boundary, not at the end of the session**: when the thing it was for is safe somewhere else.

| Resource | Release it when | With |
|---|---|---|
| git worktree | its branch is pushed and its PR is open; a later review fix gets a NEW worktree from the pushed branch | `git worktree remove <exact path>`, then `git worktree prune` |
| terminal tab or pane | the run it was opened for has reported | the tool that opened it; reuse a session where the tool allows |
| Claude session | its handoff is written and its lane is idle more than a day (`handoff-discipline.md` rule 5), or its only next step is a human's answer and that question is filed (rule 7) | write the brief, set `status: ready`, close the pane |
| scratch file | the command that needed it has finished | `rm -f <exact path>`, a single file the agent itself made (`no-rm-rf.md`) |
| background process | its result has been read | stop it by pid or session name, then confirm it is gone |

3. **Check before releasing, and say what was checked.** Worktree: tracked files clean, and local head equals the remote branch head or the PR is merged. Uncommitted tracked changes or commits on no remote are somebody's work: report and leave.
4. **Release by exact path or exact id.** Never a glob, a parent directory, or `rm -rf` (`no-rm-rf.md`).
5. **Only your own.** Another lane's worktree, tab or session is theirs even when clean and merged. Name it to the seat.
6. **Count at session start and end**: `git worktree list` in each repo touched. A number that only goes up is the leak.
7. **A lane waiting only on a human is closed once its question is filed** (ZAOOS#3361). The brief and the ask through the seat do the waiting; an open session does not. The seat keeps open lanes under a cap, and the cap and its swap and free-disk lines are numbers written in the seat's brief. Over any line, the seat closes waiting-on-human lanes first, each after its brief is saved. Measured 2026-10-20: about 19 lanes, swap 9.2 to 13.6 GB in 15 minutes, free disk 8.2 to 3.4 GiB. Closing the 8 lanes that only waited on Zaal brought swap back to 9.2 GB. This is a named condition, not the timed reaper the line below forbids.

Never release early (a worktree with no open PR is the only copy) and never build a timed reaper that guesses what is safe.
