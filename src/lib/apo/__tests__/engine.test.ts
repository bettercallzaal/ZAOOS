import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PromptConfig } from '../types';

const mockCallMinimax = vi.hoisted(() => vi.fn());

vi.mock('../minimax', () => ({
  callMinimax: mockCallMinimax,
}));

function makeConfig(overrides: Partial<PromptConfig> = {}): PromptConfig {
  return {
    name: 'test-prompt',
    description: 'A test prompt',
    currentPrompt: 'You are a helpful assistant.',
    testCases: [
      { input: 'Say hello', criteria: ['greeting'] },
      { input: 'Say goodbye', criteria: ['farewell'] },
    ],
    gradingPrompt: 'Grade the output on a 0-1 scale.',
    maxRounds: 2,
    ...overrides,
  };
}

describe('runAPO', () => {
  beforeEach(() => {
    mockCallMinimax.mockReset();
    vi.resetModules();
  });

  it('evaluates baseline and returns scores', async () => {
    // Call order: for each test case sequentially — generate, grade; then critique, rewrite
    mockCallMinimax
      // Round 1 — generate TC1, grade TC1, generate TC2, grade TC2, critique, rewrite
      .mockResolvedValueOnce('Hello there!')
      .mockResolvedValueOnce(JSON.stringify({ score: 0.6, feedback: 'Decent greeting' }))
      .mockResolvedValueOnce('Goodbye friend!')
      .mockResolvedValueOnce(JSON.stringify({ score: 0.8, feedback: 'Good farewell' }))
      .mockResolvedValueOnce('1. Greeting could be warmer\n2. Add more personality')
      .mockResolvedValueOnce('You are a warm and friendly assistant.')
      // Round 2 — generate TC1, grade TC1, generate TC2, grade TC2 (last round, no critique/rewrite)
      .mockResolvedValueOnce('Hey there, wonderful person!')
      .mockResolvedValueOnce(JSON.stringify({ score: 0.9, feedback: 'Great greeting' }))
      .mockResolvedValueOnce('Take care, see you soon!')
      .mockResolvedValueOnce(JSON.stringify({ score: 0.95, feedback: 'Excellent farewell' }));

    const { runAPO } = await import('../engine');
    const result = await runAPO(makeConfig());

    // Baseline is round 1 average: (0.6 + 0.8) / 2 = 0.7
    expect(result.baselineScore).toBeCloseTo(0.7);
    expect(result.rounds).toHaveLength(2);
    expect(result.bestScore).toBeCloseTo(0.925);
    expect(result.bestPrompt).toBe('You are a warm and friendly assistant.');
    expect(result.improvement).toBeGreaterThan(0);
    expect(result.promptName).toBe('test-prompt');
    // Round 2 is kept because it scored higher
    expect(result.rounds[1].kept).toBe(true);
  });

  it('discards a rewrite that scores lower', async () => {
    mockCallMinimax
      // Round 1 — generate TC1, grade TC1, generate TC2, grade TC2, critique, rewrite
      .mockResolvedValueOnce('Great output 1')
      .mockResolvedValueOnce(JSON.stringify({ score: 0.9, feedback: 'Excellent' }))
      .mockResolvedValueOnce('Great output 2')
      .mockResolvedValueOnce(JSON.stringify({ score: 0.9, feedback: 'Excellent' }))
      .mockResolvedValueOnce('1. Could be slightly better')
      .mockResolvedValueOnce('You are a terrible assistant.')
      // Round 2 — generate TC1, grade TC1, generate TC2, grade TC2
      .mockResolvedValueOnce('Bad output 1')
      .mockResolvedValueOnce(JSON.stringify({ score: 0.3, feedback: 'Poor' }))
      .mockResolvedValueOnce('Bad output 2')
      .mockResolvedValueOnce(JSON.stringify({ score: 0.3, feedback: 'Poor' }));

    const { runAPO } = await import('../engine');
    const result = await runAPO(makeConfig());

    // Round 2 scored 0.3, lower than round 1's 0.9
    expect(result.rounds[1].kept).toBe(false);
    expect(result.bestScore).toBeCloseTo(0.9);
    expect(result.bestPrompt).toBe('You are a helpful assistant.');
  });

  it('handles malformed grading JSON gracefully', async () => {
    mockCallMinimax
      // Round 1 — generate TC1, grade TC1 (fail x2), generate TC2, grade TC2 (fail x2), critique, rewrite
      .mockResolvedValueOnce('Some output')
      .mockResolvedValueOnce('This is not JSON at all')
      .mockResolvedValueOnce('Still not JSON')
      .mockResolvedValueOnce('Another output')
      .mockResolvedValueOnce('Nope')
      .mockResolvedValueOnce('Nope again')
      .mockResolvedValueOnce('Everything failed')
      .mockResolvedValueOnce('Rewritten prompt')
      // Round 2 — generate TC1, grade TC1, generate TC2, grade TC2
      .mockResolvedValueOnce('Output 1')
      .mockResolvedValueOnce(JSON.stringify({ score: 0.5, feedback: 'OK' }))
      .mockResolvedValueOnce('Output 2')
      .mockResolvedValueOnce(JSON.stringify({ score: 0.5, feedback: 'OK' }));

    const { runAPO } = await import('../engine');
    const result = await runAPO(makeConfig());

    // Should not throw
    expect(result).toBeDefined();
    // Round 1 should have score 0.0 due to parse failures
    expect(result.rounds[0].avgScore).toBe(0);
    expect(result.rounds[0].testScores[0].score).toBe(0);
    expect(result.rounds[0].testScores[0].feedback).toBe('Failed to parse grade');
  });
});
