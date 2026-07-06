import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

const {
  mockGetSessionData,
  mockGetMSRoomBySlugOrId,
  mockEnsureMSRoomSlug,
  mockEndMSRoom,
  mockSetMSRoomPinnedLinks,
} = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockGetMSRoomBySlugOrId: vi.fn(),
  mockEnsureMSRoomSlug: vi.fn(),
  mockEndMSRoom: vi.fn(),
  mockSetMSRoomPinnedLinks: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/social/msRoomsDb', () => ({
  getMSRoomBySlugOrId: mockGetMSRoomBySlugOrId,
  ensureMSRoomSlug: mockEnsureMSRoomSlug,
  endMSRoom: mockEndMSRoom,
  setMSRoomPinnedLinks: mockSetMSRoomPinnedLinks,
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET, PATCH } from '../route';

const ctx = { params: Promise.resolve({ id: 'room-1' }) };
const HOST_ROOM = { id: 'room-1', host_fid: 123, state: 'active' };

function makePatch(body?: unknown) {
  return makeRequest('/x', {
    method: 'PATCH',
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

describe('PATCH /api/100ms/rooms/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession()); // fid 123 = host
    mockGetMSRoomBySlugOrId.mockResolvedValue(HOST_ROOM);
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await PATCH(makePatch(), ctx);
    expect(res.status).toBe(401);
  });

  it('forbids a non-host', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 999 }));
    const res = await PATCH(makePatch({ pinnedLinks: [] }), ctx);
    expect(res.status).toBe(403);
    expect(mockSetMSRoomPinnedLinks).not.toHaveBeenCalled();
  });

  it('a bodyless PATCH ends the room (existing Leave behavior)', async () => {
    const res = await PATCH(makePatch(), ctx);
    expect(res.status).toBe(200);
    expect(mockEndMSRoom).toHaveBeenCalledWith('room-1');
    expect(mockSetMSRoomPinnedLinks).not.toHaveBeenCalled();
  });

  it('updates pinned links for the host', async () => {
    const links = [{ label: 'Agenda', url: 'https://thezao.com/agenda' }];
    const res = await PATCH(makePatch({ pinnedLinks: links }), ctx);
    expect(res.status).toBe(200);
    expect(mockSetMSRoomPinnedLinks).toHaveBeenCalledWith('room-1', links);
    expect(mockEndMSRoom).not.toHaveBeenCalled();
  });

  it('rejects a non-http(s) link scheme', async () => {
    const res = await PATCH(
      makePatch({ pinnedLinks: [{ label: 'x', url: 'javascript:alert(1)' }] }),
      ctx,
    );
    expect(res.status).toBe(400);
    expect(mockSetMSRoomPinnedLinks).not.toHaveBeenCalled();
    expect(mockEndMSRoom).not.toHaveBeenCalled();
  });

  it('rejects more than 10 links', async () => {
    const links = Array.from({ length: 11 }, (_, i) => ({
      label: `l${i}`,
      url: `https://e.com/${i}`,
    }));
    const res = await PATCH(makePatch({ pinnedLinks: links }), ctx);
    expect(res.status).toBe(400);
    expect(mockSetMSRoomPinnedLinks).not.toHaveBeenCalled();
  });
});

describe('GET /api/100ms/rooms/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMSRoomBySlugOrId.mockResolvedValue(HOST_ROOM);
    mockEnsureMSRoomSlug.mockResolvedValue('test3-ab12');
  });

  it('resolves by slug-or-id and returns the (backfilled) share slug', async () => {
    const res = await GET(makeRequest('/x'), { params: Promise.resolve({ id: 'test3-ab12' }) });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(mockGetMSRoomBySlugOrId).toHaveBeenCalledWith('test3-ab12');
    expect(body.room.slug).toBe('test3-ab12');
  });

  it('returns 404 for an unknown room', async () => {
    mockGetMSRoomBySlugOrId.mockResolvedValue(null);
    const res = await GET(makeRequest('/x'), ctx);
    expect(res.status).toBe(404);
  });
});
