'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { getActiveFilterKey } from '@/components/music/AudioFiltersPanel';

interface ShareMenuProps {
  trackName: string;
  artistName: string;
  artworkUrl: string;
  trackUrl: string;
  className?: string;
}

export function ShareMenu({ trackName, artistName, artworkUrl, trackUrl, className = '' }: ShareMenuProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => clearTimeout(copiedTimerRef.current), []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const activeFilter = getActiveFilterKey();

  /** Build share card URL for the current track */
  const buildShareCardUrl = useCallback(() => {
    const params = new URLSearchParams({
      track: trackName,
      artist: artistName,
    });
    if (artworkUrl) params.set('artwork', artworkUrl);
    if (activeFilter) params.set('filter', activeFilter);
    return `/api/music/share-card?${params.toString()}`;
  }, [trackName, artistName, artworkUrl, activeFilter]);

  /** Build Farcaster frame URL for the current track */
  const buildFrameUrl = useCallback(() => {
    const params = new URLSearchParams({
      track: trackName,
      artist: artistName,
    });
    if (artworkUrl) params.set('artwork', artworkUrl);
    if (trackUrl) params.set('url', trackUrl);
    if (activeFilter) params.set('filter', activeFilter);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/api/music/frame?${params.toString()}`;
  }, [trackName, artistName, artworkUrl, trackUrl, activeFilter]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(trackUrl);
      setCopied(true);
      clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = trackUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareFarcaster = () => {
    const frameUrl = buildFrameUrl();
    const text = encodeURIComponent(`Listening to ${trackName} by ${artistName}`);
    const embedUrl = encodeURIComponent(frameUrl);
    window.open(
      `https://warpcast.com/~/compose?text=${text}&embeds[]=${embedUrl}`,
      '_blank',
      'noopener,noreferrer'
    );
    setOpen(false);
  };

  const handleShareX = () => {
    const text = encodeURIComponent(`Listening to "${trackName}" by ${artistName} on THE ZAO`);
    const url = encodeURIComponent(trackUrl);
    window.open(
      `https://x.com/intent/tweet?text=${text}&url=${url}`,
      '_blank',
      'noopener,noreferrer'
    );
    setOpen(false);
  };

  const handleDownloadCard = async () => {
    try {
      const cardUrl = buildShareCardUrl();
      const response = await fetch(cardUrl);
      const svgText = await response.text();
      const blob = new Blob([svgText], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${trackName.replace(/[^a-zA-Z0-9]/g, '-')}-share-card.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[ShareMenu] Download failed:', err);
    }
    setOpen(false);
  };

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      {/* Share trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`p-1.5 rounded-lg transition-colors ${
          open ? 'text-[#f5a623] bg-[#f5a623]/10' : 'text-gray-400 hover:text-white'
        }`}
        aria-label="Share track"
        title="Share"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {open && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 z-40 bg-black/40 sm:hidden"
            onClick={() => setOpen(false)}
          />

          <div className="absolute bottom-full right-0 mb-2 z-50 w-56 rounded-xl bg-[#0d1b2a] border border-white/10 shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
            {/* Copy link */}
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-200 hover:bg-white/5 transition-colors"
            >
              {copied ? (
                <svg className="w-4 h-4 text-green-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.071a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L5.25 9.879" />
                </svg>
              )}
              <span>{copied ? 'Copied!' : 'Copy link'}</span>
            </button>

            {/* Share to Farcaster */}
            <button
              onClick={handleShareFarcaster}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-200 hover:bg-white/5 transition-colors"
            >
              <svg className="w-4 h-4 flex-shrink-0 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5.24 3h13.52l2.64 4.36v1.28h-1.12l-.24 8.72c-.04 1.4-1.2 2.52-2.6 2.52h-1.2c-1.4 0-2.56-1.12-2.6-2.52l-.12-4.44h-3.04l-.12 4.44c-.04 1.4-1.2 2.52-2.6 2.52h-1.2c-1.4 0-2.56-1.12-2.6-2.52L3.72 8.64H2.6V7.36L5.24 3z" />
              </svg>
              <span>Share to Farcaster</span>
            </button>

            {/* Share to X */}
            <button
              onClick={handleShareX}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-200 hover:bg-white/5 transition-colors"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>Share to X</span>
            </button>

            <div className="border-t border-white/5" />

            {/* Download card */}
            <button
              onClick={handleDownloadCard}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-200 hover:bg-white/5 transition-colors"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              <span>Download share card</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
