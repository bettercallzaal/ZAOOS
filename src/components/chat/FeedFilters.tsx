'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { Cast } from '@/types';
import { isMusicUrl } from '@/lib/music/isMusicUrl';

// ── Filter types ──────────────────────────────────────────────────────────────

export type ContentFilter = 'all' | 'music' | 'images' | 'video' | 'links' | 'text';
export type SortMode = 'newest' | 'oldest' | 'most_liked' | 'most_replied';

const CONTENT_FILTERS: { id: ContentFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'music', label: 'Music' },
  { id: 'images', label: 'Images' },
  { id: 'video', label: 'Video' },
  { id: 'links', label: 'Links' },
  { id: 'text', label: 'Text' },
];

const SORT_OPTIONS: { id: SortMode; label: string }[] = [
  { id: 'newest', label: 'Newest' },
  { id: 'oldest', label: 'Oldest' },
  { id: 'most_liked', label: 'Most Liked' },
  { id: 'most_replied', label: 'Most Replied' },
];

// ── Content detection helpers ─────────────────────────────────────────────────

function castHasMusic(cast: Cast): boolean {
  // Check embeds
  for (const embed of cast.embeds ?? []) {
    if (embed.url && isMusicUrl(embed.url)) return true;
    const ct = embed.metadata?.content_type ?? '';
    if (ct.startsWith('audio/')) return true;
  }
  // Check text for music URLs
  const urls = cast.text.match(/https?:\/\/[^\s<>"{}|\\^`[\]]+/g) ?? [];
  for (const u of urls) {
    if (isMusicUrl(u)) return true;
  }
  return false;
}

function castHasImages(cast: Cast): boolean {
  for (const embed of cast.embeds ?? []) {
    if (!embed.url) continue;
    const ct = embed.metadata?.content_type ?? '';
    if (ct.startsWith('image/')) return true;
    if (/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(embed.url)) return true;
  }
  return false;
}

function castHasVideo(cast: Cast): boolean {
  for (const embed of cast.embeds ?? []) {
    if (!embed.url) continue;
    const ct = embed.metadata?.content_type ?? '';
    if (ct.startsWith('video/')) return true;
    if (/\.(mp4|webm|mov|m3u8)(\?|$)/i.test(embed.url)) return true;
  }
  return false;
}

function castHasLinks(cast: Cast): boolean {
  // Has any URL embed that isn't pure media
  for (const embed of cast.embeds ?? []) {
    if (embed.url) return true;
  }
  return false;
}

function castIsTextOnly(cast: Cast): boolean {
  return !cast.embeds || cast.embeds.length === 0 || cast.embeds.every((e) => !e.url && !e.cast);
}

// ── Filter + sort logic (exported for use in ChatRoom) ────────────────────────

export function filterAndSortCasts(
  casts: Cast[],
  contentFilter: ContentFilter,
  sortMode: SortMode,
): Cast[] {
  // Filter
  let filtered = casts;
  if (contentFilter !== 'all') {
    filtered = casts.filter((cast) => {
      switch (contentFilter) {
        case 'music': return castHasMusic(cast);
        case 'images': return castHasImages(cast);
        case 'video': return castHasVideo(cast);
        case 'links': return castHasLinks(cast);
        case 'text': return castIsTextOnly(cast);
        default: return true;
      }
    });
  }

  // Sort
  const sorted = [...filtered];
  switch (sortMode) {
    case 'newest':
      sorted.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      break;
    case 'oldest':
      sorted.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      break;
    case 'most_liked':
      sorted.sort((a, b) => (b.reactions?.likes_count ?? 0) - (a.reactions?.likes_count ?? 0));
      break;
    case 'most_replied':
      sorted.sort((a, b) => (b.replies?.count ?? 0) - (a.replies?.count ?? 0));
      break;
  }

  return sorted;
}

// ── UI Component ──────────────────────────────────────────────────────────────

interface FeedFiltersProps {
  contentFilter: ContentFilter;
  sortMode: SortMode;
  onContentFilterChange: (filter: ContentFilter) => void;
  onSortChange: (sort: SortMode) => void;
  resultCount?: number;
  totalCount?: number;
}

export function FeedFilters({
  contentFilter,
  sortMode,
  onContentFilterChange,
  onSortChange,
  resultCount,
  totalCount,
}: FeedFiltersProps) {
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const pillsRef = useRef<HTMLDivElement>(null);

  const isFiltered = contentFilter !== 'all' || sortMode !== 'newest';
  const showingFiltered = contentFilter !== 'all' && resultCount !== undefined && totalCount !== undefined;

  const handleClearAll = useCallback(() => {
    onContentFilterChange('all');
    onSortChange('newest');
  }, [onContentFilterChange, onSortChange]);

  const sortLabel = useMemo(
    () => SORT_OPTIONS.find((s) => s.id === sortMode)?.label ?? 'Newest',
    [sortMode],
  );

  return (
    <div className="flex-shrink-0 bg-[#0d1b2a] border-b border-gray-800">
      {/* Pills row + sort */}
      <div className="flex items-center gap-2 px-4 py-2">
        {/* Scrollable pills */}
        <div
          ref={pillsRef}
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1"
        >
          {CONTENT_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => onContentFilterChange(f.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                contentFilter === f.id
                  ? 'bg-[#f5a623] text-black'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Sort button */}
        <div className="relative flex-shrink-0" ref={sortRef}>
          <button
            onClick={() => setSortOpen((o) => !o)}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-colors ${
              sortMode !== 'newest'
                ? 'bg-[#f5a623]/10 text-[#f5a623]'
                : 'text-gray-500 hover:text-white hover:bg-white/5'
            }`}
            title={`Sort: ${sortLabel}`}
            aria-label={`Sort by ${sortLabel}`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
            </svg>
            <span className="hidden sm:inline">{sortLabel}</span>
          </button>

          {/* Sort dropdown */}
          {sortOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setSortOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 w-36 bg-[#1a2a3a] border border-gray-700 rounded-lg shadow-xl overflow-hidden">
                {SORT_OPTIONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onSortChange(s.id);
                      setSortOpen(false);
                    }}
                    className={`block w-full text-left px-3 py-2 text-xs transition-colors ${
                      sortMode === s.id
                        ? 'bg-[#f5a623]/10 text-[#f5a623] font-medium'
                        : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Active filter summary */}
      {isFiltered && (
        <div className="flex items-center gap-2 px-4 pb-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] text-gray-500 flex-shrink-0">Showing:</span>
          {contentFilter !== 'all' && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f5a623]/10 text-[#f5a623] text-[10px] font-medium flex-shrink-0">
              {CONTENT_FILTERS.find((f) => f.id === contentFilter)?.label}
              <button onClick={() => onContentFilterChange('all')} className="hover:text-white" aria-label="Clear content filter">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          {sortMode !== 'newest' && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f5a623]/10 text-[#f5a623] text-[10px] font-medium flex-shrink-0">
              {sortLabel}
              <button onClick={() => onSortChange('newest')} className="hover:text-white" aria-label="Clear sort filter">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          {showingFiltered && (
            <span className="text-[10px] text-gray-600 flex-shrink-0">
              {resultCount} of {totalCount}
            </span>
          )}
          <button
            onClick={handleClearAll}
            className="text-[10px] text-gray-500 hover:text-white flex-shrink-0 ml-auto"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
