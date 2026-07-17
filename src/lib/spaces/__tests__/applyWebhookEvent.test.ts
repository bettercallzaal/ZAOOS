// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

// @/lib/env has a module-level requireEnv() guard — stub before import
vi.mock('@/lib/env', () => ({
  ENV: {
    JUKE_API_KEY: undefined,
    ZAO_OFFICIAL_FID: undefined,
    ZAO_OFFICIAL_SIGNER_UUID: undefined,
    ZAO_OFFICIAL_NEYNAR_API_KEY: undefined,
    ZAO_AUTO_AGENT_JOIN: undefined,
  },
}));

const mockUpdateJukeSpace = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockGetJukeSpace = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockBumpParticipantCount = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockAddParticipant = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockRemoveParticipant = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
vi.mock('@/lib/spaces/jukeSpacesDb', () => ({
  updateJukeSpace: mockUpdateJukeSpace,
  getJukeSpace: mockGetJukeSpace,
  bumpParticipantCount: mockBumpParticipantCount,
  addParticipant: mockAddParticipant,
  removeParticipant: mockRemoveParticipant,
}));

const mockIsAutoAgentJoinEnabled = vi.hoisted(() => vi.fn().mockReturnValue(false));
const mockJoinAgentInJukeRoom = vi.hoisted(() => vi.fn());
vi.mock('@/lib/spaces/jukeAgentJoin', () => ({
  isAutoAgentJoinEnabled: mockIsAutoAgentJoinEnabled,
  joinAgentInJukeRoom: mockJoinAgentInJukeRoom,
}));

vi.mock('@/lib/publish/auto-cast', () => ({
  autoCastToZao: vi.fn().mockResolvedValue(undefined),
}));

import { applyWebhookEvent } from '../jukeWebhookHandlers';

afterEach(() => vi.clearAllMocks());

describe('applyWebhookEvent', () => {
  it('returns early without any DB calls when spaceId is null', async () => {
    await applyWebhookEvent('room.started', null, {});
    expect(mockUpdateJukeSpace).not.toHaveBeenCalled();
  });

  it('marks space active on room.started', async () => {
    await applyWebhookEvent('room.started', 'space-abc', { occurred_at: '2026-07-15T10:00:00Z' });
    expect(mockUpdateJukeSpace).toHaveBeenCalledWith(
      'space-abc',
      expect.objectContaining({ status: 'active' }),
    );
  });

  it('marks space ended on room.finished (no recap cast when endedVia=null)', async () => {
    const { autoCastToZao } = await import('@/lib/publish/auto-cast');
    await applyWebhookEvent('room.finished', 'space-abc', { data: {} });
    expect(mockUpdateJukeSpace).toHaveBeenCalledWith(
      'space-abc',
      expect.objectContaining({ status: 'ended' }),
    );
    // endedVia=null means LiveKit timeout — no recap cast
    expect(autoCastToZao).not.toHaveBeenCalled();
  });

  it('bumps count and adds participant on participant.joined with valid fid', async () => {
    await applyWebhookEvent('participant.joined', 'space-abc', {
      data: { fid: 42, display_name: 'ZAO Member', role: 'listener' },
      occurred_at: '2026-07-15T10:05:00Z',
    });
    expect(mockBumpParticipantCount).toHaveBeenCalledWith('space-abc', 1);
    expect(mockAddParticipant).toHaveBeenCalledWith(
      'space-abc',
      expect.objectContaining({ fid: 42 }),
    );
  });

  it('bumps count and removes participant on participant.left', async () => {
    await applyWebhookEvent('participant.left', 'space-abc', {
      data: { fid: 42 },
      occurred_at: '2026-07-15T10:10:00Z',
    });
    expect(mockBumpParticipantCount).toHaveBeenCalledWith('space-abc', -1);
    expect(mockRemoveParticipant).toHaveBeenCalledWith('space-abc', 42);
  });

  it('updates recording_url on recording.ready', async () => {
    await applyWebhookEvent('recording.ready', 'space-abc', {
      recording_url: 'https://recordings.juke.audio/session.mp4',
    });
    expect(mockUpdateJukeSpace).toHaveBeenCalledWith(
      'space-abc',
      expect.objectContaining({ recording_url: 'https://recordings.juke.audio/session.mp4' }),
    );
  });

  it('returns without DB calls for unknown event types', async () => {
    await applyWebhookEvent('some.unknown.event', 'space-abc', {});
    expect(mockUpdateJukeSpace).not.toHaveBeenCalled();
    expect(mockBumpParticipantCount).not.toHaveBeenCalled();
  });
});
