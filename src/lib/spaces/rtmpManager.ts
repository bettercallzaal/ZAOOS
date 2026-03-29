import {
  createLivepeerStream,
  deleteLivepeerStream,
  type LivepeerStream,
} from '@/lib/livepeer/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TargetStatus = 'connecting' | 'connected' | 'error' | 'stopped';

export interface BroadcastTarget {
  platform: string;
  name: string;
  rtmpUrl: string;
  streamKey: string;
  status: TargetStatus;
  viewerCount?: number;
  startedAt?: string;
  error?: string;
}

export interface BroadcastState {
  mode: 'direct' | 'relay';
  isLive: boolean;
  targets: BroadcastTarget[];
  livepeerStreamId?: string;
  livepeerIngestUrl?: string;
  startedAt?: string;
}

/** Minimal call interface — avoids importing Stream.io SDK types. */
export interface RTMPCall {
  startRTMP(p: { address: string }): Promise<unknown>;
  stopRTMP(p: { address: string }): Promise<unknown>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rtmpAddress(target: BroadcastTarget): string {
  // Most platforms expect the key appended to the URL path
  const separator = target.rtmpUrl.endsWith('/') ? '' : '/';
  return `${target.rtmpUrl}${separator}${target.streamKey}`;
}

function updateTarget(
  targets: BroadcastTarget[],
  platform: string,
  patch: Partial<BroadcastTarget>,
): BroadcastTarget[] {
  return targets.map((t) =>
    t.platform === platform ? { ...t, ...patch } : t,
  );
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

export async function startBroadcast(
  call: RTMPCall,
  targets: BroadcastTarget[],
  mode: 'direct' | 'relay',
  roomTitle: string,
): Promise<BroadcastState> {
  const now = new Date().toISOString();

  if (mode === 'relay') {
    return startRelay(call, targets, roomTitle, now);
  }
  return startDirect(call, targets, now);
}

async function startDirect(
  call: RTMPCall,
  targets: BroadcastTarget[],
  now: string,
): Promise<BroadcastState> {
  const updated = await Promise.all(
    targets.map(async (target): Promise<BroadcastTarget> => {
      try {
        await call.startRTMP({ address: rtmpAddress(target) });
        return { ...target, status: 'connected', startedAt: now };
      } catch (err) {
        return {
          ...target,
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error',
        };
      }
    }),
  );

  return {
    mode: 'direct',
    isLive: updated.some((t) => t.status === 'connected'),
    targets: updated,
    startedAt: now,
  };
}

async function startRelay(
  call: RTMPCall,
  targets: BroadcastTarget[],
  roomTitle: string,
  now: string,
): Promise<BroadcastState> {
  // 1. Create Livepeer multistream — it fans out to all targets
  let stream: LivepeerStream;
  try {
    stream = await createLivepeerStream(
      `zao-${roomTitle.replace(/\s+/g, '-').toLowerCase()}`,
      targets.map((t) => ({
        platform: t.platform,
        rtmpUrl: t.rtmpUrl,
        streamKey: t.streamKey,
      })),
    );
  } catch (err) {
    // If Livepeer creation fails, mark all targets as errored
    return {
      mode: 'relay',
      isLive: false,
      targets: targets.map((t) => ({
        ...t,
        status: 'error' as const,
        error: err instanceof Error ? err.message : 'Livepeer stream creation failed',
      })),
      startedAt: now,
    };
  }

  // 2. Push single RTMP from the call to Livepeer ingest
  const ingestUrl = `${stream.rtmpIngestUrl}/${stream.streamKey}`;
  try {
    await call.startRTMP({ address: ingestUrl });
  } catch (err) {
    // Clean up the Livepeer stream we just created
    await deleteLivepeerStream(stream.id).catch(() => {});
    return {
      mode: 'relay',
      isLive: false,
      targets: targets.map((t) => ({
        ...t,
        status: 'error' as const,
        error: err instanceof Error ? err.message : 'Failed to push RTMP to Livepeer',
      })),
      startedAt: now,
    };
  }

  return {
    mode: 'relay',
    isLive: true,
    targets: targets.map((t) => ({ ...t, status: 'connected' as const, startedAt: now })),
    livepeerStreamId: stream.id,
    livepeerIngestUrl: ingestUrl,
    startedAt: now,
  };
}

// ---------------------------------------------------------------------------
// Stop single target (direct mode only)
// ---------------------------------------------------------------------------

export async function stopTarget(
  call: RTMPCall,
  state: BroadcastState,
  platform: string,
): Promise<BroadcastState> {
  if (state.mode !== 'direct') {
    throw new Error('stopTarget is only supported in direct mode — use stopAll for relay');
  }

  const target = state.targets.find((t) => t.platform === platform);
  if (!target) throw new Error(`Target not found: ${platform}`);

  try {
    await call.stopRTMP({ address: rtmpAddress(target) });
  } catch {
    // Best-effort stop — still mark as stopped
  }

  const targets = updateTarget(state.targets, platform, { status: 'stopped' });
  return {
    ...state,
    targets,
    isLive: targets.some((t) => t.status === 'connected'),
  };
}

// ---------------------------------------------------------------------------
// Stop all
// ---------------------------------------------------------------------------

export async function stopAll(
  call: RTMPCall,
  state: BroadcastState,
): Promise<BroadcastState> {
  if (state.mode === 'relay') {
    // Delete Livepeer stream (stops all multistream targets)
    if (state.livepeerStreamId) {
      await deleteLivepeerStream(state.livepeerStreamId).catch(() => {});
    }
    // Stop the single RTMP from the call to Livepeer
    if (state.livepeerIngestUrl) {
      await call.stopRTMP({ address: state.livepeerIngestUrl }).catch(() => {});
    }
  } else {
    // Direct mode — stop each target individually
    await Promise.allSettled(
      state.targets
        .filter((t) => t.status === 'connected')
        .map((t) => call.stopRTMP({ address: rtmpAddress(t) })),
    );
  }

  return {
    ...state,
    isLive: false,
    targets: state.targets.map((t) => ({ ...t, status: 'stopped' as const })),
    livepeerStreamId: undefined,
    livepeerIngestUrl: undefined,
  };
}

// ---------------------------------------------------------------------------
// Retry single target (direct mode only)
// ---------------------------------------------------------------------------

export async function retryTarget(
  call: RTMPCall,
  state: BroadcastState,
  platform: string,
): Promise<BroadcastState> {
  if (state.mode !== 'direct') {
    throw new Error('retryTarget is only supported in direct mode');
  }

  const target = state.targets.find((t) => t.platform === platform);
  if (!target) throw new Error(`Target not found: ${platform}`);

  let patch: Partial<BroadcastTarget>;
  try {
    await call.startRTMP({ address: rtmpAddress(target) });
    patch = { status: 'connected', startedAt: new Date().toISOString(), error: undefined };
  } catch (err) {
    patch = {
      status: 'error',
      error: err instanceof Error ? err.message : 'Retry failed',
    };
  }

  const targets = updateTarget(state.targets, platform, patch);
  return {
    ...state,
    targets,
    isLive: targets.some((t) => t.status === 'connected'),
  };
}
