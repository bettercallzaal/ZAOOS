# Measurement Traps - cheap signals that lie, and what to read instead

The instance list for `state-claims.md`. Add an entry each time a new trap is found. Each trap's incident and full text: `research/dev-workflows/2649-rules-history/archive/measurement-traps.md`. Trap numbers are stable.

1. **`ps -o pcpu` is a lifetime average, never current usage.** RIGHT: `top -b -n 2 -d 2` and read the SECOND sample; CHECK `uptime`. If a per-process figure and the load average disagree, the load average wins.
2. **Counting a word in HTML is not detecting an error** (Next.js RSC data contains `"error"` on every page). Strip script/style/tags and read visible text; run the identical count on a known-good page. A detector never run against a known-good input is not a detector.
3. **A source comment is a claim about intent, not deployed reality.** Query the live system; when source and runtime disagree, surface the contradiction.
4. **`pgrep -af <name>` matches its own command line - and on this Mac, Claude sessions whose prompt names the job** (a `claude` process's argv IS its prompt). Any `-f` match is suspect in both directions. RIGHT: `ps -o pid=,lstart=,command= -p <pid>`, or `zao-assert procs <regex>` (zaal-dotfiles `bin/zao-assert`), which excludes `claude` processes and its own chain, prints each exclusion and the unfiltered count; exit 0 running, 1 not, 2 when `ps` cannot answer.
5. **A stopped process is not stopped if a supervisor exists.** Stop it, wait past the supervisor's interval, re-check; CHECK `crontab -l | grep -iE "keepalive|watchdog|start-|heal"`.
6. **Provider telemetry is blind to most of what it bills for** (fields present but silently empty for most rows). Use caller-side receipts; treat provider data as partial reconciliation.
7. **A 200 with a body is not a success.** Assert on content - a length floor or a required substring.
8. **An error is not an empty queue.** Never `out=$(cmd 2>/dev/null || true)`; capture the status separately and branch on it. A loop that cannot tell error from empty cannot back off.
9. **A noise-reducing flag can delete the measurement** (`-v error`, `-q`, `-s`, `--silent`, `2>/dev/null`). If a measurement returns nothing, re-run with the quieting removed before concluding zero.
10. **The active item is not the population.** When a setting is global and consequences are local, enumerate the whole blast radius, not the item in front of you.
11. **A pre-written label asserts the result before the command runs.** Never write `(empty means X)` next to a command whose output you have not seen; write labels after reading the result.
12. **A verification that creates an artifact forces a cleanup, and the cleanup is where damage happens.** Prefer read-only checks (`python3 -c "import ast,sys; ast.parse(open(sys.argv[1]).read())" <file>` or `PYTHONDONTWRITEBYTECODE=1`, not bare `py_compile`); direct unavoidable artifacts somewhere disposable.
13. **A plausible attribution is not a measured one.** Before crediting a person, lane, or source with a specific claim, quote it or attribute loosely; any count, id, or name you cannot point at the source of is said to be unsourced.

## The gate - ask while choosing the command, not after

1. Lifetime average or interval? 2. Detector run against a known-good input? 3. Source or runtime? 4. Could my search be matching itself, or a Claude prompt that names it? 5. Is something supervising what I changed? 6. Does this provider observe what I am attributing? 7. Content or status code? 8. A quieting flag between me and the measurement? 9. Global change, local check? 10. Conclusion written before the command ran? 11. Did my check leave anything I now want to delete? 12. Crediting a claim I could not quote?

This is a list, not a theory: a trap not listed is still a trap.
