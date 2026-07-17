// @vitest-environment node
// Pure-function tests for zoe/agents/decay.ts.
// All functions accept nowMs as a parameter so there is no Date.now() dependency.
import { describe, expect, it } from 'vitest';

import { decayWeight, gcDecayed, relevantMemories, scopeKey } from '../decay';

const DAY_MS = 1000 * 60 * 60 * 24;
const NOW_MS = 1_700_000_000_000; // arbitrary fixed epoch

// ── decayWeight ─────────────────────────────────────────────────────────────

describe('decayWeight', () => {
  it('returns 1 for a zero-age memory (created_at === now)', () => {
    const ts = new Date(NOW_MS).toISOString();
    expect(decayWeight(ts, NOW_MS)).toBe(1);
  });

  it('returns 1 for a future timestamp (ageMs ≤ 0 guard)', () => {
    const future = new Date(NOW_MS + DAY_MS).toISOString();
    expect(decayWeight(future, NOW_MS)).toBe(1);
  });

  it('returns 0.5 at exactly one half-life (7 days)', () => {
    const oneHalfLife = new Date(NOW_MS - 7 * DAY_MS).toISOString();
    expect(decayWeight(oneHalfLife, NOW_MS)).toBeCloseTo(0.5, 10);
  });

  it('returns 0.25 at two half-lives (14 days)', () => {
    const twoHalfLives = new Date(NOW_MS - 14 * DAY_MS).toISOString();
    expect(decayWeight(twoHalfLives, NOW_MS)).toBeCloseTo(0.25, 10);
  });

  it('returns a value in (0, 1) for a 1-day-old memory', () => {
    const ts = new Date(NOW_MS - DAY_MS).toISOString();
    const w = decayWeight(ts, NOW_MS);
    expect(w).toBeGreaterThan(0);
    expect(w).toBeLessThan(1);
  });

  it('monotonically decreases as age increases', () => {
    const w1day = decayWeight(new Date(NOW_MS - 1 * DAY_MS).toISOString(), NOW_MS);
    const w7day = decayWeight(new Date(NOW_MS - 7 * DAY_MS).toISOString(), NOW_MS);
    const w30day = decayWeight(new Date(NOW_MS - 30 * DAY_MS).toISOString(), NOW_MS);
    expect(w1day).toBeGreaterThan(w7day);
    expect(w7day).toBeGreaterThan(w30day);
  });
});

// ── scopeKey ─────────────────────────────────────────────────────────────────

describe('scopeKey', () => {
  it('returns empty string when no parts are provided', () => {
    expect(scopeKey({})).toBe('');
  });

  it('builds agent-only key', () => {
    expect(scopeKey({ agent: 'caster' })).toBe('agent:caster');
  });

  it('builds topic-only key (lowercased)', () => {
    expect(scopeKey({ topic: 'Music' })).toBe('topic:music');
  });

  it('builds user-only key (string)', () => {
    expect(scopeKey({ user: '1325' })).toBe('user:1325');
  });

  it('builds user-only key (number)', () => {
    expect(scopeKey({ user: 42 })).toBe('user:42');
  });

  it('builds full compound key in agent|topic|user order', () => {
    expect(scopeKey({ agent: 'caster', topic: 'MUSIC', user: 1325 })).toBe(
      'agent:caster|topic:music|user:1325',
    );
  });

  it('omits absent segments', () => {
    expect(scopeKey({ agent: 'caster', user: 99 })).toBe('agent:caster|user:99');
  });
});

// ── relevantMemories ─────────────────────────────────────────────────────────

describe('relevantMemories', () => {
  function makeMemory(scope: string, ageDays: number, payload = 'x') {
    return {
      scope,
      created_at: new Date(NOW_MS - ageDays * DAY_MS).toISOString(),
      payload,
    };
  }

  it('returns empty array when no memories match the scope', () => {
    const mems = [makeMemory('agent:other', 1)];
    expect(relevantMemories(mems, 'agent:caster', NOW_MS)).toHaveLength(0);
  });

  it('includes exact scope matches', () => {
    const mems = [makeMemory('agent:caster', 1)];
    const result = relevantMemories(mems, 'agent:caster', NOW_MS);
    expect(result).toHaveLength(1);
  });

  it('includes memories whose scope is a prefix of the query scope', () => {
    const mems = [makeMemory('agent:caster', 1)];
    // 'agent:caster|topic:music'.startsWith('agent:caster') → included
    const result = relevantMemories(mems, 'agent:caster|topic:music', NOW_MS);
    expect(result).toHaveLength(1);
  });

  it('drops memories below the floor weight', () => {
    // 32-day-old memory: weight ≈ 0.045 < default floor 0.05
    const mems = [makeMemory('agent:caster', 32)];
    expect(relevantMemories(mems, 'agent:caster', NOW_MS)).toHaveLength(0);
  });

  it('returns memories sorted by weight descending', () => {
    const mems = [
      makeMemory('agent:caster', 14), // older → lower weight
      makeMemory('agent:caster', 1),  // newer → higher weight
    ];
    const result = relevantMemories(mems, 'agent:caster', NOW_MS);
    expect(result[0].weight).toBeGreaterThan(result[1].weight);
  });

  it('attaches the correct decayed weight to each entry', () => {
    const mems = [makeMemory('agent:caster', 7)]; // exactly one half-life
    const result = relevantMemories(mems, 'agent:caster', NOW_MS);
    expect(result[0].weight).toBeCloseTo(0.5, 5);
  });
});

// ── gcDecayed ────────────────────────────────────────────────────────────────

describe('gcDecayed', () => {
  function makeMemory(ageDays: number) {
    return {
      scope: 'agent:caster',
      created_at: new Date(NOW_MS - ageDays * DAY_MS).toISOString(),
      payload: 'x',
    };
  }

  it('keeps memories above the floor', () => {
    const fresh = makeMemory(1);
    expect(gcDecayed([fresh], NOW_MS)).toHaveLength(1);
  });

  it('removes memories below the floor', () => {
    const old = makeMemory(32); // weight ≈ 0.045 < 0.05
    expect(gcDecayed([old], NOW_MS)).toHaveLength(0);
  });

  it('mixed: returns only survivors', () => {
    const fresh = makeMemory(1);
    const old = makeMemory(32);
    const result = gcDecayed([fresh, old], NOW_MS);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(fresh);
  });
});
