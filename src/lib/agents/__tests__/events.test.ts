import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockInsert = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() => vi.fn());
const mockLoggerError = vi.hoisted(() => vi.fn());

vi.mock('@/lib/db/supabase', () => ({
  getSupabaseAdmin: () => ({ from: mockFrom }),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: mockLoggerError, info: vi.fn(), warn: vi.fn() },
}));

import { logAgentEvent } from '@/lib/agents/events';

describe('logAgentEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({ insert: mockInsert });
  });

  it('silent success path: no logger.error when DB insert succeeds', async () => {
    mockInsert.mockResolvedValue({ error: null });
    await logAgentEvent({
      agent_name: 'VAULT',
      action: 'buy_zabal',
      status: 'success',
      tx_hash: '0xabc',
    });
    expect(mockLoggerError).not.toHaveBeenCalled();
  });

  it('CRITICAL log path: logger.error fires with structured payload when DB insert fails', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'rls denied' } });
    await logAgentEvent({
      agent_name: 'BANKER',
      action: 'add_lp',
      status: 'failed',
      tx_hash: '0xdeadbeef',
    });

    expect(mockLoggerError).toHaveBeenCalledTimes(1);
    const loggedMsg = mockLoggerError.mock.calls[0][0] as string;
    expect(loggedMsg).toContain('CRITICAL audit-trail drop');
    expect(loggedMsg).toContain('BANKER');
    expect(loggedMsg).toContain('action=add_lp');
    expect(loggedMsg).toContain('status=failed');
    expect(loggedMsg).toContain('tx_hash=0xdeadbeef');
    expect(loggedMsg).toContain('db_error="rls denied"');
  });

  it('CRITICAL log still uses <none> when tx_hash absent', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'conn refused' } });
    await logAgentEvent({
      agent_name: 'DEALER',
      action: 'report',
      status: 'failed',
    });

    expect(mockLoggerError).toHaveBeenCalledTimes(1);
    const loggedMsg = mockLoggerError.mock.calls[0][0] as string;
    expect(loggedMsg).toContain('tx_hash=<none>');
  });
});
