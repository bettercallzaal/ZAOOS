---
topic: agents
type: decision
status: research-complete
last-validated: 2026-08-26
superseded-by:
related-docs: "2344, 2343, 2104, 2188, 2314"
original-query: "ZAO brand tokens: navy #0a1628, gold #f5a623. Deliverable: research doc per the skill workflow PLUS a build-ready redesign spec the zorca lane can implement without further research."
tier: STANDARD
---

# 2420 - ZORCA GUI redesign: the dashboard is an attention router, not a status page

> **Goal:** Redesign `zorca-gui` (the local ZAO orchestration dashboard) so it answers one question - what needs Zaal right now - with measured contrast tokens, a signal that can reach zero, and a staleness indicator that fails loud. Ships with [SPEC.md](./SPEC.md), which the zorca lane implements without further research.

## Key decisions

| # | Decision | Why | Evidence |
|---|---|---|---|
| 1 | **Reorganize around NEEDS-YOU vs WORKING.** One primary rail (gates + drafts + rank<=2 panes), everything else demoted below the fold. Kill the symmetric 2x7 grid. | The GUI's current layout gives a gate and a watcher-log tail the same visual weight. Doc 2344 already locked the operating model: on-the-wall lanes are unbounded and autonomous, picked-off is capped at 2-3. The dashboard should render that model, not a flat inventory. | `gui/zorca-gui` PAGE, `.grid{grid-template-columns:1fr 1fr}` with 7 `<h2>` sections of equal weight |
| 2 | **Raise `--panel` and split `--line` into two tokens.** Measured today: panel-on-navy is **1.09:1** and border-on-panel is **1.29:1** - cards are effectively invisible surfaces and their borders are below the WCAG 1.4.11 non-text minimum of 3.0. New: `--panel #16283f` (1.25), `--line #26405f` decorative, `--line-interactive #5679a5` (**3.32** on panel, **4.04** on navy). | A clickable pane card whose boundary is 1.29:1 has no perceivable affordance. Every card in the GUI is clickable (`onclick='post("/api/focus"...)'`). | contrast measured locally, sRGB relative-luminance per WCAG 2.2; full table in Findings |
| 3 | **Never encode state in color alone.** Every state gets a text label plus a leading glyph slot; `ok #3ddc84` and `warn #ff5d5d` are the current only differentiator on task status and the watcher trail. | Red/green is the single most common colorblind confusion, and the watcher trail colors lines *purely* by substring match (`SENT` green, `DROPPED` red) with no other marker. | `gui/zorca-gui` `.st-completed{color:var(--ok)}` / `#wlog` colorizer |
| 4 | **The "as of" stamp becomes a loud staleness badge.** Server refreshes every 20s, the page polls every 15s, and a refresher exception is swallowed - so a dead refresher renders as a normal-looking board with a quietly old timestamp. Past 90s the header turns warn and says `STALE 4m`. | `silent-failure-guard.md`: a system reporting success while doing nothing. `refresher()` wraps `refresh()` in a bare `except: pass`. | `gui/zorca-gui` `def refresher()`, `setInterval(load, 15000)` |
| 5 | **The needs-you count MUST be able to reach zero, and zero is rendered as a win.** Header reads `0 need you - the wall is working`. | `noisy-signal-guard.md`: a signal that can never reach zero is not a signal. Today the GUI always shows 7 sections whether or not anything is pending. | rule, plus doc 2343's finding that `zj` needs-you fired on every idle lane |
| 6 | **Gate buttons disable on tap; danger-worded options render held, not tappable.** `post()` currently fires on every click with no in-flight guard - a double tap sends two `gate-resolve` calls for the same id. | ZORCA's whole safety model is that danger words are HELD for the human (README rail 1); the GUI is the one surface where that hold is invisible. | `gui/zorca-gui` `async function post(url, body)` - no disable, no dedupe |
| 7 | **Keep it one stdlib-only Python file, no build step, no CDN.** The redesign is CSS + template + a ~60-line JS diff. No framework. | Rung 1-3 of `code-restraint.md`. The file is 411 lines and its constraint (localhost, zero deps) is a feature - a build step would make it another thing that rots. | `gui/zorca-gui` module docstring: "One file, stdlib only." |

## Findings

### 1. What the GUI is today (ground truth, read not assumed)

`bettercallzaal/zorca` (public, extracted 2026-08-25 from a live 13-pane session) ships three pieces: `bin/orca-board` (462 lines), `bin/repo-cleanup`, and `gui/zorca-gui` (411 lines). The GUI is a stdlib-only Python HTTP server on `127.0.0.1:7777` that reads Orca state and writes only what Zaal taps - `gate-resolve`, `terminal switch`, `terminal send`, `terminal create`.

It renders seven sections in a symmetric two-column grid: Gates, Tasks, Panes, Drafts, Recently resolved, Parked lanes, Watcher trail. It already uses the ZAO tokens - `--navy:#0a1628` and `--gold:#f5a623` are declared on `:root`. **So this is not a re-skin.** The brand is already applied; what is missing is hierarchy, measured contrast, and failure honesty.

`orca-board` computes a six-state ranking that the GUI mostly throws away:

| rank | state | meaning | GUI treatment today |
|---|---|---|---|
| 0 | `ctx-critical` | context nearly full, needs a handoff | `.state.hot` - red text |
| 1 | `choice-prompt` | pane is showing a menu | `.state.q` - gold text |
| 2 | `asked-question` | pane ended on a question mark | `.state.q` - gold text |
| 3-4 | `waiting` / (rank 3,4) | idle waiting | dim text, identical card |
| 5 | `idle-done` | finished, nothing asked | dim text, identical card |
| 6 | `bare-shell` | no agent running, free capacity | dim text, identical card |

The rank is already in the JSON (`rank=RANK[state]`, rows sorted by `(rank, -ctx)`). The GUI collapses seven ranks into three colors and one flat list of visually identical cards. **The most valuable computation in the stack is discarded at the render layer.**

### 2. The contrast measurement (the hard finding)

Computed locally from the declared token values, sRGB relative luminance per WCAG 2.2. AA thresholds: 4.5:1 body text, 3.0:1 large text and non-text UI boundaries.

| token | hex | on `--navy` | on `--panel` | verdict |
|---|---|---|---|---|
| `--text` | `#e8edf5` | 15.42 | 14.09 | pass |
| `--gold` | `#f5a623` | 8.95 | 8.17 | pass |
| `--ok` | `#3ddc84` | 10.16 | 9.28 | pass |
| `--dim` | `#8ba0bf` | 6.80 | 6.22 | pass |
| `--warn` | `#ff5d5d` | 6.02 | 5.50 | pass, but marginal at 13px |
| dispatched blue | `#6fb3ff` | 8.26 | 7.55 | pass |
| `--panel` | `#111f33` | **1.09** | - | **FAIL as a surface** |
| `--line` | `#1d3252` | 1.41 | **1.29** | **FAIL vs 3.0 boundary** |

Text is fine everywhere. **Structure is invisible.** The card that is supposed to say "I am a tappable thing" separates from the page by 1.09:1 and is outlined at 1.29:1. On a laptop at 40% brightness in daylight, the board reads as one undifferentiated field of monospace.

The redesign's measured replacements (same method, in SPEC.md section 2): `--panel #16283f` = 1.25 on navy; `--line #26405f`; `--line-interactive #5679a5` = 3.32 on panel and 4.04 on navy, clearing 1.4.11; `--dim #9bb0cd` = 6.73 on panel; `--warn #ff7a7a` = 5.90 on panel. Navy and gold are untouched - they are the brand, verified at `community.config.ts:20` (`primary: '#f5a623'`) and `:24` (`background: '#0a1628'`).

### 3. What the field converged on (comparables, fetched today)

| tool | stars | last push | what it does | what ZORCA takes |
|---|---|---|---|---|
| [BloopAI/vibe-kanban](https://github.com/BloopAI/vibe-kanban) | 27,923 | 2026-04-24 | kanban issues -> agent workspaces -> diff review -> PR. **Sunsetting** (banner in README). | The plan-review split. Not the kanban: ZAO's task truth is the cowork board, not a second board. |
| [smtg-ai/claude-squad](https://github.com/smtg-ai/claude-squad) | 8,367 | 2026-08-20 | TUI, one isolated git workspace per task, background/auto-accept | "Manage instances and tasks in one terminal window" - the single-surface principle ZORCA already holds |
| [omnara-ai/omnara](https://github.com/omnara-ai/omnara) | 2,763 | 2026-08-26 | managed-agent platform with a dashboard, agents across machines | Cross-machine roster - relevant later for VPS/Pi lanes, not now |
| [stravu/crystal](https://github.com/stravu/crystal) | 3,111 | 2026-02-26 | parallel worktree sessions, compare approaches (renamed Nimbalyst) | Nothing - desktop Electron app, opposite of the one-file constraint |
| [devflowinc/uzi](https://github.com/devflowinc/uzi) | 582 | 2025-06-04 (stale ~15mo) | CLI, many agents in worktrees | Nothing - dormant |

The two most-starred tools in this space are a **sunsetting kanban** and a **terminal UI**. Nobody has won the "many agents, one human" surface, which is the honest read: ZORCA is not behind a standard, it is in an unsettled field, and the one-file localhost constraint is a genuine differentiator rather than a limitation to grow out of.

### 4. The community's actual complaint is the bottleneck, not the display

HN, [Show HN: Optio](https://news.ycombinator.com/item?id=47520220) (88 points, 60 comments, 2026-03-25) - author `jawiggins`, verbatim:

> "I've been jumping between many claude code/codex sessions at a time, managing multiple lines of work and worktrees in multiple repos. I wanted a way to easily manage multiple lines of work and **reduce the amount of input I need to give, allowing the agents to remove me as a bottleneck** from as much of the process as I can."

And on why one loop was not enough:

> "At first I started by trying to have a single claude code session run in an iterative loop, but eventually I found it was way too slow. I started tasking subagents for each remaining chunk of work, and then found I was really just repeating the need for a normal sprint task list."

The top adversarial comment (`antihero`: "And what stops it making total garbage that wrecks your codebase?") gets answered with CI checks, a review agent, and optional manual review - which is ZORCA's rail set already, arrived at independently.

This is the same finding as ZAO's own 48-hour audit in [doc 2344](../2344-wall-picked-off-governor/): 45 of 46 Claude sessions stamped WAITING, one working, because everything routed back to one human. **The dashboard's job is to shrink the human's queue, not to display it prettily.** That is the single design constraint the redesign optimizes for, and it is why sections that do not shorten Zaal's queue (watcher trail, recently resolved, task specs) move below the fold.

### 5. Dashboard principle, sourced

Grafana's [best practices for creating dashboards](https://grafana.com/docs/grafana/latest/dashboards/build-dashboards/best-practices/), verbatim:

> "A dashboard should tell a story or answer a question... if your question is 'which servers are in trouble?', then maybe you don't need to show all the server data. Just show data for the ones in trouble."

> "Dashboards should reduce cognitive load, not add to it... Can I tell what exactly each graph represents? Is it obvious, or do I have to think about it?"

ZORCA's question is **"which lanes need me?"** By Grafana's rule, the bare-shell and idle-done panes should not be on the primary surface at all - they are capacity, not trouble. SPEC.md moves them into a single collapsed `4 lanes working, 2 free` summary line, expandable.

### 6. Seven concrete defects the redesign fixes

| # | Defect | Where | Severity |
|---|---|---|---|
| 1 | Double-tap on a gate button fires two `gate-resolve` calls - no in-flight guard, no disable | `async function post(...)` | HIGH - duplicate resolution of a human decision |
| 2 | Refresher swallows every exception; a dead refresher looks like a live board | `def refresher()` bare `except: pass` | HIGH - silent failure |
| 3 | Card surface 1.09:1, border 1.29:1 - no perceivable structure or affordance | `:root` tokens | MEDIUM |
| 4 | State conveyed by color alone (task status, watcher trail) | `.st-*`, `#wlog` | MEDIUM - accessibility |
| 5 | Ranks 3-6 render identically; `orca-board`'s ranking is discarded | `#panes` renderer | MEDIUM |
| 6 | No focus-visible styles; the tap-first surface is keyboard-hostile | stylesheet | MEDIUM |
| 7 | Toast is `display:block` with no `aria-live`, and reports "failed" with no reason | `#toast` | LOW |

Defects 1 and 2 are behavior, not aesthetics. They are specified first in SPEC.md and are the reason this doc ships a spec rather than a palette.

### 7. What is explicitly NOT changing

- **Navy and gold.** Brand tokens, locked, `community.config.ts:20,24`.
- **Localhost-only, stdlib-only, one file.** No npm, no CDN, no build.
- **The write surface.** The GUI still only does what Zaal taps: resolve a gate, focus a pane, send a queued draft, open a parked lane. No new mutation is introduced.
- **The danger-word hold.** Held drafts stay held; the redesign makes the hold *visible*, it does not add an override.

## Also see

- [Doc 2344](../2344-wall-picked-off-governor/) - the wall model this dashboard renders (on-the-wall vs picked-off, idle-on-wall is a defect)
- [Doc 2343](../../dev-workflows/2343-zj-wall-signal-quality/) - the wall signal audit; needs-you firing on every idle lane is the same class of bug as defect 5 here
- [Doc 2104](../2104-fleet-coordination-deep-audit/) - fleet/multi-terminal coordination audit
- [Doc 2188](../2188-cheap-fleet-premium-escalation/) - the tiering this dashboard sits on top of
- [Doc 2314](../2314-zaal-botz-fleet-interface-design/) - the Telegram half of the same attention-routing problem
- [SPEC.md](./SPEC.md) - the build-ready spec

## Next actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Implement SPEC.md sections 1-3 (in-flight guard, staleness badge, token block) in `gui/zorca-gui`; PR merged to bettercallzaal/zorca | @Zaal (zorca lane) | PR | 2026-08-28 |
| Implement SPEC.md sections 4-6 (needs-you rail, rank rendering, a11y pass); PR merged | @Zaal (zorca lane) | PR | 2026-09-02 |
| Re-run the contrast table against the shipped stylesheet and paste the output into the PR body (measurement, not claim) | @Zaal (zorca lane) | PR comment | 2026-09-02 |
| Decide whether `~/bin/zorca-gui` should be a symlink to the repo copy - it is currently ABSENT from `~/bin` while `~/bin/orca-board` exists, so the GUI has no git-tracked runtime path on this Mac (`vanishing-dependencies.md` rule 1) | @Zaal | Decision | 2026-08-28 |

## Sources

- [bettercallzaal/zorca](https://github.com/bettercallzaal/zorca) - `README.md`, `gui/zorca-gui` (411 lines), `bin/orca-board` (462 lines) - **[FULL]** method: `gh repo clone --depth 1`, read from disk
- Local contrast measurement of the declared and proposed token sets - **[FULL]** method: python3, sRGB relative luminance per WCAG 2.2, run 2026-08-26
- [Show HN: Optio - Orchestrate AI coding agents in K8s](https://news.ycombinator.com/item?id=47520220) (88 pts, 60 comments, 2026-03-25) - **[FULL]** method: `hn.algolia.com/api/v1/items/47520220`, raw JSON comment tree, quotes verbatim
- [BloopAI/vibe-kanban](https://github.com/BloopAI/vibe-kanban) - 27,923 stars, pushed 2026-04-24, sunsetting - **[FULL]** method: `gh api repos/.../readme`, base64-decoded raw markdown
- [smtg-ai/claude-squad](https://github.com/smtg-ai/claude-squad) - 8,367 stars, pushed 2026-08-20 - **[FULL]** method: same
- [omnara-ai/omnara](https://github.com/omnara-ai/omnara) - 2,763 stars, pushed 2026-08-26 - **[FULL]** method: same
- [stravu/crystal](https://github.com/stravu/crystal) - 3,111 stars, pushed 2026-02-26 - **[PARTIAL - metadata only]** method: `gh api repos/stravu/crystal`; README not read, the repo is a renamed Electron app and out of scope for a one-file server
- [devflowinc/uzi](https://github.com/devflowinc/uzi) - 582 stars, pushed 2025-06-04 - **[PARTIAL - metadata only]** method: same; dormant ~15 months, excluded from the comparison on that basis
- [Grafana - Best practices for creating dashboards](https://grafana.com/docs/grafana/latest/dashboards/build-dashboards/best-practices/) - **[FULL]** method: `curl` + HTML strip, quotes verbatim from raw text
- ZAOOS `community.config.ts:20,24` - brand token source of truth - **[FULL]** method: grep on disk
- [Doc 2344](../2344-wall-picked-off-governor/) - **[FULL]** method: read on disk
