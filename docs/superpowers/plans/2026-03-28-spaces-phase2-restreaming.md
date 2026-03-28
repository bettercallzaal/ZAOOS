# Spaces Phase 2 — Restreaming Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire Stream.io native RTMP egress + Livepeer relay to broadcast live Spaces rooms to Twitch/YouTube/Kick/Facebook with a live status panel.

**Architecture:** rtmpManager orchestrates two modes — Direct (call.startRTMP per platform) and Relay (single RTMP to Livepeer, which multicasts). BroadcastModal gets a mode toggle. BroadcastPanel shows live status with per-platform controls. Broadcast status API polls stream health.

**Tech Stack:** Stream.io Video SDK (`call.startRTMP`/`call.stopRTMP`), Livepeer API (existing client), Next.js API routes

**Spec:** `docs/superpowers/specs/2026-03-28-spaces-phase2-restreaming-design.md`

---

## Task 1: RTMP Manager

**Files:**
- Create: `src/lib/spaces/rtmpManager.ts`

The core orchestrator. Manages broadcast state, routes to Direct or Relay mode, handles start/stop/retry per platform.

- [ ] **Step 1: Create rtmpManager.ts**

```typescript
import { createLivepeerStream, deleteLivepeerStream } from '@/lib/livepeer/client';

export interface BroadcastTarget {
  platform: string;
  name: string;
  rtmpUrl: string;
  streamKey: string;
  status: 'connecting' | 'connected' | 'error' | 'stopped';
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
  startedAt: string;
}

// Stream.io Call type — we use the methods on it, imported where used
interface StreamCall {
  startRTMP(params: { address: string }): Promise<void>;
  stopRTMP(params: { address: string }): Promise<void>;
}

export async function startBroadcast(
  call: StreamCall,
  targets: BroadcastTarget[],
  mode: 'direct' | 'relay',
  roomTitle: string
): Promise<BroadcastState> {
  const state: BroadcastState = {
    mode,
    isLive: true,
    targets: targets.map(t => ({ ...t, status: 'connecting', startedAt: new Date().toISOString() })),
    startedAt: new Date().toISOString(),
  };

  if (mode === 'direct') {
    // Start RTMP egress per platform
    for (let i = 0; i < state.targets.length; i++) {
      const target = state.targets[i];
      try {
        const address = target.streamKey
          ? `${target.rtmpUrl}/${target.streamKey}`
          : target.rtmpUrl;
        await call.startRTMP({ address });
        state.targets[i] = { ...target, status: 'connected' };
      } catch (err) {
        state.targets[i] = {
          ...target,
          status: 'error',
          error: err instanceof Error ? err.message : 'Failed to start RTMP',
        };
      }
    }
  } else {
    // Relay: create Livepeer multistream, push single RTMP to Livepeer
    try {
      const livepeerTargets = targets.map(t => ({
        platform: t.platform,
        rtmpUrl: t.rtmpUrl,
        streamKey: t.streamKey,
      }));
      const livepeerStream = await createLivepeerStream(roomTitle, livepeerTargets);
      state.livepeerStreamId = livepeerStream.id;
      state.livepeerIngestUrl = `${livepeerStream.rtmpIngestUrl}/${livepeerStream.streamKey}`;

      await call.startRTMP({ address: state.livepeerIngestUrl });

      // Mark all targets as connected (Livepeer handles distribution)
      state.targets = state.targets.map(t => ({ ...t, status: 'connected' }));
    } catch (err) {
      state.targets = state.targets.map(t => ({
        ...t,
        status: 'error',
        error: err instanceof Error ? err.message : 'Relay setup failed',
      }));
      state.isLive = false;
    }
  }

  return state;
}

export async function stopTarget(
  call: StreamCall,
  state: BroadcastState,
  platform: string
): Promise<BroadcastState> {
  if (state.mode !== 'direct') {
    throw new Error('Individual stop only available in Direct mode');
  }

  const target = state.targets.find(t => t.platform === platform);
  if (!target) return state;

  try {
    const address = target.streamKey
      ? `${target.rtmpUrl}/${target.streamKey}`
      : target.rtmpUrl;
    await call.stopRTMP({ address });
  } catch {}

  const updatedTargets = state.targets.map(t =>
    t.platform === platform ? { ...t, status: 'stopped' as const } : t
  );

  const anyLive = updatedTargets.some(t => t.status === 'connected' || t.status === 'connecting');

  return { ...state, targets: updatedTargets, isLive: anyLive };
}

export async function stopAll(
  call: StreamCall,
  state: BroadcastState
): Promise<void> {
  if (state.mode === 'relay' && state.livepeerStreamId && state.livepeerIngestUrl) {
    try { await deleteLivepeerStream(state.livepeerStreamId); } catch {}
    try { await call.stopRTMP({ address: state.livepeerIngestUrl }); } catch {}
  } else {
    for (const target of state.targets) {
      if (target.status === 'connected' || target.status === 'connecting') {
        try {
          const address = target.streamKey
            ? `${target.rtmpUrl}/${target.streamKey}`
            : target.rtmpUrl;
          await call.stopRTMP({ address });
        } catch {}
      }
    }
  }
}

export async function retryTarget(
  call: StreamCall,
  state: BroadcastState,
  platform: string
): Promise<BroadcastState> {
  if (state.mode !== 'direct') {
    throw new Error('Individual retry only available in Direct mode');
  }

  const target = state.targets.find(t => t.platform === platform);
  if (!target) return state;

  try {
    const address = target.streamKey
      ? `${target.rtmpUrl}/${target.streamKey}`
      : target.rtmpUrl;
    await call.startRTMP({ address });

    return {
      ...state,
      isLive: true,
      targets: state.targets.map(t =>
        t.platform === platform ? { ...t, status: 'connected' as const, error: undefined } : t
      ),
    };
  } catch (err) {
    return {
      ...state,
      targets: state.targets.map(t =>
        t.platform === platform
          ? { ...t, status: 'error' as const, error: err instanceof Error ? err.message : 'Retry failed' }
          : t
      ),
    };
  }
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/spaces/rtmpManager.ts
git commit -m "feat(spaces): RTMP manager — direct + relay broadcast orchestration"
```

---

## Task 2: Broadcast Status API

**Files:**
- Create: `src/app/api/broadcast/status/route.ts`

Endpoint for polling stream health during broadcast.

- [ ] **Step 1: Create status route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

const QuerySchema = z.object({
  roomId: z.string().uuid(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = Object.fromEntries(req.nextUrl.searchParams);
    const parsed = QuerySchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Fetch connected platforms for viewer count APIs
    const { data: platforms } = await supabaseAdmin
      .from('connected_platforms')
      .select('platform, access_token, metadata')
      .eq('user_fid', session.fid);

    const viewerCounts: Record<string, number | null> = {};

    if (platforms) {
      // Fetch viewer counts in parallel where possible
      const countPromises = platforms.map(async (p) => {
        try {
          if (p.platform === 'twitch' && p.access_token) {
            const res = await fetch('https://api.twitch.tv/helix/streams?user_login=' + (p.metadata as { login?: string })?.login, {
              headers: {
                'Authorization': `Bearer ${p.access_token}`,
                'Client-Id': process.env.TWITCH_CLIENT_ID ?? '',
              },
            });
            if (res.ok) {
              const data = await res.json();
              viewerCounts.twitch = data.data?.[0]?.viewer_count ?? null;
            }
          } else if (p.platform === 'youtube' && p.access_token) {
            const res = await fetch('https://www.googleapis.com/youtube/v3/liveBroadcasts?part=statistics&broadcastStatus=active', {
              headers: { 'Authorization': `Bearer ${p.access_token}` },
            });
            if (res.ok) {
              const data = await res.json();
              viewerCounts.youtube = data.items?.[0]?.statistics?.concurrentViewers
                ? parseInt(data.items[0].statistics.concurrentViewers)
                : null;
            }
          }
        } catch {
          // Viewer count is best-effort
        }
      });

      await Promise.allSettled(countPromises);
    }

    return NextResponse.json({ viewerCounts });
  } catch (error) {
    console.error('[broadcast/status] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/broadcast/status/
git commit -m "feat(spaces): broadcast status API — viewer count polling"
```

---

## Task 3: BroadcastPanel Component

**Files:**
- Create: `src/components/spaces/BroadcastPanel.tsx`

Expandable live status panel with per-platform controls.

- [ ] **Step 1: Create BroadcastPanel.tsx**

```typescript
'use client';

import { useState, useEffect, useRef } from 'react';
import type { BroadcastState, BroadcastTarget } from '@/lib/spaces/rtmpManager';

interface BroadcastPanelProps {
  state: BroadcastState;
  onStopTarget: (platform: string) => void;
  onRetryTarget: (platform: string) => void;
  onStopAll: () => void;
  roomId: string;
}

const STATUS_DOTS: Record<string, { color: string; label: string }> = {
  connecting: { color: 'bg-yellow-400', label: 'Connecting...' },
  connected: { color: 'bg-green-400', label: 'Connected' },
  error: { color: 'bg-red-400', label: 'Error' },
  stopped: { color: 'bg-gray-500', label: 'Stopped' },
};

const PLATFORM_ICONS: Record<string, string> = {
  twitch: '🟣',
  youtube: '📺',
  kick: '🟢',
  facebook: '🔵',
  custom: '📡',
};

export function BroadcastPanel({ state, onStopTarget, onRetryTarget, onStopAll, roomId }: BroadcastPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [uptime, setUptime] = useState(0);
  const [viewerCounts, setViewerCounts] = useState<Record<string, number | null>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Uptime timer
  useEffect(() => {
    if (state.isLive) {
      const start = new Date(state.startedAt).getTime();
      const tick = () => setUptime(Math.floor((Date.now() - start) / 1000));
      tick();
      intervalRef.current = setInterval(tick, 1000);
      return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }
  }, [state.isLive, state.startedAt]);

  // Poll viewer counts every 10s
  useEffect(() => {
    if (!state.isLive) return;
    const poll = async () => {
      try {
        const res = await fetch(`/api/broadcast/status?roomId=${roomId}`);
        if (res.ok) {
          const data = await res.json();
          setViewerCounts(data.viewerCounts ?? {});
        }
      } catch {}
    };
    poll();
    const id = setInterval(poll, 10_000);
    return () => clearInterval(id);
  }, [state.isLive, roomId]);

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
      : `${m}:${String(sec).padStart(2, '0')}`;
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-lg text-xs text-red-400"
      >
        <span className="animate-pulse">📡</span>
        <span>LIVE • {state.targets.filter(t => t.status === 'connected').length} platforms • {formatUptime(uptime)}</span>
        <span>▼</span>
      </button>
    );
  }

  return (
    <div className="bg-[#0d1b2a] border border-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="animate-pulse text-red-400">📡</span>
          <span className="text-white text-sm font-medium">BROADCASTING</span>
          <span className="text-gray-400 text-xs">{state.mode === 'relay' ? '🔄 Relay' : '⚡ Direct'}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-xs font-mono">{formatUptime(uptime)}</span>
          <button onClick={() => setExpanded(false)} className="text-gray-500 hover:text-white text-xs">▲</button>
        </div>
      </div>

      {/* Platform list */}
      <div className="p-3 space-y-2">
        {state.targets.map((target) => {
          const statusDot = STATUS_DOTS[target.status] ?? STATUS_DOTS.stopped;
          const viewers = viewerCounts[target.platform];
          const icon = PLATFORM_ICONS[target.platform] ?? '📡';

          return (
            <div key={target.platform} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>{icon}</span>
                <div>
                  <span className="text-sm text-white">{target.name}</span>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${statusDot.color}`} />
                    <span className="text-gray-500">{statusDot.label}</span>
                    {viewers != null && (
                      <span className="text-gray-400">{viewers} viewers</span>
                    )}
                    {target.error && (
                      <span className="text-red-400">{target.error}</span>
                    )}
                  </div>
                </div>
              </div>
              <div>
                {target.status === 'error' ? (
                  <button
                    onClick={() => onRetryTarget(target.platform)}
                    disabled={state.mode === 'relay'}
                    className="text-[10px] text-yellow-400 hover:text-yellow-300 disabled:opacity-30"
                  >
                    Retry
                  </button>
                ) : target.status === 'connected' || target.status === 'connecting' ? (
                  <button
                    onClick={() => onStopTarget(target.platform)}
                    disabled={state.mode === 'relay'}
                    className="text-[10px] text-red-400 hover:text-red-300 disabled:opacity-30"
                  >
                    Stop
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 px-3 py-2 border-t border-gray-800">
        <button
          onClick={onStopAll}
          className="text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-1 rounded"
        >
          Stop All
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/spaces/BroadcastPanel.tsx
git commit -m "feat(spaces): BroadcastPanel — live status with per-platform controls"
```

---

## Task 4: Wire Everything Together

**Files:**
- Modify: `src/components/spaces/BroadcastModal.tsx`
- Modify: `src/components/spaces/RoomView.tsx`
- Modify: `src/components/spaces/ControlsPanel.tsx`

- [ ] **Step 1: Update BroadcastModal with mode toggle**

Read `src/components/spaces/BroadcastModal.tsx` first. Add:

1. `mode` state: `'direct' | 'relay'`, default `'direct'`
2. Mode toggle UI between platform list and Go Live button:
```tsx
<div className="flex gap-2 mb-4">
  <button
    onClick={() => setMode('direct')}
    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
      mode === 'direct'
        ? 'bg-[#f5a623] text-[#0a1628]'
        : 'bg-white/5 text-gray-400 hover:bg-white/10'
    }`}
  >
    ⚡ Direct
    <div className="text-[9px] opacity-70 mt-0.5">Lower latency</div>
  </button>
  <button
    onClick={() => setMode('relay')}
    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
      mode === 'relay'
        ? 'bg-[#f5a623] text-[#0a1628]'
        : 'bg-white/5 text-gray-400 hover:bg-white/10'
    }`}
  >
    🔄 Relay
    <div className="text-[9px] opacity-70 mt-0.5">Stable for 3+</div>
  </button>
</div>
```
3. Hint when 3+ platforms selected in Direct mode:
```tsx
{mode === 'direct' && enabledCount >= 3 && (
  <p className="text-[10px] text-amber-400 mb-3">
    💡 Relay mode recommended for 3+ platforms
  </p>
)}
```
4. Update `onStartBroadcast` prop signature to include mode: `onStartBroadcast(targets, mode)`

- [ ] **Step 2: Update RoomView to manage broadcast lifecycle**

Read `src/components/spaces/RoomView.tsx` first. Add:

1. Import rtmpManager functions and BroadcastPanel
2. Add broadcast state:
```tsx
const [broadcastState, setBroadcastState] = useState<BroadcastState | null>(null);
```
3. Wire `handleStartBroadcast`:
```tsx
const handleStartBroadcast = async (targets: BroadcastTarget[], mode: 'direct' | 'relay') => {
  const call = useCall(); // from Stream.io context
  const state = await startBroadcast(call, targets, mode, room.title);
  setBroadcastState(state);
};
```
4. Wire stop/retry handlers that call rtmpManager functions and update state
5. Render BroadcastPanel when `broadcastState?.isLive` instead of BroadcastModal
6. Show BroadcastModal when not live, BroadcastPanel when live

- [ ] **Step 3: Update ControlsPanel broadcast button**

The broadcast button should show "📡 LIVE" badge when broadcasting:
```tsx
{isBroadcasting ? (
  <button onClick={onBroadcast} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/20 border border-red-500/30">
    <span className="animate-pulse text-red-400">📡</span>
    <span className="text-red-400 text-xs font-medium">LIVE</span>
  </button>
) : (
  <button onClick={onBroadcast} className="...existing styles...">
    📡 Broadcast
  </button>
)}
```

- [ ] **Step 4: Build and test**

```bash
npm run build
npx vitest run
```

- [ ] **Step 5: Commit**

```bash
git add src/components/spaces/BroadcastModal.tsx src/components/spaces/RoomView.tsx src/components/spaces/ControlsPanel.tsx
git commit -m "feat(spaces): wire restreaming — mode toggle, RTMP egress, live status panel"
```

- [ ] **Step 6: Push**

```bash
git push
```

---

## Summary: 4 Tasks, 4 Commits

| Task | What | New Files | Modified Files |
|------|------|-----------|----------------|
| 1 | RTMP Manager (direct + relay orchestration) | 1 | 0 |
| 2 | Broadcast status API (viewer count polling) | 1 | 0 |
| 3 | BroadcastPanel (live status UI) | 1 | 0 |
| 4 | Wire everything (modal toggle + RoomView + controls) | 0 | 3 |
