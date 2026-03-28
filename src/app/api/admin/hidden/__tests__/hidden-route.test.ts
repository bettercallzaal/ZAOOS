import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  chainMock,
  mockUnauthenticatedSession,
  mockAuthenticatedSession,
  mockAdminSession,
} from '@/test-utils/api-helpers';

const { mockGetSessionData, mockFrom } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

import { GET } from '../route';

describe('GET /api/admin/hidden', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 403 when user is not admin', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe('Admin access required');
  });

  it('returns hidden messages for admin', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const messages = [
      { id: 1, content: 'hidden msg', hidden_at: '2026-01-01' },
      { id: 2, content: 'another hidden', hidden_at: '2026-01-02' },
    ];
    const { chain } = chainMock({ data: messages, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.messages).toEqual(messages);
    expect(mockFrom).toHaveBeenCalledWith('hidden_messages');
    expect(chain.select).toHaveBeenCalledWith('*');
    expect(chain.order).toHaveBeenCalledWith('hidden_at', { ascending: false });
    expect(chain.limit).toHaveBeenCalledWith(100);
  });

  it('returns 500 when database errors', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const { chain } = chainMock({ data: null, error: { message: 'db down' } });
    mockFrom.mockReturnValue(chain);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to fetch');
  });
});
