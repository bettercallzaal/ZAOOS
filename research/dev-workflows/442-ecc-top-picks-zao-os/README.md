### 442 — ECC Top Picks for ZAO OS Daily Workflow

> **Status:** Research complete
> **Date:** 2026-04-19
> **Goal:** Rank all 310 ECC artifacts (183 skills + 48 agents + 79 commands) by real daily-use probability for ZAO OS. Output top 10 install-now + 10 honorable mentions.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| Total install-now targets | USE top 10 listed below. 6 new installs + keep 4 of 5 existing (drop `ecc-strategic-compact`). |
| Full plugin install (D1) | SKIP — 183 skills collide with 70+ existing. Manual cherry-pick only. |
| AgentShield (D2) | INSTALL separately — high value but independent of plugin. `npx ecc-agentshield scan` on pre-ship. |
| MCPs (D3) | USE Context7 (Next.js 16/React 19 docs) + Playwright. SKIP Supabase MCP until read-only mode verified. |
| Tkinter dashboard (D4) | SKIP — terminal-native workflow, GUI not worth Python env bloat. |
| Rules merge (D5) | USE diff-and-merge ECC `rules/typescript/` additive lines only. 10-min pass. |
| Agents (D6) | USE `silent-failure-hunter` + `pr-test-analyzer` — both script-free single-file agents. |
| Existing `ecc-strategic-compact` | REMOVE — duplicates `/compact` + caveman compression. |
| Existing `ecc-content-hash-cache` | DEMOTE to honorable mention. Situational, not daily. |

---

## Filter Pass — What Was Dropped

Out of 310 ECC artifacts, filtered aggressively:

| Filter | Count Dropped | Examples |
|--------|---------------|----------|
| Framework not in ZAO stack | 40+ | Django (4), Spring (4), Laravel (5), NestJS, Nuxt, Rails, .NET, Kotlin/Android (6), Swift (5), Flutter/Dart (4) |
| Language not TS/Python | 25+ | Go (5), Rust (3), C++ (3), Perl (3), Java (3), C# (2), PHP, Ruby |
| Industry-specific (healthcare/logistics/finance) | 15+ | HIPAA, EMR, CDSS, carrier-mgmt, customs, inventory, production-scheduling, visa-translate, customer-billing |
| Direct dup of existing ZAO skill | 30+ | tdd-workflow, code-reviewer, planner, architect, plan cmd, refactor-cleaner, code-simplifier, e2e-testing, browser-qa, autonomous-loops, content-engine, brand-voice, article-writing, market-research, deep-research, research-ops, docs-lookup, git-workflow, chief-of-staff, frontend-design, design-system, team-builder, seo, agent-harness-construction |
| Requires ECC plugin bootstrap | 20+ | All hooks.json entries, continuous-learning-v2 full install, checkpoint/verify/instinct-*/prune/evolve commands, harness-audit, hooks |
| Niche / unclear value | 50+ | ck, santa-method, council, dmux-workflows, nanoclaw-repl, manim-video, ralphinho-rfc-pipeline, quality-nonconformance, returns-reverse-logistics, enterprise-agent-ops, claude-devfleet, openclaw-persona-forge, gan-* (4) |
| **Survived first pass** | **~40** | See Tier 1 + Tier 2 + honorable below |

---

## Tier 1 — TOP 10 INSTALL-NOW (ranked by daily-use probability)

| # | Name | Type | Why Daily Use | Replaces / Adds | Status |
|---|------|------|---------------|-----------------|--------|
| 1 | **nextjs-turbopack** | skill | Next.js 16 + Turbopack is ZAO OS's exact stack. Codifies FS caching, incremental bundling, dev vs prod config. | ADDS — no existing coverage | TO INSTALL |
| 2 | **postgres-patterns** | skill | Supabase = Postgres. Query optimization, indexing, RLS patterns across 50+ tables. | ADDS — complements `api-routes.md` rule | TO INSTALL |
| 3 | **silent-failure-hunter** | agent | 301 API routes with try/catch + `Promise.allSettled` = many places errors can silently die. Catches swallowed exceptions. | ADDS — superpowers code-reviewer doesn't specifically hunt silent failures | TO INSTALL |
| 4 | **database-migrations** | skill | Every Supabase schema change in `scripts/`. Codifies safe migration + rollback. | ADDS — no existing migration playbook | TO INSTALL |
| 5 | **ecc-verification-loop** | skill | Post-edit discipline: build + test + lint + typecheck cycle. Matches CLAUDE.md per-file commands. | ADDS structure to existing superpowers verification-before-completion | ALREADY INSTALLED |
| 6 | **hookify** (+ `/hookify`, `/hookify-configure`, `/hookify-list`) | skill + commands | Create hook rules from conversation patterns. Easier than editing `settings.json` raw. Solves the "automate this behavior" asks. | ADDS — no existing hook-creation tool | TO INSTALL |
| 7 | **ecc-security-review** | skill | OWASP checklist + cloud infra patterns. Complements built-in `/security-review`. | ENHANCES existing /security-review | ALREADY INSTALLED |
| 8 | **ecc-eval-harness** | skill | Eval-driven dev for VAULT/BANKER/DEALER agents — measurable PnL/slippage/trade-count evals. | ADDS — autoresearch is iteration, eval-harness is evaluation | ALREADY INSTALLED |
| 9 | **agent-introspection-debugging** | skill | Debug ZAO agents when they loop or drift (VAULT/BANKER/DEALER, ZOE, ROLO). Capture → diagnose → recover → report. | ADDS — direct fit for agent debugging | TO INSTALL |
| 10 | **skill-stocktake** (+ `/skill-stocktake`) | skill | Audit quality of ZAO's 50+ skills. Quick scan (changed only) + Full mode. Prevents skill-bloat. | ADDS — meta-skill ZAO needs given skill count | TO INSTALL |

---

## Tier 2 — Honorable Mentions (install on demand, not daily)

| # | Name | Type | When to Install |
|---|------|------|-----------------|
| H1 | **continuous-learning-v2 + instinct system** | skill family | Only if/when full plugin install path chosen. High value but blocked by bootstrap coupling. |
| H2 | **pr-test-analyzer** | agent | Pair with `/review` when shipping test-heavy features. Checks behavioral coverage vs line coverage. |
| H3 | **mcp-server-patterns** | skill | When building/modifying ZAO's existing MCP server (doc 232). |
| H4 | **rules-distill** | skill | Periodic rule-audit pass — scan skills for repeated principles, promote to `.claude/rules/`. |
| H5 | **gateguard** | skill | If hasty-edit issues surface. Fact-forcing gate measurably improves output +2.25 pts. |
| H6 | **architecture-decision-records** | skill | When shipping new major module (agent squad, ZID, Quilibrium). |
| H7 | **canary-watch** | skill | Before risky Vercel deploy. |
| H8 | **deployment-patterns** | skill | Vercel patterns reference. |
| H9 | **prompt-optimizer** | skill | When tuning VAULT/BANKER/DEALER or ZOE persona prompts. |
| H10 | **opensource-forker / opensource-packager / opensource-sanitizer** | skill family | When spinning up COC Concertz or FISHBOWLZ forks cleanly. |
| — | **ecc-content-hash-cache** | skill (already installed) | Keep but demote — specific use case for file processing caching. |

---

## Drop List (currently installed but not top 10)

| Name | Drop? | Why |
|------|-------|-----|
| `ecc-strategic-compact` | YES | Duplicates `/compact` + caveman. `/compact` handles it. |
| `ecc-content-hash-cache` | DEMOTE | Move to honorable list. Keep installed but don't promote. |
| `ecc-learn` command | KEEP | Self-contained pattern extraction, even without full CL-v2 backend. |
| `ecc-skill-create` command | KEEP | Can generate ZAO-specific skills from git history independently. |

---

## Comparison of Options (sequencing)

| Option | Install Size | Risk | Value | Verdict |
|--------|-------------|------|-------|---------|
| A. Full plugin install (183 skills) | ~300MB, 183 skills | HIGH — skill routing collisions, superpowers/caveman conflicts | Get everything | REJECT |
| B. Current state (5 skills + 2 cmds + env var) | ~50KB | LOW | Partial | EXTEND to top 10 |
| C. Top 10 install (this doc) | ~100KB, 6 new installs + drop 1 | LOW | Covers 80% of value | **ADOPT** |
| D. Top 5 only | ~60KB | LOW | Minimal | Too conservative for how much ECC offers |

---

## Execution Checklist (next session)

**To install (Tier 1 additions):**
1. `cp -r ~/scratch/ecc/skills/nextjs-turbopack ~/.claude/skills/ecc-nextjs-turbopack`
2. `cp -r ~/scratch/ecc/skills/postgres-patterns ~/.claude/skills/ecc-postgres-patterns`
3. `cp ~/scratch/ecc/agents/silent-failure-hunter.md ~/.claude/agents/ecc-silent-failure-hunter.md`
4. `cp -r ~/scratch/ecc/skills/database-migrations ~/.claude/skills/ecc-database-migrations`
5. `cp -r ~/scratch/ecc/skills/hookify-rules ~/.claude/skills/ecc-hookify-rules` + copy 4 hookify commands
6. `cp -r ~/scratch/ecc/skills/agent-introspection-debugging ~/.claude/skills/ecc-agent-introspection`
7. `cp -r ~/scratch/ecc/skills/skill-stocktake ~/.claude/skills/ecc-skill-stocktake`

**To remove:**
- `rm -rf ~/.claude/skills/ecc-strategic-compact`

**To add (decision set):**
- Install Playwright MCP (D3 partial)
- Install Context7 MCP (D3 partial)
- Run `npx ecc-agentshield scan` baseline (D2)
- Diff `rules/typescript/` into project rules (D5)

**Then update MANIFEST.md + commit.**

---

## ZAO Ecosystem Integration

Each top-10 pick maps to specific ZAO OS files:

| Pick | ZAO OS files affected |
|------|------------------------|
| nextjs-turbopack | `next.config.ts`, `package.json` scripts, `src/app/*` RSC boundaries |
| postgres-patterns | `src/lib/db/supabase.ts`, `scripts/*.sql`, all `src/app/api/*/route.ts` |
| silent-failure-hunter | 301 routes under `src/app/api/`, `src/lib/agents/runner.ts`, `Promise.allSettled` callers |
| database-migrations | `scripts/*.sql`, future migrations, `contracts/` on-chain migrations |
| hookify | `~/.claude/settings.json`, auto-behavior requests from Zaal |
| agent-introspection | `src/lib/agents/` VAULT/BANKER/DEALER/runner, VPS agents (ZOE/ROLO) |
| skill-stocktake | `~/.claude/skills/*` (global), `.claude/skills/*` (project) |

---

## Success Metrics (measure 2026-04-26, 7-day window)

| Metric | Target |
|--------|--------|
| Top 10 skills invoked at least once | ≥ 7 of 10 |
| Silent-failure-hunter catches in real code | ≥ 2 findings |
| Hookify rules created from conversation | ≥ 1 |
| Postgres/Supabase optimization applied | ≥ 1 index or RLS change |
| Skills dropped from top 10 after week | ≤ 2 |

---

## Sources

- [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code) (pinned SHA `8bdf88e5ad8877bcd00a4aba7ccbfb50f235f10f`)
- [ECC README — skill + agent + command inventory](https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/README.md)
- ZAO OS doc 441 — initial ECC integration research + plan
- ZAO OS doc 238 — Claude Tools Top 50 evaluation (prior eval baseline)
- ZAO OS doc 154 — skills/commands master reference
- ZAO OS `CLAUDE.md` — stack, boundaries, token budget
