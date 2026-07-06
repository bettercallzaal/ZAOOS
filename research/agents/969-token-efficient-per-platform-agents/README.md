---
topic: agents
type: decision
status: research-complete
last-validated: 2026-07-05
related-docs: 601, 604, 460, 968
original-query: "how to best use Claude tokens, and create one agent for each of my social medias/platforms that owns it with the right context when I want to use those platforms"
tier: STANDARD
---

# 969 - Token-Efficient Per-Platform Social Agents

> **Goal:** Two linked questions - (1) how to spend Claude tokens well, and (2) how to have "the right context, per platform, on demand" when Zaal posts/engages. Answer: do NOT build a bot-per-platform (that was killed in doc 601); build per-platform CONTEXT PROFILES loaded on demand, and follow cache-aware token discipline.

## Key Decisions (recommendations first)

| Decision | Do this | Why |
|---|---|---|
| **NOT one bot per platform** | Reuse ONE agent (ZOE) + a per-platform context profile loaded on demand | Doc 601 already decommissioned the "10-bot branded fleet"; more bots = more idle context cost + split-brain + ops burden |
| **Per-platform context profiles** | One `platforms/<name>.md` block per platform (voice, do/don't, cadence, current goals, best-post examples, the adapter to call) | Load only the platform you need, not all 8 - keeps context small (cheaper + higher quality) |
| **Reuse the publish adapters** | `src/lib/publish/{x,farcaster,telegram,discord,lens,bluesky,threads,hive}.ts` already exist | Posting is solved; the gap is CONTEXT, not plumbing |
| **Cache-aware work** | Batch work into <5-min bursts; never idle-heartbeat a loop past the 5-min cache TTL | Cache reads are 0.1x input cost; a miss is 10x more expensive for the same context |
| **Subagents for research/audit** | Isolate broad reads in subagents; they return only a summary | Their intermediate reads never enter the main context window |

## Part 1 - Token efficiency (grounded facts)

**Anthropic prompt-cache mechanics (verified 2026-07-05):**
- Cache TTL: **5 minutes** default (1 hour extended, at higher write cost).
- Cache **read** = **0.1x** base input price (90% cheaper). Cache **write** = 1.25x (5-min) / 2x (1-hour).
- Opus 4.8 minimum cacheable segment: **1,024 tokens**. Max **4** cache breakpoints/request; 20-block lookback. A hit needs a byte-identical prefix.

**What that means:** turns within 5 minutes of each other re-read the shared prefix at 0.1x. Cross the 5-minute line and the whole prefix is re-read at **full** price.

**What actually burned tokens in this session (real evidence):**
1. **6-agent parallel audit = ~430K tokens** in one shot (agents self-reported 60-90K each). Parallel fan-out is powerful but expensive; scope it to the question.
2. **The overnight loop at 2,700s (45-min) intervals** = a cache MISS every tick. ~20 ticks each re-read this large context at full price to write one line. Slowing *past* the 5-min window to "conserve" did the opposite. If a loop must idle, either stay <5 min (stay cached) or **end it** - a dormant heartbeat on a big context is pure waste.
3. **Large standing context** (long history + big system prompt) makes every turn costly regardless; `/compact` and `/clear` between unrelated tasks are the levers.

**Rules to adopt (see Next Actions):**
- End loops when the work is done; don't heartbeat idle.
- If a loop must persist, keep the cadence inside the 5-min cache window OR accept the miss deliberately (don't pretend 45-min "conserves").
- Use subagents for broad reads/audits (isolated context, summary-only return).
- `/compact` after each work phase; `/clear` between unrelated tasks; `/context` to see where tokens go.
- Prefer one focused agent with a small loaded profile over many always-on agents.

## Part 2 - Per-platform "ownership" without a bot fleet

**The trap:** "one agent per platform" reads as one always-running bot per platform. Doc 601 (2026-05-04) explicitly killed the 10-bot branded fleet and set the rule: **"new brand voices = persona block, NOT a new bot."** Rebuilding it would re-introduce the exact cost/split-brain problems that cleanup removed.

**The real need restated:** when Zaal opens X (or Farcaster, YouTube, etc.), the agent should already know that platform's voice, audience, current goals, what's performed well, and how to post there.

**The design - per-platform CONTEXT PROFILE, loaded on demand:**

```
platforms/
  farcaster.md   x.md   youtube.md   telegram.md
  discord.md     linkedin.md   instagram.md
```
Each profile carries: voice rules, audience, current campaign/goals, 3-5 best-performing examples, cadence, do/don't, and the posting path (`src/lib/publish/<name>.ts` or the miniapp/Firefly flow). A thin `/platform <name>` command (or a ZOE mode) loads ONE profile + its adapter for the task, then unloads. This is token-efficient by construction: you pay context for one platform, not eight.

**Why this beats a bot fleet:** one memory/identity (no split-brain), only the needed platform context is resident, the publish adapters already exist, and it honors the 601 decision. It scales by adding a markdown profile, not a process.

## Findings table

| Option | Token cost | Ops burden | Respects doc 601 | Verdict |
|---|---|---|---|---|
| One bot per platform (8+ processes) | High (8 always-on contexts) | High (8 deploys, tokens, split-brain risk) | NO | REJECT |
| Per-platform context profiles + 1 agent | Low (load 1 profile on demand) | Low (add a .md) | YES | ADOPT |
| Status quo (ad-hoc, no profiles) | Low | Low | n/a | Loses the "right context" benefit |

## Also See

- [Doc 601](../601-agent-stack-cleanup-decision/) - the 5-surface cleanup + no-new-bots rule (the constraint).
- [Doc 604](../604-best-personal-concierge-agents-2026/) - concierge-agent patterns.
- [Doc 460](../460-zao-agentic-stack-end-to-end-design/) - end-to-end agent stack design.
- [Doc 968](../../security/968-zaoos-codebase-audit-2026-07-05/) - the audit whose 6-agent fan-out is the token-cost example above.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add `feedback` memory: end loops when done, never idle-heartbeat past the 5-min cache window (shipped = memory file written) | Zaal (via Claude) | Memory | 2026-07-05 |
| Create `platforms/` profile dir with farcaster.md + x.md as the first two (shipped = 2 profiles committed + a `/platform` loader) | Zaal | PR | 2026-07-12 |
| Wire the `/platform <name>` loader to reuse `src/lib/publish/<name>.ts` (shipped = command loads profile + adapter) | Zaal | PR | 2026-07-19 |

## Sources

- [Anthropic Prompt Caching docs](https://platform.claude.com/docs/en/docs/build-with-claude/prompt-caching) [FULL] - TTL 5min/1hr, read 0.1x, write 1.25x/2x, Opus 4.8 min 1,024 tokens, 4 breakpoints.
- [Best practices for Claude Code](https://code.claude.com/docs/en/best-practices) [PARTIAL - index page; core practices confirmed via the community synthesis below].
- [claudefa.st - Claude Code context management](https://claudefa.st/blog/guide/mechanics/context-management) [FULL via search synthesis] - /compact, /clear, /context, subagent isolation (separate context, summary-only return).
- [MindStudio - 10 techniques to manage Claude Code token usage](https://www.mindstudio.ai/blog/how-to-manage-claude-code-token-usage) [PARTIAL - community source].
- Codebase (ground truth): `src/lib/publish/` (8 platform adapters), `bot/src/zoe/` (persona/human-context model), doc 601 no-new-bots rule.
