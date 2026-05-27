---
topic: agents
type: decision
status: research-complete
last-validated: 2026-05-26
related-docs: "601, 604, 605, 648, 734, 758, 758c"
original-query: "Do deep research on agents. Figure out how to create a list of a hundred best practices for agents. Don't create them yet. Just think about it. And then make me a list of how close we are for ZOE to be an agent orchestrator for it to be making tasks, and agents for every single task and then reviewing them and then making it better over time."
tier: DISPATCH (intended; sub-agents stalled, parent synthesized from code reads + grounded knowledge)
---

# 759 - Agent best practices + ZOE orchestrator gap analysis

> **Goal:** (A) Slim 2026 agent state-of-the-art synthesis. (B) Methodology PRD for a "100 best practices" list - structure only, no items. (C) Honest gap analysis: where ZOE is today vs ZOE as task-decomposing / agent-spawning / self-reviewing / self-improving orchestrator.

## Note on method

3 sub-agents were dispatched in parallel (agent state-of-art, 100-list methodology, Anthropic SDK deep-dive); all 3 stalled on the 600s stream watchdog and returned no synthesis. Parent (Claude Opus 4.7) wrote this doc from direct code reads of `bot/src/zoe/` + `bot/src/hermes/` + the Anthropic agent essay synthesis from training. Cited claims about external frameworks (LangGraph / AutoGen / CrewAI / Letta) are stable patterns at the time of writing and should be re-verified before any framework adoption.

---

# Part A - Agent state-of-the-art 2026 (slim)

## The 5 patterns Anthropic explicitly recommends

Per the canonical "Building Effective Agents" essay (Schluntz + Zhang, Anthropic, late 2024, still authoritative in 2026):

| Pattern | Shape | When to use | When NOT to |
|---------|-------|-------------|-------------|
| **Prompt chaining** | Decompose into linear LLM calls A -> B -> C, each refines the prior | Stable task, deterministic shape | Open-ended exploration |
| **Routing** | Classifier sends input to one of N specialized handlers | Inputs cleanly partition into types | Inputs overlap or evolve |
| **Parallelization** | N agents run in parallel (sectioning or voting) | Independent subtasks; ensemble for confidence | Single-thread reasoning; agents need each other's output |
| **Orchestrator-workers** | Lead agent decomposes goal into dynamic subtasks, dispatches workers, synthesizes | Variable subtask shape per goal; this is the DISPATCH pattern from /zao-research | When subtasks are knowable upfront (use parallelization) |
| **Evaluator-optimizer** | Generator produces, evaluator critiques, loop until threshold | Quality matters; gradient is measurable; cost of iteration < cost of bad output | Subjective output where evaluator can't ground |

**Plus** the **autonomous agent** pattern: full agentic loop with self-directed tool use, no fixed structure. Anthropic flags this as the highest-risk / highest-cost / least-predictable, recommended only when the goal is genuinely open-ended.

## What's actually shipping vs hype (2026)

| Framework | What's real | What's still hype |
|-----------|-------------|-------------------|
| **Claude Code + Agent SDK** | Production agentic loops, subagent dispatch, MCP, skills, hooks | "100% autonomous developer" - still needs supervision per task |
| **Cursor / Cursor Composer** | Per-file + multi-file edits with auto-apply; pair-programming UX | Full feature implementation from one prompt |
| **Devin (Cognition)** | Demos well; in narrow domains delivers | "Replaces junior engineers" - still high failure rate on novel tasks |
| **AutoGen v0.4+** | Microsoft's multi-agent framework; mature messaging primitives | Complex agent debates often loop or hallucinate consensus |
| **CrewAI v0.80+** | Role-based agent teams; simpler than AutoGen for small crews | "Crew" abstractions can hide where decisions are actually made |
| **LangGraph v0.2+** | Stateful graph orchestration; the "real" framework for production agents | Graph design complexity grows with edge cases |
| **Letta (formerly MemGPT)** | Memory-block agent persistence; the model ZOE adopted | "Self-improving memory" still mostly manual edits |
| **MCP (Model Context Protocol)** | Native Anthropic Gmail/GCal/Drive connectors stable; plugin ecosystem expanding | "Universal agent-to-agent protocol" - still mostly tool-use, not inter-agent |
| **OpenAI Assistants v2** | Stable thread/tool API | "Agent" branding masks what's mostly a chat-with-tools wrapper |
| **n8n + AI nodes** | Excellent for workflow-as-graph with LLM nodes | Not actually agentic - it's deterministic workflows with LLM steps |

**Anthropic's stance** (consistent across blog + docs): start simple. Single-LLM-call beats prompt-chain. Prompt-chain beats workflow. Workflow beats agent. Use the most-constrained pattern that solves the problem.

## Multi-agent orchestration: what breaks at scale

The honest 2026 view: most "multi-agent" demos in 2024-2025 were premature decomposition. Real-world failures:

- **Infinite delegation loops** - agent A asks B, B asks A back, no progress
- **Context overflow at handoffs** - agent A produces 8KB context, agent B reads it but its critic doesn't know what A "meant"
- **Hallucinated consensus** - 5 agents "debate," all four wrong agents converge on a wrong answer; only one was right and got outvoted
- **Cost explosion** - each agent makes 3-5 tool calls, ensemble of 8 agents = 40 tool calls per "decision"
- **Trust boundary violations** - agent A is malicious or compromised; agent B doesn't know not to trust its output (prompt injection at boundary)

Hermes's critic.ts already mitigates the last one with explicit `[EXTERNAL_SOURCE]` trust markers + a "score 0 on detected injection" rule. That's the right pattern; should propagate to any new agent-to-agent boundary.

## Memory patterns

- **Letta 4-block model** (persona / human / sources / sessions) - ZOE adopted; works for solo dev
- **MemGPT virtual context** - paging in/out of working memory; Letta's superset
- **Mem0 / Zep** - hosted memory APIs; vendor risk
- **File-based + git** - ZAO's research/ + ~/.claude/projects/.../memory/ - works at human scale, doesn't scale to autonomous loops
- **Knowledge graph** (Bonfires-style) - episodes + entities + relations; ZAO has this; best for cross-conversation recall

For ZOE specifically: Letta blocks + Bonfire KG bridge is the right architecture. The gap is automation - blocks are hand-edited; Bonfire ingest is manual (no SDK yet).

## Self-improvement loops: what actually works

Honest answer: most "agent learns over time" claims are marketing. What measurably works (in 2026):

1. **Reflexion-style** - after a failure, agent writes a "lesson" to memory, next attempt reads it. Works when failures are concrete + lessons are local-scope.
2. **Output-trace replay** - on a corrected output, store the (input, bad output, corrected output, why) tuple. Next time a similar input shows up, retrieve the lesson. Works when retrieval is good; fails on novel inputs.
3. **Skill emergence** - the agent's environment ships a library of skills (Anthropic SKILL.md pattern); the agent "improves" by gaining access to new skills, not by changing its weights. This is what Claude Code actually does.
4. **Constitution / feedback memory** - the agent maintains a "what Zaal corrected me on" log that gets prepended to context. ZAO's `~/.claude/projects/.../memory/feedback_*.md` pattern.

What does NOT work without serious infra: RLHF on agent traces (requires fine-tuning), "agents teach each other" (mostly hand-wavy), "self-modifying agents" (academic toy).

For ZOE: skill emergence (3) + feedback memory (4) is what's already partly built. Reflexion (1) is the obvious next step.

## What this means for ZAO

1. Don't build multi-agent debate. Pick orchestrator-worker (which /zao-research already uses) + evaluator-optimizer (which Hermes already is).
2. Stay on Claude Code's primitives (skills, hooks, subagents, MCP) rather than building from scratch on top of LangGraph/AutoGen - the gap-to-feature ratio is much better.
3. Memory pattern is solved: Letta blocks + Bonfire KG. Wiring is the work.
4. Self-improvement: ship reflexion as the next milestone; everything else is over-promise.
5. Cost discipline: Hermes's `FLEET_DAILY_USD_CAP = $20` pattern is the model. Every new agent loop gets a cap.

---

# Part B - Methodology for a "100 best practices for agents" list (structure only, no items)

User constraint: "Don't create them yet. Just think about it."

## Reference catalogues that work

| Catalogue | Items | Voice | Structure | What makes it work |
|-----------|-------|-------|-----------|---------------------|
| **OWASP Top 10** | 10 | "A01 Broken Access Control" - severity tag + name | Numbered, ranked by prevalence + impact | Tight, dated, evidence-backed |
| **12-Factor App** | 12 | "X. Codebase: One codebase tracked in revision control" - principle-first | Sequential, each one paragraph | Universal, ageless wording |
| **Joel on Software 12 Things** | 12 | Verb-first questions ("Do you use source control?") | Yes/no checklist | Instantly actionable |
| **Pragmatic Programmer tips** | 100 | Tip + 1-paragraph rationale | Embedded in chapters, indexed | Each tip is a punchline, not a recipe |
| **AWS Well-Architected Pillars** | 5 pillars + ~200 questions | Question-first ("How do you protect your data in transit?") | Pillar -> question -> design principles -> guidance | Auditable; tied to actual AWS services |
| **Google SRE Workbook** | ~30 chapters | Story-first | Narrative + checklist | Comes from real incidents, not theory |

**Pattern across all winners:** numbered, named, dated, evidence-backed, ageless wording, written so a future self can disagree precisely.

## Recommended structure for the ZAO 100

| # | Decision | Why |
|---|----------|-----|
| 1 | **3-tier structure: 20 core (must) + 50 sharp-edges (should) + 30 situational (depends)** - not flat 100 | Solves the "I don't have time to read 100" problem; surfaces the 20 that matter most |
| 2 | **9 categories** by lifecycle + concern: design / prompt / tool / memory / orchestration / eval / safety / cost / ops | Matches how an agent fails; matches how engineers triage |
| 3 | **Voice: verb-first + rationale + concrete failure mode** ("USE explicit trust boundaries between agents - because Hermes critic prompt injection guard caught X attempt") | Short, opinionated, defensible, traceable to a real event |
| 4 | **Item length: 80-200 words** - one paragraph + 1-line "tested-on" footer | Long enough to defend; short enough to scan |
| 5 | **Frontmatter per item: `id`, `category`, `tier (core/sharp/situational)`, `last-validated`, `tested-on` (ZAO repo, doc, or incident link)** | Audit + decay management built in |
| 6 | **Validation: stress-test every item with a "what's the legit counterexample?" pair before shipping** | OWASP-style: no item ships without its inverse-case considered |
| 7 | **Source bias: 60% Anthropic canon + 25% measured ZAO incidents + 15% community (HN, papers, framework docs)** | Bias toward what's testable + actionable in this stack, not what's trendy |
| 8 | **Output medium: numbered markdown doc + machine-readable JSON index** | Humans read the markdown; agents query the JSON (this is what makes ZOE able to apply the list) |
| 9 | **Lifecycle: re-validate every 90 days; deprecate aggressively** | Agent landscape churns; ageing the list is worse than shrinking it |
| 10 | **Anti-pattern section: top 10 things that look smart but hurt agents** | The negative space is half the value |

## Anti-patterns for the list itself (don't do these)

- **Don't write 100 items that are 100 platitudes** ("Be clear in your prompts"). Each item must be defensible against a counterexample.
- **Don't categorize by framework** ("LangGraph best practices"). Categorize by problem; frameworks come and go.
- **Don't write the list once and never update.** A stale agent best-practices list is actively harmful.
- **Don't omit cost.** Agent best-practices that don't mention cost are written by people who don't pay the bill.
- **Don't ship without the JSON index.** If ZOE can't query the list, it can't apply the list, which was the whole point.

## How ZOE eventually uses the list

Each item gets `applies-at: design-time | runtime | review-time` + `enforced-by: skill | hook | manual` tags. Then:

- **Design-time items** -> exposed as Claude Code skills that auto-invoke when designing an agent
- **Runtime items** -> wired into PreToolUse hooks
- **Review-time items** -> a critic agent (extension of Hermes critic.ts) scores agent output against the relevant items

The list becomes ZOE's constitution. ZOE asks "am I about to violate item #34 (don't pre-SELECT before INSERT)?" before dispatching code-fix work.

---

# Part C - ZOE-as-orchestrator gap analysis (the headline)

## TL;DR

**ZOE today is a concierge with state.** ZOE-as-orchestrator-with-self-review needs **5 missing pieces.** All 5 are wiring, not greenfield builds. Realistic ship: 60% in 2 weeks, 90% in 6 weeks if Zaal stays focused. The 10% that's hard is the "actually learns over time" claim.

Total readiness today: **~35%.** Detailed below.

## What ZOE does TODAY (read from bot/src/zoe/)

| Capability | Status | Where in code |
|------------|--------|---------------|
| Telegram concierge (DMs + groups) | LIVE | `bot/src/zoe/index.ts`, `groups.ts` |
| 4-block Letta-style memory (persona / human / working / tasks) | LIVE | `memory.ts`, `concierge.ts` (lines 22-52) |
| Task queue with structured ops (add/update/complete/defer) | LIVE | `tasks.ts` - JSON ops parsed from LLM reply |
| Cost-routed model selection (sonnet default, opus on strategic, haiku on quick) | LIVE | `types.ts` `selectModel()` |
| Morning brief (5am EST) + evening reflection (9pm EST) | LIVE | `brief.ts`, `reflect.ts`, `scheduler.ts` |
| Group config (silent/mention/all modes + per-chat allowlists) | LIVE | `groups.ts` + `/zg` admin commands |
| Elder + lineage (children inherit persona) | LIVE | `bootloader-template.md` |
| Empty-reply guard (>5 chars) + prompt-injection trust boundary | LIVE | `concierge.ts` + Hermes `critic.ts` |
| Limited tool surface (Read/Glob/Grep + Playwright MCP + `gh pr list` + `git log`) | LIVE | `concierge.ts` lines 73-95 |

## What Hermes does TODAY (read from bot/src/hermes/)

| Capability | Status | Where in code |
|------------|--------|---------------|
| Coder + Critic + Auto-PR loop (max 3 attempts, score >=70 to ship) | LIVE | `runner.ts`, `coder.ts`, `critic.ts` |
| Cost-routed critic (Sonnet for complex, Haiku for simple) | LIVE | `critic.ts` `selectCriticModel()` |
| Daily fleet cap ($20/day notional cap, in-process counter, UTC reset) | LIVE | `runner.ts` `fleetDailyGuard()` |
| Prompt-injection guard at critic boundary (treats diff as data, scores 0 on detection) | LIVE | `critic.ts` system prompt |
| Multi-repo target (`zaoos` default; cross-repo PR generation) | LIVE | `types.ts` `HermesRepoTarget` |
| Telegram narrator hooks (status pings during the coder/critic loop) | LIVE | `runner.ts` `HermesNarrator` |
| Database run-tracking (every run + token counts + scores logged) | LIVE | `db.ts` |
| PR watcher (post-merge follow-up) | LIVE | `pr-watcher.ts` |
| Pre-flight gate (cancels run before fleet-cap budget burned) | LIVE | `preflight.ts` |

## What's MISSING for "orchestrator that spawns task-agents, reviews, improves"

### Gap 1 - Goal decomposition (15% complete)

**Today:** When Zaal types "research X and ship a doc," ZOE replies with text or adds a task. There's no decomposer that says "this is a research task + a comms task + a code task, dispatch 3 different sub-agents."

**Needed:** A `decompose.ts` that takes a goal and routes to:
- code work -> Hermes `dispatchHermesRun()` (already wired)
- research work -> `/zao-research` skill (need ZOE-side dispatcher)
- comms work -> `/cold-outreach` or `/clipboard` skill (need dispatcher)
- data/script work -> ad-hoc bash subagent in worktree
- multi-step goals -> recursive decomposition

**Effort:** medium. `decompose.ts` is one Claude call with a routing prompt + a structured-output JSON response.

### Gap 2 - Multi-modal sub-agent dispatch (10% complete)

**Today:** Hermes dispatches sub-Hermes runs from inside the bot process. ZOE can dispatch Hermes (one direction is wired). ZOE cannot dispatch a `/zao-research` agent, or a `general-purpose` Agent({subagent_type:...}) call, because ZOE runs OUTSIDE Claude Code (via the `claude-cli` subprocess).

**Workaround already in place:** `concierge.ts` calls Claude CLI which itself CAN dispatch sub-agents. So technically ZOE -> Claude CLI -> Agent tool works. But ZOE's prompt today doesn't tell Claude to use Agent for subtasks.

**Needed:** Update ZOE's persona prompt to say "for subtasks that need different context/tools, dispatch a sub-agent via the Agent tool with the appropriate subagent_type." Plus add the Agent tool to `allowedTools` in `concierge.ts` line 73.

**Effort:** small. ~50 LOC change.

### Gap 3 - Non-code output review (20% complete)

**Today:** Hermes's `critic.ts` scores code diffs 0-100. That's the only review primitive.

**Needed:** Equivalent critics for:
- **Research doc critic** - reads a research doc, checks Hard Requirements 1-12 from `/zao-research`, scores 0-100
- **Comms draft critic** - reads a draft, checks brand.md voice rules, scores 0-100
- **Task-result critic** - reads "agent ran X, here's the output," scores whether the goal is met

All 3 are variations on critic.ts with different system prompts. Hermes critic is the template.

**Effort:** medium. Each critic is ~80 LOC of system prompt + Claude call + JSON parse. 3 critics = ~250 LOC.

### Gap 4 - Memory-block auto-update from reflection (5% complete)

**Today:** `reflect.ts` asks Zaal 3 questions every evening. Zaal replies. The next concierge turn parses the reply + may add tasks. But `human.md` (Zaal facts) and `persona.md` (ZOE identity) NEVER auto-update. Phase 5 in the README is the explicit "Letta-style self-improving `human` block updates" line and it's [ ] unchecked.

**Needed:** After reflection, ZOE writes a `reflexion.ts` that:
- Diffs today's reflection answers against what `human.md` says
- Identifies if any fact in human.md is now stale (e.g., "Zaal is at Jackson Labs" but reflection mentions Riverside starting)
- Drafts a proposed patch to human.md
- Asks Zaal "I think your human block needs this change [diff]. Apply? [y/n]"
- On y, writes the patch

This is the canonical Letta self-improvement loop.

**Effort:** medium-large. ~150 LOC plus human-in-loop UX in Telegram.

### Gap 5 - Agent-loop telemetry + improvement-over-time (3% complete)

**Today:** Hermes logs runs (db.ts). Token counts + scores stored. But nothing reads back "in the last 30 runs, the critic averaged 62 with feedback often saying 'missed RLS impact' - we should update the coder prompt to remind about RLS." There's no closing of the learning loop.

**Needed:** A weekly `learn.ts` cron that:
- Queries db for last N=30 Hermes runs
- Clusters failure feedback (lightweight: just LLM clusters topics)
- Identifies the top 3 recurring failure modes
- Drafts a proposed patch to the coder.ts system prompt OR to a "common mistakes" memory block
- Asks Zaal to approve before applying

This is the closing-the-loop piece. Plus extend to ZOE's own concierge turns (cluster "things Zaal corrected me on this week").

**Effort:** large. ~300 LOC + careful prompt design. This is the genuinely hard part.

## Readiness scorecard

| Capability | % done | Tier | Effort to 100% | Blocker |
|------------|--------|------|----------------|---------|
| Concierge + memory + tasks (baseline) | 95% | Foundation | n/a | n/a |
| Hermes coder-critic-PR loop | 95% | Foundation | n/a | n/a |
| Goal decomposition | 15% | Orchestrator core | small-medium | Write `decompose.ts` + routing prompt |
| Multi-modal sub-agent dispatch | 10% | Orchestrator core | small | Update persona + allowedTools |
| Non-code output review | 20% | Review loop | medium | 3 new critic.ts variants |
| Memory-block auto-update | 5% | Self-improve loop | medium-large | `reflexion.ts` + human-in-loop UX |
| Agent-loop telemetry + learning | 3% | Self-improve loop | large | `learn.ts` + run-clustering |

**Weighted total: ~35%.** The 65% gap is mostly wiring, not greenfield. Two thirds of the missing work is small-to-medium pieces; one third (Gap 5) is the genuinely hard self-improvement claim.

## Recommended sprint order

1. **Week 1:** Gap 2 (multi-modal dispatch wiring) - smallest, unlocks all the others
2. **Week 1-2:** Gap 1 (decompose.ts) - now ZOE can route
3. **Week 2-3:** Gap 3 (research-critic + comms-critic + task-result-critic)
4. **Week 3-4:** Gap 4 (reflexion.ts on human.md)
5. **Week 4-6:** Gap 5 (learn.ts + run clustering) - the hard part

By end of week 6: ZOE is a real orchestrator. The "improves over time" claim becomes measurable - track average critic score on Hermes runs week-over-week.

## What ZOE will NEVER do (intentional limits)

- Auto-send messages to anyone but Zaal (per `feedback_dont_invent_outreach`, `feedback_no_unauthorized_commitments`)
- Modify code without going through Hermes coder+critic (per Hermes pattern lock 2026-05-05)
- Make irreversible decisions (data deletion, money movement, broadcasts) without explicit Zaal confirmation
- Re-run set-stock-team-random-codes.ts or other deterministic-but-destructive scripts (per `feedback_no_regenerate_codes`)

These limits stay even at 100% orchestrator readiness. Self-improvement does not mean self-authority.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Gap 2: Add Agent tool to `concierge.ts` allowedTools + update persona to use it | @Zaal | PR | 2026-05-30 |
| Gap 1: Write `decompose.ts` + routing prompt | @Zaal | PR | 2026-06-02 |
| Gap 3a: Write `research-critic.ts` (Hard Reqs 1-12 from /zao-research) | @Zaal | PR | 2026-06-05 |
| Gap 3b: Write `comms-critic.ts` (brand.md voice rules) | @Zaal | PR | 2026-06-07 |
| Gap 4: Write `reflexion.ts` + Telegram approval flow | @Zaal | PR | 2026-06-14 |
| Gap 5: Write `learn.ts` weekly cron + run-clustering | @Zaal | PR | 2026-06-28 |
| Build the "100 best practices" list per Part B methodology (separate doc) | @Zaal | doc | when above is 60% done |

## Also See

- Doc 601 - Hermes-as-ZOE-brain decision (where this architecture was locked)
- Doc 604 - best concierge agents 2026 (the source for the current scaffold)
- Doc 605 - Playwright MCP unlock (current ZOE tool surface)
- Doc 648 - SIDEQUESTZ spec (the "Zaal asks for a quest, ZOE picks one" pattern)
- Doc 734 - Hermes orchestrator framework (canonical orchestrator pattern)
- Doc 758c - Telegram /claim bot (a near-term Hermes extension that exercises Gap 2)
- Memory: project_hermes_canonical.md, project_zoe_soul_architecture.md, project_zoe_v2_redesign.md

## Sources

- [FULL] `bot/src/zoe/README.md` - the architectural source of truth for ZOE today
- [FULL] `bot/src/zoe/concierge.ts` - 4-block memory rendering + Claude CLI call shape
- [FULL] `bot/src/zoe/tasks.ts` - task-op state machine
- [FULL] `bot/src/zoe/reflect.ts` - evening reflection generator (the partial Gap 4)
- [FULL] `bot/src/zoe/types.ts` - cost-routing helpers + task model
- [FULL] `bot/src/hermes/runner.ts` - the canonical orchestrator loop pattern + fleet cap
- [FULL] `bot/src/hermes/critic.ts` - the canonical review-loop primitive + injection guard
- [PARTIAL - cited from training, not re-fetched 2026-05-26] Anthropic "Building Effective Agents" essay (Schluntz + Zhang, late 2024) - canonical 5 patterns + autonomous-agent pattern
- [FAILED - sub-agent watchdog stalled] Original DEEP-tier dispatch for agent state-of-the-art + 100-list methodology + Anthropic SDK survey (3 sub-agents timed out on 600s stream watchdog; parent synthesized from grounded knowledge instead)

Re-validation note: the Part A external-framework claims (LangGraph / AutoGen / CrewAI / Letta / MCP) should be verified before adopting any of them. The Part C gap analysis is FULL-grounded in code reads and is the load-bearing part of the doc.

---

# v2 deltas (appended 2026-05-26 after tighter re-dispatch)

Original 3 DEEP-tier sub-agents stalled on the 600s watchdog. 3 tighter STANDARD-tier re-dispatches (5-fetch cap, 10-min wall) all returned cleanly. Material updates to Parts A + B below; Part C unchanged (already FULL-grounded in code).

## Part A delta - 2026 framework reality (updated from training cutoff)

| Framework | Version | Production? | Strength | Weakness | MCP / Claude Code fit |
|-----------|---------|-------------|----------|----------|----------------------|
| **LangGraph** | v1.0 GA Oct 2025 | YES - Uber, LinkedIn, Klarna in prod | Graph state persistence + durable execution across restarts | Requires PostgreSQL for prod checkpointing | PARTIAL - MCP support planned Q2 2026 |
| **AutoGen** | v0.7.5 (Sept 2025) | **NO - MAINTENANCE MODE.** Microsoft migrated to Microsoft Agent Framework | Multi-agent group-chat patterns | Architecture deprecated | NO - abandon, don't adopt |
| **CrewAI** | v1.14.5 (Feb 2026) | YES | Role-based agents + delegation | Sequential/hierarchical only; parallel + consensual WIP | UNKNOWN, likely NO |
| **Letta** (MemGPT) | v1.0 (April 2026) | YES - managed SaaS + self-hosted | Cross-session memory + dream-agent continual learning | Self-hosted ops cost unpredictable | NO - Python/TS only |
| **ElizaOS** | 294 releases, May 2026 | YES | Plugin ecosystem + Farcaster/Discord/Telegram out-of-box | Unstable as a framework dep | PARTIAL - MCP example exists |

**ZAO recommendation: ADOPT NONE.** Stay on Claude Code + Hermes. Letta-managed tier is the ONE revisit case IF cross-restart memory becomes a real constraint that `~/.zao/zoe/` file-block memory can't solve.

## Part A delta - Anthropic Claude Code primitives ZOE should adopt (concrete APIs)

### 1. Subagents (`Agent` tool)
Define custom subagents in `.claude/agents/AGENT.md` or `settings.json` `subagents` block. Each gets own context window + tool access. Semantic auto-delegation. Doc: `code.claude.com/docs/en/subagents.md`

**For ZOE:** define 8 worker subagent types in `bot/src/zoe/.claude/agents/`. Haiku for workers, Sonnet for ZOE core, Opus on escalate (locked Q2).

### 2. Skills (`SKILL.md`) - 3-stage progressive disclosure
Stages: frontmatter (~100 tok always) -> body (~5k tok on trigger) -> bundled resources (zero until accessed). Auto-discovery via `~/.claude/skills/` scan. Doc: `platform.claude.com/docs/en/agents-and-tools/agent-skills/overview.md`

### 3. Hooks - 6 lifecycle events
`SessionStart / UserPromptSubmit / PreToolUse / PostToolUse / Stop / PermissionRequest`. Exit 0 = JSON processed; 2 = block action. Doc: `code.claude.com/docs/en/hooks.md`

### 4. MCP servers - 3 transports + plugin scope
`http` (OAuth via RFC 8414) / `stdio` (subprocess) / `sse` (deprecated). Plugin MCPs auto-load with `${CLAUDE_PLUGIN_ROOT}` env expansion. Doc: `code.claude.com/docs/en/mcp-servers.md`

**For ZOE:** GitHub (OAuth) + Supabase (stdio, service-role via `headersHelper`) + Serena in `bot/src/zoe/plugins/mcp-connectors/plugin.json` with `alwaysLoad: true`.

### 5. Memory - CLAUDE.md hierarchy + auto-memory + MEMORY.md
5-level CLAUDE.md search path. Auto-memory at `~/.claude/projects/<project>/memory/MEMORY.md` (first 200 lines or 25KB auto-load). Worktrees share auto-memory. Doc: `code.claude.com/docs/en/memory.md`

## Part B delta - 100-list methodology (per Q11 build now)

### Lists that aged badly (avoid the failure shape)

- IT best practices 2018 (password rotation, drive defrag, RAID 5 bad rap) - hardware evolution + security reversals killed them
- Email marketing 2018 (double opt-in, short subject lines) - born from 2000s ISP whitelist + AOL truncation, persisted past relevance
- HR 360-feedback - co-opted for performance evaluation contrary to design

**Pattern killer:** copy-without-context + no re-validation loop + framework-coupled wording.

### Templates worth copying

- **Kubernetes Security Baseline** - 6 domains, each its own MD file, items mapped to CIS Benchmark v1.8.0 / SOC 2, YAML templates ready-to-apply, severity implicit via order
- **CKS Cheat Sheet** - one-page printable + production reference, sub-100 items grouped by function, each = command/config + expected output + common pitfall

### Recommended machine-readable structure

```
research/agents/100-ai-agent-best-practices/
  _meta.yaml          (TOC + category tree + maintenance cadence)
  001-prompt-grounding.md
  002-token-budgeting.md
  ...
  100-deployment-safety.md
```

Per-item frontmatter:

```yaml
---
id: agent-001
category: prompt-engineering
severity: critical | high | medium | low
applies_to: [llm, multi-agent, autonomous]
deprecated_since: null
rationale: "Why this matters"
sources: ["doc-734", "anthropic-2024-essay"]
---
```

`_meta.yaml`:

```yaml
version: "1.0"
last_updated: "2026-05-26"
categories:
  prompt-engineering: [001-010]
  agent-architecture: [011-035]
  multi-agent-coordination: [036-055]
  deployment-ops: [056-100]
maintenance_cadence: "quarterly"
deprecated_items: []
```

ZOE queries by severity / category at runtime; humans read the markdown; each item has `deprecated_since` + `sources` audit trail.

## v2 sub-agent sources (added)

- [FULL] LangGraph v1.0 GA - https://changelog.langchain.com/announcements/langgraph-1-0-is-now-generally-available
- [FULL] AutoGen GitHub (maintenance warning) - https://github.com/microsoft/autogen
- [FULL] CrewAI changelog - https://docs.crewai.com/en/changelog
- [FULL] Letta production patterns - https://callsphere.ai/blog/td30-fw-letta-1-0-formerly-memgpt-production-patterns-guide
- [FULL] ElizaOS - https://github.com/elizaOS/eliza
- [FULL] Claude Code subagents - https://code.claude.com/docs/en/subagents.md
- [FULL] Agent Skills overview - https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview.md
- [FULL] Hooks reference - https://code.claude.com/docs/en/hooks.md
- [FULL] MCP servers - https://code.claude.com/docs/en/mcp-servers.md
- [FULL] Memory system - https://code.claude.com/docs/en/memory.md
- [FULL] Kubernetes Security Baseline + CKS Cheat Sheet - 100-list templates

---

# Locked architecture decisions (2026-05-26 grill)

The 17-question grill ran 2026-05-26 with Zaal. Every decision below is binding for the 6-week sprint. Target: **ZOE 90%+ orchestrator-ready by 2026-07-07.**

## Phase 1 - ZOE orchestrator architecture (Q1-Q11)

| Q | Locked | Notes |
|---|--------|-------|
| Q1 - ZOE shape | **A GATEWAY** | All agent dispatch flows through ZOE. ZOE owns master task graph + learns from every run. |
| Q2 - Model mix | **A Haiku/Sonnet/Opus** | Workers Haiku, ZOE core Sonnet, Opus on escalate. Matches Hermes cost routing. |
| Q3 - Self-improvement authority | **A** | ZOE drafts patches; Zaal Y/N every patch via Telegram. No auto-apply for first 3 months. |
| Q4 - human.md write authority | **B+ hybrid** | ZOE writes patches herself after y/n approval. On LOW-CONFIDENCE patches, ZOE asks Zaal for a voice note FIRST, drafts from voice note, then y/n. **Voice-note-as-clarification is a new ZOE design rule.** |
| Q5 - Worker subagent_types | **A + C** | 8 workers: research-worker, code-reviewer, comms-drafter, task-dispatcher, data-runner, brief-writer + recap-agent (post-worker summarizer) + watcher-agent (in-flight sanity check). |
| Q6 - Critics | **A** | 3 critics: research-critic (Hard Reqs 1-12), comms-critic (brand.md voice), task-result-critic (goal met?). |
| Q7 - Cost ceiling | **B SPLIT** | $20 Hermes + $10 ZOE concierge + $20 worker dispatches = $50/day. |
| Q8 - Failure policy | **A** | Worker fails 3x -> Telegram escalation to Zaal. First 30 days while we learn failure shapes. |
| Q9 - Telemetry storage | **B HYBRID** | Hermes Postgres for raw run telemetry. Bonfires for weekly CURATED LESSONS only (one well-formed episode per cluster from learn.ts). |
| Q10 - Gap ship order | **A** | 2 -> 1 -> 3 -> 4 -> 5. Dependency-graph order. |
| Q11 - 100-list timing | **B NOW** | Build 100-list NOW in parallel with gap sprint. |

## Phase 2 - Bonus already-waiting decisions (Q12-Q15)

| Q | Locked | Notes |
|---|--------|-------|
| Q12 - Mentor mechanics | **1A 2D 3A 4A 5C 6B** | Confirmed full set. Q5=C (manual Hats mint at Finals) is Claude override of Zaal default B. |
| Q13 - Magnetiq rebrand | **A fix-on-touch** | Next time I edit Tyler context, patch the "Magnetic" -> "Magnetiq" typo in the same diff. |
| Q14 - Vlad/Singularity park | **A stands** | Re-evaluate 2026-06-23. |
| Q15 - 758e fix disposition | **A fork-terminal owns** | (PR #708 already merged to main; fork inherits clean baseline + the new `feedback_no_sub_agent_context_fabrication` memory rule.) |

## Phase 3 - TIER sequencing (Q16)

| Q | Locked | Notes |
|---|--------|-------|
| Q16 - Parallel tracks | **A** | Week 1 = ZOE Gap 2 + Cowork hardening + Leeward Jun 2 prep simultaneously. Week 2-3 = zaofractal review + Discord radio + Quick wins. |

## Phase 4 - Persistence (Q17)

| Q | Locked | Notes |
|---|--------|-------|
| Q17 - Locked-decisions storage | **A land here** | This doc 759 section + new `project_zoe_orchestrator_locked.md` memory file + PR #705 update commit. Future ZOE-context Claude turns auto-load the table. |

## Sprint plan (post-grill)

**Week 1 (2026-05-26 to 2026-06-01):**
- Gap 2: Add Agent tool to ZOE `concierge.ts` allowedTools + persona update directing dispatch via Agent for subtasks (~50 LOC)
- Define 8 worker subagent_types in `bot/src/zoe/.claude/agents/AGENT.md` files
- Cowork hardening: CI workflow + Husky pre-commit + GH branch protection (Claude solo)
- Leeward Jun 2 prep: verify UDP 52000-52100 on VPS 31.97.148.88; pull m1k1o/neko v3.1.0; local docker compose test

**Week 2 (2026-06-02 to 2026-06-08):**
- Gap 1: `decompose.ts` router + structured-output decomposition prompt
- 100-list bootstrap: `research/agents/100-ai-agent-best-practices/` folder + `_meta.yaml` + first 10 items
- Leeward kickoff Jun 2

**Week 3 (2026-06-09 to 2026-06-15):**
- Gap 3 critics: `research-critic.ts` + `comms-critic.ts` + `task-result-critic.ts`
- 100-list: items 11-40

**Week 4 (2026-06-16 to 2026-06-22):**
- Gap 4: `reflexion.ts` with voice-note clarification flow
- 100-list: items 41-70

**Week 5-6 (2026-06-23 to 2026-07-06):**
- Gap 5: `learn.ts` weekly cron + Bonfire-summary writer
- 100-list: items 71-100 + first quarterly re-validation pass

**Measurement of done:** % of Zaal goals that route through ZOE decompose -> worker dispatch -> critic -> recap, without manual fork. Target 90%+ by 2026-07-07.
