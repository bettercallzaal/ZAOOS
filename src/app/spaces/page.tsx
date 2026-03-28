'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { RoomList } from '@/components/spaces/RoomList';
import { HostRoomModal, type RoomProvider } from '@/components/spaces/HostRoomModal';
import { generateCallId } from '@/lib/spaces/streamHelpers';
import type { UnifiedRoom } from '@/components/spaces/RoomCard';

export default function PublicSpacesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [showHostModal, setShowHostModal] = useState(false);

  const handleCreateRoom = async (title: string, description: string, provider: RoomProvider) => {
    if (!user) throw new Error('Not authenticated');

    if (provider === 'stream') {
      const streamCallId = generateCallId();

      const res = await fetch('/api/stream/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          streamCallId,
        }),
      });

      if (!res.ok) throw new Error('Failed to create room');
      const { room } = await res.json();
      router.push(`/spaces/${room.id}`);
    } else {
      // 100ms provider
      const res = await fetch('/api/100ms/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });

      if (!res.ok) throw new Error('Failed to create room');
      const { room } = await res.json();
      router.push(`/spaces/hms/${room.id}`);
    }
  };

  const handleJoinRoom = (room: UnifiedRoom) => {
    if (room.provider === '100ms') {
      router.push(`/spaces/hms/${room.id}`);
    } else {
      router.push(`/spaces/${room.id}`);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white flex flex-col">
      <header className="px-4 py-3 border-b border-gray-800 bg-[#0d1b2a] flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm text-gray-300">Spaces</h2>
          {!user && (
            <a
              href="/"
              className="px-3 py-1.5 text-xs font-medium text-[#f5a623] border border-[#f5a623]/30 rounded-lg hover:bg-[#f5a623]/10 transition-colors"
            >
              Sign in to host
            </a>
          )}
        </div>
      </header>

      <div className="flex-1 px-4 py-6 max-w-4xl mx-auto w-full">
        <RoomList
          currentFid={user?.fid}
          onJoinRoom={handleJoinRoom}
          onHostRoom={() => setShowHostModal(true)}
          isAuthenticated={!!user}
        />
      </div>

      {user && (
        <HostRoomModal
          isOpen={showHostModal}
          onClose={() => setShowHostModal(false)}
          onCreateRoom={handleCreateRoom}
        />
      )}
    </div>
  );
}
