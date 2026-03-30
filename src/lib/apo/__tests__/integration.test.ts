import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PromptConfig } from '../types';

const mockCallMinimax = vi.hoisted(() => vi.fn());
vi.mock('../minimax', () => ({
  callMinimax: mockCallMinimax,
}));

describe('APO integration', () => {
  beforeEach(() => {
    mockCallMinimax.mockReset();
  });

  it('full 3-round optimization improves score', async () => {
    const config: PromptConfig = {
      name: 'integration-test',
      description: 'Test',
      currentPrompt: 'Basic prompt v1',
      testCases: [
        { input: 'test input', criteria: ['Is relevant'] },
      ],
      gradingPrompt: 'Grade it',
      maxRounds: 3,
    };

    // Round 1: baseline = 0.5
    // Call 1: generate output
    mockCallMinimax.mockResolvedValueOnce('Output v1');
    // Call 2: grade output
    mockCallMinimax.mockResolvedValueOnce('{"score": 0.5, "feedback": "Mediocre"}');
    // Call 3: critique
    mockCallMinimax.mockResolvedValueOnce('Issue: too vague');
    // Call 4: rewrite
    mockCallMinimax.mockResolvedValueOnce('Improved prompt v2');

    // Round 2: improvement = 0.75
    mockCallMinimax.mockResolvedValueOnce('Output v2');
    mockCallMinimax.mockResolvedValueOnce('{"score": 0.75, "feedback": "Better"}');
    mockCallMinimax.mockResolvedValueOnce('Issue: still generic');
    mockCallMinimax.mockResolvedValueOnce('Best prompt v3');

    // Round 3: best = 0.9 (last round, no critique/rewrite)
    mockCallMinimax.mockResolvedValueOnce('Output v3');
    mockCallMinimax.mockResolvedValueOnce('{"score": 0.9, "feedback": "Excellent"}');

    const { runAPO } = await import('../engine');
    const result = await runAPO(config);

    expect(result.rounds).toHaveLength(3);
    expect(result.baselineScore).toBeCloseTo(0.5);
    expect(result.bestScore).toBeCloseTo(0.9);
    expect(result.improvement).toBeCloseTo(80);
    expect(result.bestPrompt).toBe('Best prompt v3');
  });
});
