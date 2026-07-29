---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-07-29
related-docs: 755, 2113, 2103
original-query: "/zao-research the r/ClaudeAI thread 'When I have to compact a 2 day long 900k context session with Claude' - long-session context management, compaction, warm cache, the 'actualise' pattern."
tier: STANDARD
---

# 2118 - Managing long Claude Code sessions - and why ZAO already handles it

> **Goal:** Capture the community techniques for surviving 2-day / 900k-context Claude Code sessions, and show that ZAO's existing skills already cover them - with this very session as the proof.

## The problem (and why it's timely)

The thread's title - *"When I have to compact a 2-day-long 900k-context session with Claude"* - describes **exactly the session this doc was written in**: a multi-day, 900k+-context ZAO session that has been compacted several times. The risk in such sessions is **state loss at compaction**: anything that lives only in the context window can vanish when the window is summarized.

(The thread body was `[removed]`; the techniques below come from its comment thread + ZAO practice. Source marked PARTIAL.)

## The community techniques (from the comments)

1. **Compact after planning, not before.** "After the plan is done, you can safely compact - the plan should contain everything the agent needs to start implementing." The durable artifact (the plan) carries the state across the compaction boundary.
2. **Keep state in MD / memory files, not just context.** "MD files and a good harness is all you need - point at a file, say what you want, it does it."
3. **An "actualise" command.** One commenter: *"I added a command - when I write 'actualise' it updates all memory/MD files needed for what we did this session, and I'm good to go for a new session."* A single end-of-session sync of everything durable, run before compact/clear.
4. **Keep the cache warm.** The prompt cache stays warm within its TTL, so a long session's context stays cheap to resume (ZAO already knows this - feedback_end_loops_cache_aware).

## ZAO already does all of this (and more)

The research confirms ZAO's practice is **ahead** of the thread. The "actualise" pattern the commenter hand-rolled, ZAO has as first-class skills:

| Thread technique | ZAO already has |
|---|---|
| "actualise" - sync all memory/MD before compact | **`/handoff`** - compresses the session into a portable, zero-context-loss bundle, pushes to Bonfire, drops into ZOE's `/cockpit` inbox (doc 755) |
| Keep state in MD/memory files | the **memory system** (feedback/project/user/reference files + MEMORY.md index) + **numbered research docs** + the **cowork board** |
| End-of-session capture | **`/reflect`** (end-of-day journal) + `/learned` |
| Resume cleanly next session | **`/morning`**, **`/pickup`**, **`/catchup`** |
| Compact after planning | plan mode + the research docs ARE the plans |

## This session is the proof

This session ran 2+ days at 900k+ context with multiple compactions and **lost no state** - not because the context survived, but because everything durable was continuously written OUT of context as it happened: ~15 research docs, several feedback memories (board-first, ZOE-auto-relays, never-skip-Superstonk), the morning brief, board updates, and new tools (zao-relay, zao-watch). Compaction summarized the chat; the *work* was already on disk. That is the technique working at scale.

## The one micro-gap (honest)

ZAO's "actualise" is **spread across** `/handoff` + `/reflect` + inline memory writes, not a single `actualise` keyword. In practice `/handoff` is the closest single command and already does most of it. The only nudge: **run `/handoff` (or `/reflect`) before any big compact or `/clear`**, which is already the design - just make it a habit. A thin `actualise` alias that fires handoff + reflect + a memory-sync in one word would be a nice convenience, not a need.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Habit: run `/handoff` before any deliberate compact/clear on a long session (already the design) | @Zaal (ZOE) | Behavior | ongoing |
| (Optional) a thin `/actualise` alias = handoff + reflect + memory-sync in one keyword | @Zaal | PR | wontfix (convenience) |

## Also See

- [Doc 755](../755-handoff-skill-design/) - the /handoff skill design (ZAO's "actualise")
- [Doc 2113](../2113-skills-tools-audit-overnight-loop/) - the skill surface (reflect/handoff/morning/pickup are in it)
- [Doc 2103](../../agents/2103-grounding-beats-guessing/) - grounding (verify against files - here: ZAO already had the skills)

## Sources

- [r/ClaudeAI - "When I have to compact a 2 day long 900k context session with Claude" (VertipaqStar)](https://www.reddit.com/comments/1v9bq96/) [PARTIAL - body was [removed]; techniques drawn from the comment thread (compact-after-plan, MD/memory state, the "actualise" command, warm cache)]
- First-party: ZAO `/handoff` + `/reflect` + memory system + this 900k/2-day session as the live case study. [FULL]
