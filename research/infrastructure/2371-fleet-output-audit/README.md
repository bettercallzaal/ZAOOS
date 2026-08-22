---
topic: infrastructure
type: audit
status: research-complete
last-validated: 2026-08-14
superseded-by:
related-docs: 2272, 2264, 2273, 928
original-query: "Pi (zaal@ansuz, 7 sessions) and VPS (zaal@31.97.148.88, 20 sessions) have produced no visible output in 5+ days and nobody has looked. Judge by OUTPUT not process - a dead script in a live tmux looks identical to a working one. For each session: what it should do, when it last actually wrote something, ALIVE/STALLED/DEAD, and one next step."
tier: AUDIT
---

# 2371 - The fleet is alive and producing nothing

> **Goal:** Judge all 27 tmux sessions across both hosts by what they WROTE, not
> by whether a process exists. Name what should be retired.

**Audit only. Nothing was killed, deleted, restarted or cleaned on either host.**
Every command was a read.

## The headline

The Pi scout pipeline has produced nothing in five days - **not because it is
dead, but because it runs end to end and comes back empty.**

31 research docs landed on `main` in the last 5 days. **Zero** are on a scout
topic (SEO, YouTube, repo/web). Other lanes are productive; this one is not.

The chain:

```
Pi loop scouts a topic (~every 4h)
  -> zoe-enqueue.sh  ->  VPS /home/zaal/.zao/zoe/work-queue.json  (cap 5)
    -> ZOE work-loop consumes it
      -> research returns an EMPTY STRING
        -> parked, nothing produced
```

Two runs today, 12:06 and 16:13, both parked `empty-output`. The queue depth is
**0**, so it is draining - it is just draining into nothing.

**This is visible only because doc 2272 / PR #3076 shipped and is live.**
`work-parked.jsonl` was written at 16:13 today. Before that change, both runs
would have deleted the item and emitted a receipt saying `resultType: 'success'`.
The pipeline would have looked healthy while producing zero.

Adjacent in time, and the likely cause - **not proven**:
`/home/zaal/.zao/cheap-loop.pause` exists, created **14:20 today**, and the
`watch` pane reads `[cheap-loop] paused: daily spend cap hit. exiting.`

## Method, and the trap it avoids

`agent-loops.md` rule 16: watch a loop by its OUTPUT, not its process. A dead
script in a live tmux is indistinguishable from a working one.

Two things nearly fooled this audit, both worth recording:

1. **`pane_current_command` read `sh` for all 7 Pi sessions.** That looks like
   every script exited and left a shell. It is not - it is the `sh -c` wrapper.
   The process trees show live children. Checking the tree corrected it.
2. **`Work-loop done: doc NNNN` is a Telegram message, not a console line.** Its
   absence from journald proves nothing. The claim "produced no docs" is
   therefore evidenced by `git log origin/main --since=5.days -- research/`
   instead, which is the artifact that actually exists.

Session creation time was never used as evidence. Sixteen VPS sessions were
created within 34 seconds of each other today; the age tells you about the
keepalive, not the work.

## Pi (ansuz) - 7 sessions, host up 5d20h

All 7 processes alive. `start-fleet.sh` runs every 15 minutes and restarts
anything missing, which is why they are alive - liveness here is evidence about
the healer, not the work.

| session | should do | last real write | verdict | next |
|---|---|---|---|---|
| `repor` | repo/web scout, ~4h | `repo-watch/loop.log` 2026-08-14 11:27 | **ALIVE** | keep |
| `seor` | SEO scout, ~4h | `seo-research/loop.log` 2026-08-14 11:11 | **ALIVE** | keep |
| `ytr` | YouTube scout, ~4h | `yt-research/loop.log` 2026-08-14 11:08 | **ALIVE** | keep |
| `fleet` | dashboard on :8090 | source untouched since 2026-07-18; 3s CPU in 5d20h; HTTP **000 after 6s** on its own bind IP | **DEAD** | **retire or fix** |
| `zol` | `zol-reply.js` | pane scrollback **empty** since Aug 8; 81s CPU | **STALLED** | instrument or retire |
| `zolt` | `zol-threads.js` | pane **empty**; 131s CPU | **STALLED** | instrument or retire |
| `zolz` | `zol-learn-zaal.js` | pane **empty**; 32s CPU | **STALLED** | instrument or retire |

The three scouts are doing their job. Their work dies downstream, not here.

## VPS - 20 sessions

**17 of the 20 run `bash -l`** - an idle login shell with no script, so no output
by construction: `artizen`, `bcz`, `coc`, `fractal`, `human`, `maine`, `poidh`,
`research`, `sparkz`, `warpee`, `ww`, `wwafrica`, `zabal`, `zaostock`, `zoe`,
`zol`, `zoostr`. `loops-keepalive.sh` recreated them at 18:44 today.

These are **lane slots** for a Claude Code session to attach to. They are correct
as designed. The reason they produced nothing is that nothing was running in them
- which is a different fact from "a loop stalled", and the distinction is the
whole point of the section below.

| session | started with | verdict | next |
|---|---|---|---|
| `caddy` (Apr 30) | `caddy run` | **ALIVE** - 106 days | keep |
| `watch` (Jul 17) | `fleet-watch.sh` | **ALIVE** - re-renders | keep |
| `raw` (Aug 3) | `raw-capture.sh` | **UNVERIFIED** - pane output could not be cleanly attributed | check before judging |
| the other 17 | `bash -l` | idle slots, **not** stalled loops | keep |

## Retire

### 1. The Pi fleet dashboard

Listening on its Tailscale bind address, port 8090, and never answering: HTTP 000 after a 6-second
timeout on its own bind address. **3 seconds of CPU in 5 days 20 hours.** Source
last modified 2026-07-18.

It is a socket that accepts and hangs, which is worse than being down - a port
check passes. Memory `project_fleet_dashboard` points at `ansuz:8090` as a live
surface; that is now wrong.

### 2. The three zol tmux sessions

The actual ZOL work runs from **cron**, not from these:

```
0 0-2,9-23 * * *  zol-daily.js
*/5 * * * *       zol-zabal-watch.js
*/10 * * * *      zol-win-drain.js
*/5 * * * *       zol-drain.js
0 15 * * *        zol-follow.js
```

Those wrote files at 14:45 today. The three tmux processes have printed **nothing
in 5d20h** while holding 32-131 seconds of CPU. They are either duplicating cron
silently or doing nothing, and neither is worth three unexplained processes.

**Related, and worth a separate look:** `/home/zaal/zol/drafts/` holds **49
drafts**, two written today, while `last-posted.json` is dated **2026-08-03**.
Nothing has been posted in 11 days while drafts accumulate.

## The check that already knew

`/home/zaal/.zao/loop-health.log` is **four lines in total**, last written 17:43
today:

```
15 loop(s) stalled: artizen, bcz, coc, fractal, human, maine +9
no reason recorded
17 loop(s) stalled: artizen, bcz, coc, fractal, human, maine +11
no failure recorded - check the pane
```

It is right that they are idle and wrong that it matters: those are the empty
`bash -l` lane slots. So it fires on every run, **can never reach zero**, and
answers "no reason recorded" when asked why.

That is `noisy-signal-guard.md` precisely - a check that always fires is a check
nobody reads - and it is why "nobody has looked" is a rational response rather
than negligence. The fix is to exclude `bash -l` panes so the count CAN reach
zero; otherwise it will keep hiding the one lane that genuinely breaks.

Separately, `/tmp/fleet-status.json` tracks **5** of the 20 sessions, so the
dashboard's view of the fleet is a quarter of it.

## What to do, in order

1. **Find why research returns empty.** This is the only item that costs real
   output. Start at the `cheap-loop.pause` created 14:20 and the spend cap.
2. **Make the health check able to reach zero** - exclude `bash -l` panes.
3. **Retire or fix the Pi dashboard**, and correct `project_fleet_dashboard`.
4. **Instrument or retire the three zol tmux sessions.**
5. **Look at the 49 unposted drafts** - separate question, real backlog.

## Sources

All read live on 2026-08-14 over SSH; no host was modified.

- `tmux list-sessions` / `list-panes -a -F` on both hosts, plus `ps` process trees
- `/home/zaal/{repo-watch,seo-research,yt-research}/loop.log` on ansuz
- `/home/zaal/zoe-enqueue.sh`, `/home/zaal/start-fleet.sh` on ansuz
- `/home/zaal/.zao/zoe/work-queue.json` (depth 0) and `work-parked.jsonl` on the VPS
- `/home/zaal/.zao/loop-health.log`, `/tmp/fleet-status.json`, `crontab -l` on both
- `git log origin/main --since="5 days ago" -- research/` for actual doc output
- `curl` against the dashboard on its Tailscale bind address, port 8090
