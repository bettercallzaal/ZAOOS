// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makePostRequest } from '@/test-utils/api-helpers';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockGetSessionData = vi.hoisted(() => vi.fn());
vi.mock('@/lib/auth/session', () => ({ getSessionData: mockGetSessionData }));

const mockIsValidJukeSpaceId = vi.hoisted(() => vi.fn().mockReturnValue(true));
vi.mock('@/lib/spaces/juke', () => ({ isValidJukeSpaceId: mockIsValidJukeSpaceId }));

const mockGetJukeSpace = vi.hoisted(() => vi.fn());
const mockUpdateJukeSpace = vi.hoisted(() => vi.fn());
vi.mock('@/lib/spaces/jukeSpacesDb', () => ({
  getJukeSpace: mockGetJukeSpace,
  updateJukeSpace: mockUpdateJukeSpace,
}));

const mockEnv = vi.hoisted(() => ({ JUKE_API_KEY: 'test-juke-key' as string | undefined }));
vi.mock('@/lib/env', () => ({ ENV: mockEnv }));

const mockFetch = vi.hoisted(() => vi.fn());

import { POST } from '../route';

vi.stubGlobal('fetch', mockFetch);

afterEach(() => {
  vi.clearAllMocks();
  mockEnv.JUKE_API_KEY = 'test-juke-key';
  mockIsValidJukeSpaceId.mockReturnValue(true);
});

const SESSION = { fid: 42, isAdmin: false };
const ADMIN_SESSION = { fid: 1, isAdmin: true };
const VALID_BODY = { spaceId: 'juke-space-abc' };
const LIVE_ROOM = { status: 'live', created_by_fid: 42 };
const ENDED_ROOM = { status: 'ended', created_by_fid: 42 };
const OTHER_HOST_ROOM = { status: 'live', created_by_fid: 99 };

describe('POST /api/juke/admin/end-space', () => {
  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await POST(makePostRequest('/api/juke/admin/end-space', VALID_BODY));
    expect(res.status).toBe(401);
  });

  it('returns 503 when JUKE_API_KEY not configured', async () => {
    mockGetSessionData.mockResolvedValue(SESSION);
    mockEnv.JUKE_API_KEY = undefined;
    const res = await POST(makePostRequest('/api/juke/admin/end-space', VALID_BODY));
    expect(res.status).toBe(503);
  });

  it('returns 400 when spaceId fails validation', async () => {
    mockGetSessionData.mockResolvedValue(SESSION);
    mockIsValidJukeSpaceId.mockReturnValue(false);
    const res = await POST(makePostRequest('/api/juke/admin/end-space', { spaceId: 'bad!' }));
    expect(res.status).toBe(400);
  });

  it('returns 404 when space not found in DB', async () => {
    mockGetSessionData.mockResolvedValue(SESSION);
    mockGetJukeSpace.mockResolvedValue(null);
    const res = await POST(makePostRequest('/api/juke/admin/end-space', VALID_BODY));
    expect(res.status).toBe(404);
  });

  it('returns 403 when user is neither host nor admin', async () => {
    mockGetSessionData.mockResolvedValue(SESSION); // fid: 42
    mockGetJukeSpace.mockResolvedValue(OTHER_HOST_ROOM); // created_by_fid: 99
    const res = await POST(makePostRequest('/api/juke/admin/end-space', VALID_BODY));
    expect(res.status).toBe(403);
  });

  it('returns ok:true with alreadyEnded:true when space is already ended', async () => {
    mockGetSessionData.mockResolvedValue(SESSION);
    mockGetJukeSpace.mockResolvedValue(ENDED_ROOM);
    const res = await POST(makePostRequest('/api/juke/admin/end-space', VALID_BODY));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.alreadyEnded).toBe(true);
  });

  it('returns 502 when fetch to Juke throws a network error', async () => {
    mockGetSessionData.mockResolvedValue(SESSION);
    mockGetJukeSpace.mockResolvedValue(LIVE_ROOM);
    mockFetch.mockRejectedValue(new Error('Network unreachable'));
    const res = await POST(makePostRequest('/api/juke/admin/end-space', VALID_BODY));
    expect(res.status).toBe(502);
  });

  it('returns 202 with fallback:mark-ended when Juke 404s the endpoint', async () => {
    mockGetSessionData.mockResolvedValue(SESSION);
    mockGetJukeSpace.mockResolvedValue(LIVE_ROOM);
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      text: vi.fn().mockResolvedValue('{"error":"Not Found"}'),
    });
    mockUpdateJukeSpace.mockResolvedValue(undefined);
    const res = await POST(makePostRequest('/api/juke/admin/end-space', VALID_BODY));
    const body = await res.json();
    expect(res.status).toBe(202);
    expect(body.fallback).toBe('mark-ended');
  });

  it('returns ok:true when admin ends a room and Juke accepts', async () => {
    mockGetSessionData.mockResolvedValue(ADMIN_SESSION);
    mockGetJukeSpace.mockResolvedValue(OTHER_HOST_ROOM); // admin bypasses host check
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue('{"status":"ended"}'),
    });
    const res = await POST(makePostRequest('/api/juke/admin/end-space', VALID_BODY));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
  });
});
