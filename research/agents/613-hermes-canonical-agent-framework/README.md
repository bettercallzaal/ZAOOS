---
topic: agents
type: decision
status: research-complete
last-validated: 2026-05-05
related-docs: 234, 459, 487, 491, 506, 528, 541, 547, 568, 570, 600, 601, 604, 605, 607, 611, 612
tier: STANDARD
---

# 613 - Hermes is the canonical agent framework for ZAO (locked)

> **Goal:** Lock the framework decision. Every ZAO agent uses the Hermes claude-cli subprocess pattern. No openclaw revival. No Composio AO. No Agent Zero. No CrewAI / AutoGen / LangGraph. Doc 605 already said skip-all-frameworks; this doc records WHY Hermes wins, what the pattern actually is, and the 6 anti-patterns to never propose again.

## Key Decisions

| Decision | Action |
|----------|--------|
| Hermes pattern is canonical | YES, locked 2026-05-05. Pattern lives at `bot/src/hermes/claude-cli.ts`. Every new agent uses `callClaudeCli()`. |
| openclaw container resurrection | NEVER. Workspace deleted 2026-05-05 (4.6GB freed). Don't propose, don't experiment. |
| Composio AO | NEVER. Decommissioned 2026-05-04 per doc 601. |
| Agent Zero | NEVER. Doc 601 rejected, doc 605 confirmed. Needs API key, paid. |
| CrewAI / AutoGen / LangGraph | NEVER for ZOE-side. Doc 605e detailed why. |
| Ollama as low-cost classifier alongside Hermes | YES, wired 2026-05-05 via `bot/src/zoe/ollama.ts`. Doc 612 spec. |
| Future agents follow same pattern: grammy + Hermes + per-bot brand.md + Letta blocks | YES. New file in `bot/src/<system>/agents/<name>.ts`, exports an Agent shape, registers in agents/index.ts. |

## What "Hermes pattern" actually is

Six concrete properties. Every ZAO agent has all of them.

### 1. Claude CLI subprocess via Max plan OAuth

Not an SDK call. Spawn the `claude` binary with arguments. Auth comes from `claude /login` having been run once on the VPS - OAuth token persists. Zero API key, zero per-token billing.

File: `bot/src/hermes/claude-cli.ts` `callClaudeCli(opts)` is the single entry. All ZOE agents go through it.

```typescript
const result = await callClaudeCli({
  model: 'sonnet',
  prompt: userPrompt,
  cwd: repoDir,
  appendSystemPrompt: SYSTEM_PROMPT,
  allowedTools: ['Read', 'Glob', 'Grep'],
  outputFormat: 'json',
});
```

### 2. System prompt via flag (not chat history)

System prompt passes via `--append-system-prompt`. Stateless - each call carries its full context. State (memory, conversation, captures) lives on disk in `~/.zao/zoe/`.

This is why we don't use the Anthropic Agent SDK: it makes session/state management implicit, which becomes opaque debugging when something breaks. Hermes pattern keeps state EXPLICIT in JSON files.

### 3. Strict tool allowlist + denylist

`allowedTools` is a positive list. `disallowedTools` blocks dangerous ops (Edit/Write/git push/git commit/git reset/rm). Both pass as CLI flags. ZOE concierge.ts shows the pattern:

```typescript
allowedTools: [
  'Read', 'Glob', 'Grep',
  'Bash(gh issue list*)',
  'Bash(gh pr list*)',
  'Bash(git log*)',
  'mcp__playwright__browser_snapshot',  // doc 605 Phase 1 unlock
],
disallowedTools: [
  'Bash(git push*)', 'Bash(git commit*)', 'Bash(git reset*)',
  'Bash(rm*)', 'Edit', 'Write',
],
```

### 4. JSON output format

`--output-format json` returns a parseable envelope: `{ result, usage, total_cost_usd, duration_ms, num_turns, session_id, is_error }`. Every agent reads from `result.text` and logs `result.totalCostUsd` for budget tracking.

Token + cost telemetry is built-in. No third-party tracer needed for basic accounting (Langfuse adds tracing on top per doc 605 Phase 1).

### 5. Letta-style memory blocks on disk

Each bot has its own `~/.zao/<botname>/` directory with named markdown blocks:
- `persona.md` - identity + voice rules (always loaded into system prompt)
- `human.md` - facts about the user (Zaal's preferences, schedule, projects)
- `recent.json` - ring buffer of recent turns
- `tasks.json` - open task queue

ZOE concierge builds the prompt by concatenating these blocks. Tasks/captures are JSON arrays appended atomically. No database, no embedding store, no vector DB - flat files.

### 6. grammy Telegram bot frontend

ZOE, ZAOstock, Devz all use grammy as the bot library. Polling mode (no webhooks, simpler ops). Allowlist guard for sensitive bots (only Zaal's user_id for ZOE).

## What Hermes does NOT use (and why)

| Anti-pattern | Why not | Decommissioned |
|--------------|---------|---------------|
| Docker containers (openclaw style) | Extension hell, resource overhead, opaque state | 2026-05-04 + workspace deleted 2026-05-05 |
| Anthropic Agent SDK | Implicit state management, paid per token, locks us in | doc 605a |
| OpenAI Agents SDK | API key billing, voice-first features we don't need | doc 605a |
| Composio AO | Was tried, decommissioned for visible state surface but no real win | 2026-05-04 |
| Agent Zero | Paid API + complex orchestration we don't need | doc 605 |
| CrewAI | Python only, our stack is TypeScript | doc 605e |
| AutoGen 0.4 | Token-burn risk in conversation loops | doc 605e |
| LangGraph | Cloud observability cost (LangSmith), graph-DAG mental model overkill for our 2-3 phase loops | doc 605e |
| Trigger.dev v4 | Cloud-first, doesn't match VPS-only deploy | doc 605e |
| Inngest Agent Kit | Too new, no production deployments to learn from yet | doc 605e |
| n8n agent nodes | Visual-first, ZAO is code-first | doc 605e |

## How to add a new agent (the canonical recipe)

Step-by-step. Use this every time.

### 1. Create the agent file

`bot/src/zoe/agents/<name>.ts` (or `bot/src/<system>/agents/<name>.ts` for non-ZOE bots)

```typescript
import type { Agent } from './index';
import { callClaudeCli } from '../../hermes/claude-cli';

const SYSTEM = `You are ZOE's <name> subagent. <Voice rules>. <Output format>.`;

export const agent: Agent = {
  name: '<name>',
  description: '<one-line>',
  triggers: [
    /^@<name>\s+(.+)/is,
    /^\/<name>\s+(.+)/is,
  ],
  handle: async (match, ctx): Promise<string> => {
    const input = match[1].trim();
    if (!input) return 'Usage: @<name> <args>';

    const result = await callClaudeCli({
      model: 'sonnet',  // or 'haiku' for cheap classify, 'opus' for hard reasoning
      prompt: input,
      cwd: ctx.repoDir,
      appendSystemPrompt: SYSTEM,
      allowedTools: ['Read', 'Glob', 'Grep'],
      outputFormat: 'json',
    });

    return result.text.trim() || '(<name> returned empty)';
  },
};
```

### 2. Register

`bot/src/zoe/agents/index.ts`:

```typescript
import { agent as <name>Agent } from './<name>';

export const AGENTS: Agent[] = [
  recallAgent,
  researchAgent,
  newsletterAgent,
  zaostockAgent,
  <name>Agent,  // <-- add here
];
```

That's it. `tryRouteAgent()` walks the list, first regex match wins. No new wiring in index.ts.

### 3. Test locally

```bash
cd bot && npx tsc --noEmit
```

### 4. Deploy

Push to branch, SSH VPS, `git pull`, `systemctl --user restart zoe-bot.service`. Single one-liner. The VPS does NOT have a deploy script that bundles - tsx runs the source directly.

## When to NOT use Claude (use Ollama instead)

Per doc 612, VPS has Ollama on `:11434` with llama3.1:8b loaded. Use it for:

| Task | Tool | Why |
|------|------|-----|
| Inbox label classification | Ollama | Free, deterministic, on-VPS |
| Bonfire entity-class proposal first-pass | Ollama | Free, can defer to Sonnet on ambiguity |
| Audit subagent first-pass | Ollama | Cheap fact-check before Sonnet validates |
| Newsletter writing | Sonnet | Voice quality |
| Brand-assistant outputs | Sonnet | Public-facing, voice locked |
| Concierge replies | Sonnet (or Opus on escalate) | Personal, on-brand |
| Research subagent sourcing | Sonnet/Opus | Hallucinates URLs on llama |

Wrapper: `bot/src/zoe/ollama.ts` - `ollamaChat`, `ollamaClassify`, `ollamaHealth`.

Pattern in any new agent that does classification:

```typescript
import { ollamaClassify } from '../ollama';

// Step 1: deterministic regex match (URL patterns, exact keywords)
const regexLabel = matchKnownPatterns(text);
if (regexLabel) return regexLabel;

// Step 2: Ollama for free-text intent
const ollamaLabel = await ollamaClassify(text, LABELS, 'unknown');
if (ollamaLabel !== 'unknown') return ollamaLabel;

// Step 3: Sonnet only for ambiguous edge cases
const claudeLabel = await callClaudeCli({ ... });
return claudeLabel;
```

This three-tier routing keeps Sonnet calls bounded.

## Telemetry + observability

Every `callClaudeCli()` returns `totalCostUsd`, `inputTokens`, `outputTokens`, `durationMs`. Log them. Per doc 605 Phase 1, wrap with Langfuse traces (parent-child) once the self-host lands on VPS.

Spend tracking lives at `~/.zao/<botname>/spend.json` per doc 611 §Phase 3.

Daily 9pm reflection (per doc 606) reports total spend.

## Cross-bot dispatch (per doc 607)

When ZOE relays to ZAOstock or Hermes, it does NOT share runtime. Each bot has its own grammy instance, its own token, its own systemd unit. ZOE relays via Telegram API call to the OTHER bot's token, posting the message into the destination chat.

Example: `@zaostock` agent in ZOE calls `bot${ZAOSTOCK_BOT_TOKEN}/sendMessage` to drop a message in the team chat. Two independent bots, one user-facing thread.

This is the cleanest scaling pattern. Adding a 5th bot doesn't require a shared message bus or a control plane - just another systemd unit + token.

## Codebase touchpoints (where Hermes pattern lives)

- `bot/src/hermes/claude-cli.ts` - the canonical `callClaudeCli()` function
- `bot/src/zoe/agents/` - five live agents using the pattern (recall, research, newsletter, zaostock, + soon inbox)
- `bot/src/zoe/agents/index.ts` - registry
- `bot/src/zoe/ollama.ts` - low-cost local LLM wrapper
- `bot/src/zoe/concierge.ts` - free-form fallback when no agent matches
- `bot/src/zoe/brief.ts` + `reflect.ts` + `tips.ts` - cron-driven Hermes calls
- `~/.zao/zoe/persona.md` + `human.md` + `recent.json` + `tasks.json` - on-disk memory blocks (VPS)

## Anti-pattern detection (what to NEVER ship)

If a code-review agent reads `bot/src/` and sees any of the below, FAIL the review and ask for rewrite to Hermes pattern:

- Any `import { Anthropic } from '@anthropic-ai/sdk'` - use `callClaudeCli` instead
- Any `import OpenAI from 'openai'` - we don't use OpenAI in the bot stack
- Any `Docker.run`, `dockerode`, or shelling out to `docker` for an agent - openclaw is dead
- Any orchestration framework imports (CrewAI / AutoGen / LangGraph)
- Any agent that stores state in a database other than Supabase (in-memory or file-based blocks only)
- Any agent that bypasses `callClaudeCli` and shells `claude` directly with custom args
- Any new bot that doesn't have a brand.md voice file in its source tree

## Next Actions

| # | Action | Owner | Type | By When |
|---|--------|-------|------|---------|
| 1 | Memory updated to mark Hermes canonical + Ollama available | Claude | Memory | Done 2026-05-05 |
| 2 | Doc 612 cross-link from 605 / 607 / 611 added | Claude | Doc edit | Same |
| 3 | Add anti-pattern lint to CI (grep src/ for forbidden imports) | Claude | CI | Doc 611 Phase 5 |
| 4 | Re-validate this doc when adding 6th agent (will probably surface gaps) | Claude | Doc update | After 6th agent ships |

## Sources

- doc 547 - multi-agent coordination Bonfire+ZOE+Hermes (the precursor)
- doc 601 - agent stack cleanup decision (where Hermes won option D)
- doc 604 - best concierge agents 2026 (the broader survey)
- doc 605 - agentic tooling May 2026 (DISPATCH that confirmed skip-all-frameworks)
- doc 607 - three bots one substrate (cross-bot relay pattern)
- doc 611 - ZOE autonomy v2 (the next layer of capability built on Hermes)
- doc 612 - VPS audit + AgentMail + Ollama (the runtime context)
- Live audit 2026-05-05 - 5 agents shipped, all on Hermes pattern, zero exceptions
- `bot/src/hermes/claude-cli.ts` - the actual pattern
- `bot/src/zoe/agents/*.ts` - live applications of it
