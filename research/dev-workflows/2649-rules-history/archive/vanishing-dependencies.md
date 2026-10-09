# Vanishing Dependencies - if something depends on it, git must hold it

Established 2026-08-12 after the same failure was diagnosed **four times in
twenty-four hours**, from scratch each time, because the first three diagnoses
became tasks rather than a rule.

## The four

| What | How it failed | Blast radius |
|---|---|---|
| `zao-vault-log` | Never git-tracked, vanished | Hourly cron dead. It had also been writing "nothing merged" for four days while **158 PRs merged** |
| `zao-cc-state.sh` / `zao-cc-activity.sh` | Existed only on `main`; a branch checkout removed them | Stop hook failed, so the WAITING/WORKING state feeding the status line silently stopped |
| `relay-autopull.sh` | Never in git, still missing | Wired to `UserPromptSubmit` - failing on **every prompt Zaal types**, duration unknown |
| `quick-grill` skill | Never in git, gone from disk | A skill he built on 2026-08-07, unrecoverable except from a session that happened to have it loaded |

One shape. Four instances. Zero recognition, because nothing connected them.

## Why it is always silent

The thing that vanishes is never the thing that reports. The cron still exits 0.
The session still works. The hook error is one line in scrollback nobody reads.
Only the thing the script *maintained* stops, and the gap between "stopped" and
"noticed" is measured in days.

This is `silent-failure-guard.md` with the failure moved one level down: not a
system reporting success while doing nothing, but a system reporting success
while a piece of it no longer exists.

## The structural cause, named

**`~/bin` is a symlink into `~/zaal-dotfiles/bin`, and `~/.claude/skills` into
`~/zaal-dotfiles/claude/skills`.** Both are git working trees whose HEAD moves.
So a branch checkout in a dotfiles repo can break every hook, cron and skill on
the machine, and `~/.claude/settings.json` is a symlink into the same tree.

Runtime dependencies resolving through a mutable working tree is the bug. Every
instance above is a consequence of it.

## The rule (behavior-changing)

**1. If a hook, cron, skill, or another script depends on a file, that file is
git-tracked. No exceptions, and "I'll commit it later" is how all four of these
died.** Write it, commit it, in the same pass. An untracked file inside a git
tree is the worst of both worlds: it looks safe because it is in a repo, and git
cannot give it back.

**2. Before switching branches in a repo that `~/bin` or `~/.claude` resolves
through, know what you are about to change underneath every running session.**
`git checkout` in `~/zaal-dotfiles` is not a local action. It reconfigures the
machine.

**3. A dependency's existence is checked, not assumed.** `zao-hook-check` does
this for hook scripts - silent when everything resolves, loud when it does not,
and wired into SessionStart so the warning reaches a session instead of
scrollback. Anything else with dependencies gets the same treatment.

**4. Absence is reported loudly and specifically, never inferred from silence.**
"The cron produced no output" does not mean "there was nothing to do." Prove the
thing can still run before concluding anything from its quiet
(`state-claims.md`, Silence is not evidence).

**5. Recoverability is a property you verify, not assume.** `zao-guard snapshot`
keeps a restorable copy outside every repo, and `zao-guard diff` turns "noticed
days later" into "noticed within the hour." A backup nobody has restored from is
a hypothesis.

## When the cause is unknown, defend anyway

Worth recording, because it shapes the fix: **nobody knows what deleted them.**
Every plausible mechanism was tested and eliminated - `git checkout` (never
tracked, nothing to remove), `zao-skills-sync pull` (its `rsync --delete`
iterates only skills present in the repo, so a live-only skill is untouched),
`git reset --hard` (does not remove untracked files), and no `git clean` or
stray `rm -rf` exists anywhere in `~/zaal-dotfiles/bin`, the ZAOOS scripts, or
any hook.

The single lead is an empty `~/.claude/skills/learned/` created 2026-08-11
21:20, two minutes after a hard reset and inside the window `zao-vault-log`
died. An empty directory is what a content deletion leaves behind.

**Do not wait for a root cause to defend against a loss.** Tracking, checking,
snapshotting and diffing all work against an unknown deleter, which is the only
honest design when the deleter is in fact unknown.

## Guards

- This is not an argument for committing everything. Scratch files, caches and
  genuine temporaries stay untracked - the test is whether **something else
  depends on it**.
- A check that fires on the normal case is worse than no check
  (`noisy-signal-guard.md`). `zao-guard atrisk` reported 10 empty directories on
  its first run, 9 of them `.git/refs/tags` inside vendored repos; that was fixed
  before shipping, not after.

## Source

Zaal 2026-08-12: *"this is crazy how could this data loss happen, how can we
prevent it."* Issue: bettercallzaal/ZAOOS#3056. Tools: `zao-hook-check`
(zaal-dotfiles#20), `zao-guard` (#22), the `agentic-issue` skill (#21). Siblings:
`silent-failure-guard.md`, `noisy-signal-guard.md`, `state-claims.md`,
`no-rm-rf.md` (deletion is Zaal's), `confirm-before-claiming-absence.md`.
