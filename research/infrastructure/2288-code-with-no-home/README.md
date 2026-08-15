---
topic: infrastructure
type: audit
status: research-complete
last-validated: 2026-08-15
superseded-by:
related-docs: 2282, 2285, 2264
original-query: "Three times in one day ZAO code turned out to have no reviewable home: the VPS ~/bin (git repo, no remote), the Pi's scripts, and the ZOL agent inside a third-party clone with push disabled. Inventory every ZAO-authored file living outside a repo we control, with a per-file keep/move call."
tier: AUDIT
---

# 2288 - The code that only exists on one machine

> **Goal:** Find every ZAO-authored file that would be lost if its host died, and
> say which ones to move first. **Nothing was moved.**

This came out of three separate encounters on 2026-08-14, each found while doing
something else: `bus-poll.py` (VPS `~/bin`, no remote), `zao-loop-health` (same),
and the ZOL agent (a third-party clone with push disabled). Three in one day is
not a coincidence, it is a pattern nobody had looked at.

## The exposure

| host | location | repo? | files | at risk |
|---|---|---|---:|---|
| Mac | `~/bin` -> `~/zaal-dotfiles/bin` | **yes**, `bettercallzaal/zaal-dotfiles` | 50 | 1 untracked |
| VPS | `~/bin` | git, **NO REMOTE** | **101** | **all 101** |
| VPS | `~/.zao` | not a repo | 0 scripts | - |
| Pi | `~/*.sh`, `~/*.js` | **no repo at all** | **5** | **all 5** |
| Pi | `~/bin` | not a repo | 1 | 1 |
| Pi | `~/zol/farcaster-agent/zol-*.js` | third-party clone, **push disabled** | **15** | all 15 |

**Roughly 122 ZAO-authored files exist on exactly one machine.** The Mac is the
only host that is actually backed up, and it is the one Zaal is migrating away
from (doc 2264).

## What is load-bearing

Most of the 101 VPS files are old or one-off. The ones that matter are the ones
something calls on a schedule. **20 of them are referenced by cron:**

```
affirmation.sh          fleet-health.sh          routine.sh
brand-boards.py         fleet-spend-guard.sh     stall-tripwire.py
bus-poll-run.sh         loop-watchdog.py         zao-daily-agent-tip.sh
cost-of-pass-summary.sh loops-keepalive-failover.sh  zao-loop-health
disk-guard.sh           loops-report.sh          zao-morning-sweep.sh
disk-hygiene.sh         ollama-keepwarm.sh       zoe-autodeploy.sh
fleet                   fleet-brain-check.sh
```

`zoe-autodeploy.sh` is on that list. **If the VPS dies, the thing that deploys
ZOE dies with it**, and it exists nowhere else.

On the Pi, only one script is in cron - and it is the worst one to lose:

- **`start-fleet.sh`** - the self-healer that restarts all 7 Pi sessions every 15
  minutes and on reboot. Everything on the Pi stays alive because of this file,
  and it is in no repository.
- **`zoe-enqueue.sh`** - the bridge from the Pi scouts to ZOE's work queue on the
  VPS. Not in cron directly (the loops call it), and also in no repository.

## Untracked, so not even locally recoverable

Six files on the VPS are untracked in its own local git:

```
bus-poll.py.new                  zao-claude
loops-report.sh.bak-<epoch>      zao-loop-health
loops-report.sh.bak-<epoch>      zao-loop-health.bak-2026-08-15
```

**Two of those are mine, from today** - `bus-poll.py.new` and the
`zao-loop-health.bak`. Deploying without committing on the target is the same
habit that produced this doc, and I did it twice while writing it.

`zao-claude` is untracked and not a backup file, so it is somebody's real script
sitting outside version control entirely.

On the Mac, the single untracked file is
`claude/memory/zaoos/feedback_session_name_is_live_status.md` - the duplicate
memory I created and already flagged for deletion. Not a gap, just litter.

## How this keeps happening

Not carelessness. Three different mechanisms, each reasonable on its own:

1. **`~/bin` on the VPS was `git init`-ed and never given a remote.** It looks
   version-controlled - `git log` works, commits succeed - so the missing half is
   invisible until you try to push. I committed `bus-poll.py` there yesterday and
   only noticed the gap when I went looking for the PR.
2. **The Pi's scripts were written straight into `$HOME`.** No repo was ever
   involved, so there is nothing to notice.
3. **ZOL was built inside a clone of someone else's project.** Push is disabled
   *on purpose* - the remote is literally
   `DISABLED_no_push_this_is_a_third_party_clone` - which is the correct guard
   against pushing to a stranger's repo, and also means 15 ZAO files have nowhere
   to go.

The shape they share: **each looked like it had a home.** A git repo with no
remote, a directory that was never a repo, and a repo that belongs to someone
else all feel like version control from the inside.

## Where they could go

No recommendation is free of a deployment question, which is why this doc stops
at options.

| option | fits | cost |
|---|---|---|
| **`zaal-dotfiles`**, restructured `bin/{mac,vps,pi}` | It already IS the pattern for the Mac's `~/bin`, and has a remote | needs per-host layout and a pull step on each box |
| **ZAOOS `scripts/`** | Already how `zao-loop-health` landed; CI and review come free | ZAOOS is the lab, not an ops repo - it would grow a second identity |
| **A new `zao-ops` repo** | Cleanest separation; ops code gets its own review surface | one more repo to keep alive, and nothing deploys from it yet |

Whichever wins, **deployment has to be answered in the same breath.**
`zoe-autodeploy.sh` pulls ZAOOS every 10 minutes; nothing pulls `~/bin` on any
host. Moving the files without a pull path just relocates the problem and adds
drift - the live copy and the repo copy diverge silently, which is worse than one
copy in one place.

## Suggested order, if it goes ahead

1. **The 6 Pi files.** Smallest set, no repo at all, and `start-fleet.sh` is the
   single point of failure for the entire Pi fleet.
2. **The 20 cron-referenced VPS scripts**, starting with `zoe-autodeploy.sh`.
3. **The remaining 81 VPS `~/bin` files** - triage first; many are probably dead.
4. **The 15 ZOL files** - a separate decision, because it also asks whether ZOL
   should have its own repo rather than living in a stranger's.

## What was NOT done

Nothing moved, nothing deleted, no repo created. Zaal chose "audit first, then
decide" (quick-grill, 2026-08-15), and moving live code that cron depends on is
exactly the change that should not happen inside an audit.

## Sources

Read live over SSH on 2026-08-15; no host modified except the already-authorised
`zao-loop-health` deploy.

- `git remote -v` and `git status --porcelain` in `~/bin` on Mac, VPS and Pi
- `crontab -l` on VPS and Pi, cross-referenced against `~/bin` filenames
- `git -C ~/zol/farcaster-agent remote -v` - the disabled push remote
- file counts per host; `ls ~/*.sh ~/*.js` on the Pi

## Footnote: this doc was blocked by its own subject matter

The first attempt to commit it was rejected by the pre-commit PII scan, which
read the two `loops-report.sh.bak-<epoch>` filenames as US phone numbers. They
are Unix timestamps. The scanner was fixed rather than bypassed (PR #3103), and
the epoch digits are genericised above so this doc does not depend on that fix
to merge.
