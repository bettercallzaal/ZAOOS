'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/useAuth';
import type { MSRoom } from '@/lib/social/msRoomsDb';

const HMSRoom = dynamic(() => import('@/components/spaces/HMSRoom'), { ssr: false });

async function fetchMSRoom(id: string): Promise<MSRoom> {
  const res = await fetch(`/api/100ms/rooms/${id}`);
  if (!res.ok) throw new Error('Room not found');
  const data = await res.json();
  return data.room;
}

export default function HMSRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const { user, loading: authLoading } = useAuth();

  const [room, setRoom] = useState<MSRoom | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isHost = user?.fid === room?.host_fid;

  useEffect(() => {
    if (authLoading) return;

    let mounted = true;

    const init = async () => {
      try {
        const roomData = await fetchMSRoom(roomId);
        if (roomData.state === 'ended') throw new Error('This room has ended');
        if (mounted) setRoom(roomData);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load room');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [roomId, authLoading]);

  const handleLeave = async () => {
    if (isHost && room) {
      await fetch(`/api/100ms/rooms/${room.id}`, {
        method: 'PATCH',
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

  if (!room) return null;

  const userName = user?.displayName || user?.username || `guest-${Math.random().toString(36).slice(2, 8)}`;
  const role = isHost ? 'host' : 'listener';

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] flex flex-col">
      <header className="px-4 py-3 border-b border-gray-800 bg-[#0d1b2a] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-white font-bold">{room.title}</h1>
            <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">100ms</span>
          </div>
          <p className="text-gray-400 text-xs">Hosted by {room.host_name}</p>
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
        </div>
      </header>
      <div className="flex-1">
        <HMSRoom userName={userName} role={role} onLeave={handleLeave} />
      </div>
    </div>
  );
}
