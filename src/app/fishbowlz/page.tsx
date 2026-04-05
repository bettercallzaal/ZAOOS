'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface FishbowlRoom {
  id: string;
  title: string;
  description: string | null;
  host_name: string;
  host_username: string;
  state: string;
  hot_seat_count: number;
  current_speakers: Array<{ fid: number; username: string; joinedAt: string }>;
  current_listeners: Array<{ fid: number; username: string; joinedAt: string }>;
  total_sessions: number;
  created_at: string;
  last_active_at: string;
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

  useEffect(() => {
    fetch('/api/fishbowlz/rooms')
      .then(r => r.json())
      .then(d => {
        const rooms = (d.rooms || []).map((r: FishbowlRoom & Record<string, unknown>) => ({
          ...r,
          current_speakers: typeof r.current_speakers === 'string' ? JSON.parse(r.current_speakers as string) : (r.current_speakers || []),
          current_listeners: typeof r.current_listeners === 'string' ? JSON.parse(r.current_listeners as string) : (r.current_listeners || []),
        }));
        setRooms(rooms);
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
      router.push(`/fishbowlz/${room.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1628] text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#f5a623]">FISHBOWLZ</h1>
          <p className="text-sm text-gray-400">Persistent async fishbowl audio spaces</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-[#f5a623] text-[#0a1628] font-semibold px-4 py-2 rounded-lg hover:bg-[#d4941f] transition-colors"
        >
          + Create Room
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a2a4a] rounded-xl p-6 w-full max-w-md border border-white/10">
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
      <div className="p-6">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading rooms...</div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 mb-4">No active fishbowls yet.</p>
            <p className="text-gray-500 text-sm">Be the first to create one!</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map(room => (
              <Link key={room.id} href={`/fishbowlz/${room.id}`}>
                <div className="bg-[#1a2a4a] rounded-xl p-5 border border-white/10 hover:border-[#f5a623]/50 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-lg truncate flex-1">{room.title}</h3>
                    <span className="text-xs bg-[#f5a623]/20 text-[#f5a623] px-2 py-1 rounded-full ml-2">
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
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>🔥 {room.current_speakers?.length || 0}/{room.hot_seat_count} hot seat</span>
                    <span>👥 {room.current_listeners?.length || 0} listening</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-gray-500">
                    <span>by @{room.host_username}</span>
                    <span>{room.total_sessions} sessions</span>
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
