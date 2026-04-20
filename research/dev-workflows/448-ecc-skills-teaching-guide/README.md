### 448 — ECC Skills Teaching Guide (How to Use Each Artifact)

> **Status:** Reference / training doc
> **Date:** 2026-04-20
> **Goal:** For every installed ECC artifact (10 skills + 1 agent + 6 commands + 2 MCPs + AgentShield + 1 rule) — what it does, when to trigger, ZAO OS example, what NOT to use it for.

---

## Quick Reference

| Type | Name | Trigger | One-liner |
|------|------|---------|-----------|
| skill | `ecc-verification-loop` | after feature/refactor | Run build + test + lint + typecheck before declaring done |
| skill | `ecc-security-review` | adding auth/payment/secrets | OWASP checklist + cloud infra security patterns |
| skill | `ecc-eval-harness` | working on VAULT/BANKER/DEALER | Formal eval framework for LLM/agent outputs |
| skill | `ecc-content-hash-cache` | caching expensive file processing | SHA-256 content-addressed cache pattern |
| skill | `ecc-nextjs-turbopack` | Next.js perf / dev speed issues | Turbopack config, FS caching, bundler choice |
| skill | `ecc-postgres-patterns` | Supabase queries, indexes, RLS | Postgres optimization patterns |
| skill | `ecc-database-migrations` | Supabase schema change | Safe migration + rollback playbook |
| skill | `ecc-hookify-rules` | "always do X when Y" asks | Author a hookify rule from natural language |
| skill | `ecc-agent-introspection` | ZOE/ROLO/VAULT/BANKER/DEALER misbehaving | Capture → diagnose → recover → report |
| skill | `ecc-skill-stocktake` | weekly / monthly skill audit | Score quality of all installed skills |
| agent | `ecc-silent-failure-hunter` | PR review, pre-ship | Hunt swallowed errors + bad fallbacks |
| command | `/ecc-learn` | end of session | Extract reusable patterns from session |
| command | `/ecc-skill-create` | want a new skill from git | Generate SKILL.md from git history |
| command | `/ecc-hookify` | want a behavior prevented | Create hookify rule from conversation |
| command | `/ecc-hookify-configure` | toggle hookify rules | Enable/disable rules |
| command | `/ecc-hookify-help` | learn hookify | Hookify docs |
| command | `/ecc-hookify-list` | see active rules | List all hookify rules |
| mcp | `context7` | working with Next.js 16 / React 19 / Supabase / Wagmi | Auto-fetch current library docs |
| mcp | `playwright` | browser automation / screenshots | Headless Chrome via MCP |
| cli | `npx ecc-agentshield scan` | pre-ship | Security audit of `.claude/` config dirs |
| rule | `.claude/rules/typescript-hygiene.md` | auto-loaded | TS hygiene cross-cutting rules |

---

## Skills (10)

### 1. ecc-verification-loop

**What:** Structured post-edit verification — build, typecheck, lint, test, each as a phase with stop-on-fail.

**When to trigger:** After any feature, bugfix, or refactor. Before running `/ship`.

**How to use:** Just say "run verification-loop on the changes". Claude loads the skill and walks through:
1. `npm run build` — build check
2. `npm run typecheck` — tsc --noEmit
3. `npm run lint:biome` — lint
4. `npm run test` — vitest

Stops at first failure. Fix + re-run.

**ZAO OS example:**
> "I finished adding the XMTP typing indicator. Run ecc-verification-loop."

**Don't use for:** Quick local iteration. It's a gate before PR, not a dev-loop tool.

**Replaces/adds:** Adds structure to `superpowers:verification-before-completion`. The superpowers skill tells you WHEN to verify; this tells you HOW.

---

### 2. ecc-security-review

**What:** OWASP checklist + cloud infra patterns for auth, input handling, secrets, payments, sensitive data.

**When to trigger:** Any time you touch `src/lib/auth/`, add a new API route that handles auth, work with wallet/signer code, or integrate a third-party secret.

**How to use:** "Run ecc-security-review on the changes to src/app/api/auth/verify/route.ts". Gets back a checklist: session validation, rate limiting, input Zod, secrets not echoed, CORS, etc.

**ZAO OS example:**
> "I added /api/admin/grant-role/route.ts. Run ecc-security-review — want the OWASP pass + check that service-role key isn't leaked."

**Don't use for:** Routine CRUD with no secrets. Overkill.

**Replaces/adds:** Complements the built-in `/security-review` command. `/security-review` scans git diff. This skill is checklist-driven.

---

### 3. ecc-eval-harness

**What:** Eval-driven dev framework. Define inputs, expected outputs, success criteria, run evaluator, measure score.

**When to trigger:** Working on `src/lib/agents/` (VAULT, BANKER, DEALER), agent prompts, LLM-mediated features (ZOE replies, Composio AO pilots).

**How to use:** "Use ecc-eval-harness to eval my new DEALER strategy against 20 historical trade windows. Target metric: PnL >= baseline + 2%."

**ZAO OS example:**
> "BANKER is timing out. Build an eval-harness: 50 trade scenarios → measure latency + PnL + slippage. Acceptance: p95 latency < 2s."

**Don't use for:** Simple deterministic code. Evals are for probabilistic outputs.

**Replaces/adds:** Different from `autoresearch` (iteration loop). Eval-harness is evaluation. Use `autoresearch` + `ecc-eval-harness` together: autoresearch iterates, eval-harness scores each iteration.

---

### 4. ecc-content-hash-cache

**What:** SHA-256 content-addressed cache. Path-independent. Auto-invalidates when content changes.

**When to trigger:** When you have an expensive file-processing step (AI summarization, image processing, compiled artifacts) that should only re-run when the source actually changes.

**How to use:** Rare. Situational skill, not daily. Invoke when you're building a pipeline that re-processes files.

**ZAO OS example:**
> "Building a cast-thumbnail generator — processes each image once, caches by hash. Apply ecc-content-hash-cache pattern."

**Don't use for:** Simple memoization. Overkill. Just use a Map.

**Honorable-mention demoted tier — not daily.**

---

### 5. ecc-nextjs-turbopack

**What:** Next.js 16 + Turbopack reference. Incremental bundling, FS caching, dev speed knobs, when to use Turbopack vs webpack.

**When to trigger:** Dev server feels slow. Build times ballooning. Considering webpack fallback for some feature. Config questions.

**How to use:** "Dev server restarting slowly on src/components/spaces/ changes. Check ecc-nextjs-turbopack for tuning knobs."

**ZAO OS example:**
> "Turbopack not HMR-ing the audio player after a change. ecc-nextjs-turbopack — debug."

**Don't use for:** Generic Next.js patterns (use `next-best-practices` skill).

**Replaces/adds:** Fills gap. Specific to Next.js 16 + Turbopack.

---

### 6. ecc-postgres-patterns

**What:** Postgres best-practices — indexing, query optimization, RLS, schema design. Based on Supabase conventions.

**When to trigger:** Adding/editing a Supabase table. Query feels slow. Planning an index. Writing RLS policies.

**How to use:** "Add a `cast_reactions` table. Use ecc-postgres-patterns — need indexes + RLS + foreign keys."

**ZAO OS example:**
> "Slow query on `profiles` when filtering by fid. Consult ecc-postgres-patterns — pick the right index shape."

**Don't use for:** Application logic. It's DB-focused.

**Replaces/adds:** No existing Supabase-specific rule. Complements `.claude/rules/api-routes.md` on the DB side.

---

### 7. ecc-database-migrations

**What:** Safe migration playbook — schema changes, data backfills, rollbacks, zero-downtime deploys.

**When to trigger:** Any new `scripts/*.sql` file. Any ALTER TABLE. Renaming a column.

**How to use:** "Adding a new column `users.last_seen_at`. Run through ecc-database-migrations — need backfill strategy + rollback."

**ZAO OS example:**
> "Migration to add `spaces.is_recurring` boolean with default false. Use ecc-database-migrations — make sure it's backward-compatible with current code."

**Don't use for:** Initial-schema work (new project). Overkill.

**Replaces/adds:** Fills a real gap. ZAO OS has 10+ migrations in `scripts/` — no playbook before.

---

### 8. ecc-hookify-rules

**What:** Skill for authoring hookify rules. Hookify = markdown files with YAML frontmatter that watch patterns and inject reminders to Claude.

**When to trigger:** You find yourself asking Claude "always do X when Y" more than once. Or "stop doing Z".

**How to use:** "Write a hookify rule: whenever I edit a file in `src/app/api/`, remind me to run `ecc-security-review` if it touches auth."

Rules save as `.claude/hookify.{rule-name}.local.md`.

**ZAO OS example:**
> "I keep forgetting to add Zod validation to new API routes. Use ecc-hookify-rules to write a rule that warns on new `route.ts` files missing `safeParse`."

**Don't use for:** One-off reminders. Hookify is for persistent behavioral gates.

**Replaces/adds:** Fills gap. Previously you'd edit `settings.json` hooks manually — tedious + error-prone.

---

### 9. ecc-agent-introspection

**What:** Structured self-debugging workflow for AI agent failures. Capture state → diagnose root cause → contained recovery → introspection report.

**When to trigger:** ZOE/ROLO/VAULT/BANKER/DEALER/Composio AO agent loops, drifts, consumes tokens without progress, or fails repeatedly.

**How to use:** "BANKER is looping on the same trade decision. Use ecc-agent-introspection to capture, diagnose, recover."

**ZAO OS example:**
> "ZOE kept sending the same Telegram message 5 times. Run ecc-agent-introspection on the last session log to find root cause."

**Don't use for:** Human debugging. This is agent-specific.

**Replaces/adds:** Direct fit for ZAO's 8+ agents. No existing coverage.

---

### 10. ecc-skill-stocktake

**What:** Audit quality of all installed skills. Quick Scan (recently changed) or Full Stocktake mode. Sequential subagent batch evaluation.

**When to trigger:** Weekly habit. Or before declaring a skill-system overhaul done.

**How to use:** `/skill-stocktake` — kicks audit. Gets back rated list with issues (missing description, stale content, duplicate intent).

**ZAO OS example:**
> Every Friday: run `/ecc-skill-stocktake` to score ~80 installed skills. Delete anything rated <5.

**Don't use for:** Invoking individual skills. This is a meta-skill.

**Replaces/adds:** Fills gap. Given ZAO has 70+ skills, bloat is real.

---

## Agent (1)

### ecc-silent-failure-hunter

**What:** Agent that scans code for swallowed errors, bad fallbacks, missing error propagation.

**When to trigger:** Pre-ship audit. After adding try/catch. After writing `Promise.allSettled`. When debugging "everything looks fine but nothing happens".

**How to use:** Spawn via subagent: "Use ecc-silent-failure-hunter to audit `src/lib/agents/runner.ts` for silent failures."

Agent returns findings like: "line 47 — caught error logged to console.error but never re-thrown; caller assumes success."

**ZAO OS example:**
> "Before shipping the spaces auto-reconnect feature — run ecc-silent-failure-hunter on `src/components/spaces/` and `src/app/api/spaces/**/route.ts`."

**Don't use for:** Style nits. It hunts semantic bugs.

**Replaces/adds:** No existing ZAO agent hunts swallowed errors specifically. Complements `/review` + superpowers code-reviewer.

---

## Commands (6)

### /ecc-learn

**What:** Extracts reusable patterns from current session — error resolution, debugging techniques, decisions.

**When to trigger:** End of session where you solved a non-trivial problem.

**How to use:** `/ecc-learn` in the chat. Claude scans session, drafts reusable pattern notes. You approve/reject.

**ZAO OS example:**
> Just spent 2 hours debugging XMTP key generation race condition. `/ecc-learn` — save this as a pattern so future sessions skip the trap.

**Don't use for:** Simple tasks. Only worthwhile when the lesson is non-obvious.

**Note:** Works standalone. Doesn't need the full CL-v2 backend.

---

### /ecc-skill-create

**What:** Analyze git history, extract recurring patterns, generate SKILL.md files.

**When to trigger:** After you've done the same kind of task 3+ times (new API route, new spaces component, etc.).

**How to use:** `/ecc-skill-create --commits 100` analyzes last 100 commits. Lists proposed skills. You accept the useful ones.

**ZAO OS example:**
> "I've added 20+ API routes this month. Run `/ecc-skill-create` on the last 200 commits to generate a `zao-new-api-route` skill."

**Don't use for:** One-off patterns.

---

### /ecc-hookify

**What:** Create a hookify rule from natural-language description or current conversation.

**When to trigger:** You want Claude to always/never do X. Persistent behavioral gate.

**How to use:** `/ecc-hookify always run typecheck after editing any .ts file in src/lib/agents/`. Creates `.claude/hookify.typecheck-agents.local.md`.

**ZAO OS example:**
> `/ecc-hookify prevent creating new components without "use client" if they use useState or useEffect`

**Don't use for:** Session-only reminders. Use TaskCreate.

---

### /ecc-hookify-configure | /ecc-hookify-help | /ecc-hookify-list

**What:** Manage hookify rules.
- `/ecc-hookify-list` — see all active rules
- `/ecc-hookify-configure` — enable/disable a specific rule
- `/ecc-hookify-help` — syntax docs

**When to trigger:** Periodically audit active rules. Disable stale ones.

---

## MCPs (2)

### context7

**What:** Auto-fetches current library docs (Next.js, React, Supabase, Wagmi, etc.) at query time. Not static-cached.

**When to trigger:** Working with a library where version matters. Next.js 16 changes, React 19 RSC rules, Wagmi v2 API, Supabase v2 client.

**How to use:** Claude uses it automatically when relevant. You can also force: "Use context7 to fetch the latest Next.js 16 `generateMetadata` signature."

**ZAO OS example:**
> "Adding a new app/layout.tsx. Use context7 to pull current Next.js 16 metadata API."

**Don't use for:** General web search. Use WebFetch.

---

### playwright

**What:** Headless browser automation via MCP. Screenshots, clicks, form-fills, navigation.

**When to trigger:** Browser QA tasks beyond what `gstack` covers. OAuth flow testing. Login-required screenshot.

**How to use:** Claude uses automatically for `/qa` + `/browse` style tasks. Or explicit: "Use playwright to visit localhost:3000/admin, log in, screenshot the queue."

**ZAO OS example:**
> "Test the Farcaster sign-in flow on localhost:3000 with playwright — screenshot at each step."

**Don't use for:** Static-page QA. `gstack` is faster (~100ms per command).

---

## CLI Tool

### npx ecc-agentshield scan

**What:** Security auditor for Claude Code config dirs. Scans `~/.claude/` or `.claude/` for secrets, permissions, hook issues, MCP supply chain.

**When to trigger:** Pre-ship. Monthly habit. After adding new MCP or hook.

**How to use:**
```bash
# Project config scan
npx ecc-agentshield@1.4.0 scan --path "/path/to/project/.claude" --format markdown > scan-report.md

# Global config scan
npx ecc-agentshield@1.4.0 scan --path "$HOME/.claude" --format markdown > scan-global.md

# Auto-fix safe findings
npx ecc-agentshield@1.4.0 scan --path "$HOME/.claude" --fix
```

**ZAO OS baseline (2026-04-20):**
- Project `.claude/`: Grade B (83/100), 14 findings, 0 critical
- Global `~/.claude/`: Grade D (55/100), 36 findings, 1 critical (`Bash(*)` permission too broad)

**What it finds:**
- Overly permissive allow rules
- Missing deny list
- Secrets hardcoded in skills/agents
- Hooks that suppress errors
- Agents without explicit tools array
- MCP supply-chain typosquatting

**Don't use for:** Application source-code scanning. It's for CLAUDE config, not app code.

---

## Rules

### .claude/rules/typescript-hygiene.md

**What:** Cross-cutting TS hygiene — no `any`, named props interfaces, `unknown` for caught errors, env var validation, no `console.log`.

**When to trigger:** Auto-loaded for any `.ts`/`.tsx` file in ZAO OS.

**Source:** Cherry-picked from ECC `rules/typescript/` coding-style + patterns + security.

**Interaction with existing rules:**
- `.claude/rules/api-routes.md` — ZAO-specific API routing rules
- `.claude/rules/components.md` — ZAO-specific component conventions
- `.claude/rules/tests.md` — ZAO-specific Vitest conventions
- `.claude/rules/typescript-hygiene.md` (new) — generic TS hygiene from ECC

All four load together. No conflicts.

---

## Workflow Cheat Sheet

### Daily
- **Code:** Follow `.claude/rules/typescript-hygiene.md` automatically.
- **Before PR:** Say "run ecc-verification-loop".
- **End of session:** `/ecc-learn` if non-trivial problem solved.

### Per-task
| Task | Skills/Commands |
|------|-----------------|
| New API route | `.claude/rules/api-routes.md` auto + `ecc-security-review` if auth |
| New Supabase table | `ecc-postgres-patterns` + `ecc-database-migrations` |
| New ZAO component | `.claude/rules/components.md` auto + `ecc-hookify` if pattern emerges |
| Debug agent loop | `ecc-agent-introspection` |
| Pre-ship PR | `ecc-silent-failure-hunter` + `ecc-verification-loop` + `npx ecc-agentshield scan` |
| Working with Next.js 16 API | `context7` MCP auto |
| Browser flow test | `playwright` MCP or `gstack` |

### Weekly
- `/ecc-skill-stocktake` — audit skill quality.
- Review `/ecc-hookify-list` — prune stale rules.

### Monthly
- `npx ecc-agentshield scan` against both `~/.claude/` and project `.claude/` — track grade.
- `/ecc-skill-create --commits 100` — auto-generate skills from recent patterns.

---

## Anti-Patterns

- Don't invoke an ecc-* skill every turn. They're context-triggered, not default-on.
- Don't use `ecc-verification-loop` for iterative dev (it's a gate, not a loop).
- Don't use `ecc-eval-harness` on deterministic code (evals are for probabilistic output).
- Don't use `ecc-agentshield` on application source (it scans CLAUDE config).
- Don't use `playwright` MCP when `gstack` would work (gstack is ~100ms, playwright is slower).

---

## Sources

- Doc 441 — ECC integration research + plan
- Doc 442 — ECC top picks ranking
- `affaan-m/everything-claude-code` pinned SHA `8bdf88e5ad8877bcd00a4aba7ccbfb50f235f10f`
- `ecc-agentshield@1.4.0` on npm
- Baseline scans at `research/dev-workflows/441-everything-claude-code-integration/agentshield-baseline/`
