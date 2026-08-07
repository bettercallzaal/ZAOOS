---
topic: agents
type: decision
status: research-complete
last-validated: 2026-08-07
related-docs: "2225, 2218, 2092"
original-query: "Spec the TG pinned mission-control: read the relays + internal agent-to-agent comms live, and input stops/corrections in real time as the system runs (task #73)."
tier: STANDARD
---

# 2226 - TG Pinned Mission-Control (spec)

> **Goal:** A live pinned Telegram message that lets Zaal READ everything the swarm
> is doing (relays + agent-to-agent comms) and STEER it in real time - reply, tap,
> command, or voice - built on the `step-journal` primitive (scripts/agents/step-journal.py).

## The shape Zaal specified

- **INPUT (all, so he can steer whenever/wherever):** reply-to-the-pinned-message
  (routed to the right agent/relay), tap-buttons on it (pause/stop/approve/redirect),
  quick-commands (`/stop /add /fix`), AND voice-note (transcribed to a live correction).
- **SHOW:** agent-to-agent comms + what's-running+cost + needs-you flags + relay
  traffic (Jim bus, lanes) - but MUTABLE channels + a PRIORITY system: notify only when
  importance >= 7/10; otherwise quiet (he pops in when he wants).
- **TOPIC-THREADED:** pop in by topic and see how an idea PROGRESSED over time.
- **REPLY-TO-STEP:** reply to a specific step of a running process -> triggers a FIX or
  RE-RESEARCH of what that step did wrong.

## The substrate: `step-journal` (built, this PR)

Every consequential agent/relay event becomes a step: `{id, ts, topic, actor,
severity 0-10, text, parent, kind}`. Agents `append()`; a reply is a `kind=correction`
step whose `parent` is the step being corrected. This gives all four features for free:
- **topic-threaded** = `thread(topic)` (how an idea progressed).
- **priority** = `feed(min_severity=7)` (the notify->=7 rule).
- **reply-to-step** = `reply(step_id, text)` -> a correction linked to the exact step,
  which a live runner reads to re-run/fix that step.
- **all-channels + mutable** = the `topic`/`actor` fields are the channels; muting is a
  per-topic filter on render.

## Build plan (each a PR; the live-bot wiring is Zaal-gated)

1. **step-journal primitive** - DONE (this PR): the standalone JSONL substrate + tests.
2. **Emit steps** (live, gated): ZOE + the fleet + the relay-bridge `append()` their
   consequential actions to the journal (agent-to-agent comms, relay traffic, cost).
   Reuses `bot/src/zoe/relay-bridge` + `lane_handoffs` (doc 2092). Touches live infra ->
   Zaal-reviewed PR, not overnight.
3. **Render the pinned message** (live, gated): a cron rewrites the pinned TG message
   to show the priority-filtered feed (>=7 tagged, else quiet) + what's-running+cost,
   with buttons (pause/stop/approve/redirect). Reuses the existing pinned-question +
   button-bar cockpit.
4. **Route the inputs** (live, gated): a reply / `/stop /add /fix` / voice-note maps to
   `reply(step_id, ...)` or a control action, routed to the target agent/relay. Voice
   reuses the existing Groq-Whisper voice-in.
5. **Mute + topic controls**: per-topic mute + a `/topic <name>` view of a thread.

## Guards
- Steps 2-5 touch the LIVE bot + relays -> each is a Zaal-reviewed PR, never an
  overnight auto-change (agent-loops rule 35). Only the standalone primitive + this
  spec are built unsupervised.
- A `/stop` or a correction is a control action, not a gated one (it halts/redirects
  our own agents) - but anything it triggers that is outbound/spend/on-chain stays gated.

## Next Actions
| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Review step-journal + this spec; decide the pinned-control build order | Zaal | decision | 2026-08-08 |
| Build step 2 (agents emit steps to the journal) as a Zaal-reviewed PR | Claude/ZOE | PR | 2026-08-13 |

## Sources
- `scripts/agents/step-journal.py` (this PR) [FULL] - the substrate primitive + selftest.
- Zaal's spec (2026-08-07 grill answers) [FULL]. `bot/src/zoe` relay-bridge + pinned-question + button-bar [repo]. Doc 2092 (lane_handoffs).
