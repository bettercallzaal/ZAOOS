# Worktree Handoff - never hand another agent a writable path inside your own git tree

Two writers in one working tree, nothing failing, nothing warning. Instances (doc 554, issue #3338): `research/dev-workflows/2649-rules-history/archive/worktree-handoff.md`.

**A path you hand to another agent is a path you no longer control.**

- **Do not pass a writable path inside your own worktree to a spawned agent, subagent, or lane.** Copy the input to a scratch path outside any git tree you are working in, let the other agent write there, copy the result back yourself.
- **Telling it not to commit is not enough alone.** If you rely on it, say the path belongs to another lane, repeat the instruction in every layer the agent reads (packet, brief, spawn command line), and check it.
- **Before spawning, ask whose tree the path is.**
- **After any run that spawned agents, read `git log` before trusting `git status`.**
- **Use both layers:** prevention by copy-out, and detection by recording HEAD before the handoff and diffing after (as `lane-weigh-in.py` does) - report, never revert.

Guards: an agent working in its own repo is normal. Do not delete another agent's commit to clean up - leave it, attribute it, fix the handoff. A commit in `git log` you did not write, on a branch you thought was yours, is the tell.
