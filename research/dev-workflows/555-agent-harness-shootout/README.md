---
topic: dev-workflows
type: comparison
status: research-complete
last-validated: 2026-04-29
related-docs: 506, 507, 508, 548, 549, 549d, 551
tier: STANDARD
---

# 555 - Agent Harness Shootout: 1code vs QuadWork vs DevFleet vs ECC vs obra/superpowers vs Lazer

> **Goal:** Pick the canonical multi-agent / harness layer for ZAO. Promised in [Doc 549d](../549d-21st-dev-ai-features-magic/). Now urgent because `1code` has emerged as a real Cursor-clone competitor with worktree isolation per chat, GH/Linear/Slack triggers, and a Pro tier ZAO could plausibly use today.

## TL;DR

**Keep the stack we have.** Specifically:

- **QuadWork** = canonical local 4-agent pipeline for ZAO repo PRs. Working, ZAO-tuned, free.
- **ECC + obra/superpowers** = canonical skill libraries (review, build, plan, TDD, debug). Already wired.
- **Claude Code CLI** = canonical agent runtime (uses Max sub auth per memory `feedback_prefer_claude_max_subscription`).

**Try 1code as a parallel experiment**, NOT a replacement, on a single repo (BCZ portfolio refresh) for 1 week. Open-source mode is free. If background agents + worktree-per-chat genuinely beats QuadWork's local-dashboard model, reconsider.

**Skip:** DevFleet (no real ZAO use case post-QuadWork), Lazer's `/lazer` router (it routes its own template skills, not ZAO ones).

## Contestants Verified 2026-04-29

| Name | Type | License | Cost | Maturity | ZAO already on it |
|---|---|---|---|---|---|
| **QuadWork** | Local 4-agent dashboard | Custom (ZAO-built) | Free, uses Claude Max sub | v1.12.0, daily-driver | **Yes** |
| **ECC** (`affaan-m/everything-claude-code`) | Skill + plugin library | MIT | Free | 200+ skills, very active | **Yes** |
| **obra/superpowers** | Skill library | MIT | Free | Daily-active | **Yes** |
| **1code** (`21st-dev/1code`) | Visual desktop multi-agent client | Apache 2.0 | Free OSS / Pro $20 / Max $100 | 5,494 stars, last commit 2026-03-06 | No |
| **Claude DevFleet** (`everything-claude-code:claude-devfleet`) | Multi-agent task orchestration | MIT (via ECC) | Free | Skill exists; usage low | Marginal |
| **dmux** (`everything-claude-code:dmux-workflows`) | tmux-based agent panes | MIT | Free | Skill exists; usage low | Marginal |
| **Lazer `/lazer` router** | Template-skill router for generated mini apps | MIT | Free | New, narrow scope | No (Doc 548 = spike-only) |

## Side-by-side Capabilities

| Capability | QuadWork | ECC + obra | 1code | DevFleet | dmux | Lazer router |
|---|---|---|---|---|---|---|
| Multi-agent (>2 in parallel) | **Yes (4)** | Sequential by skill | **Yes** | Yes | Yes (panes) | No |
| Visual UI | Local dashboard `127.0.0.1:8400` | None (CLI) | **Desktop app + web/mobile PWA** | None | tmux | None |
| Worktree isolation per chat | Yes (manual) | Manual | **Built-in** | Manual | Manual | Manual |
| GitHub trigger | Manual | Manual | **@1code mention** | Manual | Manual | No |
| Linear trigger | No | No | **@1code mention** | No | No | No |
| Slack trigger | No | No | **@1code mention** | No | No | No |
| Git push trigger | Manual | Hook-based | **Built-in** | No | No | No |
| Background agents (cloud sandbox) | No | No | **Pro tier** | No | No | No |
| Live browser preview | No | No | **Yes** | No | No | No |
| Kanban view | No | No | **Yes** | No | No | No |
| MCP server marketplace UI | No | Plugin via Claude Code | **Yes (toggle, configure, delete)** | No | No | No |
| Skill library size | n/a | **200+ skills** | n/a | ~80 | n/a | 11 |
| ZAO domain knowledge built-in | **Yes** | No (generic) | No | No | No | No |
| Cost | Free | Free | Free OSS / $20 / $100 | Free | Free | Free |

## Where Each Wins

### QuadWork wins for ZAO repo PR pipeline
- Tuned to ZAO conventions
- Issues -> Dev codes -> 2 reviewers -> Head merges = real PR pipeline
- Uses Claude Max sub (free vs API billing per memory `feedback_prefer_claude_max_subscription`)
- Works inside the ZAO mental model

### ECC + obra/superpowers wins for skill depth
- Plan, brainstorm, TDD, review, build-error, code-review, security-review, refactor, doc-update - all there
- Active maintenance; new skills shipped weekly per Doc 507
- Already integrated in Zaal's session start

### 1code wins for cross-tool orchestration + UI surface
- One desktop app talks to Claude Code AND Codex - swap agents per task
- GH / Linear / Slack triggers solve the "I want a bot to file an issue and dispatch a coding agent" problem natively
- Worktree-per-chat exactly addresses Doc 554's collision problem
- Visual diff + file viewer + integrated terminal + browser preview = closer to Cursor UX than Claude Code CLI
- Pro $20/mo background agents could replace cron-based `/loop` patterns

### Skip DevFleet + dmux for now
- ZAO has not adopted them despite skills existing for 3+ months
- Functionality overlaps with QuadWork (multi-agent) without ZAO-specific tuning
- Maintaining yet-another-orchestrator is overhead

### Skip Lazer `/lazer` router
- It routes Lazer's own template skills (auth, web3, contracts, etc.) inside Lazer-generated mini apps
- Not a generic ZAO orchestrator
- Pattern is interesting (skill-as-router) but already in our `/zao-research`, `/quad`, etc.

## Concrete 1-Week Experiment Plan (1code Spike)

If we test 1code, scope it tight to avoid full migration:

| Day | Action | Outcome |
|---|---|---|
| 1 | Install 1code OSS on Zaal's Mac. Open BCZ portfolio repo (lowest stakes). | Baseline UI feel |
| 1 | Wire @1code Slack trigger to BCZ Slack channel | Test trigger flow |
| 2-3 | Run a single small task (e.g. "refresh BCZ hero with /21st") via 1code, end-to-end | Compare time-to-PR vs QuadWork |
| 4 | Try Pro tier ($20) for 1 week to test background agents on a slow refactor | Decide if background mode beats local |
| 5 | Run a 1code task on the FISHBOWLZ -> Juke transition map (Doc 558 future work) | Larger task, same comparison |
| 6 | Decision: keep 1code as parallel tool / replace QuadWork / discard | Documented in next research doc |
| 7 | Cancel Pro if not adopted | Bill stops |

Total cost cap: $20.

## Risks

| Risk | Mitigation |
|---|---|
| 1code locks us into a desktop client when our work is CLI-native | Keep QuadWork running in parallel; 1code is additive not replacement |
| Apache 2.0 with Pro/Max paid tiers - vendor could change OSS scope | Free OSS path already covers most needs |
| Running both 1code AND QuadWork doubles agent burn on the same repo | Scope 1code to BCZ during spike, ZAO OS V1 stays QuadWork-only |
| Memory rule `feedback_prefer_claude_max_subscription` says CLI > API; 1code's background agents might use API | Verify in Pro tier - if API-billed, kill subscription |

## Why 1code Is Genuinely Different (Sleeper Insight)

`1code` (5.5K stars) is by **the same team that ships `magic-mcp`** (4.8K stars, Doc 549). 21st-dev appears to be building both **the component layer** AND **the agent orchestration layer** for AI-native dev shops.

If they pull this off: a single company controls component generation + agent orchestration + UI scaffolding for the next-gen Cursor-style workflow. That's a real strategic position.

For ZAO, the takeaway is **track 21st-dev as a company**, not just a tool. Pattern lifts (CLI-as-MCP from Doc 548, skill-router from Doc 549, worktree-per-chat from 1code) are valuable independent of adoption.

## Action Bridge

| Action | Owner | Type | By When |
|---|---|---|---|
| Continue using QuadWork + ECC + obra/superpowers as primary stack | Zaal | n/a | Ongoing |
| Run 1-week 1code spike on BCZ portfolio repo | Zaal | Time-boxed spike | Optional, this month |
| If 1code worktree-per-chat solves Doc 554 collisions, document and migrate | Zaal | Conditional | Post-spike |
| Revisit DevFleet + dmux skips quarterly | n/a | Calendar | 2026-07-29 |
| Keep watching `1code` releases (currently 2026-03-06 last commit) | n/a | Monthly | 2026-05-29 |

## Also See

- [Doc 506 - TRAE skip](../506-trae-ai-solo-bytedance-coding-agent/) - sets the canon ECC + obra stack
- [Doc 507 - Claude skills 1116 ecosystem](../507-claude-skills-1116-ecosystem-zao-picks/) - skill library tier picks
- [Doc 548 - Lazer Mini Apps CLI](../../farcaster/548-lazer-miniapps-cli-evaluation/) - Lazer's `/lazer` router pattern
- [Doc 549d - 21st AI features](../549d-21st-dev-ai-features-magic/) - 1code mentioned, this doc is the promised follow-up
- [Doc 554 - Worktree collision postmortem](../554-worktree-collision-postmortem/) - 1code's worktree-per-chat would have prevented today's incidents
- [Doc 497 - QuadWork deep dive](../../agents/497-quad-workflow-deep-dive/)

## Sources

- [21st-dev/1code GitHub](https://github.com/21st-dev/1code) - Apache 2.0, 5,494 stars, v0.0.84, last commit 2026-03-06
- [1code.dev pricing](https://1code.dev) - Free OSS / Pro $20 / Max $100
- [1code.dev/changelog](https://1code.dev/changelog) - feature history
- QuadWork skill at `~/.claude/skills/quad/SKILL.md` - v1.12.0
- ECC repo `affaan-m/everything-claude-code` - 200+ skills
- obra/superpowers - skill library
- Memory `feedback_prefer_claude_max_subscription`, `project_zao_master_context`, `feedback_oss_first_no_platforms`

## Staleness Notes

1code last commit 2026-03-06 - if no further releases by 2026-05-29, downgrade urgency. If the team ships another major version, re-validate this doc.
