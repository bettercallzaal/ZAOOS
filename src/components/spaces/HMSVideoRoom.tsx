'use client';

import { useEffect, useState } from 'react';
import {
  HMSRoomProvider,
  useHMSActions,
  useHMSStore,
  useVideo,
  useScreenShare,
  selectIsConnectedToRoom,
  selectPeers,
  selectIsLocalAudioEnabled,
  selectIsLocalVideoEnabled,
  selectVideoTrackByPeerID,
  selectScreenShareByPeerID,
  selectIsPeerAudioEnabled,
  selectDominantSpeaker,
} from '@100mslive/react-sdk';
import { useAuth } from '@/hooks/useAuth';

/**
 * Reusable 100ms audio/video room: live video grid, screen share, and
 * mic/camera/share controls. Joins the room identified by `roomId` (preferred,
 * the per-room `room_id_100ms`) or `roomName` (find-or-create by name).
 *
 * Always passes the caller's FID as `userId` — the /api/100ms/token route
 * requires `userId === session.fid`. Used by both the production HMS room page
 * (/spaces/hms/[id]) and the isolated QA room (/spaces/audit-test).
 */

type Role = 'speaker' | 'listener';

/** Renders a 100ms video track into a <video> element. */
function VideoTile({ trackId, isLocal }: { trackId: string; isLocal?: boolean }) {
  const { videoRef } = useVideo({ trackId });
  return (
    <video ref={videoRef} autoPlay muted={isLocal} playsInline className="h-full w-full object-cover" />
  );
}

/** Full-width screen-share surface. */
function ScreenShareTile({ trackId }: { trackId: string }) {
  const { videoRef } = useVideo({ trackId });
  return (
    <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-contain" />
  );
}

function ScreenShareView({ peerId, peerName }: { peerId: string; peerName: string }) {
  const screenShare = useHMSStore(selectScreenShareByPeerID(peerId));
  if (!screenShare?.id) return null;
  return (
    <div className="relative mb-4 max-h-[420px] w-full overflow-hidden rounded-xl bg-black aspect-video">
      <ScreenShareTile trackId={screenShare.id} />
      <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
        {peerName} is sharing their screen
      </div>
    </div>
  );
}

/** One participant: live video when their camera is on, else an avatar tile. */
function PeerTile({ peerId, peerName, isLocal }: { peerId: string; peerName: string; isLocal: boolean }) {
  const videoTrack = useHMSStore(selectVideoTrackByPeerID(peerId));
  const isAudioEnabled = useHMSStore(selectIsPeerAudioEnabled(peerId));
  const dominantSpeaker = useHMSStore(selectDominantSpeaker);
  const isSpeaking = dominantSpeaker?.id === peerId;
  const hasVideo = Boolean(videoTrack?.enabled && videoTrack?.id);
  const initial = (peerName || '?')[0]?.toUpperCase() ?? '?';

  return (
    <div
      className={`relative flex aspect-video items-center justify-center overflow-hidden rounded-xl border bg-[#0d1b2a] transition-colors ${
        isSpeaking ? 'border-[#f5a623] shadow-[0_0_14px_rgba(245,166,35,0.35)]' : 'border-white/[0.08]'
      }`}
    >
      {hasVideo && videoTrack?.id ? (
        <VideoTile trackId={videoTrack.id} isLocal={isLocal} />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#1a2a3a] to-[#0d1b2a] text-lg font-semibold text-white">
          {initial}
        </div>
      )}
      <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[11px] text-white">
        {!isAudioEnabled && (
          <svg className="h-3 w-3 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 5.586A2 2 0 005 7v0m1 4v1a6 6 0 006 6m0 0v3m0-3a6 6 0 003.293-.98M12 1a3 3 0 013 3v6M3 3l18 18" />
          </svg>
        )}
        <span className="max-w-[7rem] truncate">
          {peerName}
          {isLocal && ' (you)'}
        </span>
      </div>
    </div>
  );
}

interface ControlButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  activeLabel: string;
}

function ControlButton({ active, onClick, label, activeLabel }: ControlButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
        active
          ? 'bg-[#f5a623] text-[#0a1628] hover:bg-[#ffd700]'
          : 'border border-white/20 text-white hover:bg-white/10'
      }`}
    >
      {active ? activeLabel : label}
    </button>
  );
}

interface HMSVideoRoomInnerProps {
  roomId?: string;
  roomName?: string;
  role: Role;
  onLeave: () => void;
}

function HMSVideoRoomInner({ roomId, roomName, role, onLeave }: HMSVideoRoomInnerProps) {
  const { user, loading: authLoading } = useAuth();
  const hmsActions = useHMSActions();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const isLocalAudioEnabled = useHMSStore(selectIsLocalAudioEnabled);
  const isLocalVideoEnabled = useHMSStore(selectIsLocalVideoEnabled);
  const peers = useHMSStore(selectPeers);
  const { screenSharingPeerId, screenSharingPeerName, toggleScreenShare } = useScreenShare();
  const [status, setStatus] = useState<'joining' | 'connected' | 'error'>('joining');
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
            ...(roomId ? { roomId } : { roomName }),
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
          // Join with mic + camera OFF — users opt in via the controls. Avoids
          // broadcasting a camera the moment you land, and means listeners
          // (no controls) never publish.
          settings: { isAudioMuted: true, isVideoMuted: true },
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
  }, [user?.fid, user?.displayName, user?.username, role, roomId, roomName, hmsActions]);

  useEffect(() => {
    if (isConnected) setStatus('connected');
  }, [isConnected]);

  const toggleMute = async () => {
    await hmsActions.setLocalAudioEnabled(!isLocalAudioEnabled);
  };
  const toggleVideo = async () => {
    await hmsActions.setLocalVideoEnabled(!isLocalVideoEnabled);
  };
  const handleScreenShare = async () => {
    try {
      await toggleScreenShare?.();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Screen share failed');
    }
  };

  if (!authLoading && !user?.fid) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="text-white">Sign in to join this room.</p>
        <a
          href="/"
          className="rounded-lg bg-[#f5a623] px-4 py-2 text-sm font-semibold text-[#0a1628] hover:bg-[#ffd700]"
        >
          Sign in
        </a>
        <button
          type="button"
          onClick={onLeave}
          className="rounded-lg border border-white/20 px-4 py-1.5 text-sm text-white hover:bg-white/10"
        >
          Back
        </button>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="text-red-400">{errorMessage}</p>
        <p className="max-w-sm text-xs text-gray-500">
          If this says configuration missing, the 100ms env vars
          (NEXT_PUBLIC_100MS_ACCESS_KEY, HMS_APP_SECRET, NEXT_PUBLIC_100MS_TEMPLATE_ID)
          are not set on this environment.
        </p>
        <button
          type="button"
          onClick={onLeave}
          className="rounded-lg border border-white/20 px-4 py-1.5 text-sm text-white hover:bg-white/10"
        >
          Back
        </button>
      </div>
    );
  }

  if (status === 'joining') {
    return <div className="flex items-center justify-center py-10 text-gray-400">Joining the room…</div>;
  }

  const canPublish = role === 'speaker';

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
      </div>

      {screenSharingPeerId && (
        <ScreenShareView peerId={screenSharingPeerId} peerName={screenSharingPeerName || 'Someone'} />
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {peers.map((peer) => (
          <PeerTile key={peer.id} peerId={peer.id} peerName={peer.name} isLocal={peer.isLocal} />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.08] bg-[#0d1b2a] px-4 py-3">
        {canPublish ? (
          <>
            <ControlButton active={isLocalAudioEnabled} onClick={toggleMute} label="Unmute" activeLabel="Mute" />
            <ControlButton active={isLocalVideoEnabled} onClick={toggleVideo} label="Start video" activeLabel="Stop video" />
            <ControlButton
              active={Boolean(screenSharingPeerId)}
              onClick={handleScreenShare}
              label="Share screen"
              activeLabel="Stop sharing"
            />
          </>
        ) : (
          <span className="text-xs text-gray-500">You joined as a listener — watching only.</span>
        )}
        <button
          type="button"
          onClick={onLeave}
          className="ml-auto rounded-lg border border-white/20 px-4 py-2 text-sm text-white transition-colors hover:bg-white/10"
        >
          Leave room
        </button>
      </div>
    </div>
  );
}

export interface HMSVideoRoomProps {
  /** Explicit 100ms room id (preferred — the per-room `room_id_100ms`). */
  roomId?: string;
  /** Room name to find-or-create when no roomId is available. */
  roomName?: string;
  role: Role;
  onLeave: () => void;
}

export default function HMSVideoRoom({ roomId, roomName, role, onLeave }: HMSVideoRoomProps) {
  return (
    <HMSRoomProvider>
      <HMSVideoRoomInner roomId={roomId} roomName={roomName} role={role} onLeave={onLeave} />
    </HMSRoomProvider>
  );
}
