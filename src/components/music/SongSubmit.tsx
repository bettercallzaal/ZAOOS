'use client';

import { useState, useEffect, useCallback } from 'react';
import { isMusicUrl } from '@/lib/music/isMusicUrl';
import { usePlayer } from '@/providers/audio';

interface Submission {
  id: string;
  url: string;
  title: string | null;
  artist: string | null;
  note: string | null;
  track_type: string;
  channel: string;
  submitted_by_username: string;
  submitted_by_display: string | null;
  submitted_by_fid: number;
  created_at: string;
}

interface SongSubmitProps {
  channel: string;
  isOpen: boolean;
  onClose: () => void;
}

export function SongSubmit({ channel, isOpen, onClose }: SongSubmitProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [urlValid, setUrlValid] = useState<boolean | null>(null);
  const player = usePlayer();

  const fetchSubmissions = useCallback(async () => {
    try {
      const res = await fetch(`/api/music/submissions?channel=${channel}`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [channel]);

  useEffect(() => {
    if (isOpen) fetchSubmissions();
  }, [isOpen, fetchSubmissions]);

  // Validate URL as user types
  useEffect(() => {
    if (!url.trim()) {
      setUrlValid(null);
      return;
    }
    setUrlValid(!!isMusicUrl(url.trim()));
  }, [url]);

  const showFeedback = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSubmit = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;

    if (!isMusicUrl(trimmedUrl)) {
      showFeedback('error', 'Not a recognized music URL');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/music/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: trimmedUrl,
          title: title.trim() || undefined,
          artist: artist.trim() || undefined,
          note: note.trim() || undefined,
          channel,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showFeedback('success', 'Song submitted!');
        setUrl('');
        setTitle('');
        setArtist('');
        setNote('');
        fetchSubmissions();
      } else {
        showFeedback('error', data.error || 'Failed to submit');
      }
    } catch {
      showFeedback('error', 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this submission?')) return;
    const res = await fetch('/api/music/submissions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      showFeedback('success', 'Removed');
      fetchSubmissions();
    }
  };

  const platformLabel = (type: string) => {
    const labels: Record<string, string> = {
      spotify: 'Spotify',
      soundcloud: 'SoundCloud',
      youtube: 'YouTube',
      audius: 'Audius',
      soundxyz: 'Sound.xyz',
      applemusic: 'Apple Music',
      tidal: 'Tidal',
      bandcamp: 'Bandcamp',
      audio: 'Audio',
    };
    return labels[type] || type;
  };

  const platformColor = (type: string) => {
    const colors: Record<string, string> = {
      spotify: 'bg-green-500/20 text-green-400',
      soundcloud: 'bg-orange-500/20 text-orange-400',
      youtube: 'bg-red-500/20 text-red-400',
      audius: 'bg-purple-500/20 text-purple-400',
      soundxyz: 'bg-blue-500/20 text-blue-400',
      applemusic: 'bg-pink-500/20 text-pink-400',
      tidal: 'bg-cyan-500/20 text-cyan-400',
      bandcamp: 'bg-sky-500/20 text-sky-400',
      audio: 'bg-gray-500/20 text-gray-400',
    };
    return colors[type] || 'bg-gray-500/20 text-gray-400';
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-[#0d1b2a] border-t border-gray-800 rounded-t-2xl max-h-[85vh] flex flex-col sm:inset-auto sm:right-0 sm:top-0 sm:bottom-0 sm:w-[400px] sm:rounded-none sm:border-l sm:border-t-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 flex-shrink-0">
          <h2 className="text-sm font-semibold text-[#f5a623]">Submit a Song</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Feedback toast */}
        {feedback && (
          <div className={`mx-4 mt-3 px-3 py-2 rounded-lg text-sm ${
            feedback.type === 'success'
              ? 'bg-green-500/20 text-green-400'
              : 'bg-red-500/20 text-red-400'
          }`}>
            {feedback.msg}
          </div>
        )}

        {/* Submit form */}
        <div className="px-4 py-3 border-b border-gray-800 flex-shrink-0">
          <div className="space-y-2.5">
            {/* URL input with validation indicator */}
            <div className="relative">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste a song link (Spotify, SoundCloud, YouTube...)"
                className={`w-full bg-[#1a2a3a] text-white text-sm rounded-lg px-3 py-2.5 pr-8 placeholder-gray-500 focus:outline-none focus:ring-1 ${
                  urlValid === false
                    ? 'focus:ring-red-400 ring-1 ring-red-400/50'
                    : urlValid === true
                    ? 'focus:ring-green-400 ring-1 ring-green-400/50'
                    : 'focus:ring-[#f5a623]'
                }`}
              />
              {urlValid !== null && (
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm ${
                  urlValid ? 'text-green-400' : 'text-red-400'
                }`}>
                  {urlValid ? '✓' : '✗'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Song title (optional)"
                className="bg-[#1a2a3a] text-white text-sm rounded-lg px-3 py-2 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623]"
              />
              <input
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Artist (optional)"
                className="bg-[#1a2a3a] text-white text-sm rounded-lg px-3 py-2 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623]"
              />
            </div>

            <div className="flex gap-2">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Why this song? (optional)"
                className="flex-1 bg-[#1a2a3a] text-white text-sm rounded-lg px-3 py-2 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623]"
              />
              <button
                onClick={handleSubmit}
                disabled={submitting || !url.trim() || urlValid === false}
                className="bg-[#f5a623] text-[#0a1628] text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#ffd700] disabled:opacity-50 transition-colors flex-shrink-0"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-600 mt-2">
            Supported: Spotify, Apple Music, SoundCloud, YouTube, Tidal, Bandcamp, Audius, Sound.xyz, direct audio
          </p>
        </div>

        {/* Submissions list */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">
            Submissions in #{channel} ({submissions.length})
          </h3>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : submissions.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              No songs submitted yet. Be the first!
            </p>
          ) : (
            <div className="space-y-2">
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="bg-[#1a2a3a] rounded-xl p-3 hover:bg-[#1e3048] transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    {/* Play button */}
                    <button
                      onClick={() => {
                        player.play({
                          id: sub.id,
                          type: sub.track_type as 'spotify' | 'soundcloud' | 'youtube' | 'audius' | 'soundxyz' | 'audio',
                          url: sub.url,
                          trackName: sub.title || 'Unknown',
                          artistName: sub.artist || sub.submitted_by_display || sub.submitted_by_username,
                          artworkUrl: '',
                          feedId: sub.id,
                        });
                      }}
                      className="w-8 h-8 flex-shrink-0 rounded-full bg-[#f5a623]/10 flex items-center justify-center text-[#f5a623] hover:bg-[#f5a623]/20 transition-colors mt-0.5"
                      title="Play"
                    >
                      <svg className="w-3.5 h-3.5 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-white font-medium truncate">
                          {sub.title || 'Untitled'}
                        </p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${platformColor(sub.track_type)}`}>
                          {platformLabel(sub.track_type)}
                        </span>
                      </div>
                      {sub.artist && (
                        <p className="text-xs text-gray-400 truncate">{sub.artist}</p>
                      )}
                      {sub.note && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">&ldquo;{sub.note}&rdquo;</p>
                      )}
                      <p className="text-[10px] text-gray-600 mt-1">
                        by @{sub.submitted_by_username} &middot; {new Date(sub.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Delete button (visible on hover) */}
                    <button
                      onClick={() => handleDelete(sub.id)}
                      className="text-red-400/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 p-1"
                      title="Remove"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
