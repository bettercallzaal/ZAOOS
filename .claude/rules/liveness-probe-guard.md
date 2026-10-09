# Liveness Probe Guard - busy is not dead

A probe that cannot tell a busy service from a dead one eventually kills a healthy one. The three `gstack browse` instances and the root cause (ZAOOS#3065): `research/dev-workflows/2649-rules-history/archive/liveness-probe-guard.md`. Rule numbers are stable.

**A single short-timeout probe measures load, not liveness.** Binds wherever a probe failure triggers a destructive action (kill, respawn, state-file delete, failover).

1. **A liveness probe retries with backoff before declaring death** (reference shape: `probeHealthWithBackoff(port, attempts=3, backoffMs=250)`).
2. **Never spawn a replacement without killing the original.** Kill-then-start, or do not start.
3. **Never delete shared state on a failed probe** before the old process is confirmed gone.
4. **When a tool reports "crashed", check whether anything crashed** - changing PIDs, accumulating processes, a working first command then a failing second = a supervisor problem.
5. **Do not tune the timeout up and call it fixed.**
6. **A single run is an anecdote; three runs is a measurement.** Anything headed for an issue, rule, doc, or recipe is repeated first; report the spread.
7. **Apply the same scepticism to your own number as to the one you are challenging.**

**Companion: an empty result is a failure.** For any fetch whose output feeds a number someone acts on, assert on content (`length == 0` or below a sane floor = hard failure), not on status.

Guards: short probes for cheap, local, uncontended things are fine. Do not patch a vendored dependency if upstream has fixed it - upgrade, or route around at the call site and log it as a workaround.
