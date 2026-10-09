# No rm -rf - Deletion Is Zaal's

Zaal (2026-08-01): "lets never rm rf tbh thats something zaal should always just
delete." Surfaced when the desktop found ZAOOS's `rm -rf` deny rules were
macOS-only (`/Users/zaalpanthaki/...`) and therefore INERT on the new always-on
Windows box - the wrong fix is "add Windows paths," the right fix is "never do it."

## The rule (behavior-changing, all machines / sessions / loops)

**No agent, loop, or session ever runs a recursive/forced delete of user content.**
Deleting files or directories is a **manual action Zaal takes himself.** If
something should be removed, SURFACE it - name the path + why - and let Zaal delete
it. This binds on the Mac, the Windows desktop, the VPS, and the Pi, and it binds
harder on the unattended surfaces (the desktop auditor, any cron/loop) where nobody
is watching a given run.

Banned without exception in autonomous/loop work:
- `rm -rf` / `rm -r` / `rm -fr` on any directory of user content
- `rm` with a glob/wildcard that could expand across user files (`rm ~/x/*`, `rm -rf $VAR/`)
- `git clean -fdx`, `find ... -delete`, `shred`, mass `mv` into trash-then-empty
- deleting a repo, a checkout, `~/.claude`, `~/.zao`, `~/Documents`, memory files, or their contents
- any Windows equivalent: `Remove-Item -Recurse -Force`, `rd /s /q`, `del /f /s /q`

## The narrow, explicit carve-outs (still be conservative)

- A single temp file the agent ITSELF created this session under `/tmp` or the
  scratchpad, removed by exact path (`rm -f /tmp/zao-xyz.tar.gz`) - fine.
- `git worktree remove <path>` (git's own cleanup of a worktree the agent created) -
  fine; it is not a raw `rm -rf` and git guards it.
- Do NOT stretch these into "well it's basically a temp dir" - if you're deleting
  more than a single self-created file, or anything under a user home dir, STOP and
  surface it.

## Enforcement

- **Deny rules must block the PATTERN, not enumerate paths.** A path allowlist is
  brittle (the exact bug the desktop found: macOS paths, inert on Windows). Deny
  `rm -rf`/`rm -r`/`Remove-Item -Recurse` broadly across every OS path form
  (`/Users/...`, `C:\Users\...`, `/c/Users/...`, `$HOME`, relative). Update
  `.claude/settings.json` (+ ZAOOS project settings) to fail-closed on the command
  shape.
- If a delete is genuinely needed in a pipeline, it is a Zaal-gated step, not an
  autonomous one (`agent-loops.md` PR-only + human-gate; `feedback_just_do_reversible_ask_irreversible`
  - a recursive delete is exactly the IRREVERSIBLE case that requires asking).

## Source

Zaal 2026-08-01, from the desktop-migration audit (macOS-only deny rules inert on
Windows). Siblings: `secret-hygiene.md`, `silent-failure-guard.md`,
`agent-loops.md` (rule 8: PR-only + human-gate), `feedback_just_do_reversible_ask_irreversible`
(reversible = do it, irreversible = ask - a recursive delete is the irreversible line).
