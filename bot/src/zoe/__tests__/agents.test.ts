import { test } from 'node:test';
import assert from 'node:assert/strict';

import { decayWeight, scopeKey, HALF_LIFE_DAYS } from '../agents/decay.ts';
import { rankAgents, sampleAgent } from '../agents/ranker.ts';
import { runGuards, humanizedDelayMs } from '../agents/guards.ts';
import { DEFAULT_CASTER, type AgentSpec } from '../agents/registry.ts';

// ========================= decay =========================

test('decayWeight halves every 7 days', () => {
  const now = Date.UTC(2026, 0, 8); // 7 days after Jan 1
  const w = decayWeight(new Date(Date.UTC(2026, 0, 1)).toISOString(), now);
  assert.ok(Math.abs(w - 0.5) < 1e-9, `expected ~0.5, got ${w}`);
});

test('decayWeight is 1 for now/future', () => {
  const now = Date.UTC(2026, 0, 1);
  assert.equal(decayWeight(new Date(now).toISOString(), now), 1);
  assert.equal(decayWeight(new Date(now + 1000).toISOString(), now), 1);
});

test('decay half-life constant is 7', () => {
  assert.equal(HALF_LIFE_DAYS, 7);
});

test('scopeKey builds canonical keys', () => {
  assert.equal(scopeKey({ agent: 'caster', topic: 'Music', user: 1325 }), 'agent:caster|topic:music|user:1325');
  assert.equal(scopeKey({ agent: 'caster' }), 'agent:caster');
});

// ========================= ranker =========================

const agentA: AgentSpec = { ...DEFAULT_CASTER, agent_id: 'a', topics: ['music'] };
const agentB: AgentSpec = { ...DEFAULT_CASTER, agent_id: 'b', topics: ['defi'] };

test('rankAgents probabilities sum to ~1', () => {
  const ranked = rankAgents(
    [
      { agent: agentA, secondsSinceLastAction: Infinity, actionsUsed: 0, noise: 0.5 },
      { agent: agentB, secondsSinceLastAction: Infinity, actionsUsed: 0, noise: 0.5 },
    ],
    { triggerText: 'new music drop from the zao' },
  );
  const sum = ranked.reduce((s, r) => s + r.prob, 0);
  assert.ok(Math.abs(sum - 1) < 1e-9, `probs sum ${sum}`);
});

test('rankAgents favors topic match', () => {
  const ranked = rankAgents(
    [
      { agent: agentA, secondsSinceLastAction: Infinity, actionsUsed: 0, noise: 0 },
      { agent: agentB, secondsSinceLastAction: Infinity, actionsUsed: 0, noise: 0 },
    ],
    { triggerText: 'music music music' },
  );
  assert.equal(ranked[0].agent.agent_id, 'a');
});

test('sampleAgent picks deterministically with a fixed sample', () => {
  const ranked = rankAgents(
    [{ agent: agentA, secondsSinceLastAction: Infinity, actionsUsed: 0, noise: 0 }],
    { triggerText: 'music' },
  );
  assert.equal(sampleAgent(ranked, 0.0)?.agent.agent_id, 'a');
  assert.equal(sampleAgent([], 0.5), null);
});

// ========================= guards =========================

test('humanizedDelayMs is within [15s, 90s]', () => {
  assert.equal(humanizedDelayMs(0), 15000);
  assert.equal(humanizedDelayMs(1), 90000);
});

test('runGuards blocks on cooldown before reaching klearu', async () => {
  const res = await runGuards(
    DEFAULT_CASTER,
    'gm builders',
    {
      secondsSinceLastAction: 10, // < 90 cooldown
      actionsUsed: 0,
      threadDepth: 0,
      recentPosts: [],
      nowMs: Date.UTC(2026, 0, 1, 12),
    },
    { jitter: 0 },
  );
  assert.equal(res.pass, false);
  assert.equal(res.blockedBy, 'cooldown');
});

test('runGuards blocks on exhausted budget', async () => {
  const res = await runGuards(
    DEFAULT_CASTER,
    'gm builders',
    {
      secondsSinceLastAction: Infinity,
      actionsUsed: DEFAULT_CASTER.activity_budget,
      threadDepth: 0,
      recentPosts: [],
      nowMs: Date.UTC(2026, 0, 1, 12),
    },
    { jitter: 0 },
  );
  assert.equal(res.pass, false);
  assert.equal(res.blockedBy, 'budget');
});

test('runGuards blocks conversation closers', async () => {
  const res = await runGuards(
    DEFAULT_CASTER,
    'thanks',
    {
      secondsSinceLastAction: Infinity,
      actionsUsed: 0,
      threadDepth: 0,
      recentPosts: [],
      nowMs: Date.UTC(2026, 0, 1, 12),
    },
    { jitter: 0 },
  );
  assert.equal(res.pass, false);
  assert.equal(res.blockedBy, 'conversation_closed');
});
