# ZOE send budget - DONE

Branch: `ws/zoe-send-budget`, stacked on `ws/skill-estate-upgrade` (`c1772bd6`,
the grill's move to one daily batch). Committed, not pushed - Zaal pushes and PRs.

## The problem this closes

ZOE sent 4,709 Telegram messages in August against 12 replies from Zaal: 392
sends per reply. His reply rate fell 93% from April while ZOE's volume rose 28x.
ZOE did not lose him on quality. It lost him on volume, and the one message that
needed him arrived in the same stream as the 149 that did not.

The analysis lane's read of the full corpus (9,627 messages, 151 days) sharpened
that into a target rather than a diet:

| Intent | Share of traffic | Reply rate |
|---|---|---|
| ANSWER | 18.8% | 17.6% |
| ASK | 51.6% | 0.58% |
| BROADCAST | 29.6% | 1.97% |

Answering earns a reply about 30x more often than asking, and asking is half of
everything ZOE sends. Eight scheduled types - 1,116 messages - drew ZERO replies
in 151 days. Failure and breakage notices are the opposite case: the class he
reliably answers.

## What was built

**One gate, wrapping `bot.api.sendMessage` itself.** Fourteen modules send to
Telegram across ~50 raw call sites. `telegram-routing.ts` claims in its own
header to centralize "ALL message sends", but only 15 sites actually route
through it - so a per-call-site cap was already wrong, and would be wrong again
at the 51st send. `installSendBudget(bot)` runs once, immediately after
`new Bot(token)`, before any handler or cron registers. Every send present and
future passes the same gate by construction. `ctx.api` is the same `Api` object
as `bot.api` in grammy, and `caster` / `posts/buttons` are handed that same
instance, so there is no second sender inside `bot/src/zoe/` to forget.

**Six classes.** The whole policy is one table in `send-budget.ts`:

| Class | Passes when the cap is spent | Counts | Over the cap |
|---|---|---|---|
| `reply` | always | no | n/a - solicited traffic is not the problem |
| `alarm` | always | yes | never queues - a deferred breakage notice is a lost one |
| `gated` | always | yes | n/a - needs-you cards must reach him |
| `status` | no | yes | DROPPED |
| `digest` | no | yes | DEFERRED into the next morning batch |
| `noise` | no | yes | DROPPED, and off a small reserve so it is cut FIRST |

- Cap defaults to **20/day**, `ZOE_DAILY_SEND_CAP` overrides, `ZOE_SEND_BUDGET=off`
  disables the gate entirely.
- `noise` gets `ZOE_NOISE_SHARE` (default 0.25) of the cap - 5 of 20 - so the
  measured zero-reply types run out early instead of competing on equal terms
  with traffic he answers. That is what "cut first" means in code.
- Day boundary is **America/New_York**, not UTC. A UTC boundary would reset the
  budget at 8pm his time, which is not a day.
- The counter **persists**, so a redeploy cannot hand ZOE a fresh budget.

**Nothing is silent.** Every drop and every deferral writes a `console.warn` for
journald AND a JSONL row at `~/.zao/zoe/send-budget-log.jsonl` carrying outcome,
class, chat, count, cap, reason and a 120-char preview. The deferred queue lives
at `~/.zao/zoe/send-deferred.jsonl` and the morning-brief job drains it and sends
the whole backlog as ONE message - a deferred digest that never resurfaces is
just a silent drop with extra steps.

**The gate fails OPEN.** If state cannot be read or written, the send goes
through and the error is logged loudly. The cost of a missed cap is one noisy
day; the cost of a mute is Zaal never hearing a gated decision at all.

## Where classes are assigned

Three coarse points, not 50 call sites. Untagged sends default to `status` - the
capped class - because an untagged autonomous send is exactly the traffic the cap
exists to bound.

| Class | Assigned at |
|---|---|
| `reply` | a grammy middleware in `index.ts` - everything sent while handling an inbound update |
| `digest` | the morning-brief, evening-reflection, team-digest and nightly-recap cron callbacks |
| `gated` | the backlog-grill daily batch and the hourly grill card |
| `alarm` | the auth-failure alert (`index.ts`), the preflight report, and watcher anomalies |
| `noise` | fleet self-heal notes, cost alerts, and agent-bus relay pushes |

The watcher cron used to send anomalies and fleet self-heals as ONE message.
They are now two: an anomaly is a failure notice, a self-heal is a watchdog
restart - one of the eight zero-reply types. Merged, the budget had to either cap
the alarm or exempt the restart log.

## Honest gaps

- **Four of the eight zero-reply types are not yet tagged**: recurring status
  reports, build-candidate approvals, bot activity logs, event promos, and
  affirmation prose. I could not map those labels to specific send sites from the
  code alone, and guessing the mapping would have produced confident wrong tags.
  They currently fall to the `status` default, which caps them but does not cut
  them first. Mapping them needs the analysis lane's per-message source labels.
- **Agent-bus relays are classed `noise`** on the corpus evidence. That is the
  lane-to-Zaal transport, so cutting it early is a real behaviour change - the
  lanes still have the board and the vault, and every cut is logged, but this is
  the one tag worth a second look before merge. Reversible: retag, or raise
  `ZOE_NOISE_SHARE`.
- **Scope is `bot/src/zoe/` only.** ZAO Devz, ZAOstock and ZAI construct their own
  `Bot` instances and are not gated. The measurement was ZOE's.
- **Not deployed.** The VPS is down and was not touched. Nothing here has run in
  production; the evidence below is local.

## Files

New:
- `bot/src/zoe/send-budget.ts` - the gate, the policy table, the counter, the log, the deferred queue
- `bot/src/zoe/__tests__/send-budget.test.ts` - 49 tests

Changed:
- `bot/src/zoe/index.ts` - `installSendBudget(bot)` at boot; reply-class middleware; auth alert tagged `alarm`
- `bot/src/zoe/scheduler.ts` - digest/gated cron wraps, morning-batch drain, preflight `alarm`, watcher split, cost alerts `noise`
- `bot/src/zoe/relay-bridge.ts` - inbound relay pushes tagged `noise`

## Verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` | exit 0, 0 errors |
| `npx vitest run` (full bot suite) | exit 0, **190 files / 2510 tests passed** |
| Baseline before this branch | 189 files / 2461 tests passed - so **+1 file, +49 tests, 0 regressions** |
| `npx biome check` on the new files | exit 0, clean |
| Secret / PII scan on the staged diff | no matches |

Boot-verify was NOT run: importing a poller entrypoint starts a live poll and
collides with the running instance (`agent-loops.md` rule 21). The install is a
three-line wrap covered by a test that asserts `bot.api.sendMessage` is replaced
in place and that the replacement caps.
