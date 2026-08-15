---
topic: agents
type: audit
status: research-complete
last-validated: 2026-08-14
superseded-by:
related-docs: 2282, 2272
original-query: "Diagnose ZOL: 49 drafts accumulating with nothing posted since Aug 3, and three tmux daemons holding 32-131s of CPU with zero output in 5d20h. Read-only - posting stays gated, retire decisions stay Zaal's."
tier: AUDIT
---

# 2285 - ZOL has been in draft-only for eleven days, and it said so every hour

> **Goal:** Explain why nothing has posted since 2026-08-03 and what the three
> silent ZOL daemons actually do. **Read-only. Nothing was changed on the Pi.**

This also **corrects doc 2282**, which graded these three daemons on pane silence
- the exact error 2282 was written to avoid.

## The answer, in one line

Nothing is broken. `zol-daily.js` is in **draft-only mode by default**, the cron
line sets no override, and it has pinged Zaal on Telegram with a draft every hour
for eleven days.

```js
// zol-daily.js:21
const DRAFT_ONLY = process.env.ZOL_DRAFT_ONLY !== '0'; // default: draft-only, do NOT auto-post (Zaal reviews)
```

```
# crontab - no ZOL_DRAFT_ONLY anywhere
0 0-2,9-23 * * * cd $HOME/zol/farcaster-agent && node zol-daily.js >> $HOME/zol/daily.log 2>&1
```

Compare the siblings, which DO carry their live flags:

```
*/5  * * * * ... ZABAL_WATCHER_LIVE=1 node zol-zabal-watch.js
*/5  * * * * ... ZOL_DRAIN_LIVE=1 /usr/bin/env node zol-drain.js
```

`zol-daily` is the one without one. Turning it on is a single env var on that cron
line - and it is **Zaal's call**, because it is outbound.

## Why "49 drafts" looked like a backlog and is not

The directory holds **two different things**, and only one of them is a pending
approval:

| kind | count | newest | written by | read by |
|---|---:|---|---|---|
| `.txt` | 35 | **2026-08-14 22:00** (hourly) | `zol-daily.js:193`, the DRAFT_ONLY branch | **nothing** |
| `.json` | 13 | **2026-08-03 12:00** | the four ZOL daemons | `dashboard.js` |
| `cleared` / `posted` / `unverified` | 5 | - | state markers | - |

Two things fall out of that table:

1. **The `.json` side stopped on Aug 3**, the same day as `last-posted.json`.
2. **`dashboard.js` reads only `.json`** -
   `readdirSync(DRAFTS).filter(f => f.endsWith('.json'))` - so the dashboard shows
   13 drafts and cannot see the 35 that are actually waiting. Anyone checking the
   dashboard to ask "is ZOL producing?" gets a picture that froze on Aug 3.

`last-posted.json` is written **only** on the auto-post branch (`zol-daily.js:202`),
never on the draft branch. So Aug 3 is not when ZOL stopped working - it is when
`ZOL_DRAFT_ONLY=0` was last in effect.

## Correcting doc 2282 on the three daemons

Doc 2282 graded `zol`, `zolt` and `zolz` **STALLED** on empty tmux panes, and
suggested they were "either duplicating cron silently or doing nothing". Both
halves were wrong.

**They cannot speak.** `console.log` count in each:

```
zol-reply.js       0
zol-threads.js     0
zol-learn-zaal.js  0
```

Zero. Their panes are empty because they contain no logging statement at all, not
because they stalled. That is `state-claims.md`'s "silence is not evidence" -
you cannot conclude a feature did not run from missing log lines unless you first
prove it CAN log. 2282 drew exactly that inference.

**And they have distinct, documented jobs** - none is a duplicate of cron:

| daemon | job | evidence of life |
|---|---|---|
| `zol-learn-zaal.js` | learns from Zaal's original casts, quote-casts every 4th strong one | **`~/zol/zaal-learnings.md` written 2026-08-14 18:12 - ALIVE** |
| `zol-reply.js` | polls `@zolbot` mentions, drafts a graph-aware reply, stages it for approval | no artifact since Aug 3 - **UNVERIFIED** |
| `zol-threads.js` | watches replies to ZOL's own casts so threads do not go unanswered | no artifact since Aug 3 - **UNVERIFIED** |

`zol-learn-zaal` is provably alive by its artifact. The other two are consistent
with **having nothing to do** - no mentions, no replies - which is not the same as
being broken, and I could not distinguish the two from outside.

**Corrected recommendation: do not retire these. Instrument them.** One
`console.log` on the success path in each would have answered this in ten seconds
instead of an evening. This is the same gap PR #3084 closed inside ZOE, unfixed on
the Pi.

## What is genuinely worth changing

1. **Decide the posting question.** Either set `ZOL_DRAFT_ONLY=0` on the cron and
   let it post, or accept that a Telegram draft every hour is a notification
   nobody actions and reduce the cadence. Eleven days of hourly unactioned pings
   is the shape `noisy-signal-guard.md` warns about, aimed at a human.
2. **Fix the dashboard's filter** so it sees `.txt` drafts, or make the draft
   writer emit `.json`. Right now the surface built to answer "is ZOL producing?"
   is looking at the wrong half of the directory.
3. **Give the three daemons one log line each** on their success path.

None of these were done. Posting is outbound, the cron is Zaal's, and this doc is
read-only by instruction.

## Sources

Read live on ansuz over SSH on 2026-08-14; nothing modified.

- `~/zol/farcaster-agent/zol-daily.js` lines 21, 186-205 (the DRY / DRAFT_ONLY branch)
- `crontab -l` on ansuz - five ZOL cron jobs, only `zol-daily` without a live flag
- `~/zol/drafts/` extension census and mtimes; `last-posted.json`
- `~/zol/farcaster-agent/dashboard.js:6` - the `.json`-only filter
- `console.log` counts in `zol-reply.js`, `zol-threads.js`, `zol-learn-zaal.js`
- `~/zol/zaal-learnings.md` mtime as proof-of-life for `zol-learn-zaal`
- header comments of all three daemons for their stated jobs
