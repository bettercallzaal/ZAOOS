---
topic: agents
type: design-proposal
status: research-complete
last-validated: 2026-07-10
related-docs: "796, 1015, 755, 601"
original-query: "Research the /handoff skill's long-term design - specifically, now that ZOE-via-Bonfire is the default handoff receiver, does ZOE actually surface a pushed handoff bundle proactively, or does it silently sit in the graph until someone asks?"
tier: STANDARD
---

# 1019 - /handoff to ZOE-via-Bonfire: the reasoning-tick gate never sees a pushed bundle

> **Problem:** `/handoff` skill (`~/.claude/skills/handoff/SKILL.md`) now defaults its receiver to "ZOE / cowork bot, via Bonfire" (edited 2026-07-10, same session that produced this doc). Phase 6 pushes 1 summary episode + 1 episode per Section-A task via `bash ~/.claude/skills/meeting/scripts/bonfire-episode.sh`. That script calls the same Bonfire write path ZOE's own `thread-memory.ts` uses. But writing to Bonfire is not the same as ZOE noticing. This doc traces exactly what happens to a handoff episode after it lands in the graph, using the as-built ZOE codebase (not the doc 796 design intent) as ground truth.

## Answer, up front

A handoff bundle pushed to Bonfire today has **zero proactive surfacing path**. It sits in the graph until:
1. Zaal has a substantive private DM turn with ZOE and the concierge's `recall()` happens to retrieve it (semantic match only, no guarantee), or
2. Zaal explicitly asks ZOE about it.

Doc 796's Move 1 (reasoning-tick gate, `bot/src/zoe/proactive.ts`) is the only mechanism that could proactively surface it - but per 796's own "Deviations from the design above" section (line 248-252 of that doc), **the reasoning tick only produces candidates from `threads.ts` open-thread rows**. A raw Bonfire episode written via `remember()` does not create a `threads.ts` row. So the gate has nothing to gate on. This is not a bug in 796/1015's design - both docs scope to *DM-originated* commitments (Zaal says "I'll ship X" in conversation, concierge emits a `thread_ops` LLM op). A `/handoff` push from an entirely different session, with no DM turn involved, was never in scope for either doc.

## Codebase trace (2026-07-10)

Confirmed by direct grep/read, not inference:

- `bot/src/zoe/recall.ts` `remember()` - direct HTTPS POST to the Bonfires API using `BONFIRE_API_KEY`. This is what `~/.claude/skills/meeting/scripts/bonfire-episode.sh` calls into (per doc 796's "Deviations" item 1, confirmed live 2026-06-04, not the SSH `/bonfire` skill path the original design assumed).
- `recall()` (same file) is the read side - vector search via `delveBonfire()`, called only from three sites: substantive private-DM-turn handling in `index.ts`, newsletter drafting, and Farcaster cast reasoning. No scheduled poll.
- `bot/src/zoe/bonfire-queue.ts` + the scheduler's emit-queue flush cron - outbound retry only (for episodes that failed to POST because the VPS/Bonfire was unreachable). Not an inbound surfacing mechanism. Confirmed by grep across `bot/src/zoe/scheduler.ts`.
- `bot/src/zoe/threads.ts` (Layer A, per doc 796) - the *only* structure the reasoning tick reads. Rows are created exclusively via `thread_ops`, an LLM-emitted JSON op inside a concierge conversational turn (`index.ts` applies `thread_ops` after a DM exchange). There is no code path from "a raw Bonfire episode arrived" to "a `threads.ts` row was created."
- `bot/src/zoe/proactive.ts` (Move 1 reasoning tick) - reads `threads.ts` + calendar + inactivity signals. Confirmed zero reference to Bonfire episode ingestion in the candidate-gathering step.

So the full chain for a `/handoff` push today: **write episode -> sits in Bonfire vector index -> nothing reads it until a DM turn's `recall()` call happens to surface it via semantic similarity** (not guaranteed - `recall()` is a top-k similarity query scoped to the current conversation's topic, and per doc 1015 Finding 7, ZOE's retrieval is embeddings-only with no entity-aware boost, so a handoff bundle about "whitepaper release" won't surface unless the DM turn is already semantically close to that topic).

## Why this matters concretely

The handoff bundle this session wrote (`~/.zao/handoff/session-2026-07-10-zao-whitepapers/README.md`) pushed 6 Bonfire episodes carrying 5 real open tasks, including two with hard deadlines: watch cowork tracker tasks #787/#788 (due 2026-07-13) and get Zaal's sign-off on the ZABAL Token draft before the same date. Under the current architecture, ZOE will not proactively remind anyone about these - not the morning brief (doc 796 Decision 1: brief only floors "too quiet," it doesn't scan Bonfire for un-surfaced episodes), not the reasoning tick (no `threads.ts` row exists for them), not the reflection (`reflect.ts` picks from `threads.ts` too). The task only becomes "alive" to ZOE if a DM turn's `recall()` happens to retrieve it.

## Key Decisions (proposed, not yet built)

### 1. A handoff push must also create Layer-A thread rows, not just Layer-B episodes.
Reuse the exact schema doc 796 already shipped and tested (171/171 passing as of 2026-06-04): `thread_ops`. The handoff skill's Phase 6 should, in addition to the existing `bonfire-episode.sh` call, write one `thread_ops`-shaped `open` op per Section-A task directly into `~/.zao/zoe/threads.json` (or via whatever ingress ZOE exposes for external writers - none exists yet, see Next Actions). This is the smallest change that makes the reasoning tick (Move 1, already built) see the handoff at all.

**Implication:** this is not a new proactive-surfacing mechanism - doc 796's gate already does exactly what's needed. The gap is purely that `/handoff`, an external writer, has no way to open a Layer-A thread. It only knows how to speak Bonfire (Layer B).

### 2. Don't invent a second gate. Route through the existing one.
It would be tempting to add a "check Bonfire for unprocessed handoff episodes" cron directly to `scheduler.ts`. Reject this - it duplicates the threshold/tier/self-throttle machinery doc 1015 just finished designing (single-best-only, silence-rate observability, unacked self-throttle). A second parallel gate means two threshold knobs to tune and two silence-rate logs to watch. One ingress into `threads.ts`, one gate (`proactive.ts`) downstream of it.

### 3. Due-dates carry through automatically once threads exist.
`threads.ts` already has `due_at` + escalation logic (doc 796 Move 3: nudge frequency rises near a due date, two snoozes flips to "reschedule, drop, or break it down"). If the handoff writer populates `due_at` for tasks that have one (e.g. "due 2026-07-13" for the tracker-task-watch item), the existing escalation state machine handles the rest for free. No new code needed there - only the ingress.

## Findings

### Finding 1: There is no external-writer ingress into `threads.ts` today.
**Evidence:** `thread_ops` are applied in exactly one place - `index.ts`, immediately after a concierge DM turn produces them as an LLM-emitted op. No file-watch, no webhook, no CLI entrypoint. Confirmed by grep for `applyThreadOps` / `thread_ops` across `bot/src/zoe/` - single call site.
**Implication:** building Decision 1 requires either (a) a small new function in `threads.ts` that any local script can call (`openThreadFromExternal(summary, due_at, source_tag)`), guarded by the same `claimFire` O_EXCL atomic-write pattern the rest of the file uses, or (b) routing external opens through a lightweight local CLI (`zoe-thread open ...`) that shells into the same function. Option (a) is less surface area.

### Finding 2: The PII/secret-scan gate already exists twice, independently, and should NOT be re-implemented a third time.
**Evidence:** `/handoff` Phase 5 has its own secret+PII regex scan (from `.claude/rules/secret-hygiene.md` + `pii-hygiene.md`) before any Bonfire write. `bot/src/zoe/pii.ts` (doc 796, shipped) gates every Layer-B emit independently. Both scan the same two rule files.
**Implication:** if a Layer-A thread-open call is added per Decision 1, it should reuse `bot/src/zoe/pii.ts`'s scan function directly (it's a real module ZOE already ships) rather than have `/handoff`'s bash-side regex scan do double duty for a payload that's about to enter ZOE's own store. `/handoff`'s existing scan stays as the gate for the Bonfire (Layer B) write, which is a separate call.

### Finding 3: Doc 1015's entity-aware retrieval (Finding 7, not yet built) would only partially close this gap even if shipped.
**Evidence:** doc 1015 proposes boosting `recall()` relevance for flagged people/projects. Even with that shipped, `recall()` is still pull-only - it fires on a DM turn, not proactively. Entity-aware boost would make a handoff *easier to find once someone asks*, not surfaced *unprompted*.
**Implication:** don't treat doc 1015's retrieval work as a substitute for Decision 1. They solve different problems (findability vs. proactivity) and both may eventually be worth building, but only Decision 1 closes the "ZOE never mentions it unless asked" gap this doc is about.

### Finding 4: The `/handoff` skill's own receiver-instructions text already assumes proactive absorption that doesn't happen.
**Evidence:** the bundle template (`SKILL.md`, "5-section bundle") tells the receiver "Create task entries from section A in the cowork tracker... if they are not already tracked" and "message back: 'Ingested handoff \<slug\>. \<N\> tasks queued. Ready.'" This instruction text is written as if a receiving agent reads it immediately, but per this doc's trace, nothing triggers ZOE to read it at all absent a DM turn.
**Implication:** either (a) ship Decision 1 so the instruction text becomes true, or (b) until then, the handoff skill's Phase 8 report should tell the *human* sender explicitly: "ZOE will not proactively act on this until you DM her about it or Decision-1 ingress ships" - so Zaal doesn't assume it's been absorbed just because the push succeeded. Given this session already produced a handoff bundle under the old (false) assumption, (b) is the immediate, zero-build fix.

## Also See
- [Doc 796 - ZOE: broadcast bot -> conversational, well-timed assistant](../796-zoe-conversational-proactive-redesign/) - the reasoning-tick gate, threads.ts, and Bonfire-as-backbone architecture this doc builds on. Read this first; this doc is a scoped extension, not a replacement.
- [Doc 1015 - Proactive Personal-Assistant / AI Chief-of-Staff Surfacing Patterns](../1015-proactive-assistant-surfacing-patterns/) - threshold/tier taxonomy and entity-aware retrieval; relevant to Finding 3.
- [Doc 755 - handoff skill design](../../dev-workflows/755-handoff-skill-design/) - original `/handoff` spec; its Open Question #6 ("how does the receiver accept the bundle? v1 ships paste-into-chat only") is exactly what this doc answers for the ZOE-as-receiver case: it does not, today, without a DM turn.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Update `/handoff` SKILL.md Phase 8 report to state explicitly that ZOE will not proactively act on a pushed bundle until a DM turn or Decision-1 ingress ships (Finding 4b, zero-build interim fix) | @Zaal | PR (zaopapers-adjacent, skill file lives at `~/.claude/skills/handoff/SKILL.md`) | 2026-07-13 |
| Build `openThreadFromExternal()` in `bot/src/zoe/threads.ts` gated by `pii.ts` + `claimFire` (Decision 1 + Finding 1) | @Zaal | PR (ZAOOS `bot/src/zoe/`) | 2026-07-20 |
| Wire `/handoff` Phase 6 to call the new ingress for each Section-A task with a `due_at`, alongside the existing Bonfire episode push | @Zaal | PR (skill file + bot repo, paired) | 2026-07-20 |
| Re-test with a real handoff (e.g. re-push this session's own `session-2026-07-10-zao-whitepapers` bundle once ingress ships) to confirm the reasoning tick actually nudges about tracker tasks #787/#788 before their 2026-07-13 due date | @Zaal | Manual verification | 2026-07-20 |

## Sources
- `bot/src/zoe/recall.ts`, `bonfire-queue.ts`, `scheduler.ts`, `threads.ts`, `proactive.ts`, `pii.ts` (ZAOOS repo, codebase read 2026-07-10) - FULL, direct file reads.
- Doc 796 - `research/agents/796-zoe-conversational-proactive-redesign/README.md` - FULL, read in full 2026-07-10.
- Doc 1015 - `research/agents/1015-proactive-assistant-surfacing-patterns/README.md` - FULL, read in full 2026-07-10.
- `~/.claude/skills/handoff/SKILL.md` - FULL, read in full (edited same session).
- `~/.zao/handoff/session-2026-07-10-zao-whitepapers/README.md` - FULL, the actual bundle this doc uses as its concrete worked example.
