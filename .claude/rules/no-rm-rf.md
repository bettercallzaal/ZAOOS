# No rm -rf - Deletion Is Zaal's

Zaal 2026-08-01: "lets never rm rf tbh thats something zaal should always just delete." History: `research/dev-workflows/2649-rules-history/archive/no-rm-rf.md`.

**No agent, loop, or session ever runs a recursive or forced delete of user content.** Deleting files or directories is a manual action Zaal takes. If something should be removed, SURFACE it - name the path and why. Binds on the Mac, the Windows desktop, the VPS and the Pi, and hardest on unattended surfaces.

Banned without exception in autonomous/loop work: `rm -rf` / `rm -r` / `rm -fr` on user content; `rm` with a glob that could expand across user files (`rm ~/x/*`, `rm -rf $VAR/`); `git clean -fdx`, `find ... -delete`, `shred`, mass `mv` into trash-then-empty; deleting a repo, a checkout, `~/.claude`, `~/.zao`, `~/Documents`, memory files, or their contents; Windows equivalents (`Remove-Item -Recurse -Force`, `rd /s /q`, `del /f /s /q`).

Narrow carve-outs: a single temp file the agent itself created this session under `/tmp` or the scratchpad, removed by exact path; `git worktree remove <path>` for a worktree the agent created. Do not stretch these - more than one self-created file, or anything under a user home dir, means STOP and surface it.

Evaluator carve-out (Zaal's merge of this text is the ruling): the evaluator lane only may remove the directories that `zao-eval-extract --evict-plan` lists, which are idle throwaway review extracts from any lane plus idle `.nm-store` entries, all under `$TMPDIR/zao-eval`. Run the plan first and act only on the `EVICT-PLAN.txt` it just wrote: one directory per command, by the exact path on its line, `chmod -R u+w <path> && rm -rf <path>`. Nothing the plan did not list; never `$TMPDIR/zao-eval` itself, a glob, a variable built from anything but that line, or `.leases`. If the plan exits non-zero (it could not tell what is in use), remove nothing and surface it. Every other ban above stands.

Enforcement: deny rules block the command PATTERN across every OS path form, not an enumerated path list. A genuinely needed delete in a pipeline is a Zaal-gated step.
