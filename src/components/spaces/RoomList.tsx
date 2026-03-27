'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowser } from '@/lib/db/supabase';
import type { Room } from '@/lib/spaces/roomsDb';
import { RoomCard } from './RoomCard';

interface RoomListProps {
  currentFid?: number;
  onJoinRoom: (room: Room) => void;
  onHostRoom: () => void;
  isAuthenticated: boolean;
}

export function RoomList({ currentFid, onJoinRoom, onHostRoom, isAuthenticated }: RoomListProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowser();

    supabase
      .from('rooms')
      .select('*')
      .eq('state', 'live')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setRooms(data || []);
        setLoading(false);
      });

    const channel = supabase
      .channel('live-rooms')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms' },
        () => {
          supabase
            .from('rooms')
            .select('*')
            .eq('state', 'live')
            .order('created_at', { ascending: false })
            .then(({ data }) => setRooms(data || []));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
              key={room.id}
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
