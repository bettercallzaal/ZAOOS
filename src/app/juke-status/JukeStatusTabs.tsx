'use client';

import { useEffect, useState, type ReactNode } from 'react';

/**
 * Client-side tab shell for /juke-status. The server page hands in each
 * top-level section as a slot (overview / shipped / asks / architecture /
 * about) and this component renders only the active one, while keeping a
 * sticky tab strip at the top so visitors can jump between facets without
 * scrolling a 600-line page.
 *
 * URL hash (#shipped, #asks, ...) is the source of truth so deep-links are
 * shareable. Default tab is `overview`. Unknown hashes fall back to overview.
 *
 * Counts in tab labels (e.g. "Shipped (15)") are passed by the server since
 * it already has the numbers.
 */

export type JukeStatusTabId = 'overview' | 'shipped' | 'asks' | 'architecture' | 'about';

export interface JukeStatusTabsProps {
  overview: ReactNode;
  shipped: ReactNode;
  asks: ReactNode;
  architecture: ReactNode;
  about: ReactNode;
  counts: {
    shipped: number;
    asks: number;
    resolvedAsks: number;
    webhooks: number;
    spaces: number;
  };
}

interface TabDef {
  id: JukeStatusTabId;
  label: string;
  hint?: string;
}

function buildTabs(counts: JukeStatusTabsProps['counts']): TabDef[] {
  return [
    {
      id: 'overview',
      label: 'Overview',
      hint: `${counts.webhooks} webhooks - ${counts.spaces} spaces`,
    },
    { id: 'shipped', label: `Shipped (${counts.shipped})` },
    {
      id: 'asks',
      label: `Asks (${counts.asks})`,
      hint: counts.resolvedAsks > 0 ? `${counts.resolvedAsks} resolved by Juke` : undefined,
    },
    { id: 'architecture', label: 'Architecture' },
    { id: 'about', label: 'About' },
  ];
}

function isTabId(value: string): value is JukeStatusTabId {
  return (
    value === 'overview' ||
    value === 'shipped' ||
    value === 'asks' ||
    value === 'architecture' ||
    value === 'about'
  );
}

export function JukeStatusTabs({
  overview,
  shipped,
  asks,
  architecture,
  about,
  counts,
}: JukeStatusTabsProps) {
  const [active, setActive] = useState<JukeStatusTabId>('overview');

  // Hash sync: read on mount + listen for hashchange so back/forward + deep
  // links land on the right tab. Hash drives state, never the other way - the
  // setter both updates state and rewrites the hash so they cannot diverge.
  useEffect(() => {
    const fromHash = () => {
      const raw = window.location.hash.replace(/^#/, '').toLowerCase();
      if (raw && isTabId(raw)) setActive(raw);
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, []);

  function selectTab(id: JukeStatusTabId) {
    setActive(id);
    if (typeof window !== 'undefined') {
      // history.replaceState avoids piling up nav entries when bouncing tabs.
      window.history.replaceState(null, '', `#${id}`);
    }
  }

  const tabs = buildTabs(counts);
  const panels: Record<JukeStatusTabId, ReactNode> = {
    overview,
    shipped,
    asks,
    architecture,
    about,
  };

  return (
    <>
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 bg-[#0a1628]/95 backdrop-blur border-b border-white/[0.08]">
        <div
          className="flex gap-1 overflow-x-auto py-2 -mb-px scrollbar-hide"
          role="tablist"
          aria-label="ZAO + Juke status sections"
        >
          {tabs.map((tab) => {
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => selectTab(tab.id)}
                className={`group relative flex-shrink-0 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-[#f5a623]/15 text-[#f5a623] border border-[#f5a623]/30'
                    : 'text-gray-400 hover:text-gray-200 border border-transparent hover:border-white/[0.08]'
                }`}
              >
                <span>{tab.label}</span>
                {tab.hint && (
                  <span
                    className={`hidden md:inline ml-2 text-[10px] font-normal ${
                      isActive ? 'text-[#f5a623]/80' : 'text-gray-500'
                    }`}
                  >
                    {tab.hint}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div role="tabpanel" aria-labelledby={`tab-${active}`} className="pt-6">
        {panels[active]}
      </div>
    </>
  );
}
