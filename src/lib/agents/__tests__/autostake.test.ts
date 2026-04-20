import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockExecuteSwap = vi.hoisted(() => vi.fn());
const mockLogAgentEvent = vi.hoisted(() => vi.fn());
const mockSelect = vi.hoisted(() => vi.fn());
const mockEq = vi.hoisted(() => vi.fn());
const mockOrder = vi.hoisted(() => vi.fn());
const mockLimit = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() => vi.fn());

vi.mock('@/lib/agents/wallet', () => ({ executeSwap: mockExecuteSwap }));
vi.mock('@/lib/agents/events', () => ({ logAgentEvent: mockLogAgentEvent }));
vi.mock('@/lib/db/supabase', () => ({
  getSupabaseAdmin: () => ({ from: mockFrom }),
}));
vi.mock('@/lib/agents/types', () => ({
  TOKENS: { ZABAL: '0xZABAL', WETH: '0xWETH' },
  ZABAL_STAKING_CONTRACT: '0xStake',
  BURN_ADDRESS: '0xDead',
  BURN_PCT: 0.01,
}));
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { maybeAutoStake } from '@/lib/agents/autostake';

describe('maybeAutoStake', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Supabase select chain: .from('agent_events').select('created_at').eq('agent_name', ...).eq(...).eq(...).order(...).limit(...)
    // Chain returns { data: [] } meaning no prior stake → should attempt stake
    const chain = {
      select: mockSelect,
      eq: mockEq,
      order: mockOrder,
      limit: mockLimit,
    };
    mockFrom.mockReturnValue(chain);
    mockSelect.mockReturnValue(chain);
    mockEq.mockReturnValue(chain);
    mockOrder.mockReturnValue(chain);
    mockLimit.mockResolvedValue({ data: [] });
  });

  it('success path: logs add_lp success after approve + stake', async () => {
    mockExecuteSwap
      .mockResolvedValueOnce('0xapprovehash')
      .mockResolvedValueOnce('0xstakehash');

    await maybeAutoStake('VAULT');

    expect(mockExecuteSwap).toHaveBeenCalledTimes(2);
    expect(mockLogAgentEvent).toHaveBeenCalledTimes(1);
    const logged = mockLogAgentEvent.mock.calls[0][0];
    expect(logged.agent_name).toBe('VAULT');
    expect(logged.action).toBe('add_lp');
    expect(logged.status).toBe('success');
    expect(logged.tx_hash).toBe('0xstakehash');
  });

  it('failure path: logs add_lp failed when approve throws', async () => {
    mockExecuteSwap.mockRejectedValueOnce(new Error('privy rejected'));

    await maybeAutoStake('BANKER');

    expect(mockLogAgentEvent).toHaveBeenCalledTimes(1);
    const logged = mockLogAgentEvent.mock.calls[0][0];
    expect(logged.agent_name).toBe('BANKER');
    expect(logged.action).toBe('add_lp');
    expect(logged.status).toBe('failed');
    expect(logged.error_message).toBe('privy rejected');
    expect(logged.token_in).toBe('ZABAL');
    expect(logged.token_out).toBe('CONVICTION');
  });

  it('failure path: logs add_lp failed when stake call throws after approve succeeds', async () => {
    mockExecuteSwap
      .mockResolvedValueOnce('0xapprovehash')
      .mockRejectedValueOnce(new Error('stake contract reverted'));

    await maybeAutoStake('DEALER');

    expect(mockLogAgentEvent).toHaveBeenCalledTimes(1);
    expect(mockLogAgentEvent.mock.calls[0][0].status).toBe('failed');
    expect(mockLogAgentEvent.mock.calls[0][0].error_message).toBe('stake contract reverted');
  });

  it('failure path handles non-Error throws', async () => {
    mockExecuteSwap.mockRejectedValueOnce('string error');

    await maybeAutoStake('VAULT');

    expect(mockLogAgentEvent).toHaveBeenCalledTimes(1);
    expect(mockLogAgentEvent.mock.calls[0][0].error_message).toBe('string error');
  });
});
