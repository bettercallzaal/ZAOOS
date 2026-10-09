# No rm -rf - Deletion Is Zaal's

Zaal 2026-08-01: "lets never rm rf tbh thats something zaal should always just delete." History: `research/dev-workflows/2649-rules-history/archive/no-rm-rf.md`.

**No agent, loop, or session ever runs a recursive or forced delete of user content.** Deleting files or directories is a manual action Zaal takes. If something should be removed, SURFACE it - name the path and why. Binds on the Mac, the Windows desktop, the VPS and the Pi, and hardest on unattended surfaces.

Banned without exception in autonomous/loop work: `rm -rf` / `rm -r` / `rm -fr` on user content; `rm` with a glob that could expand across user files (`rm ~/x/*`, `rm -rf $VAR/`); `git clean -fdx`, `find ... -delete`, `shred`, mass `mv` into trash-then-empty; deleting a repo, a checkout, `~/.claude`, `~/.zao`, `~/Documents`, memory files, or their contents; Windows equivalents (`Remove-Item -Recurse -Force`, `rd /s /q`, `del /f /s /q`).

Narrow carve-outs: a single temp file the agent itself created this session under `/tmp` or the scratchpad, removed by exact path; `git worktree remove <path>` for a worktree the agent created. Do not stretch these - more than one self-created file, or anything under a user home dir, means STOP and surface it.

Enforcement: deny rules block the command PATTERN across every OS path form, not an enumerated path list. A genuinely needed delete in a pipeline is a Zaal-gated step.
