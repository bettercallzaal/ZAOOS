# Research 71: Paperclip AI Rate Limiting & Multi-Agent API Key Management

**Date:** 2026-03-18
**Status:** Research complete
**Problem:** Running 5 Paperclip agents (CEO, Founding Engineer, Security Auditor, Research Agent, +1) on ONE Anthropic API key causes persistent rate limit hits.

---

## 1. Exact Anthropic Rate Limits per Tier

Rate limits are enforced at the **organization level**, not per API key. All keys in the same org share the same pool. Limits use the **token bucket algorithm** (continuous refill, not fixed resets).

### Spend Limits

| Tier | Credit Purchase (cumulative) | Monthly Spend Limit |
|------|------------------------------|---------------------|
| Tier 1 | $5 | $100/mo |
| Tier 2 | $40 | $500/mo |
| Tier 3 | $200 | $1,000/mo |
| Tier 4 | $400 | $200,000/mo |
| Monthly Invoicing | N/A | No limit |

### Rate Limits — Claude Opus 4.x (shared across Opus 4, 4.1, 4.5, 4.6)

| Tier | RPM | Input TPM | Output TPM |
|------|-----|-----------|------------|
| **Tier 1** | 50 | 30,000 | 8,000 |
| **Tier 2** | 1,000 | 450,000 | 90,000 |
| **Tier 3** | 2,000 | 800,000 | 160,000 |
| **Tier 4** | 4,000 | 2,000,000 | 400,000 |

### Rate Limits — Claude Sonnet 4.x (shared across Sonnet 4, 4.5, 4.6)

| Tier | RPM | Input TPM | Output TPM |
|------|-----|-----------|------------|
| **Tier 1** | 50 | 30,000 | 8,000 |
| **Tier 2** | 1,000 | 450,000 | 90,000 |
| **Tier 3** | 2,000 | 800,000 | 160,000 |
| **Tier 4** | 4,000 | 2,000,000 | 400,000 |

### Rate Limits — Claude Haiku 4.5

| Tier | RPM | Input TPM | Output TPM |
|------|-----|-----------|------------|
| **Tier 1** | 50 | 50,000 | 10,000 |
| **Tier 2** | 1,000 | 450,000 | 90,000 |
| **Tier 3** | 2,000 | 1,000,000 | 200,000 |
| **Tier 4** | 4,000 | 4,000,000 | 800,000 |

**Critical note:** Cached input tokens do NOT count toward ITPM for current models. With 80% cache hit rate you can effectively process 5x your ITPM limit.

**Source:** https://platform.claude.com/docs/en/api/rate-limits

---

## 2. What Tier Is the User Likely On?

**If using Claude Code with a Pro/Max subscription:** Claude Code subscription usage is entirely separate from API tier limits. The subscription uses a rolling 5-hour window (~45 prompts for Pro, more for Max) shared across Claude.ai chat + Claude Code. This is NOT the API tier system.

**If using an `ANTHROPIC_API_KEY`:** The tier depends on cumulative credit purchases:
- $5 spent = Tier 1 (50 RPM, 30K ITPM for Opus — **this is almost certainly where you are**)
- $40 spent = Tier 2 (1,000 RPM, 450K ITPM)
- $200 spent = Tier 3
- $400 spent = Tier 4

**The problem:** At Tier 1, 5 agents sharing 50 RPM means ~10 requests/min per agent. With 30,000 ITPM for Opus, each agent gets ~6,000 input tokens/min. This is extremely tight — a single heartbeat with context can consume thousands of tokens.

**Recommendation:** Deposit $40 to reach Tier 2 immediately. The jump from 50 RPM / 30K ITPM to 1,000 RPM / 450K ITPM is massive (20x RPM, 15x ITPM).

---

## 3. How Paperclip Handles Rate Limits Internally

### Heartbeat Model
Agents don't run continuously. They wake in **heartbeat cycles** — short execution windows on a schedule (e.g., every hour). Each heartbeat follows a 9-step process:

1. Confirm identity (`GET /api/agents/me`)
2. Handle pending approvals
3. Fetch assigned tasks
4. Pick highest-priority work
5. Checkout the task (locks it — 409 = someone else owns it, never retry)
6. Read issue context + comment thread
7. Execute work (this is the expensive LLM call)
8. Update status with comments
9. Delegate subtasks if needed

### Budget Controls (built-in)
- Per-agent monthly budget in cents
- Company-level monthly spend limit
- **80% warning** — agent focuses only on critical tasks
- **100% budget hit** — agent auto-pauses, new tasks blocked
- Paperclip auto-throttles agents approaching limits

### What Paperclip Does NOT Do Well
- **No built-in retry with exponential backoff for 429s** — this is a known gap
- **No jitter on heartbeat scheduling** — all agents can fire simultaneously
- **No queue system** — agents independently hit the API; there's no central request queue
- **409 conflict on checkout** is handled (skip task), but API-level 429 rate limits are not gracefully handled in the same way

### v2026.318.0 Improvements (March 18, 2026)
- Heartbeat cycles now skip redundant token usage
- Upgraded cost/budgeting surfaces
- Pending-approval agents excluded from heartbeat timers
- Agents skip self-wake on own comments
- Skip wakeup for backlog-status changes

---

## 4. The Thundering Herd Problem

### What It Is
When multiple agents have heartbeats on the same schedule (e.g., "every 60 minutes"), they all wake up at the same instant and fire API requests simultaneously. With 5 agents each making multiple API calls during their heartbeat cycle, you can easily spike 20-30 requests in seconds — blowing past Tier 1's 50 RPM limit (which may be enforced as 1 request/second for burst protection).

### Specific Issue Context
- **GitHub PR #1388** in the Claude Code ecosystem addressed a thundering herd on usage API calls — multiple sessions simultaneously calling the API when a shared cache expires
- **OpenClaw Issue #5159** documented that exponential backoff for 429 errors was broken — the system retried within seconds, hammering the API
- Paperclip's own release notes show ongoing work to reduce unnecessary heartbeat wakes but no explicit thundering herd fix for API rate limits

### How to Fix It

**1. Stagger heartbeat schedules:**
Instead of all agents running at `:00` past the hour, offset them:
- CEO: `:00`
- Founding Engineer: `:12`
- Security Auditor: `:24`
- Research Agent: `:36`
- Agent 5: `:48`

**2. Add jitter to heartbeat timing:**
Each heartbeat should add a random delay of 0-30 seconds before firing. This prevents synchronized bursts even when schedules nominally overlap.

**3. Implement exponential backoff with jitter on 429s:**
```
wait_time = min(base_delay * 2^attempt + random(0, jitter), max_delay)
```
The API returns a `retry-after` header — always respect it.

**4. Use the Batch API for non-urgent work:**
Paperclip tasks that aren't time-sensitive (research, audits, reports) can use the Message Batches API at 50% cost with separate rate limits.

---

## 5. Can You Use Separate API Keys per Agent?

### Short Answer: Yes, but with caveats.

**Same Organization:** Multiple API keys within the same Anthropic organization share the SAME rate limits. Creating 5 keys in one org does NOT give you 5x the limits. Rate limits are org-level.

**Separate Organizations:** You could create separate Anthropic organizations, each with its own API key and rate limits. Each org would need its own credit deposit and would have independent tier progression. This gives true rate limit isolation but:
- More complex billing management
- Each org starts at Tier 1 independently
- 5 x $40 = $200 to get all to Tier 2

**Workspaces (Best Option):**
Anthropic Workspaces let you create up to 100 isolated environments within one organization. Each workspace:
- Has its own API keys (scoped to that workspace only)
- Can have custom per-workspace rate limits
- Shares the org-level ceiling but you can cap individual workspaces
- Example: Org has 1,000 RPM (Tier 2). Set CEO workspace to 300 RPM, Engineer to 400 RPM, others to 100 RPM each. This prevents any single agent from starving the others.

**Recommended Architecture:**
```
Anthropic Org (Tier 2+)
├── Workspace: CEO Agent          → API Key A, 300 RPM cap
├── Workspace: Engineer Agent     → API Key B, 400 RPM cap
├── Workspace: Security Auditor   → API Key C, 100 RPM cap
├── Workspace: Research Agent     → API Key D, 100 RPM cap
└── Workspace: Agent 5            → API Key E, 100 RPM cap
```

---

## 6. Claude Code Rate Limits (Separate from API)

Claude Code has its own rate limiting system completely separate from the API:

### Subscription-Based Limits
| Plan | Price | ~Prompts per 5h window | Weekly cap |
|------|-------|------------------------|------------|
| Pro | $20/mo | ~45 | Yes |
| Max 5x | $100/mo | ~5x Pro | Extended |
| Max 20x | $200/mo | ~20x Pro | Extended |

- Uses a **rolling 5-hour window** + **7-day weekly ceiling**
- Shared across Claude.ai web chat AND Claude Code on the same account
- Multiple concurrent Claude Code sessions share the same pool
- No per-session visibility into consumption

### API Key Mode
If you set `ANTHROPIC_API_KEY`, Claude Code bypasses subscription limits entirely and uses API tier limits + pay-per-token billing. This is a completely different rate limit pool.

**Key insight for Paperclip:** Paperclip agents use the API directly (not Claude Code subscriptions). They hit API tier limits, not subscription limits. The two systems are independent.

---

## 7. Cost Implications of Running 5 Agents

### Per-Token Pricing (2026)

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| Claude Opus 4.6 | $5 | $25 |
| Claude Opus 4/4.1 | $15 | $75 |
| Claude Sonnet 4.x | $3 | $15 |
| Claude Haiku 4.5 | $0.80 | $4 |

### Estimated Monthly Cost Scenarios

Assuming each agent runs 8 heartbeats/day, each heartbeat consuming ~5K input + ~2K output tokens:

**All Opus 4.6:**
- Per agent: 8 x 30 x (5K x $5/1M + 2K x $25/1M) = 240 x ($0.025 + $0.05) = $18/mo
- 5 agents: **~$90/mo**

**All Opus 4.6, heavier usage (20K input + 8K output per heartbeat):**
- Per agent: 240 x ($0.10 + $0.20) = $72/mo
- 5 agents: **~$360/mo**

**Mixed model strategy (recommended):**
- CEO + Engineer on Opus 4.6: $144/mo
- Security + Research on Sonnet 4.x: $43/mo (60% cheaper)
- Agent 5 on Haiku 4.5: $5/mo (90% cheaper)
- Total: **~$192/mo**

### Cost Optimization Levers
1. **Prompt caching** — cached input tokens cost 10% of base price and don't count toward ITPM
2. **Batch API** — 50% discount for non-urgent work, separate rate limits
3. **Model mixing** — Use Haiku for triage, Sonnet for routine work, Opus only for complex reasoning
4. **Reduce heartbeat frequency** — Does the CEO agent really need to check every hour?

---

## 8. Recommended Action Plan

### Immediate (today)
1. **Check your current tier** at https://console.anthropic.com/settings/limits
2. **Deposit $40** to reach Tier 2 (1,000 RPM vs 50 RPM — 20x improvement)
3. **Stagger heartbeat schedules** — offset each agent by at least 10 minutes

### Short-term (this week)
4. **Create Workspaces** — one per agent with per-workspace rate limits
5. **Add jitter** to heartbeat timing (random 0-30s delay before each cycle)
6. **Implement proper 429 handling** — exponential backoff respecting `retry-after` header
7. **Enable prompt caching** for repeated system prompts and agent instructions

### Medium-term (this month)
8. **Switch non-critical agents to Sonnet/Haiku** to reduce cost and rate limit pressure
9. **Use Batch API** for Research Agent and Security Auditor (non-time-sensitive work)
10. **Monitor usage** via Console rate limit charts to identify peak contention

---

## Sources

- [Anthropic Rate Limits (Official Docs)](https://platform.claude.com/docs/en/api/rate-limits)
- [Anthropic Service Tiers](https://docs.anthropic.com/en/api/service-tiers)
- [Anthropic Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- [Anthropic Workspaces](https://www.anthropic.com/news/workspaces)
- [Anthropic Workspace Docs](https://platform.claude.com/docs/en/build-with-claude/workspaces)
- [Claude Code with Pro/Max Plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Claude Code Rate Limit Guide (aifreeapi)](https://www.aifreeapi.com/en/posts/claude-code-rate-limit)
- [Claude Code Rate Limits (SitePoint)](https://www.sitepoint.com/claude-code-rate-limits-explained/)
- [Claude Code Rate Limits (Portkey)](https://portkey.ai/blog/claude-code-limits/)
- [Paperclip AI — GitHub](https://github.com/paperclipai/paperclip)
- [Paperclip Core Concepts](https://github.com/paperclipai/paperclip/blob/master/docs/start/core-concepts.md)
- [Paperclip Heartbeat Explained](https://paperclipai.info/blogs/explain_heartbeat/)
- [Paperclip Releases](https://github.com/paperclipai/paperclip/releases)
- [Thundering Herd Fix — oh-my-claudecode PR #1388](https://github.com/Yeachan-Heo/oh-my-claudecode/pull/1388)
- [OpenClaw Backoff Bug — Issue #5159](https://github.com/openclaw/openclaw/issues/5159)
- [Claude Code Session Rate Limit Feature Request — Issue #29721](https://github.com/anthropics/claude-code/issues/29721)
- [Claude API Tiers Guide (aifreeapi)](https://www.aifreeapi.com/en/posts/claude-api-quota-tiers-limits)
- [OpenRouter vs Direct API Keys](https://folding-sky.com/blog/openrouter-vs-direct-api-keys-openai-anthropic-google)
- [Anthropic API Pricing (nops.io)](https://www.nops.io/blog/anthropic-api-pricing/)
- [Opus 4.6 Pricing Guide](https://blog.laozhang.ai/en/posts/claude-opus-4-6-pricing-subscription-guide)
