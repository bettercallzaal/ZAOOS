// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makePostRequest } from '@/test-utils/api-helpers';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockGetSessionData = vi.hoisted(() => vi.fn());
vi.mock('@/lib/auth/session', () => ({ getSessionData: mockGetSessionData }));

vi.mock('@/lib/db/audit-log', () => ({
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
  logAuditEvent: vi.fn(),
}));

const mockGenerateUserToken = vi.hoisted(() => vi.fn().mockReturnValue('stream-jwt-token'));
vi.mock('@stream-io/node-sdk', () => ({
  StreamClient: vi.fn().mockImplementation(() => ({
    generateUserToken: mockGenerateUserToken,
  })),
}));

import { POST } from '../route';

beforeEach(() => {
  process.env.NEXT_PUBLIC_STREAM_API_KEY = 'test-api-key';
  process.env.STREAM_API_SECRET = 'test-api-secret';
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_STREAM_API_KEY;
  delete process.env.STREAM_API_SECRET;
  vi.clearAllMocks();
});

const MOCK_SESSION = { fid: 42 };

describe('POST /api/stream/token', () => {
  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const req = makePostRequest('/api/stream/token', { userId: '42' });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 500 when Stream API keys are missing', async () => {
    delete process.env.NEXT_PUBLIC_STREAM_API_KEY;
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    const req = makePostRequest('/api/stream/token', { userId: '42' });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it('returns 400 when userId is missing from body', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    const req = makePostRequest('/api/stream/token', {});
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 403 when userId does not match session fid', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    const req = makePostRequest('/api/stream/token', { userId: '999' });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('returns a JWT token when userId matches session fid', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    const req = makePostRequest('/api/stream/token', { userId: '42' });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.token).toBe('stream-jwt-token');
  });
});
