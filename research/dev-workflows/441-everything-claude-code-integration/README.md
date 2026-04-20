### 441 — Everything Claude Code (ECC) Integration into ZAO OS Workflow

> **Status:** Research complete
> **Date:** 2026-04-19
> **Goal:** Evaluate `affaan-m/everything-claude-code` — a 48-agent, 183-skill, 34-rule, 14-MCP harness-optimization plugin — and map which pieces to adopt into the ZAO OS dev workflow without duplicating existing superpowers, caveman, autoresearch, and gstack skills.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| Install strategy | USE manual clone + cherry-pick. SKIP full plugin install — 183 skills would drown existing 70+ skills and confuse skill routing. |
| Continuous learning (`/learn`, `/checkpoint`, `/verify`, instinct-status) | ADOPT — fills gap. Captures patterns across sessions, complements auto-memory. |
| AgentShield security scan (`npx ecc-agentshield scan`) | ADOPT — 102 rules, 14 secret patterns. Run pre-ship alongside `/review`. Hard requirement given `.env`/service-role risk. |
| `verification-loop` skill (build/test/lint/typecheck cycle) | ADOPT — codifies what CLAUDE.md per-file-commands already implies. Use as default post-edit loop. |
| `harness-audit` (`/harness-audit`) | ADOPT — one-time audit of current `~/.claude` setup + project rules for reliability/risk. Run once, then quarterly. |
| `eval-harness` + `/eval` | ADOPT selectively — useful for agents (VAULT/BANKER/DEALER), spaces logic. Not for every route. |
| `strategic-compact` + `content-hash-cache-pattern` | ADOPT — cuts tokens. Already aligned with CLAUDE.md token-budget section. |
| `tdd-guide`, `code-reviewer`, `refactor-cleaner`, language-reviewers (TS/Python) | SKIP — duplicates `superpowers:test-driven-development`, `code-reviewer`, `superpowers:requesting-code-review`. Keep superpowers as canonical. |
| `/plan`, `/tdd`, `/code-review`, `/build-fix` commands | SKIP — duplicates `/plan-eng-review`, `/review`, `/ship`, `/investigate`. |
| Framework skills (NestJS, Django, Spring, Laravel, FastAPI, Rails) | SKIP — irrelevant to Next.js 16 stack. |
| `react/nextjs-patterns` skill | EVAL then likely SKIP — we already have `next-best-practices` skill. Diff before adopting. |
| MCP servers (GitHub, Supabase, Vercel, Exa, Context7, Playwright, Memory, Sequential Thinking) | ADOPT 3: Supabase MCP (service-role-free queries), Playwright (replaces gstack for complex flows), Context7 (Next.js 16 / React 19 docs retrieval). SKIP rest — grep + gh + WebFetch cover them. |
| `skill-creator` (`/skill-create`) | ADOPT — generates skills from git history. Good for ZAO OS 300+ route patterns. |
| Language-specific rules (`rules/typescript`) | COPY to `.claude/rules/` then diff against existing `api-routes.md` / `components.md` / `tests.md`. Merge non-duplicates. |
| `loop-operator` + `autonomous-loops` skill | SKIP — `autoresearch` + `/loop` cover this. |
| `content-engine` skill (multi-platform repurposing) | EVAL — may duplicate `/socials`. Compare before merge. |
| Tkinter dashboard (v1.10.0) | SKIP — irrelevant. |
| `ECC_HOOK_PROFILE=strict` + 20+ sample hooks | ADOPT SELECTIVELY — pull secret-detection, console.log-detection, git-push-review hooks. Wire into existing `caveman` SessionStart pattern. |

---

## ECC Repo Facts (verified 2026-04-19)

| Metric | Value |
|--------|-------|
| Version | v1.10.0 (April 2026) |
| Agents | 48 |
| Skills | 183 |
| Legacy commands | 79 |
| Rules | 34 |
| MCP servers bundled | 14 |
| Internal tests | 997+ |
| Coverage | 92% critical paths |
| Min Claude Code CLI | v2.1.0 |
| License | MIT |
| Stars | 140K+ |
| Forks | 21K+ |

Install options:
1. `/plugin marketplace add https://github.com/affaan-m/everything-claude-code` then `/plugin install everything-claude-code@everything-claude-code`
2. `git clone ... && ./install.sh --profile full` (or `./install.sh typescript python`)
3. `npm install ecc-universal && npx ecc-install typescript`

Critical limitation: **plugins cannot auto-distribute `rules/`** — rules install manually even after plugin install.

---

## Comparison of Integration Approaches

| Approach | Pro | Con | Verdict |
|----------|-----|-----|---------|
| A. Full plugin install (`/plugin install`) | 1-command, auto-updates | 183 skills collide with 70+ existing; skill routing chaos; duplicates TDD/review | REJECT |
| B. Language-scoped install (`./install.sh typescript`) | Smaller surface, TS-only | Still pulls ~60 skills, rules won't install, unclear uninstall | REJECT |
| C. Manual cherry-pick (clone, copy selected files to `~/.claude/skills/` + `~/.claude/agents/`) | Full control, zero duplication, can edit for ZAO context | Manual work, no auto-updates, must track upstream | ADOPT |
| D. Vendor as git submodule + symlink selected files | Trackable upstream, still selective | Adds submodule complexity to ZAO OS repo | HOLD — consider if C gets stale |

---

## Gap Analysis: ZAO OS Current vs ECC

| Capability | ZAO OS has | ECC adds | Action |
|------------|------------|----------|--------|
| TDD workflow | `superpowers:test-driven-development` | `tdd-workflow`, `tdd-guide` agent | KEEP superpowers |
| Code review | `superpowers:requesting-code-review`, `/review`, `code-reviewer` agent, `caveman-review` | `code-reviewer`, 8 language-specific reviewers | KEEP existing |
| Security review | `/security-review`, SECURITY.md | AgentShield (102 rules, 1282 tests), `security-review` skill, OWASP checklist | ADD AgentShield + OWASP skill |
| Planning | `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`, `superpowers:writing-plans` | `/plan`, `planner` agent, `architect` agent | KEEP existing |
| Verification loop | implicit via CLAUDE.md per-file commands | `verification-loop` skill, `/checkpoint`, `/verify` | ADD verification-loop + /checkpoint |
| Continuous learning | auto-memory only | `continuous-learning-v2`, instinct-status, /learn, /prune, /evolve, /instinct-import/export | ADD full instinct system |
| Harness audit | none | `/harness-audit` + `harness-optimizer` agent | ADD |
| Model routing | manual (fast mode toggle) | `/model-route`, `CLAUDE_CODE_SUBAGENT_MODEL=haiku` env | ADD env var + eval command |
| Eval-driven dev | `autoresearch` | `eval-harness`, `/eval`, `/quality-gate` | ADD for agents/spaces only |
| Multi-agent orchestration | `superpowers:dispatching-parallel-agents`, `/loop` | `/multi-plan`, `/multi-execute`, `/orchestrate`, `loop-operator` | KEEP existing |
| MCP — Supabase | none (direct `@supabase/supabase-js`) | Supabase MCP server | ADD (read-only queries during dev) |
| MCP — Playwright | gstack + browse skills | Playwright MCP | ADD as fallback for auth flows |
| MCP — Context7 | none | Context7 MCP for Next.js/React docs | ADD (Next.js 16 + React 19 still new) |
| Secret detection | manual grep + SECURITY.md | `PreToolUse` hook scans for secret patterns | ADD hook |
| PM2 service lifecycle | manual `tmux` | `/pm2` command | EVAL — maybe replaces tmux for VPS |
| Skill creator | manual write | `/skill-create --instincts` from git history | ADD — run on ZAO OS history |
| Video/slides | none | `frontend-slides`, `video-editing`, `videodb`, `manim-video`, `remotion-video-creation` | SKIP unless content need arises |

---

## ZAO Ecosystem Integration Map

File paths to touch (ZAO OS):

- `/Users/zaalpanthaki/.claude/skills/` — destination for cherry-picked skills: `verification-loop/`, `continuous-learning-v2/`, `security-review/`, `eval-harness/`, `strategic-compact/`, `skill-creator/`, `harness-audit/`.
- `/Users/zaalpanthaki/.claude/agents/` — cherry-pick: `harness-optimizer.md`, `planner.md` (diff vs plan-eng-review first).
- `/Users/zaalpanthaki/.claude/hooks/` — add secret-detection, console.log-detection, git-push-review hooks. Wire alongside caveman SessionStart.
- `~/.claude/settings.json` — add `"env": { "CLAUDE_CODE_SUBAGENT_MODEL": "haiku", "ECC_HOOK_PROFILE": "standard" }` + MCP servers (Supabase, Playwright, Context7).
- `.claude/rules/` (project) — diff ECC `rules/typescript/` against existing `.claude/rules/api-routes.md` + `components.md` + `tests.md`. Merge additive rules only.
- `CLAUDE.md` — append "## Verification Loop" section pointing at new skill + `/checkpoint` cadence.
- `src/lib/agents/` — run `eval-harness` against VAULT/BANKER/DEALER trading logic. Agents are the best eval target because behavior is measurable (PnL, trade count, slippage).
- `research/README.md` — link doc 441 under dev-workflows index.

---

## Risks

| Risk | Mitigation |
|------|------------|
| Skill name collisions (ECC `code-review` vs existing `code-reviewer`) | Cherry-pick only non-colliding skills; rename any borderline ones with `ecc-` prefix |
| Rules drift between ECC upstream and our fork | Pin to a specific commit SHA; review diffs on major ECC releases only |
| Instinct system overwrites auto-memory | Namespace instincts under `~/.claude/projects/.../instincts/` separate from `memory/`; don't merge stores |
| AgentShield false-positives blocking ship | Run as warning-only initially; gate in `/ship` after 1 week of clean runs |
| MCP server count exceeds 10 (ECC recommends `<10 MCPs`) | Current count is 5 (Gmail, Calendar, Drive, grep, notion). Adding 3 = 8. OK. |
| Plugin model updates break pinned fork | Stay on manual-clone path. Ignore `/plugin install`. |

---

## Phased Plan (see separate plan spec in next artifact)

1. **Audit & Pin** — clone ECC to `~/scratch/ecc`, pin SHA, run their `/harness-audit` against current `~/.claude`.
2. **Cherry-pick skills** — copy 7 skills listed above, test each in isolation.
3. **Hooks + settings** — wire 3 hooks, add `CLAUDE_CODE_SUBAGENT_MODEL=haiku`, test on scratch branch.
4. **MCPs** — add Supabase (read-only), Playwright, Context7.
5. **AgentShield** — add `npx ecc-agentshield scan` step to `/ship` workflow.
6. **Instinct system** — install `continuous-learning-v2`, run `/learn` after each work session for 1 week, review captured patterns.
7. **Skill-creator** — run `/skill-create --instincts` against ZAO OS git history (300+ routes, 279 components) to auto-generate ZAO-specific skills.
8. **Retire duplicates** — after 2 weeks validation, document which ECC pieces stuck and which got rolled back.

---

## Sources

- [affaan-m/everything-claude-code on GitHub](https://github.com/affaan-m/everything-claude-code)
- [ECC README](https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/README.md)
- [AgentShield section (README)](https://github.com/affaan-m/everything-claude-code#agentshield)
- [Skill Creator GitHub App](https://github.com/apps/skill-creator)
- ZAO OS CLAUDE.md (token budget, boundaries)
- ZAO OS doc 154 — skills/commands master reference
- ZAO OS doc 168 — claude-code-community-innovations-march2026
- ZAO OS doc 238 — claude-tools-top50-evaluation
