// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockGetSessionData = vi.hoisted(() => vi.fn());
vi.mock('@/lib/auth/session', () => ({ getSessionData: mockGetSessionData }));
vi.mock('@/lib/db/audit-log', () => ({
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
  logAuditEvent: vi.fn(),
}));

const mockEq = vi.hoisted(() => vi.fn());
const mockDelete = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() =>
  vi.fn().mockReturnValue({
    delete: mockDelete,
  }),
);
vi.mock('@/lib/db/supabase', () => ({ supabaseAdmin: { from: mockFrom } }));

import { DELETE } from '../route';

afterEach(() => vi.clearAllMocks());

const ROOM_ID = 'room-uuid-abc';

function makeDeleteRequest() {
  return new NextRequest(
    new URL(`/api/admin/spaces/${ROOM_ID}`, 'http://localhost:3000'),
    { method: 'DELETE' },
  );
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('DELETE /api/admin/spaces/[id]', () => {
  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await DELETE(makeDeleteRequest(), makeParams(ROOM_ID));
    expect(res.status).toBe(401);
  });

  it('returns 403 when user is not admin', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 10, isAdmin: false });
    const res = await DELETE(makeDeleteRequest(), makeParams(ROOM_ID));
    expect(res.status).toBe(403);
  });

  it('returns 500 when DB delete fails', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 1, isAdmin: true });
    mockEq.mockResolvedValue({ error: { message: 'DB fail' } });
    mockDelete.mockReturnValue({ eq: mockEq });
    const res = await DELETE(makeDeleteRequest(), makeParams(ROOM_ID));
    expect(res.status).toBe(500);
  });

  it('returns ok:true on successful delete', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 1, isAdmin: true });
    mockEq.mockResolvedValue({ error: null });
    mockDelete.mockReturnValue({ eq: mockEq });
    const res = await DELETE(makeDeleteRequest(), makeParams(ROOM_ID));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
  });
});
