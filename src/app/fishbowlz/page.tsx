'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

function parseJsonb<T>(value: unknown, fallback: T): T {
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return fallback; }
  }
  return (value as T) ?? fallback;
}

interface FishbowlRoom {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  host_name: string;
  host_username: string;
  host_pfp?: string;
  state: string;
  hot_seat_count: number;
  current_speakers: Array<{ fid: number; username: string; joinedAt: string }>;
  current_listeners: Array<{ fid: number; username: string; joinedAt: string }>;
  total_sessions: number;
  gating_enabled?: boolean;
  scheduled_at?: string;
  created_at: string;
  last_active_at: string;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function timeUntil(dateStr: string): string {
  const seconds = Math.floor((new Date(dateStr).getTime() - Date.now()) / 1000);
  if (seconds < 0) return 'starting soon';
  if (seconds < 60) return 'in less than a minute';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `in ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `in ${hours}h`;
  return `in ${Math.floor(hours / 24)}d`;
}

export default function FishbowlzPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [rooms, setRooms] = useState<FishbowlRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hotSeats, setHotSeats] = useState(5);
  const [gatingEnabled, setGatingEnabled] = useState(false);
  const [minQualityScore, setMinQualityScore] = useState(0);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  useEffect(() => {
    fetch('/api/fishbowlz/rooms')
      .then(r => r.json())
      .then(d => {
        const parsed = (d.rooms || []).map((r: FishbowlRoom & Record<string, unknown>) => ({
          ...r,
          current_speakers: parseJsonb(r.current_speakers, []),
          current_listeners: parseJsonb(r.current_listeners, []),
        }));
        setRooms(parsed);
      })
      .catch(() => setRooms([]))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!user || !title.trim()) return;

    const res = await fetch('/api/fishbowlz/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim(),
        hostFid: user.fid,
        hostName: user.displayName || user.username || 'Anonymous',
        hostUsername: user.username || 'anon',
        hostPfp: user.pfpUrl,
        hotSeatCount: hotSeats,
      }),
    });

    if (res.ok) {
      const room = await res.json();
      router.push(`/fishbowlz/${room.slug || room.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1628] text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#f5a623]">FISHBOWLZ</h1>
          <p className="text-xs sm:text-sm text-gray-400">Persistent async fishbowl audio spaces</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-[#f5a623] text-[#0a1628] font-semibold px-3 sm:px-4 py-2 rounded-lg hover:bg-[#d4941f] transition-colors text-sm sm:text-base min-h-[44px]"
        >
          + Create
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a2a4a] rounded-xl p-5 sm:p-6 w-full max-w-md border border-white/10 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create Fishbowl</h2>
            <input
              type="text"
              placeholder="Room title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-[#0a1628] border border-white/20 rounded-lg px-4 py-3 mb-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#f5a623]"
            />
            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-[#0a1628] border border-white/20 rounded-lg px-4 py-3 mb-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#f5a623] resize-none"
              rows={3}
            />
            <div className="mb-4">
              <label className="text-sm text-gray-400 mb-2 block">Hot seat size: {hotSeats}</label>
              <input
                type="range"
                min={2}
                max={12}
                value={hotSeats}
                onChange={e => setHotSeats(parseInt(e.target.value))}
                className="w-full accent-[#f5a623]"
              />
            </div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <label className="text-sm text-gray-300 mb-1 block">🔐 FC Identity Gating</label>
                <span className="text-xs text-gray-500">Only allow verified FC users with quality score</span>
              </div>
              <input
                type="checkbox"
                checked={gatingEnabled}
                onChange={e => setGatingEnabled(e.target.checked)}
                className="w-5 h-5 accent-[#f5a623]"
              />
            </div>
            {gatingEnabled && (
              <div className="mb-4">
                <label className="text-sm text-gray-400 mb-2 block">Minimum quality score: {minQualityScore}</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={minQualityScore}
                  onChange={e => setMinQualityScore(parseInt(e.target.value))}
                  className="w-full accent-[#f5a623]"
                />
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                disabled={!title.trim() || !user}
                className="flex-1 bg-[#f5a623] text-[#0a1628] font-semibold py-3 rounded-lg hover:bg-[#d4941f] transition-colors disabled:opacity-50"
              >
                {user ? 'Create' : 'Sign in first'}
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="px-6 py-3 border border-white/20 rounded-lg hover:bg-white/5"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Room List */}
      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading rooms...</div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 mb-4">No fishbowls yet.</p>
            <p className="text-gray-500 text-sm">Be the first to create one!</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map(room => (
              <Link key={room.id} href={`/fishbowlz/${room.slug || room.id}`}>
                <div className={`bg-[#1a2a4a] rounded-xl p-5 border border-white/10 transition-colors cursor-pointer ${
                  room.state === 'active' ? 'hover:border-[#f5a623]/50' : 'hover:border-white/20 opacity-75'
                }`}>
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-lg truncate flex-1">{room.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ml-2 ${
                      room.state === 'active'
                        ? 'bg-[#f5a623]/20 text-[#f5a623]'
                        : 'bg-gray-600/20 text-gray-400'
                    }`}>
                      {room.state}
                    </span>
                  </div>
                  {room.description && (
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">{room.description}</p>
                  )}
                  {room.gating_enabled && (
                    <span className="inline-flex items-center gap-1 text-xs bg-purple-600/20 text-purple-400 px-2 py-0.5 rounded-full mb-2">
                      🔐 FC-gated
                    </span>
                  )}
                  {room.state === 'ended' ? (
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>📝 View transcript</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>🔥 {room.current_speakers?.length || 0}/{room.hot_seat_count} hot seat</span>
                      <span>👥 {room.current_listeners?.length || 0} listening</span>
                    </div>
                  )}
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      {room.host_pfp ? (
                        <img src={room.host_pfp} alt="" className="w-4 h-4 rounded-full" />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-gray-600 flex items-center justify-center text-[8px] text-gray-400">
                          {room.host_username[0]?.toUpperCase()}
                        </div>
                      )}
                      <span>@{room.host_username}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {room.state === 'active' && (
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          {(room.current_speakers?.length || 0) + (room.current_listeners?.length || 0)} in room
                        </span>
                      )}
                      <span>{timeAgo(room.last_active_at)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
