'use client';

import {
  HMSRoomProvider,
  selectBroadcastMessages,
  selectDominantSpeaker,
  selectIsConnectedToRoom,
  selectIsLocalAudioEnabled,
  selectIsLocalVideoEnabled,
  selectIsPeerAudioEnabled,
  selectPeers,
  selectScreenShareByPeerID,
  selectVideoTrackByPeerID,
  useHMSActions,
  useHMSStore,
  useScreenShare,
  useVideo,
} from '@100mslive/react-sdk';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

/**
 * Reusable 100ms audio/video room: video grid / active-speaker spotlight,
 * presenter view for screen share, emoji reactions, live transcription, and
 * conventional icon controls. Joins the room identified by `roomId` (preferred,
 * the per-room `room_id_100ms`) or `roomName` (find-or-create by name).
 *
 * Always passes the caller's FID as `userId` — the /api/100ms/token route
 * requires `userId === session.fid`. Used by both the production HMS room page
 * (/spaces/hms/[id]) and the isolated QA room (/spaces/audit-test).
 */

type Role = 'speaker' | 'listener';
type TileVariant = 'grid' | 'feature' | 'strip';

/** 100ms broadcast-message types over the data channel. */
const TRANSCRIPT_TYPE = 'transcript';
const REACTION_TYPE = 'reaction';
const REACTIONS = ['🔥', '👏', '❤️', '😂', '🎉'] as const;
/** Above this many participants, default to active-speaker spotlight over a grid. */
const SPOTLIGHT_THRESHOLD = 4;

// ---- Icons (20px, stroke = currentColor) ------------------------------------
const iconCls = 'h-5 w-5';
const MicIcon = () => (
  <svg
    className={iconCls}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" x2="12" y1="19" y2="22" />
  </svg>
);
const MicOffIcon = () => (
  <svg
    className={iconCls}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="2" x2="22" y1="2" y2="22" />
    <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
    <path d="M5 10v2a7 7 0 0 0 12 5.29" />
    <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
    <line x1="12" x2="12" y1="19" y2="22" />
  </svg>
);
const CamIcon = () => (
  <svg
    className={iconCls}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
    <rect x="2" y="6" width="14" height="12" rx="2" />
  </svg>
);
const CamOffIcon = () => (
  <svg
    className={iconCls}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M10.66 6H14a2 2 0 0 1 2 2v2.34l1 1L22 8v8" />
    <path d="M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </svg>
);
const ShareIcon = () => (
  <svg
    className={iconCls}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" x2="16" y1="21" y2="21" />
    <line x1="12" x2="12" y1="17" y2="21" />
  </svg>
);
const CaptionIcon = () => (
  <svg
    className={iconCls}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <line x1="8" y1="9" x2="16" y2="9" />
    <line x1="8" y1="13" x2="14" y2="13" />
  </svg>
);
const LeaveIcon = () => (
  <svg
    className={iconCls}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </svg>
);
const GridIcon = () => (
  <svg
    className={iconCls}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);
const SpeakerViewIcon = () => (
  <svg
    className={iconCls}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="4" width="18" height="11" rx="2" />
    <rect x="3" y="18" width="5" height="3" rx="1" />
    <rect x="10" y="18" width="5" height="3" rx="1" />
    <rect x="17" y="18" width="4" height="3" rx="1" />
  </svg>
);

// ---- Tiles ------------------------------------------------------------------
/** Renders a 100ms video track into a <video> element. */
function VideoTile({ trackId, isLocal }: { trackId: string; isLocal?: boolean }) {
  const { videoRef } = useVideo({ trackId });
  return (
    <video
      ref={videoRef}
      autoPlay
      muted={isLocal}
      playsInline
      className="h-full w-full object-cover"
    />
  );
}

/** Full-bleed screen-share surface (presenter view). */
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
    <div className="relative aspect-video max-h-[60vh] w-full overflow-hidden rounded-xl bg-black">
      <ScreenShareTile trackId={screenShare.id} />
      <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
        {peerName} is presenting
      </div>
    </div>
  );
}

interface PeerTileProps {
  peerId: string;
  peerName: string;
  isLocal: boolean;
  variant?: TileVariant;
  pinned?: boolean;
  onTogglePin?: (peerId: string) => void;
}

/** One participant: live video when their camera is on, else an avatar tile. */
function PeerTile({
  peerId,
  peerName,
  isLocal,
  variant = 'grid',
  pinned,
  onTogglePin,
}: PeerTileProps) {
  const videoTrack = useHMSStore(selectVideoTrackByPeerID(peerId));
  const isAudioEnabled = useHMSStore(selectIsPeerAudioEnabled(peerId));
  const dominantSpeaker = useHMSStore(selectDominantSpeaker);
  const isSpeaking = dominantSpeaker?.id === peerId;
  const hasVideo = Boolean(videoTrack?.enabled && videoTrack?.id);
  const initial = (peerName || '?')[0]?.toUpperCase() ?? '?';

  const sizeCls =
    variant === 'feature'
      ? 'aspect-video max-h-[60vh] w-full'
      : variant === 'strip'
        ? 'h-20 w-32 shrink-0'
        : 'aspect-video w-full';
  const avatarCls = variant === 'strip' ? 'h-8 w-8 text-sm' : 'h-12 w-12 text-lg';

  return (
    <div
      className={`group relative flex items-center justify-center overflow-hidden rounded-xl border bg-[#0d1b2a] transition-colors ${sizeCls} ${
        isSpeaking
          ? 'border-[#f5a623] shadow-[0_0_14px_rgba(245,166,35,0.35)]'
          : 'border-white/[0.08]'
      }`}
    >
      {hasVideo && videoTrack?.id ? (
        <VideoTile trackId={videoTrack.id} isLocal={isLocal} />
      ) : (
        <div
          className={`flex items-center justify-center rounded-full bg-gradient-to-br from-[#1a2a3a] to-[#0d1b2a] font-semibold text-white ${avatarCls}`}
        >
          {initial}
        </div>
      )}

      {onTogglePin && (
        <button
          type="button"
          onClick={() => onTogglePin(peerId)}
          aria-label={pinned ? `Unpin ${peerName}` : `Pin ${peerName}`}
          title={pinned ? 'Unpin' : 'Pin'}
          className={`absolute right-1 top-1 rounded-md px-1.5 py-0.5 text-[11px] leading-none transition ${
            pinned
              ? 'bg-[#f5a623] text-[#0a1628]'
              : 'bg-black/50 text-white opacity-0 group-hover:opacity-100'
          }`}
        >
          📌
        </button>
      )}

      <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[11px] text-white">
        {!isAudioEnabled && (
          <svg
            className="h-3 w-3 text-red-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5.586 5.586A2 2 0 005 7v0m1 4v1a6 6 0 006 6m0 0v3m0-3a6 6 0 003.293-.98M12 1a3 3 0 013 3v6M3 3l18 18"
            />
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

/** Horizontal scroll strip of small tiles (used beside the feature/presenter view). */
function Filmstrip({
  peers,
  pinnedId,
  onTogglePin,
}: {
  peers: { id: string; name: string; isLocal: boolean }[];
  pinnedId: string | null;
  onTogglePin: (peerId: string) => void;
}) {
  if (peers.length === 0) return null;
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {peers.map((p) => (
        <PeerTile
          key={p.id}
          peerId={p.id}
          peerName={p.name}
          isLocal={p.isLocal}
          variant="strip"
          pinned={pinnedId === p.id}
          onTogglePin={onTogglePin}
        />
      ))}
    </div>
  );
}

// ---- Reactions --------------------------------------------------------------
function Floater({ emoji, lane }: { emoji: string; lane: string }) {
  const [up, setUp] = useState(false);
  useEffect(() => {
    const r = requestAnimationFrame(() => setUp(true));
    return () => cancelAnimationFrame(r);
  }, []);
  return (
    <span
      className={`absolute bottom-3 ${lane} text-3xl transition-all duration-[1800ms] ease-out ${
        up ? '-translate-y-44 opacity-0' : 'translate-y-0 opacity-100'
      }`}
    >
      {emoji}
    </span>
  );
}

/** Floating emoji overlay — animates each newly-received reaction up and out. */
function ReactionLayer({ reactions }: { reactions: { id: string; message: string }[] }) {
  const [floaters, setFloaters] = useState<{ key: string; emoji: string; lane: string }[]>([]);
  const seen = useRef<Set<string>>(new Set());
  const initialized = useRef(false);
  const lanes = ['left-[15%]', 'left-[35%]', 'left-[55%]', 'left-[75%]'];

  useEffect(() => {
    for (const r of reactions) {
      if (seen.current.has(r.id)) continue;
      seen.current.add(r.id);
      if (!initialized.current) continue; // don't replay pre-existing reactions on mount
      const lane = lanes[Math.floor(Math.random() * lanes.length)];
      setFloaters((f) => [...f, { key: r.id, emoji: r.message, lane }]);
      setTimeout(() => setFloaters((f) => f.filter((x) => x.key !== r.id)), 2000);
    }
    initialized.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reactions]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {floaters.map((f) => (
        <Floater key={f.key} emoji={f.emoji} lane={f.lane} />
      ))}
    </div>
  );
}

// ---- Controls ---------------------------------------------------------------
function IconButton({
  tone,
  onClick,
  label,
  children,
}: {
  tone: 'neutral' | 'active' | 'danger';
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  const toneCls =
    tone === 'active'
      ? 'bg-[#f5a623] text-[#0a1628] hover:bg-[#ffd700]'
      : tone === 'danger'
        ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25'
        : 'border border-white/20 text-white hover:bg-white/10';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${toneCls}`}
    >
      {children}
    </button>
  );
}

function HMSVideoRoomInner({ roomId, roomName, role, onLeave }: HMSVideoRoomInnerProps) {
  const { user, loading: authLoading } = useAuth();
  const hmsActions = useHMSActions();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const isLocalAudioEnabled = useHMSStore(selectIsLocalAudioEnabled);
  const isLocalVideoEnabled = useHMSStore(selectIsLocalVideoEnabled);
  const peers = useHMSStore(selectPeers);
  const dominantSpeaker = useHMSStore(selectDominantSpeaker);
  const { screenSharingPeerId, screenSharingPeerName, toggleScreenShare } = useScreenShare();
  const [status, setStatus] = useState<'joining' | 'connected' | 'error'>('joining');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Layout: local pin + grid/speaker override (presenter view auto-wins when sharing).
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [viewOverride, setViewOverride] = useState<'grid' | 'speaker' | null>(null);
  const [captionsHidden, setCaptionsHidden] = useState(false);

  // Broadcast feed: transcription lines + emoji reactions share the data channel.
  const broadcastMessages = useHMSStore(selectBroadcastMessages);
  const transcriptLines = broadcastMessages.filter((m) => m.type === TRANSCRIPT_TYPE);
  const reactionMessages = broadcastMessages.filter((m) => m.type === REACTION_TYPE);
  const [transcribing, setTranscribing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const pendingTextRef = useRef('');

  const sendReaction = useCallback(
    (emoji: string) => {
      hmsActions.sendBroadcastMessage(emoji, REACTION_TYPE).catch(() => {});
    },
    [hmsActions],
  );

  const toggleTranscription = useCallback(() => {
    if (transcribing) {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      setTranscribing(false);
      return;
    }

    const hasSpeechApi = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    if (!hasSpeechApi) {
      setErrorMessage('Live transcription needs a Chromium browser (Chrome, Edge, Brave).');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const result of Array.from(event.results) as any[]) {
        const transcript = (result[0]?.transcript ?? '').trim();
        if (!transcript) continue;
        if (result.isFinal) {
          const text = `${pendingTextRef.current} ${transcript}`.trim();
          pendingTextRef.current = '';
          hmsActions.sendBroadcastMessage(text, TRANSCRIPT_TYPE).catch(() => {});
        } else {
          pendingTextRef.current = transcript;
        }
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (e: any) => {
      if (e.error === 'no-speech') return;
      setTranscribing(false);
      recognitionRef.current = null;
    };

    recognition.start();
    setTranscribing(true);
  }, [transcribing, hmsActions]);

  // Stop recognition on unmount.
  useEffect(() => () => recognitionRef.current?.stop(), []);

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
  const togglePin = (peerId: string) => setPinnedId((cur) => (cur === peerId ? null : peerId));

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
          If this says configuration missing, the 100ms env vars (NEXT_PUBLIC_100MS_ACCESS_KEY,
          HMS_APP_SECRET, NEXT_PUBLIC_100MS_TEMPLATE_ID) are not set on this environment.
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
    return (
      <div className="flex items-center justify-center py-10 text-gray-400">Joining the room…</div>
    );
  }

  const canPublish = role === 'speaker';

  // Layout decision: screen share → presenter view; else pin/spotlight → feature
  // tile + filmstrip; else uniform grid. Spotlight defaults on above the threshold.
  const screenShareActive = Boolean(screenSharingPeerId);
  const speakerPref = viewOverride
    ? viewOverride === 'speaker'
    : peers.length > SPOTLIGHT_THRESHOLD;
  const speakerView = !screenShareActive && (Boolean(pinnedId) || speakerPref);
  const featuredPeer =
    peers.find((p) => p.id === pinnedId) ??
    peers.find((p) => p.id === dominantSpeaker?.id) ??
    peers[0];
  const stripPeers = peers.filter((p) => p.id !== featuredPeer?.id);
  const canToggleView = !screenShareActive && peers.length > 1;

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
        {canToggleView && (
          <IconButton
            tone={speakerView ? 'active' : 'neutral'}
            onClick={() => {
              setPinnedId(null);
              setViewOverride(speakerView ? 'grid' : 'speaker');
            }}
            label={speakerView ? 'Switch to grid view' : 'Switch to speaker view'}
          >
            {speakerView ? <GridIcon /> : <SpeakerViewIcon />}
          </IconButton>
        )}
      </div>

      <div className="relative">
        {screenShareActive ? (
          <div className="flex flex-col gap-3">
            <ScreenShareView
              peerId={screenSharingPeerId!}
              peerName={screenSharingPeerName || 'Someone'}
            />
            <Filmstrip peers={peers} pinnedId={pinnedId} onTogglePin={togglePin} />
          </div>
        ) : speakerView && featuredPeer ? (
          <div className="flex flex-col gap-3">
            <PeerTile
              peerId={featuredPeer.id}
              peerName={featuredPeer.name}
              isLocal={featuredPeer.isLocal}
              variant="feature"
              pinned={pinnedId === featuredPeer.id}
              onTogglePin={togglePin}
            />
            <Filmstrip peers={stripPeers} pinnedId={pinnedId} onTogglePin={togglePin} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {peers.map((peer) => (
              <PeerTile
                key={peer.id}
                peerId={peer.id}
                peerName={peer.name}
                isLocal={peer.isLocal}
                pinned={pinnedId === peer.id}
                onTogglePin={togglePin}
              />
            ))}
          </div>
        )}
        <ReactionLayer reactions={reactionMessages} />
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.08] bg-[#0d1b2a] px-4 py-3">
        {canPublish ? (
          <>
            <IconButton
              tone={isLocalAudioEnabled ? 'neutral' : 'danger'}
              onClick={toggleMute}
              label={isLocalAudioEnabled ? 'Mute' : 'Unmute'}
            >
              {isLocalAudioEnabled ? <MicIcon /> : <MicOffIcon />}
            </IconButton>
            <IconButton
              tone={isLocalVideoEnabled ? 'active' : 'neutral'}
              onClick={toggleVideo}
              label={isLocalVideoEnabled ? 'Stop video' : 'Start video'}
            >
              {isLocalVideoEnabled ? <CamIcon /> : <CamOffIcon />}
            </IconButton>
            <IconButton
              tone={screenShareActive ? 'active' : 'neutral'}
              onClick={handleScreenShare}
              label={screenShareActive ? 'Stop sharing' : 'Share screen'}
            >
              <ShareIcon />
            </IconButton>
            <IconButton
              tone={transcribing ? 'active' : 'neutral'}
              onClick={toggleTranscription}
              label={transcribing ? 'Stop transcribing' : 'Transcribe'}
            >
              <CaptionIcon />
            </IconButton>
          </>
        ) : (
          <span className="text-xs text-gray-500">You joined as a listener — watching only.</span>
        )}

        {/* Reactions — available to everyone, including listeners. */}
        <div className="flex items-center gap-0.5">
          {REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => sendReaction(emoji)}
              aria-label={`Send ${emoji} reaction`}
              className="flex h-9 w-9 items-center justify-center rounded-full text-lg transition-colors hover:bg-white/10"
            >
              {emoji}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onLeave}
          className="ml-auto flex items-center gap-1.5 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600"
        >
          <LeaveIcon />
          Leave
        </button>
      </div>

      {(transcribing || transcriptLines.length > 0) && (
        <div className="rounded-xl border border-white/[0.08] bg-[#0d1b2a] px-4 py-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Live transcript
              {transcribing && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400">
                  <span
                    className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500"
                    aria-hidden="true"
                  />
                  REC
                </span>
              )}
              <span className="font-normal normal-case tracking-normal text-gray-600">
                auto-generated — may contain errors
              </span>
            </h3>
            <div className="flex items-center gap-3">
              {transcriptLines.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCaptionsHidden((h) => !h)}
                  aria-pressed={captionsHidden}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  {captionsHidden ? 'Show' : 'Hide'}
                </button>
              )}
              {transcriptLines.length > 0 && !captionsHidden && (
                <button
                  type="button"
                  onClick={() => {
                    const text = transcriptLines
                      .map((m) => `${m.senderName || 'Speaker'}: ${m.message}`)
                      .join('\n');
                    navigator.clipboard?.writeText(text).catch(() => {});
                  }}
                  className="text-xs text-[#f5a623] hover:underline"
                >
                  Copy
                </button>
              )}
            </div>
          </div>
          {captionsHidden ? null : transcriptLines.length === 0 ? (
            <p className="text-xs text-gray-500">
              Listening… speak and your words appear here for everyone.
            </p>
          ) : (
            <div className="max-h-48 space-y-1.5 overflow-y-auto text-base">
              {transcriptLines.slice(-40).map((m) => (
                <p key={m.id} className="leading-snug text-gray-200">
                  <span className="font-semibold text-white">{m.senderName || 'Speaker'}:</span>{' '}
                  {m.message}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface HMSVideoRoomInnerProps {
  roomId?: string;
  roomName?: string;
  role: Role;
  onLeave: () => void;
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
