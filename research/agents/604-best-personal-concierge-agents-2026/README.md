---
topic: agents
type: decision
status: research-complete
last-validated: 2026-05-04
related-docs: 461, 529, 547, 568, 570, 581, 590, 599, 600, 601, 603
tier: STANDARD
---

# 604 — Best Personal Concierge AI Agent Architectures (2026) → Apply to ZOE

> **Goal:** Survey the best personal-concierge AI agent architectures shipping in 2026 (Letta, Mem0, Graphiti, Cognee + Anthropic patterns). Steal the patterns that make ZOE actually useful. Replaces the broken openclaw ZOE (Minimax + sqlite extension hell) with a Hermes-style Claude Code CLI subprocess bot loaded with proven memory + nudge patterns. Per Zaal feedback 2026-05-04: ZOE keeps generating random "·" pings and feels weak — fix by stealing best-in-class patterns, not ground-up invention.

## Recommendations (no preamble)

| Decision | Recommendation |
|---|---|
| **Build approach** | Custom bot/src/zoe/ via Hermes runtime pattern. NOT Letta SDK / Mem0 SDK / Cognee. Reuse what works, add only what's missing. |
| **Memory architecture** | Letta-style "memory blocks" pattern. 4 named blocks: `persona` (ZOE identity), `human` (Zaal facts), `working` (last 5 turns), `tasks` (current queue). Build context per turn from these blocks. |
| **Long-term memory** | Bonfire IS the long-term memory. ZOE queries via RECALL (manual relay until Joshua.eth ships SDK/MCP). Don't duplicate the graph in a separate vector store. |
| **Working memory** | Local JSON cache at `~/.zao/zoe-recent.json` — last 5 turns. Reset every 24h. |
| **Tool surface** | Read/Glob/Grep/Bash (read-only) for ZAOOS repo inspection. NO Edit/Write. Hermes is the code-fix brain, ZOE is the concierge brain. |
| **Model routing** | Sprint 1 cost routing already shipped: Sonnet default, Opus on hard reasoning, Haiku on factual one-liners. Self-route via JSON escalation flag, not keyword heuristics. |
| **Proactive nudges** | Max 4/day. Morning brief 5am EST (reuse existing morning-brief.sh). Evening reflection 9pm. Inline-keyboard dismiss options on every nudge. Quiet hours 9pm-9am. |
| **Empty-reply guard** | Validate Claude CLI response is non-empty + >5 chars before posting. Never deliver "·" or "" to Telegram. |
| **Self-improving memory (Letta)** | DEFER — too complex for v1. Add in Phase 2 when ZOE has stable behavior. |
| **Multi-agent debate (TradingAgents doc 603)** | DEFER — Phase 2. v1 is single-agent concierge. |
| **MCP integration** | When Bonfire ships MCP server, swap recall.ts to call MCP tool. Until then, manual relay. |

## Reference Systems Survey (verified 2026-05-04)

| System | Stars | License | Last commit | Key insight to steal |
|---|---|---|---|---|
| [Mem0](https://github.com/mem0ai/mem0) | 54,719 | Apache-2.0 | 2026-05-04 | Universal memory layer w/ MCP server. Auto-summarization. Hybrid vector+graph. |
| [Graphiti](https://github.com/getzep/graphiti) | 25,662 | Apache-2.0 | 2026-05-04 | Temporal knowledge graphs. Validity windows. Episodic memory. |
| [Letta](https://github.com/letta-ai/letta) | 22,422 | Apache-2.0 | 2026-05-04 | **Stateful agents w/ memory blocks**. CLI tool + Python/TS SDKs. Self-improving over time. |
| [Cognee](https://github.com/topoteretes/cognee) | 17,011 | Apache-2.0 | 2026-05-04 | "Brain in 6 lines of code." Multi-modal memory pipeline. |
| [Anthropic Memory MCP](https://github.com/modelcontextprotocol/servers) | (in MCP servers repo) | MIT | active | Native Claude memory server. KG queries via MCP tool calls. |
| TradingAgents (doc 603) | 66,034 | Apache-2.0 | 2026-05-04 | Multi-agent debate pattern. Bull/Bear before recommending. Two-tier LLM routing. |

**All 6 are Apache-2.0 or MIT. All shipping in 2026. Massive space.**

## Letta's Memory Blocks Pattern (the headline insight)

Letta's primary contribution is the "memory block" idea — agent context is structured into named blocks instead of monolithic prompt:

```typescript
// Letta example (from their README, 2026-05-04)
const agentState = await client.agents.create({
  model: "openai/gpt-5.2",
  memory_blocks: [
    { label: "human", value: "Name: Timber. Status: dog. Occupation: building Letta..." },
    { label: "persona", value: "I am a self-improving superintelligence. Timber is my best friend." }
  ],
  tools: ["web_search", "fetch_webpage"]
});
```

The blocks ARE the agent's persistent memory. Updates to blocks happen as the agent learns. Each turn loads blocks → assembles prompt → Claude responds → maybe updates blocks.

**Apply to ZOE:**

```typescript
// bot/src/zoe/memory.ts
const blocks = {
  persona: zoeIdentityFromSOUL(),                    // Year-of-the-ZABAL voice rules
  human: await loadHumanBlock(zaal_fid),              // Pulled from local cache + key Bonfire facts
  working: lastNTurns(5),                             // Recent conversation
  tasks: await loadTaskQueue()                        // Open tasks ZOE is tracking
};
const prompt = renderBlocks(blocks) + userMessage;
```

This is cleaner than the giant system-prompt-with-everything approach. Each block is independently updatable. ZOE can RECALL specific facts to hydrate the `human` block instead of dumping all of Zaal's bio.

## Memory Architecture Comparison (3 patterns)

### Pattern A — Flat (current ZOE openclaw)
- One giant SOUL.md loaded as system prompt
- LLM scans every turn, no structure
- **Failure mode:** context bloat, hallucination, slow

### Pattern B — Three-tier (MemGPT/Letta original)
- Working memory (in-context) + recall buffer (vector search) + archival (long-term)
- LLM uses functions to swap between tiers
- **Failure mode:** complex, requires custom tool calls, hard to debug

### Pattern C — Memory blocks + external graph (RECOMMENDED for ZOE)
- 4 named blocks loaded per turn (persona, human, working, tasks)
- Long-term memory = Bonfire (graph), queried via RECALL when needed
- LLM doesn't manage memory tiers — runner does
- **Failure mode:** simpler — block desync (mitigate by single-source-of-truth per block)

ZOE goes with Pattern C. Mirrors Letta's blocks pattern + leverages Bonfire as the graph. No vector store to maintain. No 3-tier complexity.

## Proactive Nudge Patterns (3 work, 3 fail)

### Patterns that work
1. **Time-anchored** — 5am morning brief, 9pm evening reflection. Predictable cadence. Easy to opt out of by ignoring.
2. **Event-anchored** — when a PR Zaal opened gets reviewed, ping. Trigger is real, ping is justified. Zero false positives.
3. **Dismiss-tracked** — every nudge ships with [skip] [later] [shelve] inline keyboard. Track dismissal rate per category. Auto-reduce noisy categories after 3+ dismissals.

### Patterns that fail
1. **Silent retries** — openclaw's hourly empty tool calls became "·" pings. **Anti-pattern: never retry on empty result.**
2. **Spam from "I noticed..." cards** — agents that surface "interesting findings" without filter become noise. Cap at 4/day total.
3. **Wake-time spam** — pinging during sleep hours kills trust. Quiet hours 9pm-9am are non-negotiable.

## Anti-Patterns (what NOT to do)

| Anti-pattern | Why it fails | What openclaw ZOE did wrong |
|---|---|---|
| Hourly silent ping retry | Manifests as garbage messages | "·" dots from empty tool-call attempts (2026-05-04 incident) |
| Trying to remember every chat | Context bloat, slow responses | Worked but barely — sqlite for embeddings, no message persistence |
| Multi-agent orchestration in v1 | Over-design, hard to debug | TradingAgents-style 5-team debate is Phase 2 (doc 603) |
| Asking permission for routine | "Would you like me to..." kills momentum | ZOE openclaw asked too much per SOUL.md anti-patterns section |
| Model picking by keyword regex | Brittle, breaks on edge cases | My selectModel() in earlier types.ts had this. Replace with self-route. |
| Custom Minimax brain when Claude Max plan is paid | Why pay twice? | Openclaw uses Minimax M2.7. We pay $200/mo Max plan separately. Switch. |
| Storing memory in extension hell | 60+ openclaw extension plugins, mostly unused | Reduce to ~5 native modules. Letta-blocks pattern. |
| "Memory has been reset" without actually resetting | Lying agents are catastrophic | Documented in doc 581 §"State Truthfulness" |

## Specific Architecture for ZOE v1

### File structure (next session implementation)

```
bot/src/zoe/
  index.ts        # Telegram polling for @zaoclaw_bot DMs, dispatch to concierge
  concierge.ts    # runConciergeTurn() — assembles memory blocks, calls Claude CLI
  memory.ts       # Memory block builder (persona, human, working, tasks)
  tasks.ts        # Task queue read/write — local JSON, mirrored to Bonfire on commit
  scheduler.ts    # node-cron triggers (morning, evening, hourly tip)
  recall.ts       # Bonfire bridge — manual relay until Joshua.eth SDK/MCP arrives
  brief.ts        # Morning brief generator (replaces ~/bin/morning-brief.sh)
  reflect.ts      # Evening reflection (3 questions to Zaal)
  types.ts        # Shared types — already drafted
  README.md       # Module docs
```

### Cost discipline

- Default model: Sonnet 4.6 (via Max plan, $0 marginal API cost)
- Hard reasoning escalates to Opus 4.7 — agent self-flags via JSON `{"escalate": true, "reason": "..."}`
- Quick factual queries → Haiku 4.5
- Hard cap: 50 LLM calls/day (would alert if exceeded)
- All via Claude Code CLI subprocess, no Anthropic API key needed

### Memory blocks template

```typescript
// bot/src/zoe/memory.ts
export interface MemoryBlocks {
  persona: string;     // ZOE identity, voice, anti-patterns
  human: string;       // Zaal facts (ENS, schedule, current projects, key relationships)
  working: string;     // Last 5 turns from this Telegram thread
  tasks: string;       // Open task queue snapshot
}

export async function buildMemoryBlocks(): Promise<MemoryBlocks> {
  return {
    persona: await readPersonaBlock(),     // From bot/src/zoe/persona.md (versioned in git)
    human: await readHumanBlock(),          // From local cache; refreshed daily via Bonfire RECALL
    working: await readRecentTurns(5),      // From ~/.zao/zoe-recent.json
    tasks: await readTaskQueue(),            // From ~/.zao/zoe-tasks.json
  };
}

export function renderPrompt(blocks: MemoryBlocks, userMessage: string): string {
  return [
    `<persona>\n${blocks.persona}\n</persona>`,
    `<human>\n${blocks.human}\n</human>`,
    `<working_memory>\n${blocks.working}\n</working_memory>`,
    `<tasks>\n${blocks.tasks}\n</tasks>`,
    ``,
    `Zaal: ${userMessage}`,
  ].join('\n\n');
}
```

This pattern is Letta-inspired but much simpler — flat strings instead of full block objects. Easy to debug.

### Self-route on hard reasoning

```typescript
// concierge.ts pseudocode
const result = await callClaudeCli({
  model: 'sonnet',
  prompt: renderPrompt(blocks, message),
  // ...
});

const parsed = JSON.parse(result.text);
if (parsed.escalate) {
  // Re-run on Opus
  const escalated = await callClaudeCli({
    model: 'opus',
    prompt: renderPrompt(blocks, message) + `\n\n[Note: Sonnet flagged this as needing deeper reasoning. Reason: ${parsed.reason}]`,
  });
  return JSON.parse(escalated.text);
}

return parsed;
```

Sonnet decides if it can handle the question. If not, escalates to Opus with the reason. Cost-efficient: Sonnet handles 80%+ of routine concierge ops, Opus only for hard.

### Loop discipline (max RECALL rounds)

Per doc 599 §"loop limit": max 3 RECALL rounds per Zaal turn. After 3, surface "I am stuck on X, need your input." Prevents loop spiral.

For v1: defer auto-RECALL entirely. ZOE asks Zaal in DM "should I check Bonfire for X?" — Zaal copies query to @zabal_bonfire, pastes back. Manual but works today + zero new infrastructure.

## Open Questions for Joshua.eth (Bonfires founder)

1. SDK API key for ZOE direct access — when?
2. MCP server roadmap — when ZOE could call `mcp__bonfires__recall(query)` natively?
3. Token billing model post-30-day-trial?
4. Cross-bonfire search — relevant for ZOE if/when ZAO grows multiple bonfires?

## Zaal's Answers (locked 2026-05-04)

1. **Voice:** Year-of-the-ZABAL — CONFIRMED. Clear, simple, spartan, active voice. No marketing. No emojis. No em dashes.
2. **Proactive nudge times:** 5am morning brief + 9pm evening reflection — CONFIRMED.
3. **Quiet hours:** NONE. Zaal prefers being pinged over ignored. **IMPORTANT: no 9pm-9am quiet window.** Ping whenever appropriate.
4. **Inline keyboard:** `[Now] [Later] [Shelve]` — 3 options. Now = handle it, Later = remind later same day, Shelve = file for indefinite. CONFIRMED.
5. **Group posting:** DM ONLY for now. No group posting. Doc 599 bridge group stays passive ingest.
6. **Self-improving memory (Letta-style):** YES, Phase 2 — ZOE updates its own `human` block when Zaal corrects facts.
7. **TradingAgents debate (doc 603):** SKIP. Keep researching efficiency patterns instead — make ZOE faster + leaner.

### Implications of "no quiet hours"

- Default cron-based proactive nudges (5am brief, 9pm reflection) anchored to Zaal's schedule.
- BUT: ZOE can also nudge ad-hoc (e.g., "PR #456 review came in", "calendar conflict tomorrow at 10am") at any hour.
- Mitigation: rely on Telegram's built-in mute (Zaal can mute the chat himself if he wants) instead of agent-side hour-gating.
- Dismiss-tracking still applies — if a category gets [Skip]'d 3+ times, auto-reduce.

## Migration Path

### Phase 1 — Build bot/src/zoe/ (this session, in flight)
- types.ts ✅ (already written)
- concierge.ts ✅ (already written, pre-pivot)
- memory.ts (new — not yet written)
- tasks.ts (new)
- scheduler.ts (new — replaces zoe-learning-pings cron + morning-brief.sh + evening-reflect.sh)
- recall.ts (new — manual relay until SDK)
- brief.ts (new — pulls from existing morning-brief.sh logic, ports to TS)
- reflect.ts (new — same for evening reflection)
- index.ts (new — Telegram polling main entry)
- README.md (new)

### Phase 2 — Cutover (next session)
- Stop openclaw container ✅ (already done 2026-05-04)
- Move TELEGRAM_BOT_TOKEN to bot/.env
- Add bot/src/zoe to systemd unit alongside zao-devz-stack + zaostock-bot
- Test from phone — DM @zaoclaw_bot, get ZOE-Hermes-brain reply

### Phase 3 — Migration cleanup (this week)
- Stop zoe-learning-pings python cron (replaced by bot/src/zoe/scheduler.ts)
- Stop morning-brief.sh + evening-reflect.sh (replaced by bot/src/zoe/brief.ts + reflect.ts)
- Update CLAUDE.md to point at ZOE Telegram as the daily-driver concierge

### Phase 4 — Add Letta-style self-improvement (later, optional)
- ZOE updates its own `human` block based on what Zaal corrects
- ZOE updates `tasks` block status when it sees evidence of completion (commit msg, etc.)

### Phase 5 — Add TradingAgents debate (later, doc 603 reference)
- For social-post decisions + project ship-it/wait decisions
- Bull/Bear personas internal to ZOE before recommending

## Sources

- [Letta repo](https://github.com/letta-ai/letta) — verified 2026-05-04, 22422 stars, Apache-2.0, Python, last commit 2026-05-04T06:35
- [Mem0 repo](https://github.com/mem0ai/mem0) — verified 2026-05-04, 54719 stars, Apache-2.0
- [Graphiti repo](https://github.com/getzep/graphiti) — verified 2026-05-04, 25662 stars, Apache-2.0
- [Cognee repo](https://github.com/topoteretes/cognee) — verified 2026-05-04, 17011 stars, Apache-2.0
- Letta README — fetched via gh api 2026-05-04, contains memory_blocks example + CLI tool reference
- [TradingAgents](https://github.com/TauricResearch/TradingAgents) — see doc 603 for full analysis
- [A-Mem paper](https://arxiv.org/pdf/2502.12110) — agentic memory survey (referenced in doc 570)
- [Anthropic MCP servers repo](https://github.com/modelcontextprotocol/servers) — Memory MCP server pattern
- Internal: docs 461, 529, 547, 568, 570, 581, 590, 599, 600, 601, 603 — prior art on agent stack
- Lived experience 2026-04-29 → 2026-05-04 — primary source for failure-mode catalog ("·" pings, Memory Search fail, openclaw bridge debug)

## Next Actions

| Action | Owner | Type | When |
|--------|-------|------|------|
| Confirm 7 open questions for Zaal in this doc | @Zaal | Decision | Today |
| Resume Phase 1 implementation: write memory.ts + tasks.ts + scheduler.ts + recall.ts + brief.ts + reflect.ts + index.ts | Claude | Code | Next session |
| Update doc 601 Phase 1 with Letta-blocks pattern | Claude | Doc | After this doc reviewed |
| Phase 2 token cutover | Claude via SSH | Infra | After Phase 1 complete |
| Phase 3 retire zoe-learning-pings + morning-brief.sh + evening-reflect.sh | Claude | Migration | After Phase 2 |
| Email Joshua.eth re Bonfire SDK key + MCP roadmap | Zaal | Comms | This week |
| Read this doc + push back on architecture decisions | Zaal | Review | Today |
