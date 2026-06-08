import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  makePostRequest,
  mockUnauthenticatedSession,
  mockAuthenticatedSession,
} from '@/test-utils/api-helpers';

const { mockGetSessionData, mockCreateMSRoom, mockGetActiveMSRooms } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockCreateMSRoom: vi.fn(),
  mockGetActiveMSRooms: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/social/msRoomsDb', () => ({
  createMSRoom: mockCreateMSRoom,
  getActiveMSRooms: mockGetActiveMSRooms,
  roomSlug: (room: { settings?: { slug?: string } }) => room?.settings?.slug ?? null,
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET, POST } from '../route';

const GATE = {
  type: 'erc721' as const,
  contractAddress: '0xabc0000000000000000000000000000000000def',
  chainId: 8453,
};

describe('POST /api/100ms/rooms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    mockCreateMSRoom.mockResolvedValue({ id: 'room-1', title: 'ZAO Video' });
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await POST(makePostRequest('/api/100ms/rooms', { title: 'ZAO Video' }));
    expect(res.status).toBe(401);
    expect(mockCreateMSRoom).not.toHaveBeenCalled();
  });

  it('returns 400 for an empty title', async () => {
    const res = await POST(makePostRequest('/api/100ms/rooms', { title: '' }));
    expect(res.status).toBe(400);
    expect(mockCreateMSRoom).not.toHaveBeenCalled();
  });

  it('creates a room with the host from the session', async () => {
    const res = await POST(makePostRequest('/api/100ms/rooms', { title: 'ZAO Video' }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.room.id).toBe('room-1');
    expect(mockCreateMSRoom).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'ZAO Video', hostFid: 123, hostName: 'Test User' }),
    );
  });

  it('persists the token gate so gated rooms are actually gated', async () => {
    await POST(makePostRequest('/api/100ms/rooms', { title: 'Gated', gate_config: GATE }));
    expect(mockCreateMSRoom).toHaveBeenCalledWith(
      expect.objectContaining({ gateConfig: GATE }),
    );
  });

  it('ignores extra fields the client sends (slug, theme, provider)', async () => {
    const res = await POST(
      makePostRequest('/api/100ms/rooms', {
        title: 'ZAO Video',
        slug: 'zao-video',
        theme: 'default',
        provider: '100ms',
      }),
    );
    expect(res.status).toBe(200);
  });

  it('rejects a malformed gate config', async () => {
    const res = await POST(
      makePostRequest('/api/100ms/rooms', {
        title: 'Bad gate',
        gate_config: { type: 'erc999', contractAddress: '0x1', chainId: 8453 },
      }),
    );
    expect(res.status).toBe(400);
    expect(mockCreateMSRoom).not.toHaveBeenCalled();
  });
});

describe('GET /api/100ms/rooms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the active rooms', async () => {
    mockGetActiveMSRooms.mockResolvedValue([{ id: 'a' }, { id: 'b' }]);
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.rooms).toHaveLength(2);
  });

  it('returns 500 when the lookup fails', async () => {
    mockGetActiveMSRooms.mockRejectedValue(new Error('db down'));
    const res = await GET();
    expect(res.status).toBe(500);
  });
});
