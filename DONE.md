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
| `noise` | nowhere in this repo - no candidate emits a measured matcher (see below) |

The watcher cron used to send anomalies and fleet self-heals as ONE message.
They are now two: an anomaly is a failure notice, a self-heal is a watchdog
restart - one of the eight zero-reply types. Merged, the budget had to either cap
the alarm or exempt the restart log.

## The chokepoint question, answered (2026-08-27)

The analysis lane's `~/Documents/zorca/docs/zoe-send-site-labels.md` argues that
9 of 12 zero-reply types have no emitter in the bot tree, so a budget living only
in `bot/src` cannot throttle them, and the chokepoint must be the Telegram send
call itself. I ran all fifteen of its first-line matchers against this source
tree. **Two hit. Thirteen do not.**

| Matcher | In this tree? |
|---|---|
| `Fleet health ` | yes - `bot/src/zoe/brief.ts`, already inside the morning brief (`digest`) |
| `Team tracker - ` | yes - `bot/src/zoe/team-tracker.ts`, reachable only via the `/team` command |
| `=== ZAO FLEET`, `FLEET OUTPUT - `, `Ecosystem watch - `, `BUILD CANDIDATE #`, `ZOL followed `, both affirmation texts, `Cost-of-pass `, `BUS from `, `BUS coordinator `, `watchdog`, `froze -> restarted` | **no hit** |

### Does the gate sit at the chokepoint, or upstream of it?

**Both, and the distinction is the whole answer.**

It IS the chokepoint *for this process*. `installSendBudget(bot)` replaces
`sendMessage` on the grammy `Api` instance the ZOE bot owns - the actual
Telegram call, not a helper above it. `ctx.api` is that same object, and
`caster` / `posts/buttons` are handed that same instance, so no send made by
this process can route around it, including one added tomorrow.

It is NOT the chokepoint *for the estate*. A VPS cron that posts to the Bot API
on its own never enters this process, so it never reaches this gate. The lane is
right, and the matcher run above is the proof rather than the argument: thirteen
of the fifteen measured shapes are emitted by something that is not in this
repository. The 4,709-message problem is therefore only partly a `bot/src`
problem, and the share this gate can bound is the share this process sends.

### What the estate-wide chokepoint would have to be

The measurement is "messages Zaal RECEIVED", so the budget's natural key is his
chat id, not the sender. That points at one shape:

- **A local Bot API proxy that every emitter points at** - grammy's `apiRoot`,
  curl's `--url`, whatever each cron uses - with the budget enforced inside it,
  keyed on the destination chat. It is the only shape that also catches an
  emitter nobody remembered to migrate, because a job that skips it stops
  working rather than quietly bypassing the cap.
- A shared `zao-tg-send` helper each cron must call is easier, and weaker: it
  budgets only the jobs that adopt it, which is the same failure that left these
  nine unmapped in the first place.

**UNVERIFIED and load-bearing:** whether those unmapped emitters use the same
bot token as ZOE. The VPS is down and was not touched. If they use different
tokens, keying the budget on the recipient chat id rather than the token is what
makes the proxy correct anyway.

## Which of the untagged types got a label-to-module mapping

**None that can be tagged.** Reported as measured, not as hoped:

| Type | Mapping in the labels file | Tagged? |
|---|---|---|
| recurring status report | splits into four senders - fleet report, ecosystem watch, cockpit digest all UNMAPPED; **team tracker CONFIRMED** | **No.** Its one message in 151 days is the answer to a `/team` command Zaal typed - already class `reply`. Tagging it `noise` would cap a reply to his own command. |
| build-candidate approval | SPLIT - button module confirmed, text producer UNMAPPED | **No**, and the labels file says why: budget the escalation PRODUCER, never `build-candidate.ts`. Capping the button module suppresses the approval UI while the sends keep coming. |
| bot activity log | UNMAPPED (`ZOL followed ` is not in this tree) | No |
| event promo | reclassified - 2 genuine promos UNMAPPED; the other 26 are social drafts, sites confirmed (`posts/fractal-promo.ts`, `posts/drafters.ts`) | **No.** Those 26 are tap-to-approve drafts, not promos, and the file does not establish them as zero-reply. Tagging them would be the inference this exercise exists to avoid. |
| affirmation prose | UNMAPPED - content source found in a private note, no emitter in this tree | No |
| agent-bus relay | UNMAPPED, per instruction | No - and **untagged**, see below |

### Three earlier tags were wrong and have been reverted

An earlier pass tagged agent-bus relays, cost alerts and fleet self-heals as
`noise` by reading module names. The matchers say all three were the wrong
sender:

- **`relay-bridge.ts`** does not emit `BUS from ` / `BUS coordinator ` / `bus: N new message(s):`, and none of those appear anywhere in the tree. Reverted to the `status` default.
- **The scheduler's `COST ALERT: Spend reached N%`** is not `^Cost-of-pass YYYY-MM-DD:`, which is what the 24 measured messages match. Reverted.
- **The watcher's fleet self-heal note** emits neither `watchdog` nor `froze -> restarted`, which is what the 266 measured restarts match. Reverted.

Each would have throttled a working sender while the measured traffic carried on
arriving at full volume - a silence that looks exactly like the budget working.
The watcher SPLIT is kept: an anomaly is a failure notice (`alarm`), a self-heal
is not, and that distinction stands on the module's own doc rather than on a
matcher.

### So `noise` has no call site in this repo

The class, its 25% reserve and its tests are in place and correct, and **nothing
here is tagged with it.** Stated plainly because a budget class that can never
fire must not be mistaken for one that is working. It becomes useful the moment
either the unmapped emitters are found, or the budget moves to the recipient-keyed
proxy above - and until then the honest position is that ZOE's chattiest traffic
is not reachable from this repository.

## Honest gaps

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
- `bot/src/zoe/scheduler.ts` - digest/gated cron wraps, morning-batch drain, preflight `alarm`, watcher anomaly/self-heal split
- `bot/src/zoe/relay-bridge.ts` - a comment recording why the inbound relay push is NOT tagged

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
