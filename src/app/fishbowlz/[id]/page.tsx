'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { TranscriptInput } from '@/components/spaces/TranscriptInput';
import dynamic from 'next/dynamic';

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
  title: string;
  description: string | null;
  host_fid: number;
  host_name: string;
  host_username: string;
  state: string;
  hot_seat_count: number;
  rotation_enabled: boolean;
  current_speakers: Speaker[];
  current_listeners: Speaker[];
  audio_source_type: string | null;
  audio_source_url: string | null;
  created_at: string;
}

interface TranscriptSegment {
  id: string;
  speaker_name: string;
  speaker_role: string;
  text: string;
  started_at: string;
}

export default function FishbowlRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const { user, loading: authLoading } = useAuth();

  const [room, setRoom] = useState<FishbowlRoom | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioJoined, setAudioJoined] = useState(false);

  const isHost = user?.fid === room?.host_fid;
  const isSpeaker = room?.current_speakers?.some((s) => s.fid === user?.fid);
  const isListener = room?.current_listeners?.some((l) => l.fid === user?.fid);
  const hotSeatFull = (room?.current_speakers?.length || 0) >= (room?.hot_seat_count || 0);

  const fetchRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/fishbowlz/rooms/${roomId}`);
      if (!res.ok) throw new Error('Room not found');
      const data = await res.json();
      setRoom(data);
    } catch {
      setError('Room not found');
    }
  }, [roomId]);

  const fetchTranscripts = useCallback(async () => {
    try {
      const res = await fetch(`/api/fishbowlz/transcripts?roomId=${roomId}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setTranscripts(data.transcripts || []);
      }
    } catch {
      // Non-critical
    }
  }, [roomId]);

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

  const joinAsSpeaker = async () => {
    if (!user || joining) return;
    setJoining(true);
    try {
      await fetch(`/api/fishbowlz/rooms/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join_speaker', fid: user.fid, username: user.username }),
      });
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
      await fetch(`/api/fishbowlz/rooms/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join_listener', fid: user.fid, username: user.username }),
      });
      await fetchRoom();
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
    await fetch(`/api/fishbowlz/rooms/${roomId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'leave_speaker', fid: user.fid }),
    });
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
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/fishbowlz')} className="text-gray-400 hover:text-white">
            ←
          </button>
          <div>
            <h1 className="text-xl font-bold">{room.title}</h1>
            <p className="text-sm text-gray-400">by @{room.host_username}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full ${room.state === 'active' ? 'bg-green-600/20 text-green-400' : 'bg-yellow-600/20 text-yellow-400'}`}>
            {room.state}
          </span>
          <span className="text-xs text-gray-500">🔴 {room.hot_seat_count} seats</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Main Stage — Hot Seat + Audio */}
        <div className="flex-1 p-6">
          {/* HMS Audio */}
          {audioJoined && user && (
            <div className="mb-6 rounded-xl overflow-hidden border border-white/10">
              <HMSFishbowlRoom
                fishbowlRoomId={room.id}
                role={isSpeaker ? 'speaker' : 'listener'}
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
                        <p className="text-xs text-gray-400">🔥 Hot seat</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 text-sm py-2">
                      Empty seat
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Join Controls */}
          <div className="mt-6 flex flex-wrap gap-3">
            {!user ? (
              <p className="text-gray-400 text-sm">Sign in to join</p>
            ) : isSpeaker ? (
              <>
                {!audioJoined && (
                  <button
                    onClick={joinAsSpeaker}
                    disabled={joining}
                    className="bg-[#f5a623] text-[#0a1628] font-semibold px-4 py-2 rounded-lg hover:bg-[#d4941f] transition-colors disabled:opacity-50"
                  >
                    {joining ? 'Joining...' : 'Join Audio'}
                  </button>
                )}
                <button
                  onClick={leave}
                  className="bg-red-600/20 border border-red-600 text-red-400 px-4 py-2 rounded-lg hover:bg-red-600/30 transition-colors"
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
                    className="border border-white/20 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
                  >
                    {joining ? 'Joining...' : 'Join Audio (Listener)'}
                  </button>
                )}
                {hotSeatFull ? (
                  <button
                    onClick={rotateIn}
                    disabled={!room.rotation_enabled || joining}
                    className="bg-[#f5a623] text-[#0a1628] font-semibold px-4 py-2 rounded-lg hover:bg-[#d4941f] transition-colors disabled:opacity-50"
                  >
                    Rotate in
                  </button>
                ) : (
                  <button
                    onClick={joinAsSpeaker}
                    disabled={hotSeatFull || joining}
                    className="bg-[#f5a623] text-[#0a1628] font-semibold px-4 py-2 rounded-lg hover:bg-[#d4941f] transition-colors disabled:opacity-50"
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
                  className="bg-[#f5a623] text-[#0a1628] font-semibold px-4 py-2 rounded-lg hover:bg-[#d4941f] transition-colors disabled:opacity-50"
                >
                  {hotSeatFull ? 'Hot seat full' : 'Join hot seat'}
                </button>
                <button
                  onClick={joinAsListener}
                  className="border border-white/20 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  Join as listener
                </button>
              </>
            )}
          </div>

          {/* Room description */}
          {room.description && (
            <div className="mt-6 p-4 bg-[#1a2a4a] rounded-xl border border-white/10">
              <p className="text-gray-300 text-sm">{room.description}</p>
            </div>
          )}
        </div>

        {/* Sidebar — Listeners + Transcript */}
        <div className="lg:w-80 border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col">
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
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">📝 Live Transcript</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {transcripts.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No transcript yet. Start talking!</p>
              ) : (
                transcripts.map((seg) => (
                  <div key={seg.id} className="text-sm">
                    <span className="font-semibold text-[#f5a623]">{seg.speaker_name}</span>
                    <span className="text-gray-500 text-xs ml-2">[{seg.speaker_role}]</span>
                    <p className="text-gray-200 mt-1">{seg.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
