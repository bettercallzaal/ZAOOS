// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockCheckText = vi.hoisted(() => vi.fn());
vi.mock('../../safety/klearu', () => ({ checkText: mockCheckText }));

import { humanizedDelayMs, runGuards } from '../guards';
import type { GuardState } from '../guards';
import type { AgentSpec } from '../registry';

afterEach(() => vi.clearAllMocks());

const SAFE_VERDICT = { safe: true, label: 'safe', score: 0.95, reason: 'klearu-json', raw: '{}' };
const UNSAFE_VERDICT = { safe: false, label: 'unsafe', score: 0.05, reason: 'klearu-json', raw: '{}' };

// 14:00 UTC — within any reasonable daytime schedule
const NOW_MS = new Date('2026-07-17T14:00:00Z').getTime();

function makeAgent(overrides: Partial<AgentSpec> = {}): AgentSpec {
  return {
    agent_id: 'test-agent',
    persona_prompt: 'Test.',
    topics: ['music', 'zao'],
    activity_budget: 10,
    cooldown_seconds: 90,
    thread_max_depth: 3,
    priority_weight: 1,
    schedule: { active_hours_utc: [0, 0] }, // always alive (start === end)
    persona: { tone: 'warm', domain: 'community', risk: 0.3, social: 0.5, engagement: 0.5 },
    ...overrides,
  };
}

function makeState(overrides: Partial<GuardState> = {}): GuardState {
  return {
    secondsSinceLastAction: 300,
    actionsUsed: 0,
    threadDepth: 0,
    recentPosts: [],
    nowMs: NOW_MS,
    ...overrides,
  };
}

const AGENT = makeAgent();
const OPTS = { jitter: 0.5 };

// ── humanizedDelayMs (pure) ────────────────────────────────────────────────────

describe('humanizedDelayMs', () => {
  it('returns 15 000 ms at jitter=0', () => {
    expect(humanizedDelayMs(0)).toBe(15_000);
  });

  it('returns 90 000 ms at jitter=1', () => {
    expect(humanizedDelayMs(1)).toBe(90_000);
  });

  it('interpolates linearly at jitter=0.5', () => {
    expect(humanizedDelayMs(0.5)).toBe(Math.round((15 + 0.5 * 75) * 1000));
  });
});

// ── runGuards (schedule guard) ────────────────────────────────────────────────

describe('runGuards — schedule', () => {
  beforeEach(() => mockCheckText.mockResolvedValue(SAFE_VERDICT));

  it('blocks when agent is outside its active hours', async () => {
    // active 10–18 UTC; nowMs is at 14 UTC which is IN range (so not blocked by schedule)
    const agent = makeAgent({ schedule: { active_hours_utc: [20, 22] } }); // 20–22 UTC
    const result = await runGuards(agent, 'hello world', makeState(), OPTS);
    expect(result.pass).toBe(false);
    expect(result.blockedBy).toBe('schedule');
  });

  it('passes when schedule has start===end (always alive)', async () => {
    const agent = makeAgent({ schedule: { active_hours_utc: [0, 0] } });
    const result = await runGuards(agent, 'hello', makeState(), OPTS);
    expect(result.pass).toBe(true);
  });

  it('handles wrap-around hours correctly (active 22–6 UTC, nowMs 23:00)', async () => {
    const nowAt23 = new Date('2026-07-17T23:00:00Z').getTime();
    const agent = makeAgent({ schedule: { active_hours_utc: [22, 6] } });
    const result = await runGuards(agent, 'hello', makeState({ nowMs: nowAt23 }), OPTS);
    expect(result.pass).toBe(true);
  });

  it('blocks when active_days excludes the current day', async () => {
    // 2026-07-17 is a Friday (day 5). Restrict to Mon–Thu only.
    const agent = makeAgent({ schedule: { active_hours_utc: [0, 0], active_days: [1, 2, 3, 4] } });
    const result = await runGuards(agent, 'hello', makeState(), OPTS);
    expect(result.pass).toBe(false);
    expect(result.blockedBy).toBe('schedule');
  });
});

// ── runGuards (cooldown) ──────────────────────────────────────────────────────

describe('runGuards — cooldown', () => {
  beforeEach(() => mockCheckText.mockResolvedValue(SAFE_VERDICT));

  it('blocks when secondsSinceLastAction < cooldown_seconds', async () => {
    const result = await runGuards(AGENT, 'hello', makeState({ secondsSinceLastAction: 50 }), OPTS);
    expect(result.pass).toBe(false);
    expect(result.blockedBy).toBe('cooldown');
    expect(result.detail).toContain('50s');
  });

  it('passes when secondsSinceLastAction >= cooldown_seconds', async () => {
    const result = await runGuards(AGENT, 'hello', makeState({ secondsSinceLastAction: 91 }), OPTS);
    expect(result.pass).toBe(true);
  });
});

// ── runGuards (budget) ────────────────────────────────────────────────────────

describe('runGuards — budget', () => {
  beforeEach(() => mockCheckText.mockResolvedValue(SAFE_VERDICT));

  it('blocks when activity_budget is exhausted', async () => {
    const result = await runGuards(AGENT, 'hello', makeState({ actionsUsed: 10 }), OPTS);
    expect(result.pass).toBe(false);
    expect(result.blockedBy).toBe('budget');
  });

  it('passes when actionsUsed is below budget', async () => {
    const result = await runGuards(AGENT, 'hello', makeState({ actionsUsed: 9 }), OPTS);
    expect(result.pass).toBe(true);
  });
});

// ── runGuards (thread depth) ──────────────────────────────────────────────────

describe('runGuards — thread depth', () => {
  beforeEach(() => mockCheckText.mockResolvedValue(SAFE_VERDICT));

  it('blocks when threadDepth exceeds thread_max_depth', async () => {
    const result = await runGuards(AGENT, 'hello', makeState({ threadDepth: 4 }), OPTS);
    expect(result.pass).toBe(false);
    expect(result.blockedBy).toBe('thread_depth');
  });

  it('passes at exactly thread_max_depth', async () => {
    const result = await runGuards(AGENT, 'hello', makeState({ threadDepth: 3 }), OPTS);
    expect(result.pass).toBe(true);
  });
});

// ── runGuards (dedup) ─────────────────────────────────────────────────────────

describe('runGuards — semantic dedup', () => {
  beforeEach(() => mockCheckText.mockResolvedValue(SAFE_VERDICT));

  it('blocks when trigger overlaps heavily with a recent post', async () => {
    const state = makeState({ recentPosts: ['music zao community launch'] });
    const result = await runGuards(AGENT, 'music zao community launch', state, OPTS);
    expect(result.pass).toBe(false);
    expect(result.blockedBy).toBe('dedup');
  });

  it('passes when overlap is below default threshold (0.8)', async () => {
    const state = makeState({ recentPosts: ['completely different topic about dogs'] });
    const result = await runGuards(AGENT, 'music zao new drop today', state, OPTS);
    expect(result.pass).toBe(true);
  });

  it('respects custom dedupThreshold', async () => {
    const state = makeState({ recentPosts: ['music zao drop'] });
    // triggerText shares ~2/3 tokens — below 0.8 default but above 0.5
    const result = await runGuards(AGENT, 'music zao something else', state, { jitter: 0.5, dedupThreshold: 0.5 });
    expect(result.pass).toBe(false);
    expect(result.blockedBy).toBe('dedup');
  });
});

// ── runGuards (conversation closer) ──────────────────────────────────────────

describe('runGuards — conversation closer', () => {
  beforeEach(() => mockCheckText.mockResolvedValue(SAFE_VERDICT));

  it.each(['thanks', 'thank you', 'ty', 'bye', 'gg', 'gn', 'cya'])(
    'blocks exact closer "%s"',
    async (closer) => {
      const result = await runGuards(AGENT, closer, makeState(), OPTS);
      expect(result.pass).toBe(false);
      expect(result.blockedBy).toBe('conversation_closed');
    },
  );

  it('blocks a trigger that ends with a conversation closer', async () => {
    const result = await runGuards(AGENT, 'great session gn', makeState(), OPTS);
    expect(result.pass).toBe(false);
    expect(result.blockedBy).toBe('conversation_closed');
  });

  it('blocks a trigger that starts with a conversation closer', async () => {
    const result = await runGuards(AGENT, 'bye everyone have a great day', makeState(), OPTS);
    expect(result.pass).toBe(false);
    expect(result.blockedBy).toBe('conversation_closed');
  });

  it('does NOT block a trigger that merely contains a closer in the middle', async () => {
    // "thanks" in the middle of a longer sentence — not a start/end match
    const result = await runGuards(AGENT, 'many thanks to the whole zao community', makeState(), OPTS);
    // 'many thanks to the whole...' does not start/end with a closer → passes this guard
    expect(result.blockedBy).not.toBe('conversation_closed');
  });
});

// ── runGuards (klearu safety) ─────────────────────────────────────────────────

describe('runGuards — klearu safety', () => {
  it('blocks when klearu returns unsafe', async () => {
    mockCheckText.mockResolvedValue(UNSAFE_VERDICT);
    const result = await runGuards(AGENT, 'normal text', makeState(), OPTS);
    expect(result.pass).toBe(false);
    expect(result.blockedBy).toBe('klearu');
    expect(result.safety).toMatchObject({ safe: false, label: 'unsafe' });
  });

  it('passes all guards and returns safety verdict when klearu is safe', async () => {
    mockCheckText.mockResolvedValue(SAFE_VERDICT);
    const result = await runGuards(AGENT, 'zao music drop tonight', makeState(), OPTS);
    expect(result.pass).toBe(true);
    expect(result.blockedBy).toBeNull();
    expect(result.detail).toBe('all guards passed');
    expect(result.safety).toMatchObject({ safe: true });
  });

  it('includes a non-zero delayMs even on pass', async () => {
    mockCheckText.mockResolvedValue(SAFE_VERDICT);
    const result = await runGuards(AGENT, 'hello', makeState(), { jitter: 0.5 });
    expect(result.delayMs).toBeGreaterThanOrEqual(15_000);
    expect(result.delayMs).toBeLessThanOrEqual(90_000);
  });
});
