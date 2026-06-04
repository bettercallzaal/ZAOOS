---
topic: agents
type: design-proposal
status: proposed (needs Zaal greenlight before build — per CLAUDE.md "no new ZOE loop without a doc")
last-validated: 2026-06-04
related-docs: "601, 604, 759, 770, 781"
original-query: "make ZOE more of a back-and-forth conversational bot that reminds me at the right times"
tier: STANDARD (codebase audit of bot/src/zoe outbound + external research synthesis)
---

# 796 - ZOE: broadcast bot -> conversational, well-timed assistant

> **Problem (Zaal, 2026-06-04):** "I've only ever had convos that are one-way —
> post drafts, briefs, reflections. I want a back-and-forth bot that reminds me
> at the right times." A week of real transcript confirms it: every message is
> ZOE -> Zaal. Zero dialogue.

## Diagnosis: ZOE is a scheduler with a personality

A codebase audit of `bot/src/zoe/` + a research pass on 2026 proactive-assistant
literature agree on the same root cause.

**The numbers (`scheduler.ts`, `posts/scheduler.ts`):** ~10-30 unsolicited pushes/
day — 1 morning brief (`0 9 * * * UTC`) + 1 evening reflection (`0 1 * * *`) +
~7 post drafts (target 7/day) + up to ~22 hourly nudges. Only 3 message types
even have a reply mechanism, and those are y/n/buttons — not conversation. The
research is blunt: the human notification budget is **~3-5/day before fatigue**;
ZOE runs 2-6x over it, and dismissals predict churn.

**The resend nag (loudest symptom):** `posts/scheduler.ts:221` ticks every minute;
`shouldResend` (`pending.ts:56`) re-sends an un-tapped draft every 30 min up to
`MAX_RESENDS=3` (`pending.ts:16`). One un-tapped draft = up to 4 messages
(original + `resend 1/3 -> 3/3`). Worse, the every-minute async tick has no
in-flight guard and a non-atomic `pending.json` read-modify-write, so lagging
writes bunch the resends ("1/3, 2/3, 3/3 in quick succession").

**The structural finding:** ZOE has a genuinely good conversational brain — the
concierge (`concierge.ts`): 4-block memory + Bonfire recall + tools — but **every
scheduled push bypasses it.** Brief/reflect/nudge/post each call `callClaudeCli`
directly with a narrow, stateless prompt: no memory, no recall, no reply handler.
So the brief + nudge (highest frequency) are pure monologue; replying to them
starts a fresh, context-free turn that doesn't know it's answering anything. The
reflection's 3 questions are hardcoded (`reflect.ts:27-29`) — a survey, not a
conversation. And the proactive layer is **dumb fixed-cron, not event-driven** —
nothing fires off a PR opening, a CI failure, a calendar change, or Zaal going
quiet.

## Why (research principles)

1. **Interrupt only when value > cost** (Horvitz, Mixed-Initiative UIs, CHI'99).
   Non-urgent items should be *held and released at a low-cost moment* (bounded
   deferral), not fired the instant generated.
2. **~3-5 pings/day notification budget**; dismissal is a leading churn signal.
3. **Proactivity is a GATE, not a firehose** (Inner Thoughts, CHI'25): generate
   candidate "thoughts" into a reservoir, score for relevance, speak only the top
   one when it clears an interrupt threshold — otherwise stay silent.
4. **Right-time receptivity** matters as much as content; design against snooze.
5. **Continuity = reflective memory of open loops**, not a bigger prompt. "You
   said X yesterday — did it happen?" comes from tracking open threads as state.
6. **Tune frequency in dialogue**; treat dismissals as negative training signal.

The chief-of-staff product crop (Lindy, Dex) confirms it: the felt magic is
**memory of open loops + a gate on the push channel**, not fancier scheduled
content.

## The redesign — 3 moves

### Move 1 — Reasoning-tick gate replaces the content-cron (highest leverage)
Today: cron -> generate content -> send. New: cron (hourly) -> ZOE runs a
**silent reasoning turn** through the concierge/memory path that loads memory
blocks + open threads + calendar + recent inactivity and answers one question:
*"Is there anything worth saying right now, and if so, the single best thing?"*
Most ticks return `stay_silent`. Respects a hard **~3-4/day unsolicited budget**
(replies to Zaal are free/unlimited); non-urgent thoughts are **deferred** and
bundled into the next low-cost slot (e.g. the morning brief). The 7 post-drafts
collapse to **one** opt-in "drafts ready — want to see them?" or a pull command
`/drafts`. Expected effect: ~9+/day -> 2-4/day, each having cleared a relevance bar.

### Move 2 — Open-threads table (the continuity layer)
A small store ZOE reads/writes each turn, separate from Bonfire (Bonfire =
long-term recall; this = short-term open loops):
```
open_threads(id, summary, source_turn, created_at, due_at|null,
             status: open|snoozed|done|dropped, last_nudged_at,
             nudge_count, snooze_until)
```
When Zaal says "I'll ship the onepager today," ZOE writes a thread `due_at=tonight`.
A later reasoning tick sees it past-due + unacked -> *"you said you'd ship the
onepager today — did it land?"* **Rule: a proactive message must open a new
thread or advance an existing one — never a context-free template.** This single
mechanism manufactures the "it's paying attention" feeling.

### Move 3 — Ack / snooze / escalate + conversational tuning
Every push carries an implicit ack contract. Replies ("done" / "not yet" / "stop
reminding me") update thread status. Escalation: nudge frequency rises as a due
date nears, but **two snoozes flips strategy** — instead of re-pinging, ZOE asks
"reschedule, drop, or break it down?" (repetition becomes a *decision*, not
another identical ping). "Too many pings" raises the interrupt threshold + lowers
the daily budget (written to a memory block); "more nudges on X" lowers it for
that thread class. Dismissals are silent negative signal.

## Architecture mapping (bot/src/zoe)

| New piece | Where | Note |
|-----------|-------|------|
| Reasoning-tick (`shouldSpeak`) | new `proactive.ts`, called by `scheduler.ts` hourly | runs the concierge/memory path; returns `{speak:bool, message?, threadOp?}` |
| Open-threads store | new `threads.ts` (~/.zao/zoe/threads.json) | mirrors the `approvals.ts`/`pending.ts` file-store pattern + the `claimFire` O_EXCL guard |
| Daily budget + threshold | memory block (`~/.zao/zoe/`) | read by the tick, tunable in dialogue |
| Reflection -> 1 contextual question | `reflect.ts` | pick the single most relevant open thread; fixed list -> fallback only |
| Post-drafts -> opt-in | `posts/scheduler.ts` + `pending.ts` | `MAX_RESENDS=0`; bundle/`/drafts` pull |
| Event triggers | reuse the GitHub webhook (`bot/src/.../github`) + calendar/inbox deltas | feed the reservoir instead of cron |

## Phased plan

- **Phase 0 (quick win, ship now):** `MAX_RESENDS=0` (`pending.ts:16`) to kill the
  nag; collapse 7 post-drafts into one opt-in message / `/drafts`. ~halves daily
  volume immediately, no architecture change. Add the missing O_EXCL in-flight
  guard to the posts tick.
- **Phase 1:** open-threads store + route the reflection through it (one
  contextual question that references an open loop). First taste of back-and-forth.
- **Phase 2:** the reasoning-tick gate + daily budget + bounded deferral. The big
  broadcast -> conversational lever.
- **Phase 3:** event triggers (PR/CI/calendar/inbox/inactivity) feed the reservoir;
  ack/snooze/escalate state machine; conversational frequency tuning.

## Tradeoffs / risks
- A reasoning tick that defaults silent could go *too* quiet — needs a floor
  (e.g. always-deliver the morning brief) + observability on "ticks that chose
  silence" to tune the threshold.
- Open-threads inference (turning "I'll ship X" into a thread) is LLM-extracted —
  needs a light review/undo so it doesn't track phantom commitments.
- Per-process state (budget, threads) must use the atomic file-write pattern
  (`claimFire`) the brief/reflect schedulers already use — the posts machine's
  missing guard is exactly the bug that bunches resends.

## Sources
Horvitz CHI'99 (Mixed-Initiative UIs / bounded deferral); Inner Thoughts CHI'25
(arXiv 2501.00383); Background Agents & the Notification Budget (tianpan.co,
2026-05); Reflective Memory Management (arXiv 2503.08026); TiMem (arXiv
2601.02845); Static vs Adaptive Proactive Agents (arXiv 2405.07528); Feedback by
Design (arXiv 2602.01405); Lindy/Dex EA roundups. Codebase audit: `bot/src/zoe/`
{scheduler, posts/*, brief, reflect, nudges, concierge, reflexion, index}.ts.
