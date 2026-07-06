import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeRequest } from '@/test-utils/api-helpers';

const {
  mockGetMSRoomByHmsRoomId,
  mockEndMSRoom,
  mockSetMSRoomParticipantCount,
  mockSetMSRoomRecording,
  mockGet100msPeerCount,
  mockMintManagementToken,
} = vi.hoisted(() => ({
  mockGetMSRoomByHmsRoomId: vi.fn(),
  mockEndMSRoom: vi.fn(),
  mockSetMSRoomParticipantCount: vi.fn(),
  mockSetMSRoomRecording: vi.fn(),
  mockGet100msPeerCount: vi.fn(),
  mockMintManagementToken: vi.fn(),
}));

vi.mock('@/lib/social/msRoomsDb', () => ({
  getMSRoomByHmsRoomId: mockGetMSRoomByHmsRoomId,
  endMSRoom: mockEndMSRoom,
  setMSRoomParticipantCount: mockSetMSRoomParticipantCount,
  setMSRoomRecording: mockSetMSRoomRecording,
}));

vi.mock('@/lib/social/hms100ms', () => ({
  get100msPeerCount: mockGet100msPeerCount,
  mintManagementToken: mockMintManagementToken,
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { POST } from '../route';

const SECRET = 'test-webhook-secret';
const ROOM = { id: 'room-1', state: 'active' };

function makeWebhook(body: unknown, auth?: string) {
  return makeRequest('/api/100ms/webhook', {
    method: 'POST',
    headers: auth ? { authorization: auth } : {},
    body: JSON.stringify(body),
  });
}

describe('POST /api/100ms/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.HMS_WEBHOOK_SECRET = SECRET;
    mockGetMSRoomByHmsRoomId.mockResolvedValue(ROOM);
    mockMintManagementToken.mockReturnValue('mgmt');
  });

  afterEach(() => {
    delete process.env.HMS_WEBHOOK_SECRET;
  });

  it('returns 500 when the secret is not configured', async () => {
    delete process.env.HMS_WEBHOOK_SECRET;
    const res = await POST(makeWebhook({ type: 'peer.join.success' }, SECRET));
    expect(res.status).toBe(500);
  });

  it('returns 401 for a missing/wrong auth header', async () => {
    expect((await POST(makeWebhook({ type: 'peer.join.success' }))).status).toBe(401);
    expect((await POST(makeWebhook({ type: 'peer.join.success' }, 'nope'))).status).toBe(401);
  });

  it('accepts a bare secret or Bearer form', async () => {
    expect((await POST(makeWebhook({ type: 'x', data: {} }, SECRET))).status).toBe(200);
    expect((await POST(makeWebhook({ type: 'x', data: {} }, `Bearer ${SECRET}`))).status).toBe(200);
  });

  it('no-ops on an unknown room', async () => {
    mockGetMSRoomByHmsRoomId.mockResolvedValue(null);
    const res = await POST(
      makeWebhook({ type: 'peer.join.success', data: { room_id: 'hms-x' } }, SECRET),
    );
    expect(res.status).toBe(200);
    expect(mockSetMSRoomParticipantCount).not.toHaveBeenCalled();
  });

  it('refreshes participant_count on peer.join', async () => {
    mockGet100msPeerCount.mockResolvedValue(4);
    const res = await POST(
      makeWebhook({ type: 'peer.join.success', data: { room_id: 'hms-1' } }, SECRET),
    );
    expect(res.status).toBe(200);
    expect(mockSetMSRoomParticipantCount).toHaveBeenCalledWith('room-1', 4);
  });

  it('does not write the count when the peer count is unknown', async () => {
    mockGet100msPeerCount.mockResolvedValue(null);
    await POST(makeWebhook({ type: 'peer.leave.success', data: { room_id: 'hms-1' } }, SECRET));
    expect(mockSetMSRoomParticipantCount).not.toHaveBeenCalled();
  });

  it('ends the room on session.close', async () => {
    const res = await POST(
      makeWebhook({ type: 'session.close.success', data: { room_id: 'hms-1' } }, SECRET),
    );
    expect(res.status).toBe(200);
    expect(mockEndMSRoom).toHaveBeenCalledWith('room-1');
  });

  it('stores a recording url on recording success', async () => {
    const res = await POST(
      makeWebhook(
        {
          type: 'beam.recording.success',
          data: { room_id: 'hms-1', recording_path: 's3://clip.mp4' },
        },
        SECRET,
      ),
    );
    expect(res.status).toBe(200);
    expect(mockSetMSRoomRecording).toHaveBeenCalledWith('room-1', 's3://clip.mp4');
  });
});
