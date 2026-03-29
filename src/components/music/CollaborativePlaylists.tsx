'use client';

import { useState, useEffect, useCallback } from 'react';
import { PlaylistDetail } from '@/components/music/CollaborativePlaylistDetail';

export type Playlist = {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  created_by_fid: number;
  is_collaborative: boolean;
  track_count: number;
  member_count: number;
  member_fids: number[];
  created_at: string;
};

export type Track = {
  id: string;
  song_url: string;
  song_title: string | null;
  song_artist: string | null;
  song_artwork_url: string | null;
  song_platform: string | null;
  song_stream_url: string | null;
  added_by_fid: number;
  votes: number;
  user_vote: number;
};

export type PlaylistMember = {
  fid: number;
  role: string;
};

// ── Create Playlist Modal ──────────────────────────────────────────────
function CreatePlaylistModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/music/playlists/collaborative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined, is_collaborative: true }),
      });
      if (res.ok) {
        onCreated();
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-[#0d1b2a] border border-gray-700 rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-white mb-4">Create Collaborative Playlist</h3>
        <input
          className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 mb-3 focus:outline-none focus:border-[#f5a623]"
          placeholder="Playlist name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
        />
        <textarea
          className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 mb-4 resize-none focus:outline-none focus:border-[#f5a623]"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={500}
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-colors">Cancel</button>
          <button onClick={handleCreate} disabled={!name.trim() || saving} className="flex-1 px-4 py-2.5 rounded-lg bg-[#f5a623] text-[#0a1628] font-medium hover:bg-[#f5a623]/90 transition-colors disabled:opacity-50">
            {saving ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Playlist Card ──────────────────────────────────────────────────────
function PlaylistCard({ playlist, onClick }: { playlist: Playlist; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-left bg-[#0d1b2a] border border-gray-800/50 rounded-xl p-4 hover:border-[#f5a623]/30 transition-all group">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#f5a623]/20 to-[#f5a623]/5 flex items-center justify-center flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f5a623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-white group-hover:text-[#f5a623] transition-colors truncate">{playlist.name}</p>
          {playlist.description && <p className="text-xs text-gray-500 truncate mt-0.5">{playlist.description}</p>}
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-gray-500">{playlist.track_count} tracks</span>
            <span className="text-xs text-gray-500">{playlist.member_count} members</span>
          </div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600 group-hover:text-[#f5a623] transition-colors mt-1 flex-shrink-0">
          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </button>
  );
}

// ── Main Export ─────────────────────────────────────────────────────────
export function CollaborativePlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

  const fetchPlaylists = useCallback(async () => {
    try {
      const res = await fetch('/api/music/playlists/collaborative');
      if (!res.ok) return;
      const data = await res.json();
      setPlaylists(data.playlists || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlaylists(); }, [fetchPlaylists]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">Collaborative Playlists</h2>
          <p className="text-sm text-gray-400 mt-0.5">Create and curate playlists together</p>
        </div>
        {!selectedPlaylist && (
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 rounded-lg bg-[#f5a623] text-[#0a1628] text-sm font-medium hover:bg-[#f5a623]/90 transition-colors flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            New
          </button>
        )}
      </div>

      {selectedPlaylist ? (
        <PlaylistDetail playlist={selectedPlaylist} onBack={() => { setSelectedPlaylist(null); fetchPlaylists(); }} />
      ) : loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : playlists.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-[#f5a623]/10 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f5a623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <p className="text-gray-400 text-sm mb-3">No collaborative playlists yet</p>
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 rounded-lg bg-[#f5a623] text-[#0a1628] text-sm font-medium">
            Create the first one
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {playlists.map((p) => (
            <PlaylistCard key={p.id} playlist={p} onClick={() => setSelectedPlaylist(p)} />
          ))}
        </div>
      )}

      {showCreate && <CreatePlaylistModal onClose={() => setShowCreate(false)} onCreated={fetchPlaylists} />}
    </div>
  );
}
