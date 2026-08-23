---
topic: infrastructure
type: decision
status: research-complete
last-validated: 2026-08-23
superseded-by:
related-docs: "1226, 2367, 2371"
original-query: "Brandon's Economic Reality Plane brief - cost provenance, economic receipts, hierarchical circuit breakers, ECONOMIC FALSE GREEN"
tier: STANDARD
---

# 2396 - The Economic Reality Plane cannot be built on provider logs

> **Goal:** Test Brandon's cost-provenance brief against our own measured data
> rather than agreeing with it. Three of his claims survive and get stronger
> evidence. One assumption underneath all of them turns out to be false, and it
> changes where the instrumentation has to live.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **Economic receipts must be emitted BY THE CALLER. Provider logs cannot do it.** | Measured: **84% of Supabase edge-log requests (34,908 of 41,647 in 24h) carry no `content_length` at all.** The field exists and returns a number, so a dashboard built on it looks fine - and undercounts exactly the large chunked responses that cause the bill. |
| 2 | **ECONOMIC FALSE GREEN needs a harder sub-case: the loop whose every observation is an ERROR.** | Found live during this review: a poller hitting `/rest/v1/tasks` **3,453 times in 24 hours, 402 on every single one.** Not "healthy system, diverged cost" - a system that is not working at all, and nothing anywhere says so. |
| 3 | **Extend `zao-spend`, do not build a new economic plane beside it.** | It already prices session transcripts, groups by lane, appends an hourly ledger, and prints cost per PR. That is cost-per-outcome at a coarse grain - rung 1 of Brandon's metric, already running on cron. |
| 4 | **Agree: do not flip Heart.** | The uuid fix proves a known defect was repaired. It proves nothing about Heart. Six injections, one controlled window. |
| 5 | **Our own headline number did not reconcile, and that is the finding, not an embarrassment.** | The specimen implies ~128 GB over 13 days; Supabase billed 18.69 GB total. Both are measured. The gap between them **is** the attribution problem, hitting the person writing the report. |

## The measurement that changes the design

Brandon's proposal is that every consequential run emits an economic receipt. The
obvious cheaper alternative is to skip instrumentation and reconstruct costs from
provider logs after the fact. **That alternative does not work, and it fails in the
worst possible way.**

Supabase's `edge_logs` do record `response.headers.content_length`. So the query
looks answerable:

```sql
select user_agent, path, count(*) as reqs,
       sum(toUInt64OrZero(content_length)) as bytes
from logs where source='edge_logs' group by user_agent, path
```

It returns numbers. They are nonsense:

| path | ua | reqs | bytes reported |
|---|---|---|---|
| `/rest/v1/bot_commands` | node | 4,292 | **3,356** |
| `/rest/v1/tasks` | node | 4,541 | **604** |
| `/rest/v1/tasks` | Python-urllib/3.14 | 3,449 | **0** |

0.78 bytes per request. Then the reason:

```
MISSING content_length : 34,908 requests  (18 distinct paths)
present                :  6,739 requests  (12 distinct paths)
```

**84% missing.** `Content-Length` is absent whenever a response is chunked or
compressed - which is precisely the large-payload case. So the provider's own byte
accounting is systematically blind to the responses that generate the bill.

This is a FALSE GREEN inside the observability layer itself, and it is worse than
a missing field would be. A missing field fails loudly at query time. A field that
is present, queryable, and silently empty for 84% of rows produces a
confident-looking cost dashboard that would have reported the relay daemon as
costing approximately nothing.

**Consequence for the design:** receipts at the caller are not the preferable
option, they are the only option. Brandon's instinct is right and the reason is
stronger than "attribution is nicer than billing."

## The specimen, computed

Every input measured, none assumed:

```
payload            280 KB   (card 9000 metadata blob)
poll interval      6 s      (LANE_RELAY_POLL default, pre-fix)
bits downloaded    2,293,760 per poll
bits of information        1   (queue empty / not empty)
─────────────────────────────────────────
cost-to-information ratio   2,293,760 : 1
```

**2.29 million bits transferred per bit learned.** Brandon's framing was "insane
information economics even though the software was working"; the number is worse
than the framing suggests.

### Where our own arithmetic breaks, stated plainly

At the measured rate (34,553 req/day) and payload (280 KB), the daemon alone
implies **128.8 GB over 13 days**. Supabase billed **18.69 GB total**, from all
sources. Those cannot both be true.

Candidate explanations, none verified: the blob grew over the period rather than
being 280 KB throughout (153 relays accumulated, newest 5 days old, so early polls
were far smaller); the 34,553/day figure was measured on one day and not sustained;
the billing window is not 13 days. Reversing from the bill gives ~42 KB average per
request, consistent with a payload that grew into 280 KB.

**We are not publishing the reconciled number, because we do not have one.** This
is exactly the failure Brandon describes - account-level billing says *Supabase used
18.69 GB* and cannot say *how much of it this daemon caused* - and it is worth
recording that it bit the person writing the report about it, one day after fixing
the daemon.

## The live finding: a loop where every observation is an error

While querying for the above, a second poller surfaced that nobody had identified:

```
ua      Python-urllib/3.14      (NOT this Mac - local python is 3.13)
path    /rest/v1/tasks
method  GET
status  402   -- on all 3,453 requests
city    Winslow
rate    ~290/hour, FLAT across every hour including 09:00-13:00
```

**Every single request returns HTTP 402.** The quota has been exhausted since the
relay incident, so this loop has been asking a dead endpoint ~7,000 times a day and
receiving an error every time. Its cost-to-information ratio is not large, it is
**undefined** - 3,453 observations, zero bits, because the answer never changed and
was never usable.

Two things make this worth Brandon's attention:

1. **It is not his ECONOMIC FALSE GREEN as defined.** His class is "functionally
   healthy system whose resource consumption has diverged from useful work." This
   system is *not* functionally healthy - it is failing 100% of the time. Yet it
   sits below every alarm, because nothing watches the ratio of error responses to
   total responses for a given caller. The class needs that sub-case.

2. **It is currently cheap and will not stay cheap.** A 402 carries no body, so
   egress is near zero *today*. When the quota resets on 2026-09-21, this loop
   resumes at full payload with nothing changed. The incident is scheduled.

### And we still cannot name the process

We have the user agent, the exact path, the method, the status, the city, the rate,
and a flat 24-hour profile. `ps aux` shows no live `python3.14`. Crontab has five
entries, none matching the cadence.

The strongest candidate is **`zj --watch`** - the live Wall, which redraws the board
on a **20-second default interval** and queries `/rest/v1/tasks` on each redraw
(confirmed: `zj` and `ztui` are the two local tools that hit Supabase; `zj` line
251, `int=20`). 20s gives 180/hour against an observed 290/hour, so either the
interval is shorter, more than one watcher is running, or something else
contributes. **Not asserted as identified.**

**That residual is itself the argument.** With near-complete request-side telemetry
we still cannot attribute traffic to a process. Only the caller knows who it is, and
only if it says so. That is the case for receipts, demonstrated rather than argued.

There is also a second-order lesson: **the dashboard was polling the board it
reports on, while every poll returned 402.** The Wall would have rendered fine.
Brandon's "dashboard health is not data-path health is not economic health" is not
a hypothetical - it is running on this machine right now.

## What we already have (check before building)

| Brandon's component | Status here |
|---|---|
| Per-run token + dollar attribution | **Partly built.** `zao-spend` prices session transcripts, `--by-lane` groups by working directory, `--ledger` appends hourly via cron, and it prints cost per PR and per 1k output tokens. |
| Cost per verified useful outcome | **Crudely.** "PRs opened in the window" is the outcome proxy. It is not *verified* useful - a merged PR is not proof of value - but the shape is right. |
| Spend circuit breaker | **Designed, not built, and for a different thing.** Doc 1226 specs a capped spend rail for *purchases* (per-tx $25, daily $100, Telegram approval). It does not touch inference, egress, DB or storage. |
| DB / egress / storage attribution | **Absent**, and per the finding above it cannot be retrofitted from provider logs. |
| Hierarchical breakers per call/agent/loop/mission/provider/day | **Absent.** |

So the correct move is **extend `zao-spend` into the loop/daemon layer**, not stand
up a parallel system. The measured unit already exists on the Claude side
(`agent-spend.md`: cost = turns x ~$1.01, flat); what is missing is the same
treatment for daemons, which is where the 402 loop and the relay daemon both live.

## Where the brief should be sharpened

Offered as disagreement, per Brandon's own instruction not to accept his states
because he proposed them.

- **"What changed since my last observation?" is right, and the daemon could not
  have asked it.** The card is a single jsonb blob; PostgREST returns the whole row
  or nothing. There is no cursor to hold. So "use deltas/cursors/events" is not a
  discipline the loop failed to apply - it is a capability the storage shape denied
  it. **The schema is the bug**, and any receipt system that reports the poll's cost
  without flagging that will produce an accurate number and the wrong action.

- **A per-call breaker is probably not worth building.** The relay incident was
  ~34,553 calls that were individually trivial and collectively fatal. A per-call
  check would have passed every time while adding overhead to every call. Start at
  **per-loop**, which is the grain at which both of our real incidents occurred.

- **The consequence policy needs a third axis beyond safety-critical.** A loop that
  is failing 100% (the 402 case) should be PAUSED immediately and cheaply, because
  pausing costs nothing when nothing works. A loop that is expensive but *producing*
  should throttle, not pause. Error-rate and cost are independent inputs and the
  matrix should say so.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Identify and stop the Python-urllib/3.14 poller before the 2026-09-21 quota reset turns it back into real egress | @Zaal (Claude) | Investigation | 2026-08-27 |
| Add an error-rate-per-caller check: any caller whose responses are >90% non-2xx over an hour gets surfaced. Cheap, and it catches the whole 402 class | @Zaal (Claude) | Build | 2026-09-02 |
| Extend `zao-spend` to price daemon/loop resource use, not only Claude session transcripts | @Zaal (Claude) | Build | 2026-09-09 |
| Reply to Brandon with the 84%-missing finding, since it changes where his receipts must live | @Zaal | Outbound | 2026-08-24 |
| Do NOT flip the Heart flag; run the six injections in one controlled canary window | @Zaal | Decision | 2026-08-27 |
| Reconcile the 128 GB vs 18.69 GB gap, or record permanently that it is unreconcilable | @Zaal (Claude) | Research | 2026-09-05 |

## Sources

- [FULL - queried 2026-08-23] Supabase `edge_logs` via `query_logs` MCP against the cowork project. Five queries: source counts (41,655 edge / 284 postgres), the full `log_attributes` key list, the bytes-by-caller aggregation, the `content_length` presence split (34,908 MISSING / 6,739 present), and the hourly Python-urllib breakdown. All figures above come from these.
- [FULL - read on disk 2026-08-23] `~/bin/zj` lines 11 and 249-252 - `--watch` default `int=20`, and the two local tools (`zj`, `ztui`) that query Supabase.
- [FULL - read on disk] `~/bin/zao-spend` (12,517 bytes) `--help` output - `--hours/--days/--by-lane/--ledger/--history`.
- [FULL - read on disk] `research/infrastructure/1226-capped-spend-rail/README.md` - the existing spend design, scoped to purchases not resource use.
- [FULL - measured 2026-08-22] The relay incident figures: 280 KB payload, 6s poll, 22 lanes, 34,553 req/day, 18.69 GB against a 5.5 GB quota. Fix verified: `POLL=60`, one daemon, started 21:02.
- [PARTIAL] Brandon's brief itself, received via Zaal as message text. His cost figures (~$100/mo ChatGPT-Codex, ~$100/mo Google AI Ultra, $12.50/day breaker, ~$3.33/day Gemini) are **his measurements, not independently verified here**, and are quoted as his.
