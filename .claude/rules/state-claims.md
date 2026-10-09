# State Claims - name the source, or do not make the claim

The proxy always wins on effort and is wrong exactly when the answer matters. The eight-wrong-claims session and every dated incident below: `research/dev-workflows/2649-rules-history/archive/state-claims.md`. Instance list: `measurement-traps.md`. Rule numbers are stable.

1. **A state claim carries its source, in the sentence.** "The lockfile pins 1.42.0", not "we're on 1.42.0". "A grep for call sites outside the module and its tests found nothing", not "nothing imports it".
2. **Use `zao-verify`:** `dep <name>` (installed vs range vs disk), `wired <module>` (real importers), `flag <NAME>` (the literal the code accepts), `exists <term>` (what already covers this), `env` (toolchain installed at all). Uncovered questions: name the source by hand.
3. **Before believing any tool, confirm it can run** (`zao-verify env`). Hundreds of errors on a healthy repo is a missing `node_modules`, not a finding.
4. **A DELTA instead of an ABSOLUTE means you have adapted to a broken instrument.** Establish the baseline and why, re-derived against the CURRENT target.
5. **"Merged" is not "running".** BUILT, WIRED, FLAGGED, LIVE are separate states; use `zoe-liveness --remote`. A flag set to a value the code rejects does nothing.

## Silence is not evidence

You cannot conclude a feature did NOT run from absent logs unless it can log. `featureRan(name, detail)` prints one `[zoe/ran]` line per process the first time a feature executes, placed on the SUCCESS path at the point of effect, never at import time. Before reporting a feature is or is not running: (1) does it emit anything on success? if not, fix observability first; (2) is the line on the success path or only in a `catch`? (3) say which you measured.

## A process needs a heartbeat before its silence means anything

Before claiming a fix to a long-running process is in effect: (1) name the process, not the code (`pgrep -fl`, `launchctl list | grep <label>`); (2) point at a surface the process itself writes (a beat file in `~/.zao/beats/`, a timestamped log line from this boot, a pid) - if you cannot, the fix is not verified; (3) if no such surface exists, adding one (one line per cycle) IS the first fix; (4) killing it is the only proof it restarts (`kill -9`, watch for a new pid). A test result describes a file; the question was about a process.

## A claim carries its DATE as well as its source

1. Never write "today", "this week", "currently", "now" or "recently" into anything that outlives the conversation - write the date.
2. Stamp any figure that can move: `as of YYYY-MM-DD`.
3. Resolve a time-relative claim against when it was WRITTEN; if you cannot tell, that is the finding.
4. Check the day-name against the date (`date -j -f %Y-%m-%d`).
5. A local clone is a time-relative claim: measure against `origin/main` or production.

## Filesystem metadata is not file age

mtime is when a file was last written; bulk syncs make it meaningless. In a git repo, content age is `git log --diff-filter=A --format="%ci" -1 -- <file>`. Before sorting or pruning by age, spot-check two or three files that mtime is not synthetic. Never use `stat` as a proxy for content age.

**The tell:** before writing "it's built", "nothing does X", "we're on version Y", or "that's deployed", ask which file would prove me wrong, and open it. If you cannot name one, phrase the claim as memory. "I did not check" always beats a confident wrong answer. This applies hardest to autonomous and overnight work.
