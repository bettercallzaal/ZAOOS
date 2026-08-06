---
topic: business
type: decision
status: research-complete
last-validated: 2026-08-06
related-docs: "2188, 891, 2208"
original-query: "How do we connect up with the best inference possible - the way to get AI credits cheapest for the best models. Zaal thinks Saltorius in a ZABAL Games episode gave a website for this."
tier: DEEP
---

# 2216 - Cheapest AI Inference + Free Credits for the Best Models

> **Goal:** The concrete answer to "how do we run the best models for the least money" - the cheapest open-model hosts, the free-credit programs for frontier models, and what to actually do for ZAO's fleet + Claude usage.

## Key Decisions (recommendations first)

| # | Decision | Why | Source |
|---|----------|-----|--------|
| 1 | **Keep OpenRouter as the fleet router, but know DeepInfra + Novita are the cheapest DIRECT hosts** for open models. Move a single high-volume model direct only if its volume justifies losing OpenRouter's failover. | OpenRouter adds ~5.5% on credit purchases (no inference markup) for routing + failover across many hosts. DeepInfra owns its stack (no aggregator margin) and is the most frequent cheapest-endpoint winner; Novita is within cents and #1 third-party by volume. | StackSpend; Perkstack; Novita |
| 2 | **For FREE credits on the BEST (frontier) models, the real lever is startup credit programs - and the biggest ones need institutional equity funding ZAO likely doesn't have.** The one ZAO can get today with no VC: **AWS Activate Founders ($1,000, self-funded), usable on Bedrock (Claude, Llama, Mistral).** | Anthropic/Google/OpenAI startup programs require institutional equity + <4-5yr + no prior credits. AWS Activate Founders is self-funded-eligible. | Claude/AWS/Google/OpenAI startup pages |
| 3 | **The Saltorius lead is OpenRouter + x402/Router402 (crypto pay-per-inference), not a single "cheap credits" site.** His actual bootcamp lesson (doc 891) was architectural: cheap-model-for-cheap-task + pay-per-call rails. | doc 891 transcript has no specific credit-website; it has OpenRouter + x402 + the cost-discipline patterns. | doc 891 |
| 4 | **The biggest cost lever is NOT the provider - it is matching the model to the task** (which ZAO already does: fleet on OpenRouter/DeepSeek, Claude Max for grounded code). Providers are a 5-50x lever; task-routing is often bigger. | Open models are 5-50x cheaper than frontier; using a frontier model where a cheap one works is the real waste. | StackSpend; doc 891 |
| 5 | **If ZAO/BCZ can affiliate with an AWS Activate Provider (an accelerator / VC / startup org), AWS Activate Portfolio unlocks up to $100,000** on Bedrock. ZAO is an incubator - worth checking if it (or a partner) is an Activate Provider. | Portfolio tier is provider-backed, up to $100k, Bedrock third-party models included. | AWS Activate |

## The Saltorius thread (what he actually said)

Saltorius (Laser / `saltorious.eth`, lazertech, 5.3k FC) ran ZABAL/agentic bootcamp
**Session 4 "Memory, Context & Reasoning"** (doc 891, transcript pasted, Apr 2 2026). His
cost lessons - none of which is a single "cheap credits" website:

- **Cheap-model-for-cheap-task:** smaller models (Haiku/mini) by default; the big model only
  as a filter, "ideally just code. Don't use a large model to orchestrate."
- **Orchestrator + cheap sub-agents:** flagship plans, one-thing-only sub-agents on cheap
  models (deliberate=Haiku, vote=Gemini Flash, cards=Grok).
- **Conditionals before the LLM:** rate-limit + check cheap DB state before paying for inference.
- **OpenRouter** for stateless generation (user-selectable model), swappable to **Router402 / x402**
  (pay-per-inference inside an HTTP request - the crypto-native metered-compute rail).
- Cheaper infra: self-host **Hypersnap** for the Neynar read API (vs $500/mo).

So the "website" is most likely **OpenRouter** (or the **x402/Router402** pay-per-call rail) -
not a discount-credits storefront. If Zaal remembers a specific different site, it isn't in
the transcript; ask him to name it and I'll verify it.

## Cheapest open-model hosts (July 2026, verified)

Same open model costs 5-12x different depending on the host - you buy hardware + margin,
not the weights. Frontier closed APIs (GPT-5.5, Claude Opus 4.8, Gemini 3.1 Pro) run ~$2-5/1M
in + $9-30/1M out; open-weight on specialist hosts is $0.04-$0.60/1M - **5-50x cheaper.**

| Host | GPT-OSS-120B ($/1M in-out) | Notable | Best for |
|------|---------------------------|---------|----------|
| **DeepInfra** | **$0.039 / $0.19** | owns its stack, no aggregator margin; DeepSeek-V4 Flash $0.10/$0.20; Llama-8B $0.02/$0.05 | absolute cheapest direct per-token |
| **Novita** | $0.05 / $0.25 | #1 third-party by volume on OpenRouter (135.8B tok/day, 66 models) | cheap + broad + production-grade |
| SiliconFlow | $0.05 / $0.45 | 200+ open models | catalog breadth |
| Groq | $0.15 / $0.60 (cache -50%) | LPU hardware, fastest time-to-first-token | latency-bound / agentic loops |
| Together AI | $0.15 / $0.60 | broad catalog + LoRA fine-tuning | fine-tuning + breadth |
| Fireworks | $0.15 / $0.60 | speed tiers; also on Azure Foundry | production serving |
| **OpenRouter** | underlying host rate + ~5.5% credit fee | aggregator, auto-routes to cheapest, failover, free dev routes | one key across all hosts (ZAO's current) |

Live price trackers (re-checked weekly): **pricepertoken.com**, **perkstack.co/blog/cheapest-ai-inference-api**,
**infrabase.ai/blog/cheapest-inference-providers**. Prices move monthly - check the model's own
page the day you commit volume.

**Reality for ZAO:** the fleet already runs DeepSeek via OpenRouter (~$0.0004/review in the
panel sim). Going DeepInfra/Novita direct would shave the ~5.5% fee + sometimes beat the routed
price, but loses OpenRouter's failover across 12+ hosts. Only worth it if one model dominates
volume. Net: **OpenRouter is the right default; DeepInfra-direct is the escape hatch at scale.**

## Free credits for the best (frontier) models

| Program | Amount | Works on | Eligibility (the catch) |
|---------|--------|----------|--------------------------|
| **AWS Activate Founders** | **$1,000** | **Bedrock** (Claude, Llama, Mistral, Cohere, AI21, Stability) | self-funded OR pre-Series B, <10yr, website. **No VC needed.** ZAO can get this. |
| **AWS Activate Portfolio** | up to **$100,000** | Bedrock (same) | must be affiliated with an **Activate Provider** (accelerator/VC/startup org), pre-Series B |
| **Google Cloud AI startup** | up to **$350,000** ($250k yr1 AI-first) | Gemini/Gemma only (3rd-party billed separately) | VC-funded (pre-seed/seed <5yr, Series A <12mo), <$5k prior GCP credits |
| **Anthropic Claude for Startups** | free Claude credits + priority rate limits | first-party Claude API (NOT Bedrock/Vertex) | equity funding from an **institutional investor**, founded <4yr, no prior Anthropic credits |
| **OpenAI for Startups** | credits via VC partners | OpenAI API | via an OpenAI VC partner |
| **Microsoft for Startups (Azure)** | Azure credits | Azure-billed models + **Fireworks on Foundry** + GitHub Copilot/Actions | Microsoft for Startups acceptance |

**The honest catch:** the big programs ($100k+) want institutional equity funding + a recent
priced round. BCZ Strategies LLC / ZAO is a creator org, likely not VC-equity-funded - so the
Anthropic/Google/OpenAI/AWS-Portfolio tiers probably don't qualify as-is. **What DOES qualify
today: AWS Activate Founders ($1k, Bedrock = Claude via API).** And ZAO is itself an incubator -
if it (or a close partner accelerator) is an AWS Activate Provider, that opens the $100k Portfolio
tier for ZAO's founders. Worth a direct check with AWS Activate.

## What to actually do (ranked)

1. **Keep OpenRouter for the fleet** (already done) - right default for a multi-model fleet.
2. **Apply for AWS Activate Founders ($1k, no VC)** - immediate free Claude/Llama on Bedrock; a
   free experiment budget for the cross-family panel + fleet. Cheap to try.
3. **Check if ZAO or a partner is an AWS Activate Provider** - unlocks up to $100k Portfolio.
4. **If a priced equity round ever happens,** the Anthropic + Google ($350k) + AWS Portfolio
   programs become the big prize - apply then.
5. **Keep task-routing tight** (Saltorius's real lesson) - the 5-50x model-choice lever beats
   shopping hosts for a 10% saving.

## Also See

- [Doc 891](../../agents/891-farcaster-agentic-bootcamp-zol/) - Saltorius bootcamp session (the source of the lead).
- [Doc 2188](../../agents/2188-cheap-fleet-premium-escalation/) - ZAO's cheap-fleet cost ladder.
- [Doc 2208](../*/2208-*/) - the ZAO AI cost research.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Apply for AWS Activate Founders ($1k, Bedrock) with the ZAO/BCZ website + entity | Zaal | application | 2026-08-13 |
| Ask AWS Activate whether ZAO (incubator) can register as an Activate Provider (-> $100k Portfolio tier for founders) | Zaal | outbound | 2026-08-20 |
| If Zaal recalls a specific different "cheap credits" site from the episode, name it -> I verify + add here | Zaal | decision | wontfix until named |
| Evaluate DeepInfra-direct for the single highest-volume fleet model vs OpenRouter's 5.5% fee | Zaal | eval | 2026-08-20 |

## Sources

- [LLM Model Pricing (July 2026) - StackSpend](https://www.stackspend.app/resources/blog/llm-model-pricing-july-2026) [FULL] - the 3-tier market, per-host open-model rates, DeepInfra $0.039/$0.19.
- [Cheapest AI Inference API 2026 - Perkstack](https://perkstack.co/blog/cheapest-ai-inference-api) [PARTIAL - exa-read, curl timed out] - live ranking across 88 models; DeepInfra cheapest tiers; notes Groq's $10k startup program is no longer published.
- [Cheapest AI Inference Providers (July 2026) - Infrabase](https://infrabase.ai/blog/cheapest-inference-providers) [FULL] - gpt-oss-120B per-provider table.
- [OpenRouter vs Together vs Groq vs Fireworks vs Cerebras - HostFleet](https://hostfleet.net/openrouter-vs-together-vs-groq-vs-fireworks/) [FULL] - OpenRouter ~5% fee, aggregator mechanics, per-model tables.
- [Top Inference Providers for Open-Source Models - Novita](https://blogs.novita.ai/inference-api-providers-for-open-source-models/) [FULL] - volume ranking, 5.9x price spread, cost example.
- [Claude for Startups - Anthropic](https://claude.com/programs/startups) [FULL, verified 200] - credits + priority limits; institutional-equity eligibility; first-party API only.
- [AWS Activate Credits](https://aws.amazon.com/startups/lp/aws-activate-credits) [FULL, verified 200] - Founders $1k / Portfolio $100k; Bedrock third-party models.
- [Google Cloud AI startup program](https://cloud.google.com/startup/ai) [FULL, verified 200] - up to $350k, Gemini/Gemma, VC eligibility.
- [OpenAI for Startups](https://openai.com/startups/) [FULL] - VC-partner credits.
- [Microsoft for Startups - Azure credits](https://learn.microsoft.com/en-us/microsoft-for-startups/benefits/use-azure-credits) [FULL] - Azure + Fireworks-on-Foundry credit coverage.
- ZAO doc 891 (Saltorius bootcamp transcript) [FULL, repo] - OpenRouter + x402/Router402 + cheap-model-for-cheap-task; no discount-credits site.
