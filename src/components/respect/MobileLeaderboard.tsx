'use client';

import type { TreemapEntry } from './Treemap';

interface MobileLeaderboardProps {
  entries: TreemapEntry[];
  onSelect?: (entry: TreemapEntry | null) => void;
  selected?: string | null;
}

// Returns the CSS column/row span class string for each rank (1-indexed)
function getGridClass(index: number): string {
  // #1 — full width
  if (index === 0) return 'col-span-2';
  // #2–3 — each half width
  if (index === 1 || index === 2) return 'col-span-1';
  // #4–5 — each half width
  if (index === 3 || index === 4) return 'col-span-1';
  // #6–8 — each third width (we use 3-col subgrid via wrapper)
  if (index >= 5 && index <= 7) return 'col-span-1';
  // #9–10 — each half
  if (index === 8 || index === 9) return 'col-span-1';
  // rest — half
  return 'col-span-1';
}

function rankBadgeColor(rank: number): string {
  if (rank === 1) return 'bg-[#f5a623] text-[#0a1628]';
  if (rank === 2) return 'bg-gray-400 text-[#0a1628]';
  if (rank === 3) return 'bg-amber-700 text-white';
  return 'bg-[#1e3a5f] text-gray-300';
}

function cardBg(rank: number, selected: boolean): string {
  if (selected) return 'bg-[#f5a623]/15 border-[#f5a623]/50';
  if (rank === 1) return 'bg-gradient-to-br from-[#f5a623]/15 to-[#1e3a5f] border-[#f5a623]/40';
  if (rank <= 3) return 'bg-[#1e3a5f]/60 border-[#f5a623]/20';
  return 'bg-[#0d1b2a] border-white/[0.08]';
}

function EntryCard({
  entry,
  large,
  onSelect,
  selected,
}: {
  entry: TreemapEntry;
  large?: boolean;
  onSelect?: (e: TreemapEntry | null) => void;
  selected?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(selected ? null : entry)}
      className={`w-full text-left rounded-xl border p-3 transition-colors cursor-pointer hover:border-[#f5a623]/40 ${cardBg(entry.rank, !!selected)}`}
    >
      <div className="flex items-start gap-2">
        <span
          className={`text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 ${rankBadgeColor(entry.rank)}`}
        >
          {entry.rank}
        </span>
        <div className="flex-1 min-w-0">
          <p
            className={`font-semibold truncate ${large ? 'text-sm' : 'text-xs'} ${entry.rank === 1 ? 'text-[#f5a623]' : 'text-white'}`}
          >
            {entry.name}
          </p>
          <p className={`text-[#f5a623]/80 font-medium ${large ? 'text-sm' : 'text-xs'} mt-0.5`}>
            {entry.mindshare.toFixed(1)}%
          </p>
          {large && (
            <p className="text-xs text-gray-400 mt-1">
              {entry.totalRespect.toLocaleString()} R
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

export function MobileLeaderboard({
  entries,
  onSelect,
  selected,
}: MobileLeaderboardProps) {
  const top10 = entries.slice(0, 10);
  const rest = entries.slice(10);

  return (
    <div className="space-y-2">
      {/* Cascade grid: 2-col base */}
      <div className="grid grid-cols-2 gap-2">
        {/* #1 — full width */}
        {top10[0] && (
          <div className="col-span-2">
            <EntryCard
              entry={top10[0]}
              large
              onSelect={onSelect}
              selected={selected === top10[0].wallet}
            />
          </div>
        )}
        {/* #2–3 — half */}
        {top10.slice(1, 3).map((e) => (
          <div key={e.wallet || e.name} className={getGridClass(top10.indexOf(e))}>
            <EntryCard
              entry={e}
              large
              onSelect={onSelect}
              selected={selected === e.wallet}
            />
          </div>
        ))}
        {/* #4–5 — half */}
        {top10.slice(3, 5).map((e) => (
          <div key={e.wallet || e.name} className="col-span-1">
            <EntryCard
              entry={e}
              onSelect={onSelect}
              selected={selected === e.wallet}
            />
          </div>
        ))}
      </div>

      {/* #6–8 — thirds via 3-col grid */}
      {top10.slice(5, 8).length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {top10.slice(5, 8).map((e) => (
            <div key={e.wallet || e.name}>
              <EntryCard
                entry={e}
                onSelect={onSelect}
                selected={selected === e.wallet}
              />
            </div>
          ))}
        </div>
      )}

      {/* #9–10 — half */}
      {top10.slice(8, 10).length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {top10.slice(8, 10).map((e) => (
            <div key={e.wallet || e.name}>
              <EntryCard
                entry={e}
                onSelect={onSelect}
                selected={selected === e.wallet}
              />
            </div>
          ))}
        </div>
      )}

      {/* Rest as simple list */}
      {rest.length > 0 && (
        <div className="grid grid-cols-2 gap-2 pt-1">
          {rest.map((e) => (
            <div key={e.wallet || e.name}>
              <EntryCard
                entry={e}
                onSelect={onSelect}
                selected={selected === e.wallet}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
