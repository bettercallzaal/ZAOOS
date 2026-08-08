---
topic: agents
type: decision
status: research-complete
last-validated: 2026-08-07
superseded-by:
related-docs: "2092, 2174, 2246"
original-query: "https://www.reddit.com/r/claudeskills/s/cq1pLgv30u DEEP RESEARCH this"
tier: DEEP
---

# 2249 - CLI messaging vs SSH orchestration across machines

> **Goal:** Test a claim - that linking Claude Code across machines works better
> via CLI messaging than SSH orchestration - against a session that did nothing
> but SSH-orchestrate for eight hours.

## The mechanism, verified against the CLI itself

Zaal's read, which is better than mine: the post is about **a way to let Claude
Code use other terminal sessions**. The author's other two titles say it plainly -
"Wire multiple Claude Code sessions together across machines **using only the
claude cli itself**".

All three of his posts are `[removed]`, so the write-up is gone. But "the claude
cli itself" is checkable, and it checks out. From `claude --help` on this machine,
2026-08-07:

| Flag | What it gives you |
|---|---|
| `--session-id <uuid>` | "Use a specific session ID for the conversation" - a session can be addressed by a name you choose in advance |
| `-r, --resume [id]` | "Resume a conversation by session ID" |
| `-p, --print` | non-interactive: deliver one message, get one answer, exit |
| `--bg, --background` | "Start the session as a background agent and return immediately" |
| `claude agents` | "Manage background agents" - first-party, not a hand-rolled daemon |
| `--fork-session`, `-n --name` | branch a session; give it a human label |

So the shape is:

    claude -p --resume <session-id> "here is what I need"

and, because `--session-id` takes a UUID **you** pick, any machine that knows the
id can append to a conversation that already holds the context. Background agents
and `claude agents` make the resident-process half first-party too - which is the
piece I assumed we would have to build.

**The distinction is not the transport - it is what you send.** SSH orchestration
sends COMMANDS to a machine with no memory of why. CLI messaging sends a MESSAGE
to a session that has been watching that machine all along. Both can travel over
ssh. Only one of them lands somewhere that already understands the context.

That reframing is what makes the post's claim true, and it is sharper than the
push-vs-pull framing I reached for before checking the CLI.

## The source, and its honest limit

r/claudeskills, u/espenakker:

> "I linked Claude Code across my main PC, laptops, and a Jetson. **CLI messaging
> works better than SSH orchestration.**"

and, from the same author on the same day:

> "Wire multiple Claude Code sessions together across machines **using only the
> claude cli itself**"

**The post body is `[removed]`.** Confirmed twice - via `zao-fetch-reddit.sh` and
directly against the arctic_shift archive, which also stores it as `[removed]`.
So the author's actual method is unavailable and nothing below reconstructs it.
What survives is the title's claim, one substantive comment, and - far more
useful - a full working day of evidence from this repo.

The one comment worth keeping, u/allaion:

> "You get extra uplinks, context, and perhaps even the variation in what
> resources they have available could make it more robust. Robust in the sense
> that the other agents become sufficiently different and perhaps it emulates
> getting a different perspective on things."

## Why this repo can test the claim

ZAO runs the exact topology the post describes: a Mac, a VPS, a Pi, and a Windows
desktop. And this session was an unbroken eight hours of SSH orchestration - every
deploy, every diagnosis, every flag flip went out over `ssh vps ...`.

So the claim is not abstract here. It is a description of how we already work.

## What SSH orchestration actually cost, measured

Four failures from today, all the same shape:

1. **The deploy was wedged for ~2h50m and nothing said so.** A cron autodeploy
   hung inside `npm install esbuild`, held its own lock, and every later run
   exited instantly at `flock`. ZOE served 14-commit-old code. Found only because
   somebody SSH'd in and read the process table.
2. **Five feature flags were set to the wrong value.** Three compare `=== '1'`;
   they were written as `true`. They looked enabled and did nothing. Found only by
   SSH-ing in and grepping the env.
3. **The bus code was never deployed.** No clone, no token on the box. The
   "silence from Jim's lane" was our own missing listener. Found by SSH.
4. **`bus-bridge` was never even wired.** Nothing imports it. Found locally - the
   one that SSH could not have told us.

The pattern in the first three is not that SSH failed. SSH worked perfectly every
time. **The pattern is that nothing happened until I decided to look.**

## The real axis is PUSH vs PULL, not CLI vs SSH

SSH orchestration is a **pull** model: one brain reaches into N machines and asks.
It is exact, it is scriptable, and it is silent until queried. A wedged deploy, a
mistyped flag, and an unstarted service all look identical from a Mac - like
nothing.

Messaging is a **push** model: each machine reports. The machine that is wedged is
the one that knows it is wedged.

That reframing matters because it explains something the CLI-vs-SSH framing does
not: **we already have push, and it already worked.** `~/bin/zao-status` pushes to
Telegram, and `zoe-autodeploy.sh` calls it on every blocked deploy. During the
2h50m wedge those alerts were firing into a channel nobody was reading. The
transport was not the problem. **The problem was that the signal had no reader** -
which is `noisy-signal-guard.md` from the other direction.

## The second axis: who holds the context

u/allaion's comment points at the part that actually justifies separate agents:
each machine's agent knows its own machine. An SSH command carries no memory of
the box it lands on; a resident agent has been watching that box all day.

This is the honest argument for messaging over SSH, and it is not about
convenience. A resident agent on the VPS would have noticed a deploy that had not
moved in three hours. A Mac issuing `ssh vps git log -1` learns nothing unless it
already suspected something.

## What ZAO should actually do

**Not** "replace SSH with messaging". SSH is the right tool for a precise,
one-off, auditable action - reading a process table, running a gated deploy
script - and it is not going away.

The three real moves, in order of value:

1. **Give the existing push a reader.** `zao-status` already alerts on a blocked
   deploy. Route those to a surface that gets seen (the DM, not a group nobody
   opens) and the 2h50m wedge becomes a 10-minute one. This is nearly free and it
   is the single highest-value change here.
2. **Make liveness pull-on-demand, which is already built.** `zoe-liveness
   --remote` (doc: PR #2968/#2969) answers built/wired/flagged/live in one command
   and caught the wrong-valued flags within an hour of shipping. Pull is fine when
   it is one cheap command instead of a diagnostic expedition.
3. **A resident session per machine is the real upgrade, and it is cheaper than I
   assumed.** `--bg` plus `claude agents` makes the background-process half
   first-party, and `--session-id` with an id we choose means the VPS session can
   be addressed from anywhere without a registry. The cost is not the build - it
   is that each host gets its own cap, its own memory, and its own way to fail,
   and `agent-loops.md` rule 9 (one instance per resource) gets harder to hold.
   Worth doing once 1 and 2 are in place, and worth a real doc before starting.

Doc 2246 covered the in-session case (`SendMessage` between agents in one tree).
This is the complement: `--session-id` / `--resume` / `--bg` address a session on
ANOTHER machine, which is the gap 2246 left open and marked UNVERIFIED. Between
them the picture is now complete, and neither required a third-party tool.

## Also See

- [Doc 2246](../2246-claude-code-cross-session-messaging/) - native SendMessage; the transport
- [Doc 2174](../2174-bidirectional-relay-feedback-loops/) - the relay we built for this problem
- [Doc 2092](../../dev-workflows/2092-lane-handoff-coordination/) - handoffs as a shared record
- `.claude/rules/noisy-signal-guard.md` - a signal with no reader is the same as no signal

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Route `zao-status` deploy-blocked alerts to the ZOE DM instead of a group. Shipped when a deliberately-blocked deploy produces a DM. | @Zaal | PR | 2026-08-10 |
| Run `zoe-liveness --remote` at the start of any session that touches the VPS, before diagnosing anything. Shipped when it is in the worksession routine. | @Zaal | Practice | 2026-08-09 |
| Decide whether a resident VPS agent is worth its cap and its one-instance risk. Shipped when the answer is written down either way. | @Zaal | Decision | 2026-08-21 |

## Sources

- [r/claudeskills post 1vid863](https://www.reddit.com/r/claudeskills/comments/1vid863/) - **PARTIAL**. Title and comments retrieved 2026-08-07 via `zao-fetch-reddit.sh`; **the body is `[removed]`**, confirmed independently against the arctic_shift archive. The same author's two companion posts (`1viaj6a`, `1viaa8h`) are also `[removed]` - their titles are the only surviving detail and are quoted above. The method below is NOT his write-up; it is the CLI's own documented behaviour.
- `claude --help`, Claude Code CLI on this machine, 2026-08-07 - **FULL**, first-party. Every flag in the mechanism table is quoted from it verbatim.
- This session's own logs and SSH transcripts, 2026-08-07 - **FULL**. The wedged autodeploy, the wrong-valued flags, the undeployed bus, and the unwired bridge are all first-hand.
- `~/bin/zao-status`, `~/bin/zoe-autodeploy.sh` on the live VPS - **FULL**, read directly.
