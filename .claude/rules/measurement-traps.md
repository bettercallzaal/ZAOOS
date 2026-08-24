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

## The gate

Before reporting any measured claim, ask **which of these seven shapes am I in**:

1. Is this figure an average over a lifetime, or an interval?
2. Have I run my detector against a known-good input?
3. Am I reading source, or runtime?
4. Could my search be matching itself?
5. Is something supervising the thing I just changed?
6. Does this provider actually observe what I am asking it to attribute?
7. Did I assert on content, or on a status code?

Answering all seven costs seconds. Six of the eight wrong claims in the
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
