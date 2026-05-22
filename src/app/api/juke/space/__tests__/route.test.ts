import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  makeRequest,
  makePostRequest,
  mockUnauthenticatedSession,
  mockAuthenticatedSession,
  mockAdminSession,
} from '@/test-utils/api-helpers';

const mockEnv = vi.hoisted(() => ({
  JUKE_API_KEY: 'jk_sec_live_test' as string | undefined,
}));

const { mockGetSessionData, mockCreateJukeSpace } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockCreateJukeSpace: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/env', () => ({ ENV: mockEnv }));

vi.mock('@/lib/spaces/juke-api', () => ({
  createJukeSpace: mockCreateJukeSpace,
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { POST } from '../route';

describe('POST /api/juke/space', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv.JUKE_API_KEY = 'jk_sec_live_test';
  });

  it('returns 401 when there is no session', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

    const res = await POST(makePostRequest('/api/juke/space', { title: 'ZAO Live' }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
    expect(mockCreateJukeSpace).not.toHaveBeenCalled();
  });

  it('returns 403 when the user is not an admin', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const res = await POST(makePostRequest('/api/juke/space', { title: 'ZAO Live' }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe('Admin access required');
    expect(mockCreateJukeSpace).not.toHaveBeenCalled();
  });

  it('returns 503 when JUKE_API_KEY is not configured', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    mockEnv.JUKE_API_KEY = undefined;

    const res = await POST(makePostRequest('/api/juke/space', { title: 'ZAO Live' }));
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.error).toMatch(/not configured/i);
    expect(mockCreateJukeSpace).not.toHaveBeenCalled();
  });

  it('returns 400 when the body is not valid JSON', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const res = await POST(
      makeRequest('/api/juke/space', { method: 'POST', body: '{not json' }),
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/valid JSON/i);
  });

  it('returns 400 when the title is missing', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const res = await POST(makePostRequest('/api/juke/space', { title: '' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Invalid request');
  });

  it('returns 400 when scheduledAt is not an ISO datetime', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const res = await POST(
      makePostRequest('/api/juke/space', { title: 'ZAO Live', scheduledAt: 'next tuesday' }),
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Invalid request');
  });

  it('creates a space and returns 201 for an admin', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    mockCreateJukeSpace.mockResolvedValue({
      ok: true,
      space: {
        id: 'zao-live-1',
        embedUrl: 'https://juke.audio/embed/zao-live-1',
        raw: { id: 'zao-live-1' },
      },
    });

    const res = await POST(
      makePostRequest('/api/juke/space', {
        title: 'ZAOstock Standup',
        announceCast: true,
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('zao-live-1');
    expect(body.data.embedUrl).toBe('https://juke.audio/embed/zao-live-1');
    expect(mockCreateJukeSpace).toHaveBeenCalledWith(
      { title: 'ZAOstock Standup', announceCast: true },
      'jk_sec_live_test',
    );
  });

  it('returns 502 when the Juke API rejects the request', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    mockCreateJukeSpace.mockResolvedValue({
      ok: false,
      status: 401,
      error: 'Juke API returned 401',
    });

    const res = await POST(makePostRequest('/api/juke/space', { title: 'ZAO Live' }));
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Juke API returned 401');
  });

  it('returns 500 when createJukeSpace throws unexpectedly', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    mockCreateJukeSpace.mockRejectedValue(new Error('boom'));

    const res = await POST(makePostRequest('/api/juke/space', { title: 'ZAO Live' }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to create Juke space');
  });
});
