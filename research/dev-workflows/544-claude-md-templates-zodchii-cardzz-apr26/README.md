---
topic: dev-workflows
type: comparison
status: research-complete
last-validated: 2026-04-28
related-docs: 154, 441, 506, 507
tier: STANDARD
---

# 544 — CLAUDE.md Template Patterns: zodchii + cardzz (Apr 2026 X Posts)

> **Goal:** Two viral X posts (Apr 27 2026) shared full CLAUDE.md templates claiming 10x Claude Code output. Compare against ZAO OS's existing `CLAUDE.md` files (root + global) and pick what to adopt.

## Key Decisions / Recommendations

| Decision | Recommendation | Why |
|----------|----------------|-----|
| **Add "Workflow Orchestration" section to root CLAUDE.md** | USE — adopt zodchii's 6 rules: Plan Mode default, Subagent strategy, Self-Improvement Loop, Verification Before Done, Demand Elegance, Autonomous Bug Fixing | Process rigor compounds over long sessions; aligns with existing /worksession + superpowers skills |
| **Add `tasks/lessons.md` self-improvement loop** | USE — capture corrections after every session, monthly review, fold patterns into CLAUDE.md | Mirrors `feedback_*.md` memories already in `~/.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/` (45+ feedback files) — explicit project-level loop adds rigor |
| **Cap CLAUDE.md at 200-500 lines** | USE — current root CLAUDE.md is ~75 lines (good); global is 25 lines (good) | Both posts agree: under 100 = vague, over 1000 = Claude loses focus |
| **Hierarchical CLAUDE.md (sub-folder overrides)** | USE — already partially in place via `.claude/rules/*.md`; cardzz article reinforces pattern | ZAO OS has `.claude/rules/components.md`, `api-routes.md`, `tests.md`, `secret-hygiene.md`, `typescript-hygiene.md`, `skill-enhancements.md` |
| **"NEVER" section with hard prohibitions** | DONE — already present in root CLAUDE.md ("Never do" block) | cardzz pattern matches; no change needed |
| **Add explicit prompt patterns block** | SKIP for now | Already covered by skills (`/qa`, `/ship`, `/review`, `/zao-research`); duplicating in CLAUDE.md = noise |
| **Token efficiency rules** | PARTIAL — global CLAUDE.md already has "no emojis / no em dashes" | cardzz suggests "responses under 100 words unless asked"; risk = makes Claude too terse for explanations. SKIP unless Zaal wants. |

## Source Posts

| Author | Handle | Date | Article URL | Engagement |
|--------|--------|------|-------------|------------|
| darkzodchi | @zodchiii | 2026-04-27 | https://www.zarifautomates.com/blog/claude-md-file-10x-engineer-optimize-claude-code | (X post in inbox) |
| cardzz | @anytwocardzz | 2026-04-27 | https://dev.to/the200dollarceo/the-single-file-that-10xd-my-claude-code-output-claudemd-explained-48gp | (X post in inbox) |

## zodchii's 6 Workflow Rules (verbatim from article)

1. **Plan Mode Default** — enter plan mode for any non-trivial task (3+ steps or architectural decisions). If something goes sideways, stop + re-plan immediately. Use plan mode for verification, not just building.
2. **Subagent Strategy** — use subagents liberally to keep main context clean. Offload research, exploration, parallel analysis. One task per subagent.
3. **Self-Improvement Loop** — after any user correction: update `tasks/lessons.md` with the pattern. Write rules that prevent the same mistake. Review lessons at session start.
4. **Verification Before Done** — never mark task complete without proving it works. Diff behavior between main + your changes. Ask: "would a staff engineer approve this?"
5. **Demand Elegance (Balanced)** — for non-trivial changes, pause + ask "is there a more elegant way?" Skip for simple fixes (don't over-engineer).
6. **Autonomous Bug Fixing** — given a bug report, just fix it. Don't ask for hand-holding. Point at logs/errors, then resolve.

**Claimed results:** correction cycles 2-3 -> 0-1, time-to-output -40%, shipped bugs -70% (Verification Before Done), context wasted on failed approaches -80%.

## cardzz's CLAUDE.md Structure (5 sections)

1. **Project header** — what the project is, stack
2. **Architecture Rules** — App Router only, Server Components default, RLS always, etc.
3. **Coding Patterns** — Server Actions, Zod validation at boundaries
4. **File Structure** — directory tree with purpose comments
5. **NEVER block** — hard prohibitions (no `any`, no business logic in components, no string concat in queries)

**Sweet spot claim:** 200-500 lines. Under 100 = vague. Over 1000 = Claude loses focus.

**Two locations:** `~/.claude/CLAUDE.md` (global) + `[project]/CLAUDE.md` (project-specific).

## Comparison to ZAO OS Current State

| Dimension | ZAO OS root CLAUDE.md | ZAO OS global CLAUDE.md | zodchii rec | cardzz rec | Gap? |
|-----------|----------------------|------------------------|-------------|------------|------|
| Project description | YES (ZAO OS gated Farcaster client) | N/A (global) | implied | YES | covered |
| Stack listed | YES (Next.js 16, React 19, Supabase, etc.) | N/A | implied | YES | covered |
| Project map / directory table | YES (12-row table) | N/A | YES | YES | covered |
| Hard rules ("Always do" / "Ask first" / "Never do") | YES | YES (no emojis, no em dashes, brand glossary) | YES | YES | covered |
| Per-file commands (test/lint per pattern) | YES | N/A | NO | NO | unique to ZAO OS — keep |
| Plan Mode default rule | NO | NO | YES (rule 1) | NO | **GAP — add** |
| Subagent strategy rule | NO | NO | YES (rule 2) | NO | **GAP — add** |
| Self-improvement / lessons.md loop | PARTIAL via memory `feedback_*.md` files | PARTIAL | YES (rule 3) | NO | **GAP — formalize** |
| Verification Before Done rule | implicit ("Per-File Commands" + `/ship`) | NO | YES (rule 4) | NO | **GAP — make explicit** |
| Token budget guidance | YES ("/compact every 15-20 messages") | NO | NO | implied | unique to ZAO OS — keep |
| Brand glossary / spelling rules | NO (in global) | YES (16 brands) | NO | NO | unique to ZAO/global — keep |
| File structure ASCII tree | NO (uses table instead) | NO | NO | YES | SKIP — table is denser |
| Hierarchical sub-rules in `.claude/rules/` | YES (6 files) | NO | NO | YES | covered |
| Length | ~75 lines | ~25 lines | NO target | 200-500 | both within range |

## Proposed Additions to `/Users/zaalpanthaki/Documents/ZAO OS V1/CLAUDE.md`

Add a new section **after** "Boundaries" + **before** "Per-File Commands":

```markdown
## Workflow Orchestration

1. **Plan first.** For any task with 3+ steps or architectural decisions, enter plan mode (or use `/plan-eng-review`). Never start a non-trivial task without a plan visible to Zaal.
2. **Subagents over inline work.** Offload research, code search, multi-file analysis to Task/Agent tools. Keep main context for synthesis + decisions.
3. **Self-improvement loop.** When Zaal corrects an approach, save the pattern to `~/.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/feedback_*.md`. Re-read relevant feedback memories at session start.
4. **Verification before "done".** Never mark a task complete without proof: tests pass, build green, screenshot of UI, or explicit user approval. Run `/qa` for UI features, `npm run typecheck` for code.
5. **Elegance check on non-trivial changes.** Before committing, ask: "is there a simpler way?" Skip for trivial fixes.
6. **Autonomous bug fixing.** When given a bug report, fix it without asking permission for each step. Use `/investigate` for root cause; only escalate if blocked.
```

This adds ~12 lines, keeps file under 100 lines.

## Token-Efficiency Pattern (Side Note from Research)

Drona23's `claude-token-efficient` repo demonstrates 63% output reduction (465 -> 170 words) by stripping:
- Preambles ("Sure!", "Great question!", "I'd be happy to...")
- Closing chatter ("Let me know if you need anything!")
- Unsolicited suggestions

**For ZAO OS:** caveman mode (`/caveman`) already enabled — covers this. No CLAUDE.md change needed.

## Skills Already Solving This Better Than CLAUDE.md

ZAO OS has 200+ skills installed. Skills already solve patterns these articles propose adding to CLAUDE.md:

| Pattern from articles | Existing ZAO OS skill |
|----------------------|----------------------|
| Plan Mode default | `superpowers:writing-plans`, `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review` |
| Subagent strategy | `superpowers:dispatching-parallel-agents`, `superpowers:subagent-driven-development` |
| Self-improvement loop | auto-memory system at `~/.claude/projects/.../memory/` (auto + 45+ feedback files) |
| Verification before done | `superpowers:verification-before-completion`, `/qa`, `/ship` |
| TDD enforcement | `superpowers:test-driven-development`, `everything-claude-code:tdd-workflow` |
| Code review | `superpowers:requesting-code-review`, `/review`, `/ultrareview` |

**Implication:** ZAO OS is **ahead** of these viral templates. The 6 rules from zodchii's article are mostly redundant with installed skills. Only the **explicit "Plan first / Verification before done" section in CLAUDE.md** is missing — 12 lines worth adding.

## Action Plan

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Open PR adding "Workflow Orchestration" section to root CLAUDE.md (12 lines) | Claude | PR | This week |
| Audit `feedback_*.md` memories monthly + fold patterns into CLAUDE.md if 3+ feedbacks share a theme | Claude/Zaal | Recurring task | Monthly |
| Skip duplicating skill-covered patterns into CLAUDE.md | Claude | Discipline | Ongoing |
| Note `mattepstein` X link unreachable (404) — ask Zaal for retry | Zaal | Reply in chat | Today |

## Also See

- [Doc 154 — Skills + Commands master reference](../154-skills-commands-master-reference/) (covers existing /worksession, /ship, /review, /qa)
- [Doc 441 — Everything Claude Code integration](../441-everything-claude-code-integration/) (existing rule pin SHA `8bdf88e5`)
- [Doc 506 — TRAE AI SOLO skip](../506-trae-ai-solo-bytedance-coding-agent/) (Plan Mode + Sub Agent + DiffView patterns to steal)
- [Doc 507 — Claude skills 1116 ecosystem ZAO picks](../507-claude-skills-1116-ecosystem-zao-picks/)

## Sources (Verified 2026-04-28)

1. [zarifautomates.com — The CLAUDE.md File That 10x'd My Output](https://www.zarifautomates.com/blog/claude-md-file-10x-engineer-optimize-claude-code) — zodchii's source article
2. [dev.to — The Single File That 10x'd My Claude Code Output](https://dev.to/the200dollarceo/the-single-file-that-10xd-my-claude-code-output-claudemd-explained-48gp) — cardzz's source article
3. [github.com/obra/superpowers](https://github.com/obra/superpowers) — Jesse Vincent's superpowers (Apr 2026, MIT, already installed)
4. [github.com/drona23/claude-token-efficient](https://github.com/drona23/claude-token-efficient) — token reduction patterns
5. ZAO OS root `CLAUDE.md` — current state (75 lines)
6. ZAO OS global `~/.claude/CLAUDE.md` — current state (25 lines, brand glossary)
