---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-05-06
related-docs: 234, 459, 547, 601, 605, 607, 611, 613
tier: STANDARD
---

# 618 - AGENTS.md spec audit + ZAOOS adoption status

> **Goal:** Audit ZAOOS against the AGENTS.md open spec (60k+ projects adopted). Confirm what we have, identify drift between AGENTS.md and CLAUDE.md, decide whether to consolidate or keep the dual-file split.

## Key Decisions

| Decision | Action |
|----------|--------|
| Keep AGENTS.md + CLAUDE.md dual-file split (don't merge) | YES. Already in place. AGENTS.md = mechanical config any agent needs (commands, testing, code style, git). CLAUDE.md = Claude Code behavioral orchestration (session start, plan-first, subagents, primary surfaces). Cleanly separated. |
| Add per-package AGENTS.md mirror where CLAUDE.md exists | YES, future-low-priority. We have `packages/{config,agents,publish,db}/CLAUDE.md` but no AGENTS.md siblings. If we ever want Cursor/Codex friendly contributions per-package, mirror them. |
| Cleanup: dedupe Boundaries section between the two files | YES, this session. Keep mechanical "ask first / never do" in AGENTS.md, keep workflow-orchestration in CLAUDE.md. |
| Add cross-link from root AGENTS.md to `/agents/<role>/AGENTS.md` persona files | YES, this session. Currently not discoverable. |
| Rename `/agents/<role>/AGENTS.md` (persona files) to avoid spec collision | DONE 2026-05-06. Renamed to `PERSONA.md` for the 4 roles (ceo, founding-engineer, researcher, security-auditor). Root AGENTS.md links updated. |
| Adopt the AGENTS.md badge / discoverable presence | NO. Repo is private. Not relevant to the 60k public count. |

## What AGENTS.md actually is

Per agents.md (verified 2026-05-06):

- "Standard Markdown, no required fields"
- A README.md companion file specifically for AI coding agents (think: setup commands, test runner, code conventions, git workflow, security boundaries)
- Started by OpenAI Codex team, now an open spec adopted by 60k+ public repos
- Every major coding tool reads it: Claude Code, Cursor, Codex, Aider, Jules (Google), Factory, Goose, Opencode, Zed, Warp, VS Code, Devin, Junie (JetBrains), Amp, RooCode, Gemini CLI, Phoenix, Semgrep, Ona, Windsurf, Augment Code, GitHub Copilot Coding Agent
- Common section names: `Setup`, `Commands`, `Testing`, `Code Style`, `Project Structure`, `Git Workflow`, `Security`, `Conventions`

Distinct from README.md:
- README is for humans (project description, install, contributing)
- AGENTS.md is for agents (what commands to run, what code style to follow, what NOT to touch)

## ZAOOS state today (2026-05-06)

### Top-level files

| File | Purpose | Lines | Status |
|------|---------|-------|--------|
| `/AGENTS.md` | Universal agent config - commands, testing, code style, git, boundaries | 112 | Live, well-shaped |
| `/CLAUDE.md` | Claude Code behavioral orchestration - lab framing, plan-first, subagents, primary surfaces | 151 | Live, slightly overlaps |

### Per-package CLAUDE.md (no AGENTS.md siblings)

- `packages/config/CLAUDE.md`
- `packages/agents/CLAUDE.md`
- `packages/publish/CLAUDE.md`
- `packages/db/CLAUDE.md`

These are CLAUDE-only. Cursor/Codex users in those subtrees get nothing.

### Spec-collision: `/agents/<role>/AGENTS.md`

- `agents/founding-engineer/AGENTS.md`
- `agents/ceo/AGENTS.md`
- `agents/security-auditor/AGENTS.md`
- `agents/researcher/AGENTS.md`

These files are NOT the project-level AGENTS.md spec - they are **system prompts** for specialized agent personas Zaal spawns. Same filename, different purpose. A coding agent walking the tree might pick these up and get confused, but in practice they sit in their own directories and don't get loaded as project context.

### Other agent-instruction surfaces

- `.claude/rules/*.md` - 6 files (api-routes, components, secret-hygiene, skill-enhancements, tests, typescript-hygiene). Loaded by Claude Code via system reminder hook.
- `bot/src/zoe/persona.md` (on VPS at `~/.zao/zoe/persona.md`) - ZOE concierge identity
- `bot/src/zoe/brand.md` - Year-of-the-ZABAL voice rules for content agents
- `~/.zao/zoe/facts.md` (VPS only) - persistent facts memory

## AGENTS.md vs CLAUDE.md content overlap

Both files have a `## Boundaries` section. Comparing:

| Section | AGENTS.md says | CLAUDE.md says |
|---------|----------------|----------------|
| Always Do | Validate inputs Zod, `@/` alias, mobile-first, parallel `Promise.allSettled` | Same items, different phrasing |
| Ask First | DB migrations, new deps, env vars, community.config.ts changes | Same plus "agent trading parameters" |
| Never Do | Commit secrets, skip Zod, Redux/Zustand, CSS modules | Same items |

Drift risk: someone updates one file, forgets the other. Since AGENTS.md was added more recently and CLAUDE.md is older + has more drift over time, the source of truth for Boundaries should be AGENTS.md, with CLAUDE.md pointing to it.

## What ZAOOS does well (per AGENTS.md spec)

- Root AGENTS.md exists. Readable, scannable.
- Commands section has every npm script with purpose.
- Testing section names framework + helpers + per-file commands.
- Code Style section has 9 specific conventions including dark theme colors.
- Git Workflow names branch convention (`ws/<desc>-MMDD-HHMM`) and PR rule.
- Cross-link to CLAUDE.md for Claude-specific behavior.

## What ZAOOS is missing (per spec + general best practice)

1. **Security section in AGENTS.md.** Spec lists "Security considerations" as common section. CLAUDE.md has it. AGENTS.md should mirror or cross-reference.
2. **Per-package AGENTS.md.** Spec recommends per-subdir agent files for monorepos. We have CLAUDE.md per-package but no AGENTS.md.
3. **No link from root AGENTS.md to `/agents/<role>/AGENTS.md`.** Coding agents can't find the persona files.
4. **No "What this is NOT" or scope-out section.** ZAOOS is a lab + monorepo - agents could touch graduating projects (ZAOstock spinout this week) without realizing the convention. Worth one paragraph.
5. **No commit message format example.** AGENTS.md says "Conventional commits" but doesn't show a real one.
6. **No mention of bot/src/zoe** - agents working in that subtree have no orientation. Bot has its own conventions (Hermes pattern, Letta memory blocks, grammy framework) that aren't captured anywhere they'd find.

## Cleanup actions (this session, lightweight)

These are 30 min total. All on root AGENTS.md.

1. Add `## Security` section in AGENTS.md mirroring CLAUDE.md's, with cross-link.
2. Add `## Specialized agent personas` section linking to `/agents/<role>/AGENTS.md` files with one-line each.
3. Add `## Bot subtree (bot/src/)` section pointing to doc 613 (Hermes canonical) for the pattern + bot/src/zoe/persona.md as the live persona.
4. Add `## Boundaries are mirrored in CLAUDE.md` note in CLAUDE.md - source of truth = AGENTS.md.
5. Add commit message example block in AGENTS.md (`feat(zoe): X` format).

## Done in follow-up commit (same PR)

- Renamed `agents/<role>/AGENTS.md` -> `PERSONA.md` (4 files) to remove spec collision.
- Added `bot/AGENTS.md` covering Hermes pattern, memory blocks, voice/brand split, secrets, key files. Closes the orientation gap for any agent landing in the `bot/` subtree.

## Future cleanup (not this session)

- Mirror per-package CLAUDE.md -> AGENTS.md for `packages/{config,agents,publish,db}` so non-Claude agents work in those subtrees too. Lower priority than `bot/` since most live work is in `bot/`.
- Add `.cursorrules` symlink to AGENTS.md for Cursor users (most modern Cursor versions read AGENTS.md natively but legacy users still expect `.cursorrules`).

## What this confirms about the agentic system

ZAOOS is in a strong position:
- Universal config (AGENTS.md) ✓
- Tool-specific deep config (CLAUDE.md) ✓
- Per-package context (4 packages have CLAUDE.md) ✓
- Specialized agent personas (4 in `/agents/`) ✓
- Live runtime memory blocks for ZOE (`~/.zao/zoe/`) ✓
- Hermes canonical pattern doc (613) ✓
- Three-bots-one-substrate operating model (607) ✓
- Per-bot brand voice files (bot/src/zoe/brand.md) ✓

What's missing is mostly cosmetic linking and a security mirror in AGENTS.md. The architecture itself is good.

## Codebase touchpoints (where the cleanup lands)

- `AGENTS.md` (root) - extend with Security, Personas, Bot Subtree, Commit Examples
- `CLAUDE.md` (root) - add note "Boundaries source: AGENTS.md"
- No new files

## Next Actions

| # | Action | Owner | Type | By When |
|---|--------|-------|------|---------|
| 1 | Apply 5 cleanup actions to AGENTS.md + CLAUDE.md | Claude | PR | This session |
| 2 | Mirror per-package CLAUDE.md to AGENTS.md (4 files) | Claude | PR | Lower priority, next session |
| 3 | Decide on `/agents/<role>/` rename to PERSONA.md | @Zaal | Decision | Whenever |
| 4 | Re-validate this doc 30 days from now | Claude | Doc update | 2026-06-06 |

## Sources

- [agents.md homepage](https://agents.md) - 60k+ adoption confirmed 2026-05-06
- [Doc 613 Hermes canonical agent framework](../../agents/613-hermes-canonical-agent-framework/)
- [Doc 547 Multi-agent coordination Bonfire+ZOE+Hermes](../../agents/547-multi-agent-coordination-bonfire-zoe-hermes/)
- [Doc 607 Three bots one substrate](../../agents/607-three-bots-one-substrate/)
- Direct read of `AGENTS.md`, `CLAUDE.md`, `packages/*/CLAUDE.md`, `agents/*/AGENTS.md` 2026-05-06
- [GitHub agent-config tool support](https://github.com/openai/codex) - Codex was the original AGENTS.md proposer
