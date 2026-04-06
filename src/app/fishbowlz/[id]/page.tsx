'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { TranscriptInput } from '@/components/spaces/TranscriptInput';
import { FishbowlChat } from '@/components/spaces/FishbowlChat';
import { Reactions } from '@/components/fishbowlz/Reactions';
import { TipButton } from '@/components/fishbowlz/TipButton';
import { useToast, ToastProvider } from '@/components/ui/Toast';
import dynamic from 'next/dynamic';
import { ShareModal } from '@/components/shared/ShareModal';

function parseJsonb<T>(value: unknown, fallback: T): T {
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return fallback; }
  }
  return (value as T) ?? fallback;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function SpeakerTime({ joinedAt }: { joinedAt: string }) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const update = () => {
      const seconds = Math.floor((Date.now() - new Date(joinedAt).getTime()) / 1000);
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      setElapsed(`${mins}:${secs.toString().padStart(2, '0')}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [joinedAt]);

  return <span className="text-[10px] text-gray-500 font-mono">{elapsed}</span>;
}

function Countdown({ targetDate }: { targetDate: string }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    const update = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining('Starting soon...');
        return;
      }
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      if (hours > 0) {
        setRemaining(`${hours}h ${mins}m ${secs}s`);
      } else {
        setRemaining(`${mins}m ${secs}s`);
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return <span className="text-2xl font-mono font-bold text-[#f5a623]">{remaining}</span>;
}

const HMSFishbowlRoom = dynamic(
  () => import('@/components/spaces/HMSFishbowlRoom').then((m) => m.HMSFishbowlRoom),
  { ssr: false }
);

interface Speaker {
  fid: number;
  username: string;
  joinedAt: string;
}

interface FishbowlRoom {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  host_fid: number;
  host_name: string;
  host_username: string;
  state: string;
  hot_seat_count: number;
  rotation_enabled: boolean;
  rotation_interval_ms?: number | null;
  current_speakers: Speaker[];
  current_listeners: Speaker[];
  hand_raises?: Array<{ fid: number; username: string; joinedAt: string }>;
  audio_source_type: string | null;
  audio_source_url: string | null;
  created_at: string;
  scheduled_at?: string | null;
  ai_summary?: string | null;
}

interface TranscriptSegment {
  id: string;
  speaker_name: string;
  speaker_role: string;
  text: string;
  started_at: string;
}

// ─── Inner component (needs ToastProvider above it) ──────────────────────────

function FishbowlRoomPageInner() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [room, setRoom] = useState<FishbowlRoom | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioJoined, setAudioJoined] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [gateError, setGateError] = useState<{ message: string; details?: string } | null>(null);
  const [showEndedOverlay, setShowEndedOverlay] = useState(false);
  const [endedCountdown, setEndedCountdown] = useState(5);
  const endedRoomRef = useRef<FishbowlRoom | null>(null);
  const [guidanceDismissed, setGuidanceDismissed] = useState(false);
  const transcriptBottomRef = useRef<HTMLDivElement>(null);

  const isHost = user?.fid === room?.host_fid;
  const isSpeaker = room?.current_speakers?.some((s) => s.fid === user?.fid);
  const isListener = room?.current_listeners?.some((l) => l.fid === user?.fid);
  const hotSeatFull = (room?.current_speakers?.length || 0) >= (room?.hot_seat_count || 0);

  const isChrome = typeof navigator !== 'undefined' && /Chrome/.test(navigator.userAgent) && !/Edge|OPR/.test(navigator.userAgent);
  const showGuidance = !guidanceDismissed && !isSpeaker && !isListener && room?.state === 'active';
  const guidanceMessage = !isChrome
    ? 'Live transcription works best in Chrome. Audio works in all browsers.'
    : 'Allow microphone access when prompted to join as a speaker.';

  const fetchRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/fishbowlz/rooms/${roomId}`);
      if (!res.ok) throw new Error('Room not found');
      const data = await res.json();
      // Parse JSONB strings from Supabase
      data.current_speakers = parseJsonb(data.current_speakers, []);
      data.current_listeners = parseJsonb(data.current_listeners, []);
      data.hand_raises = parseJsonb(data.hand_raises, []);

      if (data.state === 'ended') {
        setAudioJoined(false);
        // Only show interstitial if the user was actively participating when the room ended.
        // If navigating directly to an ended room URL, show the transcript archive instead.
        setRoom((prev) => {
          if (prev && prev.state === 'active') {
            const wasParticipating =
              prev.current_speakers?.some((s) => s.fid === user?.fid) ||
              prev.current_listeners?.some((l) => l.fid === user?.fid);
            if (wasParticipating) {
              endedRoomRef.current = data;
              setShowEndedOverlay(true);
            }
          }
          return data;
        });
        return;
      }

      setRoom(data);
    } catch {
      setError('Room not found');
    } finally {
      setLoading(false);
    }
  }, [roomId, user?.fid]);

  const fetchTranscripts = useCallback(async () => {
    if (!room?.id) return;
    try {
      const res = await fetch(`/api/fishbowlz/transcripts?roomId=${room.id}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setTranscripts(data.transcripts || []);
      }
    } catch {
      // Non-critical
    }
  }, [room?.id]);

  useEffect(() => {
    if (authLoading) return;
    if (!roomId) return;

    fetchRoom();
    fetchTranscripts();

    const interval = setInterval(fetchRoom, 5000);
    const transcriptInterval = setInterval(fetchTranscripts, 10000);

    return () => {
      clearInterval(interval);
      clearInterval(transcriptInterval);
    };
  }, [roomId, authLoading, fetchRoom, fetchTranscripts]);

  // Heartbeat: keep user presence alive (every 45s)
  useEffect(() => {
    if (!user || !roomId || (!isSpeaker && !isListener)) return;

    const sendHeartbeat = () => {
      fetch(`/api/fishbowlz/rooms/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'heartbeat', fid: user.fid }),
      }).catch(() => {});
    };

    sendHeartbeat();
    const heartbeatInterval = setInterval(sendHeartbeat, 45_000);

    return () => clearInterval(heartbeatInterval);
  }, [user, roomId, isSpeaker, isListener]);

  // beforeunload: fire a leave request when the tab is closed
  useEffect(() => {
    if (!user || !roomId || (!isSpeaker && !isListener)) return;

    const handleBeforeUnload = () => {
      const action = isSpeaker ? 'leave_speaker' : 'leave_listener';
      fetch(`/api/fishbowlz/rooms/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, fid: user.fid }),
        keepalive: true,
      }).catch(() => {});
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user, roomId, isSpeaker, isListener]);

  // Auto-rotation timer
  useEffect(() => {
    if (!isHost || !room?.rotation_interval_ms || room.state !== 'active') return;
    if (!room.current_speakers || room.current_speakers.length === 0) return;

    const checkRotation = () => {
      const oldest = room.current_speakers[0];
      if (!oldest) return;
      const seatedMs = Date.now() - new Date(oldest.joinedAt).getTime();
      if (seatedMs >= room.rotation_interval_ms!) {
        // Auto-rotate: kick the oldest speaker
        fetch(`/api/fishbowlz/rooms/${roomId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'kick_speaker', targetFid: oldest.fid }),
        }).then(() => fetchRoom()).catch(() => {});
      }
    };

    const interval = setInterval(checkRotation, 10000); // check every 10s
    return () => clearInterval(interval);
  }, [isHost, room?.rotation_interval_ms, room?.state, room?.current_speakers, roomId, fetchRoom]);

  // Check if guidance was previously dismissed
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('fishbowlz-guidance-dismissed')) {
      setGuidanceDismissed(true);
    }
  }, []);

  // Auto-scroll transcript to bottom when new transcripts arrive
  useEffect(() => {
    transcriptBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  // Countdown for ended room interstitial
  useEffect(() => {
    if (!showEndedOverlay) return;
    if (endedCountdown <= 0) {
      router.push('/fishbowlz');
      return;
    }
    const timer = setTimeout(() => setEndedCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [showEndedOverlay, endedCountdown, router]);

  const endRoom = async () => {
    const res = await fetch(`/api/fishbowlz/rooms/${roomId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'end_room' }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      toast(errData.error || 'Failed to end room', 'error');
      return;
    }
    router.push('/fishbowlz');
  };

  const joinAsSpeaker = async () => {
    if (!user || joining) return;
    setJoining(true);
    setGateError(null);
    try {
      const res = await fetch(`/api/fishbowlz/rooms/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join_speaker', fid: user.fid, username: user.username }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 403 && errData.reason) {
          const score = errData.score ? ` Your score: ${errData.score}.` : '';
          setGateError({
            message: errData.error || 'You don\'t meet the requirements to join.',
            details: errData.reason + score,
          });
        } else {
          toast(errData.error || 'Failed to join', 'error');
        }
        return;
      }
      await fetchRoom();
      setAudioJoined(true);
    } finally {
      setJoining(false);
    }
  };

  const joinAsListener = async () => {
    if (!user || joining) return;
    setJoining(true);
    try {
      const res = await fetch(`/api/fishbowlz/rooms/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join_listener', fid: user.fid, username: user.username }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast(errData.error || 'Failed to join', 'error');
        return;
      }
      await fetchRoom();
      setAudioJoined(true);
    } finally {
      setJoining(false);
    }
  };

  const rotateIn = async () => {
    if (!user || joining) return;
    setJoining(true);
    try {
      await fetch(`/api/fishbowlz/rooms/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rotate_in', listenerFid: user.fid, listenerUsername: user.username }),
      });
      await fetchRoom();
    } finally {
      setJoining(false);
    }
  };

  const leave = async () => {
    if (!user) return;
    const res = await fetch(`/api/fishbowlz/rooms/${roomId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'leave_speaker', fid: user.fid }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      toast(errData.error || 'Failed to leave', 'error');
      return;
    }
    await fetchRoom();
    setAudioJoined(false);
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#0a1628] text-white flex items-center justify-center">
        <div className="text-gray-400">Loading fishbowl...</div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-[#0a1628] text-white flex flex-col items-center justify-center">
        <p className="text-gray-400 mb-4">{error || 'Room not found'}</p>
        <button onClick={() => router.push('/fishbowlz')} className="text-[#f5a623] hover:underline">
          ← Back to rooms
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1628] text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-white/10 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => router.push('/fishbowlz')} className="text-gray-400 hover:text-white shrink-0 p-1">
            ←
          </button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold truncate">{room.title}</h1>
            <p className="text-xs sm:text-sm text-gray-400">by @{room.host_username}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowShare(true)}
            className="text-xs px-2 py-1 rounded-full bg-white/10 text-gray-300 hover:text-white hover:bg-white/20 transition-colors"
            title="Share room"
          >
            🔗 Share
          </button>
          {room.state === 'ended' && (
            <a
              href={`/api/fishbowlz/export?roomId=${room.id}`}
              download
              className="text-xs px-2 py-1 rounded-full bg-white/10 text-gray-300 hover:text-white hover:bg-white/20 transition-colors"
              title="Download transcript"
            >
              📥 Export
            </a>
          )}
          <span className={`text-xs px-2 py-1 rounded-full ${
            room.state === 'active'
              ? 'bg-[#f5a623]/20 text-[#f5a623]'
              : 'bg-gray-600/20 text-gray-400'
          }`}>
            {room.state}
          </span>
          <span className="text-xs text-gray-500">🔴 {room.hot_seat_count} seats</span>
          {isHost && room.state === 'active' && (
            <button
              onClick={() => setShowEndConfirm(true)}
              className="text-xs px-2 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30 transition-colors"
            >
              End Room
            </button>
          )}
        </div>
      </div>

      {showGuidance && (
        <div className="bg-[#f5a623]/10 border-b border-[#f5a623]/20 px-4 py-2 flex items-center justify-between gap-2">
          <p className="text-xs text-[#f5a623]">💡 {guidanceMessage}</p>
          <button
            onClick={() => {
              setGuidanceDismissed(true);
              localStorage.setItem('fishbowlz-guidance-dismissed', '1');
            }}
            className="text-[#f5a623]/50 hover:text-[#f5a623] text-xs shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Main Stage — Hot Seat + Audio */}
        <div className="flex-1 p-4 sm:p-6">
          {/* Scheduled — countdown + start now */}
          {room.state === 'scheduled' && (
            <div className="mb-6 p-6 bg-[#1a2a4a] rounded-xl border border-blue-500/20 text-center">
              <p className="text-xs text-blue-400 uppercase tracking-wider font-semibold mb-2">Scheduled</p>
              {room.scheduled_at && (
                <>
                  <Countdown targetDate={room.scheduled_at} />
                  <p className="text-sm text-gray-400 mt-2">
                    {new Date(room.scheduled_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at{' '}
                    {new Date(room.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                </>
              )}
              {isHost && (
                <button
                  onClick={async () => {
                    await fetch(`/api/fishbowlz/rooms/${roomId}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'start_room', username: user?.username }),
                    });
                    await fetchRoom();
                  }}
                  className="mt-4 bg-[#f5a623] text-[#0a1628] font-bold px-8 py-3 rounded-full hover:bg-[#d4941f] transition-all hover:shadow-[0_0_30px_rgba(245,166,35,0.3)]"
                >
                  Start Now
                </button>
              )}
              {!isHost && (
                <p className="mt-4 text-sm text-gray-500">Waiting for the host to start...</p>
              )}
            </div>
          )}

          {/* Ended banner */}
          {room.state === 'ended' && (
            <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-white/[0.08] text-center">
              <p className="text-gray-400 text-sm">This fishbowl has ended</p>
            </div>
          )}

          {room.state === 'ended' && room.ai_summary && (
            <div className="mb-4 p-4 bg-[#1a2a4a] rounded-xl border border-white/10">
              <h3 className="text-xs font-semibold text-[#f5a623] uppercase tracking-wider mb-2">AI Summary</h3>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{room.ai_summary}</p>
            </div>
          )}

          {room.state === 'active' && (
            <>
              {/* HMS Audio */}
              {audioJoined && user && (
                <div className="mb-6 rounded-xl overflow-hidden border border-white/10">
                  <HMSFishbowlRoom
                    fishbowlRoomId={room.id}
                    fishbowlSlug={room.slug}
                    userFid={user.fid}
                    userName={user.displayName || user.username || 'Anonymous'}
                    role={isSpeaker ? 'speaker' : 'listener'}
                    isHost={isHost}
                    onLeave={() => setAudioJoined(false)}
                  />
                </div>
              )}

              {/* Transcript Input — for speakers to add what they said */}
              {isSpeaker && (
                <div className="mb-6 p-4 bg-[#1a2a4a] rounded-xl border border-white/10">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">📝 Add to transcript</p>
                  <TranscriptInput
                    roomId={room.id}
                    speakerRole={isHost ? 'host' : 'speaker'}
                    onTranscriptAdded={() => fetchTranscripts()}
                  />
                </div>
              )}
            </>
          )}

          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">🔥 Hot Seat</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Array.from({ length: room.hot_seat_count }).map((_, i) => {
              const speaker = room.current_speakers?.[i];
              return (
                <div
                  key={i}
                  className={`rounded-xl p-4 border-2 transition-colors ${
                    speaker
                      ? 'bg-[#1a2a4a] border-[#f5a623]'
                      : 'bg-[#0f1d35] border-dashed border-white/20'
                  }`}
                >
                  {speaker ? (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#f5a623]/20 flex items-center justify-center text-[#f5a623] font-bold text-sm">
                        {speaker.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{speaker.username}</p>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs text-gray-400">🔥 Hot seat</p>
                          <SpeakerTime joinedAt={speaker.joinedAt} />
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {isHost && speaker.fid !== user?.fid && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                const res = await fetch(`/api/fishbowlz/rooms/${roomId}`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ action: 'kick_speaker', targetFid: speaker.fid }),
                                });
                                if (res.ok) {
                                  toast(`Moved @${speaker.username} to listeners`, 'info');
                                  await fetchRoom();
                                }
                              }}
                              className="text-[10px] text-red-400 hover:text-red-300"
                              title="Move to listeners"
                            >
                              kick
                            </button>
                          )}
                          <TipButton
                            speakerFid={speaker.fid}
                            speakerUsername={speaker.username}
                            roomId={room.id}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 text-sm py-2">
                      {room.state === 'scheduled' ? 'Starts soon' : 'Empty seat'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Gate error alert */}
          {gateError && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-600/30 rounded-lg">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm text-red-400 font-medium">{gateError.message}</p>
                  {gateError.details && (
                    <p className="text-xs text-red-400/70 mt-1">{gateError.details}</p>
                  )}
                </div>
                <button
                  onClick={() => setGateError(null)}
                  className="text-red-400/50 hover:text-red-400 text-xs shrink-0"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Join Controls — only shown for active rooms */}
          {room.state === 'active' && (
            <div className="mt-4 sm:mt-6 flex flex-wrap gap-2 sm:gap-3">
              {!user ? (
                <p className="text-gray-400 text-sm">Sign in to join</p>
              ) : isSpeaker ? (
                <>
                  {!audioJoined && (
                    <button
                      onClick={joinAsSpeaker}
                      disabled={joining}
                      className="bg-[#f5a623] text-[#0a1628] font-semibold px-4 py-2 rounded-lg hover:bg-[#d4941f] transition-colors disabled:opacity-50 min-h-[44px]"
                    >
                      {joining ? 'Joining...' : 'Join Audio'}
                    </button>
                  )}
                  <button
                    onClick={leave}
                    className="bg-red-600/20 border border-red-600 text-red-400 px-4 py-2 rounded-lg hover:bg-red-600/30 transition-colors min-h-[44px]"
                  >
                    Leave hot seat
                  </button>
                </>
              ) : isListener ? (
                <>
                  {!audioJoined && (
                    <button
                      onClick={joinAsListener}
                      disabled={joining}
                      className="border border-white/20 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50 min-h-[44px]"
                    >
                      {joining ? 'Joining...' : 'Join Audio (Listener)'}
                    </button>
                  )}
                  {/* Raise hand button */}
                  <button
                    onClick={async () => {
                      if (!user) return;
                      const res = await fetch(`/api/fishbowlz/rooms/${roomId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'raise_hand', fid: user.fid, username: user.username }),
                      });
                      if (res.ok) {
                        const data = await res.json();
                        toast(data.raised ? 'Hand raised!' : 'Hand lowered', 'info');
                        await fetchRoom();
                      }
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                      room.hand_raises?.some((r) => r.fid === user?.fid)
                        ? 'bg-[#f5a623]/20 text-[#f5a623] border border-[#f5a623]/30'
                        : 'border border-white/20 hover:bg-white/5'
                    }`}
                  >
                    {room.hand_raises?.some((r) => r.fid === user?.fid) ? '✋ Hand Raised' : '✋ Raise Hand'}
                  </button>
                  {room.hand_raises?.some((r) => r.fid === user?.fid) && (
                    <span className="text-xs text-[#f5a623]">
                      You&apos;re #{(room.hand_raises?.findIndex((r) => r.fid === user?.fid) ?? 0) + 1} in queue
                    </span>
                  )}
                  {hotSeatFull ? (
                    <button
                      onClick={rotateIn}
                      disabled={!room.rotation_enabled || joining}
                      className="bg-[#f5a623] text-[#0a1628] font-semibold px-4 py-2 rounded-lg hover:bg-[#d4941f] transition-colors disabled:opacity-50 min-h-[44px]"
                    >
                      Rotate in
                    </button>
                  ) : (
                    <button
                      onClick={joinAsSpeaker}
                      disabled={hotSeatFull || joining}
                      className="bg-[#f5a623] text-[#0a1628] font-semibold px-4 py-2 rounded-lg hover:bg-[#d4941f] transition-colors disabled:opacity-50 min-h-[44px]"
                    >
                      {hotSeatFull ? 'Hot seat full' : 'Join hot seat'}
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={joinAsSpeaker}
                    disabled={hotSeatFull || joining}
                    className="bg-[#f5a623] text-[#0a1628] font-semibold px-4 py-2 rounded-lg hover:bg-[#d4941f] transition-colors disabled:opacity-50 min-h-[44px]"
                  >
                    {hotSeatFull ? 'Hot seat full' : 'Join hot seat'}
                  </button>
                  <button
                    onClick={joinAsListener}
                    className="border border-white/20 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors min-h-[44px]"
                  >
                    Join as listener
                  </button>
                </>
              )}
            </div>
          )}

          {/* Hand raise queue — host only */}
          {isHost && room.hand_raises && room.hand_raises.length > 0 && (
            <div className="mt-4 p-3 bg-[#1a2a4a] rounded-xl border border-[#f5a623]/20">
              <h4 className="text-xs font-semibold text-[#f5a623] uppercase tracking-wider mb-2">
                ✋ Hand Raises ({room.hand_raises.length})
              </h4>
              <div className="space-y-2">
                {room.hand_raises.map((r, index) => (
                  <div key={r.fid} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[#f5a623] bg-[#f5a623]/10 w-6 h-6 rounded-full flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-sm text-white">@{r.username}</span>
                      <span className="text-[10px] text-gray-500">{timeAgo(r.joinedAt)}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          const res = await fetch(`/api/fishbowlz/rooms/${roomId}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'approve_hand', targetFid: r.fid }),
                          });
                          if (res.ok) {
                            toast(`@${r.username} approved to hot seat`, 'success');
                            await fetchRoom();
                          } else {
                            const err = await res.json().catch(() => ({}));
                            toast(err.error || 'Failed to approve', 'error');
                          }
                        }}
                        className="text-xs px-2 py-1 bg-[#f5a623]/15 text-[#ffd700] rounded hover:bg-[#f5a623]/25 transition-colors"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Room description */}
          {room.description && (
            <div className="mt-6 p-4 bg-[#1a2a4a] rounded-xl border border-white/10">
              <p className="text-gray-300 text-sm">{room.description}</p>
            </div>
          )}
        </div>

        {/* Sidebar — Listeners + Transcript + Chat + Reactions */}
        <div className="lg:w-80 border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col max-h-[50vh] lg:max-h-none">
          {/* Listeners */}
          <div className="p-4 border-b border-white/10">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              👥 Listening ({room.current_listeners?.length || 0})
            </h3>
            <div className="flex flex-wrap gap-2">
              {(room.current_listeners || []).map((l, i) => (
                <span key={i} className="text-xs bg-white/10 px-2 py-1 rounded-full">
                  @{l.username}
                </span>
              ))}
              {(room.current_listeners || []).length === 0 && (
                <span className="text-xs text-gray-500">No listeners yet</span>
              )}
            </div>
          </div>

          {/* Live Transcript */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {room.state === 'ended' ? '📝 Transcript Archive' : '📝 Live Transcript'}
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {transcripts.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">
                  {room.state === 'ended' ? 'No transcript was recorded for this fishbowl.' : 'No transcript yet. Start talking!'}
                </p>
              ) : (
                <>
                  {transcripts.map((seg) => (
                    <div key={seg.id} className="text-sm">
                      <span className="font-semibold text-[#f5a623]">{seg.speaker_name}</span>
                      <span className="text-gray-500 text-xs ml-2">[{seg.speaker_role}]</span>
                      <span className="text-gray-600 text-xs ml-2">{timeAgo(seg.started_at)}</span>
                      <p className="text-gray-200 mt-1">{seg.text}</p>
                    </div>
                  ))}
                  <div ref={transcriptBottomRef} />
                </>
              )}
            </div>
          </div>

          {/* Room Chat */}
          <div className="flex-1 flex flex-col border-t border-white/10 min-h-[200px]">
            <FishbowlChat roomId={room.id} />
          </div>

          {/* Reactions */}
          {room.state === 'active' && (
            <div className="p-3 border-t border-white/10">
              <Reactions roomId={room.id} />
            </div>
          )}
        </div>
      </div>

      {/* Spacer for sticky mobile bottom bar */}
      {audioJoined && room?.state === 'active' && (
        <div className="lg:hidden h-16" />
      )}

      {/* Sticky mobile audio controls */}
      {audioJoined && user && room?.state === 'active' && (
        <div
          className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0d1b2a] border-t border-white/10 px-4 py-3 flex items-center justify-between"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-white text-sm font-medium truncate">{room.title}</span>
            <span className="text-gray-500 text-xs shrink-0">
              {(room.current_speakers?.length || 0) + (room.current_listeners?.length || 0)} in room
            </span>
          </div>
          <button
            onClick={() => {
              setAudioJoined(false);
              if (user) {
                const action = isSpeaker ? 'leave_speaker' : 'leave_listener';
                fetch(`/api/fishbowlz/rooms/${roomId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action, fid: user.fid }),
                }).catch(() => {});
              }
            }}
            className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-semibold min-h-[44px] shrink-0"
          >
            Leave
          </button>
        </div>
      )}

      {room && (
        <ShareModal
          url={typeof window !== 'undefined' ? `${window.location.origin}/fishbowlz/${room.slug || roomId}` : ''}
          title={`Join "${room.title}" on FISHBOWLZ`}
          description={room.description || `A live fishbowl hosted by @${room.host_username}`}
          isOpen={showShare}
          onClose={() => setShowShare(false)}
        />
      )}

      {showEndedOverlay && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a2a4a] rounded-xl p-6 w-full max-w-sm border border-white/10 text-center">
            <div className="text-4xl mb-3">🐟</div>
            <h2 className="text-lg font-bold mb-1">This fishbowl has ended</h2>
            <p className="text-sm text-gray-400 mb-1">
              {endedRoomRef.current?.title || room?.title}
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Hosted by @{endedRoomRef.current?.host_username || room?.host_username}
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => router.push('/fishbowlz')}
                className="w-full bg-[#f5a623] text-[#0a1628] font-semibold py-2.5 rounded-lg hover:bg-[#d4941f] transition-colors"
              >
                Back to Rooms
              </button>
              {transcripts.length > 0 && (
                <button
                  onClick={() => {
                    setShowEndedOverlay(false);
                    setEndedCountdown(0);
                  }}
                  className="w-full border border-white/20 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-sm"
                >
                  View Transcript
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-3">Redirecting in {endedCountdown}...</p>
          </div>
        </div>
      )}

      {showEndConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a2a4a] rounded-xl p-6 w-full max-w-sm border border-white/10">
            <h2 className="text-lg font-bold mb-2">End this fishbowl?</h2>
            <p className="text-sm text-gray-400 mb-4">This will disconnect all participants and close the room. Transcripts are preserved.</p>
            <div className="flex gap-3">
              <button
                onClick={endRoom}
                className="flex-1 bg-red-600 text-white font-semibold py-2.5 rounded-lg hover:bg-red-700 transition-colors"
              >
                End Room
              </button>
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 border border-white/20 py-2.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page export — wraps inner component with ToastProvider ──────────────────

export default function FishbowlRoomPage() {
  return (
    <ToastProvider>
      <FishbowlRoomPageInner />
    </ToastProvider>
  );
}
