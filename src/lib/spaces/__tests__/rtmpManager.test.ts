// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  type BroadcastState,
  type BroadcastTarget,
  type RTMPCall,
  retryTarget,
  startBroadcast,
  stopAll,
  stopTarget,
} from '../rtmpManager';

// RTMPCall is injectable — no network calls needed for direct-mode tests.

function makeCall(opts?: { failStart?: boolean; failStop?: boolean }): RTMPCall {
  return {
    startRTMPBroadcasts: opts?.failStart
      ? async () => { throw new Error('RTMP start failed'); }
      : async () => {},
    stopRTMPBroadcast: opts?.failStop
      ? async () => { throw new Error('RTMP stop failed'); }
      : async () => {},
    stopAllRTMPBroadcasts: async () => {},
  };
}

function makeTarget(platform: string, status: BroadcastTarget['status'] = 'connecting'): BroadcastTarget {
  return {
    platform,
    name: `${platform} stream`,
    rtmpUrl: 'rtmp://live.example.com/live',
    streamKey: 'key123',
    status,
  };
}

function makeState(targets: BroadcastTarget[], isLive = true): BroadcastState {
  return { mode: 'direct', isLive, targets };
}

// ---------------------------------------------------------------------------
// stopTarget
// ---------------------------------------------------------------------------

describe('stopTarget', () => {
  it('throws when mode is relay', async () => {
    const state: BroadcastState = { mode: 'relay', isLive: true, targets: [makeTarget('twitch')] };
    await expect(stopTarget(makeCall(), state, 'twitch')).rejects.toThrow(
      'stopTarget is only supported in direct mode',
    );
  });

  it('throws when platform is not in targets', async () => {
    await expect(stopTarget(makeCall(), makeState([makeTarget('twitch')]), 'youtube')).rejects.toThrow(
      'Target not found: youtube',
    );
  });

  it('marks the target as stopped', async () => {
    const state = makeState([makeTarget('twitch', 'connected')]);
    const result = await stopTarget(makeCall(), state, 'twitch');
    const twitch = result.targets.find((t) => t.platform === 'twitch');
    expect(twitch?.status).toBe('stopped');
  });

  it('sets isLive=false when no other connected targets remain', async () => {
    const state = makeState([makeTarget('twitch', 'connected')]);
    const result = await stopTarget(makeCall(), state, 'twitch');
    expect(result.isLive).toBe(false);
  });

  it('keeps isLive=true when another target is still connected', async () => {
    const state = makeState([makeTarget('twitch', 'connected'), makeTarget('youtube', 'connected')]);
    const result = await stopTarget(makeCall(), state, 'twitch');
    expect(result.isLive).toBe(true);
  });

  it('still marks target stopped even when call.stopRTMPBroadcast throws', async () => {
    const state = makeState([makeTarget('twitch', 'connected')]);
    const result = await stopTarget(makeCall({ failStop: true }), state, 'twitch');
    expect(result.targets[0].status).toBe('stopped');
  });
});

// ---------------------------------------------------------------------------
// stopAll (direct mode)
// ---------------------------------------------------------------------------

describe('stopAll (direct mode)', () => {
  it('returns isLive=false', async () => {
    const state = makeState([makeTarget('twitch', 'connected'), makeTarget('youtube', 'connected')]);
    const result = await stopAll(makeCall(), state);
    expect(result.isLive).toBe(false);
  });

  it('marks all targets as stopped', async () => {
    const state = makeState([makeTarget('twitch', 'connected'), makeTarget('youtube', 'connected')]);
    const result = await stopAll(makeCall(), state);
    expect(result.targets.every((t) => t.status === 'stopped')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// retryTarget
// ---------------------------------------------------------------------------

describe('retryTarget', () => {
  it('throws when mode is relay', async () => {
    const state: BroadcastState = { mode: 'relay', isLive: true, targets: [makeTarget('twitch')] };
    await expect(retryTarget(makeCall(), state, 'twitch')).rejects.toThrow(
      'retryTarget is only supported in direct mode',
    );
  });

  it('throws when platform is not in targets', async () => {
    await expect(
      retryTarget(makeCall(), makeState([makeTarget('twitch')]), 'youtube'),
    ).rejects.toThrow('Target not found: youtube');
  });

  it('sets status to connected when call succeeds', async () => {
    const state = makeState([makeTarget('twitch', 'error')]);
    const result = await retryTarget(makeCall(), state, 'twitch');
    expect(result.targets[0].status).toBe('connected');
  });

  it('sets status to error when call fails', async () => {
    const state = makeState([makeTarget('twitch', 'error')]);
    const result = await retryTarget(makeCall({ failStart: true }), state, 'twitch');
    expect(result.targets[0].status).toBe('error');
    expect(result.targets[0].error).toBe('RTMP start failed');
  });

  it('sets isLive=true after a successful retry', async () => {
    const state = makeState([makeTarget('twitch', 'error')], false);
    const result = await retryTarget(makeCall(), state, 'twitch');
    expect(result.isLive).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// startBroadcast (direct mode)
// ---------------------------------------------------------------------------

describe('startBroadcast (direct mode)', () => {
  it('returns isLive=true when all targets connect', async () => {
    const targets = [makeTarget('twitch'), makeTarget('youtube')];
    const result = await startBroadcast(makeCall(), targets, 'direct', 'Test Room');
    expect(result.isLive).toBe(true);
    expect(result.targets.every((t) => t.status === 'connected')).toBe(true);
  });

  it('returns isLive=false when start fails', async () => {
    const targets = [makeTarget('twitch')];
    const result = await startBroadcast(makeCall({ failStart: true }), targets, 'direct', 'Test Room');
    expect(result.isLive).toBe(false);
    expect(result.targets[0].status).toBe('error');
    expect(result.targets[0].error).toBe('RTMP start failed');
  });

  it('sets mode to direct', async () => {
    const result = await startBroadcast(makeCall(), [makeTarget('twitch')], 'direct', 'Room');
    expect(result.mode).toBe('direct');
  });
});
