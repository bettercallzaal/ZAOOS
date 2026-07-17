// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { rankAgents, sampleAgent } from '../ranker';
import type { AgentSpec } from '../registry';
import type { RankInput, RankContext } from '../ranker';

function makeAgent(overrides: Partial<AgentSpec> = {}): AgentSpec {
  return {
    agent_id: 'test',
    persona_prompt: 'Test.',
    topics: ['music'],
    activity_budget: 10,
    cooldown_seconds: 90,
    thread_max_depth: 3,
    priority_weight: 1,
    schedule: { active_hours_utc: [0, 0] },
    persona: { tone: 'warm', domain: 'music', risk: 0.3, social: 0.5, engagement: 0.5 },
    ...overrides,
  };
}

function makeInput(agent: AgentSpec, overrides: Partial<Omit<RankInput, 'agent'>> = {}): RankInput {
  return {
    agent,
    secondsSinceLastAction: Infinity, // fresh / never acted
    actionsUsed: 0,
    noise: 0.5,
    ...overrides,
  };
}

const CTX: RankContext = { triggerText: 'zao music drop tonight' };

// ── rankAgents ────────────────────────────────────────────────────────────────

describe('rankAgents', () => {
  it('returns empty array for empty inputs', () => {
    expect(rankAgents([], CTX)).toEqual([]);
  });

  it('single agent gets prob ≈ 1.0', () => {
    const ranked = rankAgents([makeInput(makeAgent())], CTX);
    expect(ranked).toHaveLength(1);
    expect(ranked[0].prob).toBeCloseTo(1.0);
  });

  it('includes all factor fields on each entry', () => {
    const ranked = rankAgents([makeInput(makeAgent())], CTX);
    const { factors } = ranked[0];
    expect(factors).toMatchObject({
      topic: expect.any(Number),
      semantic: expect.any(Number),
      recency: expect.any(Number),
      budget: expect.any(Number),
      noise: expect.any(Number),
    });
  });

  it('returns results sorted by prob descending', () => {
    const agentA = makeAgent({ agent_id: 'a', topics: ['music'] });
    const agentB = makeAgent({ agent_id: 'b', topics: ['cooking'] }); // irrelevant topics
    const ranked = rankAgents([makeInput(agentA), makeInput(agentB)], CTX);
    expect(ranked[0].prob).toBeGreaterThanOrEqual(ranked[1].prob);
    expect(ranked[0].agent.agent_id).toBe('a');
  });

  it('probabilities sum to 1', () => {
    const inputs = [
      makeInput(makeAgent({ agent_id: 'a', topics: ['music'] })),
      makeInput(makeAgent({ agent_id: 'b', topics: ['tech'] })),
      makeInput(makeAgent({ agent_id: 'c', topics: ['art'] })),
    ];
    const ranked = rankAgents(inputs, CTX);
    const total = ranked.reduce((s, r) => s + r.prob, 0);
    expect(total).toBeCloseTo(1.0);
  });

  it('topic-matching agent outranks non-matching agent', () => {
    const withTopic = makeAgent({ agent_id: 'music-agent', topics: ['music'] });
    const noTopic = makeAgent({ agent_id: 'other-agent', topics: ['cooking', 'baking'] });
    const ranked = rankAgents(
      [makeInput(noTopic, { noise: 0 }), makeInput(withTopic, { noise: 0 })],
      { triggerText: 'music release' },
    );
    expect(ranked[0].agent.agent_id).toBe('music-agent');
  });

  it('recently-active agent has lower recency score', () => {
    const fresh = makeAgent({ agent_id: 'fresh', cooldown_seconds: 90 });
    const cooled = makeAgent({ agent_id: 'cooled', cooldown_seconds: 90 });
    const ranked = rankAgents(
      [
        makeInput(fresh, { secondsSinceLastAction: 5, noise: 0 }),
        makeInput(cooled, { secondsSinceLastAction: Infinity, noise: 0 }),
      ],
      CTX,
    );
    expect(ranked[0].agent.agent_id).toBe('cooled');
    expect(ranked[0].factors.recency).toBeGreaterThan(ranked[1].factors.recency);
  });

  it('budget-exhausted agent has lower budget score', () => {
    const full = makeAgent({ agent_id: 'full', activity_budget: 10 });
    const empty = makeAgent({ agent_id: 'empty', activity_budget: 10 });
    const ranked = rankAgents(
      [
        makeInput(empty, { actionsUsed: 10, noise: 0 }),
        makeInput(full, { actionsUsed: 0, noise: 0 }),
      ],
      CTX,
    );
    expect(ranked[0].agent.agent_id).toBe('full');
    expect(ranked[0].factors.budget).toBeGreaterThan(ranked[1].factors.budget);
  });

  it('higher priority_weight increases logit proportionally', () => {
    const hi = makeAgent({ agent_id: 'hi', priority_weight: 3 });
    const lo = makeAgent({ agent_id: 'lo', priority_weight: 1 });
    const ranked = rankAgents(
      [makeInput(lo, { noise: 0 }), makeInput(hi, { noise: 0 })],
      CTX,
    );
    expect(ranked[0].agent.agent_id).toBe('hi');
    expect(ranked[0].logit).toBeGreaterThan(ranked[1].logit);
  });

  it('uses injected semanticSim fn instead of token-overlap fallback', () => {
    const a = makeAgent({ agent_id: 'a', topics: [] });
    const b = makeAgent({ agent_id: 'b', topics: [] });
    const ctx: RankContext = {
      triggerText: 'anything',
      semanticSim: (agent) => (agent.agent_id === 'a' ? 0.9 : 0.1),
    };
    const ranked = rankAgents([makeInput(a, { noise: 0 }), makeInput(b, { noise: 0 })], ctx);
    expect(ranked[0].agent.agent_id).toBe('a');
  });
});

// ── sampleAgent ───────────────────────────────────────────────────────────────

describe('sampleAgent', () => {
  it('returns null for empty ranked list', () => {
    expect(sampleAgent([], 0.5)).toBeNull();
  });

  it('returns the single agent regardless of sample', () => {
    const ranked = rankAgents([makeInput(makeAgent())], CTX);
    expect(sampleAgent(ranked, 0)).toBe(ranked[0]);
    expect(sampleAgent(ranked, 0.99)).toBe(ranked[0]);
  });

  it('sample near 0 picks the highest-prob agent', () => {
    const a = makeAgent({ agent_id: 'top', topics: ['music'] });
    const b = makeAgent({ agent_id: 'bot', topics: ['cooking'] });
    const ranked = rankAgents([makeInput(a, { noise: 0 }), makeInput(b, { noise: 0 })], CTX);
    // sample=0.001 should land in the first bucket (highest prob)
    const picked = sampleAgent(ranked, 0.001);
    expect(picked?.agent.agent_id).toBe('top');
  });

  it('sample near 1 falls back to last element', () => {
    const a = makeAgent({ agent_id: 'a', topics: ['music'] });
    const b = makeAgent({ agent_id: 'b', topics: ['cooking'] });
    const ranked = rankAgents([makeInput(a, { noise: 0 }), makeInput(b, { noise: 0 })], CTX);
    // sample=0.9999 should exceed cumulative prob of top, landing in the tail
    const picked = sampleAgent(ranked, 0.9999);
    expect(picked).not.toBeNull();
  });

  it('is deterministic for the same input', () => {
    const inputs = [
      makeInput(makeAgent({ agent_id: 'x', topics: ['music'] }), { noise: 0.3 }),
      makeInput(makeAgent({ agent_id: 'y', topics: ['art'] }), { noise: 0.7 }),
    ];
    const ranked = rankAgents(inputs, CTX);
    expect(sampleAgent(ranked, 0.4)).toBe(sampleAgent(ranked, 0.4));
  });
});
