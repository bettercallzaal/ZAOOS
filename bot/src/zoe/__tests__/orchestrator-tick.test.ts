import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { detectNewAnswers, decideNextQuestion, runOrchestratorTick } from '../orchestrator-tick';

// Override ZOE_HOME for testing
const testHome = join(tmpdir(), `zoe-test-${Date.now()}`);
const testRecentDir = join(testHome, 'recent');

// Mock env
beforeEach(() => {
  process.env.ZOE_HOME = testHome;
  process.env.ZOE_ORCHESTRATOR_ENABLED = 'false'; // disabled by default in tests
  process.env.ZOE_ORCHESTRATOR_DAILY = '20';
});

afterEach(async () => {
  // Clean up
  try {
    await fs.rm(testHome, { recursive: true, force: true });
  } catch {
    // ignore
  }
});

describe('detectNewAnswers', () => {
  it('returns empty array if recent file does not exist', async () => {
    const ans = await detectNewAnswers('2026-01-01T00:00:00Z', 12345);
    expect(ans).toEqual([]);
  });

  it('filters by lastSeenTs (only ts > lastSeenTs)', async () => {
    // Create mock recent/<groupid>.json
    await fs.mkdir(testRecentDir, { recursive: true });
    const recentPath = join(testRecentDir, '12345.json');

    const turns = [
      { from: 'zaal', text: '[answer:q1] yes', ts: '2026-01-01T00:00:00Z', sender: 'zaalbotz-btn' },
      { from: 'zaal', text: '[answer:q2] no', ts: '2026-01-02T00:00:00Z', sender: 'zaalbotz-btn' },
      { from: 'zaal', text: '[answer:q3] maybe', ts: '2026-01-03T00:00:00Z', sender: 'zaalbotz-btn' },
    ];
    await fs.writeFile(recentPath, JSON.stringify(turns));

    // Restore ZOE_PATHS to use testHome
    vi.resetModules();

    const ans = await detectNewAnswers('2026-01-01T12:00:00Z', 12345);
    expect(ans.length).toBe(2);
    expect(ans[0].qid).toBe('q2');
    expect(ans[1].qid).toBe('q3');
  });

  it('excludes system senders (zsk*, zvl*)', async () => {
    await fs.mkdir(testRecentDir, { recursive: true });
    const recentPath = join(testRecentDir, '12345.json');

    const turns = [
      { from: 'zaal', text: '[answer:q1] yes', ts: '2026-01-02T00:00:00Z', sender: 'zaalbotz-btn' },
      { from: 'zaal', text: '[answer:q2] no', ts: '2026-01-02T00:00:00Z', sender: 'zsk-worker-1' },
      { from: 'zaal', text: '[answer:q3] maybe', ts: '2026-01-02T00:00:00Z', sender: 'zvl-critic' },
    ];
    await fs.writeFile(recentPath, JSON.stringify(turns));

    const ans = await detectNewAnswers('2026-01-01T00:00:00Z', 12345);
    expect(ans.length).toBe(1);
    expect(ans[0].qid).toBe('q1');
  });

  it('only returns [answer:*] lines', async () => {
    await fs.mkdir(testRecentDir, { recursive: true });
    const recentPath = join(testRecentDir, '12345.json');

    const turns = [
      { from: 'zaal', text: 'random message', ts: '2026-01-02T00:00:00Z', sender: 'zaalbotz-btn' },
      { from: 'zaal', text: '[answer:q1] yes', ts: '2026-01-02T00:00:00Z', sender: 'zaalbotz-btn' },
      { from: 'zaal', text: '[not-answer:q2]', ts: '2026-01-02T00:00:00Z', sender: 'zaalbotz-btn' },
    ];
    await fs.writeFile(recentPath, JSON.stringify(turns));

    const ans = await detectNewAnswers('2026-01-01T00:00:00Z', 12345);
    expect(ans.length).toBe(1);
    expect(ans[0].qid).toBe('q1');
    expect(ans[0].value).toBe('yes');
  });
});

describe('decideNextQuestion', () => {
  it('returns next question for a known rule', () => {
    const next = decideNextQuestion('q-priority-what', 'Research');
    expect(next).not.toBeNull();
    expect(next?.qid).toBe('q-priority-research-depth');
    expect(next?.options).toEqual(['Quick overview', 'Deep dive', 'Full audit']);
  });

  it('returns null for unknown rule', () => {
    const next = decideNextQuestion('q-unknown', 'unknown-value');
    expect(next).toBeNull();
  });

  it('returns null if fromQid matches but value does not', () => {
    const next = decideNextQuestion('q-priority-what', 'Unknown');
    expect(next).toBeNull();
  });

  it('handles multiple rules per fromQid', () => {
    const n1 = decideNextQuestion('q-priority-what', 'Research');
    const n2 = decideNextQuestion('q-priority-what', 'Code');
    const n3 = decideNextQuestion('q-priority-what', 'Meetings');

    expect(n1?.qid).toBe('q-priority-research-depth');
    expect(n2?.qid).toBe('q-priority-code-type');
    expect(n3?.qid).toBe('q-priority-meetings-focus');
  });
});

describe('runOrchestratorTick', () => {
  it('is a no-op when ZOE_ORCHESTRATOR_ENABLED !== "true"', async () => {
    process.env.ZOE_ORCHESTRATOR_ENABLED = 'false';

    const mockBot = {
      api: {
        sendMessage: vi.fn(),
      },
    };

    await runOrchestratorTick({
      bot: mockBot as any,
      groupId: 12345,
      zaalTgId: 9876,
      now: new Date(),
    });

    expect(mockBot.api.sendMessage).not.toHaveBeenCalled();
  });

  it('acquires lock and checks daily cap', async () => {
    process.env.ZOE_ORCHESTRATOR_ENABLED = 'true';
    process.env.ZOE_ORCHESTRATOR_DAILY = '2';

    // Create counter file to simulate already-posted today
    await fs.mkdir(testHome, { recursive: true });
    const counterPath = join(testHome, 'orchestrator-count.json');
    const dateStr = new Date().toISOString().slice(0, 10);
    await fs.writeFile(counterPath, JSON.stringify({ date: dateStr, n: 2 }));

    const mockBot = {
      api: {
        sendMessage: vi.fn(),
      },
    };

    await runOrchestratorTick({
      bot: mockBot as any,
      groupId: 12345,
      zaalTgId: 9876,
      now: new Date(),
    });

    // Should be silent (no posts) because daily cap is reached
    expect(mockBot.api.sendMessage).not.toHaveBeenCalled();
  });

  it('is silent when no new answers', async () => {
    process.env.ZOE_ORCHESTRATOR_ENABLED = 'true';

    // Create empty recent file (no answers)
    await fs.mkdir(testRecentDir, { recursive: true });
    const recentPath = join(testRecentDir, '12345.json');
    await fs.writeFile(recentPath, JSON.stringify([]));

    const mockBot = {
      api: {
        sendMessage: vi.fn(),
      },
    };

    await runOrchestratorTick({
      bot: mockBot as any,
      groupId: 12345,
      zaalTgId: 9876,
      now: new Date(),
    });

    expect(mockBot.api.sendMessage).not.toHaveBeenCalled();
  });
});
