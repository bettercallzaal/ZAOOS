import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { detectNewAnswers, decideNextQuestion, runOrchestratorTick, classifyAnswer, type AnswerAction } from '../orchestrator-tick';
import * as workLoop from '../work-loop';

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

describe('classifyAnswer (Stage 2)', () => {
  it('classifies task-uuid with done value as board_done', () => {
    const uuid = '12345678-1234-1234-1234-123456789abc';
    const action = classifyAnswer(`task-${uuid}`, 'done');
    expect(action.kind).toBe('board_done');
    expect(action.taskId).toBe(uuid);
  });

  it('accepts complete and ship as board_done dispositions', () => {
    const uuid = '12345678-1234-1234-1234-123456789abc';
    const a1 = classifyAnswer(`task-${uuid}`, 'complete');
    const a2 = classifyAnswer(`task-${uuid}`, 'SHIP');
    expect(a1.kind).toBe('board_done');
    expect(a2.kind).toBe('board_done');
  });

  it('rejects task-uuid if value is not a disposition', () => {
    const uuid = '12345678-1234-1234-1234-123456789abc';
    const action = classifyAnswer(`task-${uuid}`, 'not-done');
    // Should fall through to ask_next or skip
    expect(action.kind).not.toBe('board_done');
  });

  it('rejects malformed task-* qids', () => {
    const action = classifyAnswer('task-not-a-uuid', 'done');
    expect(action.kind).not.toBe('board_done');
  });

  it('classifies research-* qids as research', () => {
    const action = classifyAnswer('research-topic', 'my research topic');
    expect(action.kind).toBe('research');
    expect(action.topic).toBe('my research topic');
  });

  it('uses empty default topic for research- qid with no value', () => {
    const action = classifyAnswer('research-audit', '');
    expect(action.kind).toBe('research');
    expect(action.topic).toBe('General research');
  });

  it('classifies known qid-value pairs as ask_next', () => {
    const action = classifyAnswer('q-priority-what', 'Research');
    expect(action.kind).toBe('ask_next');
    expect(action.nextQuestion?.qid).toBe('q-priority-research-depth');
  });

  it('classifies unknown rules as skip', () => {
    const action = classifyAnswer('unknown-qid', 'unknown-value');
    expect(action.kind).toBe('skip');
  });

  it('prioritizes board_done over ask_next for task qids', () => {
    const uuid = '12345678-1234-1234-1234-123456789abc';
    const action = classifyAnswer(`task-${uuid}`, 'done');
    // Even if 'done' might match a rule, it should be board_done, not ask_next
    expect(action.kind).toBe('board_done');
    expect(action.taskId).toBe(uuid);
  });

  it('prioritizes research over ask_next for research-* qids', () => {
    const action = classifyAnswer('research-scope', 'Market analysis');
    // Should be research, not try to match against ask_next rules
    expect(action.kind).toBe('research');
    expect(action.topic).toBe('Market analysis');
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

  it('executes ask_next action (posts next question)', async () => {
    process.env.ZOE_ORCHESTRATOR_ENABLED = 'true';

    // Set up state file with a past timestamp so new answers are detected
    const statePath = join(testHome, 'orchestrator-state.json');
    await fs.mkdir(testHome, { recursive: true });
    await fs.writeFile(statePath, JSON.stringify({ lastSeenTs: '2026-01-01T00:00:00Z' }));

    // Create recent file with an answer that matches a rule
    await fs.mkdir(testRecentDir, { recursive: true });
    const recentPath = join(testRecentDir, '12345.json');
    const turns = [
      { from: 'zaal', text: '[answer:q-priority-what] Research', ts: '2026-01-02T00:00:00Z', sender: 'zaalbotz-btn' },
    ];
    await fs.writeFile(recentPath, JSON.stringify(turns));

    const mockBot = {
      api: {
        sendMessage: vi.fn().mockResolvedValue({}),
      },
    };

    await runOrchestratorTick({
      bot: mockBot as any,
      groupId: 12345,
      zaalTgId: 9876,
      now: new Date(),
    });

    // Should have posted the next question (q-priority-research-depth)
    expect(mockBot.api.sendMessage).toHaveBeenCalledWith(
      12345,
      'How deep should the research go?',
      expect.objectContaining({
        reply_markup: expect.any(Object),
      }),
    );
  });

  it('executes research action (enqueues work)', async () => {
    process.env.ZOE_ORCHESTRATOR_ENABLED = 'true';
    const enqueueSpy = vi.spyOn(workLoop, 'enqueueWork').mockResolvedValue({
      id: 'wk-test',
      kind: 'research' as const,
      input: 'test topic',
      addedTs: new Date().toISOString(),
    });

    // Set up state file with a past timestamp
    const statePath = join(testHome, 'orchestrator-state.json');
    await fs.mkdir(testHome, { recursive: true });
    await fs.writeFile(statePath, JSON.stringify({ lastSeenTs: '2026-01-01T00:00:00Z' }));

    // Create recent file with research-* qid
    await fs.mkdir(testRecentDir, { recursive: true });
    const recentPath = join(testRecentDir, '12345.json');
    const turns = [
      { from: 'zaal', text: '[answer:research-topic] AI alignment best practices', ts: '2026-01-02T00:00:00Z', sender: 'zaalbotz-btn' },
    ];
    await fs.writeFile(recentPath, JSON.stringify(turns));

    const mockBot = {
      api: {
        sendMessage: vi.fn().mockResolvedValue({}),
      },
    };

    await runOrchestratorTick({
      bot: mockBot as any,
      groupId: 12345,
      zaalTgId: 9876,
      now: new Date(),
    });

    // Should have enqueued work
    expect(enqueueSpy).toHaveBeenCalledWith('AI alignment best practices');
    // Should have posted confirmation
    expect(mockBot.api.sendMessage).toHaveBeenCalledWith(12345, expect.stringContaining('Queued research'));

    enqueueSpy.mockRestore();
  });

  it('respects disabled flag for all actions', async () => {
    process.env.ZOE_ORCHESTRATOR_ENABLED = 'false';

    // Create recent file with multiple answer types
    await fs.mkdir(testRecentDir, { recursive: true });
    const recentPath = join(testRecentDir, '12345.json');
    const turns = [
      { from: 'zaal', text: '[answer:q-priority-what] Research', ts: '2026-01-02T00:00:00Z', sender: 'zaalbotz-btn' },
      { from: 'zaal', text: '[answer:research-topic] test', ts: '2026-01-03T00:00:00Z', sender: 'zaalbotz-btn' },
    ];
    await fs.writeFile(recentPath, JSON.stringify(turns));

    const enqueueSpy = vi.spyOn(workLoop, 'enqueueWork').mockResolvedValue({
      id: 'wk-test',
      kind: 'research' as const,
      input: 'test',
      addedTs: new Date().toISOString(),
    });

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

    // Should NOT have done anything
    expect(mockBot.api.sendMessage).not.toHaveBeenCalled();
    expect(enqueueSpy).not.toHaveBeenCalled();

    enqueueSpy.mockRestore();
  });
});
