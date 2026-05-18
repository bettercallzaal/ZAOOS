---
topic: agents
type: decision
status: research-complete
last-validated: 2026-05-04
related-docs: 238, 529, 541, 601
tier: STANDARD
---

# 605c - Eval and observability tools for ZOE + Hermes

> **Goal:** Pick ONE observability tool to wire into ZOE + Hermes so we catch silent failures, token spikes, and hallucinations before they hit Telegram users.

## Current State

ZOE shipped 2026-05-04. Hermes is production-ready but both lack observability infrastructure:

- **ZOE** (`bot/src/zoe/concierge.ts`): Spawns Claude CLI subprocess via Max plan. Only safeguard is >5-char reply check. No token tracking, no trace logs, no hallucination detection.
- **Hermes** (`bot/src/hermes/claude-cli.ts`): Wraps CLI spawn for coder loop. Logs duration but no call-level observability.
- **Silent failure incidents**: openclaw "·" pings (empty tool calls posted as dots), Bonfire node-deletion hallucination (Doc 581), state-truthfulness anti-patterns.

## Key Decision

**Use Langfuse self-hosted as the primary observability layer.** Wire it into bot/src/zoe/concierge.ts and bot/src/hermes/claude-cli.ts via Langfuse SDK calls after each Claude invocation. Run Langfuse on VPS 1 in Docker. Use Promptfoo as offline eval framework for PR regressions.

## Comparison Table

| Tool | OSS / Pricing | Self-host? | TS SDK? | Primary focus | Claude fit | Verdict |
|------|---------------|------------|---------|---------------|-----------|---------|
| **Promptfoo** | MIT, free | Yes | Yes (100% TS) | Eval-first (red team + regression) | Direct CLI wrap | Secondary: CI evals only |
| **Langfuse** | MIT + cloud option | Yes (Docker) | Yes, native | Observability + eval | SDK + LiteLLM proxy | PRIMARY: production traces |
| **LangSmith** | Paid cloud | No | Yes | Tracing (LangChain-first) | Indirect (LangChain layer) | Skip: locked to LC, paid only |
| **Helicone** | OSS + cloud | Yes (Docker) | Yes | Proxy-based tracing | Proxy via OpenAI format | Skip: Claude needs custom routing |
| **OpenLLMetry** | MIT (OTel spec) | Yes | Yes (OTEL SDK) | Observability via OTel | SDK + manual spans | Tertiary: if OTEL standardization needed |
| **Braintrust** | Paid | No | Yes | Eval + obs | Eval-first but expensive | Skip: paid and less OSS |

## Why Langfuse

**Production-ready self-host.** Langfuse OSS (MIT license) runs fully on your infrastructure. Docker Compose setup takes <30 minutes. Includes Postgres + ClickHouse + Redis + S3 (or Minio). All core features unlimited: traces, sessions, token/cost tracking, evals, datasets, prompt management.

**TypeScript SDK out of the box.** Install `langfuse`, wrap any LLM call, automatic capture of tokens + latency + error details. Works with Claude directly - no LangChain dependency.

**Cost tracking at scale.** Langfuse Self-Hosted (OSS) includes token counting + cost attribution per model. ZOE runs ~50-200 invocations/day at 15K-30K tokens/invocation. Tracks cost per user, per session, per agent.

**Eval + observability unified.** Langfuse datasets let you version test cases. Experiments feature runs evals against trace data. Can define custom scorers (claude-as-judge, regex, LLM-eval). Integrate with Promptfoo for offline regression checks in CI.

**280+ contributors, 23k GitHub stars.** Large ecosystem. Used by enterprise teams. Recent activity: 406 releases, latest 0.121.9 (2026-04-27). OpenAI + Anthropic teams contribute.

## How to Wire Into ZOE

### Entry Point: bot/src/zoe/concierge.ts

Current pattern: spawns Claude CLI, logs cost + tokens to console.

New pattern:

```typescript
// bot/src/zoe/concierge.ts - pseudocode
import { Langfuse } from 'langfuse'

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_HOST || 'http://localhost:3000',
})

async function conciergeRun(userMessage: string, fid: number) {
  const trace = langfuse.trace({
    name: 'zoe-concierge',
    userId: String(fid),
    metadata: { intent: detectIntent(userMessage) },
  })

  try {
    const result = await spawnClaudeSubprocess(userMessage)
    
    trace.observation({
      name: 'claude-cli-output',
      output: { tokens: result.tokens, cost: result.cost },
      statusMessage: 'success',
    })

    return result
  } catch (error) {
    trace.observation({
      name: 'claude-cli-error',
      output: null,
      statusMessage: String(error),
      level: 'error',
    })
    throw error
  } finally {
    await langfuse.flush()
  }
}
```

### Hermes Integration: bot/src/hermes/claude-cli.ts

Wrap the coder loop:

```typescript
// bot/src/hermes/claude-cli.ts - pseudocode
const trace = langfuse.trace({
  name: 'hermes-coder-loop',
  sessionId: prId,
  metadata: { phase: 'coder' },
})

for (let iteration = 0; iteration < maxIterations; iteration++) {
  const generation = trace.observation({
    name: `coder-turn-${iteration}`,
    input: { prompt: coderPrompt },
  })

  const response = await spawnClaudeSubprocess(coderPrompt)
  generation.end({ output: response })
}
```

## What Silent Failure Looks Like in Our World

1. **openclaw "·" pings (doc 601):** Tool call returned empty string, posted as dot. No observability to catch it in real-time.
2. **Bonfire node-deletion hallucination (doc 581):** Agent deleted unrelated graph node. No trace of the decision path. Only caught by user report.
3. **Empty-reply guard (>5 chars):** Silently drops short outputs. Token spike somewhere? Can't see it.
4. **State-truthfulness anti-pattern:** Hermes critic accepts coder's claim as fact without verification. No validation layer.

With Langfuse in place:

- Every Claude call is logged with input + output + tokens + latency.
- Traces show decision trees (which tool was called, which returned what).
- Datasets let you regression-test against known bad patterns.
- Alerts (custom webhook) fire if token spike > 150% baseline or output < 5 chars.

## Cost Estimate (VPS 1)

### Langfuse Self-Hosted Docker (1 month)

- Postgres: ~100MB data per month (trace volume + metadata). Disk cost negligible.
- ClickHouse: ~500MB per month (analytics). Negligible on VPS.
- Redis: ~50MB (session cache). Negligible.
- Minio: ~1GB per month (request/response bodies). Negligible.
- **Total:** All fits in a single Docker Compose on VPS 1. No additional hardware. Zero marginal cost.

### Promptfoo (CI only)

- Free. CLI-based. Runs in GitHub Actions as part of PR test suite.
- Example: 50 test cases x 5 model variants x 2 eval metrics = 500 invocations. At $0.002/Claude Sonnet completion = $1 per full eval run. Optional, no production cost.

## Implementation Path (Difficulty 5/10)

| Step | Effort | Files | When |
|------|--------|-------|------|
| Install Langfuse on VPS 1 (Docker Compose) | 1h | /scripts/vps-langfuse-deploy.sh | This week |
| Wire ZOE concierge SDK calls | 2h | bot/src/zoe/concierge.ts | This week |
| Wire Hermes coder-loop traces | 1h | bot/src/hermes/claude-cli.ts | This week |
| Set up Promptfoo eval framework in CI | 2h | .github/workflows/eval.yml + promptfoo.config.yml | Next sprint |
| Document alerting rules (token spike, latency outlier) | 1h | research/agents/605d-alerting-rules/ | Next sprint |

## What to Skip

- **LangSmith** - Paid only, LangChain-coupled, overkill for CLI-based agents. Langfuse has feature parity for 1/10th the cost.
- **Helicone proxy** - Requires routing Claude API calls through their gateway. Our agents spawn CLI subprocesses, not API calls. Architectural mismatch.
- **Arize Phoenix** - Strong OSS observability, but smaller community than Langfuse. Langfuse's prompt-versioning + dataset features fit ZOE/Hermes workflow better.
- **Braintrust** - Paid + eval-first. We need observability-first (traces) + secondary eval. Langfuse is the inverse, which fits our risk profile.

## Next Actions

| Action | Owner | Type | Trigger |
|--------|-------|------|---------|
| Approve Langfuse as primary | @Zaal | Decision | PR #XXX review |
| Deploy Langfuse Docker on VPS 1 | Agent | PR | After Zaal approval |
| Wire ZOE concierge traces | Agent | PR | After deploy |
| Wire Hermes coder traces | Agent | PR | After ZOE wired |
| Add Promptfoo to CI | Agent | PR | Post-launch, lower priority |

## Sources

- Promptfoo GitHub: https://github.com/promptfoo/promptfoo - 20.8k stars, MIT, 406 releases, 0.121.9 latest
- Langfuse Pricing: https://langfuse.com/pricing - Self-hosted OSS free, Cloud starts $0 (Hobby), $8/100k units overage
- Langfuse Self-Hosting: https://langfuse.com/self-hosting/ - Docker Compose, Kubernetes, AWS/Azure/GCP templates
- Langfuse Docs: https://langfuse.com/docs/observability/get-started - Native TS/JS SDK, OpenAI SDK wrapper, LangChain integration
- Helicone Self-Host: https://docs.helicone.ai/getting-started/self-host/docker - All-in-one image, 3 ports (3000, 8585, 9080)
- Reddit r/LangChain observability comparison: https://www.reddit.com/r/LangChain/comments/1rxmhdj/ - Community consensus: Langfuse for self-host, Datadog for unified stack observability
