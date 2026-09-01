# Measurement Traps - the specific cheap signals that lie, and what to read instead

`state-claims.md` says the proxy always wins on effort and is wrong exactly when
the answer matters. That rule is correct and it did not stop a single one of the
failures below, because it names the SHAPE and not the INSTANCES. A tired session
reaches for `ps` without ever thinking "am I using a proxy right now".

This file is the instance list. It is deliberately concrete: each entry is a
command that was actually run, the wrong answer it gave, and the command that
gives the right one. Add to it every time a new one is found.

## The traps

### 1. `ps -o pcpu` is a LIFETIME AVERAGE, never current usage

A process that burned 107% for 26 days and then went idle reports **106% forever**.

```
WRONG   ps -eo pcpu,args --sort=-pcpu        -> ollama 107%  (idle for hours)
RIGHT   top -b -n 2 -d 2 | grep ollama       -> 0.0%   (read the SECOND sample)
CHECK   uptime                               -> load 0.11 contradicts 107% on 2 cores
```

Hit 2026-08-23, while measuring whether stopping the fleet had worked - so the
wrong number was reported at the exact moment its accuracy mattered most, and it
sent a "sudo systemctl stop ollama" instruction that was unnecessary. The first
`top` sample is also a lifetime average; only the second is an interval.

**If a per-process figure and the load average disagree, the load average wins.**

### 2. Counting a WORD in HTML is not detecting an error

```
WRONG   grep -c "error" page.html            -> "6 errors, page is broken"
RIGHT   strip <script>/<style>/tags, read the visible text
CHECK   run the identical count on a page known to be FINE
```

Hit twice on the same page. Next.js App Router emits `"error":"$3"`,
`errorStyles`, `errorScripts` in RSC flight data on **every** page. The control
test settles it in one command: the page called "fine" had the identical six.

**A detector that has never been run against a known-good input is not a
detector.** This is `noisy-signal-guard.md` in its most literal form.

### 3. A source comment is a claim about INTENT, not about deployed reality

```
WRONG   read the code comment / the migration file
RIGHT   query the live system
```

`heart-canary.ts` says `effect_intents` "is not applied yet" and carries a catch
for `relation does not exist`. The table is applied, with 12 columns and 3
constraints. Building from the comment would have produced a duplicate table.

Same week: a rule file loaded into every session said six CLIs were missing;
all six resolved with `command -v`.

**Source tells you what the code believes. Runtime tells you what is deployed.
When they disagree, surface the contradiction - do not silently pick the source
because it looks authoritative.**

### 4. `pgrep -af <name>` matches its own command line

```
WRONG   pgrep -af "lane-relay-daemon"        -> 2 PIDs, "two daemons running"
RIGHT   ps -o pid=,lstart=,command= -p <pid> -> one is pgrep itself
```

Produced a confident "two daemons are running, split-brain" report. There was one.

### 5. A stopped process is not stopped if a supervisor exists

```
WRONG   tmux kill-session / systemctl stop; report "stopped"
RIGHT   stop it, WAIT past the supervisor's interval, then re-check
CHECK   crontab -l | grep -iE "keepalive|watchdog|start-|heal"
```

Sixteen loops came back within seconds, twice. `*/3 * * * *
loops-keepalive-failover.sh` resurrects any dead loop every three minutes. The Pi
runs `*/15 * * * * start-fleet.sh`, which deliberately checks the PROCESS rather
than the session name.

**That is also why farscout survived two months of being retired in writing.**
Killing it was never enough and nobody knew. **A supervised process cannot be
stopped by stopping it.**

### 6. Provider telemetry is blind to the majority of what it bills for

```
WRONG   sum(response.headers.content_length) from the edge logs
RIGHT   caller-side receipts; treat provider data as PARTIAL reconciliation
```

Measured: 84% of Supabase edge-log requests (34,908 of 41,647) carry **no**
`content_length` - precisely the chunked large responses that generate the bill.
The field exists and returns a number, so the query looks answerable and the
answer is nonsense (4,292 requests summing to 3,356 bytes).

Independently on a second provider: **99.1% of OpenRouter token volume is
attributed to "Unknown"** because callers do not send `X-Title`.

**A field that is present, queryable, and silently empty for most rows is worse
than a missing one.** A missing field fails loudly at query time; this yields a
confident dashboard that undercounts the worst offenders.

### 7. A 200 with a body is not a success

```
WRONG   check the status code
RIGHT   assert on CONTENT - a length floor, or a required substring
```

Two of eleven Reddit fetch routes returned **HTTP 200** carrying an Anubis
proof-of-work challenge and a "You've been blocked by network security" page.
Real headless Chrome returned 200 with the block page too.

Already `silent-failure-guard.md` rule 2; repeated here because it recurs in
every new fetch path.

### 8. An error is not an empty queue

```
WRONG   out=$(cmd 2>/dev/null || true)       -> a 402 looks like "no messages"
RIGHT   capture the status separately; branch on it
```

`zao-relay inbox` raises on non-2xx. The call site discarded both status and
stderr, so after the quota blew the daemon polled a **dead** hub at full cadence
for fifteen hours - thousands of requests, every one a 402, changing nothing.

**A loop that cannot tell an error from an empty result cannot back off**, and
one that cannot back off turns an outage into a bill.

### 9. A noise-reducing flag can silently delete the measurement

```
WRONG   ffmpeg -v error -i test.mkv -af volumedetect -f null -   -> EMPTY output
RIGHT   ffmpeg -i test.mkv -af volumedetect -f null -            -> the numbers
```

`volumedetect` writes its results at **info** level. `-v error` was added to
suppress ffmpeg's banner noise and suppressed the answer with it. The command
exits 0 and prints nothing, which reads exactly like "this file has no audio".

Hit 2026-08-23 by the windows-desktop lane, which nearly reported "no audio
analysis available" for a file whose audio was fine.

**The general form: a flag chosen to reduce noise can remove the signal.** Any
`-q`, `-s`, `--silent`, `--quiet`, `-v error` or `2>/dev/null` sitting between
you and a measurement is a suspect. If a measurement command returns nothing,
re-run it with the quieting removed BEFORE concluding the thing measures zero.

### 10. The active item is not the population

```
WRONG   check the ACTIVE scene collection, conclude about all collections
RIGHT   enumerate every collection, check each
CHECK   is the setting I changed PER-ITEM or PROFILE-WIDE?
```

An OBS canvas change is **profile-level**, so it applied to every scene
collection. Transforms were reset in the active one only. Measured afterwards:

```
Baraza Live   0 of 91 items wrong   (the one that was checked)
WW1          29 of 46 items wrong   (that night's actual rig)
Untitled      9 of 19 items wrong
```

Twenty-nine elements of the live show would have rendered at 2-3x oversize, and
**the encode test would have passed the whole time** - the file was valid, the
geometry was wrong.

**The general form: when a setting is global and its consequences are local,
checking the local thing in front of you proves nothing about the rest.** Ask
what the blast radius of the change actually was, then enumerate that set.

### 11. A pre-written label asserts the result before the command runs

```
WRONG   echo "(empty above = no reservation)"; git ls-remote --tags origin doc-2422
RIGHT   run it, READ the output, then write the sentence
CHECK   does my label survive the opposite result?
```

Hit **three times in one session** on 2026-09-01, by the same agent, inside the
session that was writing the research doc about this exact failure class.

| The label written in advance | What the command actually returned |
|---|---|
| `"(empty above = no reservation, which is the false positive)"` | a real tag, `refs/tags/doc-2422` - the reservation existed |
| `"open-PR hits for 2443: none above = none"` | correct, but the paired branch grep returned **2**, one of them a commit SHA containing `2443` |
| `"(no output = not ignored, which is why it keeps appearing)"` | `__pycache__/` was already ignored, at `.gitignore:17` |

Each one shipped a conclusion into a durable artifact - a committed vault note in
the first case, which then needed two corrections.

**Why this is its own trap and not just carelessness.** The label is written at
the moment you *choose* the command, when you already have a hypothesis and the
output does not exist yet. It reads like part of the measurement and it is
actually a prediction. Worse, it is printed *adjacent to* the real output, so a
later reader - or a later you - sees an assertion and a result side by side and
assumes the first describes the second.

This is the mechanism behind trap 2 (a detector never run against a known-good
input) pushed one step earlier: there, the detector was untested; here, the
verdict was written before any detector ran at all.

**The rule.** Never write `(empty means X)` or `(no output = Y)` next to a
command whose output you have not seen. If a label is genuinely useful, write it
*after* reading the result, when it is a description rather than a forecast. And
if you catch yourself writing one, that is the signal you already believe the
answer - which is exactly when `state-claims.md` says to open the file that would
prove you wrong.

### 12. A verification that creates an artifact forces a cleanup, and the cleanup is where the damage happens

```
WRONG   python3 -m py_compile <file>     # writes __pycache__/ as a side effect
RIGHT   python3 -c "import ast,sys; ast.parse(open(sys.argv[1]).read())" <file>
ALSO    PYTHONDONTWRITEBYTECODE=1 python3 -m py_compile <file>
```

Found and self-reported by the obsidian lane, 2026-09-01, after the supervisor's
watcher flagged an `rm -rf bin/__pycache__` in a worktree.

Nothing was lost - the live tree was never in scope, and `__pycache__/` turned
out to be gitignored at `.gitignore:17` with `git log --all` showing it was never
tracked, so the cleanup was solving a problem that did not exist. The useful part
is the sequence one step back:

**Reach for a verification that produces an artifact, then reach for a banned
shape to clean up the artifact.**

The syntax check was correct and the instinct to leave the tree clean was
correct. The delete was the only wrong step, and it existed solely because the
check had written something. A verification that leaves no trace never generates
that second decision.

This generalises past Python. Anything that builds, caches, compiles, or
snapshots as a side effect of *checking* - a test run that writes fixtures, a
linter with a cache directory, a build used only to prove the build works -
creates the same pressure. Prefer the read-only form of a check where one exists,
and where it does not, direct the artifact somewhere disposable rather than
cleaning it out of a repo afterwards.

The rule it collides with is `no-rm-rf.md`, whose whole point is that the SHAPE is
banned so nobody has to adjudicate whether a particular directory was safe. The
lane's own words on that: *"a directory of bytecode is still a directory."*

### 13. A plausible attribution is not a measured one - who said it is checkable

```
WRONG   "your --reachable point landed"        -> a different lane said it
RIGHT   grep the transcript for the sentence before crediting it
CHECK   could I quote the line, or am I recalling the gist?
```

Three instances in one session, 2026-09-01, all by the same agent and all of the
same shape - a specific, checkable claim asserted from recall because it was
plausible:

| The claim | What checking showed |
|---|---|
| "~7 briefs produced a durable artifact" | **34** briefs, 88 references. Off by 5x, and stated as though counted |
| "your `--reachable` point landed" (to the obsidian lane) | **zaostock** said it. obsidian had never mentioned it |
| "(no output = not ignored)" and two more pre-written labels | trap 11 - the output contradicted the label |

The middle one was caught by the lane it was wrongly credited to, whose reply is
the best statement of the trap: *"if it came from a summary of my messages then
the summary invented it. Worth chasing, because it is the same class as your '~7
briefs' estimate: a plausible thing that no one actually said."*

**Why it is distinct from ordinary sloppiness, and from trap 11.** Trap 11 is a
verdict written before a command runs. This is a verdict written after reading -
you did have the source, you just did not re-open it. Attribution and counts feel
like memory rather than measurement, so the instinct to verify never fires. And
both errors are *plausible by construction*: a summary invents the most likely
sentence, and the most likely sentence is exactly the one that survives review.

**Why it matters more in a multi-lane estate than it looks.** Crediting the wrong
lane corrupts the record of who found what, which is the only signal for which
lane to trust on what. It also wastes the wronged lane's turn correcting it. And
`credit-attribution.md` makes naming the source an ethos rule, not a nicety -
this is that rule failing inward, at teammates, rather than outward at an OSS
author.

**The rule.** Before crediting a person, a lane, or a source with a specific
claim: quote it, or attribute it loosely. "Someone raised X" is honest.
"Your point about X" names a person and is a factual claim about who said what -
which is checkable, and therefore has to be checked. Same for any count, id, or
name you are about to write into a message or a doc: if you could not point at
where it came from, say so in the sentence.

## The gate

Before reporting any measured claim, ask **which of these seven shapes am I in**:

1. Is this figure an average over a lifetime, or an interval?
2. Have I run my detector against a known-good input?
3. Am I reading source, or runtime?
4. Could my search be matching itself?
5. Is something supervising the thing I just changed?
6. Does this provider actually observe what I am asking it to attribute?
7. Did I assert on content, or on a status code?
8. Is a quieting flag sitting between me and the measurement?
9. Was the change global while I only checked the local case?
10. Did I write the conclusion before the command ran?
11. Did my check leave anything behind that I now want to delete?
12. Am I crediting a claim I could not quote?

Answering all twelve costs seconds. Six of the eight wrong claims in the
2026-08-22/23 session would have died at question 1, 2, or 3.

## Guards

- This is a LIST, not a theory. Add an entry when a new trap is found; do not
  rewrite the principle, which `state-claims.md` already states correctly.
- Naming a trap does not retire the general rule. A trap not on this list is
  still a trap - the list is the cheap catch, not the complete one.
- Do not let this become a checklist performed at the end. The questions are
  cheapest asked while choosing the command, not after quoting its output.

## Source

The 2026-08-22/23 session, in which eight wrong claims were made and corrected,
six of them by the author re-checking their own prior report. Traps 1, 2 and 5
were committed while auditing the systems that the same session was cataloguing.
Siblings: `state-claims.md` (the principle), `noisy-signal-guard.md` (trap 2),
`silent-failure-guard.md` (traps 7, 8), `confirm-before-claiming-absence.md`
(trap 3), `vanishing-dependencies.md`. Tool: `zao-verify`, whose stated job is
"answer state questions from the authoritative source" - these are the questions
it should grow subcommands for.
