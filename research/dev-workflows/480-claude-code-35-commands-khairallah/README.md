# 480 — Khairallah's 35 Claude Code Commands & Workflows (April 2026)

> **Status:** Research complete
> **Date:** 2026-04-23
> **Goal:** Triage Khairallah AL-Awady's 35-technique Claude Code list against what we already do, promote missing techniques into our `.claude/` config, ignore what duplicates.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|---|---|
| Default new-task habit for Zaal? | USE **Plan Mode (Shift+Tab)** before any non-trivial change. Already half-enforced via the `superpowers:writing-plans` skill; make it explicit in `CLAUDE.md`. |
| Context hygiene? | USE `/compact` at 30-45 min checkpoints. ZAO OS CLAUDE.md says "every 15-20 messages" — align on **compact at 30-min OR when context >70%** whichever first. |
| New task? | USE `/clear` — strict rule: one conversation per feature. Prevents DB-refactor context bleeding into frontend work (already Zaal's preference per `feedback_worksession_first.md`). |
| Always-run memory rules? | USE `/memory` for 3 persistent rules: (1) mobile-first, (2) Farcaster not Warpcast, (3) Zod on every API route. These already live in `CLAUDE.md` so this is belt-and-suspenders. |
| Reference-file technique? | USE — point at `src/app/api/existing-route/route.ts` instead of describing style. Matches our existing rule in `.claude/rules/api-routes.md`. |
| Parallel terminals? | USE — already do this via `/worksession` which creates `ws/` branches. |
| Recovery mode (prompt 35)? | USE — codify as `.claude/skills/recovery.md` so Zaal can `/recovery` when a session goes sideways. This is the only net-new technique in the list with no skill yet. |

## Comparison of Options

| Technique bucket | Khairallah's claim | Our current state | Action |
|---|---|---|---|
| Session mgmt (`/init`, `/clear`, `/compact`, `/cost`, `/memory`) | Essential | All used ad hoc | Codify thresholds in CLAUDE.md |
| Planning (Plan Mode, Reference File, Incremental Build) | Biggest bug-prevention win | Partial — superpowers:writing-plans covers Plan Mode | Wire Plan Mode to default on |
| Testing (Test-First, Error Paste, Reproduction Prompt) | TDD + full error traces | `.claude/rules/tests.md` + Vitest convention | Add "paste complete error" rule to `rules/debugging.md` (new) |
| Auditing (Security Scan, Performance Profiler, Architecture Audit) | Monthly cadence | Doc 471 just caught Vercel OAuth breach same way | Run quarterly as cron skill |
| DevOps (Git Hook, CI, Env Setup Script) | Automate it | `.husky/` + GitHub Actions already present | No change |
| Recovery (Recovery Mode, Blame Investigator) | Start-fresh trigger | Not codified | Add `/recovery` skill |

## Techniques Already Covered in Our Stack

These duplicate existing ZAO OS infra; do nothing:
- 02 `/compact`, 03 `/clear`, 04 `/init`, 05 `/cost`, 06 `/memory` — native Claude Code.
- 09 Reference File — `.claude/rules/api-routes.md` already tells agents to match existing route shape.
- 11 Test-First — `.claude/rules/tests.md` (Vitest, `describe.each`, shared helpers).
- 16 Checkpoint Commit — we use `/worksession` + `ws/` branches.
- 21 Pattern Enforcer — `.claude/rules/components.md` and `typescript-hygiene.md`.
- 24 Security Scan — `/security-review` + doc 471 incident response.
- 27 Git Hook Writer — `.husky/pre-commit` with secret hygiene (`.claude/rules/secret-hygiene.md`).

## Techniques to Promote

These are net-new and worth codifying. Ranked by expected ROI:

1. **#35 Recovery Mode** — Add `~/.claude/skills/recovery.md`. Trigger phrase: "this isn't working, start over". Reads the pre-change git state, restates goal, discards prior context.
2. **#14 Diff Review** — Add a post-change hook: after every `Write`/`Edit`, Claude must explain each change in one sentence. Could wire via the hookify skill.
3. **#26 Refactoring Planner** — Decision: never start refactoring large files without a plan first. Add to CLAUDE.md boundaries.
4. **#18 Documentation Pass** — Hook to our `everything-claude-code:doc-updater` agent; run after every feature merge.
5. **#20 Dependency Check** — Add a `/dep-check` skill that wraps `npm info` + npmjs security advisories before any `npm install`.

## Specific Numbers

- **35** total techniques on Khairallah's list.
- **~20%** of Claude Code capability most users see without reading this type of list (his claim).
- **30-45 min** conversation window before `/compact` becomes valuable.
- **5-minute** onboarding sequence (`/init` → `CLAUDE.md` → `/memory` → Plan Mode → incremental build) recommended for every new project.

## What to Skip

- SKIP #19 Architecture Audit for every new project — overkill for our small features; we have `everything-claude-code:architect` on-demand.
- SKIP #29 Environment Setup Script as a generic — we already ship `scripts/generate-wallet.ts` and `npm install` postinstall patches.
- SKIP #28 CI Pipeline Builder — GitHub Actions already exist; don't let an agent rewrite them.
- SKIP #17 blind "parallel terminal for backend and frontend" — use our existing `/worksession` pattern which ensures proper branch hygiene.

## Concrete Integration Points

- `CLAUDE.md` Token Budget section — add "use `/compact` at 30-min or 70% context" threshold.
- `.claude/rules/debugging.md` — NEW. "Paste complete error + stack trace. Diagnose step-by-step before proposing fix."
- `.claude/skills/recovery.md` — NEW. Takes a goal restatement, runs `git show HEAD~1:$FILE`, discards context.
- `scripts/dep-check.ts` — NEW. Wraps `npm view` + OSV DB lookup.
- `research/154-skills-commands-master-reference/` — add pointer to this doc so Khairallah's checklist is searchable.

## Sources

- [Khairallah AL-Awady — 35 Claude Code Commands](https://x.com/eng_khairallah1/status/2046519525907317043)
- [Anthropic — Claude Code docs index](https://docs.claude.com/en/docs/claude-code/overview)
- [Claude Code keyboard shortcuts reference](https://docs.claude.com/en/docs/claude-code/cli-reference)
