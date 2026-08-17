# Liveness Probe Guard - busy is not dead

A health check that cannot tell a **busy** service from a **dead** one will
eventually kill a healthy one. Then it will kill the replacement. The symptom
never looks like "the probe was wrong" - it looks like the service crash-looping.

This rule exists because the same bug was hit three times over five weeks, and
fully root-caused a month in, before anyone wrote it down.

## The three instances (all confirmed, ZAOOS#3065)

`gstack browse` - the headless browser the fleet uses for client-rendered pages.
All three were hit by the zao-artizen lane, in `ZAOartizen/scripts/refresh-fund.mjs`.

1. **2026-07-13.** `browse restart` on an already-healthy session repeatedly
    triggered "crashed twice in a row". Worked around at the call site:
    `refresh-fund.mjs` stopped calling `restart` and started verifying the URL
    after `goto` instead.
2. **2026-08-12.** The same crash-loop, *without* anything calling `restart` - it
    happened inside the binary's own retry logic during a plain `goto`. Same
    signature, different trigger path. Issue filed.
3. **2026-08-17.** Reproduced with **0 orphans on the machine beforehand**, which
    settles that orphans are downstream of the bug, not a precondition for it.

**Root-caused 2026-08-14 by the ignite-radio lane** (investigating instance 2 -
analysis, not a fourth occurrence). Nothing was crashing. `ensureServer()` probes
`/health` with a single `AbortSignal.timeout(2000)`. Measured latency on the
*same* server: **0.007s idle vs 2.02s and 3.92s while a heavy page loads** - a
~150x degradation that crosses the budget. On probe failure it calls
`startServer()`, which `unlinkSync`s the state file and spawns a replacement
**without killing the original**. So: busy server misread as dead -> state file
deleted -> second server spawns on a new port at `about:blank` -> the page
silently vanishes -> the original keeps running, orphaned, holding its Chromium.
Repeat per command. Falsifiable prediction, confirmed: **7 orphaned servers and
36 headless Chromium** before cleanup.

Upstream fixed it in gstack 1.62.0.0 (`probeHealthWithBackoff`, their issue
\#1781); local is 0.9.2.0. Their own code comment describes this exact failure -
independent confirmation of the diagnosis.

## The one principle

**A single short-timeout probe measures load, not liveness.** "No answer within
N ms" and "dead" are different claims, and only the second one justifies killing
something.

## Rules (behavior-changing)

1. **A liveness probe retries with backoff before declaring death.** One timed
    probe is a load measurement. Use several attempts spaced apart (upstream's
    `probeHealthWithBackoff(port, attempts=3, backoffMs=250)` is the reference
    shape). If you are writing the probe, this is the whole fix.

2. **Never spawn a replacement without killing the original.** If a supervisor
    concludes a process is dead and it is wrong, the cost must be one wasted
    check, not an orphan holding a browser. Kill-then-start, or do not start.

3. **Deleting shared state on a failed probe is how you lose the thing you were
    checking on.** `unlinkSync(stateFile)` before the old process is confirmed
    gone destroys the only handle to a service that is still running fine.

4. **When a tool reports "crashed", check whether anything actually crashed.**
    Instance 3 was titled "crash-loops" for two days. Nothing crashed. Look for
    changing PIDs, accumulating processes, and a working first command followed
    by a failing second - that pattern is a supervisor problem, not a crash.

5. **Do not tune the timeout up and call it fixed.** A bigger budget moves the
    threshold; it does not make the probe able to distinguish the two states.
    The number was never the bug.

## The companion clause: an empty result is a failure

Adjacent shape, same session. A fetch can return **HTTP 200, a real final URL,
no exception, and zero content.** Code that trusts the status records "the source
has no data" instead of "I could not read the source" - and that lie propagates
into a dashboard or a research doc as a fact.

**Assert on content, not on status.** For any scrape or fetch whose output feeds
a number someone will act on, treat `length == 0` (or below a sane floor) as a
hard failure. The guard is one line and it is correct regardless of cause.

Honest scope: on 2026-08-17 one lane observed a zero-length 200 from
`artizen.fund` and **could not reproduce it in six subsequent runs across three
configurations**, while a second lane never reproduced it at all. So this is
**not** recorded as a property of that site - it is recorded because the guard
costs nothing and the failure mode is real wherever it occurs.
`silent-failure-guard.md` rule 2 states the general form ("assert the thing it
was supposed to produce exists and is non-empty"); this is that rule pointed
specifically at fetches that feed figures.

## Measure three times before it becomes an artifact

The strongest argument for this rule is not either finding above. It is what
happened to both of them.

Investigating instance 3, the two lanes produced **one unreproduced one-off
each**, and each was caught only because the other lane re-ran the measurement
instead of accepting the report:

- zao-artizen reported a zero-length 200 as site behavior. One observation. Six
  later runs across three configs: not reproducible.
- ignite-radio reported that a desktop-UA recipe yielded **41% more content**,
  superseded their own published advice on it, and credited the other lane. One
  run per config. Re-measured at three runs each: **26,178-26,191 on defaults vs
  26,190-26,191 with the UA** - about 13 characters. Not reproducible.

Both had already been written into durable artifacts - a tracking issue and a
research doc - before anyone re-ran anything.

6. **A single run is an anecdote. Three runs is a measurement.** Anything headed
    for an issue, a rule, a research doc, or a recipe other people will follow
    gets repeated first. Report the spread, not one number.

7. **Apply the same scepticism to your own number as to the one you are
    challenging.** ignite-radio named this asymmetry themselves: they correctly
    refused to accept the incoming zero-length claim without testing it, and in
    the same message published their own single-run 41% figure. Challenging
    someone else's data is exactly the moment your own is least examined.

What survived both retractions was the one variable each lane had independently
measured more than once: the settle window (~23,034 chars at 3s vs ~26,185 at
25s). That holds because they measured separately, **not** because they agreed -
convergence is not proof (`research-grounding.md` rule 3).

## Guards

- This does not ban short probes for cheap, local, uncontended things. It binds
  where a probe's failure triggers a **destructive** action - a kill, a respawn,
  a state-file delete, a failover.
- Do not patch a vendored dependency to fix this if an upstream release already
  has. The 2026-08-14 lane attempted a minimal backport of
  `probeHealthWithBackoff`, measured that it **regressed the working case**, and
  deliberately shipped nothing. That was the right call. Upgrade, or leave it and
  route around at the call site.
- Routing around at the call site is legitimate and was the right move twice
  here - but log it as a workaround, or instance N+1 gets diagnosed from scratch.

## Source

Written 2026-08-17 by the zao-artizen lane at ignite-radio's request, after that
lane root-caused the bug on 2026-08-14 and then stopped for a fleet refresh.
Three instances, fully root-caused a month in, and still zero rules - which is
exactly the failure `agentic-issue` exists to prevent, recurring inside the
tooling that skill monitors. The "measure three times" section was added after
both lanes retracted
an unreproduced one-off during the same investigation - each caught by the other,
neither caught by its author. Tracking issue: bettercallzaal/ZAOOS#3065.
Siblings:
`silent-failure-guard.md` (green while broken - the general form of the companion
clause), `noisy-signal-guard.md` (red while fine), `anti-fabrication.md`
(evidence or UNVERIFIED), `vanishing-dependencies.md`.
