# 363 -- Darwinian Agent Evolution: Die, Mutate, Respawn, Iterate

> **Status:** Research complete
> **Date:** April 15, 2026
> **Goal:** Design how agents that run out of money die and spawn improved versions -- LLM-guided parameter mutation + natural selection for trading strategies

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Evolution pattern** | USE LLM-Guided Evolution (not raw genetic algorithms). ZOE reads dead agent's event log, Claude analyzes what went wrong, suggests parameter mutations, new agent spawns with mutated config. Same pattern as AutoAgent (doc 253) and OpenAI's Self-Evolving Agents cookbook but applied to trading |
| **Death threshold** | SET at $1 remaining (not $0). Below $1 = can't cover gas on Base. Agent is functionally dead. Trigger evolution cycle |
| **What mutates** | MUTATE 5 things per generation: signal_weights (5 values), min_signal_score (threshold), trade_size_base, max_single_trade_usd, buy_price_ceiling. Keep wallet/contract config fixed. Only behavioral parameters evolve |
| **Mutation method** | USE "Evolution of Thought" (EoT) -- Claude reads event log + previous generations' performance, reflects on WHY each failed, proposes targeted mutations (not random). Each mutation has reasoning attached |
| **One agent at a time** | START with 1 VAULT at a time. Dead → analyze → spawn next. NOT multiple competing VATULTs (too expensive at $25/generation). Competing swarms = Phase 2 after we have more capital |
| **Generation tracking** | STORE in Supabase: `agent_generations` table with generation number, parameters, start/end balance, trades, survival_days, death_reason. ZOE reads full history when spawning next gen |
| **Seed from your wallet** | FUND each generation from your personal wallet ($25). When ZOUNZ treasury is ready, switch to treasury funding via governance proposal |
| **Success = survival** | Agent that survives 14+ days with money left = successful generation. Gets refilled. Parameters become the new baseline for future mutations |

---

## Comparison: Agent Evolution Approaches

| Approach | Intelligence | Cost per Gen | Speed | Code Complexity | ZAO Fit |
|----------|-------------|-------------|-------|----------------|---------|
| **LLM-Guided Evolution (EoT)** | HIGH -- Claude reasons about WHY failures happened | $0.01-0.05 (1 Claude call) | 1 gen per death cycle | LOW -- just a prompt + config write | **BEST** -- leverages what we already have |
| **Genetic Algorithm (random mutation)** | LOW -- random parameter changes, no reasoning | $0 | Fast (many gens needed) | MEDIUM -- crossover + selection code | BAD -- needs 100s of gens to find good params |
| **Reinforcement Learning (PPO/DQN)** | HIGH | $50+ (GPU training) | Very slow (millions of steps) | VERY HIGH -- PyTorch, reward shaping | SKIP -- overkill, wrong stack |
| **Grid Search** | NONE -- brute force | $0 | Slow (test every combo) | LOW | BAD -- doesn't learn from failures |
| **Multi-agent tournament** | HIGH -- competition | $25 * N agents | Fast (parallel) | MEDIUM | Phase 2 -- too expensive for $25 gens |
| **Human-tuned** | HIGH but slow | $0 | Very slow (you tune manually) | NONE | What we do now -- doesn't scale |

---

## The Evolution Loop

```
GENERATION 0 (Baseline):
  VAULT v0 spawns with default parameters
  signal_weights: { price: 0.30, liquidity: 0.25, time: 0.20, balance: 0.15, random: 0.10 }
  min_signal_score: 40
  trade_size_base: 0.50
  max_single_trade_usd: 2.00
  buy_price_ceiling: 0.001
  Funded: $25 from Zaal's wallet
  │
  ▼ (runs for days/weeks)
  │
  VAULT v0 dies (balance < $1)
  │
  ▼
ZOE ANALYSIS PHASE:
  1. Read agent_events for VAULT v0 (all trades, burns, skips)
  2. Read agent_generations for any previous generations
  3. Calculate metrics:
     - survival_days: how long it lasted
     - total_trades: how many trades executed
     - win_rate: % of trades where ZABAL value increased
     - avg_slippage: average price impact per trade
     - skip_rate: % of cron runs that skipped (signals too low)
     - burn_total: total ZABAL burned
     - biggest_loss_trade: worst single trade
  4. Send to Claude with full context:
  │
  ▼
CLAUDE MUTATION PROMPT:
  "You are analyzing a trading agent that died.

  Generation: 0
  Survival: 8 days
  Starting balance: $25.00
  Ending balance: $0.87
  Trades: 12
  Win rate: 42%
  Skip rate: 15%
  Avg trade size: $1.80
  Biggest loss: $3.20 (traded into thin liquidity on day 3)
  
  Parameters:
  signal_weights: { price: 0.30, liquidity: 0.25, time: 0.20, balance: 0.15, random: 0.10 }
  min_signal_score: 40
  trade_size_base: 0.50
  
  Previous generations: none (this is gen 0)
  
  Analyze what went wrong. Then output EXACT new parameters as JSON.
  Rules:
  - Signal weights must sum to 1.0
  - min_signal_score range: 20-80
  - trade_size_base range: 0.10-2.00
  - Explain each mutation"
  │
  ▼
CLAUDE RESPONDS:
  {
    "analysis": "Agent traded too large ($1.80 avg) into thin liquidity. 
     42% win rate means more losses than wins. Skip rate was too low -- 
     agent should have skipped more unfavorable conditions. The $3.20 
     loss on day 3 was from ignoring liquidity signal.",
    "mutations": {
      "signal_weights": { 
        "price": 0.25, 
        "liquidity": 0.40,  // UP from 0.25 -- liquidity killed v0
        "time": 0.15, 
        "balance": 0.10, 
        "random": 0.10 
      },
      "min_signal_score": 55,    // UP from 40 -- skip more bad conditions
      "trade_size_base": 0.25,   // DOWN from 0.50 -- smaller trades
      "max_single_trade_usd": 1.00, // DOWN from 2.00 -- cap losses
      "buy_price_ceiling": 0.001  // unchanged
    },
    "reasoning": {
      "liquidity_weight": "Increased to 0.40 because the biggest loss was from thin liquidity",
      "min_signal_score": "Raised to 55 to skip more marginal opportunities",
      "trade_size": "Halved because $1.80 avg was too aggressive for $25 bankroll"
    }
  }
  │
  ▼
VAULT v1 SPAWNS:
  New Privy wallet (or reuse existing, just reset config)
  New parameters from Claude's mutation
  Funded: $25 from Zaal's wallet
  Generation: 1
  Logged to agent_generations table
  │
  ▼ (repeat)
```

---

## What Mutates vs What's Fixed

| Parameter | Mutates? | Range | Why |
|-----------|----------|-------|-----|
| `signal_weights.price` | YES | 0.05-0.60 | How much price matters in trading decisions |
| `signal_weights.liquidity` | YES | 0.05-0.60 | How much pool depth matters |
| `signal_weights.time` | YES | 0.05-0.40 | How much time-since-last-trade matters |
| `signal_weights.balance` | YES | 0.05-0.30 | How much remaining ETH matters |
| `signal_weights.random` | YES | 0.00-0.20 | How much randomness in decisions |
| `min_signal_score` | YES | 20-80 | Threshold to trade vs skip |
| `trade_size_base` | YES | 0.10-2.00 | Base USD amount per trade |
| `max_single_trade_usd` | YES | 0.50-5.00 | Max cap per trade |
| `buy_price_ceiling` | YES | 0.0000001-0.01 | Max ZABAL price to buy at |
| `wallet_address` | NO | fixed | Same Privy wallet across gens |
| `allowed_contracts` | NO | fixed | Security -- don't change contracts |
| `burn_pct` | NO | 0.01 (1%) | Hardcoded, never changes |
| `trading_enabled` | NO | true/false | Human kill switch |

**Constraint:** Signal weights must sum to 1.0. Claude's mutation must respect this.

---

## Supabase Schema

```sql
CREATE TABLE IF NOT EXISTS agent_generations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_name text NOT NULL,
  generation integer NOT NULL,
  parameters jsonb NOT NULL,
  mutation_reasoning text,
  parent_generation integer,
  start_balance numeric NOT NULL,
  end_balance numeric,
  survival_days integer,
  total_trades integer DEFAULT 0,
  win_rate numeric,
  skip_rate numeric,
  death_reason text,
  status text DEFAULT 'active', -- active, dead, survived
  created_at timestamptz DEFAULT now(),
  died_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_agent_gen_name ON agent_generations(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_gen_status ON agent_generations(status);
```

---

## Implementation: 3 New Files

### 1. `src/lib/agents/evolve.ts`

Core evolution logic:

```typescript
export async function checkAgentHealth(agentName: AgentName): Promise<'alive' | 'dead'> {
  // Check wallet balance via Privy or on-chain
  // If < $1 → return 'dead'
  // Else → return 'alive'
}

export async function evolveAgent(agentName: AgentName): Promise<void> {
  // 1. Mark current generation as dead in agent_generations
  // 2. Gather metrics from agent_events
  // 3. Gather all previous generation data
  // 4. Call Claude API with analysis prompt
  // 5. Parse mutated parameters from Claude response
  // 6. Validate (weights sum to 1.0, ranges respected)
  // 7. Write new generation to agent_generations
  // 8. Update agent_config with new parameters
  // 9. Notify Zaal on Telegram: "VAULT v1 died. Spawning v2 with: ..."
  // 10. Request funding from Zaal's wallet
}
```

### 2. `src/lib/agents/metrics.ts`

Calculate generation metrics from agent_events:

```typescript
export async function getGenerationMetrics(agentName: AgentName, since: string) {
  // Query agent_events since generation start
  // Return: total_trades, win_rate, skip_rate, avg_trade_size, biggest_loss, burn_total
}
```

### 3. Modify `src/lib/agents/vault.ts`

At START of each cron run, check health:

```typescript
const health = await checkAgentHealth('VAULT');
if (health === 'dead') {
  await evolveAgent('VAULT');
  return { action: 'report', status: 'failed', details: 'Agent died, evolution triggered' };
}
```

---

## Prior Art (What We Steal)

| Project | Pattern | What ZAO Steals |
|---------|---------|----------------|
| **AutoAgent (doc 253)** | Meta-agent edits agent.py, benchmarks, keeps/reverts | Same loop but for trading params not code |
| **OpenAI Self-Evolving Cookbook** | VersionedPrompt, metaprompt agent, GEPA optimization | Generation tracking, Claude-as-metaprompt, rollback |
| **MiniMax M2.7** | 100+ autonomous optimization rounds, 30% improvement | Proof that LLM self-improvement works at scale |
| **CGA-Agent (arxiv)** | Genetic algorithm + multi-agent coordination for crypto | Parameter mutation for trading specifically |
| **Hermes Agent** | Reviews completed tasks, distills into reusable skills | ZOE reads dead agent's log, distills into next gen |
| **Karpathy autoresearch** | Modify → verify → keep/discard → repeat | Same loop: mutate params → run agent → survive/die → repeat |
| **CLAWD LarvAI** | Conviction governance with AI personas | Not evolution, but AI-guided decision making for agents |

---

## ZAO Ecosystem Integration

### Codebase Files

| File | Role |
|------|------|
| `src/lib/agents/types.ts` | Add AgentGeneration interface |
| `src/lib/agents/evolve.ts` (new) | Evolution logic: health check, Claude mutation, spawn |
| `src/lib/agents/metrics.ts` (new) | Calculate generation performance metrics |
| `src/lib/agents/vault.ts` | Add health check at cron start |
| `src/lib/agents/config.ts` | Add updateAgentConfig() for parameter writes |
| `scripts/v1-agent-migration.sql` | Add agent_generations table |
| ZOE VPS: SOUL.md | Add evolution awareness |

### Connected Research

| Doc | Connection |
|-----|-----------|
| 253 | AutoAgent meta-agent loop -- same pattern |
| 345 | Master blueprint -- evolution is Phase 5+ |
| 353 | Signal engine -- the parameters that evolve |
| 360 | EARNER hot wallet -- evolution applies here too |

---

## Sources

- [AutoAgent (Kevin Gu)](https://github.com/kevinrgu/autoagent) -- meta-agent self-optimization loop
- [OpenAI Self-Evolving Agents Cookbook](https://developers.openai.com/cookbook/examples/partners/self_evolving_agents/autonomous_agent_retraining) -- VersionedPrompt, GEPA, metaprompt agents
- [Self-Evolving Agents Survey (CharlesQ9)](https://github.com/CharlesQ9/Self-Evolving-Agents) -- 100+ papers on agent self-improvement
- [LLM-Guided Evolution (GECCO)](https://arxiv.org/html/2403.11446v1) -- "Evolution of Thought" technique
- [CGA-Agent Crypto Trading](https://arxiv.org/html/2510.07943v1) -- genetic algorithm + multi-agent for crypto
- [Hermes Agent (Nous Research)](https://www.botlearn.ai/news/news-analysis-how-hermes-agent-is-redefining-ai-autonomy-in-2026) -- self-improving task skills
- [MiniMax M2.7 Self-Training](https://news.800.works/news/2026-03-18/minimax-m27-self-evolving-ai/) -- 100+ autonomous optimization rounds
- [Doc 253 - AutoAgent](../253-autoagent-self-optimizing-agents/)
- [Doc 353 - Signal Engine](../353-autonomous-trading-beyond-schedules/)
