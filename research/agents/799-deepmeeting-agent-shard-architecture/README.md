---
topic: agents
type: design-proposal
status: proposal-2026-06-06 (REQUIRED gate per CLAUDE.md "no new bots without doc" — needs explicit Zaal greenlight before any bot is created)
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

## Three options

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

## Recommendation

**Start with Option A.** It meets the actual stated need — *keep unvalidated
TreeUnix vocabulary out of the trusted graph* — with a scope filter, zero new
bots, and full alignment with the doc-601 collapse. If logical isolation proves
insufficient in practice (vocab leaks despite the scope filter, or GCvlcnti needs
genuine independent ownership), graduate to **Option C** (separate graph) rather
than B — physical data isolation is the thing worth paying infra for; a second
bot sharing one graph (B) is the worst of both (new infra *and* contamination
risk).

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

- [ ] **Option A** (scope inside existing bot — recommended), **B**, or **C**?
- [ ] If B/C: confirm against the no-new-bots collapse, and provision a *separate* token.
- [ ] GCvlcnti admin scope — group-level only, or graph-level?
- [ ] Greenlight to draft the actual system prompt (currently the bot's open item)?

No implementation proceeds until these are answered — that's the rule this doc exists to honor.

## Source

- Live `@zabal_bonfire_bot` / DeepMeeting transcript, 2026-06-06 (Zaal-supplied).
- CLAUDE.md → Primary Surfaces (the no-new-bots rule + doc-601 collapse).
- Doc 798 (graph quality audit — the bad-data risk that motivates isolation).
- Docs 601 (agent-stack cleanup), 665/669/673 (Bonfire architecture), 734 (BonfireMemory adapter).
