---
topic: agents
type: decision
status: research-complete
last-validated: 2026-05-20
related-docs: 460, 467, 524, 527, 676, 677, 683
tier: DEEP
---

# 684 - ZAO Bot Fleet Architecture (locked)

> **Goal:** ZAO runs 5+ bots with no shared design - ~40% duplicated code, no agreed comms pattern, a prior 7-agent squad (openclaw) that collided and was killed. This doc locks the fleet architecture from a 4-question grill with Zaal (2026-05-20) plus 3 background research dispatches. It is the buildable blueprint for doc 683's #1 consolidation opportunity (the `bot/_shared/` extraction).

## Locked decisions (Zaal grill, 2026-05-20)

| # | Decision | Detail |
|---|----------|--------|
| 1 | **ZOE is the single human-facing bot** | Zaal interacts only with ZOE. Every other bot is reached through her, never directly. |
| 2 | **A capability earns its own bot only if it has its own audience or channel** | ZAOcoworkingBot has the cowork team; ZAOscribe has a Discord. Capabilities only Zaal uses stay as ZOE skills. Fleet stays small - target 3-6 bots. |
| 3 | **Every bot is built from one shared core** | A new bot is a ~250-LoC wrapper, not a fresh codebase. Kills the duplication. |
| 4 | **Bots hand off through shared state, never direct calls** | The knowledge graph (Bonfire) holds shared memory. A small task list with claim/status fields holds the actual "do this next" handoffs. |
| 5 | **Build order: rebuild ZOE on the shared core first** | ZOE is the highest-stakes bot (Zaal's daily interface), so the rebuild is build-alongside + cutover - never a yank-and-replace. |

## Why this shape (3-dispatch research synthesis)

**Topology - lean fleet on a shared core, not one mega-bot, not 5 silos.** One unified bot loses failure isolation (one crash kills everything) and observability (can't trace which sub-skill burned spend). Five silos = the ~40% duplication measured in doc 683a. The middle is specialized bots that all import one core.

**Comms - a graph alone cannot do handoffs.** The Bonfire KG is excellent for shared *memory* (every bot "knows" the same facts) but has no task ownership, no arrival signal, no retry/ordering. So two bots can grab the same job, or a handoff silently never gets picked up. The fix: the graph stays the *retrospective memory*; a tiny task list with `status` / `owner` / `claimed_at` / `ttl` fields is the *coordination skeleton*. ZAOcoworkingBot's `data/actions.json` is already this pattern - it generalizes.

**The collision lesson.** The openclaw 7-agent squad died partly from direct bot-to-bot calls colliding (doc 527, doc 683). Shared-state handoff structurally prevents that - no bot ever calls another; they read and write a common queue.

## The shared core - `@zao/bot-core`

Ten modules. Each bot imports the ones its manifest declares.

| Module | What it does |
|--------|--------------|
| `telegram-io` | grammy polling, DM vs group routing, allowlist gating, reply chunking |
| `discord-io` | discord.js equivalent for Discord bots (ZAOscribe) |
| `memory-blocks` | Letta-style 4-block memory (persona / human / working / context), ring buffer, daily refresh |
| `claude-cli-runner` | unified Claude Code CLI subprocess - model select (haiku/sonnet/opus), cost + token capture, timeout |
| `task-list-client` | the handoff layer - read/claim/update a shared task list with `status`/`owner`/`ttl` |
| `bonfire-graph-client` | writes episodes to the Bonfire KG (shared memory); stub until the SDK lands |
| `octokit-wrapper` | GitHub read/write + PR open (Hermes + any bot syncing state to a repo) |
| `rate-limiter` | per-chat token bucket + a fleet-wide daily USD cap circuit-breaker |
| `secret-scan` | pre-send regex scan so a bot never leaks a key into a chat (mirrors `scripts/git-secret-scan.sh`) |
| `persona-loader` | hot-reload `brand.md` (fleet-wide rules) + per-bot `persona.md`, no restart |
| `cost-logger` | logs every LLM call to a shared table; powers the daily cap |

### Inherit vs implement

**Inherited from the core:** the I/O loop, memory assembly, the LLM call, task claim/poll, rate limiting, secret scan, persona reload, cost logging.

**Each bot implements (~250 LoC):** its `index.ts` entry point, its command handlers (`/add`, `/recall`, `/fix` - varies), its system prompt, its `persona.md`, and its own state backend if it has one.

### Bot manifest

Each bot ships a git-tracked `bot.manifest.json` (no secrets) - the "spec" the shared infra reads to configure itself:

```json
{
  "name": "zoe",
  "telegram_bot_name": "@zaoclaw_bot",
  "audience": "private",
  "allowlist": { "user_ids": [], "chat_ids": [] },
  "persona_file": "src/persona.md",
  "memory_home": "~/.zao/zoe",
  "core_modules": ["telegram-io", "memory-blocks", "claude-cli-runner", "task-list-client", "cost-logger"],
  "task_claim_types": ["daily", "interactive", "scheduled"],
  "cost_limits": { "daily_usd": 50, "model_preference": "sonnet", "escalate_to": "opus" }
}
```

### Where the core lives

**An npm package `@zao/bot-core`, published from `bettercallzaal/ZAOOS`.** In-repo bots (ZOE, Hermes, ZAOstockTeamBot) link it via the workspace; the 2 external bot repos (`songchaindao-dot/cowork-zaodevz`, `bettercallzaal/zaoscribe`) install it as a tagged git dependency and upgrade on their own schedule. A submodule cannot publish to npm and adds hot-fix friction; a ZAOOS-only folder locks the external bots into copy-paste drift.

## Migration - ZOE first, zero-downtime

Per decision #5. ZOE is the highest-stakes bot, so the rebuild never touches the running ZOE in place.

| Phase | Step |
|-------|------|
| 0 | Scaffold the `@zao/bot-core` package; extract the genuinely-shared modules from existing ZOE + Hermes code (start with `claude-cli-runner`, `memory-blocks`, `telegram-io`, `secret-scan`) |
| 1 | Build new-ZOE as a thin wrapper on the core, running ALONGSIDE current ZOE (separate bot token / staging unit) |
| 2 | Dogfood new-ZOE in parallel for a few days; current ZOE stays live the whole time |
| 3 | Cut over - swap the systemd unit, keep old ZOE one `systemctl restart` away for instant rollback |
| 4 | Migrate the next bot (ZAOcoworkingBot) onto the now-proven core - it becomes a ~250-LoC wrapper |

## Risks

| Risk | Mitigation |
|------|------------|
| ZOE rebuild breaks Zaal's daily interface | Build-alongside, never in-place; cut over only after parallel dogfooding; old unit kept for instant rollback |
| Shared-core version drift across 5 repos (2 external) | Semver tags on `@zao/bot-core`; monthly lockfile bump; `CHANGELOG.md` for breaking changes |
| Bonfire vector-read still admin-gated (doc 676) | Handoffs run on the task list, which does NOT depend on the graph; graph memory degrades gracefully to manual relay |
| Scope creep - "every capability becomes a bot" | The decision-#2 gate: no own audience/channel, no own bot - it stays a ZOE skill |

## Hard Numbers

- 4 grill decisions locked, 3 background research dispatches
- ~40% duplicated code across the 3 grammy bot repos today (doc 683a)
- 10 shared-core modules; ~250 LoC per new-bot wrapper
- 5 bots in scope (ZOE, Hermes, ZAOstockTeamBot, ZAOcoworkingBot, ZAOscribe); 2 live in external repos
- Target fleet size: 3-6 bots
- 1 prior fleet (openclaw, 7 agents) killed by direct-call collisions - the failure this architecture designs out

## Also See

- [Doc 467](../467-zao-bot-fleet-design-magnetiq/) - earlier bot-fleet design (the 10-bot branded fleet, since decommissioned); this doc supersedes its topology
- [Doc 527](../527-multi-bot-telegram-coordination-best-practices/) - multi-bot coordination + the openclaw collision lesson
- [Doc 683](../../dev-workflows/683-ecosystem-consolidation-automation/) - the audit; 683a is the bot-fleet sub-doc this blueprint executes
- [Doc 676](../676-bonfires-kg-utilization/) / [Doc 677](../677-bonfire-cowork-github-connection/) - the Bonfire graph as shared memory

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Scaffold `@zao/bot-core` + extract the 4 first shared modules | next session | PR | Phase 0 |
| Build new-ZOE wrapper on the core, alongside current ZOE | next session | PR | Phase 1 |
| Dogfood new-ZOE in parallel, then cut over | @Zaal + next session | Test + deploy | Phase 2-3 |
| Migrate ZAOcoworkingBot onto the proven core | next session | PR (cowork-zaodevz) | Phase 4 |
| Update doc 467 frontmatter - `superseded-by: 684` for the topology section | next session | doc edit | With Phase 0 |

## Sources

- 4-question architecture grill with Zaal, 2026-05-20 (decisions 1-5)
- 3 background research dispatches, 2026-05-20: fleet topology; graph-as-coordination-layer; shared-core spec
- Doc 683a (bot-fleet consolidation audit), Doc 467, Doc 527 - prior ZAO bot research
- Live code: `bot/src/zoe/`, `bot/src/hermes/`, `cowork-zaodevz` (ZAOcoworkingBot), `zaoscribe`
