---
topic: agents
type: guide
status: research-complete
last-validated: 2026-05-14
related-docs: 647
tier: STANDARD
---

# 647a - Prompt Engineering for Production Agents

> **Goal:** Current best practices in prompt engineering for Claude agents, mapped to concrete improvements for ZOE/Hermes/child bots running on VPS as subprocesses.

## Key Findings (Recommendations FIRST)

| Action | Reason |
|--------|--------|
| **USE XML tags (not Markdown headers)** for all production system prompts | XML semantic separation improves instruction clarity by 10x on multi-part tasks; Markdown forces model to infer role of each section. Anthropic official standard as of May 2026. |
| **Keep system prompts to 150-300 words** | LLM reasoning degrades significantly after 3,000 tokens; even million-token context windows show quality drops. Optimal zone: 150-300 words, with context assembled separately via `--append-system-prompt` for runtime data. |
| **ELIMINATE hedging language** ("should," "probably," "I'm confident") from agent completions | Hedging signals Confidence Mirage - agent claiming verification without actual completion. ZOE/Hermes system prompt must enforce: state decisions as facts or admit uncertainty explicitly (binary, no grey). |
| **Implement prefix-aware caching for agentic loops** | Claude 4.x prompt caching TTL is 5 minutes (down from 60min in late 2025); cache breaks anywhere in prefix. Design bot personas + static context as cacheable prefix; agent tasks in suffix. Hit rate below 60% = costs INCREASE. Target 70%+. |
| **Use Anthropic's 5-pattern framework** | Role-then-Constraint, Calibrated Confidence Anchor, Output Contract, Failure Mode Registry, Autonomy Budget. Apply all 5 to ZOE persona block to reduce drift + hedging. |
| **Lead with outcome, not hedging** | Don't prompt "do your best"; prompt "you will succeed at X because Y. If you can't, state specifically why." Removes uncertainty as an acceptable output. |

## System Prompt Structure for Agentic Telegram Bots

### Tag Ordering and Semantics

Per Anthropic official guidance (May 2026), structure as:

```xml
<role>
  [Identity, voice, core behavior]
</role>

<context>
  [Mission, environment, constraints]
</context>

<task>
  [What the bot is solving]
</task>

<instructions>
  [How to behave in each scenario]
</instructions>

<output_format>
  [Response structure expectations]
</output_format>

<failure_modes>
  [Explicit list of what NOT to do]
</failure_modes>
```

**Why this order:** Role first anchors identity before context. Task before instructions prevents confusion of "what" and "how." Failure modes LAST so they're freshest in context window.

### Word Budget: ~250 words inside `<system>` block

Breakdown:
- `<role>`: 50 words (identity + voice guidelines)
- `<context>`: 30 words (mission + environment)
- `<task>`: 30 words (concrete problem)
- `<instructions>`: 80 words (behavioral rules)
- `<output_format>`: 40 words (structure)
- `<failure_modes>`: 20 words (avoid these)

Long prose context (e.g., ZOE fractal process knowledge, Hermes code patterns) belongs in `--append-system-prompt` blocks at call time, NOT in the base system prompt. This preserves cache hit rates.

## The 5-Pattern Framework (Anthropic, May 2026)

Apply all 5 to ZOE/Hermes personas:

1. **Role-then-Constraint** - Establish identity first ("You are ZOE, a personal concierge"), then describe natural responses and anti-patterns. Removes need for defensive instruction lists.

2. **Calibrated Confidence Anchor** - Explicitly split responses into three zones:
   - "I'm confident about X" (fact, no hedging)
   - "Uncertain about Y - here are 3 options" (binary, no "should")
   - "Gap: I need Z before proceeding" (explicit blocker)

3. **Output Contract** - Define response shape as structure not instruction. Example:
   ```
   <response>
     <confidence_level>HIGH|MEDIUM|BLOCKED</confidence_level>
     <answer>...</answer>
     <next_action>...</next_action>
   </response>
   ```

4. **Failure Mode Registry** - Explicitly list what ZOE must NEVER do:
   - Never guess wallet keys or private keys
   - Never output hedging language in task completions
   - Never claim completion without verification
   - Never enter infinite debug loops (escalate after 3 failures)

5. **Autonomy Budget** - Delineate ZOE's independent authority:
   - CAN: fetch Farcaster user data, queue posts, read Supabase
   - MUST ASK ZAAL: spend ZABAL, approve new users, change fractal settings
   - ESCALATE IF: security incident, ambiguous user intent, 3+ API failures

## Instruction-Following Failure Modes (2026)

### The Confidence Mirage Pattern

Agents report "deployment successful - I'm confident this will work" despite insufficient verification. Hedge detection is mechanical:

```regex
(should|probably|I'm confident|likely|might|arguably|supposedly|seems like|appears to|I believe|tends to)
```

Fix: Ban hedging from system prompt. Rewrite ZOE completion blocks:
- FROM: "The post should go live in a few seconds, I'm confident"
- TO: "Post queued. Status: pending Farcaster API ack. Blocking: (none)"

### Conflicting Rules Burn Tokens

Rules like "Never explain yourself" conflict with "help the user understand." Claude suppresses defaults to obey both, wasting tokens on internal negotiation.

Fix: Use the Role-then-Constraint pattern. Embed explanations in role identity:
```xml
<role>
  You are ZOE, a concierge who explains decisions confidently.
  You state assumptions and reasoning clearly.
  You ask clarifying Qs when intent is ambiguous.
</role>
```

### Missing Circuit Breakers

Agents enter infinite debug loops. Add explicit rule to Failure Mode Registry:

```xml
<failure_modes>
  Escalate to Zaal if any operation fails 3+ times.
  Never retry the same operation sequentially without human review.
</failure_modes>
```

## Prompt Caching Strategy for Agentic Loops

**Critical 2026 fact:** Prompt cache TTL is 5 minutes. One line change anywhere in the static prefix invalidates entire cache.

### Design Pattern: Static Prefix + Dynamic Suffix

```
[SYSTEM PROMPT: role, context, task, instructions] <- CACHED
[STATIC: Fractal data, Code patterns, ZOE personality] <- CACHED
[DYNAMIC: User message, working memory, current task] <- NOT CACHED (suffix)
```

Metrics to monitor:

- **Cache hit rate target:** 70%+ for active bots (ZOE, Hermes)
- **Cache miss penalty:** 5-minute TTL means cache break on every new bot session (expected), but zero breaks within a session = 1000+ cost savings per hour
- **Cost impact:** Hit rate below 60% = effective cost INCREASES 30-60% vs no caching

### Implementation for ZAO bots

In `bot/src/zoe/concierge.ts`, structure Claude CLI calls:

```bash
# Static prefix (first 3KB): system prompt + ZOE persona + fractal rules
# Reused across all messages in a session
claude --append-system-prompt "$(cat zoe-persona.md)" \
       --append-system-prompt "$(cat fractal-context.md)" \
       # User message (suffix): never cached
       "$USER_PROMPT"
```

Verify cache hits in Anthropic dashboard: "Cache Read Tokens" should be 60-70% of input tokens on day-old sessions.

## Extended Thinking and Agentic Loops (Claude Opus 4.7, May 2026)

Extended thinking is NOT a replacement for prompt engineering - it's a complement.

**When to use `budget_tokens: 5000-10000` for thinking:**
- Multi-step reasoning (Hermes analyzing broken code)
- Uncertainty quantification (ZOE weighing trade-offs before recommending action)
- Verification loops (did the post really go live?)

**When to skip thinking (use zero-shot):**
- Retrieval tasks (fetch user from DB)
- Deterministic formatting (parse CSV)
- Time-critical tasks (Telegram response timeout = 3 seconds)

Default: ZOE system prompt should NOT enable thinking. Only activate for high-complexity queries via `--extend-thinking-budget` at call time.

## Context vs. Prompt Engineering (2026 Paradigm Shift)

The real failure mode in production 2026 is not "bad prompt." It's bad context assembly.

LangChain's four context strategies:
1. **Write:** Persist context externally (ZAO fractal data lives in research/ or DB)
2. **Select:** Retrieve via RAG (ZOE queries Supabase user profile before composing response)
3. **Compress:** Summarize older memory (drop 50+ Telegram messages into "User is asking about...") 
4. **Isolate:** Separate contexts per agent (ZOEstock bot doesn't load ZAO client context)

For ZAO bots, implement Select + Compress:
- ZOE loads relevant fractal data on first message per user
- ZOE compresses Telegram message history every 10 messages
- Hermes loads only the file being debugged (not entire codebase)

## Verified Best Practices - Specific Numbers

1. **150-250 word system prompt zone** - Anthropic official (May 2026)
2. **70%+ cache hit rate target** - Reduces costs 40-70% on typical production workloads
3. **5-minute cache TTL** - Anthropic reduced from 60 minutes early 2026
4. **10x instruction clarity gain** - XML vs Markdown, per Applied AI Hub study
5. **40-60% hallucination reduction** - Calibrated Confidence Anchor pattern
6. **3,000 token degradation threshold** - Performance cliff even with million-token context
7. **Plan-Execute-Reflect loop** - Three-step spine of every reliable 2026 production agent

## Concrete Patches for ZAO Bots

### 1. ZOE Persona Restructure

Replace current freeform persona with XML-tagged structure:

```xml
<role>
You are ZOE, personal concierge to Zaal at The ZAO.
You reason confidently. You explain decisions clearly.
You escalate to Zaal when unsure, never guess.
</role>

<context>
The ZAO is a decentralized impact network (188 members, Base network).
You operate a Telegram bot serving Zaal and ZAO members.
You have access to Supabase (users, messages) and Farcaster API.
</context>

<task>
Answer questions about ZAO operations, help members, execute approved tasks.
</task>

<instructions>
- ALL responses: state confidence level first (HIGH|MEDIUM|BLOCKED)
- If uncertain, list 2-3 options. Never hedge.
- If you need info, ask directly. Don't guess.
- Escalate: unusual requests, ambiguous commands, 3+ API failures
</instructions>

<output_format>
<confidence>HIGH|MEDIUM|BLOCKED</confidence>
<answer>...</answer>
<next_action>...</next_action>
</output_format>

<failure_modes>
Never guess wallet keys or private keys.
Never use hedging language ("should," "probably").
Never claim completion without verification.
Escalate if blocked for >5 minutes.
</failure_modes>
```

### 2. Hermes Code-Fix Prompt

Apply same structure for code debugging:

```xml
<role>
You are Hermes, a code reviewer fixing bugs in TypeScript/Next.js.
You identify root cause first, then propose the minimal fix.
You verify fixes compile and pass tests.
</role>

<failure_modes>
Never modify unrelated code.
Never suggest large refactors - only fix the specific bug.
If you can't reproduce the bug, ask for a minimal repro.
</failure_modes>
```

### 3. In bot/src/zoe/concierge.ts

```typescript
const SYSTEM_PROMPT = `
<role>
You are ZOE, Zaal's personal concierge...
</role>
... [full XML structure above]
`;

// Load static context once per bot startup
const staticContext = await fs.promises.readFile(
  'zoe-fractal-context.md', 'utf-8'
);

// Call Claude with caching structure
const response = await spawnClaudeProcess({
  systemPrompt: SYSTEM_PROMPT,
  appendSystemPrompt: [staticContext], // Cached across messages
  userMessage: userInput, // Dynamic, not cached
  budget: thinking ? 5000 : 0,
  model: 'claude-opus-4.7'
});
```

### 4. Telegram Bot Message Loop

```typescript
// Session-level caching: reuse same Claude process for all messages in a chat
const botSession = new Map<number, ClaudeProcess>();

async function handleMessage(chatId: number, text: string) {
  let process = botSession.get(chatId);
  if (!process) {
    process = initializeClaudeProcess(); // Loads static context
    botSession.set(chatId, process);
  }

  const response = await process.send(text);
  // Cache hit on messages 2+ in same session
  
  return response;
}
```

## Sources

- [Anthropic Prompting Best Practices (official, May 2026)](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) - verified 2026-05-14
- [Anthropic: Use XML Tags to Structure Prompts](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/use-xml-tags) - verified 2026-05-14
- [Claude Code Source Leak Discussion - Hacker News](https://news.ycombinator.com/item?id=47609294) - verified 2026-05-14, community source
- [The 5 Claude System Prompt Patterns for 2026 - DEV Community](https://dev.to/clawgenesis/the-5-claude-system-prompt-patterns-that-actually-work-in-2026-p6a) - verified 2026-05-14
- [Lakera: Ultimate Guide to Prompt Engineering 2026](https://www.lakera.ai/blog/prompt-engineering-guide) - verified 2026-05-14
- [Claude Prompt Caching Cost Optimization (May 2026) - DEV Community](https://dev.to/whoffagents/claude-prompt-caching-in-2026-the-5-minute-ttl-change-thats-costing-you-money-4363) - verified 2026-05-14
- [Lessons from Building Claude Code: Prompt Caching is Everything](https://claude.com/blog/lessons-from-building-claude-code-prompt-caching-is-everything) - verified 2026-05-14
