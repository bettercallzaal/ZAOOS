'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { StreamCall, StreamVideo, StreamVideoClient, type Call } from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { useAuth } from '@/hooks/useAuth';
import { createStreamUser, createGuestUser } from '@/lib/spaces/streamHelpers';
import { RoomView } from '@/components/spaces/RoomView';
import { EditRoomModal } from '@/components/spaces/EditRoomModal';
import { TwitchStreamInfo } from '@/components/spaces/TwitchStreamInfo';
import type { Room } from '@/lib/spaces/roomsDb';

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY || '';

async function fetchStreamToken(userId: string): Promise<string> {
  const res = await fetch('/api/stream/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error('Failed to generate token');
  const data = await res.json();
  return data.token;
}

async function fetchRoom(id: string): Promise<Room> {
  const res = await fetch(`/api/stream/rooms/${id}`);
  if (!res.ok) throw new Error('Room not found');
  const data = await res.json();
  return data.room;
}

export default function PublicRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const { user, loading: authLoading } = useAuth();

  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);

  const isHost = user?.fid === room?.host_fid;

  useEffect(() => {
    if (authLoading) return;

    let mounted = true;

    const init = async () => {
      try {
        const roomData = await fetchRoom(roomId);
        if (roomData.state === 'ended') throw new Error('This room has ended');
        if (mounted) setRoom(roomData);

        let newClient: StreamVideoClient;

        if (user) {
          const streamUser = createStreamUser(user);
          const token = await fetchStreamToken(streamUser.id);
          newClient = new StreamVideoClient({ apiKey, user: streamUser, token });
        } else {
          const guestUser = createGuestUser();
          newClient = new StreamVideoClient({ apiKey, user: guestUser });
        }
        const newCall = newClient.call('audio_room', roomData.stream_call_id);

        const userIsHost = user?.fid === roomData.host_fid;
        if (userIsHost) {
          await newCall.join({
            create: true,
            data: {
              members: [],
              custom: { title: roomData.title, description: roomData.description || '' },
            },
          });
        } else {
          await newCall.join();
        }

        // Fire-and-forget session tracking on join
        if (roomData) {
          fetch('/api/spaces/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              roomId: roomData.id,
              roomName: roomData.title,
              roomType: roomData.room_type ?? 'stage',
            }),
          }).catch(() => {});
        }

        if (mounted) {
          setClient(newClient);
          setCall(newCall);
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to join room');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [roomId, user, authLoading]);

  // End session on browser close / tab close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (room?.id) {
        fetch('/api/spaces/session', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: room.id }),
          keepalive: true,
        });
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [room?.id]);

  const handleLeave = async () => {
    // End session tracking (keepalive so it survives navigation)
    if (room?.id) {
      fetch('/api/spaces/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: room.id }),
        keepalive: true,
      }).catch(() => {});
    }
    if (call) await call.leave().catch(console.error);
    if (client) await client.disconnectUser().catch(console.error);
    if (isHost && room) {
      await fetch(`/api/stream/rooms/${room.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'ended' }),
      }).catch(console.error);
    }
    router.push('/spaces');
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-[100dvh] bg-[#0a1628] flex items-center justify-center text-gray-400">
        Loading room...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[100dvh] bg-[#0a1628] flex flex-col items-center justify-center gap-4">
        <div className="text-red-400 text-lg">{error}</div>
        <button
          onClick={() => router.push('/spaces')}
          className="px-6 py-2 bg-[#f5a623] text-[#0a1628] rounded-lg font-semibold"
        >
          Back to Spaces
        </button>
      </div>
    );
  }

  if (!client || !call || !room) return null;

  const THEME_ACCENTS: Record<string, string> = {
    default: '#f5a623',
    music: '#a855f7',
    podcast: '#f59e0b',
    ama: '#facc15',
    chill: '#14b8a6',
  };
  const themeAccent = THEME_ACCENTS[room.theme] || THEME_ACCENTS.default;

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] flex flex-col">
      {showEdit && room && (
        <EditRoomModal
          roomId={room.id}
          currentTitle={room.title}
          currentDescription={room.description || ''}
          currentTheme={room.theme || 'default'}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => setRoom(prev => prev ? { ...prev, ...updated } : prev)}
        />
      )}
      <header className="border-b border-gray-800 bg-[#0d1b2a] relative">
        {/* Theme accent bar */}
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ backgroundColor: themeAccent, opacity: 0.5 }} />

        <div className="px-4 py-3">
          {/* Top row: title + actions */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-white font-bold text-sm sm:text-base truncate">{room.title}</h1>
                  {isHost && (
                    <button
                      onClick={() => setShowEdit(true)}
                      className="p-1 text-gray-500 hover:text-[#f5a623] transition-colors flex-shrink-0 rounded-md hover:bg-gray-800"
                      aria-label="Edit room"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>
                  )}
                </div>
                {room.description && (
                  <p className="text-gray-500 text-xs truncate mt-0.5">{room.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {!user && (
                <Link
                  href="/"
                  className="hidden sm:inline-flex px-3 py-1.5 text-xs font-medium text-[#f5a623] border border-[#f5a623]/30 rounded-lg hover:bg-[#f5a623]/10 transition-colors"
                >
                  Sign in to speak
                </Link>
              )}
              <button
                onClick={handleLeave}
                className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs sm:text-sm font-medium hover:bg-red-500/20 transition-colors"
              >
                {isHost ? 'End' : 'Leave'}
              </button>
            </div>
          </div>

          {/* Bottom row: meta badges */}
          <div className="flex items-center gap-2.5 mt-2.5 flex-wrap">
            {/* Participant count */}
            <span className="inline-flex items-center gap-1 text-gray-400 text-xs">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128H5.228A2 2 0 013 17.16v-.088c0-2.517 1.813-4.607 4.2-5.032a8.153 8.153 0 011.6-.16c.549 0 1.085.055 1.6.16 2.387.425 4.2 2.515 4.2 5.032v.088c0 .465-.171.89-.453 1.217" />
              </svg>
              {room.participant_count} {room.participant_count === 1 ? 'listener' : 'listeners'}
            </span>

            {/* Twitch viewers */}
            {isHost && <TwitchStreamInfo />}
          </div>
        </div>
      </header>
      <div className="flex-1">
        <StreamVideo client={client}>
          <StreamCall call={call}>
            <RoomView
              isHost={isHost}
              isAuthenticated={!!user}
              roomId={room.id}
              roomType={room.room_type}
              hostFid={room.host_fid}
            />
          </StreamCall>
        </StreamVideo>
      </div>
    </div>
  );
}
