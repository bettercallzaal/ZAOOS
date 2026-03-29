'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getSupabaseBrowser } from '@/lib/db/supabase';
import StageCard from '@/components/spaces/StageCard';
import { HostRoomModal, type RoomTheme } from '@/components/spaces/HostRoomModal';
import { generateCallId } from '@/lib/spaces/streamHelpers';
import type { Room } from '@/lib/spaces/roomsDb';

export default function PublicSpacesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [showHostModal, setShowHostModal] = useState(false);
  const [stages, setStages] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStages = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    const { data } = await supabase
      .from('rooms')
      .select('*')
      .eq('room_type', 'stage')
      .eq('state', 'live')
      .order('created_at', { ascending: false });

    setStages((data as Room[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    fetchStages();

    const channel = supabase
      .channel('live-stages')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms' },
        () => fetchStages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStages]);

  const handleCreateRoom = async (title: string, description: string, theme: RoomTheme) => {
    if (!user) throw new Error('Not authenticated');

    const streamCallId = generateCallId();

    const res = await fetch('/api/stream/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        streamCallId,
        theme,
        room_type: 'stage',
      }),
    });

    if (!res.ok) throw new Error('Failed to create room');
    const { room } = await res.json();
    router.push(`/spaces/${room.id}`);
  };

  const handleJoinStage = (room: Room) => {
    router.push(`/spaces/${room.id}`);
  };

  return (
    <div className="text-white flex flex-col">
      <header className="px-4 py-3 border-b border-gray-800 bg-[#0d1b2a]/50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-sm text-gray-300">Live Stages</h2>
            {stages.length > 0 && (
              <span className="bg-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                {stages.length} live
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <button
                onClick={() => setShowHostModal(true)}
                className="px-3.5 py-1.5 bg-[#f5a623] hover:bg-[#ffd700] text-[#0a1628] text-xs font-semibold rounded-lg transition-colors"
              >
                + Create Stage
              </button>
            ) : (
              <Link
                href="/"
                className="px-3 py-1.5 text-xs font-medium text-[#f5a623] border border-[#f5a623]/30 rounded-lg hover:bg-[#f5a623]/10 transition-colors"
              >
                Sign in to host
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 px-4 py-6 max-w-4xl mx-auto w-full">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-[#111d2e] border border-gray-800 rounded-lg p-5 animate-pulse h-40"
              />
            ))}
          </div>
        ) : stages.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-3xl mb-3">🎙️</p>
            <p className="text-base mb-1">No live stages right now</p>
            <p className="text-sm text-gray-600">Create one to go live!</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {stages.map((stage) => (
              <StageCard key={stage.id} room={stage} onJoin={handleJoinStage} />
            ))}
          </div>
        )}
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
