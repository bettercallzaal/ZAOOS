'use client';

import { useEffect, useRef } from 'react';

export type SortOption = 'score' | 'name' | 'first_met' | 'last_interaction';

interface ContactFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  sort: SortOption;
  onSortChange: (value: SortOption) => void;
  categories: string[];
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'score', label: 'Score' },
  { value: 'name', label: 'Name' },
  { value: 'first_met', label: 'Date Met' },
  { value: 'last_interaction', label: 'Last Interaction' },
];

export function ContactFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  sort,
  onSortChange,
  categories,
}: ContactFiltersProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleSearchInput(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearchChange(value);
    }, 300);
  }

  return (
    <div className="space-y-3">
      {/* Top row: search + sort */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35m0 0A7 7 0 1 0 6.65 6.65a7 7 0 0 0 10 10z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            defaultValue={search}
            onChange={handleSearchInput}
            placeholder="Search name, handle, org, notes…"
            className="w-full bg-[#1a2a4a] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#f5a623]/40 transition-colors"
          />
        </div>

        <select
          value={sort}
          onChange={e => onSortChange(e.target.value as SortOption)}
          className="bg-[#1a2a4a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-[#f5a623]/40 transition-colors appearance-none cursor-pointer min-w-[120px]"
          aria-label="Sort by"
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value} className="bg-[#1a2a4a]">
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Category chips — horizontal scroll on mobile */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <CategoryChip
            label="All"
            active={category === ''}
            onClick={() => onCategoryChange('')}
          />
          {categories.map(cat => (
            <CategoryChip
              key={cat}
              label={cat}
              active={category === cat}
              onClick={() => onCategoryChange(cat === category ? '' : cat)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap ${
        active
          ? 'bg-[#f5a623]/20 border-[#f5a623]/50 text-[#f5a623]'
          : 'bg-[#1a2a4a] border-white/10 text-white/50 hover:border-white/25 hover:text-white/70'
      }`}
    >
      {label}
    </button>
  );
}
