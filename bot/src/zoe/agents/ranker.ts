/**
 * Softmax action ranker (doc 761 Phase 3, design from doc 318).
 *
 * Sits between context-assembly and the reasoning/draft step. Given a trigger and the set of
 * candidate (agent x action) pairs, it scores each over 5 factors and softmax-samples one (or
 * ranks them). Probabilistic, not deterministic - this is the "single-agent/deterministic ->
 * multi-agent/probabilistic" shift the build prompt calls out.
 *
 * 5 factors (weighted sum -> logit):
 *   1. topic match      - does the trigger hit the agent's topics?
 *   2. semantic relevance - similarity of trigger to agent domain (injectable; token-overlap fallback)
 *   3. recency          - how recently did this agent last act (decays appetite)
 *   4. budget remaining  - fraction of activity_budget left
 *   5. random noise     - exploration jitter
 */
import type { AgentSpec } from './registry';

export interface RankInput {
  agent: AgentSpec;
  /** seconds since this agent last acted (Infinity if never) */
  secondsSinceLastAction: number;
  /** actions already taken this budget window */
  actionsUsed: number;
  /** noise sample in [0,1) - pass deterministic value for tests, else Math.random() */
  noise: number;
}

export interface RankContext {
  /** lowercased trigger text */
  triggerText: string;
  /**
   * Optional semantic similarity fn (e.g. cosine over embeddings). If absent, a token-overlap
   * heuristic is used so the ranker works with zero extra deps. Returns 0..1.
   */
  semanticSim?: (agent: AgentSpec, triggerText: string) => number;
}

export interface RankedAgent {
  agent: AgentSpec;
  logit: number;
  prob: number;
  factors: { topic: number; semantic: number; recency: number; budget: number; noise: number };
}

/** Default factor weights. Tunable; sum is not required to be 1. */
const W = { topic: 2.0, semantic: 1.5, recency: 1.0, budget: 1.0, noise: 0.5 };

function topicMatch(agent: AgentSpec, triggerText: string): number {
  if (agent.topics.length === 0) return 0;
  const hits = agent.topics.filter((t) => triggerText.includes(t.toLowerCase())).length;
  return Math.min(1, hits / Math.min(agent.topics.length, 2));
}

/** Token-overlap fallback when no embedding fn is supplied. */
function tokenOverlap(agent: AgentSpec, triggerText: string): number {
  const bag = new Set(
    `${agent.topics.join(' ')} ${agent.persona.domain}`.toLowerCase().split(/\W+/).filter(Boolean),
  );
  const toks = triggerText.split(/\W+/).filter(Boolean);
  if (toks.length === 0 || bag.size === 0) return 0;
  const hit = toks.filter((t) => bag.has(t)).length;
  return Math.min(1, hit / toks.length);
}

/** Recency appetite: 0 right after acting, ->1 as we pass the cooldown. */
function recencyScore(agent: AgentSpec, secondsSince: number): number {
  if (!isFinite(secondsSince)) return 1;
  return Math.min(1, secondsSince / Math.max(agent.cooldown_seconds, 1));
}

function budgetScore(agent: AgentSpec, used: number): number {
  if (agent.activity_budget <= 0) return 0;
  return Math.max(0, 1 - used / agent.activity_budget);
}

function logitFor(input: RankInput, ctx: RankContext): RankedAgent['factors'] & { logit: number } {
  const { agent } = input;
  const topic = topicMatch(agent, ctx.triggerText);
  const semantic = ctx.semanticSim ? ctx.semanticSim(agent, ctx.triggerText) : tokenOverlap(agent, ctx.triggerText);
  const recency = recencyScore(agent, input.secondsSinceLastAction);
  const budget = budgetScore(agent, input.actionsUsed);
  const noise = input.noise;
  const logit =
    agent.priority_weight *
    (W.topic * topic + W.semantic * semantic + W.recency * recency + W.budget * budget + W.noise * noise);
  return { topic, semantic, recency, budget, noise, logit };
}

/** Rank all candidate agents for a trigger. Returns them sorted by probability desc. */
export function rankAgents(inputs: RankInput[], ctx: RankContext): RankedAgent[] {
  const scored = inputs.map((i) => {
    const f = logitFor(i, ctx);
    return { agent: i.agent, logit: f.logit, factors: { ...f } as RankedAgent['factors'] };
  });
  // Softmax over logits.
  const maxLogit = Math.max(...scored.map((s) => s.logit), 0);
  const exps = scored.map((s) => Math.exp(s.logit - maxLogit));
  const sum = exps.reduce((a, b) => a + b, 0) || 1;
  return scored
    .map((s, idx) => ({ ...s, prob: exps[idx] / sum }))
    .sort((a, b) => b.prob - a.prob);
}

/**
 * Softmax-SAMPLE one agent (probabilistic pick), using a uniform sample in [0,1).
 * Pass a deterministic sample for tests. Returns null if no agents.
 */
export function sampleAgent(ranked: RankedAgent[], uniformSample: number): RankedAgent | null {
  if (ranked.length === 0) return null;
  let acc = 0;
  for (const r of ranked) {
    acc += r.prob;
    if (uniformSample < acc) return r;
  }
  return ranked[ranked.length - 1];
}
