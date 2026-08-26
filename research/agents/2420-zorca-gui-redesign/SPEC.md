# SPEC - ZORCA GUI redesign, build-ready

**Target file:** `bettercallzaal/zorca` -> `gui/zorca-gui` (411 lines, stdlib-only Python).
**Companion research:** [doc 2420 README](./README.md).
**Constraint that does not move:** one file, stdlib only, localhost only, no build step, no CDN, no new mutation endpoints.

Implement in the numbered order. Sections 1-3 are behavior and ship first; 4-6 are layout and ship second. Every section ends with its own acceptance check.

---

## 1. In-flight guard on every mutating tap (HIGH - fixes duplicate gate resolution)

**Problem:** `post()` fires on every click with no guard. Two taps on the same gate option send two `orca orchestration gate-resolve` calls for the same id.

**Change:** replace the existing `post()` with:

```js
const INFLIGHT = new Set();
async function post(url, body, el){
  const key = url + "|" + (body.id || body.handle || body.i);
  if (INFLIGHT.has(key)) return;
  INFLIGHT.add(key);
  if (el) { el.disabled = true; el.dataset.was = el.textContent; el.textContent = "..."; }
  let ok = false, why = "";
  try {
    const r = await fetch(url, {method:"POST", body: JSON.stringify(body)});
    ok = r.ok;
    if (!ok) why = " (" + r.status + ")";
  } catch (e) {
    why = " (no server)";
  }
  toast(ok ? "done" : "failed" + why, ok);
  INFLIGHT.delete(key);
  if (el && el.dataset.was) { el.disabled = false; el.textContent = el.dataset.was; }
  load();
}
function toast(msg, ok){
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = ok ? "" : "bad";
  t.style.display = "block";
  setTimeout(()=>t.style.display="none", ok ? 1800 : 4000);
}
```

Every existing call site gains `this` as the third argument: `onclick='post("/api/resolve",{...}, this)'`. The pane card and lane rows pass `this` too.

**Server side,** make the double-resolve harmless even if a second call arrives: in `do_POST` under `/api/resolve`, keep a module-level `RESOLVED = set()` and return `{"ok": true, "dup": true}` without shelling out when `body["id"]` is already in it. Add the id on a successful resolve.

**Accept:** rapid-fire five clicks on one gate option. `orca orchestration gate-list` shows one resolution; the button greys during flight; no second `gate-resolve` process appears in `ps`.

---

## 2. Staleness must fail loud (HIGH - fixes silent failure)

**Problem:** `refresher()` wraps `refresh()` in a bare `except: pass`, and the only freshness signal is a small dim "as of 10:42:13" stamp. A refresher that has been dead for an hour renders a normal-looking board.

**Change - server:** track the last error and the last success.

```python
CACHE = {"ts": 0, "panes": [], "tasks": [], "gates": [], "run": "",
         "drafts": [], "resolved": [], "lanes": [], "log": [],
         "err": "", "err_ts": 0}
```

In `refresher()`:

```python
def refresher():
    while True:
        try:
            refresh()
            with LOCK:
                CACHE["err"] = ""
        except Exception as e:
            with LOCK:
                CACHE["err"] = "%s: %s" % (type(e).__name__, e)
                CACHE["err_ts"] = time.time()
        time.sleep(20)
```

**Change - client:** the stamp becomes a badge with three states, driven by `age = Date.now()/1000 - s.ts`:

| age | render | class |
|---|---|---|
| < 45s | `live` + a dim `10:42:13` | `.fresh` |
| 45-90s | `as of 10:42:13` | `.aging` |
| > 90s | `STALE 4m - refresher may be dead` | `.stale` (warn colour, gold left border on the header) |

If `s.err` is non-empty, the badge always renders `.stale` and appends the error text, regardless of age. The badge lives in the header, at 13px, never below the fold.

**Accept:** `kill -STOP` the process's refresher thread is not directly reachable, so test by pointing `ORCA` at a nonexistent path and restarting: within 90 seconds the header must read STALE plus a `FileNotFoundError`. The board must never look normal while the data is old.

---

## 3. The token block (measured, drop-in replacement)

Replace the `:root` rule wholesale. Navy and gold are unchanged - they are the brand (`community.config.ts:20,24`).

```css
:root {
  /* brand - locked, do not tune */
  --navy:#0a1628;
  --gold:#f5a623;

  /* surfaces - measured against --navy */
  --panel:#16283f;          /* 1.25:1 on navy - a visible card, was 1.09 */
  --panel-raised:#1d3352;   /* 1.17:1 on panel - hover / expanded state */

  /* borders */
  --line:#26405f;           /* decorative hairlines, dividers */
  --line-interactive:#5679a5; /* 3.32:1 on panel, 4.04:1 on navy - clears WCAG 1.4.11 */

  /* text - all >= 4.5:1 on both navy and panel */
  --text:#e8edf5;           /* 12.67:1 on panel */
  --dim:#9bb0cd;            /* 6.73:1 on panel, was #8ba0bf at 6.22 */

  /* status */
  --ok:#3ddc84;             /* 8.35:1 on panel */
  --warn:#ff7a7a;           /* 5.90:1 on panel, was #ff5d5d at 5.50 */
  --info:#6fb3ff;           /* 6.79:1 on panel */

  /* geometry */
  --r:10px;
  --gap:14px;
}
```

**Rules that go with the tokens:**

- Any element with an `onclick` uses `--line-interactive` for its border. Static cards use `--line`.
- `--panel-raised` is the hover and expanded background. `.card:hover{background:var(--panel-raised)}`.
- Focus is never removed. Add globally:
  ```css
  :focus-visible { outline:2px solid var(--gold); outline-offset:2px; border-radius:4px; }
  ```
- Nothing may be styled with a raw hex outside `:root`. The current file has three (`#6fb3ff` in `.st-dispatched`, and inline `var(--navy)` button backgrounds are fine but the blue is not tokenised). Route it through `--info`.

**Accept:** paste the token values into the contrast script from the research doc and paste its output into the PR body. Every text token >= 4.5 on both `--navy` and `--panel`; `--line-interactive` >= 3.0 on both.

---

## 4. Layout: one NEEDS-YOU rail, everything else demoted

**Problem:** seven equal-weight sections in a symmetric 1fr/1fr grid. A gate that needs a decision has the same visual authority as the watcher log tail.

**New structure** (replace the `<body>` markup):

```html
<header>
  <h1>ZORCA <small id="run"></small></h1>
  <div id="freshness"></div>
</header>

<!-- RAIL 1: full width, always first, can reach zero -->
<section id="needsyou">
  <h2><span id="needcount"></span></h2>
  <div id="gates"></div>
  <div id="drafts"></div>
  <div id="hotpanes"></div>
</section>

<!-- RAIL 2: the wall - working lanes, compact -->
<section id="wall">
  <h2>The wall <span class="stamp" id="wallsummary"></span></h2>
  <div id="panes"></div>
</section>

<!-- RAIL 3: reference, collapsed by default -->
<details id="ref">
  <summary>Tasks, resolved gates, parked lanes, watcher trail</summary>
  <div class="grid">
    <div><h2>Tasks</h2><div class="card" id="tasks"></div></div>
    <div>
      <h2>Recently resolved</h2><div class="card" id="resolved"></div>
      <h2>Parked lanes - tap to reopen</h2><div class="card" id="lanes"></div>
      <h2>Watcher trail</h2><div class="card" id="wlog"></div>
    </div>
  </div>
</details>
```

**Rail 1 content rule.** `needsyou` holds, in this order: every pending gate, every queued draft, and every pane with `rank <= 2` (`ctx-critical`, `choice-prompt`, `asked-question`). Nothing else may enter it, ever - that is what makes the count meaningful.

**The count must be able to reach zero** (`noisy-signal-guard.md`):

```js
const need = s.gates.length + s.drafts.length + s.panes.filter(p=>p.rank<=2).length;
document.getElementById("needcount").textContent =
  need === 0 ? "0 need you - the wall is working" : need + " need you";
document.getElementById("needsyou").classList.toggle("clear", need === 0);
```

`.clear` renders the section in `--dim` with no gold accent - a calm, obviously-empty state, not an empty box with a heading.

**Rail 2 summary line:** `wallsummary` reads `N working - M free - K idle` computed from the ranks (`3-4` working, `6` bare-shell free, `5` idle-done). Per [doc 2344](../2344-wall-picked-off-governor/) an idle lane on the wall is a defect, so K > 0 renders in `--gold`, not dim.

**Accept:** with zero gates, zero drafts and no rank<=2 pane, the top of the page reads `0 need you - the wall is working` and the first thing below it is the wall summary. With one gate pending, the gate is the first thing on screen without scrolling at 1280x800.

---

## 5. Render the rank that `orca-board` already computes

**Problem:** ranks 3-6 render as identical dim rows; seven states collapse into three colours.

**Change:** each pane row gets a state chip - a text label plus a left border colour, never colour alone.

```css
.chip { display:inline-block; min-width:118px; padding:1px 8px; border-radius:5px;
        border-left:3px solid var(--line); background:transparent; font-size:13px; }
.r0 { border-left-color:var(--warn); color:var(--warn); }   /* ctx-critical */
.r1 { border-left-color:var(--gold); color:var(--gold); }   /* choice-prompt */
.r2 { border-left-color:var(--gold); color:var(--gold); }   /* asked-question */
.r3, .r4 { border-left-color:var(--ok); color:var(--ok); }  /* waiting - working */
.r5 { border-left-color:var(--gold); color:var(--gold); }   /* idle-done = defect */
.r6 { border-left-color:var(--line-interactive); color:var(--dim); } /* bare-shell */
```

Pane row markup: `<span class="chip r${p.rank}">${p.state}</span>`. The state string stays visible at all times - that is the non-colour channel.

**Context percentage gets a threshold, not just a number:** `>=85%` renders in `--warn` with the text `85% - hand off` (the ZORCA PLAYBOOK's own threshold, "ctx>85% means handoff"). Below 85 it stays dim.

**Bare-shell and idle-done panes do not render as cards in rail 2.** They collapse into the summary line and appear only when the reference `<details>` is open. Grafana's rule: show the ones in trouble.

**Accept:** a board with one `ctx-critical`, two `waiting` and three `bare-shell` panes shows three rows in rail 2 and `2 working - 3 free - 0 idle` in the summary; screenshot the page in greyscale and confirm every state is still identifiable from text alone.

---

## 6. Accessibility and phone pass

1. **Toast announces.** `<div id="toast" role="status" aria-live="polite"></div>`, plus a `.bad` class using `--warn` background with `--navy` text (8.95:1, measured).
2. **Watcher trail stops encoding by colour alone.** Each line gets a two-character text prefix rendered before the colour: `>>` for SENT, `!!` for HOLD/QUEUE, `xx` for DROPPED/failed, `..` otherwise. Colour stays, but it is now redundant rather than load-bearing.
3. **Held drafts are visibly held.** A queued draft whose `reason` contains a danger word (`license|publish|delete|archive|push|merge|rotate|credential`) renders with a `--warn` left border and the label `HELD - danger word: <word>`; the Send button on that card requires a second confirming tap (first tap swaps its label to `confirm send`). No override is added - this only makes ZORCA's existing rail 1 visible.
4. **Keyboard.** Number keys `1`-`9` focus (never activate) the nth option button of the first pending gate; `Enter` activates the focused control natively. `?` toggles the reference `<details>`. Bind on `document`, and skip when `document.activeElement` is a text input.
5. **Phone.** Below 720px: pane rows become two-line (`repo + chip` on line one, `ctx + detail` on line two), `min-width` on `.repo`/`.state`/`.ctx` drops to `auto`, body font goes to 14px, and tap targets get `min-height:38px`. The page must not scroll horizontally at 390px width.

**Accept:** at 390x844 there is no horizontal scroll; tab order reaches every gate option; greyscale screenshot keeps every status distinguishable; a draft with `push` in its reason shows HELD and takes two taps to send.

---

## Out of scope for this spec

- Any new mutation endpoint. The GUI still only does resolve / focus / send-draft / open-lane.
- Auth, TLS, non-localhost binding. It stays `127.0.0.1`.
- A framework, a bundler, a CSS file. One Python file, one inline `<style>`, one inline `<script>`.
- Merging `zorca-gui` with `zao-wall` or `zj`. Related surfaces, separate tools; that reconciliation is [doc 2344](../2344-wall-picked-off-governor/)'s to make.

## Verification before the PR is called done

Run all five and paste the output into the PR body:

1. `python3 -c "import ast,sys; ast.parse(open('gui/zorca-gui').read())"` - parses.
2. `./gui/zorca-gui --port 7788` then `curl -s localhost:7788/api/state | python3 -m json.tool | head` - serves, and `err` is present in the payload.
3. The contrast script from doc 2420 against the shipped `:root` - every threshold met.
4. The five acceptance checks in sections 1-6, each stated pass/fail with what was observed.
5. `grep -nE '#[0-9a-fA-F]{6}' gui/zorca-gui | grep -v ':root' | grep -v -- '--'` - no raw hex outside the token block.

A section that cannot be verified is NEEDS_WORK, not a pass (`loop-evals.md`, default-FAIL).
