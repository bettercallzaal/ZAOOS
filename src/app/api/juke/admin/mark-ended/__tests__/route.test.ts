// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makePostRequest } from '@/test-utils/api-helpers';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockGetSessionData = vi.hoisted(() => vi.fn());
const mockGetJukeSpace = vi.hoisted(() => vi.fn());
const mockUpdateJukeSpace = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/session', () => ({ getSessionData: mockGetSessionData }));
vi.mock('@/lib/spaces/jukeSpacesDb', () => ({
  getJukeSpace: mockGetJukeSpace,
  updateJukeSpace: mockUpdateJukeSpace,
}));

import { GET, POST } from '../route';

afterEach(() => vi.clearAllMocks());

const VALID_SPACE_ID = 'space-abc123';
const MOCK_ROOM = { created_by_fid: 10, status: 'live' };

describe('POST /api/juke/admin/mark-ended', () => {
  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const req = makePostRequest('/api/juke/admin/mark-ended', { spaceId: VALID_SPACE_ID });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid spaceId (special chars)', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 10 });
    const req = makePostRequest('/api/juke/admin/mark-ended', { spaceId: 'bad id with spaces!' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 404 when space not found', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 10 });
    mockGetJukeSpace.mockResolvedValue(null);
    const req = makePostRequest('/api/juke/admin/mark-ended', { spaceId: VALID_SPACE_ID });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('returns 403 when user is neither admin nor host', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 99, isAdmin: false });
    mockGetJukeSpace.mockResolvedValue(MOCK_ROOM);
    const req = makePostRequest('/api/juke/admin/mark-ended', { spaceId: VALID_SPACE_ID });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('returns ok:true with alreadyEnded:true when space already ended', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 10, isAdmin: false });
    mockGetJukeSpace.mockResolvedValue({ created_by_fid: 10, status: 'ended' });
    const req = makePostRequest('/api/juke/admin/mark-ended', { spaceId: VALID_SPACE_ID });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.alreadyEnded).toBe(true);
  });

  it('returns 500 when DB update throws', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 10, isAdmin: false });
    mockGetJukeSpace.mockResolvedValue(MOCK_ROOM);
    mockUpdateJukeSpace.mockRejectedValue(new Error('DB error'));
    const req = makePostRequest('/api/juke/admin/mark-ended', { spaceId: VALID_SPACE_ID });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it('returns ok:true with status:ended on success as admin', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 99, isAdmin: true });
    mockGetJukeSpace.mockResolvedValue(MOCK_ROOM);
    mockUpdateJukeSpace.mockResolvedValue(undefined);
    const req = makePostRequest('/api/juke/admin/mark-ended', { spaceId: VALID_SPACE_ID });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.status).toBe('ended');
  });
});

describe('GET /api/juke/admin/mark-ended', () => {
  it('returns 405 for GET requests', async () => {
    const res = await GET();
    expect(res.status).toBe(405);
  });
});
