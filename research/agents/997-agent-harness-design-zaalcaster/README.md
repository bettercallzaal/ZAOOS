---
topic: agents
type: guide
status: research-complete
last-validated: 2026-07-09
superseded-by:
related-docs: 928, 994, 969, 987, 601, 759
original-query: "What makes a good agent harness (the loop/tooling/context scaffolding around an LLM), how teams have built custom harnesses, and what open-source agent harnesses exist - then a design section on how we could build a custom harness for zaalcaster (Zaal's personal Farcaster daily-driver client + $ZAAL boost-queue). DEEP tier."
tier: DEEP
---

# 997 - Agent Harness Design (and a Harness for zaalcaster)

> **Goal:** What makes a good agent harness, how teams built custom ones, what OSS exists to fork - then a concrete design for zaalcaster's harness (the loop that triages the inbox + $zc boost-queue, drafts in Zaal's voice, and gates every post behind Zaal).

## Key Decisions (recommendations first)

| # | Decision | Recommendation | Why |
|---|----------|----------------|-----|
| 1 | Build vs adopt a framework for zaalcaster | **Build a thin custom harness**, don't adopt elizaOS/LangGraph/CrewAI | Every case study (Claude Code, Ralph, Cursor, Devin) converged on custom because you optimize for ONE constraint. zaalcaster's constraint is "single-user, own-the-code, Neynar-native, never auto-post." A framework adds magic you'd fight. |
| 2 | The loop shape | **One agent, one loop** - gather -> rank -> draft -> human-approve -> post -> mark-delivered | Single-agent-in-a-loop is the universal starting point; add parallelism only when a step is a proven bottleneck. zaalcaster has no such bottleneck. |
| 3 | Where state lives | **Supabase + files, NOT conversation history** | "Keep state in the filesystem, not the chat" is the #1 recurring ADR. The boost queue, delivered-marks, and voice ledger are rows/files, re-read each tick. |
| 4 | The verification gate | **Zaal's approval IS the ground truth** - never auto-post | For a coding agent you verify with tests; for a social agent the environment-check is a human. This is also the circuit breaker (PR-only logic applied to casts). Matches project rules. |
| 5 | Tool surface | **~7 tight tools**, not a big toolbox | Tool design is the highest-ROI investment (SWE-bench teams spent more time on tools than the prompt); accuracy degrades as the toolset grows. zaalcaster needs ~7: readInbox, readQueue, rankQueue, readBalance, draftInVoice, postCast, markDelivered. |
| 6 | Tech base | **Anthropic SDK (tool-use) or Vercel AI SDK, inside the existing zaalcaster app** | Both are TS-native and already fit the ZAO stack (Next.js 16 + Neynar + Supabase + Vercel). Vercel AI SDK if you want tool-calling batteries-included; raw Anthropic SDK if you want ~50-300 lines you fully own. SKIP elizaOS (Farcaster-native but a whole OS - overkill for one user). |
| 7 | Hard caps | **Daily post cap + one-instance lock + no autospend** | Every autonomous path needs a ceiling. zaalcaster posts are Zaal-gated so spend risk is nil, but a daily cap + single-poller lock prevent runaway/split-brain (rule 9, doc 928). |
| 8 | Context strategy | **Just-in-time, fresh per tick** - don't accumulate | zaalcaster ticks are short and independent. Load only the inbox slice + queue for THIS tick (Ralph's fresh-context pattern), not a growing transcript. |

## Findings

### PART 1 - What makes a good agent harness

A **harness** is the scaffolding wrapped around the model: context assembly, the tool interface, the control loop, memory/state, verification, safety/caps, and observability. The model is the engine; the harness is the car. The dominant, well-sourced principles:

1. **Start simple; add complexity only when a simpler version measurably underperforms.** Anthropic's *Building Effective Agents* (Dec 2024) is explicit: begin with optimized single LLM calls, escalate to a loop, escalate to multi-agent only on evidence. This is the single most repeated rule across every source.

2. **Tools are the highest-leverage part of the harness (the "agent-computer interface"/ACI).** SWE-bench teams reported spending more time optimizing tools than the prompt. A good tool has a tight schema, one responsibility, and returns errors as usable feedback (the error message is a prompt to the next turn). Tool accuracy degrades as the toolset grows - keep it small; consider dynamic/just-in-time tool exposure if it ever gets large.

3. **Context engineering is the other half.** Long-running agents fail from context rot/collapse, so strong harnesses manage the window deliberately: compaction (Claude Code's continuous compaction) or periodic resets (Ralph's fresh context per iteration), retrieval/just-in-time loading over dumping everything, sub-agents for isolation, and structured external note-taking (scratchpads/files) instead of holding all state in the transcript.

4. **Verification closes the loop - with the environment, not the model's opinion.** Coding harnesses verify with tests/typecheck/compilers; the strongest add a separate evaluator (evaluator-refiner beats pure self-refinement) and cap refinement rounds (diminishing returns after a handful). For non-code agents the "environment" that verifies can be a human gate.

5. **Safety = hard caps + graduated trust.** Iteration ceilings, token/cost budgets, retry limits, and a permission model. A recurring, well-supported point: binary allow/deny causes approval fatigue; graduated trust (auto-approve the safe, gate the risky) is better than prompting on everything.

6. **Failure modes a harness must design against:** ambiguous goals, infinite/oscillating loops, context corruption, tool errors swallowed silently, cost runaway, and hallucinated success (claiming done when it isn't). Each needs an explicit guard.

7. **Single vs multi-agent:** single agent in a loop is correct until a task genuinely needs specialization or independent verification; multi-agent buys context isolation at the cost of coordination overhead. Fan-out work (many similar items) is a pipeline, not a reason for a multi-agent org.

> Caveat on precise stats: several circulating figures (exact context-window "warning thresholds", "1.6% AI / 98.4% infrastructure", specific token-saving percentages) come from single secondary blogs and are directionally useful but not independently verified here - treated as illustrative, not load-bearing. The behavior-changing principles above are corroborated across Anthropic's own posts + multiple builders.

### PART 2 - How teams built custom harnesses (case studies)

The consensus by 2026: **custom beats framework** because a custom harness optimizes for one constraint (context efficiency, safety, latency, or determinism) instead of compromising across many. Concrete patterns:

- **Claude Code (Anthropic)** - one primary query loop, a compaction pipeline for context, subagents for isolation, hooks for policy, and a graduated permission model. Most of the value is operational scaffolding around a small decision core.
- **Ralph (Geoffrey Huntley)** - a deliberately minimal `while-true` loop with **fresh context each iteration** (avoids the "junk drawer" of an ever-growing transcript) and an outer objective-verification loop. Beats heavier orchestration through simplicity.
- **Cursor 2.0** - parallel agents isolated by git worktrees, a per-turn tool-call cap, and explicit Plan -> Execute -> Verify -> Iterate phases.
- **Cognition / Devin** - a documented "don't reach for multi-agent" stance; invest in context handoff and a single coherent actor.
- **Vercel's design loop** - agents routed through deterministic skill/lint gates so review is evidence-driven, not vibes.

The recurring ADRs across all of them: (1) one agent in a loop first; (2) state in the filesystem/git, not chat; (3) verify with the environment (tests/compilers/humans), not the model; (4) manage context via compaction or resets; (5) graduated trust over binary permissions. These map 1:1 onto ZAO's own doc 928 (agent-loop rules) and doc 994 (loop taxonomy).

### PART 3 - Open-source harnesses (inventory, mid-2026)

Star counts approximate, verified via GitHub during research (2026-07-09); licenses from repo LICENSE files.

| Name | License | Stars (approx) | Lang | One-line arch | Fit for zaalcaster |
|------|---------|----------------|------|---------------|--------------------|
| **Vercel AI SDK** | Apache-2.0 | ~25k | TS | tool-calling + streaming layer for JS/Next.js | **BEST base** - already our stack, minimal magic, host the loop in a route |
| **Claude Agent SDK (TS)** | MIT | ~2k | TS | official thin client + tool-use loop | **BEST for max ownership** - ~50-300 lines you control |
| **Mastra** | Apache-2.0 | ~26k | TS | modern TS agent framework (agents, workflows, memory) | Viable; cleaner than elizaOS for single-purpose, more than we need |
| **elizaOS** | MIT | ~18.7k | TS | full agent OS, "one inbox" across Farcaster/Discord/TG/X | Only OSS with native Farcaster - but a whole OS; overkill for one user |
| **OpenHands** (ex-OpenDevin) | MIT | ~80k | Python | coding-agent platform | Wrong stack + wrong domain (code automation) |
| **SWE-agent** | MIT | large | Python | ACI-focused code-fixing agent | Great ACI reference reading, wrong domain |
| **Aider** | Apache-2.0 | large | Python | terminal pair-programmer | Wrong domain |
| **gptme** | MIT | mid | Python | personal terminal agent | Wrong stack |
| **smolagents** (HF) | Apache-2.0 | mid | Python | minimal code-writing agents | Wrong stack |
| **LangGraph / LangChain** | MIT | ~37k / ~141k | Python | graph/agent orchestration | Python-first; graph model rigid for discovery-heavy tasks |
| **CrewAI** | MIT | ~55k | Python | multi-agent crews | Multi-agent overhead we don't need |
| **AutoGPT** | MIT (polyform parts) | ~185k | Python | autonomous-workflow platform | Over-engineered platform, not a library |
| **Agent Zero** | MIT | mid | Python | general personal agent framework | Wrong stack; ZAO already decommissioned an Agent Zero pivot (doc 601) |
| **Mem0** | Apache-2.0 | ~60k | Py/TS | memory layer (orthogonal) | Optional memory add-on if the voice ledger outgrows files |

**Synthesis for zaalcaster:** the wrong-stack Python heavyweights are out. The real choice is **Vercel AI SDK** (batteries-included tool calling, host the loop directly in the zaalcaster Next.js app) vs **raw Anthropic/Claude Agent SDK** (fewest dependencies, most control). elizaOS is the only Farcaster-native OSS but it's a full platform - fork it only if zaalcaster ever wants multi-platform (X + Discord + TG) in one inbox. For a single-user Farcaster client, don't.

### PART 4 - A harness for zaalcaster

**What zaalcaster is today** (doc 969, doc 987): a single-user, dependency-free vanilla-JS Farcaster client on Neynar v2, behind Vercel auth - tabs for Feed, Inbox (triage + draft), Channels, Compose - plus a CLI and a Chrome DJ extension. `lib.js` already wraps the Neynar calls (`getUnansweredInbound`, `searchCasts`, `getConversation`, `getUser`, `postCast`, reactions, feeds) and `voice.js` drafts in Zaal's voice grounded in ZAO context. The planned **$zaalcaster ($zc) boost-queue** (doc 987): hold >=1,000 $zc to enter a priority reply queue, 1 free bump/day (non-stackable), rank = `tokens_held x neynar_score x mutual-follow`, then Zaal is the final ranker; the reply is the "receipt."

**The harness = the attention router.** zaalcaster's agent is not a coder - it's a triage-and-draft loop over Zaal's attention. The design:

**The loop (one agent, runs on a tick or on-demand):**
1. **Gather** (just-in-time): pull unanswered inbound (`getUnansweredInbound`) + the boost-queue submissions (Supabase) + each submitter's on-chain $zc balance and Neynar score. Load only this tick's slice.
2. **Rank**: order the queue by `tokens_held x neynar_score x mutual` (the doc 987 formula), apply the anti-spam floor (min 1,000 $zc, 1 free bump/day non-stackable), dedup against already-delivered.
3. **Draft**: for the top-N, call `voice.js` to draft a reply in Zaal's voice, grounded in the thread (`getConversation`) + ZAO context (the ICM boxes / newsletter ledger).
4. **Human gate (verification)**: present ranked drafts to Zaal (in-app approve, or via ZOE Telegram). NOTHING posts without approval. This is both the ground-truth check and the circuit breaker.
5. **Post**: on approval, `postCast` (reply/quote) via Neynar.
6. **Mark delivered**: write the delivered-mark (Supabase) so the backer gets the shareable "backed via $zaalcaster" receipt and it never double-replies.

**Tools (~7, tight schemas):** `readInbox`, `readBoostQueue`, `readBalance` (on-chain $zc), `rankQueue`, `draftInVoice`, `postCast`, `markDelivered`. Each single-responsibility, each returns errors as feedback.

**State:** Supabase (queue, delivered-marks, rank snapshots) + the existing voice ledger files. Not in the model's context.

**Caps/safety:** daily post cap; one-instance poller lock (rule 9); no autospend (tips are wallet-signed by the backer, not the agent); proof-of-personhood optional on queue entry.

**Tech:** add a thin loop to the existing zaalcaster app using the **Vercel AI SDK** for tool-calling (or the Anthropic SDK for a hand-rolled ~150-line loop), reusing `lib.js` + `voice.js` as the tool bodies. No new framework, no elizaOS. This keeps zaalcaster's "own-the-code, dependency-light" character while making the boost-queue an actual agentic router instead of a manual list.

**Why this is the right harness:** it applies every corroborated principle - one loop, small tool surface, external state, environment (=human) verification, hard caps, just-in-time context - to zaalcaster's one real job: routing Zaal's scarce attention to the highest-standing asks, drafted in his voice, shipped only on his yes.

## Also See

- [Doc 928](../928-agent-loop-best-practices/) - the agent-loop operating rules (maps to the ADRs here)
- [Doc 994](../994-loop-engineering-taxonomy/) - loop taxonomy (execution/factory/oversight loops)
- [Doc 969](../../farcaster/969-zaalcaster-daily-client-backlog/) - zaalcaster daily-driver backlog (the client)
- [Doc 987](../../farcaster/987-zaalcaster-support-token-growth-playbook/) - $zaalcaster token + boost-queue mechanics
- [Doc 601](../601-agent-stack-cleanup-decision/) - why ZAO decommissioned Agent Zero / heavy stacks

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Decide harness base: Vercel AI SDK vs raw Anthropic SDK - write the choice into zaalcaster CLAUDE.md | @Zaal | Decision | 2026-07-11 |
| Spike the attention-router loop (gather -> rank -> draft -> approve -> post -> mark) as a PR to zaalcaster, human-gated, no autopost | @Zaal | PR | 2026-07-16 |
| Define the 7 tool schemas + Supabase tables (queue, delivered, rank_snapshots) in a zaalcaster HARNESS.md | @Zaal | PR | 2026-07-14 |
| Fold the "one loop / state-in-fs / verify-with-env / graduated-trust" ADRs into zaalcaster's rules so its agent inherits them | @Zaal | PR | 2026-07-14 |

## Sources

Internal (ZAO research library, read FULL): docs 928, 994, 969, 987, 601.

Web / subagent research (2026-07-09, three parallel DEEP subagents; each source tagged by the subagent):

Harness principles:
- Anthropic, *Building Effective Agents* (Dec 2024) `[FULL]` - start-simple, tools-not-frameworks, ACI.
- Anthropic, *Effective Context Engineering for Agents* (2026) `[FULL]` - context management.
- Anthropic, human-agent / long-running guidance (2026) `[PARTIAL]`.
- SWE-bench / SWE-agent write-ups on tool optimization `[FULL]`.
- Assorted 2026 engineering blogs on context thresholds, tool-count accuracy, verification rounds `[PARTIAL - single-source stats, treated as illustrative]`.

Case studies:
- Geoffrey Huntley, the "Ralph" loop `[FULL]`.
- Peter Steinberger, loop-engineering write-up `[PARTIAL]`.
- Cursor 2.0 agent architecture notes `[FULL]`.
- Cognition/Devin "don't build multi-agent" `[FULL]`.
- Two arXiv agent-architecture papers `[PARTIAL - abstract-level, IDs unverified]`.

OSS inventory (GitHub READMEs + API, star counts approximate as of 2026-07-09):
- Vercel AI SDK `[FULL]`, Claude Agent SDK TS `[FULL]`, Mastra `[FULL]`, elizaOS `[FULL]`, OpenHands `[FULL]`, LangChain/LangGraph `[FULL]`, CrewAI `[FULL]`, AutoGPT `[FULL]`, smolagents `[FULL]`, Aider `[FULL]`, gptme `[FULL]`, Agent Zero `[FULL]`, Mem0 `[FULL]`.

> Provenance note: some circulating precise metrics (context-window %, token-saving %, "1.6%/98.4%") trace to single secondary blogs and are NOT independently verified; they are marked illustrative above. The behavior-changing conclusions are corroborated across Anthropic's own posts + multiple independent builders.
