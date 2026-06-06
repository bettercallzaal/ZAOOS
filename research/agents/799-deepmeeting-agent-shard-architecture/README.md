---
topic: agents
type: design-proposal
status: decided-architecture-2026-06-06 (read/write split chosen; reader-hardening = Bonfires dashboard config; writer bot = our code, needs Zaal greenlight on name+token before build — no-new-bots gate)
last-validated: 2026-06-06
related-docs: "601, 665, 669, 673, 734, 798"
original-query: "spec the DeepMeeting agent properly"
tier: STANDARD (proposal synthesizing live transcript + CLAUDE.md governance + bonfire architecture)
---

# 799 - DeepMeeting agent / shard architecture

> **This doc exists to satisfy a hard rule.** CLAUDE.md → Primary Surfaces:
> *"no new bots without doc. Before adding a new Telegram bot, agent process, or
> autonomous loop, write a numbered research doc + get explicit Zaal approval."*
> The 2026-06-06 transcript has Zaal mid-flight on a dedicated DeepMeeting agent
> (`@treemojo_bonfire` / `@deepmeeting_bot`, GCvlcnti as admin). Before that bot
> exists, this is the required gate. **No bot should be created until Zaal
> explicitly greenlights an option below.**

## What's being proposed (from the transcript)

A dedicated DeepMeeting agent, separate from the main `@zabal_bonfire_bot`:

- **Scope:** the TreeUnix / "gap filling axioma" / Kanzi work with GCvlcnti — a
  distinct vocabulary and protocol set that Zaal flagged as a *bad-data risk* when
  it bled into the main graph (the "TreeUnix Protocol" fabrication, doc 798
  Finding 1).
- **Admin:** GCvlcnti designated as ZABAL Bonfire admin for that shard.
- **Architecture (as discussed):** hybrid dispatcher — `@zabal_bonfire_bot` as
  `/root` orchestrator routing tasks to specialized shards, which sync results
  back atomically to one unified graph.
- **Suggested handles:** `@treemojo_bonfire` or `@deepmeeting_bot`.
- **Open item the bot is still waiting on:** confirmation to update the
  DeepMeeting agent's draft prompt to reflect its subordinate shard role.

## The tension this proposal has to resolve

CLAUDE.md just spent doc 601 *collapsing* the agent fleet from 12+ surfaces to 5,
and the decommission list is explicit:

> "10-bot branded fleet (Magnetiq/Research/WaveWarZ/POIDH as own bots) — folds
> into ZOE memory blocks ... New brand voices = persona block ... NOT a new bot."

A new `@deepmeeting_bot` runs directly against that grain. **But** DeepMeeting is
arguably not "a new brand voice" — it's a different *surface* (different group,
different admin/human, different protocol scope, an explicit data-isolation
requirement). The whole point in the transcript is to *keep TreeUnix vocabulary
OUT of the main graph until it's validated.* That's a real architectural need.
The question is whether a separate Telegram **bot** is the right unit to meet it,
or whether a namespace/shard *inside the existing bot* meets it more cheaply.

## DECISION (Zaal, 2026-06-06): read/write split, not topic-sharding

Zaal reframed the whole thing, and it's a better cut than the A/B/C options
below. **The split axis is capability, not topic:**

> "Harden the zabal bonfire bot to be just knowledge retrieval, and if it needs
> to build / add a node it uses a different bot starting with deep thinking."

- **Reader = `@zabal_bonfire`** → retrieval ONLY. No write capability. This is
  the bot everyone in the group talks to.
- **Writer = a new deep-thinking bot** → the SOLE thing that can add/supersede
  nodes. Leads with a reasoning pass (provenance tier, dedup, contradiction
  check, secret+PII scan) and only commits on approval.

**Why this beats topic-sharding (and dissolves the Option B sync problem):**

1. Fixes doc 798 Finding 1 at the root. Fabricated facts got stamped 1.0
   because the *same* agent that retrieves also improvises writes. Remove the
   write tool from the reader and it **structurally cannot** corrupt the graph.
2. **Single writer.** My Option-B worry was "two processes writing one graph
   need atomic sync." A read/write split has exactly one writer — no contention,
   no sync. The shared graph is safe by construction.
3. Prompt-injection resistance: anyone can message the reader; with no write
   tool, "ingest this: …" from a group member can't land. Writes funnel through
   one deliberate, gated path.

### Critical implementation fact: the reader is NOT our code

Per doc 673d, `@zabal_bonfire` is an LLM agent **hosted inside Bonfires.ai**
(app.bonfires.ai dashboard, ERC-8004 #32009), with its intake+recall behavior
defined by a system prompt + 15 personality traits **on Josh's platform.** So:

- **Hardening the reader = a Bonfires-dashboard config change**, not a repo edit.
  Strip the write half of its system prompt (the "say 'ingest' to add a fact"
  behavior, the "Approve all?" manifest-commit flow). Draft below.
- **The writer = our code.** Writes go through `POST /knowledge_graph/episode/
  create` — exactly what `scripts/bonfire-ingest/` already does, now with the
  PII gate (doc 798) + provenance tiers. The writer is a Telegram bot (own
  token) wrapping that pipeline with a deliberate reasoning step.

### Reader-hardening prompt edits (for the Bonfires dashboard)

Paste-ready direction for the `@zabal_bonfire` system prompt:

```
ROLE CHANGE — RETRIEVAL ONLY.
You answer questions from the knowledge graph and cite sources. You do NOT
write to the graph. You have no ingest, no node creation, no edge creation,
no supersede, no "Approve all?" flow. Remove those capabilities entirely.

When a user asks you to add / ingest / correct / build a fact, do NOT propose
a manifest. Instead reply: "Writes go through the deep-thinking writer —
tag @<writer_handle> to add or correct a fact." Then, if useful, summarize
what they'd want to capture so they can hand it to the writer.

When you answer, lead with the provenance tier of your top sources
(canonical / reported / inferred) and prefer an explicit "not in the graph"
over improvising an answer from adjacent nodes. (doc 798 Findings 1 + 4)
```

### Writer bot scope (our code — needs Zaal greenlight to build)

A new Telegram bot, own token, single writer. On a write request it:

1. **Thinks first** (the "deep thinking"): classifies the fact, decides the
   provenance tier it can honestly vouch for, checks the graph for an existing
   / contradicting node, runs `secret_scan` + `pii_scan`.
2. **Proposes a structured manifest** (the shape `@zabal_bonfire` uses today)
   with the tier attached, and asks for approval.
3. **Commits via the ingest pipeline** on approval — the only write path.

This is the Hermes coder+critic pattern applied to graph writes. It still trips
the no-new-bots rule, but with airtight justification: least-privilege
capability isolation. **Build needs Zaal's explicit go on name + token.**

---

## (superseded) Three topic-sharding options

### Option A — Namespace/shard inside `@zabal_bonfire_bot` (no new bot) ✅ recommended
One bot, one token, one process. DeepMeeting is a **partition/context tag** on the
existing pipeline: episodes from the DeepMeeting group get `source_description:
deepmeeting:<topic>` and a `scope:deepmeeting` marker, and recall can be filtered
to include/exclude that scope. GCvlcnti gets admin on the *group*, not a new bot.

- **Pros:** zero new infra, no token/process to manage, satisfies the
  data-isolation need (scope filter), aligns with the doc-601 collapse, nothing
  new to decommission later. The "keep TreeUnix out of the main graph" goal is met
  by *scope*, not by a separate bot.
- **Cons:** isolation is logical, not physical — a bug in the scope filter could
  leak DeepMeeting vocab into general recall (the exact failure that started this).
  Mitigation: make `scope` a hard filter on both ingest labeling and recall.

### Option B — Separate bot, shared graph (the transcript's "hybrid dispatcher")
A real `@deepmeeting_bot` process, its own token, writing to the *same* Bonfire
graph with a shard tag; `@zabal_bonfire_bot` orchestrates.

- **Pros:** physical process isolation; GCvlcnti can fully own his surface;
  matches the mental model in the transcript.
- **Cons:** a new bot + token + systemd unit + monitoring; **directly trips the
  no-new-bots collapse**; two processes writing one graph need careful atomic
  sync (the transcript hand-waved "sync back atomically" — that's non-trivial).
  Requires explicit Zaal sign-off against his own consolidation rule.

### Option C — Separate bot, separate graph (true shard)
`@deepmeeting_bot` writes to its *own* Bonfire (a separate `BONFIRE_ID`), promoted
into the main graph only on explicit approval.

- **Pros:** strongest isolation — TreeUnix data physically cannot contaminate the
  main graph until promoted; best fit for "facts at a time / situational
  prototypes" (DvlsMojo's own framing of the v0.01–v0.05 work).
- **Cons:** most infra; a promotion pipeline to build; two graphs to keep coherent.

## Recommendation (superseded by the read/write split above)

Original recommendation was Option A (scope inside the existing bot). The
read/write split supersedes the topic-sharding framing entirely: it isolates by
*capability* (who can write) rather than by *topic* (what's written), which is
the stronger guarantee. Topic isolation (keeping TreeUnix vocab quarantined) can
still ride on top — as a `provenance: inferred` tier + a scope tag on the
writer's path — without needing a separate bot per topic.

## Hard constraints (regardless of option)

1. **One token per agent — never shared.** The transcript raised "same Telegram
   bot token for manus + bonfires agent." Zaal's "prob not best" is correct: two
   pollers on one token fight over `getUpdates` and silently drop each other's
   updates. If any new bot is created, it gets its own token from `@BotFather`.
2. **Scope isolation is the requirement, not the bot.** Whatever option, the
   testable goal is: TreeUnix/"gap filling axioma" vocabulary must not surface in
   general `@zabal_bonfire_bot` recall unless explicitly promoted.
3. **GCvlcnti admin scope must be bounded.** Admin on the DeepMeeting
   surface/group ≠ owner of the main graph. The transcript shows confusion about
   view-vs-edit/config permissions — define this explicitly before granting.
4. **Correct vocabulary at the source.** Per doc 798, seed the DeepMeeting scope
   with "gap filling axioma" as canonical and the bot-minted "TreeUnix Protocol"
   as a downgraded/superseded alias, so the shard doesn't re-import the error.

## If Zaal greenlights a new bot (B or C): prompt scope checklist

The draft system prompt the bot is waiting to finalize should cover:

- Core protocol definitions in GCvlcnti's *actual* terms (not bot-coined ones).
- Explicit scope exclusions (e.g. Stigmergy excluded from this shard, per transcript).
- Subordinate-shard role: how it reports up to `/root`, atomic sync semantics.
- Data-isolation guarantee: what it may and may not write to the main graph.
- The `pii_scan` + `secret_scan` gates (doc 798) apply to its ingest too.
- Governance: who approves promotion of shard facts into the main graph.

## Decision needed from Zaal

Architecture is decided (read/write split). Remaining gates before build:

- [x] **Split axis** — capability (read vs write), not topic. ✅ Zaal 2026-06-06
- [ ] **Harden the reader** — apply the dashboard prompt edits above to
      `@zabal_bonfire` (Zaal/Josh, on the Bonfires platform). Out of repo scope.
- [ ] **Writer bot greenlight** — name + a *separate* `@BotFather` token. Trips
      no-new-bots; justified by least-privilege. Where does it live —
      `bot/src/` as its own surface, or folded under ZOE's process?
- [ ] **GCvlcnti scope** — admin on the DeepMeeting group / writer surface, not
      the main graph. Define view-vs-edit explicitly (transcript confusion).
- [ ] **Vocabulary seed** — load "gap filling axioma" as canonical, the
      bot-minted "TreeUnix Protocol" as a superseded alias (doc 798 Finding 1).

No writer code proceeds until the greenlight — that's the rule this doc honors.

## Source

- Live `@zabal_bonfire_bot` / DeepMeeting transcript, 2026-06-06 (Zaal-supplied).
- CLAUDE.md → Primary Surfaces (the no-new-bots rule + doc-601 collapse).
- Doc 798 (graph quality audit — the bad-data risk that motivates isolation).
- Docs 601 (agent-stack cleanup), 665/669/673 (Bonfire architecture), 734 (BonfireMemory adapter).
