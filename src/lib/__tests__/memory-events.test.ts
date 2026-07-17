// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockRetain = vi.hoisted(() => vi.fn());

vi.mock('@/lib/hindsight', () => ({
  getHindsightClient: vi.fn(async () => ({
    retain: mockRetain,
    recall: vi.fn(),
    reflect: vi.fn(),
  })),
}));

import {
  onCastReceived,
  onProfileUpdate,
  onRespectTransaction,
  onRoomEvent,
  onTrackShared,
  type CastReceipt,
  type ProfileUpdate,
  type RespectTransaction,
  type RoomParticipation,
  type TrackShare,
} from '../memory-events';

const CAST: CastReceipt = {
  type: 'cast',
  castHash: '0xabc',
  authorFid: 42,
  authorUsername: 'djzaal',
  content: 'COC #7 is live!',
  timestamp: '2026-07-18T20:00:00Z',
  reactions: [{ type: 'like', count: 10 }],
  recasts: 3,
};

const TRACK: TrackShare = {
  type: 'track_share',
  trackName: 'WaveWarZ Anthem',
  artist: 'BetterCallZaal',
  platform: 'spotify',
  sharerFid: 42,
  sharerUsername: 'djzaal',
  timestamp: '2026-07-18T20:00:00Z',
};

const RESPECT: RespectTransaction = {
  type: 'respect',
  fromFid: 42,
  fromUsername: 'djzaal',
  toFid: 99,
  toUsername: 'wavewarzartist',
  amount: '10',
  timestamp: '2026-07-18T20:00:00Z',
};

const ROOM: RoomParticipation = {
  type: 'room_participation',
  roomId: 'coc7-spatial',
  event: 'spoke',
  speakerFid: 42,
  speakerUsername: 'djzaal',
  content: 'WaveWarZ crew in the building!',
  timestamp: '2026-07-18T20:00:00Z',
};

const PROFILE: ProfileUpdate = {
  type: 'profile_update',
  fid: 42,
  username: 'djzaal',
  field: 'bio',
  oldValue: 'DJ',
  newValue: 'DJ @ COC Concertz',
  timestamp: '2026-07-18T20:00:00Z',
};

describe('event retention — bank targeting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRetain.mockResolvedValue(undefined);
  });

  it('onCastReceived stores event in the author FID bank', async () => {
    await onCastReceived(CAST);
    expect(mockRetain).toHaveBeenCalledTimes(1);
    expect(mockRetain).toHaveBeenCalledWith('42', expect.any(String), expect.any(Object));
  });

  it('onTrackShared stores event in the sharer FID bank', async () => {
    await onTrackShared(TRACK);
    expect(mockRetain).toHaveBeenCalledWith('42', expect.any(String), expect.any(Object));
  });

  it('onRespectTransaction stores event in BOTH sender and receiver banks', async () => {
    await onRespectTransaction(RESPECT);
    expect(mockRetain).toHaveBeenCalledTimes(2);
    const fids = mockRetain.mock.calls.map((c) => c[0]);
    expect(fids).toContain('42'); // fromFid
    expect(fids).toContain('99'); // toFid
  });

  it('onRoomEvent stores event when speakerFid is present', async () => {
    await onRoomEvent(ROOM);
    expect(mockRetain).toHaveBeenCalledTimes(1);
    expect(mockRetain).toHaveBeenCalledWith('42', expect.any(String), expect.any(Object));
  });

  it('onRoomEvent does NOT retain when speakerFid is absent', async () => {
    const roomWithoutSpeaker: RoomParticipation = { ...ROOM, speakerFid: undefined };
    await onRoomEvent(roomWithoutSpeaker);
    expect(mockRetain).not.toHaveBeenCalled();
  });

  it('onProfileUpdate stores event in the profile owner FID bank', async () => {
    await onProfileUpdate(PROFILE);
    expect(mockRetain).toHaveBeenCalledWith('42', expect.any(String), expect.any(Object));
  });
});

describe('event serialization — human-readable text', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRetain.mockResolvedValue(undefined);
  });

  function getCapturedText(): string {
    return mockRetain.mock.calls[0]?.[1] ?? '';
  }

  it('cast: includes author, content, reaction count, recasts', async () => {
    await onCastReceived(CAST);
    const text = getCapturedText();
    expect(text).toContain('djzaal');
    expect(text).toContain('COC #7 is live!');
    expect(text).toContain('10 like');
    expect(text).toContain('3 recasts');
  });

  it('track_share: includes sharer, track name, artist, platform', async () => {
    await onTrackShared(TRACK);
    const text = getCapturedText();
    expect(text).toContain('djzaal');
    expect(text).toContain('WaveWarZ Anthem');
    expect(text).toContain('BetterCallZaal');
    expect(text).toContain('spotify');
  });

  it('track_share: includes optional note when present', async () => {
    const trackWithNote: TrackShare = { ...TRACK, note: 'fire track!' };
    await onTrackShared(trackWithNote);
    expect(getCapturedText()).toContain('fire track!');
  });

  it('respect: includes sender, receiver, amount', async () => {
    await onRespectTransaction(RESPECT);
    const senderText = mockRetain.mock.calls[0][1];
    expect(senderText).toContain('djzaal');
    expect(senderText).toContain('10 Respect');
    expect(senderText).toContain('wavewarzartist');
  });

  it('respect: includes reason when present', async () => {
    const respWithReason: RespectTransaction = { ...RESPECT, reason: 'great set' };
    await onRespectTransaction(respWithReason);
    expect(getCapturedText()).toContain('great set');
  });

  it('room_participation: includes username, event type, room id', async () => {
    await onRoomEvent(ROOM);
    const text = getCapturedText();
    expect(text).toContain('djzaal');
    expect(text).toContain('spoke');
    expect(text).toContain('coc7-spatial');
  });

  it('profile_update: includes field, old value, new value', async () => {
    await onProfileUpdate(PROFILE);
    const text = getCapturedText();
    expect(text).toContain('bio');
    expect(text).toContain('DJ');
    expect(text).toContain('DJ @ COC Concertz');
  });
});

describe('retainEvent — error handling', () => {
  it('does not throw when Hindsight retain rejects (graceful degradation)', async () => {
    mockRetain.mockRejectedValue(new Error('Hindsight down'));
    await expect(onCastReceived(CAST)).resolves.toBeUndefined();
  });

  it('does not throw when Hindsight client is unavailable', async () => {
    const { getHindsightClient } = await import('@/lib/hindsight');
    vi.mocked(getHindsightClient).mockResolvedValueOnce(null);
    await expect(onCastReceived(CAST)).resolves.toBeUndefined();
  });
});
