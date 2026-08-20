---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-08-20
superseded-by:
related-docs: "2342, 2319"
original-query: "we should research more on how we can improve this [zj / the wall display]"
tier: STANDARD
---

# 2343 - The Wall's signal is wrong: `zj` cannot tell IDLE from BLOCKED

> **Goal:** `zj` now renders. Establish what it is telling Zaal that is not true, and fix the signal rather than the layout.

## Key Decisions

Recommendations first.

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **SPLIT `needs-you` into BLOCKED and IDLE.** They are different states with opposite remedies. | Measured: the two signals are already **disjoint** in the pane text, so the split costs one `case` branch. Today they are merged and the header overstates what wants Zaal by roughly 4x. |
| 2 | **BLOCKED = a prompt in the footer. IDLE = `WAITING FOR YOU` in the status line.** | Verified on five lanes: idle lanes carry `WAITING FOR YOU` and **zero** footer prompts; blocked lanes carry a footer prompt and **zero** `WAITING FOR YOU`. Clean separation, no heuristic needed. |
| 3 | **An IDLE lane is a WALL bug, not a Zaal to-do.** Render it as "needs work", never "waiting on you". | The Wall model (2026-08-20): on the wall = autonomous. A lane with nothing queued should be given a card, not reported as if it asked a question. |
| 4 | **REPLACE the `last` column's UI chrome with the lane's last real action.** | Of 14 local lanes, 11 showed Claude Code interface text rather than work. The most valuable column is currently the least informative. |
| 5 | **JOIN the board in: show which cards each lane owns** via `metadata.lane`, using `zao-wall --json`. | The wall's two halves - lanes (`zj`) and work (`zao-wall`) - are still separate views. Neither alone answers "is this lane doing something useful". |

## The finding

`zj` reports **"14 lane(s) waiting on you"**. Three are. The other eleven have finished their work and have nothing queued.

Both render identically as `needs-you`, so the number that is supposed to be the reason to run the tool is inflated about fourfold - and the eleven that are *not* asking anything are the ones that most need attention, because they are idle capacity.

### Why it happens - two paths into one state

`~/bin/zj` decides state in a `case` (lines 69-90). Two branches set `needs-you`:

```sh
case "$foot" in                                   # last 6 lines only
  *"Do you want"*|*"Enter to confirm"*|*"Enter to select"*)
    state="needs-you" ;;                          # (A) a real prompt
  *) case "$txt" in *"WAITING FOR YOU"*)          # whole pane
       state="needs-you" ;; esac ;;               # (B) the status line
esac
```

Branch **(A)** is correct and carefully written - the surrounding comment records that scanning the whole pane once read a ten-minute-old answered prompt as live, so it was narrowed to the footer.

Branch **(B)** was not narrowed. `WAITING FOR YOU` comes from the **status line**, which every idle Claude Code pane renders. So (B) fires on every lane that is simply not busy.

### The measurement (2026-08-20, five lanes)

| Lane | `WAITING FOR YOU` in pane | Real prompt in footer | True state |
|---|---|---|---|
| fractal | 1 | 0 | IDLE |
| organizer | 1 | 0 | IDLE |
| bcz-yapz | 1 | 0 | IDLE |
| audos | 0 | 1 | BLOCKED |
| zaostock | 0 | 1 | BLOCKED |

**The signals are disjoint.** A blocked lane does not show `WAITING FOR YOU` at all, because it is mid-work rather than idle. So this is not a hard classification problem needing a heuristic - the information is already there and is being discarded by collapsing both branches into one label.

### Why the distinction is the whole point

The two states have opposite remedies, and conflating them hides both:

- **BLOCKED** - work stopped mid-flight on a question only Zaal can answer. He must **pick it off the wall**. Three lanes: `audos` (which two ideas), `zaostock` (canonical repo), `crush`.
- **IDLE** - work finished, nothing queued. It needs **a card, not an answer**. Eleven lanes.

Under The Wall model an idle lane is a *defect*: on the wall means autonomous and producing. Reporting it as "waiting on you" inverts the responsibility - it reads as Zaal owing an answer when in fact the wall owes it work.

This is `noisy-signal-guard.md` twice over. The flag fires on the normal case, and it cannot reach zero: eleven lanes will report `needs-you` forever simply by being idle, so the count is permanently non-zero and therefore unreadable. `zj`'s own comments already cite that rule for an earlier version of this exact bug ("Eleven of eleven lanes did, which is a flag that has stopped meaning anything"). The fix was applied to branch (A) and not to (B), so the same failure survived in the other half.

## Second finding: the `last` column shows interface, not work

`last` is meant to say what a lane is doing without attaching. Actual content across 14 local lanes:

| What it showed | Lanes | Is it work? |
|---|---|---|
| `new task? /clear to save NNNk tokens` | 7 | No - a context hint |
| `Enter to select · ↑/↓ to navigate · Esc to can` | 3 | No - menu chrome (though it does imply BLOCKED) |
| `/rc failed` | 3 | No - a Remote Control error |
| `✔ Update installed · Restart to update` | 1 | No - an updater notice |

**Zero of fourteen** described the lane's actual work. The column captures the last line printed, and in a TUI the last line is almost always interface.

The better source is the lane's last **tool call or assistant line** - the `⏺`-prefixed rows - which is what a human reads when they attach. `~/.claude/state/status-*.json` already stores a `last` field of exactly that shape (`Bash: Check the actual state stamps`), written by `zao-cc-state.sh` on every hook fire. That is a better source than scraping the pane, and it is already on disk.

## Third finding: `/rc failed` on three lanes, unexplained

`obsidian`, `meetings` and `zaoos-infra` all show `/rc failed`. Remote Control was reconnected mid-session after a `/login`, and those three appear not to have recovered. Not diagnosed here - flagged because it means three lanes are unreachable from Zaal's phone while looking healthy on the wall, which is the same class of silent gap as the rest of this doc.

## Fourth finding: the Pi lanes carry no state at all

Seven Pi lanes show `script`, `-`, `-`, `11d`. No state, no context, and an age of eleven days. They are shell loops rather than Claude sessions, so the Claude-specific detection does not apply - but rendering them with empty columns beside richly-described local lanes implies they are being watched when nothing is actually being read from them. `agent-loops.md` rule 16 (watch loops by OUTPUT, not process) applies: their last commits are July 28-29.

## Also See

- [Doc 2342 - smux / tmux-bridge vs the ZAO lanes workflow](../../agents/2342-tmux-bridge-lanes-workflow/)
- [Doc 2319 - handoff workflow audit](../2319-handoff-workflow-audit/)
- `scripts/agents/zao-wall.py` - the board half of The Wall
- `.claude/rules/noisy-signal-guard.md`, `.claude/rules/liveness-probe-guard.md`

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Split `needs-you` into BLOCKED and IDLE in `~/bin/zj`; header counts them separately | @Zaal | PR (zaal-dotfiles) | 2026-08-22 |
| Render IDLE as "needs work" and, where known, name the lane's unclaimed card count from `zao-wall --json` | @Zaal | PR (zaal-dotfiles) | 2026-08-24 |
| Source `last` from `~/.claude/state/status-*.json` rather than the pane tail | @Zaal | PR (zaal-dotfiles) | 2026-08-24 |
| Diagnose `/rc failed` on obsidian, meetings, zaoos-infra | @Zaal | Investigation | 2026-08-22 |
| Progressive render: print each host section as it lands, in fixed order, so `local` appears while `vps` is still probing | @Zaal | PR (zaal-dotfiles) | 2026-08-25 |
| Decide whether the 7 Pi lanes stay on the wall given their last commits are 2026-07-28/29 | @Zaal | Decision | 2026-08-27 |

## Sources

All measured on this machine, 2026-08-20. No external fetches were needed, so none were made.

- [FULL - read on disk] `~/bin/zj` lines 60-92, the state-detection `case`; lines 405-445, the render loop.
- [FULL - `tmux capture-pane` on 5 lanes] the disjointness table above: `grep -c 'WAITING FOR YOU'` over the pane versus a footer grep for `Do you want|Enter to confirm|Enter to select`.
- [FULL - screenshot from Zaal, read directly] the 21-row `zj` output: 14 local, 7 pi, the `vps: SLOW` notice, and every `last` column value tallied above.
- [FULL - ssh, this run] VPS at load average 12.52 on **2 cores**, 2.0Gi swap in use, 237 processes; five cheap-loops concurrently on local Ollama; last commits in the two loop dirs that are git repos are 2026-07-28 and 2026-07-29.
- [FULL - read on disk] `~/.claude/state/status-*.json` - 46 files carrying `status`, `ts`, `proj`, `branch`, `cwd`, `last`.
