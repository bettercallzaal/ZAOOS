# 440 - Claude Code + Process Level-Up (meta review)

> **Status:** Meta review + ship-next plan
> **Date:** 2026-04-19
> **Goal:** Step back from the portal/ZOE work and rank how to level up overall Claude Code workflow for solo-founder velocity. Companion to 5 live audit agents (zaoos-3 through zaoos-7) running right now on AO.

---

## Key Decisions / Recommendations

**Top 7 level-ups ranked by leverage-per-hour:**

| # | Lever | Why | Effort | Payoff |
|---|------|-----|--------|--------|
| 1 | **Parallel audit-agent pattern (we just did this)** | Spawn 3-5 AO sessions on the same problem with different angles, let cheapest one win. We used it tonight for the AO Offline banner. | 15 min setup, runs unattended | High - 5x throughput on ambiguous debugging |
| 2 | **Hooks in `.claude/settings.json`** | Automate "on every session start", "before commit", "after PR merge". No manual `/worksession` ever again. | 30 min | High - removes every recurring manual ritual |
| 3 | **Subagents in `.claude/agents/`** | Scoped personas (code-reviewer, researcher, doc-updater) that auto-fire for the right task. Beats cramming everything into main context. | 45 min per subagent | High - better focus + smaller context |
| 4 | **Custom slash commands in `.claude/commands/`** | Every repeated prompt becomes `/<name>`. E.g. `/publish newsletter`, `/matteo-intro`, `/ship-pr`. | 10 min each | High - kills copy-paste + saves brain |
| 5 | **Per-subtree CLAUDE.md hierarchy (doc 424)** | 5-tier nesting (global -> vault -> biz -> project -> feature). Walking up auto-loads. Already partial in packages/, finish it. | 1 hr to add ~14 files | High - ZOE + Claude Code know exact context without scrolling |
| 6 | **Claude Routines (doc 422)** | Scheduled cron-like + GH-event-triggered autonomous runs. We have morning brief via VPS cron - move it to Routines for off-VPS resilience. | 1 hr to port + test | Medium - frees VPS, adds monitoring |
| 7 | **Codex / cross-model adversarial review** | Use `/codex review` (doc 238) as second opinion on every non-trivial PR. Different model catches what Claude misses. | 0 - already installed | Medium - safety net on risky merges |

---

## What We Got Right Tonight

- **Parallel agent spawning** — 5 AO sessions on different audits. Waiting for their PRs.
- **Portal-todo as brain dump** — 34 todos living work + life, filterable, spawn-from-todo.
- **Telegram slash commands** — /todo /done /list /p1 /recap /summarize /focus, instant.
- **5am morning brief + 9pm evening reflect** — proactive nudges per Zaal's actual schedule.
- **Cookie auth rotated** - `qwerty1` -> 16-char random, env-driven, no re-prompt across devices for 30 days.

## What We Got Wrong Tonight

- Watchdog was **tmux-session-alive based**, not **process-alive based**. 27 orphan bots built up. Fixed with pgrep check.
- Portal form didn't validate project dir existed -> crash served as HTML -> user saw "Unexpected token <". Fixed.
- Caddy iframe wrapper broke AO absolute paths. Fixed with @aoAssets matcher (partial - still chasing WebSocket path).
- Leaked Telegram bot token in a committed script. Rotated via BotFather. Moved to `~/.env.portal`.
- Hit Hostinger CPU limit warning due to orphan bots.

## 5 Audit Agents Currently Running

| Session | Track |
|---|---|
| `zaoos-3` | Find exact AO WebSocket path, add to Caddy |
| `zaoos-4` | Alternative: reconfigure AO with basePath=/app OR drop iframe |
| `zaoos-5` | **doc 437** - Claude Code leverage audit (unused features pitch) |
| `zaoos-6` | **doc 438** - Portal UX phone audit (top 10 frictions) |
| `zaoos-7` | **doc 439** - Agentic stack redundancy audit (consolidation plan) |

Review their PRs in the morning. Pick winners.

---

## Deep Dive - The 7 Levers

### 1. Parallel audit-agent pattern (shipped)

Take any ambiguous debugging or design task. Write 3 prompts with different angles. Fire 3 `ao spawn` calls. Each gets its own git worktree + branch. Fastest / cleanest PR wins.

**ZAO reality check:** we did it tonight on the AO Offline banner. Agents zaoos-3 and zaoos-4 are working in parallel. Agents zaoos-5/6/7 are on unrelated research tracks. This is the killer move - 5x throughput for 1x prompt writing.

**Systematize:** new slash command `/multiagent <prompt>` that forks into N variations. Save as `~/.claude/commands/multiagent.md`.

### 2. Hooks in .claude/settings.json

Run a command on any Claude Code lifecycle event.

```json
{
  "hooks": {
    "SessionStart": [{ "command": "bash .claude/hooks/ensure-ws-branch.sh" }],
    "PreCompact": [{ "command": "bash .claude/hooks/wrap-session.sh" }],
    "PostToolUse": [{ "matcher": "Bash", "command": "bash .claude/hooks/log-shell.sh" }]
  }
}
```

**ZAO use:** auto-create `ws/` branch on SessionStart (kills the recurring "I forgot /worksession" bug). Auto-append session summary to `openclaw-workspace/memory/daily.md` on PreCompact. Audit-log every Bash invocation.

### 3. Subagents in .claude/agents/

Each subagent is a markdown file with a persona + scope.

```
.claude/agents/
  code-reviewer.md      # runs on `Task("code-reviewer", ...)` — scoped to diffs
  researcher.md         # runs when topic research requested
  doc-updater.md        # fires after PR merged
  telegram-responder.md # handles inbound bot messages
```

**ZAO use:** our 7-agent OpenClaw squad is the equivalent but Minimax-M2.7-based. Mirror them as Claude Code subagents for when we want higher quality + GitHub integration.

### 4. Custom slash commands in .claude/commands/

```
.claude/commands/
  zao-newsletter.md     # "/zao-newsletter" runs the full Year-of-the-ZABAL flow
  matteo-intro.md       # drafts the Matteo Tambussi Italy follow-up
  hyperframes-render.md # renders an HTML video spec via HyperFrames
```

**ZAO use:** every recurring operation. A newsletter draft is 400 tokens of scaffolding we paste today. Slash command collapses it to 10 keystrokes.

### 5. Per-subtree CLAUDE.md (doc 424)

Already partially done:
- `/CLAUDE.md` (project root) - done
- `/packages/*/CLAUDE.md` - 4 exist
- `/.claude/rules/*.md` - done

Missing (14 files to add):
- `/src/app/api/CLAUDE.md`
- `/src/components/CLAUDE.md`
- `/src/lib/{agents,livepeer,publish,music,spaces}/CLAUDE.md`
- `/packages/{livepeer,spaces,wavewarz,music}/CLAUDE.md`
- `/research/CLAUDE.md` + `/research/{agents,wavewarz,music,events,dev-workflows}/CLAUDE.md`

### 6. Claude Routines

Our morning brief + evening reflect + test-checklist ping run from VPS cron. If VPS dies, Zaal loses the ritual. Port to Claude Routines (Anthropic-hosted) for resilience + no VPS-watchdog babysitting.

Ship order:
1. Morning brief -> Routine schedule
2. Evening reflect -> Routine schedule
3. Test nudge -> Routine API trigger from portal
4. Recap/summarize -> keep as slash (interactive, not scheduled)

### 7. Codex cross-model review

`codex` is installed (doc 238). Use it on PRs where stakes matter (auth changes, wallet code, secrets handling). Different model, different blind spots. 200-IQ second opinion.

**Workflow:** `/ship` -> opens PR -> `/codex review <PR-url>` -> if green, merge. If red, fix and re-review.

---

## What NOT to Do

| Pattern | Why skip |
|---------|----------|
| Writing our own agent framework | OpenClaw + AO + Paperclip already cover it |
| Building an in-house LLM eval harness | `/autoresearch` + `/codex` cover evals |
| Migrating off Claude | Lock-in is cheap here; we benefit from the latest model weekly |
| One monorepo for everything | Keep `zao-portal-infra` as a mirror of VPS config, keep ZAOOS as the app |
| Real-time multi-user collab in portal | YAGNI at 1 user. Ship per-user JSON later when members arrive. |

---

## Comparison - Parallel-Agent Spawn Patterns

| Pattern | Spawn cost | Blast radius | When to use |
|---------|-----------|--------------|-------------|
| **AO parallel sessions (this)** | Claude API + git worktree | Isolated branch per session | Ambiguous debugging, design exploration |
| Task tool subagents in one session | Token budget in main session | Shared context | Tightly coupled sub-tasks |
| OpenClaw agent dispatch | Minimax M2.7 cost ~$0.002/call | Per-agent workspace | Scheduled / cron-like work |
| Paperclip task board | Same as OpenClaw | Per-project board | Long-running "CEO" style agents |
| Claude Routines | Subscription Pro 5/day, Max 15/day | GitHub repo state | Scheduled / API-triggered |

---

## ZAO Ecosystem Integration

### Where to write the level-ups

- `.claude/settings.json` - hooks
- `.claude/agents/*.md` - subagents
- `.claude/commands/*.md` - slash commands
- `~/.claude/skills/` - global skills (already 30+ installed)
- `infra/portal/bin/bot.mjs` - Telegram slash commands
- `research/agents/437-439` - audit agent outputs (incoming)
- `research/infrastructure/428-436` - portal build log

### Companion docs

- [doc 422 Claude Routines](../422-claude-routines-zao-automation-stack/)
- [doc 424 Nested CLAUDE.md + /wrap](../424-nested-claudemd-claudesidian-wrap-pattern/)
- [doc 429 Claude Code Skills deep dive](../429-claude-code-skills-deep-dive/)
- [doc 435 ZOE effectiveness v2 playbook](../../agents/435-zoe-effectiveness-v2-playbook/)
- [doc 436 phone agentic stack playbook](../../infrastructure/436-phone-agentic-stack-playbook-health/)
- Incoming from tonight: doc 437, 438, 439

---

## Ship-Next-48-Hours Plan

When Zaal is back + reviews 5 audit PRs:

1. Merge the AO Offline fix (whichever of zaoos-3 or zaoos-4 wins)
2. Skim doc 437 (Claude Code features to adopt). Pick 2 highest-value.
3. Skim doc 438 (portal UX). Pick top 3 fixes.
4. Skim doc 439 (stack redundancy). Decide if Paperclip stays or goes.
5. Write `/multiagent` slash command (15 min).
6. Add SessionStart hook for auto-worksession (15 min).
7. Test 3 - 5 complete.
8. Start using the stack for real work instead of testing it.

---

## Sources

- [Anthropic Hooks in Claude Code](https://docs.claude.com/en/docs/claude-code/hooks)
- [Anthropic Slash Commands](https://docs.claude.com/en/docs/claude-code/slash-commands)
- [Anthropic Subagents](https://docs.claude.com/en/docs/claude-code/sub-agents)
- [Companion doc 422](../422-claude-routines-zao-automation-stack/README.md)
- [Companion doc 429](../429-claude-code-skills-deep-dive/README.md)
- [Companion doc 435](../../agents/435-zoe-effectiveness-v2-playbook/README.md)
- [Companion doc 436](../../infrastructure/436-phone-agentic-stack-playbook-health/README.md)
