---
topic: agents
type: guide
status: research-complete
last-validated: 2026-05-04
related-docs: 461, 529, 547, 600, 601
tier: STANDARD
---

# 602 — TradingAgents Multi-Agent Pattern → Adapt for ZAO Social + Project Management (NOT Trading)

> **Goal:** Document the TradingAgents (Tauric Research) multi-agent debate architecture. Identify which patterns transfer to ZOE's concierge brain (per doc 601 Option D) for two specific use cases: **social media posting decisions** and **project management decisions**. Explicitly NOT for trading — Zaal's call. Save for later use, don't implement now.

## Recommendation (no preamble)

**Steal 4 patterns from TradingAgents into ZOE-Hermes-brain. Skip the rest.**

| Pattern | Steal? | Apply to |
|---|---|---|
| Two-tier LLM routing (deep_think + quick_think) | YES — already shipped in Hermes Sprint 1 (Sonnet + Opus + Haiku) | ZOE concierge brain (doc 601 Phase 1) |
| Bullish/Bearish researcher debate | YES — high value for "should I post this?" + "should I ship this Tuesday?" decisions | ZOE social mode + PM mode |
| Persistent decision log with reflection loop | YES — `~/.zao/memory/decisions.md`, inject recent decisions into next prompt | ZOE concierge brain |
| Bounded debate rounds (2 default) | YES — simple cap, prevents loop spiral (matches doc 599 §"loop limit") | ZOE concierge brain |
| Specialized analyst team (4 agents) | PARTIAL — 2-3 personas max, not 4. Don't over-design. | ZOE social mode |
| LangGraph orchestration | SKIP — overkill for v1, adds dependency, our `bot/src/hermes/runner.ts` pattern is simpler | n/a |
| Risk Management team + Portfolio Manager 2-stage approval | SKIP — Zaal IS the portfolio manager, no second layer needed | n/a |
| Trading-specific roles (Fundamentals/Technical/News) | RENAME — same shape, different content. See mapping below. | ZOE social + PM modes |

**Net:** 4 patterns to lift. ZOE-Hermes-brain becomes a debate engine for "should I post this?" and "should we ship this?" decisions. Trading itself stays out of scope per Zaal's explicit direction.

## Source Material

**Paper:** [TradingAgents: Multi-Agents LLM Financial Trading Framework](https://arxiv.org/abs/2412.20138)
- Authors: Yijia Xiao, Edward Sun, Di Luo, Wei Wang
- Submitted 2024-12-28, latest revision 2025-06-03
- Category: Quantitative Finance (q-fin.TR)

**Repo:** [github.com/TauricResearch/TradingAgents](https://github.com/TauricResearch/TradingAgents)
- 66,034 stars, 12,781 forks (verified 2026-05-04)
- Apache 2.0
- Python 3.13
- Last release v0.2.4 (2026-04) — structured-output agents + LangGraph checkpoint resume + DeepSeek/Qwen/GLM/Azure provider support

## What TradingAgents Actually Does (the architecture)

### 5 specialized teams collaborate to make ONE decision per stock per day

```
┌──────────────────────────────────────────────────────────┐
│  ANALYST TEAM (4 agents, parallel)                       │
│   - Fundamentals Analyst   (financials, intrinsic value) │
│   - Sentiment Analyst       (social media, public mood)  │
│   - News Analyst            (macro events, news impact)  │
│   - Technical Analyst       (MACD, RSI, price patterns)  │
└────────────────────────┬─────────────────────────────────┘
                         │ reports flow into
                         ▼
┌──────────────────────────────────────────────────────────┐
│  RESEARCHER TEAM (debate, max 2 rounds)                  │
│   - Bullish Researcher  (defends optimistic case)        │
│   - Bearish Researcher  (defends pessimistic case)       │
│  → Structured debate, balanced perspective output        │
└────────────────────────┬─────────────────────────────────┘
                         │ debate winner + summary
                         ▼
┌──────────────────────────────────────────────────────────┐
│  TRADER AGENT                                            │
│   - Synthesizes analyst + researcher outputs              │
│   - Decides timing + magnitude                           │
└────────────────────────┬─────────────────────────────────┘
                         │ proposed trade
                         ▼
┌──────────────────────────────────────────────────────────┐
│  RISK MANAGEMENT TEAM                                    │
│   - Volatility, liquidity, exposure check                │
│   - Adjusts strategy if risk-out-of-bounds               │
└────────────────────────┬─────────────────────────────────┘
                         │ risk-adjusted proposal
                         ▼
┌──────────────────────────────────────────────────────────┐
│  PORTFOLIO MANAGER                                       │
│   - Final approve / reject                               │
└──────────────────────────────────────────────────────────┘
                         │ executed trade or rejected
                         ▼
                  Persistent decision log
                  (~/.tradingagents/memory/trading_memory.md)
                         │
                         ▼ next run
                Reflection loop: fetch realized return,
                generate 1-paragraph reflection, inject
                into next prompt for same ticker
```

### Key architectural primitives

| Primitive | Implementation | What we steal |
|---|---|---|
| **Two-tier LLM routing** | `deep_think_llm` (e.g. gpt-5.4) for complex reasoning; `quick_think_llm` (e.g. gpt-5.4-mini) for fast tasks | Already in Hermes Sprint 1 cost routing — Sonnet (cheap/simple) + Opus (hard) + Haiku (fastest) |
| **Bounded debate** | `max_debate_rounds: 2` default | Simple int config, hard cap prevents spiral |
| **Persistent decision log** | Markdown file `~/.tradingagents/memory/trading_memory.md` appended on every run | Mirrors as `~/.zao/memory/zoe-decisions.md` |
| **Reflection / learning loop** | After each run, fetch outcome, write reflection, inject into next prompt | High value — ZOE learns from past calls |
| **LangGraph checkpoint resume** | Per-ticker SQLite at `~/.tradingagents/cache/checkpoints/<TICKER>.db` | SKIP — adds dependency, our bot/src/hermes runner is stateless enough |
| **Multi-LLM provider abstraction** | `llm_provider: "openai"` config switch | We're committed to Claude (Max plan) — skip multi-provider for v1 |

## Map to ZAO Use Cases (NOT trading)

### Use case 1 — ZOE Social Mode (post decisions)

When Zaal asks ZOE "should I post X" or "draft a post for Y", ZOE runs an internal debate before recommending.

```
INPUT: post draft or topic
        │
        ▼
┌──────────────────────────────────────────────────────────┐
│  ANALYST TEAM (3 agents, parallel)                       │
│   - Brand Voice Analyst   (matches Year-of-the-ZABAL?)   │
│   - Audience Resonance    (will FC/X audience care?)     │
│   - Timing Analyst        (right news cycle moment?)     │
└────────────────────────┬─────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────┐
│  RESEARCHER TEAM (2 rounds max)                          │
│   - Pro-Post              (post now, here's why it lands)│
│   - Anti-Post             (delay or rephrase, here's why)│
└────────────────────────┬─────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────┐
│  ZOE DRAFTER                                             │
│   - Drafts final post in voice                           │
│   - Or recommends "skip" with reasoning                  │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼ ZAAL APPROVES
                  Posts via existing publish pipeline
                  (Firefly for FC+X per memory)
```

**Replaces:** the cycle of "Zaal types post → posts → wonders if it lands."

**Why this beats trading-style multi-agent for social:** social posts have qualitative outcomes (engagement, brand fit), not numeric (return %). Debate-pattern fits better than analyst-team-with-metrics.

### Use case 2 — ZOE Project Management Mode (ship/wait decisions)

When Zaal asks ZOE "should we ship X today" or "what's blocking ZAOstock", ZOE runs a debate.

```
INPUT: project name + question
        │
        ▼
┌──────────────────────────────────────────────────────────┐
│  ANALYST TEAM (3 agents, parallel)                       │
│   - Project Health Analyst   (state from Bonfire graph)  │
│   - Velocity Analyst          (commit/PR velocity, blockers)│
│   - External Context Analyst  (calendar, partner deps)   │
└────────────────────────┬─────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────┐
│  RESEARCHER TEAM (2 rounds max)                          │
│   - Ship-It Advocate          (ready, here's the proof)  │
│   - Wait-It-Out Advocate      (polish first, here's why) │
└────────────────────────┬─────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────┐
│  ZOE PM RECOMMENDER                                      │
│   - "Ship Tuesday" or "Delay 1 week" + reasoning         │
└──────────────────────────────────────────────────────────┘
```

**Replaces:** Zaal's intuition + ad-hoc team check-ins. Adds a second voice that's read everything in Bonfire and seen prior similar decisions.

## Implementation Plan (when, not now)

Per Zaal: **save for later, don't implement now.** This doc is the recipe for when ZOE-Hermes-brain (doc 601 Phase 1) is built and we want to add debate-mode personalities.

When the time comes, build path:

1. **Phase 1 (doc 601)** ships first — base ZOE-Hermes-brain in `bot/src/zoe/`
2. **Phase 2 — debate mode** — add `bot/src/zoe/debate.ts` that:
   - Takes a question + 3 analyst personas
   - Runs them in parallel (one Claude call each, Sonnet for cost)
   - Feeds reports into 2 researcher personas (Bullish + Bearish)
   - Researchers debate up to `max_debate_rounds: 2`
   - Final synthesizer (Opus for quality) recommends
3. **Phase 3 — decision log** — append to `~/.zao/memory/zoe-decisions.md` after each run
4. **Phase 4 — reflection loop** — after Zaal acts on the recommendation, ZOE asks "did it work?" + writes 1-line reflection to memory + injects into future prompts

## Cost Profile (when implemented)

Per debate run (~5-7 LLM calls):
- 3 analyst personas × Sonnet 4.6 = ~$0.10
- 2 researcher personas × Sonnet 4.6 × 2 rounds = ~$0.15
- 1 synthesizer × Opus 4.7 = ~$0.20
- **Total: ~$0.45 per debate**

Or via Max plan + Claude Code CLI subprocess (Hermes pattern): **$0** marginal cost. Match Hermes' cost discipline.

10 debates per day = $4.50/day on API OR $0/day on Max plan. **Always use Max plan path. Match Hermes Sprint 1 cost routing.**

## Why NOT Implement Trading Agents

Per Zaal explicit direction: **no trading at all for now.** Reasons:

1. **Risk surface** — trading agents need wallet write access. Doc 581 documented bot hallucinations (fake UUIDs). A bot with wallet write that hallucinates a transaction is catastrophic.
2. **Existing trading agents (VAULT/BANKER/DEALER)** — already in `src/lib/agents/` per doc 600. They run within tight parameters. No reason to add LLM-driven trading on top.
3. **Focus** — ZAO is music + creator-economy + community. Trading isn't core mission.
4. **Regulatory** — autonomous trading bots have securities-law implications. Not worth the headache for ZAO's stage.

The pattern is GENERAL — trading is just the demo domain. Social + PM are higher-leverage applications for Zaal.

## Patterns NOT to Steal

| Pattern | Why skip |
|---|---|
| LangGraph dependency | Adds Python LangGraph framework. Our `bot/src/hermes/runner.ts` already orchestrates without it. |
| LangGraph checkpoint SQLite | Hermes runs are short. Crash recovery via re-run is fine. |
| 4 separate analyst types | Over-design for v1. 2-3 max. Add complexity only if recall quality is poor. |
| Multi-provider LLM abstraction | We're committed to Claude (Max plan). Adding OpenAI/Gemini/xAI fallback adds API key management without value. |
| Portfolio Manager 2-stage approval | Zaal IS the final approver. Adding a second LLM layer is theater. |
| Per-stock/ticker checkpointing | Our debate scope is "per-decision," not "per-ticker." Different shape. |

## Comparison to Existing ZAO Patterns

| Pattern | TradingAgents | Existing in ZAO | Net |
|---|---|---|---|
| Two-tier LLM | deep_think + quick_think | Hermes Sprint 1 routing (Sonnet/Opus/Haiku) | ✓ already have it |
| Multi-agent debate | Bull vs Bear researchers, 2 rounds | Doc 599 patterns (RECALL/DRAFT/REVIEW), but no formal debate | NEEDS adoption |
| Persistent decision log | `~/.tradingagents/memory/trading_memory.md` | Bonfire graph holds Decision nodes | Bonfire IS this layer (doc 569 ontology) |
| Reflection loop | Post-run reflection injected into next prompt | Bonfire's outcome attribute (doc 569 + 581 status: shipped/dead/evolved) | Bonfire IS this layer |
| Bounded debate | max_debate_rounds | Doc 599 §"loop limit: max 3 RECALL rounds per task" | ✓ already have the principle |
| LangGraph orchestration | LangGraph | bot/src/hermes/runner.ts (custom TS) | We have simpler equivalent |

**Insight:** ZAO already has half the pattern via Bonfire (memory) + Hermes (runtime). The MISSING piece is the **debate layer** — internal Bull/Bear before recommending. That's what doc 602 says to add.

## Also See

- [Doc 461](../../dev-workflows/461-fix-pr-pipeline-design/) — fix-PR pipeline (Hermes runtime pattern)
- [Doc 529](../529-hermes-quality-pipeline-pre-critic-gates/) — Hermes pre-critic gates
- [Doc 547](../547-multi-agent-coordination-bonfire-zoe-hermes/) — multi-agent coordination
- [Doc 600](../600-agentic-stack-coordination-v1/) — current stack inventory
- [Doc 601](../601-agent-stack-cleanup-decision/) — Hermes-as-ZOE-brain decision (Option D)

## Next Actions

| Action | Owner | Type | When |
|--------|-------|------|------|
| Save this doc as reference for future ZOE debate-mode build | Claude | Doc | Done with this commit |
| Reference in Phase 2 of doc 601 implementation if Zaal wants debate-mode added to ZOE concierge | Claude | Plan | After doc 601 Phase 1 complete |
| Re-read Trading-R1 paper ([arxiv 2509.11420](https://arxiv.org/abs/2509.11420)) when its Terminal repo lands — may have RL-trained debate patterns | Claude | Research | Q3 2026 if ZOE debate mode shipped |
| Don't implement trading agents — VAULT/BANKER/DEALER stays in current scoped form per src/lib/agents/ | n/a | Discipline | Permanent |

## Sources

- [TradingAgents arxiv paper](https://arxiv.org/abs/2412.20138) — verified 2026-05-04, abstract + architecture extracted via WebFetch
- [TradingAgents GitHub](https://github.com/TauricResearch/TradingAgents) — verified 2026-05-04, README inspected via gh api, 66034 stars, Apache 2.0
- [Trading-R1 technical report](https://arxiv.org/abs/2509.11420) — referenced in TradingAgents v0.2.4 changelog, terminal repo expected later
- TradingAgents CHANGELOG.md — v0.2.4 (2026-04) added structured-output agents, v0.2.3 multi-language, v0.2.2 GPT-5.4/Gemini 3.1/Claude 4.6 coverage, v0.2.0 multi-provider support
- Internal: docs 461, 529, 547, 600, 601 — existing ZAO agent patterns this doc maps against

## Citation (if we ever publish on this)

```
@misc{xiao2024tradingagentsmultiagentsllm,
      title={TradingAgents: Multi-Agents LLM Financial Trading Framework},
      author={Yijia Xiao and Edward Sun and Di Luo and Wei Wang},
      year={2024},
      eprint={2412.20138},
      archivePrefix={arXiv},
      primaryClass={q-fin.TR}
}
```
