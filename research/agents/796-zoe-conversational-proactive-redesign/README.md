---
topic: agents
type: design-proposal
status: refined-with-zaal-2026-06-04 (4 design decisions locked; needs build greenlight — per CLAUDE.md "no new ZOE loop without a doc")
last-validated: 2026-06-04
related-docs: "601, 604, 734, 759, 770, 781"
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

## Decisions locked (Zaal, 2026-06-04)

These four choices override the generic defaults in the original draft and steer
the moves below:

1. **No daily cap — the relevance threshold is the only gate.** ZOE speaks
   whenever a candidate thought clears the interrupt threshold; there is no quota
   backstop. *Implication:* the threshold (plus its observability and
   dialogue-tuning) is now the entire safety mechanism against drift back to
   noise. The **morning brief stays an always-on floor** so "too quiet" has a
   guaranteed anchor; everything else is threshold-gated.
2. **Post-drafts: silent generation + one daily batch notice + `/drafts` pull.**
   ZOE drafts in the background, sends exactly one "*N drafts ready — `/drafts` to
   review*" per day, and Zaal pulls on demand. No per-draft pushes, no resends
   (`MAX_RESENDS=0`). This kills the single loudest channel while preserving the
   build-in-public flow.
3. **Proactive triggers: commitment follow-ups + calendar/meetings + went-quiet
   check-ins.** PR/CI events are deferred (not in the first trigger set).
   Inbox/research-queue items fold into the morning brief rather than firing their
   own ping.
4. **Bonfire is the memory backbone, and ZOE is a memory source for other
   agents.** Open loops, commitments, decisions, and resolutions emit as Bonfire
   episodes; Hermes / ZAO Devz / future agents query ZOE's memory *from the graph*
   rather than from ZOE's private store. Operational hot-state (status, due dates,
   nudge counts) stays in a fast local store; **Bonfire is the durable,
   cross-agent layer** (see Move 2).

## The redesign — 3 moves

### Move 1 — Reasoning-tick gate replaces the content-cron (highest leverage)
Today: cron -> generate content -> send. New: cron (hourly) -> ZOE runs a
**silent reasoning turn** through the concierge/memory path that loads memory
blocks + open threads + calendar + recent inactivity and answers one question:
*"Is there anything worth saying right now, and if so, the single best thing?"*
Most ticks return `stay_silent`. **No daily quota** (per Decision 1) — a thought
ships iff it clears the **interrupt threshold**, so the threshold is the sole
control and must be observable + tunable in dialogue (see Move 3). Replies to
Zaal are always free/unlimited. Non-urgent thoughts that *don't* clear the bar
are **deferred** and bundled into the next low-cost slot (e.g. the morning brief,
which is the always-on floor). The 7 post-drafts collapse per Decision 2: silent
generation + one daily "*N drafts ready — `/drafts`*" notice + on-demand pull.
Expected effect: ~9+/day -> a handful of high-relevance pushes, each past the bar.

> **Threshold-only safety (Decision 1 consequence):** with no quota backstop, a
> mis-calibrated threshold can flood. Three guards replace the budget: (a) the
> per-tick "single best thing" cap (≤1 push per hourly tick by construction);
> (b) a logged `silence_rate` metric so a too-low threshold is visible within a
> day; (c) a soft self-throttle — if N pushes go unacked in a window, ZOE raises
> its own threshold and surfaces "I've been chatty — want me to dial back?"
> rather than waiting for Zaal to complain.

### Move 2 — Two-layer memory: hot open-threads store + Bonfire backbone (the continuity layer)
Per Decision 4, continuity is **two layers, not one**:

**Layer A — hot operational store** (`threads.json`, ~/.zao/zoe/). The state
machine for live loops — fast, atomic, transactional. Holds the fields the gate
and escalation logic mutate every tick:
```
open_threads(id, summary, source_turn, created_at, due_at|null,
             status: open|snoozed|done|dropped, last_nudged_at,
             nudge_count, snooze_until, bonfire_episode_id|null)
```
This layer must **not** live in Bonfire — status transitions / due-date math /
nudge counters are transactional hot-state, wrong shape for a knowledge graph.

**Layer B — Bonfire (durable, cross-agent memory).** On meaningful transitions
(thread *opened*, *resolved*, *dropped*, key *decision* captured), ZOE emits a
natural-language episode to the ZABAL Bonfire graph and stores the returned
`bonfire_episode_id` on the hot row. Bonfire becomes the **long-term, queryable,
cross-agent** record — and this is what makes **ZOE a memory source for other
agents**: Hermes / ZAO Devz / future agents recall "what did Zaal commit to" or
"what was decided about X" by querying the graph, not ZOE's private files. ZOE
reads its own deeper history back from Bonfire too (the concierge already has
Bonfire recall — `concierge.ts`), so continuity survives a wiped `threads.json`.

Flow: Zaal says "I'll ship the onepager today" -> ZOE writes a hot thread
`due_at=tonight` **and** emits a Bonfire episode ("Zaal committed to shipping the
onepager 2026-06-04"). A later tick sees it past-due + unacked -> *"you said
you'd ship the onepager today — did it land?"* On "done", ZOE flips the hot row
**and** emits a resolution episode. **Rule: a proactive message must open a new
thread or advance an existing one — never a context-free template.** This is the
mechanism that manufactures the "it's paying attention" feeling; routing it
through Bonfire is what lets the rest of the stack feel it too.

> Episodes are written via the existing `/bonfire` skill path (SSH to VPS; the
> API key never touches local). Episode bodies are prose summaries — see the
> PII/secret scan requirement in Tradeoffs before any emit ships.

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
| Open-threads store (Layer A) | new `threads.ts` (~/.zao/zoe/threads.json) | hot transactional state; mirrors `approvals.ts`/`pending.ts` + `claimFire` O_EXCL guard; carries `bonfire_episode_id` |
| Bonfire emit (Layer B) | new `threads.ts` -> existing `/bonfire` skill path (SSH) | episode on thread open/resolve/drop + key decisions; makes ZOE a cross-agent memory source; PII/secret-scan before POST |
| Interrupt threshold + observability | memory block (`~/.zao/zoe/`) | **the sole gate** (no quota); tunable in dialogue; logs `silence_rate` + unacked-count for the self-throttle |
| Reflection -> 1 contextual question | `reflect.ts` | pick the single most relevant open thread; fixed list -> fallback only |
| Post-drafts -> silent + daily batch | `posts/scheduler.ts` + `pending.ts` | `MAX_RESENDS=0`; 1 daily "N drafts ready" + `/drafts` pull |
| Event triggers | calendar deltas + inactivity timer + commitment due-dates | the 3 chosen triggers feed the reservoir; PR/CI webhook deferred to a later phase |

## Phased plan

- **Phase 0 (quick win, ship now):** `MAX_RESENDS=0` (`pending.ts:16`) to kill the
  nag; collapse 7 post-drafts into one opt-in message / `/drafts`. ~halves daily
  volume immediately, no architecture change. Add the missing O_EXCL in-flight
  guard to the posts tick.
- **Phase 1:** open-threads store (Layer A) **+ Bonfire emit (Layer B)** + route
  the reflection through it (one contextual question referencing an open loop).
  First taste of back-and-forth; ZOE becomes a cross-agent memory source from day
  one of the continuity layer (Decision 4).
- **Phase 2:** the reasoning-tick gate + **interrupt threshold (no quota)** +
  bounded deferral + the threshold observability/self-throttle guards. The big
  broadcast -> conversational lever.
- **Phase 3:** the 3 chosen event triggers (commitment due-dates, calendar/meeting
  deltas, went-quiet inactivity) feed the reservoir; ack/snooze/escalate state
  machine; conversational frequency tuning. PR/CI triggers deferred to a later
  phase once the trigger framework is proven.

## Tradeoffs / risks
- **No quota backstop (Decision 1) cuts both ways.** A reasoning tick that defaults
  silent could go *too* quiet — mitigated by the always-on morning-brief floor +
  the logged `silence_rate`. But it could also go *too loud* if the threshold is
  mis-set, since nothing caps the day. The three guards in Move 1 (per-tick single-
  push cap, silence-rate observability, unacked self-throttle) are load-bearing,
  not nice-to-haves — they replace the budget entirely.
- **Bonfire emit adds a PII/secret-leak surface (per `.claude/rules/pii-hygiene.md`
  + `secret-hygiene.md`).** Episode bodies are graph-wide queryable by every agent,
  so this is the highest-leakage path in the stack. ZOE's emit MUST run the PII
  regex set + the secret-scan patterns before any POST and SKIP on match — the
  `BonfireMemory` adapter (doc 734) does *not* yet scan PII; that gap must close
  before/with this work, not after.
- Open-threads inference (turning "I'll ship X" into a thread) is LLM-extracted —
  needs a light review/undo so it doesn't track phantom commitments **or emit a
  phantom Bonfire episode** (an undo must also retract/supersede the episode).
- Per-process state (threshold block, threads) must use the atomic file-write
  pattern (`claimFire`) the brief/reflect schedulers already use — the posts
  machine's missing guard is exactly the bug that bunches resends.
- **Bonfire is on the VPS, reachable only via SSH** — emits can fail when the VPS
  is down. The hot store (Layer A) is the source of truth for live behavior; a
  failed emit is queued/retried, never blocks the reminder. Continuity degrades
  gracefully to local-only if Bonfire is unreachable.

## Implementation status (2026-06-04)

Built on branch `claude/gifted-euler-bYhl7`. Bot typechecks clean; 171/171
`bot/src/zoe` tests pass (79 new across the modules below).

**New modules (`bot/src/zoe/`):**

| File | Layer / move | Tests |
|------|--------------|-------|
| `pii.ts` | PII scan + redaction (hygiene-rule Rule 3, gates Bonfire emit) | `__tests__/pii.test.ts` |
| `threads.ts` | Layer A hot open-threads store + pure escalation logic | `__tests__/threads.test.ts` |
| `thread-memory.ts` | Layer B Bonfire emit (secret+PII gated, file-backed retry queue) | `__tests__/thread-memory.test.ts` |
| `proactive.ts` | Move 1 reasoning-tick gate (threshold-only + 3 guards) | `__tests__/proactive.test.ts` |
| `thread-ops.ts` | apply concierge `thread_ops` + natural-language due-date resolver | `__tests__/thread-ops.test.ts` |
| `posts/drafts-queue.ts` | Decision 2 silent backlog + once-a-day notice sentinel | — |

**Wiring:** `thread_ops` added to the concierge JSON-op schema (LLM-emitted like
`task_ops`); `index.ts` applies them + `untrack th-…` undo + `ackPush` on reply;
`scheduler.ts` runs the reasoning tick at `:30` hourly + flushes the emit queue;
`reflect.ts` leads with one contextual question about the top open thread;
`memory.ts` renders an `<open_threads>` block + teaches the `OPEN THREADS` op
format; posts scheduler generates silently + sends one `14:00 UTC` notice;
`/drafts` pulls through the unchanged POST/REGEN/SKIP flow; `pending.ts`
`MAX_RESENDS=0`.

**Deviations from the design above (decided while building):**

1. **Bonfire emit reuses `recall.ts` `remember()`** (direct HTTPS to the
   Bonfires API with `BONFIRE_API_KEY`, the path already proven in the codebase
   2026-05-30) — NOT the SSH `/bonfire` skill the doc assumed. Cleaner, no new
   surface. The skill's SSH path stays for human-driven posts.
2. **The reasoning tick is additive + silent-by-default**, not yet a replacement
   for the hourly nudge. It only produces candidates from open commitment
   threads, so until threads exist it adds zero messages. Full cron→gate
   replacement (folding the nudge in) is deferred to a follow-up once the gate
   has run live.
3. **Commitment extraction is an LLM op (`thread_ops`)**, not a heuristic — it
   rides the existing concierge op-emission path, with `untrack` as the review/
   undo. Calendar + went-quiet triggers are stubbed via `proactive.ts`'s
   `extraCandidates` hook but not yet fed (thread + commitment triggers shipped
   first, matching Decision 3's priority order).

**Operational follow-up required before it's live:** the deployed
`~/.zao/zoe/persona.md` on the VPS must get the new `OPEN THREADS` op block
appended (PERSONA_DEFAULT only seeds fresh installs) — otherwise the LLM won't
emit `thread_ops` and no threads get opened.

## Sources
Horvitz CHI'99 (Mixed-Initiative UIs / bounded deferral); Inner Thoughts CHI'25
(arXiv 2501.00383); Background Agents & the Notification Budget (tianpan.co,
2026-05); Reflective Memory Management (arXiv 2503.08026); TiMem (arXiv
2601.02845); Static vs Adaptive Proactive Agents (arXiv 2405.07528); Feedback by
Design (arXiv 2602.01405); Lindy/Dex EA roundups. Codebase audit: `bot/src/zoe/`
{scheduler, posts/*, brief, reflect, nudges, concierge, reflexion, index}.ts.
