'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { usePlayer } from '@/providers/audio';
import { useAuth } from '@/hooks/useAuth';
import type { TrackMetadata } from '@/types/music';
import type { Playlist, Track, PlaylistMember } from './CollaborativePlaylists';

// ── Add Track Modal ────────────────────────────────────────────────────
function AddTrackModal({ playlistId, onClose, onAdded }: { playlistId: string; onClose: () => void; onAdded: () => void }) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async () => {
    if (!url.trim()) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/music/playlists/collaborative/${playlistId}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          song_url: url.trim(),
          song_title: title.trim() || undefined,
          song_artist: artist.trim() || undefined,
        }),
      });
      if (res.ok) {
        onAdded();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to add track');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-[#0d1b2a] border border-white/[0.08] rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-white mb-4">Add Track</h3>
        <input
          className="w-full bg-white/5 border border-white/[0.08] rounded-lg px-4 py-3 text-white placeholder-gray-500 mb-3 focus:outline-none focus:border-[#f5a623]"
          placeholder="Track URL (Spotify, SoundCloud, etc.)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <input
          className="w-full bg-white/5 border border-white/[0.08] rounded-lg px-4 py-3 text-white placeholder-gray-500 mb-3 focus:outline-none focus:border-[#f5a623]"
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="w-full bg-white/5 border border-white/[0.08] rounded-lg px-4 py-3 text-white placeholder-gray-500 mb-4 focus:outline-none focus:border-[#f5a623]"
          placeholder="Artist (optional)"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
        />
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-colors">Cancel</button>
          <button onClick={handleAdd} disabled={!url.trim() || saving} className="flex-1 px-4 py-2.5 rounded-lg bg-[#f5a623] text-[#0a1628] font-medium hover:bg-[#f5a623]/90 transition-colors disabled:opacity-50">
            {saving ? 'Adding...' : 'Add Track'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Track Row ──────────────────────────────────────────────────────────
function TrackRow({ track, onVote, onPlay }: {
  track: Track;
  onVote: (trackId: string, vote: 1 | -1) => void;
  onPlay: (track: Track) => void;
}) {
  return (
    <div className="flex items-center gap-3 py-3 px-3 rounded-lg hover:bg-white/5 transition-colors group">
      <button onClick={() => onPlay(track)} className="relative w-10 h-10 flex-shrink-0 rounded-md overflow-hidden bg-white/10">
        {track.song_artwork_url ? (
          <Image src={track.song_artwork_url || '/default-track.png'} alt="" width={40} height={40} className="w-full h-full object-cover" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
        </div>
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{track.song_title || 'Untitled'}</p>
        <p className="text-xs text-gray-400 truncate">{track.song_artist || 'Unknown artist'}</p>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onVote(track.id, 1)}
          className={`p-1.5 rounded transition-colors ${track.user_vote === 1 ? 'text-[#f5a623]' : 'text-gray-500 hover:text-white'}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
        <span className={`text-xs font-medium min-w-[20px] text-center ${track.votes > 0 ? 'text-[#f5a623]' : track.votes < 0 ? 'text-red-400' : 'text-gray-500'}`}>
          {track.votes}
        </span>
        <button
          onClick={() => onVote(track.id, -1)}
          className={`p-1.5 rounded transition-colors ${track.user_vote === -1 ? 'text-red-400' : 'text-gray-500 hover:text-white'}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Expanded Playlist Detail ───────────────────────────────────────────
export function PlaylistDetail({ playlist, onBack }: { playlist: Playlist; onBack: () => void }) {
  const player = usePlayer();
  const { user } = useAuth();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [members, setMembers] = useState<PlaylistMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [showAddTrack, setShowAddTrack] = useState(false);
  const [joining, setJoining] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      const res = await fetch(`/api/music/playlists/collaborative/${playlist.id}`);
      if (!res.ok) return;
      const data = await res.json();
      setTracks(data.tracks || []);
      setMembers(data.members || []);
    } finally {
      setLoading(false);
    }
  }, [playlist.id]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  useEffect(() => {
    const myFid = user?.fid;
    setIsMember(!!myFid && Array.isArray(playlist.member_fids) && playlist.member_fids.includes(myFid));
  }, [playlist.member_fids, user?.fid]);

  const handleVote = async (trackId: string, vote: 1 | -1) => {
    const res = await fetch(`/api/music/playlists/collaborative/${playlist.id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackId, vote }),
    });
    if (res.ok) {
      const data = await res.json();
      setTracks((prev) => prev.map((t) =>
        t.id === trackId ? { ...t, votes: data.votes, user_vote: data.user_vote } : t
      ));
    }
  };

  const handlePlay = (track: Track) => {
    const metadata: TrackMetadata = {
      id: track.id,
      type: (track.song_platform as TrackMetadata['type']) || 'audio',
      trackName: track.song_title || 'Untitled',
      artistName: track.song_artist || 'Unknown',
      artworkUrl: track.song_artwork_url || '',
      url: track.song_url,
      streamUrl: track.song_stream_url || undefined,
      feedId: track.id,
    };
    player.play(metadata);
  };

  const handleJoin = async () => {
    setJoining(true);
    try {
      const res = await fetch(`/api/music/playlists/collaborative/${playlist.id}/join`, { method: 'POST' });
      if (res.ok) {
        setIsMember(true);
        fetchDetail();
      }
    } finally {
      setJoining(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white">{playlist.name}</h3>
          {playlist.description && <p className="text-sm text-gray-400">{playlist.description}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-gray-500">{tracks.length} tracks</span>
        <span className="text-xs text-gray-600">|</span>
        <span className="text-xs text-gray-500">{members.length} members</span>
        <div className="flex-1" />
        {!isMember && (
          <button onClick={handleJoin} disabled={joining} className="px-3 py-1.5 rounded-lg bg-[#f5a623]/10 text-[#f5a623] text-xs font-medium hover:bg-[#f5a623]/20 transition-colors disabled:opacity-50">
            {joining ? 'Joining...' : 'Join'}
          </button>
        )}
        <button onClick={() => setShowAddTrack(true)} className="px-3 py-1.5 rounded-lg bg-[#f5a623] text-[#0a1628] text-xs font-medium hover:bg-[#f5a623]/90 transition-colors flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          Add Track
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : tracks.length === 0 ? (
        <p className="text-center text-gray-500 py-8 text-sm">No tracks yet. Be the first to add one!</p>
      ) : (
        <div className="divide-y divide-gray-800/50">
          {tracks.map((track) => (
            <TrackRow key={track.id} track={track} onVote={handleVote} onPlay={handlePlay} />
          ))}
        </div>
      )}

      {showAddTrack && (
        <AddTrackModal playlistId={playlist.id} onClose={() => setShowAddTrack(false)} onAdded={fetchDetail} />
      )}
    </div>
  );
}
