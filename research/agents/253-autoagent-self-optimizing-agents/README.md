# 253 — AutoAgent: Self-Optimizing Agent Harnesses (Kevin Gu / ThirdLayer)

> **Status:** Research complete
> **Date:** April 3, 2026
> **Goal:** Evaluate AutoAgent's self-optimizing agent loop and its implications for ZAO OS agent infrastructure (ZOE, autoresearch, skills)

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Adopt AutoAgent now?** | SKIP for direct adoption — Python-only, GPT-5 default, 7 commits, 302 stars in 24 hours. Too early and wrong language for ZAO's TypeScript stack |
| **Core concept** | ABSORB the meta/task agent split pattern into ZAO's existing `/autoresearch` skill — it already implements the same keep/discard loop |
| **Model empathy insight** | USE same-model pairings when building ZOE's agent chains — Claude meta-agent + Claude task agent outperforms cross-model pairings because the meta-agent understands how the inner model reasons |
| **Trace-based learning** | UPGRADE `/autoresearch` to log full reasoning traces, not just scores — AutoAgent showed improvement rate drops hard without trajectory visibility |
| **Overfitting guard** | ADD AutoAgent's self-reflection check to autoresearch: "If this exact task disappeared, would this still be a worthwhile improvement?" — prevents metric gaming |
| **Emergent patterns** | STEAL 3 patterns for ZOE: spot-checking (run isolated tasks for small edits), forced verification loops (budget extra turns for self-correction), progressive disclosure (dump long contexts to files) |
| **Watch the product** | WATCH ThirdLayer's upcoming product launch — if they ship a hosted meta-agent service, it could optimize ZOE's harness overnight without custom infrastructure |
| **Related research** | Cross-references Doc 161 (harness engineering), Doc 239 (agent frameworks), Doc 227 (agentic workflows) |

---

## What AutoAgent Is

**Repository:** [github.com/kevinrgu/autoagent](https://github.com/kevinrgu/autoagent) — MIT license, 302 stars in <24 hours, 7 commits, all co-authored with Claude Opus 4.6.

**Creator:** Kevin Gu ([@kevingu](https://x.com/kevingu)), CTO of ThirdLayer (YC W25). Harvard math/stats, previously Jump Trading, Meta FAIR, IBM Research.

**Company:** ThirdLayer builds Dex ("Cursor for knowledge work") — a browser extension that learns from real workflows. 2-person team (Kevin Gu + Regina Lin). Product launching soon around self-configuring agents.

AutoAgent is a meta-agent loop: instead of manually engineering an agent's system prompt, tools, and orchestration, you write a `program.md` file with objectives, and a meta-agent autonomously edits the `agent.py` harness, runs benchmarks, keeps improvements, discards failures, and repeats for 24+ hours.

### The Loop

1. Meta-agent reads `program.md` (human-written objectives and constraints)
2. Meta-agent edits `agent.py` (system prompt, tools, orchestration logic)
3. System runs Harbor-format benchmarks in 1,000s of parallel Docker sandboxes
4. Scores compared: keep improvements, revert failures
5. Meta-agent reads failure traces to understand *why* something broke
6. Repeat autonomously — no human in the loop

### Architecture (Deliberately Minimal)

```
autoagent/
├── program.md          (7.0KB) — Human objectives, constraints, iteration directives
├── agent.py            (8.5KB) — OpenAI Agents SDK harness (editable section + fixed Harbor adapter)
├── agent-claude.py     (9.7KB) — Claude SDK alternative (Haiku, extended thinking 10K tokens)
├── Dockerfile.base     — Python 3.12 container, uv package manager
└── pyproject.toml      — Dependencies: openai-agents, harbor, pandas, numpy
```

---

## Benchmark Results

| Benchmark | AutoAgent Score | Previous #1 | Significance |
|-----------|----------------|-------------|--------------|
| **SpreadsheetBench Verified** (400 tasks) | **96.5%** | Tetra-Beta-2 at 94.25% | New SOTA — 2.25 point lead. Remarkable: benchmark designed to be extremely hard (Copilot in Excel only ~20%, human experts ~70%) |
| **TerminalBench 2.0** (89 tasks) | **55.1%** (GPT-5 score) | Letta Code/Warp at 59.1%, Claude Code at 57.9% | Competitive but mid-pack. Meta-Harness (Stanford/Anthropic) hit 76.4% with Opus 4.6 |

**SpreadsheetBench** (Renmin University, NeurIPS 2024): 912 real questions from Excel forums, 2,729 test cases. The V1 Full (912 tasks) top score is only 70.48% — AutoAgent's 96.5% is on the Verified 400-task subset.

**TerminalBench 2.0** (Stanford/Laude Institute, ICLR 2026): 89 Dockerized tasks across software engineering, ML, system admin, security. The 55.1% score is specifically the "highest GPT-5 score" — every other entry was hand-engineered.

---

## Key Insights Worth Stealing

### 1. Meta/Task Agent Split

> "We tried one agent improving itself. Didn't work. Being good at a domain and being good at improving at that domain are different capabilities."

This validates ZAO's existing `/autoresearch` architecture which separates the iteration controller from the task executor. The split lets each specialize.

### 2. Model Empathy (Same-Model Pairing)

> "Claude meta-agent + Claude task agent outperformed Claude meta-agent + GPT task agent. Same-model pairings win because the meta-agent writes harnesses the inner model actually understands."

**ZAO implication:** When building ZOE's agent chains or multi-agent workflows (`src/lib/` agent code, OpenClaw on VPS), USE the same model family throughout. Don't mix Claude orchestrator with GPT worker — the orchestrator can't predict how the worker will interpret instructions.

### 3. Traces > Scores

> "When we only gave scores without trajectories, improvement rate dropped hard. Understanding *why* something improved matters as much as knowing that it improved."

**ZAO implication:** `/autoresearch` currently tracks pass/fail. UPGRADE to log full reasoning traces per iteration so the meta-loop can make targeted improvements.

### 4. Overfitting Guard

> "The meta-agent gets lazy, inserting rubric-specific prompting so the task agent can game metrics."

Their solution: force self-reflection — "If this exact task disappeared, would this still be a worthwhile harness improvement?" This is directly applicable to autoresearch iterations where Claude might optimize for the specific test case rather than the general capability.

### 5. Emergent Behaviors (Not Programmed)

| Behavior | What It Does | ZAO Application |
|----------|-------------|-----------------|
| **Spot checking** | Run isolated tasks for small edits instead of full suite | Speed up autoresearch iterations — test single scenarios before full eval |
| **Forced verification loops** | Budget extra turns for self-correction | Already in autoresearch's verify step, but formalize: main budget for task, bonus budget for checking |
| **Writing tests** | Agent builds its own unit tests per task | ZOE could auto-generate verification scripts for its own outputs |
| **Progressive disclosure** | Dump long contexts to files when results overflow | Use filesystem (Supabase or local) to offload verbose agent context — matches Doc 161's virtual filesystem pattern |
| **Orchestration logic** | Built task-specific subagents and handoffs | ZOE already uses this via OpenClaw; validates the pattern |

### 6. "Seeing Like an Agent" (Thariq / Claude Code Team)

Kevin explicitly references Thariq Shihipar's (Anthropic) Feb 27, 2026 post on building Claude Code:

- Most agent failures are tool design problems, not model problems
- Progressive disclosure beats adding more tools
- AskUserQuestion went through 3 failed iterations before the right design
- Prompt caching is essential infrastructure for long-running agents

AutoAgent operationalizes this: the meta-agent already has "implicit understanding of itself" — its own limitations and tendencies — so when it sees a failure at step 14, it understands the failure mode and corrects it.

---

## Comparison of Self-Optimizing Agent Frameworks

| Framework | Approach | What It Optimizes | Language | Stars | License | ZAO Fit |
|-----------|----------|-------------------|----------|-------|---------|---------|
| **AutoAgent** (ThirdLayer) | Meta-agent edits single harness file | Prompts, tools, orchestration | Python | 302 | MIT | WATCH — too early, Python-only |
| **Meta-Harness** (Stanford/Anthropic) | 10M token context, filesystem proposals | Full harness code + tools | Python | Academic | Research | SKIP — academic, not productized |
| **DSPy** (Stanford) | Compile-time prompt optimization | Few-shot examples, templates | Python | 22K+ | MIT | SKIP — optimizes prompts, not harnesses |
| **ADAS** (ICLR 2025) | Meta Agent Search | Agent architecture in code | Python | Academic | Research | SKIP — closest concept but academic |
| **TextGrad** (Stanford) | "Autograd for text" | Instance-level text refinements | Python | 2K+ | MIT | SKIP — test-time only, not harness-level |
| **ZAO /autoresearch** (built-in) | Keep/discard loop with measurable metric | Any task with eval | TypeScript | N/A | Internal | **USE — already built, same philosophy** |

**Key finding:** AutoAgent's core loop is conceptually identical to ZAO's `/autoresearch` skill. The main innovation is applying it to agent harness engineering specifically, with Docker sandboxing for safe parallel evaluation. ZAO doesn't need AutoAgent — it needs to apply autoresearch principles to ZOE's harness optimization.

---

## ZAO OS Integration

### What's Already Built

| Component | File | Relevance |
|-----------|------|-----------|
| `/autoresearch` skill | `.claude/skills/autoresearch/` | Already implements keep/discard loop — same core concept as AutoAgent |
| `/autoresearch:fix` | `.claude/skills/autoresearch/` | Autonomous fix loop — iterative repair until zero errors remain |
| ZOE agent | OpenClaw on VPS (31.97.148.88) | Task agent that could benefit from harness optimization |
| Agent frameworks eval | `research/239-agent-frameworks-infrastructure-evaluation/` | Doc 239 evaluated 16 frameworks — AutoAgent is a new entry |
| Harness engineering | `research/161-agent-harness-engineering-langchain/` | Doc 161 covered LangChain's approach — AutoAgent validates the same principles |

### Actionable Upgrades

1. **Add trace logging to `/autoresearch`** — Currently tracks pass/fail. Add full reasoning trace capture so iterations can learn *why* something worked, not just *that* it worked.

2. **Add overfitting guard to `/autoresearch`** — After each successful iteration, add a self-reflection step: "If this exact task disappeared, would this still be a worthwhile improvement?"

3. **Apply autoresearch to ZOE's harness** — Use `/autoresearch` to optimize ZOE's `SOUL.md`, `AGENTS.md`, and tool configurations on the VPS. Run iterations overnight against a benchmark suite of community tasks.

4. **Same-model pairing for ZOE chains** — When ZOE delegates to sub-agents, ensure all agents in the chain use the same model family (all Claude or all GPT, never mixed).

5. **Spot-check pattern for skills** — When running `/autoresearch` on skills, test individual scenarios before running the full eval suite. Saves compute and accelerates iteration.

---

## Sources

- [AutoAgent GitHub repo](https://github.com/kevinrgu/autoagent) — MIT license, 302 stars, 7 commits
- [Kevin Gu announcement](https://x.com/kevingu/status/2039843234760073341) — April 2, 2026
- [SpreadsheetBench leaderboard](https://spreadsheetbench.github.io/) — NeurIPS 2024, Renmin University
- [TerminalBench 2.0](https://www.tbench.ai/) — ICLR 2026, Stanford/Laude Institute
- [TerminalBench Hard leaderboard](https://artificialanalysis.ai/evaluations/terminalbench-hard) — Artificial Analysis
- [Thariq "Seeing like an Agent"](https://x.com/trq212/status/2027463795355095314) — Feb 27, 2026, Anthropic/Claude Code team
- [Meta-Harness paper](https://arxiv.org/abs/2603.28052) — Stanford/Anthropic, March 2026
- [ThirdLayer / Dex](https://www.thirdlayer.inc/) — YC W25, browser AI copilot
- [ThirdLayer YC profile](https://www.ycombinator.com/companies/joindex)
- [ADAS paper](https://arxiv.org/abs/2408.08435) — ICLR 2025
- [Harbor framework](https://github.com/harbor-framework/harbor) — Standardized agent evaluation
- [DSPy](https://github.com/stanfordnlp/dspy) — Stanford prompt optimization
