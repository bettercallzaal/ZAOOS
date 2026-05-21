---
topic: agents
type: decision
status: research-complete
last-validated: 2026-05-21
original-query: How do we fix ZAOcoworkingBot's LLM hallucinating fake system dialogs? What's the 3-phase fix? (reconstructed)
related-docs: 461, 527, 600, 661, 662, 668
tier: DEEP
---

# 671 - LLM Fictional-Permission Hallucination Fixes (ZAOcoworkingBot)

> **Goal:** Stop @ZAOcoworkingBot from telling Iman to "approve in the system dialog" when no such dialog exists. Three independent research dispatches converge on a 3-phase fix. Phase 1 ships today (~30 min). Phase 3 is the long-term architecture.

## Key Decisions

| # | Decision | Phase | Effort | Expected effect | Status |
|---|----------|-------|--------|-----------------|--------|
| 1 | **Reframe persona prompt: negative -> positive + few-shot examples** | 1 | 1/10 | ~70-85% reduction (alone) | Ship today |
| 2 | **Strip free-text when json-suggest block present** (post-process) | 1 | 2/10 | Catches 100% of suggestion-containing replies | Ship today |
| 3 | **Switch `claude-max.ts` from `--permission-mode auto` to `dontAsk` + `--disallowedTools "Bash,Read,Write,Edit"`** | 1 | 1/10 | Removes the permission-prompt narration surface entirely | Ship today |
| 4 | **Regex output validator + single retry-with-repair** on free-text replies (no suggestion block) | 2 | 3/10 | Catches ~10% remaining leaks; 1 extra LLM call when triggered | This week |
| 5 | **Migrate to direct Anthropic API with `tool_choice: {type: "any"}`** + drop Claude Code CLI subprocess | 3 | 6/10 | Eliminates the entire hallucination surface (no tools to hallucinate about) | Next sprint |

## Root Cause (Verified Across 3 Research Dispatches)

The bot uses `claude --append-system-prompt` to inject persona/memory blocks into a Claude Code CLI subprocess. The LLM in that subprocess sees:

- Claude Code's DEFAULT system prompt (claims tools: Read, Edit, Write, Bash, etc., with interactive permission prompts).
- The bot's APPENDED persona (says "you can NOT use those tools").

Three failure modes confirmed:

1. **Negative instructions fail** ("never say X"). Research: positive framing + concrete examples outperforms by 15-30% (Anthropic prompt-eng docs + "Pink Elephant" study, eval.16x.engineer Dec 2024).
2. **`--append-system-prompt` is a known bug.** GitHub issues `anthropics/claude-code#4523` (Jul 2025) and `#21028` (Jan 2026): the appended text gets injected as a USER message, not a system message, so its precedence decays over long conversations. The LLM falls back to Claude Code's default tool semantics.
3. **`--permission-mode auto`** allows the subprocess to surface permission prompts that time out (no human approver), and the LLM then narrates about the timeout: "I'm waiting for you to approve the system dialog." Audit doc 668b already flagged this; not yet shipped.

Doc 668b ALREADY audited this with P1/P2/P3 findings and recommended fixes - status: NOT YET APPLIED. The v2.11 + v2.12 patches added FORBIDDEN HALLUCINATIONS lists but used negative framing (the very anti-pattern Anthropic warns against). v2.12 fixed the deploy-lag bug (persona file wasn't being overwritten on update) but the persona TEXT itself is the next bottleneck.

## Phase 1 - Ship Today (Cheap, High-Leverage)

### Fix 1a - Rewrite persona block: positive + examples

**File:** bot repo `agent/src/memory.ts` (in `songchaindao-dot/cowork-zaodevz`, NOT in ZAOOS).

**BEFORE (current, ineffective):**

```
FORBIDDEN HALLUCINATIONS - never say any of these things:
- "I need write/read permission" (...)
- "approve in the system dialog" (...)
- "approve in your Claude Code interface" (...)
- "the file doesn't exist yet" (...)
- "I'll update it once you grant access" (...)
```

**AFTER (positive + few-shot):**

```
WHEN A USER REQUESTS A FIELD EDIT (due date, notes, priority, status, assignment):
Your FIRST and ONLY response is the json-suggest block. No preamble. No narration. Examples:

USER: "Set #24 due date to May 28"
YOU: ```json-suggest
{"op":"setdue","id":"24","value":"2026-05-28"}
```

USER: "Mark #17 done"
YOU: ```json-suggest
{"op":"done","id":"17"}
```

USER: "Assign #9 to Iman"
YOU: ```json-suggest
{"op":"assign","id":"9","value":"iman"}
```

The bot has direct GitHub write access via Octokit. The user is in Telegram. There are no system dialogs, permission prompts, file-access flows, or Claude Code interfaces. If you ever feel the urge to mention one, emit the json-suggest block instead.
```

The 3-example demonstration is more effective than any number of "don't say" rules (ArXiv 2406.20015 ToolBH benchmark + Anthropic docs).

### Fix 1b - Strip free-text when json-suggest is present

**File:** bot repo `agent/src/extraction.ts` or `agent/src/index.ts` (wherever the LLM reply is sent back to Telegram).

```typescript
// After LLM reply, before sendMessage:
const suggestionMatch = llmReply.match(/```json-suggest\n([\s\S]*?)\n```/);
if (suggestionMatch) {
  try {
    const suggestion = JSON.parse(suggestionMatch[1]);
    // The suggestion is the source of truth. Free-text is throwaway.
    const fieldLabel = humanizeOp(suggestion.op); // "due date", "status", etc.
    const cleanReply = `Updating ${fieldLabel} on #${suggestion.id} -> ${suggestion.value ?? 'done'}...`;
    return { reply: cleanReply, suggestion };
  } catch {
    // Fall through to validator below
  }
}
```

This is the lightest-touch fix because the json-suggest block is already schema-validated downstream. The free-text is purely narrative and is where 100% of the hallucination lives. Free-text only matters for pure-chat replies (no suggestion needed).

### Fix 1c - Tighten claude-max subprocess flags

**File:** bot repo `agent/src/llm/claude-max.ts` line 13.

**BEFORE:**

```typescript
'--permission-mode', 'auto',
```

**AFTER:**

```typescript
'--permission-mode', 'dontAsk',
'--disallowedTools', 'Bash,Read,Write,Edit,WebFetch,WebSearch,Glob,Grep,Task',
```

`dontAsk` auto-denies any tool not pre-approved, so the LLM never has a permission-prompt event to narrate about. `--disallowedTools` removes the tools from the LLM's awareness entirely. (Caveat: some sources flag `--allowedTools ""` as buggy / silent-exit; `--disallowedTools` is the safer phrasing.)

Also consider switching `--append-system-prompt` -> `--system-prompt` per GH `#4523` + `#21028`. Risk: replaces Claude Code's defaults, so any CLAUDE.md context is lost. Safe here because the bot's subprocess has no project-context dependency.

## Phase 2 - Defense-in-Depth (This Week)

### Fix 2 - Regex validator + 1 retry with repair directive

For replies WITHOUT a json-suggest block (pure Q&A flow), scan the free-text for forbidden patterns and retry once if matched.

```typescript
const FORBIDDEN_PATTERNS: RegExp[] = [
  /\b(approve|click|wait|let me)[^.]{0,40}(system dialog|interface|permission)\b/i,
  /\bI (need|require|must)[^.]{0,40}(permission|approval|consent|access)\b/i,
  /\b(?:read|open|check)[^.]{0,40}(?:\.env|config|file system)\b/i,
  /\bclaude code (?:interface|dialog|prompt|permission)\b/i,
];

function isClean(text: string): boolean {
  return !FORBIDDEN_PATTERNS.some(re => re.test(text));
}

const reply = await callClaudeMax(userMsg, persona);
if (!isClean(reply)) {
  const repair = await callClaudeMax(
    userMsg,
    persona + `\n\nYour previous draft said something like a forbidden pattern. Re-draft using the json-suggest block. The user is in Telegram. There is no system dialog, no Claude Code interface, no permission flow.`
  );
  return repair;
}
return reply;
```

Production-tested pattern (Ozigi blog, 2026): ~88% first-pass clean, ~10% fixed by single retry, ~2% ship as-is. Latency cost = 1 extra LLM call only on the ~10% that miss. False-positive rate ~0.5% with the patterns above.

Skip Guardrails AI / NeMo Guardrails / Llama Guard - all are Python-heavy, overkill for the 30-line need. The bot is Node.js and the regex approach is honest about its scope.

## Phase 3 - Architecture Fix (Next Sprint)

### Fix 3 - Migrate from Claude Code CLI subprocess to direct Anthropic API

The Claude Code CLI subprocess is the root vulnerability. It ships with a default system prompt that mentions Read/Edit/Write tools the bot does NOT want exposed. Even with `--disallowedTools`, the model may still be primed to narrate about them.

Cleanest pattern - direct Anthropic Messages API with **forced tool use**:

```typescript
import Anthropic from '@anthropic-ai/sdk';
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const tools: Anthropic.Tool[] = [{
  name: 'suggest_action',
  description: 'Emit a structured suggestion for the cowork-zaodevz action tracker.',
  input_schema: {
    type: 'object',
    properties: {
      op: { type: 'string', enum: ['add','wip','blocked','done','assign','setdue','setnote','setprio','reply_only'] },
      id: { type: 'string' },
      value: { type: 'string' },
      reply: { type: 'string', description: 'For op=reply_only, the chat reply text (no permission talk).' }
    },
    required: ['op']
  }
}];

const resp = await client.messages.create({
  model: 'claude-opus-4-7',
  max_tokens: 1024,
  system: PERSONA_BLOCK,
  messages: [{ role: 'user', content: userMessage }],
  tools,
  tool_choice: { type: 'any' }, // forces tool call, no preamble narration
});

// resp.content[0] is guaranteed to be a tool_use block
```

Per Anthropic docs (`platform.claude.com/docs/agents-and-tools/tool-use/define-tools`): with `tool_choice: {type: "any"}` "the API prefills the assistant message... the models will not emit a natural language response or explanation before tool_use content blocks." The hallucination surface is structurally removed.

**Trade-off matrix:**

| Dimension | Claude Code CLI subprocess (today) | Direct Anthropic API (proposed) |
|-----------|------------------------------------|---------------------------------|
| Auth | Max-plan subscription (no per-token billing) | Pay-per-token (Opus 4.7 ~$15/M output) |
| Cost at ~50 msg/day | $0 incremental (in Max plan) | ~$5-8/month |
| Latency | +200-400ms subprocess overhead | Direct HTTP |
| Hallucination surface | High (default tools exposed) | None (only `suggest_action` tool exists) |
| Lock-in | Claude-Code-flag-specific | Standard Anthropic SDK |
| Effort to migrate | - | ~3-4 hours rewrite of `claude-max.ts` + add tool extraction |

**Verdict:** Migrate. The Max-plan savings are illusory once the bot scales past one user, and the architectural cleanliness compounds (Hermes, ZAO Craig, future bots will all want this pattern).

This connects to [[feedback_prefer_claude_max_subscription]] - that memory said "prefer Claude Max for ZAO bots." Caveat-update needed: prefer Max-plan-via-CLI for CODING bots (Hermes, QuadWork, agentic dev work that benefits from Claude Code's tool suite). For CHAT bots with NO Read/Edit/Write needs (ZAOcoworking, future Telegram concierges), direct Anthropic API is structurally safer.

## Why Two Prior Fix Attempts Failed

| Attempt | What was tried | Why it didn't stick |
|---------|----------------|---------------------|
| v2.11 | Added "FORBIDDEN HALLUCINATIONS" list with 5 negative-framed rules | Negative instructions are an LLM anti-pattern. Model token-generates around them. |
| v2.12 | Added version-marker auto-update so the persona file actually gets overwritten on deploy (fixed a `seedIfMissing` deploy-lag bug) | Fixed delivery of the persona, but the persona text itself still uses negative framing. So v2.12 ships v2.11's broken rules faster. |

The fix-for-the-fix is to rewrite the persona TEXT (Fix 1a) - not to try harder to deploy the same broken text.

## Cross-Repo Findings

`grep.app` + `searchGitHub` across bettercallzaal org repos:
- No prior Telegram-bot-with-Claude-CLI implementations in ZAO ecosystem use this exact subprocess pattern - the bot's `claude-max.ts` provider is novel.
- Hermes (`bot/src/hermes/` in ZAOOS) uses Claude Code CLI subprocess but for CODE-WRITING (legit use of Read/Edit/Bash tools), not chat-with-no-tools. Different use case, different risk profile.
- The fix here SHOULD inform the upcoming ZAO Craig bot (doc 670 -> 671 spec): start with Anthropic API direct + `tool_choice: any`, do NOT inherit the claude-max subprocess pattern.

## Sources

### Anthropic primary docs
- [Define tools - tool_choice semantics](https://platform.claude.com/docs/agents-and-tools/tool-use/define-tools) - the `tool_choice: any` guarantee
- [Tool choice cookbook](https://platform.claude.com/cookbook/tool-use-tool-choice) - forced-tool examples
- [Be clear and direct prompting](https://platform.claude.com/docs/build-with-claude/prompt-engineering/be-clear-direct) - "tell Claude what to do, not what not to do"
- [Managed agents in production](https://platform.claude.com/cookbook/managed-agents-cma-operate-in-production)

### Claude Code CLI bugs / flags
- [anthropics/claude-code#4523](https://github.com/anthropics/claude-code/issues/4523) (Jul 2025) - `--append-system-prompt` injected as user message
- [anthropics/claude-code#21028](https://github.com/anthropics/claude-code/issues/21028) (Jan 2026) - append-system-prompt ignored before response
- [anthropics/claude-code#32079](https://github.com/anthropics/claude-code/issues/32079) - `--allowedTools ""` silent-exit gotcha
- [Recombobulate.dev (Mar 2026)](https://recombobulate.dev/claude-code-system-prompt-vs-append-system-prompt) - flag trade-offs

### Negative-instruction research
- [eval.16x.engineer - The Pink Elephant Problem (Dec 2024)](https://eval.16x.engineer/blog/the-pink-elephant-negative-instructions-llms-effectiveness-analysis)
- [AgentPatterns.ai - Instruction Polarity](https://agentpatterns.ai/instructions/instruction-polarity)
- ArXiv 2406.20015 - ToolBH (tool hallucination benchmark)
- ArXiv 2412.04141 - Relign (tool-hallucination mitigation)
- [Answer.AI - The unauthorized tool call problem (Jan 2026)](https://www.answer.ai/posts/unauthorized-tool-calls)

### Output-filter / guardrails
- [Ozigi blog - Banned-lexicon validator pattern (2026)](https://blog.ozigi.app/blog/stopping-ai-slop-in-production-banned-lexicon-validator) - 88/10/2 first-pass/retry/ship rates
- [NVIDIA/NeMo-Guardrails v0.21.0](https://github.com/NVIDIA/nemo-guardrails) - Python-only, overkill here
- [LiteLLM content filter](https://docs.litellm.ai/docs/proxy/guardrails/litellm_content_filter)
- [MerkulovDaniil/claude-tg](https://github.com/MerkulovDaniil/claude-tg) - Telegram + Claude SDK reference

### Architecture patterns
- [Inside Cline - Medium (Jan 2026)](https://medium.com/@floralan212/inside-cline-how-its-agentic-chat-system-really-works-3d582935efa5) - tool-first enforcement via controller
- [DEV Community - Two-pass LLM processing (Apr 2026)](https://dev.to/diven_rastdus_c5af27d68f3/two-pass-llm-processing-when-single-pass-classification-isnt-enough-n64)
- [GitHub Copilot SDK - Agent loop](https://github.com/github/copilot-sdk/blob/main/docs/features/agent-loop.md)

### ZAO internal
- Doc 668b - prior LLM persona safety audit (recommended fixes still pending)
- Doc 661 - bot infrastructure architecture
- Doc 662 - ZAOcoworking v2/v3 architecture

## Next Actions

| # | Action | Owner | Type | By When |
|---|--------|-------|------|---------|
| 1 | Rewrite persona block in `songchaindao-dot/cowork-zaodevz` `agent/src/memory.ts` per Fix 1a (positive + 3 examples) | Zaal | PR to bot repo | Today |
| 2 | Add free-text-stripping in `agent/src/extraction.ts` per Fix 1b | Zaal | PR | Today |
| 3 | Change `agent/src/llm/claude-max.ts:13` to `dontAsk` + `--disallowedTools` per Fix 1c | Zaal | PR | Today |
| 4 | Deploy v2.13 to VPS 187.77.3.104 (`systemctl --user restart zaocoworking-bot.service`) | Zaal | Deploy | After Fixes 1a-c land |
| 5 | DM Iman: "v2.13 shipped, please test by asking for a due-date change. Should reply with the action only, no permission talk." | Zaal | Comms | After deploy |
| 6 | Add regex validator + 1-retry repair loop per Fix 2 | Zaal | PR | This week |
| 7 | Spike: prototype direct Anthropic API + `tool_choice: any` migration per Fix 3 | Zaal | Branch | Next sprint |
| 8 | Update [[feedback_prefer_claude_max_subscription]] memory: split rule for coding-bots (Max-CLI) vs chat-bots (Anthropic API direct) | Zaal | Memory edit | After Fix 3 spike confirms |
| 9 | Pre-bake the Fix 3 pattern into the upcoming ZAO Craig spec (doc -> next) | Zaal | Doc | Before Craig build starts |
| 10 | Close 668b findings - mark P1/P3 fixes as APPLIED in `research/agents/668-zaocoworking-bot-audit/668b-llm-persona-safety/README.md` once v2.13 lands | Zaal | Doc update | After Fix 4 |

## Also See

- [Doc 668b](../668-zaocoworking-bot-audit/668b-llm-persona-safety/) - prior LLM persona safety audit (this doc executes its pending recommendations)
- [Doc 668](../668-zaocoworking-bot-audit/) - full 6-dim bot audit
- [Doc 670](../../events/670-iman-call-may18-craig-pizzadao/) - Iman call recap that surfaced this hallucination during live use
- [Doc 661](../661-zaocoworkingbot-go-live/) - bot infrastructure
- [Doc 662](../../dev-workflows/662-zaocoworking-v2-v3-architecture/) - v2/v3 architecture
- [Doc 527](../527-multi-bot-telegram-coordination-best-practices/) - multi-bot patterns
- [project_zaocoworkingbot](../../../../../.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/project_zaocoworkingbot.md) - bot deployment context
- [feedback_prefer_claude_max_subscription](../../../../../.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/feedback_prefer_claude_max_subscription.md) - prior pref to update post-Fix 3
