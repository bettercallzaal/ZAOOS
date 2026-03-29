'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowser } from '@/lib/db/supabase';
import { RoomCard, type UnifiedRoom } from './RoomCard';

interface RoomListProps {
  currentFid?: number;
  onJoinRoom: (room: UnifiedRoom) => void;
  onHostRoom: () => void;
  isAuthenticated: boolean;
}

export function RoomList({ currentFid, onJoinRoom, onHostRoom, isAuthenticated }: RoomListProps) {
  const [rooms, setRooms] = useState<UnifiedRoom[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllRooms = async () => {
    const supabase = getSupabaseBrowser();

    const [streamResult, msResult] = await Promise.allSettled([
      supabase
        .from('rooms')
        .select('*')
        .eq('state', 'live')
        .order('created_at', { ascending: false }),
      supabase
        .from('ms_rooms')
        .select('*')
        .eq('state', 'active')
        .order('created_at', { ascending: false }),
    ]);

    const streamRooms: UnifiedRoom[] =
      streamResult.status === 'fulfilled' && streamResult.value.data
        ? streamResult.value.data.map((r: Record<string, unknown>) => ({
            id: r.id as string,
            title: r.title as string,
            description: r.description as string | null,
            host_fid: r.host_fid as number,
            host_name: r.host_name as string,
            host_username: r.host_username as string,
            host_pfp: r.host_pfp as string | null,
            created_at: r.created_at as string,
            participant_count: r.participant_count as number,
            provider: 'stream' as const,
          }))
        : [];

    const msRooms: UnifiedRoom[] =
      msResult.status === 'fulfilled' && msResult.value.data
        ? msResult.value.data.map((r: Record<string, unknown>) => ({
            id: r.id as string,
            title: r.title as string,
            description: null,
            host_fid: r.host_fid as number,
            host_name: r.host_name as string,
            host_username: undefined,
            host_pfp: null,
            created_at: r.created_at as string,
            participant_count: r.participant_count as number,
            provider: '100ms' as const,
          }))
        : [];

    const combined = [...streamRooms, ...msRooms].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setRooms(combined);
    setLoading(false);
  };

  useEffect(() => {
    const supabase = getSupabaseBrowser();

    fetchAllRooms();

    // Subscribe to changes on both tables
    const streamChannel = supabase
      .channel('live-rooms')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms' },
        () => fetchAllRooms()
      )
      .subscribe();

    const msChannel = supabase
      .channel('live-ms-rooms')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ms_rooms' },
        () => fetchAllRooms()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(streamChannel);
      supabase.removeChannel(msChannel);
    };
     
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#0d1b2a] border border-gray-800 rounded-xl p-5 animate-pulse h-40" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-white text-lg font-semibold">Live Rooms</h2>
          {rooms.length > 0 && (
            <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full font-medium">
              {rooms.length} live
            </span>
          )}
        </div>
        {isAuthenticated && (
          <button
            onClick={onHostRoom}
            className="px-4 py-2 bg-[#f5a623] hover:bg-[#ffd700] text-[#0a1628] text-sm font-semibold rounded-lg transition-colors"
          >
            Host Room
          </button>
        )}
      </div>

      {rooms.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">🎙️</p>
          <p className="text-lg mb-2">No live rooms yet</p>
          <p className="text-sm">Be the first to host a room</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rooms.map((room) => (
            <RoomCard
              key={`${room.provider}-${room.id}`}
              room={room}
              isOwner={currentFid === room.host_fid}
              onJoin={onJoinRoom}
            />
          ))}
        </div>
      )}
    </div>
  );
}
