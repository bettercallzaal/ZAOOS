'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StreamCall, StreamVideo, StreamVideoClient, type Call } from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { useAuth } from '@/hooks/useAuth';
import { createStreamUser, createGuestUser } from '@/lib/spaces/streamHelpers';
import { RoomView } from '@/components/spaces/RoomView';
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

  const handleLeave = async () => {
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

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] flex flex-col">
      <header className="px-4 py-3 border-b border-gray-800 bg-[#0d1b2a] flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold">{room.title}</h1>
          {room.description && (
            <p className="text-gray-400 text-xs">{room.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!user && (
            <a
              href="/"
              className="px-3 py-1.5 text-xs font-medium text-[#f5a623] border border-[#f5a623]/30 rounded-lg hover:bg-[#f5a623]/10 transition-colors"
            >
              Sign in to speak
            </a>
          )}
          <button
            onClick={handleLeave}
            className="px-4 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors"
          >
            {isHost ? 'End Room' : 'Leave'}
          </button>
        </div>
      </header>
      <div className="flex-1">
        <StreamVideo client={client}>
          <StreamCall call={call}>
            <RoomView isHost={isHost} isAuthenticated={!!user} roomId={room.id} />
          </StreamCall>
        </StreamVideo>
      </div>
    </div>
  );
}
