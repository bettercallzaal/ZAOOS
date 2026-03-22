'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { isMusicUrl } from '@/lib/music/isMusicUrl';
import { usePlayer } from '@/providers/audio';
import type { TrackMetadata } from '@/types/music';
import { ShareToFarcaster, shareTemplates } from '@/components/social/ShareToFarcaster';

/**
 * Floating "+" button + bottom sheet for quick song submission from any page.
 * Auto-fetches metadata when a valid music URL is pasted.
 */
const GENRE_TAGS = ['Hip-Hop', 'R&B', 'Electronic', 'Lo-Fi', 'Jazz', 'Afrobeats', 'Soul', 'Experimental'] as const;

export function QuickAddSong() {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [metadata, setMetadata] = useState<TrackMetadata | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const player = usePlayer();

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : prev.length < 3
        ? [...prev, tag]
        : prev
    );
  };

  // Auto-fetch metadata when URL changes
  const fetchMetadata = useCallback(async (musicUrl: string) => {
    const type = isMusicUrl(musicUrl);
    if (!type) {
      setMetadata(null);
      return;
    }

    setLoadingMeta(true);
    try {
      const res = await fetch(`/api/music/metadata?url=${encodeURIComponent(musicUrl)}`);
      if (res.ok) {
        const data = await res.json();
        setMetadata(data);
      } else {
        setMetadata(null);
      }
    } catch {
      setMetadata(null);
    }
    setLoadingMeta(false);
  }, []);

  // Debounced URL check
  useEffect(() => {
    if (!url.trim()) {
      queueMicrotask(() => setMetadata(null));
      return;
    }
    const timer = setTimeout(() => fetchMetadata(url.trim()), 500);
    return () => clearTimeout(timer);
  }, [url, fetchMetadata]);

  const handleSubmit = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl || !isMusicUrl(trimmedUrl)) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/music/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: trimmedUrl,
          title: metadata?.trackName || undefined,
          artist: metadata?.artistName || undefined,
          note: note.trim() || undefined,
          tags: tags.length > 0 ? tags : undefined,
          channel: 'zao',
        }),
      });

      if (res.ok) {
        setFeedback({ type: 'success', msg: 'Song added!' });
        // Auto-play the submitted song
        if (metadata) {
          player.play({ ...metadata, feedId: metadata.id });
        }
        setTimeout(() => {
          setUrl('');
          setNote('');
          setTags([]);
          setMetadata(null);
          setFeedback(null);
          setIsOpen(false);
        }, 1500);
      } else {
        const data = await res.json();
        setFeedback({ type: 'error', msg: data.error || 'Failed to submit' });
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch {
      setFeedback({ type: 'error', msg: 'Failed to submit' });
      setTimeout(() => setFeedback(null), 3000);
    }
    setSubmitting(false);
  };

  const handlePlayPreview = () => {
    if (!metadata) return;
    player.play({ ...metadata, feedId: metadata.id });
  };

  const urlType = url.trim() ? isMusicUrl(url.trim()) : null;

  return (
    <>
      {/* Floating add button */}
      {!isOpen && !player.metadata && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-4 md:bottom-4 z-20 w-12 h-12 rounded-full bg-[#f5a623] text-[#0a1628] shadow-lg shadow-[#f5a623]/20 hover:bg-[#ffd700] active:scale-95 transition-all flex items-center justify-center"
          aria-label="Add a song"
          title="Add a song"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      )}

      {/* Bottom sheet */}
      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-50" onClick={() => setIsOpen(false)} />

          <div className="fixed inset-x-0 bottom-0 z-50 bg-[#0d1b2a] border-t border-gray-800 rounded-t-2xl max-h-[70vh] flex flex-col animate-slide-up">
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-700" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800/50">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#f5a623]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
                <h3 className="text-sm font-semibold text-white">Add a Song</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white p-1">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-4 py-4 space-y-3">
              {/* Feedback */}
              {feedback && (
                <div className={`px-3 py-2 rounded-lg text-sm ${
                  feedback.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {feedback.msg}
                </div>
              )}

              {/* URL input */}
              <div className="relative">
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste any music link..."
                  autoFocus
                  className={`w-full bg-[#1a2a3a] text-white text-base md:text-sm rounded-lg px-3 py-3 pr-8 placeholder-gray-500 focus:outline-none focus:ring-1 ${
                    urlType ? 'focus:ring-green-400 ring-1 ring-green-400/50' :
                    url.trim() && !urlType ? 'focus:ring-red-400 ring-1 ring-red-400/50' :
                    'focus:ring-[#f5a623]'
                  }`}
                />
                {loadingMeta && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {!loadingMeta && urlType && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </span>
                )}
              </div>

              {/* Genre/mood tags */}
              <div className="flex flex-wrap gap-1.5">
                {GENRE_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      tags.includes(tag)
                        ? 'bg-[#f5a623] text-[#0a1628]'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
                {tags.length > 0 && (
                  <span className="text-[10px] text-gray-500 self-center ml-1">
                    {tags.length}/3
                  </span>
                )}
              </div>

              {/* Auto-fetched metadata preview */}
              {metadata && (
                <div className="flex items-center gap-3 bg-[#1a2a3a] rounded-lg p-3">
                  {metadata.artworkUrl ? (
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                      <Image src={metadata.artworkUrl} alt={metadata.trackName} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-[#0a1628] flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-[#f5a623]/40" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{metadata.trackName}</p>
                    {metadata.artistName && (
                      <p className="text-xs text-gray-400 truncate">{metadata.artistName}</p>
                    )}
                    <span className="text-[10px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded capitalize mt-1 inline-block">
                      {metadata.type === 'applemusic' ? 'Apple Music' : metadata.type === 'soundxyz' ? 'Sound.xyz' : metadata.type}
                    </span>
                  </div>
                  <button
                    onClick={handlePlayPreview}
                    className="w-9 h-9 rounded-full bg-[#f5a623]/10 flex items-center justify-center text-[#f5a623] hover:bg-[#f5a623]/20 transition-colors flex-shrink-0"
                    title="Preview"
                  >
                    <svg className="w-4 h-4 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Note input */}
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Why this song? (optional)"
                className="w-full bg-[#1a2a3a] text-white text-base md:text-sm rounded-lg px-3 py-2.5 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623]"
              />

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting || !url.trim() || !urlType}
                className="w-full bg-[#f5a623] text-[#0a1628] text-sm font-semibold py-3 rounded-lg hover:bg-[#ffd700] disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Adding...' : metadata ? `Add "${metadata.trackName}"` : 'Add Song'}
              </button>

              {/* Share after adding */}
              {feedback?.type === 'success' && metadata && (
                <ShareToFarcaster
                  template={shareTemplates.songSubmission(metadata.trackName, note || undefined)}
                  variant="button"
                  label="Share to Farcaster"
                />
              )}

              <p className="text-[10px] text-gray-600 text-center">
                Spotify, Apple Music, SoundCloud, YouTube, Tidal, Bandcamp, Audius, Sound.xyz
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
