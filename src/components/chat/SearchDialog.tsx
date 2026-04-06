'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface SearchResult {
  hash: string;
  author: {
    fid: number;
    username: string;
    display_name: string;
    pfp_url: string;
  };
  text: string;
  timestamp: string;
  replies: { count: number };
}

interface SearchDialogProps {
  channel: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenThread?: (hash: string) => void;
}

export function SearchDialog({ channel, isOpen, onClose, onOpenThread }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useFocusTrap(dialogRef, isOpen);

  // Focus input when opening; abort on close/unmount
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    return () => {
      abortRef.current?.abort();
    };
  }, [isOpen]);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const res = await fetch(`/api/chat/search?q=${encodeURIComponent(q)}&channel=${channel}`, { signal: controller.signal });
      if (controller.signal.aborted) return;
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        setSelectedIndex(0);
      }
    } catch {
      // Silently fail (including aborted requests)
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [channel]);

  const handleChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 300);
  };

  const handleSelect = (hash: string) => {
    onOpenThread?.(hash);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex].hash);
    }
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Highlight matching text
  const highlight = (text: string, q: string) => {
    if (!q || q.length < 2) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + q.length);
    const after = text.slice(idx + q.length);
    return (
      <>
        {before}
        <mark className="bg-[#f5a623]/30 text-white rounded-sm px-0.5">{match}</mark>
        {after}
      </>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />

      {/* Dialog */}
      <div className="fixed inset-x-4 top-[15%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg z-50">
        <div ref={dialogRef} className="bg-[#0d1b2a] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.08]">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Search #${channel}...`}
              className="flex-1 bg-transparent text-white text-base md:text-sm placeholder-gray-500 focus:outline-none"
            />
            <kbd className="hidden md:inline text-[10px] text-gray-500 border border-white/[0.08] rounded px-1.5 py-0.5">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[50vh] overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!loading && query.length >= 2 && results.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                No messages found for &ldquo;{query}&rdquo;
              </div>
            )}

            {!loading && results.map((result, i) => (
              <button
                key={result.hash}
                onClick={() => handleSelect(result.hash)}
                className={`w-full text-left px-4 py-3 border-b border-white/[0.08] transition-colors ${
                  i === selectedIndex ? 'bg-[#f5a623]/10' : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {result.author.pfp_url && (
                    <Image
                      src={result.author.pfp_url}
                      alt={`${result.author.display_name || result.author.username || 'User'} avatar`}
                      width={16}
                      height={16}
                      className="rounded-full"
                    />
                  )}
                  <span className="text-xs font-medium text-[#f5a623]">
                    {result.author.display_name || result.author.username}
                  </span>
                  <span className="text-[10px] text-gray-600">
                    {formatTime(result.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-gray-300 line-clamp-2">
                  {highlight(result.text, query)}
                </p>
              </button>
            ))}

            {!loading && query.length < 2 && (
              <div className="px-4 py-8 text-center">
                <p className="text-gray-500 text-sm mb-3">Search messages in #{channel}</p>
                <div className="flex items-center justify-center gap-4 text-[10px] text-gray-600">
                  <span><kbd className="border border-white/[0.08] rounded px-1 py-0.5 mr-1">↑↓</kbd> navigate</span>
                  <span><kbd className="border border-white/[0.08] rounded px-1 py-0.5 mr-1">↵</kbd> open</span>
                  <span><kbd className="border border-white/[0.08] rounded px-1 py-0.5 mr-1">esc</kbd> close</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
