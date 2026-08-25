# 2414 - xyOps: what a 5,400-star job scheduler already solved that we keep re-learning

**Tier:** STANDARD
**Date:** 2026-08-24
**Lane:** lanes (harness)
**Input:** Zaal sent r/coolgithubprojects "xyOps just crossed 5,000 GitHub stars"
**Verdict:** DO NOT ADOPT the platform now. STEAL three patterns, all of which
independently confirm rules this repo already wrote after its own incidents.

## What it is

xyOps (pixlcore/xyops) is job scheduling, workflow automation, server
monitoring, alerting and incident response in one self-hosted platform. It is
the successor to **Cronicle** by the same author (jhuckaby / u/cgijoe_jhuckaby),
and ships a Cronicle importer.

Measured from the GitHub API on 2026-08-24, not from the post:

| | |
|---|---|
| Stars / forks | 5,416 / 534 |
| Language | JavaScript |
| Created / last push | 2025-12-29 / 2026-08-24 (same day - active) |
| Open issues | 37 |
| License | **BSD-3-Clause**, read from `LICENSE.md` itself, not the API field |
| Copyright | PixlCore LLC & CONTRIBUTORS, 2019-2026 |

Free tier is "all app features"; the paid tiers sell support, SSO and a
ticketing SLA, not features.

## Why this landed in the harness lane

The pitch is aimed exactly at the failure class this estate keeps hitting:

> "Most automation platforms focus on workflow orchestration - they run tasks,
> but they don't really help you see what's happening behind them."

Our own incident log says the same thing in our words:

- a cron 503'd on **every run for ~7 weeks** and reported green, because the CI
  step piped `curl | tee` and bash returned `tee`'s exit 0 (`silent-failure-guard.md`)
- `zao-vault-log` wrote **"nothing merged" for four days while 158 PRs merged**,
  then vanished entirely (`vanishing-dependencies.md`)
- 37 of 64 peer sessions are dead rows nobody cleaned up, and three `fleet_status`
  rows have claimed `working` for 37 days

## The three patterns worth stealing (free, no install)

### 1. Warm-up / cool-down counters instead of a single probe

xyOps evaluates every alert once a minute and requires **N consecutive true
evaluations before firing, and N consecutive false ones before clearing.** Its
own best-practice line: *"Tune `samples` to balance noise and responsiveness.
For spiky metrics, require multiple samples."*

That is `liveness-probe-guard.md` rule 1 - a single short-timeout probe measures
load, not liveness - arrived at independently by a production system. We wrote
that rule after `gstack browse` killed healthy servers three times in five weeks
because one 2-second probe timed out under load.

### 2. The reader expires the state; the writer never retracts it

> "Active invocations are kept fresh as data arrives. **Stale invocations are
> automatically expired if no updates are seen (e.g., server goes offline).**"

This is verbatim the fix the windows-desktop lane articulated for `fleet_status`:
**emit a TIMESTAMP, never a STATE, and let the READER compute liveness.** A
writer that dies cannot retract its own claim, so any writer-asserts-state schema
is guaranteed to lie eventually. xyOps ships it as the default behaviour.

`fleet_status` already has `updated_at` and the ZAOcowork HUD already filters on
it. The fix reached one consumer and stopped there - which is this estate's
characteristic failure, not a missing idea.

### 3. Job lifecycle stages are a contract, not a log line

Actions fire at `start`, `progress`, `success`, `warning`, `critical`, `abort`,
`complete`, plus tag triggers - and can email, webhook, snapshot, open a ticket,
or abort other jobs. The failure path is a first-class stage with somewhere to
go, rather than a non-zero exit nobody reads.

Compare `state-claims.md`'s "Silence is not evidence": five of eight ZOE features
shipped in one week contained **no logging statement of any kind**, so a week of
journald could not answer whether they had run. `featureRan()` is our one-line
version of the `start` stage. We have no `critical` stage at all.

## Why NOT to adopt it now

1. **It is not the gap.** Scheduling is not what breaks here - `cron` and
   `systemd` run fine. What breaks is nothing noticing when something stops.
   xyOps covers that for *scheduled jobs on servers it agents*; it does not cover
   "a Claude process exited inside a tmux pane", which is problems 2, 3 and 4 of
   this lane's brief. Those are long-running interactive processes, not jobs.
2. **Fleet size.** It is built for "five servers or five thousand". We have one
   VPS, a Pi, a Mac and a Windows desktop.
3. **It is a platform, and platforms die quietly too.** Adopting a conductor +
   agents + DB + UI to solve "things die without anyone noticing" adds one more
   always-on service that can die without anyone noticing. That is only worth it
   if it is the thing that pages, and paging currently works (ZOE -> Telegram).
4. **The community's own reservation, from the thread:** *"it seems
   overcomplicated for a simple bash/cron runs and at the same time too limiting
   for anything more complex."* Another commenter: *"it's going to take a lot to
   convince me this isn't n8n dark mode."* One long-time Cronicle user is
   strongly positive. Four comments total - directional, not evidence.

## Where it WOULD earn a slot

If the VPS cron/systemd layer keeps failing silently, xyOps is the credible
replacement for that layer specifically - BSD-3, self-hosted, no telemetry, a
Cronicle importer, and job history plus failure actions we would otherwise build.
That is a real option to hold, not a thing to install this week.

## Do this instead (small, in-repo)

1. Propagate the `updated_at` reader-computes-liveness filter past its one
   consumer - the HUD has it, `zao-agents`/`zj`/`ListAgents` do not.
2. Give any probe that triggers a destructive action a sample counter, per
   `liveness-probe-guard.md` rule 1.
3. Add a `critical`-equivalent to the loops: a failure path that reaches a human
   instead of a non-zero exit code nobody reads.

## Sources

All fetched 2026-08-24. Method stated per `research-grounding.md` - no WebFetch
summaries were quoted.

| Source | Method | Result |
|---|---|---|
| The Reddit post + 4 comments | `zao-fetch-reddit.sh` via Arctic Shift (raw JSON) | FULL |
| `repos/pixlcore/xyops` metadata | `gh api` | FULL |
| `LICENSE.md` | `gh api contents` + base64 decode - the FILE, not the API's license field | FULL |
| `README.md` | `gh api readme` + base64 decode | FULL |
| `docs/alerts.md`, `docs/monitors.md`, `docs/events.md`, `docs/cronicle.md` | `gh api contents` + base64 decode | FULL |
| docs.xyops.io/monitors and /alerts | `curl` with browser UA | **FAILED as a source** - HTTP 200, 2,867 bytes, byte-identical for both routes: a JS app shell with no content. Exactly the "200 with an empty body" trap in `liveness-probe-guard.md`. Repo markdown used instead. |

Credit: xyOps by **PixlCore LLC / jhuckaby** (BSD-3-Clause); surfaced by
**u/cgijoe_jhuckaby** in r/coolgithubprojects. Cronicle lineage credited by the
project itself.

## Siblings

`silent-failure-guard.md` (green while broken), `liveness-probe-guard.md` (busy
is not dead; the empty-200 clause), `state-claims.md` (merged is not running;
silence is not evidence), `vanishing-dependencies.md`, `noisy-signal-guard.md`
(the warm-up counter is its cure), `code-restraint.md` (rungs 1-2: this is why
the verdict is not-yet).
