# Research 71: Paperclip AI Rate Limiting & Multi-Agent API Key Management

---
topic: agents
type: research
status: archive-candidate
last-validated: 2026-08-26
original-query: Analyze rate limiting strategies for multi-agent systems using Paperclip (reconstructed)
tier: archive
note: Paperclip framework decommissioned 2026-05-04. Doc retained as historical reference; patterns may apply to other orchestration tools.
---

**Date:** 2026-03-18
**Status:** Research complete
**Problem:** Running 5 Paperclip agents (CEO, Founding Engineer, Security Auditor, Research Agent, +1) on ONE Anthropic API key causes persistent rate limit hits.

---

## Updated 2026-08-26

Major changes to Anthropic API tiers, rate limits, pricing, and model availability since original research (2026-03-18) and last validation (2026-05-21). Sections 1, 2, 5, 7, and 8 updated to reflect live docs as of 2026-08-26. Sections 3 and 4 (Paperclip internals) retained as-is since Paperclip is decommissioned.

**Key changes verified against https://platform.claude.com/docs/en/api/rate-limits and https://platform.claude.com/docs/en/about-claude/pricing (full fetches, 2026-08-26):**

1. **Tier names completely changed (June 2026):** Tier 1/2/3/4 → Start/Build/Scale/Custom. Advancement is now usage-history-based, not cumulative-spend-based.
2. **Rate limits dramatically increased:** Start tier now has 1,000 RPM and 2M ITPM (vs. 50 RPM and 30K ITPM in old Tier 1). All tiers are 10–40x higher.
3. **New Claude 5 models:** Fable 5, Opus 5, Sonnet 5, Mythos 5 (limited access).
4. **Haiku 4.5 price increased:** $0.80/$4 per MTok → $1/$5 per MTok.
5. **Models retired:** Haiku 3.5, Opus 4, Opus 4.1, Sonnet 4 (available on Bedrock/Google Cloud only).
6. **Spend limits restructured:** Start=$500/mo, Build=$1,000/mo, Scale=$200,000/mo.

---

## 1. Exact Anthropic Rate Limits per Tier

> **⚠ UPDATED 2026-08-26:** Tiers were renamed and limits dramatically raised in June 2026. The original tier names (Tier 1–4) no longer exist. Source: https://platform.claude.com/docs/en/api/rate-limits (full page fetch).

Rate limits are enforced at the **organization level**, not per API key. All keys in the same org share the same pool. Limits use the **token bucket algorithm** (continuous refill, not fixed resets).

### Spend Limits (as of 2026-08-26)

| Usage Tier | Monthly Spend Cap |
|------------|------------------|
| Start | $500/mo |
| Build | $1,000/mo |
| Scale | $200,000/mo |
| Custom | No fixed cap (negotiated) |

**Advancement:** Tiers now advance automatically based on usage history and account standing — NOT based on cumulative credit deposits. New organizations may start in an Evaluation sub-tier (below Start limits) while history is established.

### Rate Limits — Claude Opus 4.x combined (4.5, 4.6, 4.7, 4.8 — shared bucket; Opus 5 is separate)

| Tier | RPM | Input TPM | Output TPM |
|------|-----|-----------|------------|
| **Start** | 1,000 | 2,000,000 | 400,000 |
| **Build** | 5,000 | 5,000,000 | 1,000,000 |
| **Scale** | 10,000 | 10,000,000 | 2,000,000 |

### Rate Limits — Claude Opus 5 (separate bucket from Opus 4.x)

| Tier | RPM | Input TPM | Output TPM |
|------|-----|-----------|------------|
| **Start** | 1,000 | 2,000,000 | 400,000 |
| **Build** | 5,000 | 5,000,000 | 1,000,000 |
| **Scale** | 10,000 | 10,000,000 | 2,000,000 |

### Rate Limits — Claude Sonnet 4.x combined (Sonnet 4.5, 4.6 — shared bucket; Sonnet 5 is separate)

| Tier | RPM | Input TPM | Output TPM |
|------|-----|-----------|------------|
| **Start** | 1,000 | 2,000,000 | 400,000 |
| **Build** | 5,000 | 5,000,000 | 1,000,000 |
| **Scale** | 10,000 | 10,000,000 | 2,000,000 |

### Rate Limits — Claude Sonnet 5 (separate bucket from Sonnet 4.x)

| Tier | RPM | Input TPM | Output TPM |
|------|-----|-----------|------------|
| **Start** | 1,000 | 2,000,000 | 400,000 |
| **Build** | 5,000 | 5,000,000 | 1,000,000 |
| **Scale** | 10,000 | 10,000,000 | 2,000,000 |

### Rate Limits — Claude Haiku 4.5

| Tier | RPM | Input TPM | Output TPM |
|------|-----|-----------|------------|
| **Start** | 1,000 | 2,000,000 | 400,000 |
| **Build** | 5,000 | 5,000,000 | 1,000,000 |
| **Scale** | 10,000 | 10,000,000 | 2,000,000 |

### Rate Limits — Claude Fable 5

| Tier | RPM | Input TPM | Output TPM |
|------|-----|-----------|------------|
| **Start** | 1,000 | 500,000 | 100,000 |
| **Build** | 2,000 | 1,500,000 | 300,000 |
| **Scale** | 4,000 | 4,000,000 | 800,000 |

**Critical note:** Cached input tokens do NOT count toward ITPM for most models. With 80% cache hit rate you can effectively process ~10M total input tokens/min against a 2M ITPM limit (cached tokens are 0x toward the limit). Exception: Claude Haiku 3.5 (retired, Bedrock/GCloud only) counted cache reads toward ITPM.

**Source:** https://platform.claude.com/docs/en/api/rate-limits (full fetch, 2026-08-26)

---

## 2. What Tier Is the User Likely On?

> **⚠ UPDATED 2026-08-26:** Tier names and advancement criteria changed completely in June 2026. The old "$40 deposit = Tier 2" advice is obsolete.

**If using Claude Code with a Pro/Max subscription:** Claude Code subscription usage is entirely separate from API tier limits. The subscription uses a rolling 5-hour window (~45 prompts for Pro, more for Max) shared across Claude.ai chat + Claude Code. This is NOT the API tier system.

**If using an `ANTHROPIC_API_KEY`:** The tier is now determined by **usage history and account standing**, not cumulative credit deposits. New accounts may start in an Evaluation sub-tier (below Start limits) while history is established, then graduate to Start, Build, and Scale automatically.

- **Start** (default entry): 1,000 RPM, 2M ITPM for most models — far more generous than old Tier 1
- **Build**: 5,000 RPM, 5M ITPM — for growing production workloads
- **Scale**: 10,000 RPM, 10M ITPM — for high-volume production

**The context has changed:** At Start tier, 5 agents sharing 1,000 RPM means 200 requests/min per agent — no longer a severe constraint for moderate workloads. ITPM is 2M per model class (shared bucket). With prompt caching the effective throughput is ~10M tokens/min.

**Recommendation:** Check your tier and usage at https://platform.claude.com/settings/limits. If you're on Start and hitting limits, contact Anthropic support through the Rate limits page to request tier advancement; the "$40 deposit" workaround no longer applies.

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

> **⚠ UPDATED 2026-08-26:** New Claude 5 models added; Haiku 4.5 price increased; Opus 4/4.1 and Haiku 3.5 retired. Source: https://platform.claude.com/docs/en/about-claude/pricing (full fetch, 2026-08-26).

### Per-Token Pricing (as of 2026-08-26)

| Model | Input (per 1M tokens) | Output (per 1M tokens) | Status |
|-------|----------------------|------------------------|--------|
| Claude Fable 5 | $10 | $50 | Active |
| Claude Opus 5 | $5 | $25 | Active |
| Claude Opus 4.8 | $5 | $25 | Active |
| Claude Opus 4.7 | $5 | $25 | Active |
| Claude Opus 4.6 | $5 | $25 | Active |
| Claude Sonnet 5 | $2 | $10 | Active (introductory price now standard) |
| Claude Sonnet 4.6 | $3 | $15 | Active |
| Claude Haiku 4.5 | $1 | $5 | Active (was $0.80/$4 — **price increased**) |
| Claude Opus 4.1 | $15 | $75 | Retired (Bedrock/Google Cloud only) |
| Claude Opus 4 | $15 | $75 | Retired (Google Cloud only) |
| Claude Haiku 3.5 | $0.80 | $4 | Retired (Bedrock/Google Cloud only) |

**Note:** Claude 4.7 and later use a newer tokenizer that produces approximately 30% more tokens for the same text. Factor this in when estimating costs for newer models.

### Estimated Monthly Cost Scenarios

Assuming each agent runs 8 heartbeats/day, each heartbeat consuming ~5K input + ~2K output tokens:

**All Opus 4.6 (same price as Opus 5):**
- Per agent: 8 x 30 x (5K x $5/1M + 2K x $25/1M) = 240 x ($0.025 + $0.05) = $18/mo
- 5 agents: **~$90/mo**

**All Opus 4.6, heavier usage (20K input + 8K output per heartbeat):**
- Per agent: 240 x ($0.10 + $0.20) = $72/mo
- 5 agents: **~$360/mo**

**Mixed model strategy (recommended, updated pricing):**
- CEO + Engineer on Opus 4.6/5: $144/mo
- Security + Research on Sonnet 4.6: $43/mo (60% cheaper)
- Agent 5 on Haiku 4.5: $6/mo (88% cheaper — note price increased from $5/mo)
- Total: **~$193/mo**

**Using Sonnet 5 for routine agents (new option):**
- CEO on Opus 5: $72/mo
- Engineer + Security + Research on Sonnet 5 ($2/$10): $17/mo each → $51/mo
- Agent 5 on Haiku 4.5: $6/mo
- Total: **~$129/mo** (further savings with Claude 5 tier)

### Cost Optimization Levers
1. **Prompt caching** — cached input tokens cost 10% of base price and don't count toward ITPM
2. **Batch API** — 50% discount for non-urgent work, separate rate limits
3. **Model mixing** — Use Haiku 4.5 for triage, Sonnet 5 ($2/MTok) for routine work, Opus 5 only for complex reasoning
4. **Reduce heartbeat frequency** — Does the CEO agent really need to check every hour?

---

## 8. Recommended Action Plan

> **⚠ UPDATED 2026-08-26:** Tier advancement is now usage-history-based. The "$40 deposit" advice is obsolete — Start tier already has 1,000 RPM and 2M ITPM by default.

### Immediate (today)
1. **Check your current tier** at https://platform.claude.com/settings/limits
2. **Confirm you're on Start tier or higher** — limits are now much more generous. Most new accounts automatically progress based on usage.
3. **Stagger heartbeat schedules** — offset each agent by at least 10 minutes to avoid thundering herd (still valid advice)

### Short-term (this week)
4. **Create Workspaces** — one per agent with per-workspace rate limits (still valid; see Section 5)
5. **Add jitter** to heartbeat timing (random 0-30s delay before each cycle)
6. **Implement proper 429 handling** — exponential backoff respecting `retry-after` header
7. **Enable prompt caching** for repeated system prompts and agent instructions

### Medium-term (this month)
8. **Consider Claude Sonnet 5 ($2/$10 per MTok)** for routine agents — price is now confirmed permanent (introductory pricing locked in)
9. **Use Batch API** for Research Agent and Security Auditor (non-time-sensitive work) — 50% discount still applies
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
