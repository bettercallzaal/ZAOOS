// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockInsert = vi.hoisted(() => vi.fn().mockResolvedValue({ error: null }));
const mockUpdate = vi.hoisted(() => vi.fn());
const mockIn = vi.hoisted(() => vi.fn().mockResolvedValue({ error: null }));
const mockEq = vi.hoisted(() =>
  vi.fn().mockReturnValue({ neq: vi.fn().mockReturnThis() }),
);
const mockSelect = vi.hoisted(() => vi.fn().mockImplementation(function () {
  return { eq: mockEq };
}));
const mockFrom = vi.hoisted(() =>
  vi.fn().mockImplementation((table: string) => {
    if (table === 'notifications') return { insert: mockInsert };
    if (table === 'notification_tokens') {
      const chain = {
        select: mockSelect,
        update: vi.fn().mockReturnValue({ in: mockIn }),
      };
      return chain;
    }
    return {};
  }),
);
vi.mock('@/lib/db/supabase', () => ({ supabaseAdmin: { from: mockFrom } }));

const mockFetch = vi.hoisted(() => vi.fn());
vi.stubGlobal('fetch', mockFetch);

import { createInAppNotification, sendNotification } from '../notifications';

afterEach(() => vi.clearAllMocks());

describe('createInAppNotification', () => {
  it('returns without inserting when recipientFids is empty', async () => {
    await createInAppNotification({
      recipientFids: [],
      type: 'system',
      title: 'Test',
      body: 'Body',
      href: '/notifications',
    });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('inserts one row per recipient with correct fields', async () => {
    await createInAppNotification({
      recipientFids: [10, 20],
      type: 'proposal',
      title: 'New Proposal',
      body: 'A new proposal was submitted.',
      href: '/proposals/1',
      actorFid: 1,
      actorDisplayName: 'ZAO',
    });
    expect(mockInsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ recipient_fid: 10, type: 'proposal', read: false }),
        expect.objectContaining({ recipient_fid: 20, type: 'proposal', read: false }),
      ]),
    );
  });
});

describe('sendNotification', () => {
  it('returns early when no enabled tokens are found', async () => {
    mockSelect.mockReturnValueOnce({ eq: vi.fn().mockReturnValue({ data: [] }) });
    await sendNotification('Title', 'Body', 'https://zaoos.com', 'notif-1');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('sends fetch to notification URL for each token group', async () => {
    const tokens = [{ fid: 42, token: 'tok-abc', url: 'https://notif.example.com/push', enabled: true }];
    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockReturnValue({ data: tokens }),
    });
    mockFetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ invalidTokens: [] }),
    });
    await sendNotification('ZAO Alert', 'Something happened', 'https://zaoos.com/live', 'notif-2');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://notif.example.com/push',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('disables invalid tokens returned by the push endpoint', async () => {
    const tokens = [
      { fid: 10, token: 'bad-token', url: 'https://notif.example.com/push', enabled: true },
    ];
    mockSelect.mockReturnValueOnce({
      eq: vi.fn().mockReturnValue({ data: tokens }),
    });
    mockFetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ invalidTokens: ['bad-token'] }),
    });
    await sendNotification('Title', 'Body', 'https://zaoos.com', 'notif-3');
    // Should call update({ enabled: false }).in('token', ['bad-token'])
    expect(mockIn).toHaveBeenCalledWith('token', ['bad-token']);
  });
});
