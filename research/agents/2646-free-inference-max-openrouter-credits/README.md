---
topic: agents
type: decision
status: research-complete
last-validated: 2026-10-08
related-docs: 2492, 2644, 2607
original-query: "API credits: check whether the Max plan's monthly API credits show in the Console, and claim them if not. lets reivew and lets also resaerhc how to use the openrouter free models the max"
tier: STANDARD
---

# 2646 - Free and near-free inference, to the max: Max plan API credits, OpenRouter's free tier, and Haiku 5.5

> **Goal:** Find every zero-cost or near-zero-cost source of model calls the estate is entitled to, measure how much of each we use today, and say how to get the most out of them.

## Key Decisions

| # | Decision | Why (measured 2026-10-08) |
|---|---|---|
| 1 | **Claim the Max plan's API credits this week.** This is Zaal's hands: it means accepting program terms on his account. | The credits are $100 a month on Max 5x and $200 a month on Max 20x. They cover the Claude API, Managed Agents and the Agent SDK. They do **not** cover Claude Code. They expire each billing cycle with no rollover, so every unclaimed month is lost. |
| 2 | **USE the credits for ZOE's fallback ladder, on Claude Haiku 5.5.** Add a direct-Anthropic rung to `callCapFallback` behind a flag, OFF by default. | Haiku 5.5 costs $0.10 in and $0.50 out per Mtok, which is below ZOE's current OpenRouter default `deepseek/deepseek-chat` ($0.2574 / $1.0287 per Mtok in the live catalogue). Paid from credits, its marginal cost is $0 until the month's credit runs out. API billing is separate from the Max usage cap that triggers the fallback, so this rung does not re-hit that cap. |
| 3 | **Find out whether the OpenRouter account has ever bought $10 of credit. If not, buy $10 once.** Money is Zaal's call. | OpenRouter's docs set the free-model limits as code constants: **20 requests per minute, 50 requests per day**, rising to **1,000 per day** once $10 has ever been purchased. One $10 purchase is a 20x larger free ceiling, permanently. `GET /api/v1/key` reports the live counter in `free_model_daily_requests`. |
| 4 | **USE OpenRouter's server-side `models` array instead of one request per model.** | One request carries a ranked list, and OpenRouter tries the next model on any error, including rate limits and context-length errors. A grep of `bot/src` for `models:` and `fallbacks:` found no use of it. ZOE's OpenRouter rung sends one model per call. |
| 5 | **Keep `openrouter/free` as the last safety net only, never first.** | The router picks "a free model at random" from those that support the request's features. Random is fine for a last resort but bad for anything that needs consistent output. |
| 6 | **Turn OFF provider training for free models in OpenRouter privacy settings, if it is on.** Zaal checks. | The docs say there are "separate settings for paid and free models" for routing to providers that may train on prompts. ZOE sends DM content. OpenRouter itself stores no prompts unless logging is opted in. |
| 7 | **The Hermes free chain needs nothing.** | `zao-openrouter-preflight --from-hermes` against today's catalogue: "Verified: 11/11 fallbacks live (0 dropped)". The weekly preflight job `com.zao.openrouter-preflight` is loaded, and its last exit was 0. |

## Findings

### 1. Max plan API credits (Anthropic's page, read raw)

| | |
|---|---|
| Eligible | Max 5x, Max 20x, Team |
| Amount | $100 a month (Max 5x), $200 a month (Max 20x) |
| Covers | Claude API, Claude Managed Agents, the Claude Agent SDK, playground |
| Does not cover | Claude Code, extra usage in the Claude apps |
| Expiry | End of each billing cycle, no rollover |
| Payment method | Not required |
| Claim | claude.ai, Settings > Billing > API credits, link a Console organization, accept the program terms |

**Whether these were already claimed: UNKNOWN.** The Claude-in-Chrome extension was not connected on 2026-10-08, so the billing page could not be read. Claiming accepts terms on Zaal's account, which is his action.

**What ZOE can spend them on today.** A grep of `bot/src` for `@anthropic-ai/sdk` and `api.anthropic.com` found only `bot/src/zai/llm-handler.ts`. ZOE's own calls go through the Claude CLI (the Max cap) and the cap-fallback ladder in `bot/src/zoe/models/router.ts`:

> openrouter > surplus > grok > gpt > ollama

That ladder has no direct Anthropic API rung, so the credits currently have nothing to pay for. Decision 2 fixes that.

### 2. OpenRouter free tier, from the docs' own source (`limits.md`)

```
FREE_MODEL_RATE_LIMIT_RPM      = 20
FREE_MODEL_NO_CREDITS_RPD      = 50
FREE_MODEL_HAS_CREDITS_RPD     = 1000
FREE_MODEL_CREDITS_THRESHOLD   = 10
```

Three more things from the same docs:

- **A negative balance blocks free models too.** "If your account has a negative credit balance, you may see errors, including for free models."
- **Rate-limit errors carry recovery data.** A 429 includes `X-RateLimit-*` headers, and the docs say to honour `Retry-After`.
- **Same-model retries happen automatically.** When a provider is rate limited, "fallback routing retries other providers for the same model automatically".

### 3. The free catalogue today

`/api/v1/models` returns 468 models. 20 of them are free:

- 18 `:free` IDs;
- `openrouter/free`;
- 2 zero-priced Lyria previews, which are not text.

The usable large-context ones, all with tool calling, are:

| Model | Context |
|---|---|
| `thinkingmachines/inkling:free` | 1,048,576 |
| `thinkingmachines/inkling-small:free` | 1,048,576 |
| `nvidia/nemotron-3-ultra-550b-a55b:free` | 1,000,000 |
| `nvidia/nemotron-3.5-lightning:free` | 1,000,000 |
| `nvidia/nemotron-3-super-120b-a12b:free` | 262,144 |
| `poolside/laguna-s-2.1:free` | 262,144 |
| `google/gemma-4-31b-it:free` | 262,144 |
| `cohere/north-mini-code:free` | 256,000 |

New since doc 2492 (2026-09-15): `apodex/apodex-1.1-mini:free` (262,144, tools). It is a candidate for the Hermes chain once it has a week of uptime. `nex-agi/nex-n2.5-pro:free` from the 2492 chain is gone, and the preflight already dropped it.

### 4. Ranking every source, cheapest first

| Source | Cost to us | Ceiling | Today |
|---|---|---|---|
| Max API credits | $0 until the monthly credit is spent | $100 or $200 a month, use it or lose it | Possibly unclaimed; nothing in ZOE can spend it |
| OpenRouter `:free` models | $0 | 50 a day (under $10 purchased) or 1,000 a day | Hermes chain, 11/11 live |
| Local Ollama | $0 | Mac or Pi CPU | Last rung in ZOE |
| Haiku 5.5 on API or OpenRouter | $0.10 / $0.50 per Mtok | Paid | Not used |
| `deepseek/deepseek-chat` (ZOE default) | $0.2574 / $1.0287 per Mtok | Paid | ZOE's first fallback rung |

The default is the most expensive row in the table, and it is the first rung ZOE tries.

## Also See

- [Doc 2492](../2492-openrouter-free-fallback-chain-preflight/) - the free chain and the preflight that keeps it alive
- [Doc 2644](../2644-agent-landscape-oct-2026/) - the agent landscape that surfaced the credits and Haiku 5.5
- [Doc 2607](../2607-multi-model-routing-engine-zoe-claude-gpt-fallback/) - ZOE's routing engine

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Claim the Max API credits (claude.ai > Settings > Billing > API credits). Shipped = credit balance visible in the Console org. | Zaal | Account | 2026-10-12 |
| ZOE: add a direct-Anthropic cap-fallback rung on `claude-haiku-5-5`, behind `ZOE_ANTHROPIC_API_RUNG`, OFF by default. Shipped = merged PR with a red control. | zoe lane (Claude) | PR | 2026-10-10 |
| Check `GET /api/v1/key` `free_model_daily_requests.limit` on the OpenRouter key (50 means under $10 purchased), and decide on a one-time $10 top-up. Shipped = limit reads 1000. | Zaal | Account + money | 2026-10-12 |
| ZOE: pass OpenRouter's `models` array (default model plus 2 free fallbacks) in `callOpenRouter`, behind a flag. Shipped = merged PR. | zoe lane (Claude) | PR | 2026-10-15 |
| Check OpenRouter privacy settings: no training for free models. Shipped = setting confirmed. | Zaal | Settings | 2026-10-12 |

## Sources

- [API credits for Max and Team plans](https://platform.claude.com/docs/en/about-claude/api-credits-for-subscribers) [FULL - curl + HTML strip, 2026-10-08]
- [OpenRouter API limits (markdown source)](https://openrouter.ai/docs/api-reference/limits.md) [FULL - raw markdown; the constants are quoted from it]
- [OpenRouter FAQ (markdown source)](https://openrouter.ai/docs/faq.md) [FULL - raw markdown]
- [OpenRouter model fallbacks](https://openrouter.ai/docs/guides/routing/model-fallbacks.md) [FULL - raw markdown]
- [OpenRouter Free Models Router](https://openrouter.ai/docs/guides/routing/routers/free-router.md) [FULL - raw markdown]
- [OpenRouter data collection](https://openrouter.ai/docs/guides/privacy/data-collection.md) and [provider logging](https://openrouter.ai/docs/guides/privacy/logging.md) [FULL - raw markdown]
- [OpenRouter models catalogue](https://openrouter.ai/api/v1/models) [FULL - JSON API, 468 models, 2026-10-08]
- [Claude Platform release notes](https://platform.claude.com/docs/en/release-notes/overview) [FULL - Haiku 5.5 pricing and launch, 2026-10-07]
- Community: [HN, "Dots: Always-on agents"](https://news.ycombinator.com/item?id=49896604). The top comment complains that subscription limits get cut once users switch over, which argues for using credits while they are offered. [FULL - Algolia items API]
- In-repo: `bot/src/zoe/models/router.ts` (the cap-fallback ladder, default `deepseek/deepseek-chat`), `zao-openrouter-preflight --from-hermes` output, `launchctl list` [FULL]
