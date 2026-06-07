'use client';

import { useEffect, useState } from 'react';
import {
  HMSRoomProvider,
  useHMSActions,
  useHMSStore,
  selectIsConnectedToRoom,
  selectPeers,
  selectIsLocalAudioEnabled,
  selectDominantSpeaker,
} from '@100mslive/react-sdk';
import { useAuth } from '@/hooks/useAuth';

/**
 * Isolated multiplayer test room for spaces QA. Everyone who opens
 * /spaces/audit-test joins the SAME pinned 100ms room, so opening the page in
 * two browsers (or with a teammate) is a full multiplayer test — without
 * touching the main /spaces flow or the `rooms` Supabase table.
 *
 * Unlike `HMSRoom`, this passes the caller's FID as `userId` (the token route
 * requires `userId === session.fid`) and requests the `speaker` role so any
 * authenticated tester can actually talk during the test.
 */

// Fixed room name → all testers share one room. Auto-provisioned 100ms-side by
// the token route; no DB row needed.
const TEST_ROOM_NAME = 'zao-audit-test';

type Role = 'speaker' | 'listener';

function PeerList() {
  const peers = useHMSStore(selectPeers);
  const dominantSpeaker = useHMSStore(selectDominantSpeaker);

  return (
    <ul className="flex flex-col gap-2">
      {peers.map((peer) => {
        const isSpeaking = dominantSpeaker?.id === peer.id;
        return (
          <li
            key={peer.id}
            className={`flex items-center justify-between rounded-lg border px-3 py-2 transition-colors ${
              isSpeaking
                ? 'border-[#f5a623] bg-[#f5a623]/10'
                : 'border-white/[0.08] bg-[#0d1b2a]'
            }`}
          >
            <span className="flex items-center gap-2 text-sm text-white">
              <span
                className={`h-2 w-2 rounded-full ${
                  isSpeaking ? 'bg-[#f5a623]' : 'bg-gray-600'
                }`}
              />
              {peer.name}
              {peer.isLocal && (
                <span className="text-[10px] text-gray-500">(you)</span>
              )}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-gray-500">
              {peer.roleName}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function AuditTestRoomInner({ role }: { role: Role }) {
  const { user } = useAuth();
  const hmsActions = useHMSActions();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const isLocalAudioEnabled = useHMSStore(selectIsLocalAudioEnabled);
  const peers = useHMSStore(selectPeers);
  const [status, setStatus] = useState<'joining' | 'connected' | 'error'>(
    'joining',
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.fid) return;
    let cancelled = false;

    const join = async () => {
      setStatus('joining');
      setErrorMessage(null);
      try {
        const res = await fetch('/api/100ms/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: String(user.fid),
            role,
            roomName: TEST_ROOM_NAME,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.token) {
          throw new Error(data.error || 'Failed to get room token');
        }
        if (cancelled) return;
        await hmsActions.join({
          userName: user.displayName || user.username || `fid-${user.fid}`,
          authToken: data.token,
        });
      } catch (err: unknown) {
        if (cancelled) return;
        setErrorMessage(err instanceof Error ? err.message : 'Failed to join');
        setStatus('error');
      }
    };

    join();
    return () => {
      cancelled = true;
      hmsActions.leave().catch(() => {});
    };
  }, [user?.fid, user?.displayName, user?.username, role, hmsActions]);

  useEffect(() => {
    if (isConnected) setStatus('connected');
  }, [isConnected]);

  const toggleMute = async () => {
    await hmsActions.setLocalAudioEnabled(!isLocalAudioEnabled);
  };

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="text-red-400">{errorMessage}</p>
        <p className="max-w-sm text-xs text-gray-500">
          If this says configuration missing, the 100ms env vars
          (NEXT_PUBLIC_100MS_ACCESS_KEY, HMS_APP_SECRET,
          NEXT_PUBLIC_100MS_TEMPLATE_ID) are not set on this environment.
        </p>
      </div>
    );
  }

  if (status === 'joining') {
    return (
      <div className="flex items-center justify-center py-10 text-gray-400">
        Joining the test room…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-[#0d1b2a] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          <span className="text-sm font-medium text-white">Live</span>
          <span className="text-xs text-gray-500">{peers.length} in room</span>
        </div>
        {role === 'speaker' && (
          <button
            type="button"
            onClick={toggleMute}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
              isLocalAudioEnabled
                ? 'bg-[#f5a623] text-[#0a1628] hover:bg-[#ffd700]'
                : 'border border-white/20 text-white hover:bg-white/10'
            }`}
          >
            {isLocalAudioEnabled ? 'Mute' : 'Unmute'}
          </button>
        )}
      </div>

      <PeerList />
    </div>
  );
}

interface AuditTestRoomProps {
  role: Role;
}

export default function AuditTestRoom({ role }: AuditTestRoomProps) {
  return (
    <HMSRoomProvider>
      <AuditTestRoomInner role={role} />
    </HMSRoomProvider>
  );
}
