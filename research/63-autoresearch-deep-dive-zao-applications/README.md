# 63 — Autoresearch Deep Dive: Implementations & ZAO OS Applications

> **Status:** Research complete
> **Date:** March 18, 2026
> **Goal:** Map every autoresearch implementation to specific ZAO OS use cases — skills, code quality, governance, content, and API performance

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Install which repo** | `uditgoenka/autoresearch` — most complete, 7 subcommands, MIT license, works with ZAO's `.claude/skills/` structure |
| **First target** | `/zao-research` skill (already improved from ~55% → ~85% in doc 62) — finish to 95% |
| **Second target** | `/next-best-practices` skill — 18 reference files, high complexity, likely has consistency issues |
| **Code quality loop** | Use `/autoresearch:fix` on `npm run lint` + `npm run build` — crush errors to zero autonomously |
| **Security loop** | Use `/autoresearch:security` for OWASP audit of `src/app/api/` routes — read-only, no code changes |
| **Governance content** | Build a proposal-quality skill with checklist: actionable title, budget, timeline, Respect-weighted impact |
| **Dashboard** | Use the TSV results logging + auto-refresh HTML dashboard to track improvement across all skills |

---

## The Three Autoresearch Implementations Compared

| Feature | uditgoenka/autoresearch | drivelineresearch/autoresearch-claude-code | wanshuiyin/ARIS |
|---------|------------------------|-------------------------------------------|-----------------|
| **License** | MIT | MIT | MIT |
| **Architecture** | Skills + Commands (`.claude/`) | Skills + Hook (`UserPromptSubmit`) | Markdown-only |
| **Subcommands** | 7 (plan, debug, fix, security, ship, scenario, predict) | 2 (optimize, off) | Research-focused |
| **Guard mechanism** | Yes (verify + guard dual-check) | No | No |
| **Crash recovery** | Yes (syntax → fix immediately, runtime → 3 retries, hang → revert) | Basic (revert on fail) | Manual |
| **Results format** | TSV with progress summaries every 10 iterations | JSONL (`autoresearch.jsonl`) | Markdown logs |
| **Domain detection** | Auto-detects 9 domains (code, content, marketing, etc.) | ML-focused, adaptable | ML-focused |
| **Works with ZAO** | Yes — drop into `.claude/skills/` and `.claude/commands/` | Yes — needs hook setup | Yes — framework-agnostic |
| **Best for** | Full autonomous improvement | Simpler ML optimization | Cross-model research |

**Winner for ZAO OS: `uditgoenka/autoresearch`** — the guard mechanism prevents regressions (critical when improving skills that touch the 62-doc research library), and the 7 subcommands cover all our use cases.

---

## Installation for ZAO OS

```bash
# Clone and copy into ZAO OS
git clone https://github.com/uditgoenka/autoresearch.git /tmp/autoresearch
cp -r /tmp/autoresearch/skills/autoresearch/ .claude/skills/autoresearch/
cp -r /tmp/autoresearch/commands/autoresearch/ .claude/commands/autoresearch/

# Verify installation
ls .claude/skills/autoresearch/SKILL.md
ls .claude/commands/autoresearch/plan.md
```

After install, these commands become available:
- `/autoresearch` — main loop (bounded or unbounded)
- `/autoresearch:plan` — interactive setup wizard
- `/autoresearch:debug` — scientific bug hunting
- `/autoresearch:fix` — error crushing
- `/autoresearch:security` — OWASP/STRIDE audit
- `/autoresearch:ship` — shipping checklist
- `/autoresearch:predict` — multi-persona analysis

---

## How the Eval Loop Works (Detailed)

### Phase 1: Define Binary Assertions

Each assertion is a yes/no question about the output. No ambiguity. No subjectivity.

**Structure per test case:**
```
Input: "Research WebRTC for live audio rooms"
Assertions:
  1. Does the output contain a "Key Decisions" table at the top? → YES/NO
  2. Does it mention "Next.js 16" or "Supabase" or "Neynar"? → YES/NO
  3. Does it include at least 3 linked sources? → YES/NO
  4. Is it under 3000 words? → YES/NO
  5. Does it cross-reference an existing research doc by number? → YES/NO
```

### Phase 2: Score Calculation

Run N test cases (recommended: 4-6 for skills, 20-30 for code). Apply all assertions to each output.

```
Pass rate = (passing assertions) / (total assertions) × 100

Example: 4 test cases × 5 assertions = 20 total checks
If 16 pass → 80% pass rate
```

**Disaggregate by assertion** to find which dimension fails most:
```
Assertion 1 (recommendations at top): 4/4 = 100%
Assertion 2 (ZAO-specific):           3/4 = 75%
Assertion 3 (sources linked):          2/4 = 50%  ← FIX THIS FIRST
Assertion 4 (under 3000 words):        4/4 = 100%
Assertion 5 (cross-references):        3/4 = 75%
```

### Phase 3: Improve → Measure → Keep/Revert

The agent reads the failure breakdown, identifies the weakest assertion, makes ONE targeted change to the skill prompt, and re-runs all test cases.

**Common improvement patterns (from community data):**

| Pattern | Success Rate | Example |
|---------|-------------|---------|
| Add a worked example | ~85% effective | Show what a good output looks like |
| Add negative constraint | ~80% effective | "NEVER omit sources" |
| Reorder instructions | ~70% effective | Put most-violated rule first |
| Add banned patterns list | ~65% effective | "NEVER use: consider, might, could" |
| Tighten word count | ~50% effective | Sometimes hurts quality |
| Add pre-flight checklist | ~75% effective | "Before generating, verify X, Y, Z" |

### Phase 4: Convergence

The loop stops when:
- Score hits 95%+ three times in a row, OR
- N iterations completed (bounded mode), OR
- User interrupts

Typical convergence: 3-8 iterations for skills, 30-100 for ML training.

---

## ZAO OS Application Map: 7 Concrete Use Cases

### 1. Skill Improvement: `/zao-research`

**Already started in doc 62.** Current estimated score: ~85% after 4 manual iterations.

| Metric | Command | Direction |
|--------|---------|-----------|
| Checklist pass rate | Run skill on 4 test prompts, score 6 assertions each | Higher is better |

**Test prompts:**
```
1. "Research WebRTC for live audio rooms in a Next.js app"
2. "What governance models do other DAOs use for music communities?"
3. "Compare XMTP v4 MLS vs v3 for encrypted group messaging"
4. "How should we implement Hats Protocol tree for ZAO roles?"
```

**Assertions:**
```
1. Recommendations/decisions table at the top?
2. References ZAO OS tech stack (Next.js 16, Supabase, Neynar, Farcaster)?
3. Includes specific numbers, versions, or dates?
4. Sources linked with URLs at the bottom?
5. Cross-references existing research doc by number?
6. Actionable (uses "USE" or "DO" not "consider" or "might")?
```

**Guard:** Existing research docs not modified. Skill still invocable.

### 2. Skill Improvement: `/next-best-practices`

ZAO OS has an 18-file Next.js best practices skill at `.agents/skills/next-best-practices/`. This skill guides every component and route handler decision.

| Metric | Command | Direction |
|--------|---------|-----------|
| Advice accuracy vs Next.js 16 docs | Score against 5 common patterns | Higher is better |

**Assertions:**
```
1. Does it recommend async request APIs (cookies(), headers() are async in Next.js 16)?
2. Does it mention "use client" only for interactive components?
3. Does it recommend next/dynamic for heavy components?
4. Does it use Tailwind v4 syntax (not v3)?
5. Does it reference App Router patterns (not Pages Router)?
```

### 3. Code Quality: `/autoresearch:fix`

Run against ZAO OS's existing lint and build:

```bash
# Metric command:
npm run lint 2>&1 | grep -c "error" | tr -d ' '
# Direction: lower is better (0 = perfect)

# Guard command:
npm run build
# Must still succeed after each fix
```

**Scope:** `src/**/*.{ts,tsx}` — only modify source code.

This crushes ESLint errors autonomously. Each iteration fixes one error type, runs lint + build to verify, keeps if both pass, reverts if build breaks.

### 4. Security Audit: `/autoresearch:security`

**Read-only mode.** Scans API routes for OWASP Top 10 vulnerabilities.

**Scope (read-only):** `src/app/api/**/*.ts`

**Checklist for each route:**
```
1. Does the route validate input with Zod?
2. Does it check session/auth before processing?
3. Does it avoid exposing server-only env vars?
4. Is user input sanitized before database queries?
5. Does it use NextResponse.json (not raw Response)?
```

ZAO OS already has `src/lib/validation/schemas.ts` with Zod schemas and `src/middleware.ts` with rate limiting. This audit verifies every route actually uses them.

**Existing work:** Doc 57 (`57-codebase-security-audit-march-2026`) found 1 critical + 4 high + 15 medium issues — all fixed. This loop catches regressions.

### 5. Governance Proposal Quality

ZAO OS has a built governance system (`src/app/api/proposals/route.ts`) with proposals, votes (Respect-weighted), and comments. Currently proposals are free-text.

**Build a `/proposal-quality` skill** that scores proposal drafts:

```
1. Does the title describe a specific, actionable change?
2. Does the body include a budget or resource estimate?
3. Does it include a timeline with at least one milestone date?
4. Does it reference how this affects ZAO community members?
5. Is it under 500 words (concise enough for governance voting)?
```

Then autoresearch the skill itself to make it produce better guidance. This is **meta-autoresearch** — improving the skill that improves proposals.

### 6. Research Doc Quality

Use autoresearch on the research library itself. Run assertions against existing docs to find quality gaps:

```bash
# Metric: count research docs passing all 6 quality checks
# Direction: higher is better

# Assertions (per doc):
1. Has "Key Decisions / Recommendations" section?
2. Contains a table with comparisons?
3. Has "Sources" section with URLs?
4. Mentions ZAO OS, /zao, or zaoos.com?
5. Contains dates or version numbers?
6. Has status and goal in the header?
```

This doesn't improve individual docs — it identifies which of the 63 docs need updates and prioritizes them.

### 7. API Route Consistency

Every API route in ZAO OS should follow the same pattern: session check → input validation → business logic → response. Autoresearch can verify consistency.

```
# Scope (read-only): src/app/api/**/route.ts
# Metric: count of routes following all patterns

# Assertions per route:
1. Imports and calls getSessionData()?
2. Uses Zod schema for input validation?
3. Returns NextResponse.json (not raw JSON)?
4. Has try/catch with error logging?
5. Includes appropriate HTTP status codes?
```

Currently 10+ API route files. Inconsistency → bugs.

---

## The Guard Mechanism: Why It Matters for ZAO OS

The guard prevents "metric gaming" — where a skill improves on the checklist but breaks something else.

**Example without guard:**
```
Iteration 3: Add "ALWAYS include 5+ sources" to zao-research skill
Result: Source count assertion goes from 50% → 100%
Side effect: Skill now fabricates sources to hit the count → worse quality
```

**Example with guard:**
```
Verify: checklist pass rate improved? → YES
Guard: Are all linked sources real URLs? → NO (3 fabricated)
Action: Rework, don't keep
```

For ZAO OS, good guards include:
- `npm run build` (nothing breaks)
- `npm run lint` (no new warnings)
- Schema validation (outputs match expected format)
- Existing test suite (if one exists)

---

## Results Tracking: The Dashboard

The autoresearch skill logs results in TSV format:

```tsv
iteration	commit	metric	delta	status	description
0	a1b2c3d	55.0	0.0	baseline	initial zao-research skill
1	b2c3d4e	65.0	+10.0	keep	added NEVER constraints
2	c3d4e5f	60.0	-5.0	revert	tightened word count (hurt quality)
3	d4e5f6g	80.0	+15.0	keep	added worked example
4	e5f6g7h	85.0	+5.0	keep	updated search patterns to use Grep tool
```

Every 10 iterations, a progress summary prints. The optional HTML dashboard auto-refreshes every 10 seconds showing:
- Score chart over time
- Pass/fail breakdown per assertion
- Change log with keep/revert status

---

## Recommended Rollout Order for ZAO OS

| Priority | Target | Subcommand | Effort | Expected Impact |
|----------|--------|------------|--------|-----------------|
| **1** | `/zao-research` skill | `/autoresearch` | 1 session | 85% → 95% — most-used skill |
| **2** | `/next-best-practices` skill | `/autoresearch` | 1 session | Catch stale Next.js 15 advice |
| **3** | Lint errors | `/autoresearch:fix` | 1 session | 0 errors, runs overnight |
| **4** | API route audit | `/autoresearch:security` | 1 session | Catch regressions from doc 57 fixes |
| **5** | Research doc quality | `/autoresearch` | 2 sessions | Identify + fix weak docs |
| **6** | Proposal quality skill | `/autoresearch` + build | 3 sessions | New skill for governance |
| **7** | API route consistency | `/autoresearch` | 1 session | Standardize all routes |

Start with #1 (already in progress). Each item is one Claude Code session — run it, walk away, come back to results.

---

## Key Insight: "Programming the program.md"

The deepest lesson from autoresearch: **you're not writing code. You're writing instructions that an agent follows to write code.**

For ZAO OS, this means:
- CLAUDE.md is the highest-leverage file in the repo
- Skills in `.claude/skills/` are the second-highest
- Improving these files with autoresearch has compounding returns — every future conversation benefits

Karpathy's original: "You're not touching any of the Python files. Instead, you are programming the `program.md` Markdown files that provide context to the AI agents."

For ZAO OS: You're not touching `src/`. You're improving the skills and CLAUDE.md that tell the agent HOW to touch `src/`. And then letting the agent improve those skills autonomously.

---

## Sources

- [Karpathy autoresearch (GitHub)](https://github.com/karpathy/autoresearch) — original 630-line MIT script
- [uditgoenka/autoresearch (GitHub)](https://github.com/uditgoenka/autoresearch) — most complete Claude Code skill, 7 subcommands
- [drivelineresearch/autoresearch-claude-code (GitHub)](https://github.com/drivelineresearch/autoresearch-claude-code) — lightweight skill port
- [wanshuiyin/ARIS (GitHub)](https://github.com/wanshuiyin/Auto-claude-code-research-in-sleep) — markdown-only, framework-agnostic
- [MindStudio: AutoResearch Eval Loop](https://www.mindstudio.ai/blog/autoresearch-eval-loop-binary-tests-claude-code-skills) — binary test methodology
- [MindStudio: AutoResearch for Claude Code Skills](https://www.mindstudio.ai/blog/karpathy-autoresearch-applied-to-claude-code-skills) — domain-specific applications
- [mager.co: Autoresearch Pattern](https://www.mager.co/blog/2026-03-14-autoresearch-pattern/) — universal pattern analysis
- [Fortune: 'The Karpathy Loop'](https://fortune.com/2026/03/17/andrej-karpathy-loop-autonomous-ai-agents-future/) — 700 experiments, real-world results
- [VentureBeat: Karpathy's autoresearch](https://venturebeat.com/technology/andrej-karpathys-new-open-source-autoresearch-lets-you-run-hundreds-of-ai) — open source release coverage
- [Doc 62 — Autoresearch: Skill Improvement](../62-autoresearch-skill-improvement/) — our initial research and first application to `/zao-research`
- [Doc 57 — Security Audit March 2026](../57-codebase-security-audit-march-2026/) — existing security findings to guard against regression
- [Doc 44 — Agentic Development Workflows](../44-agentic-development-workflows/) — Claude Code as persistent dev partner
