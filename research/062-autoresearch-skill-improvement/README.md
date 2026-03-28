# 62 — Autoresearch: Autonomous Skill & Prompt Improvement

> **Status:** Research complete
> **Date:** March 18, 2026
> **Goal:** Document the autoresearch method for autonomously improving Claude Code skills — apply it to ZAO OS's own skill library

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Method** | Adopt Karpathy's autoresearch loop for iteratively improving ZAO OS skills (especially `/zao-research`) |
| **Scoring** | Use binary yes/no checklist items (3-6 questions) — not subjective 1-10 ratings |
| **Loop size** | One atomic change per iteration; keep or revert based on score delta |
| **First target** | `/zao-research` skill — most frequently used, highest ROI for improvement |
| **Implementation** | Install `uditgoenka/autoresearch` skill or build a lightweight version tailored to ZAO OS |
| **Safety** | Always save improved skill as separate file; original stays untouched until validated |

---

## What Is Autoresearch?

Andrej Karpathy (OpenAI co-founder, former Tesla AI lead) released **autoresearch** in March 2026 — a 630-line MIT-licensed script that lets an AI agent autonomously run experiments in a loop.

**Original use case:** Optimize neural network training code. An agent modifies `train.py`, runs a 5-minute training run, evaluates validation bits-per-byte (val_bpb), keeps improvements, reverts regressions. ~12 experiments/hour, ~100 overnight.

**Generalized use case:** The same loop works on anything measurable — prompts, skills, landing pages, cold outreach, newsletter intros, website performance. Multiple community forks adapted it for Claude Code skills.

---

## The Core Loop

```
┌─────────────────────────────────────────┐
│  1. REVIEW — read current skill + logs  │
│  2. PICK — choose what to change next   │
│  3. CHANGE — one atomic modification    │
│  4. COMMIT — git snapshot (rollback)    │
│  5. TEST — run skill on test inputs     │
│  6. SCORE — binary checklist evaluation │
│  7. DECIDE — keep if better, revert if  │
│     worse, fix if crashed               │
│  8. LOG — record iteration + metric     │
│  9. REPEAT                              │
└─────────────────────────────────────────┘
```

### Key Principles

1. **One change per iteration** — atomic modifications for clean debugging
2. **Mechanical verification only** — no subjective judgments, only yes/no checks
3. **Git is memory** — every experiment committed with `experiment:` prefix
4. **Automatic rollback** — failures revert via `git revert`
5. **Simplicity wins** — equal results + less code = KEEP
6. **Read before write** — understand full context before modifying

---

## The Checklist: How Scoring Works

The only human input: define 3-6 binary yes/no questions that define "good output."

### Why Binary Checks Beat Ratings

| Approach | Problem |
|----------|---------|
| "Rate quality 1-10" | Subjective, inconsistent across runs, model drifts |
| "Does headline include a specific number?" YES/NO | Deterministic, reproducible, comparable |

### Checklist Design Rules

- Each item must be **mechanically verifiable** (an LLM can consistently answer yes/no)
- 3-6 items is the sweet spot — more than 6 and the skill starts gaming the checklist
- Cover different dimensions (structure, content quality, constraints, tone)
- Include at least one **negative check** (banned patterns, buzzwords, anti-patterns)

### Example: Landing Page Copy Skill

```
1. Does the headline include a specific number or result?
2. Is the copy free of buzzwords (revolutionary, synergy, cutting-edge, next-level)?
3. Does the CTA use a specific verb phrase?
4. Does the first line call out a specific pain point?
5. Is the total copy under 150 words?
```

Score = % of checks passing across N test runs. Baseline 56% → improved to 92% after 4 rounds.

---

## Claude Code Implementations

### uditgoenka/autoresearch (Most Complete)

**8-phase loop** with 7 specialized subcommands:

| Subcommand | Purpose |
|------------|---------|
| `/autoresearch:plan` | Interactive setup wizard (goal, scope, metric, direction) |
| `/autoresearch:debug` | Scientific bug hunting with falsifiable hypotheses |
| `/autoresearch:fix` | Error crushing until zero remain |
| `/autoresearch:security` | STRIDE + OWASP autonomous audit (read-only) |
| `/autoresearch:ship` | Universal shipping workflow (9 domain types) |
| `/autoresearch:scenario` | Explores situations across 12 dimensions |
| `/autoresearch:predict` | Multi-persona expert analysis before execution |

**Key features:**
- Guard mechanism: verify (goal) + guard (safety net, "did anything else break?")
- Crash recovery: syntax errors fix immediately, runtime errors max 3 retries, hangs revert after timeout
- TSV results logging: `iteration | commit | metric | delta | status | description`
- Progress summaries every 10 iterations
- Auto-detects domain type and generates appropriate checklists

### drivelineresearch/autoresearch-claude-code

Pure skill port focused on ML experiment loops. Lighter weight, fewer subcommands.

### wanshuiyin/Auto-claude-code-research-in-sleep (ARIS)

Markdown-only skills for autonomous ML research with cross-model review loops. Framework-agnostic — works with Claude Code, Codex, OpenClaw, or any LLM agent.

---

## Real-World Results

| Who | What | Result |
|-----|------|--------|
| Karpathy | nanochat GPT-2 training optimization | ~100 experiments overnight, measurable val_bpb improvements |
| Tobias Lutke (Shopify CEO) | Internal AI model optimization | 37 experiments overnight, 19% performance gain |
| Article author | Landing page copy skill | 56% → 92% checklist pass rate, 4 rounds, 3 changes kept |
| Fortune report | General observation | ~12 experiments/hour, runs while you sleep |

---

## How to Apply to ZAO OS Skills

### Step 1: Define the Checklist for `/zao-research`

What makes a good research output from the `/zao-research` skill?

```
1. Are recommendations/key decisions placed at the top of the document?
2. Is the research specific to ZAO OS (references the tech stack, community, or codebase)?
3. Does the document include specific numbers, versions, or dates?
4. Are sources linked at the bottom?
5. Does the document cross-reference existing research or codebase state?
6. Is it actionable (tells you what to do, not just what exists)?
```

### Step 2: Define Test Inputs

Representative research prompts that exercise different skill paths:

```
- "Research WebRTC for live audio rooms in a Next.js app"
- "What governance models do other DAOs use for music communities?"
- "Compare XMTP v4 MLS vs v3 for encrypted group messaging"
- "How should we implement Hats Protocol tree for ZAO roles?"
```

### Step 3: Run the Loop

For each iteration:
1. Run `/zao-research` on each test input
2. Score each output against the 6-item checklist
3. Calculate pass rate (% of checks passing across all test runs)
4. If pass rate improved → keep the skill change
5. If pass rate stayed same or dropped → revert
6. Log results in TSV

### Step 4: Common Improvement Patterns

Based on autoresearch community findings, these changes most often improve skills:

| Change Type | Example |
|-------------|---------|
| **Add a worked example** | Include a sample research doc showing ideal structure |
| **Add negative constraints** | "NEVER write generic advice that applies to any project" |
| **Add a pre-flight checklist** | Force the skill to verify preconditions before generating |
| **Reorder instructions** | Put the most-violated rule first |
| **Add banned patterns** | List specific anti-patterns to avoid |
| **Tighten scope language** | "ZAO OS's 100-member Farcaster music community" not "the project" |

---

## Installation Options

### Option A: Install uditgoenka/autoresearch

```bash
# If using Cowork plugin system
/plugin marketplace add uditgoenka/autoresearch

# Or manual install
git clone https://github.com/uditgoenka/autoresearch.git /tmp/autoresearch
cp -r /tmp/autoresearch/.claude/skills/autoresearch .claude/skills/
cp -r /tmp/autoresearch/.claude/commands/autoresearch .claude/commands/
```

### Option B: Lightweight DIY Loop

For ZAO OS, a simpler approach may work — a single skill that:
1. Takes a target skill path + checklist + test inputs
2. Runs the loop for N iterations
3. Saves improved version + changelog

This avoids the full plugin system while getting 80% of the value.

---

## Sources

- [Karpathy autoresearch (GitHub)](https://github.com/karpathy/autoresearch)
- [uditgoenka/autoresearch — Claude Code skill (GitHub)](https://github.com/uditgoenka/autoresearch)
- [drivelineresearch/autoresearch-claude-code (GitHub)](https://github.com/drivelineresearch/autoresearch-claude-code)
- [wanshuiyin/ARIS (GitHub)](https://github.com/wanshuiyin/Auto-claude-code-research-in-sleep)
- [Fortune: 'The Karpathy Loop'](https://fortune.com/2026/03/17/andrej-karpathy-loop-autonomous-ai-agents-future/)
- [VentureBeat: Karpathy's autoresearch](https://venturebeat.com/technology/andrej-karpathys-new-open-source-autoresearch-lets-you-run-hundreds-of-ai)
- [MindStudio: AutoResearch for Claude Code Skills](https://www.mindstudio.ai/blog/claude-code-autoresearch-self-improving-skills)
- [Analytics Vidhya: nanochat GPT-2 training](https://www.analyticsvidhya.com/blog/2026/03/nanochat-gpt-2-training/)
