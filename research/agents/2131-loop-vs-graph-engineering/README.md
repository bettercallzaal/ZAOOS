---
topic: agents
type: guide
status: research-complete
last-validated: 2026-07-29
related-docs: 2127, 928, 994
original-query: "/zao-research DevCompass 'Loop Engineering vs Graph Engineering, Part 2: Building It in Code'"
tier: STANDARD
---

# 2131 - Loop vs Graph Engineering (Part 2) - ZAO already has both

> **Goal:** Take DevCompass's loop-vs-graph piece and answer the ZAO question: when is a loop enough, when does a graph earn its keep, and does ZAO already have the graph primitives (yes - the `Workflow` tool).

## Key Decisions (recommendations first)

| # | Decision | Why | Owner |
|---|----------|-----|-------|
| 1 | **Most ZAO agent work stays a LOOP; reserve the GRAPH (`Workflow` tool) for genuine fan-out/fan-in.** A graph earns itself only when one step splits into *genuinely independent* pieces run in parallel, then merged. Otherwise a loop is the whole job. | The article's core: "if a task fits inside [discover->plan->execute->verify->repeat], and most do, that's the whole job. No graph required." ZAO's ZOE loops + `agent-loops.md` are the loop side; the `Workflow` tool is the graph side - use each where it fits. | @Zaal |
| 2 | **The one graph move worth adopting everywhere: pull the VERIFIER into its own node/context.** A verifier that runs in the same context as the thing it checks is "the same reasoning agreeing with itself in a different font." | This is where graph > loop value actually lives, per the article - and ZAO's `Workflow` adversarial-verify pattern (spawn N independent skeptics in separate agent() calls) already does exactly this. Keep doing it; it's the highest-leverage pattern. | @Zaal |
| 3 | **Never spend an agent call on flatten/dedupe/merge - that's deterministic code.** "A lot of what does look like a real handoff... usually doesn't need a model call at all." | Directly saves the Claude cap (`claude-usage.md`). The `Workflow` tool's docs say the same: do the transform inside a pipeline stage in plain JS, not a barrier agent. | @Zaal |
| 4 | **Nothing new to build - ZAO has the graph runtime.** The `Workflow` tool (`pipeline()` = fan-out no-barrier, `parallel()` = barrier fan-in, `agent()` = nodes) IS the graph orchestration the article walks through. | Same finding as doc 2127 for the loop side: the concept is already shipped. This is validation + a vocabulary, not a to-do. | @Zaal |

## The article (what it says)

Part 2 of DevCompass's loop-vs-graph series, "Building It in Code." The barista analogy: a **loop** is one barista doing every job in sequence and tasting their own cup; a **graph** is stations with one job each, a clear handoff, and a **pass station** that checks every cup before it goes out.

The loop most tasks still need:
```python
def run_loop(task, max_iterations=10):
    state = discover(task)
    for _ in range(max_iterations):
        plan = make_plan(state)
        result = execute(plan)
        verdict = verify(result, task.success_criteria)
        if verdict.passed:
            return result
        state = update_state(state, result, verdict.feedback)
    raise LoopExhaustedError(...)
```
"verify is doing the real work, not execute. If it always passes, the loop is decoration." (Mirrors `agent-loops.md` rule 1: ground-truth close.)

The edge test: an edge exists only if data actually crosses it. "for every 'and then' in your plan, ask whether the next step reads the last step's output. If nothing crosses, there's no edge." Two unrelated jobs run back-to-back are not a graph.

The pattern that justifies a graph - **fan-out / fan-in (the "diamond")**:
```
                file 1 audit -.
in - split -    file 2 audit -+- merge (plain code) - synthesize - out
                file N audit -'
```
Real-scale example: Anthropic porting ~750,000 lines Zig->Rust, hundreds of agents in parallel with **independent reviewers checking every file**, landing 99.8% of the test suite passing in 11 days.

Where the graph earns its keep: the verifier runs in a **separate node** (fresh context, different prompt, ideally a different angle) - otherwise it's self-agreement. Four frameworks that ship graph orchestration as a real feature: Claude Code dynamic workflows, LangGraph, Google ADK, AutoGen GraphFlow.

## The ZAO map (article concept -> where it already lives)

| Article concept | ZAO has it | Evidence |
|-----------------|------------|----------|
| The loop (discover/plan/execute/verify/repeat) | ZOE loops + the 36-rule loop rulebook | `.claude/rules/agent-loops.md`, doc 2127, doc 928 |
| Fan-out / fan-in "diamond" | the `Workflow` tool: `pipeline()` (no-barrier fan-out), `parallel()` (barrier fan-in), `agent()` nodes | Workflow tool (dynamic workflows, this session's harness) |
| Verifier in a separate node | the adversarial-verify pattern (N independent skeptic `agent()` calls, majority-refute kills a finding) | Workflow tool "quality patterns"; used in ZAO code-review workflows |
| "flatten/dedupe is deterministic code, not an agent call" | pipeline-stage transforms in plain JS, not a barrier agent | Workflow tool guidance + `claude-usage.md` (don't burn the cap) |
| Loop-until-dry / stop conditions | `agent-loops.md` rule 5 (hard ceilings), loop-until-dry pattern | doc 928, doc 994 |

**Bottom line: ZAO already has both engines.** Doc 2127 established ZAO does loop/harness engineering; this establishes ZAO also has the graph runtime (the `Workflow` tool) and already uses its highest-value pattern (separate-node adversarial verify). The article is a shared vocabulary + external validation, not new work.

## The genuine delta (what's worth doing)

1. **Reach for `Workflow` (the graph) only on true fan-out/fan-in.** When a task is really "audit these N independent files / review across M dimensions," use `pipeline`/`parallel` with a separate verify stage. For everything else, a single ZOE loop is correct and cheaper.
2. **Keep the verifier in its own node** - it's the one pattern that reliably beats a self-checking loop. ZAO's adversarial-verify already does this; apply it to any high-stakes finding (matches `anti-fabrication.md`).
3. **Don't graph-ify for its own sake.** Apply the edge test before adding a node: if the next step doesn't read the last step's output, it's not an edge - it's two scripts.

## Also See
- [Doc 2127](../2127-loop-harness-engineering-anthropic/) - loop/harness engineering (the loop side; this is the graph companion)
- [Doc 994](../994-loop-engineering-taxonomy/) - ZAO's loop-engineering taxonomy
- [Doc 928](../928-agent-loop-best-practices/) - the 36-rule agent-loop rulebook
- `.claude/rules/agent-loops.md` (rule 7: subagents for bounded work = the fan-out primitive), `.claude/rules/anti-fabrication.md` (adversarial verify), `.claude/rules/claude-usage.md` (don't spend the cap on deterministic merges)

## Next Actions
| Action | Owner | Type | By When |
|--------|-------|------|---------|
| When a task is genuine fan-out/fan-in (audit N files, review M dimensions), use the `Workflow` tool with a separate verify stage - not a longer single loop | @Zaal | practice | 2026-08-12 |
| Confirm ZAO code-review workflows keep the verifier in its own node (adversarial-verify), per the article's key insight | @Zaal | check | 2026-08-12 |
| No new framework/runtime - decision recorded (ZAO's Workflow tool is the graph engine) | @Zaal | decision | wontfix |

## Sources
- DevCompass, "Loop Engineering vs Graph Engineering, Part 2: Building It in Code" (newsletter body, author's own words) - `[FULL]` - the run_loop code, the edge test, the diamond pattern, the Zig->Rust example (750k lines / 99.8% / 11 days), the 4-framework comparison.
- [devcompass.ai blog post](https://www.devcompass.ai/blog/loop-engineering-vs-graph-engineering-part-2-building-it-in-code) - `[PARTIAL - JS-walled]` - WebFetch returned only the page header (JS-rendered SPA); the newsletter body above is the same author's full text of the argument, so the doc is not written off a snippet.
- ZAO grounding (code is ground truth): the `Workflow` tool (dynamic workflows: pipeline/parallel/agent), `.claude/rules/agent-loops.md`, [Doc 2127](../2127-loop-harness-engineering-anthropic/) - `[FULL]`.
