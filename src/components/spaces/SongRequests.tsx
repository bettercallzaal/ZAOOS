'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { getSupabaseBrowser } from '@/lib/db/supabase';
import { useQueue } from '@/contexts/QueueContext';
import type { TrackMetadata } from '@/types/music';

interface SongRequest {
  id: string;
  room_id: string;
  requester_fid: number;
  requester_name: string | null;
  song_url: string;
  song_title: string | null;
  song_artist: string | null;
  song_artwork: string | null;
  status: string;
  created_at: string;
}

interface SongRequestsProps {
  roomId: string;
  isHost: boolean;
}

export function SongRequests({ roomId, isHost }: SongRequestsProps) {
  const [requests, setRequests] = useState<SongRequest[]>([]);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { addToQueue } = useQueue();

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch(`/api/spaces/song-request?roomId=${roomId}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests ?? []);
      }
    } catch { /* ignore */ }
  }, [roomId]);

  // Initial fetch on mount
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Realtime subscription for song request changes
  useEffect(() => {
    const supabase = getSupabaseBrowser();
    const channel = supabase
      .channel(`song-requests:${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'song_requests', filter: `room_id=eq.${roomId}` },
        () => fetchRequests(),
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId, fetchRequests]);

  const handleSubmit = async () => {
    if (!url.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/spaces/song-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          songUrl: url.trim(),
          songTitle: title.trim() || undefined,
        }),
      });
      if (res.ok) {
        setUrl('');
        setTitle('');
        await fetchRequests();
      }
    } catch { /* ignore */ }
    setSubmitting(false);
  };

  const handleAction = async (requestId: string, status: 'accepted' | 'rejected', req?: SongRequest) => {
    try {
      const res = await fetch('/api/spaces/song-request', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status }),
      });
      if (res.ok && status === 'accepted' && req) {
        const track: TrackMetadata = {
          id: req.id,
          type: 'audio',
          trackName: req.song_title || 'Requested Track',
          artistName: req.song_artist || req.requester_name || 'Unknown',
          artworkUrl: req.song_artwork || '',
          url: req.song_url,
          feedId: req.id,
        };
        addToQueue(track);
      }
      await fetchRequests();
    } catch { /* ignore */ }
  };

  const pendingRequests = requests.filter((r) => r.status === 'pending');

  return (
    <div className="flex flex-col gap-3 px-3 py-3">
      {/* Submit form (listeners) */}
      {!isHost && (
        <div className="space-y-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste song URL..."
            className="w-full bg-white/5 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#f5a623]/50"
          />
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Song title (optional)"
            className="w-full bg-white/5 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#f5a623]/50"
          />
          <button
            onClick={handleSubmit}
            disabled={!url.trim() || submitting}
            className="w-full py-2 rounded-lg bg-[#f5a623] text-[#0a1628] text-sm font-semibold hover:bg-[#ffd700] disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Sending...' : 'Request Song'}
          </button>
        </div>
      )}

      {/* Requests list */}
      {pendingRequests.length === 0 ? (
        <p className="text-center text-gray-500 text-xs py-4">
          {isHost ? 'No pending requests' : 'No requests yet'}
        </p>
      ) : (
        <div className="flex flex-col gap-1.5 max-h-[250px] overflow-y-auto">
          {pendingRequests.map((req) => (
            <div
              key={req.id}
              className="flex items-center gap-2.5 p-2 bg-white/5 rounded-lg border border-transparent"
            >
              {req.song_artwork ? (
                <Image src={req.song_artwork || '/default-track.png'} alt="" width={32} height={32} className="w-8 h-8 rounded object-cover flex-shrink-0" unoptimized />
              ) : (
                <div className="w-8 h-8 rounded bg-[#f5a623]/10 flex items-center justify-center flex-shrink-0">
                  <RequestIcon />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs text-white font-medium truncate">
                  {req.song_title || 'Untitled'}
                </p>
                <p className="text-[10px] text-gray-400 truncate">
                  from {req.requester_name || 'Anonymous'}
                </p>
              </div>
              {isHost && (
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleAction(req.id, 'accepted', req)}
                    className="px-2 py-1 rounded bg-green-600/20 text-green-400 text-[10px] font-medium hover:bg-green-600/30 transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleAction(req.id, 'rejected')}
                    className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-[10px] font-medium hover:bg-red-500/30 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RequestIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f5a623" strokeWidth="2">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}
