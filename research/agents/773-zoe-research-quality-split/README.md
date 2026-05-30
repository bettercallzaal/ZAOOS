---
topic: agents
type: changelog
status: implemented
last-validated: 2026-05-30
related-docs: "772, 771, 770, 759"
original-query: "st-1 scored 58/100 ... Do all of these and just make it deeper and better functioning"
scope: "bot/src/zoe/{decompose,workers}.ts, critics/research-critic.ts, .claude/agents/{doc-extractor,research-worker}.md"
---

# 773 - ZOE research quality: split internal extraction from web research

> In the first live dispatch, `st-1` ("read doc 763, extract the 7 upgrades") scored 58/100. Root cause: `research-worker -> research-critic` is hardwired, and research-critic grades against the /zao-research web-research-doc bar (3+ external URLs, a community source). st-1 was an INTERNAL extraction with no web component, so it lost ~40 points for sources it was never meant to gather. The extraction was fine; the rubric was wrong. This also polluted the Gap-5 learn loop (mis-attributing it as research-worker underperformance). Per Zaal: do all the fix options + make it deeper. This unifies them.

## The design: one axis, two workers, source-aware critic

The real distinction is **internal vs external**. We make that a first-class routing axis instead of overloading research-worker.

### 1. New worker: `doc-extractor` (internal)
`.claude/agents/doc-extractor.md` + `WORKER_CONFIG` entry. Read-only (`Read`/`Glob`/`Grep`, **no web tools**), Haiku, `$0.5` cap, graded by **task-result-critic** (faithfulness/goal-fit), not research-critic. Returns a grounded `Extraction / Grounding / Gaps` block — every claim traced to a doc section or `file:line`, anything missing goes in Gaps (never guessed). This is the right worker for "read doc N", "summarize our X", "pull decisions from Y", "extract from the codebase".

### 2. Decompose routing (the per-task selection)
The decompose prompt now distinguishes:
- **research-worker** → EXTERNAL/web only ("state of the art on X", competitor scans). Explicitly warned not to route a pure internal read here.
- **doc-extractor** → INTERNAL ("the source is something WE already wrote").
The worker split *is* the per-task critic routing — each worker carries its own critic.

### 3. Source-aware research-critic (belt + suspenders)
Even if research-worker ends up on an internal-leaning task, `research-critic` now detects internal-only research (cites ZAO doc numbers / file paths, no external URLs) and **waives Hard Reqs 4 (3+ URLs), 7 (community source), 8 (URL liveness)** — scoring instead on faithful grounding, >=3 sourced specifics, structure, and anti-fabrication. An accurate internal digest can now score 90-100 instead of being capped ~58. The full web bar still applies to genuine web-research docs.

### 4. Deeper/better
- `research-worker.md`: scope sharpened to the open web; hands internal-only asks back to doc-extractor instead of padding with web sources to satisfy the rubric.
- `doc-extractor.md`: faithfulness-first contract (verbatim quotes for decisions/numbers, explicit Gaps, no fabricated citations).

## Why this fixes the 58
st-1 ("read doc 763") now routes to **doc-extractor → task-result-critic**, which grades "did you faithfully extract the 7 upgrades + PR list from doc 763" — exactly the task. No web-source penalty. And the learn loop stops mis-blaming research-worker.

## Tests
`workers.test.ts` +2: `doc-extractor` is a wired `ClaudeWorkerKind` with a positive budget cap; research-worker still configured and capped >= doc-extractor. 88 zoe tests pass; touched files `tsc` clean.

The routing (decompose prompt) and the source-aware rubric are LLM-prompt changes → validated by re-running the doc 763 plan on the VPS: st-1 should route to doc-extractor and score in the 80s-90s.

## Deploy note
Stacks on doc 772 (`ws/zoe-orchestrator-ux-772`). Merge order: 733 → 738 → 773 (or merge the tip, which contains all three). Re-run the doc 763 plan after deploy to confirm st-1 routes to doc-extractor and scores high.
