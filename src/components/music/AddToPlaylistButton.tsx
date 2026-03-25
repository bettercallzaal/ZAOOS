'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface Playlist {
  id: string;
  name: string;
  trackCount: number;
  collaborative?: boolean;
}

interface AddToPlaylistButtonProps {
  /** The music URL to add */
  songUrl: string;
  /** Optional: compact icon-only mode (for queue cards / player) */
  compact?: boolean;
  /** Optional: extra CSS classes */
  className?: string;
}

export function AddToPlaylistButton({ songUrl, compact = false, className = '' }: AddToPlaylistButtonProps) {
  const [open, setOpen] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null); // playlist id being added to
  const [success, setSuccess] = useState<string | null>(null); // playlist id that succeeded
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
        setNewName('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Focus input when creating
  useEffect(() => {
    if (creating) inputRef.current?.focus();
  }, [creating]);

  // Clear success after delay
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => {
      setSuccess(null);
      setOpen(false);
    }, 1200);
    return () => clearTimeout(t);
  }, [success]);

  const fetchPlaylists = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/music/playlists?type=all');
      if (res.ok) {
        const data = await res.json();
        setPlaylists(data.playlists || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    fetchPlaylists();
  };

  const addToPlaylist = async (playlistId: string) => {
    setAdding(playlistId);
    try {
      // Step 1: Upsert song to library to get songId
      const libRes = await fetch('/api/music/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: songUrl }),
      });
      if (!libRes.ok) throw new Error('Failed to add song to library');
      const { song } = await libRes.json();

      // Step 2: Add to playlist
      const addRes = await fetch(`/api/music/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songId: song.id }),
      });
      if (!addRes.ok) throw new Error('Failed to add to playlist');

      setSuccess(playlistId);
    } catch {
      // Could show error, but keep it simple
    }
    setAdding(null);
  };

  const createAndAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    setAdding('new');
    try {
      // Create playlist
      const createRes = await fetch('/api/music/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!createRes.ok) throw new Error('Failed to create playlist');
      const { playlist } = await createRes.json();

      // Add song to it
      await addToPlaylist(playlist.id);
      setCreating(false);
      setNewName('');
      // Refresh list
      fetchPlaylists();
    } catch {
      setAdding(null);
    }
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        onClick={handleOpen}
        className={`flex items-center justify-center transition-colors ${
          compact
            ? 'p-1.5 text-gray-400 hover:text-white rounded'
            : 'p-1.5 text-gray-400 hover:text-[#f5a623] rounded-lg hover:bg-white/5'
        }`}
        aria-label="Add to playlist"
        title="Add to playlist"
      >
        <svg className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>

      {/* Popover */}
      {open && (
        <div
          className="absolute bottom-full right-0 mb-2 w-56 bg-[#111827] border border-gray-700 rounded-xl shadow-2xl shadow-black/60 z-50 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 border-b border-gray-700/50">
            <p className="text-xs font-semibold text-gray-300">Add to playlist</p>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="px-3 py-4 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-gray-600 border-t-[#f5a623] rounded-full animate-spin" />
              </div>
            ) : playlists.length === 0 && !creating ? (
              <div className="px-3 py-3 text-center">
                <p className="text-xs text-gray-500">No playlists yet</p>
              </div>
            ) : (
              playlists.map((pl) => (
                <button
                  key={pl.id}
                  onClick={() => addToPlaylist(pl.id)}
                  disabled={adding !== null}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors text-left disabled:opacity-50"
                >
                  <svg className="w-4 h-4 text-gray-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate flex items-center gap-1">
                      {pl.name}
                      {pl.collaborative && (
                        <span className="inline-flex items-center px-1 py-px rounded text-[8px] font-medium bg-[#f5a623]/15 text-[#f5a623] leading-none">
                          collab
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-gray-500">{pl.trackCount} track{pl.trackCount !== 1 ? 's' : ''}</p>
                  </div>
                  {adding === pl.id ? (
                    <div className="w-3.5 h-3.5 border-2 border-gray-600 border-t-[#f5a623] rounded-full animate-spin flex-shrink-0" />
                  ) : success === pl.id ? (
                    <svg className="w-4 h-4 text-green-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : null}
                </button>
              ))
            )}
          </div>

          {/* Create new playlist */}
          <div className="border-t border-gray-700/50">
            {creating ? (
              <div className="flex items-center gap-1.5 px-2 py-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') createAndAdd();
                    if (e.key === 'Escape') { setCreating(false); setNewName(''); }
                  }}
                  placeholder="Playlist name..."
                  maxLength={100}
                  className="flex-1 bg-transparent border border-gray-600 rounded-lg px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#f5a623]/50"
                />
                <button
                  onClick={createAndAdd}
                  disabled={!newName.trim() || adding === 'new'}
                  className="p-1 text-[#f5a623] hover:bg-[#f5a623]/10 rounded disabled:opacity-30 flex-shrink-0"
                >
                  {adding === 'new' ? (
                    <div className="w-4 h-4 border-2 border-gray-600 border-t-[#f5a623] rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors text-left"
              >
                <svg className="w-4 h-4 text-[#f5a623] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="text-xs text-[#f5a623]">New playlist</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
