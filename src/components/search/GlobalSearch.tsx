'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useFocusTrap } from '@/hooks/useFocusTrap';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ContentType = 'all' | 'casts' | 'proposals' | 'music' | 'members';

interface SearchResult {
  type: 'cast' | 'proposal' | 'music' | 'member';
  id: string;
  title: string;
  snippet: string;
  href: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TYPE_FILTERS: { value: ContentType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'casts', label: 'Casts' },
  { value: 'proposals', label: 'Proposals' },
  { value: 'music', label: 'Music' },
  { value: 'members', label: 'Members' },
];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  cast: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  proposal: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  music: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
    </svg>
  ),
  member: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
};

const TYPE_BADGE_COLORS: Record<string, string> = {
  cast: 'bg-blue-500/20 text-blue-400',
  proposal: 'bg-purple-500/20 text-purple-400',
  music: 'bg-green-500/20 text-green-400',
  member: 'bg-[#f5a623]/20 text-[#f5a623]',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ContentType>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useFocusTrap(dialogRef, isOpen);

  // Reset state on open, cleanup on close
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTypeFilter('all');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    return () => {
      abortRef.current?.abort();
    };
  }, [isOpen]);

  // Scroll selected result into view
  useEffect(() => {
    if (!resultsRef.current) return;
    const selected = resultsRef.current.querySelector('[data-selected="true"]');
    selected?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const search = useCallback(
    async (q: string, type: ContentType) => {
      if (q.length < 2) {
        setResults([]);
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      try {
        const params = new URLSearchParams({
          q,
          type,
          limit: '20',
        });
        const res = await fetch(`/api/search?${params}`, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          setSelectedIndex(0);
        }
      } catch {
        // Silently handle aborted requests
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [],
  );

  const handleChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val, typeFilter), 300);
  };

  const handleTypeChange = (type: ContentType) => {
    setTypeFilter(type);
    if (query.length >= 2) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      search(query, type);
    }
  };

  const handleSelect = (result: SearchResult) => {
    router.push(result.href);
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
      handleSelect(results[selectedIndex]);
    }
  };

  const formatTime = (ts: string) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Highlight matching text
  const highlight = (text: string, q: string) => {
    if (!q || q.length < 2) return text;
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    // Find the first matching word position
    let bestIdx = -1;
    let bestWord = '';
    for (const w of words) {
      const idx = text.toLowerCase().indexOf(w);
      if (idx !== -1 && (bestIdx === -1 || idx < bestIdx)) {
        bestIdx = idx;
        bestWord = w;
      }
    }
    if (bestIdx === -1) return text;
    const before = text.slice(0, bestIdx);
    const match = text.slice(bestIdx, bestIdx + bestWord.length);
    const after = text.slice(bestIdx + bestWord.length);
    return (
      <>
        {before}
        <mark className="bg-[#f5a623]/30 text-white rounded-sm px-0.5">{match}</mark>
        {after}
      </>
    );
  };

  // Group results by type for section headers
  const groupedResults = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {});

  const typeLabels: Record<string, string> = {
    cast: 'Casts',
    proposal: 'Proposals',
    music: 'Music',
    member: 'Members',
  };

  // Flat ordered list for keyboard navigation (preserve grouping order)
  const flatResults: SearchResult[] = [];
  for (const type of ['cast', 'proposal', 'music', 'member']) {
    if (groupedResults[type]) {
      flatResults.push(...groupedResults[type]);
    }
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />

      {/* Dialog */}
      <div className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-xl z-50">
        <div
          ref={dialogRef}
          className="bg-[#0d1b2a] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden"
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.08]">
            <svg
              className="w-4 h-4 text-gray-400 flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search everything..."
              className="flex-1 bg-transparent text-white text-base md:text-sm placeholder-gray-500 focus:outline-none"
            />
            <kbd className="hidden md:inline text-[10px] text-gray-500 border border-white/[0.08] rounded px-1.5 py-0.5">
              ESC
            </kbd>
          </div>

          {/* Type filter tabs */}
          <div className="flex items-center gap-1 px-4 py-2 border-b border-white/[0.08] overflow-x-auto">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => handleTypeChange(f.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                  typeFilter === f.value
                    ? 'bg-[#f5a623]/20 text-[#f5a623]'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Results */}
          <div ref={resultsRef} className="max-h-[55vh] overflow-y-auto">
            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* No results */}
            {!loading && query.length >= 2 && results.length === 0 && (
              <div className="px-4 py-10 text-center">
                <svg
                  className="w-10 h-10 text-gray-600 mx-auto mb-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
                <p className="text-gray-400 text-sm font-medium mb-1">No results found</p>
                <p className="text-gray-600 text-xs">
                  Try different keywords or change the filter
                </p>
              </div>
            )}

            {/* Grouped results */}
            {!loading &&
              typeFilter === 'all' &&
              (['cast', 'proposal', 'music', 'member'] as const).map((type) => {
                const items = groupedResults[type];
                if (!items || items.length === 0) return null;
                return (
                  <div key={type}>
                    <div className="px-4 py-2 bg-[#0a1628]/60 sticky top-0 z-10">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                        {typeLabels[type]}
                      </span>
                    </div>
                    {items.map((result) => {
                      const globalIdx = flatResults.indexOf(result);
                      return (
                        <ResultItem
                          key={`${result.type}-${result.id}`}
                          result={result}
                          query={query}
                          isSelected={globalIdx === selectedIndex}
                          onSelect={handleSelect}
                          formatTime={formatTime}
                          highlight={highlight}
                        />
                      );
                    })}
                  </div>
                );
              })}

            {/* Ungrouped results (when filtering by specific type) */}
            {!loading &&
              typeFilter !== 'all' &&
              results.map((result, i) => (
                <ResultItem
                  key={`${result.type}-${result.id}`}
                  result={result}
                  query={query}
                  isSelected={i === selectedIndex}
                  onSelect={handleSelect}
                  formatTime={formatTime}
                  highlight={highlight}
                />
              ))}

            {/* Initial state */}
            {!loading && query.length < 2 && (
              <div className="px-4 py-10 text-center">
                <p className="text-gray-400 text-sm mb-1">Search across all content</p>
                <p className="text-gray-600 text-xs mb-4">
                  Casts, proposals, music, and members
                </p>
                <div className="flex items-center justify-center gap-4 text-[10px] text-gray-600">
                  <span>
                    <kbd className="border border-white/[0.08] rounded px-1 py-0.5 mr-1">
                      ↑↓
                    </kbd>{' '}
                    navigate
                  </span>
                  <span>
                    <kbd className="border border-white/[0.08] rounded px-1 py-0.5 mr-1">
                      ↵
                    </kbd>{' '}
                    open
                  </span>
                  <span>
                    <kbd className="border border-white/[0.08] rounded px-1 py-0.5 mr-1">
                      esc
                    </kbd>{' '}
                    close
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Result item sub-component
// ---------------------------------------------------------------------------

function ResultItem({
  result,
  query,
  isSelected,
  onSelect,
  formatTime,
  highlight,
}: {
  result: SearchResult;
  query: string;
  isSelected: boolean;
  onSelect: (r: SearchResult) => void;
  formatTime: (ts: string) => string;
  highlight: (text: string, q: string) => React.ReactNode;
}) {
  const pfp = (result.metadata.pfp as string) || null;

  return (
    <button
      data-selected={isSelected}
      onClick={() => onSelect(result)}
      className={`w-full text-left px-4 py-3 border-b border-white/[0.08] transition-colors ${
        isSelected ? 'bg-[#f5a623]/10' : 'hover:bg-white/5'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        {/* Icon or PFP */}
        {pfp ? (
          <Image
            src={pfp}
            alt={`${result.title} avatar`}
            width={16}
            height={16}
            className="rounded-full"
          />
        ) : (
          <span className="text-gray-500">{TYPE_ICONS[result.type]}</span>
        )}

        {/* Title */}
        <span className="text-xs font-medium text-white truncate flex-1">
          {highlight(result.title, query)}
        </span>

        {/* Type badge */}
        <span
          className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
            TYPE_BADGE_COLORS[result.type] || 'bg-gray-700 text-gray-400'
          }`}
        >
          {result.type}
        </span>

        {/* Timestamp */}
        {result.timestamp && (
          <span className="text-[10px] text-gray-600 ml-1">
            {formatTime(result.timestamp)}
          </span>
        )}
      </div>

      {/* Snippet */}
      {result.snippet && (
        <p className="text-xs text-gray-400 line-clamp-2 ml-6">
          {highlight(result.snippet, query)}
        </p>
      )}
    </button>
  );
}
