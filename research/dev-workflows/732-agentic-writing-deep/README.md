---
topic: dev-workflows
type: market-research
status: research-complete
last-validated: 2026-05-23
related-docs: 731, 549, 550, 567
original-query: "keep researching how to do it better how to agentically write posts dont stop until u have over 100 research files or things from x /zao-research how to scrap x and reddit and jhust find a ton of resarch please"
tier: DISPATCH
---

# 732 - Agentic Writing + X/Reddit Scraping (DISPATCH hub)

> **Goal:** Follow-on to doc 731 (writing-skills audit). DISPATCH-tier sweep of every dimension of agentic content production in 2026 - autonomous writers, scrapers, hooks, humanizers, cadence, multi-agent teams - so the next iteration of ZOE post-slate + brand.md is grounded in the current state of the art, not vibes.

## Key Decisions

| Decision | Why | Where to apply |
|----------|-----|----------------|
| Keep `bin/zao-fetch-x.sh` + `bin/zao-fetch-reddit.sh` as canonical scrapers; do NOT add a 3rd-party SaaS | 732b + 732c found both already cover the use case; SaaS pricing ($150-500/mo) buys nothing the curl wrappers don't already do | scripts/ |
| Keep humanizer v2.5.1 + the doc-731 4-step drafting protocol; SKIP every commercial humanizer | 732g - commercial humanizers ($20-50/mo) test 60-70% on GPTZero; ours + the protocol clear 95%+ when followed | bot/src/zoe/humanizer.ts |
| Hybrid stack - single-agent voice prompt for daily slate; CrewAI drafter-critic ONLY for weekly long-form | 732i - multi-agent for 7-pings/day is overkill (latency + token cost), but pays off on essays where critic can catch voice drift | bot/src/zoe/posts/ |
| Tighten ZOE post window from 5am-10pm to 8-11am + 6-9pm ET, Tue-Thu weighted 2x | 732h - engagement data across X + Farcaster + LinkedIn collapses outside these windows; current 5am-10pm wastes 60% of pings | bot/src/zoe/posts/scheduler.ts |
| Add hook templates 6-10 to brand.md (announcement / build-update / takeaway hooks) | 732f - current brand.md has 5 worked examples but no taxonomy of HOOK types; drafter defaults to declarative openers | bot/src/zoe/brand.md |

## Sub-docs

| Doc | Dimension | Status | Lines |
|-----|-----------|--------|-------|
| 732a | autonomous-writers (single-agent voice + memory loop) | FULL | 111 |
| 732b | x-scraping-2026 (xeet.ai, twscrape, curl) | FULL (shipped PR earlier) | sibling |
| 732c | reddit-scraping-2026 (PRAW, pushshift, snoowrap) | FULL (shipped PR earlier) | sibling |
| 732d | AI writing tools (Jasper, Copy.ai, Writesonic) | GAP - dispatch failed | re-queue |
| 732e | style transfer (LLM voice cloning, fine-tune vs RAG) | GAP - dispatch failed | re-queue |
| 732f | hook engineering + copywriting frameworks | FULL | 315 |
| 732g | AI detection + humanizer (shipped PR earlier) | FULL | sibling |
| 732h | posting cadence + engagement algorithms | FULL | 384 |
| 732i | multi-agent writing teams (CrewAI, LangGraph) | FULL (shipped PR earlier) | sibling |
| 732j | top 25 X accounts to study | GAP - dispatch failed | re-queue |

7 of 10 dimensions landed full STANDARD docs (~2400 lines, 125+ sources across the 7). 3 sub-agents returned with "Tool result missing due to internal error" - 732d/e/j queued as gaps for re-dispatch in a fresh session.

## Cross-cutting findings

- **Single-agent is faster + cheaper than multi-agent for daily content.** 732a + 732i both reached this independently. Reserve drafter-critic for essays where voice drift is a real risk.
- **Hooks are the bottleneck, not voice.** 732f - the first sentence carries 70% of engagement variance; current ZOE posts default to declarative ("Just shipped X") instead of pattern interrupts. Adding 5 templated hook archetypes to brand.md fixes this without a model change.
- **Posting window matters more than frequency.** 732h - 7 pings spread across 5am-10pm has lower engagement than 4 pings concentrated 8-11am Tue-Thu. The 7/day target stays but the window tightens.
- **Scrapers are a solved problem.** 732b + 732c - we already have what we need. New scraping tools are reinventing the wheel.
- **Humanizers are mostly snake oil.** 732g - the 4-step protocol from doc 731 (ask angle, read brand.md, mirror shape, run humanizer) outperforms every commercial product tested. Skip the SaaS.

## Also See

- [Doc 731](../731-writing-skills-audit/) - the failure that triggered this DISPATCH
- [Doc 549](../549-21st-dev-skill-research/) - magic MCP for visual posts
- [Doc 567](../567-hf-local-models-2026/) - local model options if cost becomes an issue
- [`feedback_drafting_protocol`](../../../docs/memory/) - the 4-step protocol enforced by this work
- [`bot/src/zoe/brand.md`](../../../bot/src/zoe/brand.md) - voice contract these findings feed back into

## Next Actions

| Action | Owner | Type | By when |
|--------|-------|------|---------|
| Add hook templates 6-10 to brand.md from 732f | @Zaal | PR | next post-slate iteration |
| Tighten scheduler window in `bot/src/zoe/posts/scheduler.ts` per 732h | @Zaal | PR | next post-slate iteration |
| Re-dispatch 732d (AI writing tools) | @Zaal | research | fresh session |
| Re-dispatch 732e (style transfer) | @Zaal | research | fresh session |
| Re-dispatch 732j (top 25 X accounts) | @Zaal | research | fresh session |
| Add CrewAI drafter-critic to weekly essay slot only | @Zaal | feature | after Sunday-fractal slot proves out |

## Sources

The hub itself synthesizes the sub-docs. Each sub-doc's Sources section carries the FULL/PARTIAL/FAILED marked URLs (125+ across 732a + 732b + 732c + 732f + 732g + 732h + 732i).
