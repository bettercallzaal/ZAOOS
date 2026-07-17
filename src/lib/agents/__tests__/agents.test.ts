// @vitest-environment node
// Tests for the thin agent delegation wrappers: runBanker, runDealer, runVault.
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the runner module so no actual trades or API calls are made.
const mockRunAgent = vi.hoisted(() => vi.fn());

vi.mock('../runner', () => ({
  runAgent: mockRunAgent,
}));

import { runBanker } from '../banker';
import { runDealer } from '../dealer';
import { runVault } from '../vault';

const MOCK_RESULT = { action: 'buy_zabal' as const, status: 'success' as const, details: 'ok' };

beforeEach(() => {
  mockRunAgent.mockReset();
  mockRunAgent.mockResolvedValue(MOCK_RESULT);
});

describe('runBanker', () => {
  it('delegates to runAgent with "BANKER"', async () => {
    await runBanker();
    expect(mockRunAgent).toHaveBeenCalledOnce();
    expect(mockRunAgent).toHaveBeenCalledWith('BANKER');
  });

  it('returns the AgentRunResult from runAgent', async () => {
    const result = await runBanker();
    expect(result).toEqual(MOCK_RESULT);
  });
});

describe('runDealer', () => {
  it('delegates to runAgent with "DEALER"', async () => {
    await runDealer();
    expect(mockRunAgent).toHaveBeenCalledWith('DEALER');
  });

  it('returns the AgentRunResult from runAgent', async () => {
    const result = await runDealer();
    expect(result.status).toBe('success');
  });
});

describe('runVault', () => {
  it('delegates to runAgent with "VAULT"', async () => {
    await runVault();
    expect(mockRunAgent).toHaveBeenCalledWith('VAULT');
  });

  it('returns the AgentRunResult from runAgent', async () => {
    const result = await runVault();
    expect(result.action).toBe('buy_zabal');
  });
});
