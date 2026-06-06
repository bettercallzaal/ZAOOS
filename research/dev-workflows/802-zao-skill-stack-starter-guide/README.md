---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-06-05
superseded-by:
related-docs: 154, 801, 232, 663
original-query: "Push the skill-usage audit into a starter guide as a second doc so I or anyone else can just pick up all my skills - document the working set even if it's just /zao-research."
tier: STANDARD
---

# 802 — ZAO Skill Stack: Starter Guide

> **Goal:** A pick-up-and-go guide to the skills, MCPs, and discipline that actually run Zaal's Claude Code. Built from measured usage (629 sessions), not the full installed catalog. If you onboard to this machine - or future-Zaal forgets - start here.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **Learn 8 skills, not 1,066** | ~1,066 skills are installed; real work runs on ~8. The rest is catalog. This guide is the 8. |
| 2 | **zao-research + clipboard are the spine** (~70% of all skill use) | Research everything, get text out of the terminal. Master these two first. |
| 3 | **Run /worksession before any work** | It creates an isolated `ws/` branch. Skipping it caused real branch + push bugs (see doc 801). A SessionStart guard now nudges when you forget. |
| 4 | **MCP stack: supabase + context7 + serena daily; playwright/exa/github task-specific** | See doc 801 for the full audit. 4 daily + 3 task-specific, dead servers disabled. |

## The Working Set (the 8 skills that matter)

Measured by real invocations across 629 sessions. This is the whole job.

| Skill | Trigger | What it does | When you reach for it |
|-------|---------|--------------|-----------------------|
| **zao-research** | `/zao-research <topic>` | 3-tier research (QUICK/STANDARD/DEEP), checks the 800-doc library first, then web + community sources, writes a numbered doc, opens a PR | Any "look into X", "research Y", "what's the best Z". The single front door for learning. |
| **clipboard** | `/clipboard` | Opens a local HTML page with content formatted to copy/share; saves history to `~/.zao/clipboard/` | Any time you need text OUT of the terminal - a summary, a block to paste into Telegram/Firefly/email |
| **meeting** | `/meeting <path-or-url>` | Turns a recording/transcript into action items, a recap doc, Bonfire episode, Telegram block, calendar | Right after any call. Undertriggering wastes the capture. |
| **inbox** | `/inbox` | Processes ZOE's email queue (zoe-zao@agentmail.to) - links, ideas, research topics forwarded by Zaal | Clearing forwarded reading/research backlog |
| **handoff** | `/handoff` | Compresses the current session into a portable markdown bundle to resume elsewhere (another terminal, claude.ai, future-you) | End of a session you want to continue later or on another machine |
| **autoresearch** | `/autoresearch` | Karpathy-style autonomous loop: modify, verify, keep/discard, repeat against a metric | A task with a measurable goal you want iterated without babysitting |
| **vps** | `/vps` | SSH manage ZOE + agents on the VPS, or send Telegram messages | Checking/restarting ZOE, the agent squad, sending a bot message |
| **worksession** | `/worksession` | Creates an isolated git worktree/branch so parallel terminals don't collide | START of every work session. Non-negotiable - prevents the branch-hygiene class of bug. |

Everything else (newsletter, socials, onepager, big-win, morning, reflect, qa, ship, review, fractal, design, bonfire, browse, etc.) is real and occasionally useful but NOT load-bearing. Reach for them by name when the moment is obvious; don't try to memorize them.

## The MCP Stack (summary - full audit in doc 801)

| Tier | Servers | Use for |
|------|---------|---------|
| Daily | supabase, context7, serena | DB work / live library docs / code edits + refactors |
| Task-specific | playwright, exa, github, grep | QA + browser / research fallback / PR work / cross-repo code search |
| Disabled (dead weight) | gitnexus, ECC memory, sequential-thinking | 0 real calls; pure context tax |

Two habits to build (both underused per doc 801):
- **Serena for code edits/refactors** - symbol-level tools (`find_symbol`, `replace_symbol_body`, `rename_symbol`) cut 60-80% of tokens on the ZAOOS monorepo and make renames reference-safe. Use native Read/Grep for quick lookups only.
- **context7 auto-fires** on Next.js/React/Wagmi/Tailwind/Supabase tasks (CLAUDE.md rule) to kill hallucinated APIs.

## The Discipline (3 rules that prevent rework)

1. **`/worksession` first.** Isolated branch per terminal. A SessionStart hook (`~/bin/worksession-guard.sh`, added 2026-06-05) nudges you when you start on main, detached HEAD, or with a stale push refspec.
2. **Research becomes a doc, a doc becomes an action.** Every `/zao-research` run ends with a Next Actions table and fires a tracker task. Research without an action bridge stays archived (doc 801, 802 both follow this).
3. **Never commit secrets or third-party PII.** `.claude/rules/secret-hygiene.md` + `pii-hygiene.md` are enforced; raw Gmail/Calendar/Drive output goes to `~/.zao/private/`, never the repo.

## Config Map (where the stack is defined)

| What | Where |
|------|-------|
| ZAO custom skills (53) | `~/.claude/skills/` |
| Plugin skills (~1,013, mostly ECC) | `~/.claude/plugins/` |
| Skill on/off overrides (~180 ECC skills disabled) | `~/.claude/settings.json` -> `skillOverrides` |
| MCP server allow-list | `~/.claude/settings.json` -> `permissions.allow` |
| Hooks (SessionStart guard, safe-git-push, post-edit) | `~/.claude/settings.json` -> `hooks` |
| Project rules (api-routes, components, tests, secret/PII hygiene) | `.claude/rules/*.md` |
| Project instructions | `CLAUDE.md` (project) + `~/.claude/CLAUDE.md` (global: no emojis, no em dashes, brand glossary) |
| Full skill/command reference | [Doc 154](../154-skills-commands-master-reference/) |

## 60-Second Quick Start (new person on this machine)

1. Open Claude Code in the project. Type `/worksession` - you get an isolated branch.
2. Need to learn something? `/zao-research <your question>`. It writes a doc + PR.
3. Editing code in ZAOOS? Let Serena drive (symbol tools), not whole-file reads.
4. Finished a call? `/meeting <recording>`. It distributes everything.
5. Need to share text out of the terminal? `/clipboard`.
6. Leaving mid-task? `/handoff` - resume anywhere later.

That's 90% of the job. The other 1,058 skills can wait until you have a reason.

## Also See

- [Doc 801](../801-mcp-usage-audit-where-to-lean-in/) - the MCP usage audit this guide summarizes
- [Doc 154](../154-skills-commands-master-reference/) - complete skill/command reference
- [Doc 232](../232-mcp-server-development-guide/) - building MCP servers

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Pin this doc as the onboarding entry point for anyone picking up the stack | @Zaal | Habit | Now |
| Add context7 auto-invoke rule to CLAUDE.md (carry-over from doc 801) | @Zaal | PR | This week |
| Build the Serena-for-edits habit; measure token delta on next refactor | @Zaal | Habit | Next code task |
| Re-measure skill + MCP usage in 30 days; confirm working set held | @Zaal | Audit | 2026-07-05 |

## Sources

- Measured usage data from `~/.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/*.jsonl` (629 session transcripts, real tool_use invocations) [FULL]
- [Doc 801 - MCP Usage Audit](../801-mcp-usage-audit-where-to-lean-in/) [FULL]
- [Doc 154 - Skills/Commands Master Reference](../154-skills-commands-master-reference/) [FULL]
- `~/.claude/settings.json` (skillOverrides, hooks, MCP allow-list - inspected 2026-06-05) [FULL]
