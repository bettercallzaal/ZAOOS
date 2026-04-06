'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { ScheduleRoomModal } from '@/components/spaces/ScheduleRoomModal';

interface ScheduledRoom {
  id: string;
  title: string;
  description: string | null;
  host_fid: number;
  host_name: string | null;
  host_pfp: string | null;
  scheduled_at: string;
  category: string;
  theme: string;
  rsvp_count: number;
  state: string;
}

interface ScheduledRoomsProps {
  category: string;
}

function formatCountdown(scheduledAt: string): string {
  const diff = new Date(scheduledAt).getTime() - Date.now();
  if (diff <= 0) return 'Starting soon';
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `in ${days}d ${hours % 24}h`;
  }
  if (hours > 0) return `in ${hours}h ${mins}m`;
  return `in ${mins}m`;
}

function formatDate(dt: string): string {
  return new Date(dt).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

const CATEGORY_COLORS: Record<string, string> = {
  general: 'text-[#f5a623] bg-[#f5a623]/10 border-[#f5a623]/20',
  music: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  podcast: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  ama: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  chill: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
  'dj-set': 'text-pink-400 bg-pink-500/10 border-pink-500/20',
};

export default function ScheduledRooms({ category }: ScheduledRoomsProps) {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ScheduledRoom[]>([]);
  const [rsvpSet, setRsvpSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/spaces/scheduled');
      if (!res.ok) return;
      const { rooms: data } = await res.json();
      setRooms(data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const filtered = category === 'all' ? rooms : rooms.filter((r) => r.category === category);

  const toggleRsvp = async (roomId: string) => {
    const isRsvped = rsvpSet.has(roomId);
    const method = isRsvped ? 'DELETE' : 'POST';

    const res = await fetch(`/api/spaces/scheduled/${roomId}/rsvp`, { method });
    if (res.ok) {
      setRsvpSet((prev) => {
        const next = new Set(prev);
        if (isRsvped) { next.delete(roomId); } else { next.add(roomId); }
        return next;
      });
      // Optimistic update count
      setRooms((prev) =>
        prev.map((r) =>
          r.id === roomId
            ? { ...r, rsvp_count: r.rsvp_count + (isRsvped ? -1 : 1) }
            : r
        )
      );
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="bg-[#111d2e] border border-white/[0.08] rounded-xl p-4 animate-pulse h-28" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Upcoming ({filtered.length})
        </h3>
        {user && (
          <button
            onClick={() => setShowModal(true)}
            className="text-xs font-semibold text-[#f5a623] hover:text-[#ffd700] transition-colors"
          >
            + Schedule
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-500 text-sm">
          No upcoming spaces scheduled
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((room) => {
            const catColor = CATEGORY_COLORS[room.category] || CATEGORY_COLORS.general;
            return (
              <div key={room.id} className="bg-[#111d2e] border border-white/[0.08] rounded-xl p-4 hover:border-white/[0.08] transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${catColor}`}>
                        {room.category}
                      </span>
                      <span className="text-[10px] text-[#f5a623] font-medium">
                        {formatCountdown(room.scheduled_at)}
                      </span>
                    </div>
                    <h4 className="text-white text-sm font-bold mb-1 line-clamp-1">{room.title}</h4>
                    {room.description && (
                      <p className="text-gray-500 text-xs line-clamp-1 mb-2">{room.description}</p>
                    )}
                    <div className="flex items-center gap-2">
                      {room.host_pfp ? (
                        <Image src={room.host_pfp} alt="" width={18} height={18} className="rounded-full" unoptimized />
                      ) : (
                        <div className="w-[18px] h-[18px] rounded-full bg-gray-700 text-[8px] flex items-center justify-center text-gray-400">
                          {room.host_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                      <span className="text-gray-400 text-xs">{room.host_name}</span>
                      <span className="text-gray-600 text-xs">{formatDate(room.scheduled_at)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => toggleRsvp(room.id)}
                      disabled={!user}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        rsvpSet.has(room.id)
                          ? 'bg-[#f5a623] text-[#0a1628]'
                          : 'border border-[#f5a623]/40 text-[#f5a623] hover:bg-[#f5a623]/10'
                      } disabled:opacity-40`}
                    >
                      {rsvpSet.has(room.id) ? 'Going' : 'RSVP'}
                    </button>
                    <span className="text-[10px] text-gray-500">{room.rsvp_count} going</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {user && (
        <ScheduleRoomModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onCreated={fetchRooms}
        />
      )}
    </div>
  );
}
