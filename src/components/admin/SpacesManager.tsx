'use client';

import { useState, useEffect, useCallback } from 'react';

interface Room {
  id: string;
  title: string;
  host_name: string;
  host_username: string;
  state: 'live' | 'ended';
  participant_count: number;
  provider?: string;
  theme?: string;
  created_at: string;
  ended_at: string | null;
}

export function SpacesManager() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'live' | 'ended'>('all');
  const [ending, setEnding] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/spaces');
      if (!res.ok) return;
      const data = await res.json();
      setRooms(data.rooms ?? []);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const handleEnd = async (roomId: string) => {
    if (!confirm('End this space? All participants will be disconnected.')) return;
    setEnding(roomId);
    try {
      const res = await fetch(`/api/stream/rooms/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end' }),
      });
      if (res.ok) {
        setRooms(prev => prev.map(r => r.id === roomId ? { ...r, state: 'ended' as const, ended_at: new Date().toISOString() } : r));
      }
    } catch { /* ignore */ } finally {
      setEnding(null);
    }
  };

  const handleDelete = async (roomId: string) => {
    if (!confirm('Permanently delete this space? This cannot be undone.')) return;
    setDeleting(roomId);
    try {
      const res = await fetch(`/api/admin/spaces/${roomId}`, { method: 'DELETE' });
      if (res.ok) {
        setRooms(prev => prev.filter(r => r.id !== roomId));
      }
    } catch { /* ignore */ } finally {
      setDeleting(null);
    }
  };

  const filtered = rooms.filter(r => filter === 'all' || r.state === filter);

  if (loading) {
    return (
      <div className="space-y-3 mt-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-[#111d2e] rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-4">
      {/* Filter */}
      <div className="flex items-center gap-2 mb-4">
        {(['all', 'live', 'ended'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === f
                ? 'bg-[#f5a623]/15 text-[#f5a623]'
                : 'text-gray-400 hover:text-white bg-white/5'
            }`}
          >
            {f === 'all' ? `All (${rooms.length})` : f === 'live' ? `Live (${rooms.filter(r => r.state === 'live').length})` : `Ended (${rooms.filter(r => r.state === 'ended').length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500 text-sm">
          No spaces found
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(room => (
            <div key={room.id} className="flex items-center gap-3 bg-[#0d1b2a] border border-white/[0.08] rounded-lg px-4 py-3">
              {/* Status dot */}
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${room.state === 'live' ? 'bg-green-500' : 'bg-gray-600'}`} />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-medium truncate">{room.title}</span>
                  {room.provider && room.provider !== 'stream' && (
                    <span className="text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full">{room.provider}</span>
                  )}
                  {room.theme && room.theme !== 'default' && (
                    <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full">{room.theme}</span>
                  )}
                </div>
                <div className="text-gray-500 text-xs">
                  @{room.host_username} &middot; {room.participant_count} listeners &middot; {new Date(room.created_at).toLocaleDateString()}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {room.state === 'live' && (
                  <button
                    onClick={() => handleEnd(room.id)}
                    disabled={ending === room.id}
                    className="px-3 py-1 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    {ending === room.id ? 'Ending...' : 'End'}
                  </button>
                )}
                <button
                  onClick={() => handleDelete(room.id)}
                  disabled={deleting === room.id}
                  className="px-3 py-1 text-xs font-medium text-gray-400 bg-white/5 border border-white/[0.08] rounded-lg hover:bg-white/10 hover:text-red-400 transition-colors disabled:opacity-50"
                >
                  {deleting === room.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
