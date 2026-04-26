---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-04-26
related-docs: 461, 506, 507, 508, 523, 524, 527
tier: STANDARD
---

# 528 - pi.dev Coding Agent (Mario Zechner / @badlogic)

> **Goal:** Decide whether ZAO should adopt or steal patterns from pi.dev - a 40K-star MIT-licensed multi-provider terminal coding agent that just shipped v0.70.2 yesterday. Direct competitor to Claude Code CLI, which Hermes Coder + Critic currently use.

Trigger: Zaal sent https://pi.dev/ asking for research.

## Key Decisions

| Decision | Verdict | Why |
|----------|---------|-----|
| Replace Claude Code CLI in Hermes pair with pi as primary backend | **NO** | Claude Code CLI uses Max plan flat auth ($200/mo absorbs marginal). Pi requires per-provider API keys, would add metered billing on top of Max. Plus Claude Code's Read/Edit/Write/Glob/Grep tool surface is mature, well-documented; switching breaks the working coder.ts/critic.ts loop. |
| Adopt pi as **fallback / multi-provider escape hatch** when Max plan rate-limits | **YES, BACKLOG** | Per doc 527 cost calibration, Max plan ~500 req/mo cap. If ZAO scales > 15 /fix/day for 2 weeks, we already plan to evaluate direct API. pi makes that switch easier (one pi binary, swap provider via flag). MIT license, no vendor lock. |
| Adopt **pi-skills** (1,377 stars, badlogic/pi-skills) as the canonical skill format for ZAO | **YES, INVESTIGATE** | pi-skills is "compatible with Claude Code and Codex CLI" - same skill definitions work across all three. ZAO already has 30+ user skills + ECC plugin (200+ skills). Aligning to pi-skills format = portability future-proofing. Read the format spec, see if porting our skills is cheap. |
| Steal **message queuing** pattern (steer mid-execution, drop follow-ups while agent thinks) | **YES, STEAL** | Hermes pair currently fires-and-forgets a /fix run. No way for Zaal to say "wait, change the approach" mid-Coder. Pi's message queue is a clean primitive. Wire it into Hermes runner.ts via Telegram reply-to-Coder-message capture. |
| Steal **session export to HTML/gist** pattern | **YES, STEAL** | Every Hermes run already has a hermes_runs row + diff + Critic feedback. Generating a shareable HTML export at the end gives Zaal an audit trail he can paste into a PR comment or share with collaborators. |
| Use **overstory** (1,245 stars) as runtime adapter to let Hermes Coder use either Claude Code OR Pi backend | **YES, INVESTIGATE** | Overstory is "Multi-agent orchestration for AI coding agents - pluggable runtime adapters for Claude Code, Pi, and more." If we wrap our coder.ts spawn behind overstory's adapter, swapping backends becomes one config flag. |
| Use **pi-messenger** (519 stars) for multi-agent communication | **NO** | We already built our own Telegram-narrator pattern in `bot/src/devz/index.ts`. pi-messenger is for inter-pi-agent-process communication, not Telegram-facing fleets. Skip. |
| Use **pi-mcp-adapter** (489 stars) | **DEFER** | Lets pi consume MCP servers despite pi's no-MCP design. Useful if we ever want pi to call our existing ECC + Composio MCP servers. Wait until we have a concrete pi adoption first. |

## What pi.dev Is

Per https://pi.dev + https://github.com/badlogic/pi-mono README:

- **Author:** Mario Zechner (Earendil Inc.) - same person who built libgdx + Spine 2D animation tool. Reputable.
- **Tagline:** "There are many coding agents, but this one is mine."
- **Philosophy:** Deliberately minimal. NO MCP, NO sub-agents, NO permission popups, NO plan mode, NO todos, NO background bash. Build/install those as extensions if you want them.
- **Stack:** TypeScript monorepo. Packages: `coding-agent` (CLI), `ai` (unified provider), `tui` (terminal UI), `pods` (?), `mom` (?), `web-ui`.
- **License:** MIT
- **Repo:** github.com/badlogic/pi-mono - **40,150 stars** as of 2026-04-26
- **Latest npm:** `@mariozechner/pi-coding-agent` v0.70.2 (published 2026-04-24, yesterday)
- **Active:** monorepo updated today

## Features

- **15+ AI providers** via unified `pi-ai` package: OpenAI, Anthropic, Google, Azure, Bedrock, Mistral, Groq, etc.
- **Tree-structured sessions** with shareable history; export to HTML or GitHub gists
- **Context engineering** via `AGENTS.md` + `SYSTEM.md` project files, auto-compaction, skills system, prompt templates
- **Message queuing** - inject steering commands or follow-ups while the agent is working
- **Extensibility** through TypeScript modules accessing tools, commands, shortcuts, and the full TUI
- **Four integration modes:**
  1. Interactive TUI
  2. Print / JSON output (headless, like `claude -p --output-format json`)
  3. RPC protocol (talk to a running pi process)
  4. SDK embedding (import as a library)

## Ecosystem (verified via gh api 2026-04-26)

| Repo | Stars | What |
|------|-------|------|
| badlogic/pi-mono | 40,150 | The monorepo - agent + ai + tui + mom + pods + web-ui |
| badlogic/pi-skills | 1,377 | Skills system. Compatible with Claude Code + Codex CLI. |
| jayminwest/overstory | 1,245 | Multi-agent orchestration. Pluggable runtime adapters for Claude Code + Pi + more. |
| disler/pi-vs-claude-code | 863 | Direct comparison repo. 12-category feature matrix. |
| nicobailon/pi-messenger | 519 | Multi-agent communication extension for pi. |
| nicobailon/pi-mcp-adapter | 489 | MCP support for pi (since pi itself has no native MCP). |

## Pi vs Claude Code (the question that matters)

Per disler/pi-vs-claude-code (no benchmarks but feature matrix):

| Dimension | Claude Code | Pi |
|-----------|-------------|-----|
| License | proprietary (Anthropic) | MIT |
| Provider lock-in | Anthropic only | 15+ providers |
| Auth | Max plan OAuth + API key | per-provider API keys |
| MCP support | native | only via pi-mcp-adapter (489 stars) |
| Sub-agents | native (`--agents` JSON, `Agent` tool) | not native; build via extensions |
| Plan mode | native | not native |
| Permissions | UI prompts + `--permission-mode` | none built-in (minimal philosophy) |
| Todos | native plan-mode tool | not native |
| Background bash | yes | no |
| Hooks | rich PreToolUse/PostToolUse/etc | extensions API |
| Cost on ZAO Max plan | $0 marginal | $$ per provider call |
| Cost OFF Max plan | metered Anthropic API | metered (any provider you point at) |
| Track record | 12 mo, Anthropic-backed, ~123K stars (anthropics/skills) | 8 mo, 40K stars, single solo+community-backed |

**Where Pi wins:** multi-provider, MIT, fully extensible, minimal/portable, message queuing.
**Where Claude Code wins:** Max plan economics, MCP, sub-agents, mature tools, Anthropic-backed support.

## ZAO Context (codebase touchpoints)

- `bot/src/hermes/claude-cli.ts` - currently spawns `claude -p` subprocess. Could be swapped to spawn `pi` with similar args + a unified-provider flag.
- `bot/src/hermes/coder.ts` - prompts Coder via `--append-system-prompt`. Pi has `AGENTS.md` + `SYSTEM.md` in cwd. Different convention but achievable.
- `~/.claude/skills/` (30+ user skills) - if pi-skills format is compatible, port path is short.
- `community.config.ts` - no current refs to pi or related; clean slate.
- Doc 507 (skills curated picks) - pi-skills was NOT on that list. Add now if format compatible.

## Sources

- [pi.dev landing](https://pi.dev/) - product overview + tagline + 4-mode pitch
- [github.com/badlogic/pi-mono](https://github.com/badlogic/pi-mono) - 40,150 stars, MIT, TS, monorepo
- [npm @mariozechner/pi-coding-agent](https://www.npmjs.com/package/@mariozechner/pi-coding-agent) - v0.70.2, published 2026-04-24
- [github.com/badlogic/pi-skills](https://github.com/badlogic/pi-skills) - 1,377 stars, Claude-Code-compatible skills
- [github.com/jayminwest/overstory](https://github.com/jayminwest/overstory) - 1,245 stars, runtime adapter
- [github.com/disler/pi-vs-claude-code](https://github.com/disler/pi-vs-claude-code) - 863 stars, comparison
- [github.com/nicobailon/pi-mcp-adapter](https://github.com/nicobailon/pi-mcp-adapter) - 489 stars, MCP shim
- [github.com/nicobailon/pi-messenger](https://github.com/nicobailon/pi-messenger) - 519 stars, multi-agent comms
- Mario Zechner = @badlogic, creator of libgdx, Spine 2D (esoteric.software). Public reputation since ~2010.

## Staleness + Verification

- All star counts via `gh api repos/<owner>/<repo>` 2026-04-26
- npm version verified via registry.npmjs.org 2026-04-26
- pi-mono updated 2026-04-26 (today). High velocity.
- Re-validate by 2026-05-26 - 40K stars in 8 months means rapid evolution; check if features Pi explicitly omits get added by extension ecosystem.

## Next Actions

| # | Action | Owner | Type | By |
|---|--------|-------|------|-----|
| 1 | Read [pi-skills README](https://github.com/badlogic/pi-skills) - is the format identical to Claude Code skills (`.claude/skills/<name>/SKILL.md`)? Cheap port if yes. | Claude (next session) | Read | This week |
| 2 | Read [overstory README](https://github.com/jayminwest/overstory) - if its adapter API is clean, scaffold a `bot/src/hermes/runtime/` abstraction so coder.ts can swap Claude Code vs Pi via env flag | Claude | Code | Next sprint |
| 3 | Steal **message queuing** pattern - extend Hermes runner.ts to capture Telegram replies during a Coder run as steering input that the Coder reads on its next tool turn | Claude | Code | Next sprint |
| 4 | Steal **session export to HTML** - generate a `hermes-run-{id}.html` from each completed run with diff + Critic feedback, attach to PR description as gist link | Claude | Code | Next sprint |
| 5 | Add pi to doc 507 (1,116 skills + tools curated picks) - install picks list. Star count + provider breadth justify it. | Claude | Doc edit | This week |
| 6 | Try pi locally as a one-off: `npm i -g @mariozechner/pi-coding-agent` + run a sample task with our `OPENAI_API_KEY` - feel the UX. Decide if it stays in tier-3 backlog or graduates. | Zaal or Claude | Manual test | Anytime |
| 7 | Re-validate this doc 2026-05-26 with 30 days of Hermes production data + Pi version delta | Claude | Audit | 2026-05-26 |

## Also See

- Doc 507 - 1,116 Claude skills curated picks (pi was not on Polydao's list - add it)
- Doc 506 - TRAE SOLO skip-decision (vendor risk reference; pi avoids that risk via MIT + open ecosystem)
- Doc 523 - Hermes spec (where pi could plug in as alternate backend)
- Doc 527 - multi-bot Telegram coordination playbook
- `bot/src/hermes/claude-cli.ts` - the file we'd modify to support Pi as a backend
