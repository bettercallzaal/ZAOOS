import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSendToken = vi.hoisted(() => vi.fn());
const mockLogAgentEvent = vi.hoisted(() => vi.fn());

vi.mock('@/lib/agents/wallet', () => ({ sendToken: mockSendToken }));
vi.mock('@/lib/agents/events', () => ({ logAgentEvent: mockLogAgentEvent }));
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { burnZabal } from '@/lib/agents/burn';

describe('burnZabal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null without logging when totalAmount <= 0', async () => {
    const result = await burnZabal('VAULT', BigInt(0));
    expect(result).toBeNull();
    expect(mockSendToken).not.toHaveBeenCalled();
    expect(mockLogAgentEvent).not.toHaveBeenCalled();
  });

  it('success path: logs success event with token_out=BURN', async () => {
    mockSendToken.mockResolvedValue('0xburnhash');
    // 10,000 ZABAL in wei (1% = 100 ZABAL burned)
    const result = await burnZabal('VAULT', BigInt('10000000000000000000000'));
    expect(result).toBe('0xburnhash');
    expect(mockLogAgentEvent).toHaveBeenCalledTimes(1);
    const logged = mockLogAgentEvent.mock.calls[0][0];
    expect(logged.agent_name).toBe('VAULT');
    expect(logged.action).toBe('buy_zabal');
    expect(logged.token_in).toBe('ZABAL');
    expect(logged.token_out).toBe('BURN');
    expect(logged.status).toBe('success');
    expect(logged.tx_hash).toBe('0xburnhash');
  });

  it('failure path: logs failed event with error_message, still returns null', async () => {
    mockSendToken.mockRejectedValue(new Error('gas too low'));
    const result = await burnZabal('BANKER', BigInt('10000000000000000000000'));
    expect(result).toBeNull();
    expect(mockLogAgentEvent).toHaveBeenCalledTimes(1);
    const logged = mockLogAgentEvent.mock.calls[0][0];
    expect(logged.agent_name).toBe('BANKER');
    expect(logged.status).toBe('failed');
    expect(logged.token_out).toBe('BURN');
    expect(logged.error_message).toBe('gas too low');
  });

  it('failure path handles non-Error throws as String(err)', async () => {
    mockSendToken.mockRejectedValue('plain string error');
    const result = await burnZabal('DEALER', BigInt('10000000000000000000000'));
    expect(result).toBeNull();
    expect(mockLogAgentEvent).toHaveBeenCalledTimes(1);
    expect(mockLogAgentEvent.mock.calls[0][0].error_message).toBe('plain string error');
  });
});
