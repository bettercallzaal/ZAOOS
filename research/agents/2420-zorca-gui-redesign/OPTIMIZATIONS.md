# Ranked optimizations - the ZORCA orchestration layer

Companion to [doc 2420](./README.md) and [SPEC.md](./SPEC.md). Where the SPEC covers the GUI's design, this covers the whole layer - `bin/orca-board` (462 lines, the watcher and drafter) and `gui/zorca-gui` (411 lines) - ranked by value per hour of work.

Every item below was read out of the live code at `~/bin/orca-board` and `bettercallzaal/zorca@gui/zorca-gui` on 2026-08-26. Effort is stated in lines-of-diff and wall-clock, not t-shirt sizes. **Items 1-5 are same-day** - together roughly two hours of work and about 70 lines of diff.

## The five, in order

### 1. Thread the pane scrape - the board is ~13x slower than it needs to be

**Effort: ~15 lines, 20 minutes. Highest value in the file.**

`board()` loops `for t in terminals(): sc = screen(t["handle"])` - one `orca terminal read` subprocess per pane, strictly serial. The GUI's own docstring states the cost: *"pane scraping costs ~1s per pane, so refresh in the background and serve the cache instantly."* At the 13-pane session ZORCA was extracted from, that is a ~13-second refresh, which is why the GUI passes `timeout=120` and caches behind a 20-second refresher.

The scrapes are independent subprocess reads. `concurrent.futures.ThreadPoolExecutor` is stdlib, so the one-file constraint holds:

```python
from concurrent.futures import ThreadPoolExecutor

def board(keep_screen=False):
    ts = terminals()
    with ThreadPoolExecutor(max_workers=8) as ex:
        screens = list(ex.map(lambda t: screen(t["handle"]), ts))
    rows = []
    for t, sc in zip(ts, screens):
        state, ctx, question, tail = classify(sc)
        t.update(state=state, ctx=ctx, question=question, tail=tail,
                 rank=RANK[state])
        if keep_screen:
            t["screen"] = sc
        rows.append(t)
    rows.sort(key=lambda r: (r["rank"], -(r["ctx"] or 0)))
    return rows
```

Cap at 8 workers, not unbounded - each one spawns a process. Expected: ~13s to under 2s, which makes the GUI's whole cache-and-serve dance optional rather than mandatory, and makes `--auto` ticks cheaper.

**Verify:** `time python3 ~/bin/orca-board --json > /dev/null` before and after, on the same live pane set. Paste both numbers.

### 2. Word-boundary the danger words - `"mit "` currently holds every "commit"

**Effort: ~6 lines, 15 minutes. Measured false positives.**

`DANGER` is matched by plain substring (`[w for w in DANGER if w in blob]`). Run against ordinary agent text today:

| input | held because of | correct? |
|---|---|---|
| `submit the form` | `mit ` | **no** |
| `please commit this` | `mit ` | **no** |
| `transmit the file` | `mit ` | **no** |
| `admit defeat` | `mit ` | **no** |
| `republish later` | `publish` | arguably yes |
| `merge conflict resolved` | `merge` | arguably yes |

In a fleet of coding agents, "commit" is one of the most common words on any screen. The hold is firing constantly for the wrong reason, and `noisy-signal-guard.md` is explicit about where that ends: a check that fires on the normal case is a check nobody reads. The rail itself is right - only its matcher is wrong.

```python
import re
DANGER_RE = re.compile(
    r"\b(licen[sc]e|mit|publish|public|delete|archive|push|merge|force|"
    r"rotate|credential|secret|permission|irreversible|third-party|verbatim)\b",
    re.I)

def risky(row):
    blob = (row.get("question", "") + " " + row.get("tail", ""))
    return sorted(set(m.group(1).lower() for m in DANGER_RE.finditer(blob)))
```

`\bmit\b` matches the licence "MIT" and stops matching commit/submit/transmit/admit. Apply the same regex to the draft screen in `auto()`, which uses the identical substring test.

**Verify:** run the six-row table above through `risky()` and confirm the first four no longer hold, while `MIT license` still does. This is a safety rail - it must fail closed, so the test must include a positive case, not only the false ones.

### 3. One-instance lock on `--auto`

**Effort: ~12 lines, 20 minutes.**

`auto()` has no lock - grep of `~/bin/orca-board` for `lock|pidfile|flock` returns nothing. Two watchers on the same panes means two drafts, two sends, two queue entries, and a receipt check that reads the other's text. `agent-loops.md` rule 9 has been paid for once already: one process per resource, and liveness checked by PROCESS, not by a session name.

```python
LOCKF = os.path.expanduser("~/.zao/orca-board.pid")

def claim_lock():
    try:
        pid = int(open(LOCKF).read().strip())
        os.kill(pid, 0)          # raises if the pid is gone
        print("orca-board --auto already running as pid %d" % pid,
              file=sys.stderr)
        sys.exit(3)
    except (FileNotFoundError, ValueError, ProcessLookupError):
        pass
    os.makedirs(os.path.dirname(LOCKF), exist_ok=True)
    open(LOCKF, "w").write(str(os.getpid()))
    atexit.register(lambda: os.path.exists(LOCKF) and os.unlink(LOCKF))
```

Call it as the first line of `auto()`. Exit 3 (not 0) so a supervisor can tell "already running" from "did the work".

**Verify:** start `--auto`, start a second in another shell, confirm the second exits 3 and the first is untouched. Kill the first ungracefully (`kill -9`) and confirm a third start succeeds - a stale pidfile must not wedge the watcher permanently.

### 4. Retry ceiling on DROPPED

**Effort: ~8 lines, 15 minutes.**

The receipt check is the right idea and its failure path has no ceiling:

```python
if probe and probe not in screen(key):
    logline("DROPPED %-20s ...")
    lastsent[key] = 0  # allow immediate retry next tick
```

Setting `lastsent` to 0 bypasses the 240-second cooldown, so a pane that never echoes the text - a pane mid-compaction, a dead session, a pane whose renderer simply does not show it - is re-drafted and re-sent every single tick, forever. Each retry is a Claude draft call. `agent-loops.md` rule 5: every autonomous path needs a hard cap.

```python
drops = {}
...
if probe and probe not in screen(key):
    drops[key] = drops.get(key, 0) + 1
    if drops[key] >= 3:
        logline("HELD  %-22s dropped %dx - not retrying, needs a human"
                % (r["repo"], drops[key]))
        lastsent[key] = time.time()      # fall back to normal cooldown
    else:
        logline("DROPPED %-20s attempt %d/3" % (r["repo"], drops[key]))
        lastsent[key] = 0
else:
    drops.pop(key, None)
```

Three attempts, then it becomes a human-visible HELD line instead of an invisible spend loop.

**Verify:** point `ORCA` at a stub that accepts `terminal send` and returns an empty screen for `terminal read`. The log must show attempts 1/3, 2/3, then one HELD, then nothing.

### 5. GUI in-flight guard + loud staleness

**Effort: ~40 lines, 45 minutes. Fully specified already.**

[SPEC.md](./SPEC.md) sections 1 and 2. `post()` has no in-flight guard, so a double tap sends two `gate-resolve` calls for one human decision; `refresher()` swallows every exception, so a dead refresher renders a normal-looking board. Both are behavior, not styling, and both are written out as drop-in code in the SPEC.

## Then, in order, but not same-day

| # | Item | Effort | Why it waits |
|---|---|---|---|
| 6 | Render the rank `orca-board` already computes; needs-you rail (SPEC 4-5) | ~120 lines, half a day | The largest visible win, but it is a layout rewrite - it wants a clear afternoon, not a gap between two other things |
| 7 | The measured token block (SPEC 3) | ~25 lines, 30 min | Same-day *capable*, ranked below the behavior fixes deliberately: a card at 1.09:1 is ugly, a double-resolved gate is wrong |
| 8 | Tier the cooldown by state | ~4 lines, 15 min | `cooldown = 240` is flat for every pane. A `ctx-critical` pane needs its handoff instruction now; a `waiting` pane can wait 4 minutes. Small, but it changes autonomous send timing - land it after 1-4 are proven stable |
| 9 | Self-exclusion by handle, not title | unknown, needs a spike | `terminals()` skips itself by matching `"ZORCA board"` or `"orca-board"` in the pane title. Rename the pane and the board classifies its own rendered ctx%/state strings as a lane. The fix is to exclude by the board's own terminal handle - but whether Orca exposes it to a child process is **not verified**, so this is a spike first, not a coded task |
| 10 | `run()` splits any spaced non-flag argument | ~4 lines, 15 min | `argv.extend(a.split()) if " " in a and not a.startswith("-")` will split a repo path containing a space. Latent - no current path hits it - so it is a correctness tidy, not a priority |

## What is deliberately NOT on this list

- **Rewriting either tool in another language, or adding a dependency.** One-file stdlib is the constraint that keeps both of these alive.
- **Making `--auto` send more.** The default after 2026-08-25 is queue-for-a-tap, with only the mechanical `ctx-critical` handoff auto-sending. Every item above makes the loop cheaper or safer; none widens what it may do on its own.
- **Merging with `zj` / `zao-wall`.** Related surfaces, separate tools - that reconciliation belongs to [doc 2344](../2344-wall-picked-off-governor/).

## Same-day total

Items 1-5: **roughly 80 lines of diff and about two hours**, of which two items (2 and 3) are safety rails, two (1 and 4) are cost, and one (5) is a correctness bug on a human decision. Each carries its own verify step above; per `loop-evals.md` an item whose verify was not run is NEEDS_WORK, not done.
