'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import type { Room } from '@/lib/spaces/roomsDb';

interface PastRoomsProps {
  category: string;
}

function formatDuration(created: string, ended: string | null): string {
  if (!ended) return '--';
  const diff = new Date(ended).getTime() - new Date(created).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m`;
}

function formatDate(dt: string): string {
  return new Date(dt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export default function PastRooms({ category }: PastRoomsProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [playingRoomId, setPlayingRoomId] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/spaces/past?days=${days}`);
      if (!res.ok) return;
      const { rooms: data } = await res.json();
      setRooms(data ?? []);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const filtered = category === 'all'
    ? rooms
    : rooms.filter((r) => r.theme === category);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Past Rooms ({filtered.length})
        </h3>
        <div className="flex gap-1">
          {[7, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                days === d
                  ? 'bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/30'
                  : 'text-gray-500 border border-gray-700 hover:border-gray-600'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-[#111d2e] border border-gray-800 rounded-xl p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-500 text-sm">
          No past rooms in the last {days} days
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((room) => (
            <div key={room.id} className="bg-[#111d2e] border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-white text-sm font-bold mb-1 line-clamp-1">{room.title}</h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    {room.host_pfp ? (
                      <Image src={room.host_pfp} alt="" width={16} height={16} className="rounded-full" unoptimized />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-gray-700 text-[8px] flex items-center justify-center text-gray-400">
                        {room.host_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                    <span className="text-gray-400 text-xs">{room.host_name}</span>
                    <span className="text-gray-600 text-xs">{formatDate(room.ended_at || room.created_at)}</span>
                    <span className="text-gray-600 text-xs flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatDuration(room.created_at, room.ended_at)}
                    </span>
                  </div>
                </div>
                {room.recording_url ? (
                  <button
                    onClick={() => setPlayingRoomId(playingRoomId === room.id ? null : room.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/30 hover:bg-[#f5a623]/20 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      {playingRoomId === room.id ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                      )}
                    </svg>
                    {playingRoomId === room.id ? 'Close' : 'Play Recording'}
                  </button>
                ) : (
                  <span className="text-[10px] text-gray-600 px-2 py-1 border border-gray-700 rounded-lg">
                    No recording
                  </span>
                )}
              </div>
              {playingRoomId === room.id && room.recording_url && (
                <div className="mt-3 pt-3 border-t border-gray-800">
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <audio
                    controls
                    src={room.recording_url}
                    className="w-full h-10 rounded-lg"
                    autoPlay
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
