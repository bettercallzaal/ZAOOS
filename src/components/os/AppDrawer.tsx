'use client';

import { useState, useMemo } from 'react';
import { getFullApps, getMicroApps } from '@/lib/os/app-manifest';
import { AppIcon } from './AppIcon';
import type { AppCategory, AppManifest } from '@/lib/os/types';

interface AppDrawerProps {
  pinnedApps: string[];
  onOpen: (app: AppManifest) => void;
  onPin: (appId: string) => void;
  onUnpin: (appId: string) => void;
  onClose: () => void;
}

const CATEGORIES: { id: AppCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'social', label: 'Social' },
  { id: 'music', label: 'Music' },
  { id: 'governance', label: 'Govern' },
  { id: 'tools', label: 'Tools' },
  { id: 'earn', label: 'Earn' },
];

export function AppDrawer({ pinnedApps, onOpen, onPin, onUnpin, onClose }: AppDrawerProps) {
  const [filter, setFilter] = useState<AppCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredApps = useMemo(() => {
    let apps = APP_REGISTRY;
    if (filter !== 'all') {
      apps = apps.filter((app) => app.category === filter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      apps = apps.filter(
        (app) => app.name.toLowerCase().includes(q) || app.description.toLowerCase().includes(q),
      );
    }
    return apps;
  }, [filter, searchQuery]);

  const fullApps = filteredApps.filter((a) => a.type === 'full-app');
  const microApps = filteredApps.filter((a) => a.type === 'micro-app');

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a1628]/95 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4">
        <h2 className="text-lg font-semibold text-white">Apps</h2>
        <button
          type="button"
          aria-label="Close app drawer"
          onClick={onClose}
          className="rounded-full p-2 text-white/60 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#f5a623]"
        >
          ✕
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pt-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search apps..."
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none focus:border-[#f5a623]/50"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto px-4 pt-3 pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setFilter(cat.id)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === cat.id
                ? 'bg-[#f5a623] text-black'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* App grid */}
      <div className="flex-1 overflow-y-auto px-4 pt-2">
        {fullApps.length > 0 && (
          <div className="pb-4">
            <h3 className="pb-3 text-xs font-medium uppercase tracking-wider text-white/40">
              Apps
            </h3>
            <div className="grid grid-cols-4 gap-4 sm:grid-cols-5 md:grid-cols-6">
              {fullApps.map((app) => (
                <AppIcon
                  key={app.id}
                  app={app}
                  isPinned={pinnedApps.includes(app.id)}
                  onOpen={onOpen}
                  onPin={onPin}
                  onUnpin={onUnpin}
                />
              ))}
            </div>
          </div>
        )}

        {microApps.length > 0 && (
          <div className="pb-4">
            <h3 className="pb-3 text-xs font-medium uppercase tracking-wider text-white/40">
              Micro-Apps
            </h3>
            <div className="grid grid-cols-4 gap-4 sm:grid-cols-5 md:grid-cols-6">
              {microApps.map((app) => (
                <AppIcon
                  key={app.id}
                  app={app}
                  isPinned={pinnedApps.includes(app.id)}
                  onOpen={onOpen}
                  onPin={onPin}
                  onUnpin={onUnpin}
                />
              ))}
            </div>
          </div>
        )}

        {filteredApps.length === 0 && (
          <div className="pt-12 text-center text-sm text-white/40">No apps found</div>
        )}
      </div>
    </div>
  );
}
