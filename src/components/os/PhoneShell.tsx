'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getApp, getDefaultPinnedApps } from '@/lib/os/app-manifest';
import { AppIcon } from './AppIcon';
import { AppDrawer } from './AppDrawer';
import type { AppManifest } from '@/lib/os/types';

interface PhoneShellProps {
  pinnedApps: string[];
  onPin: (appId: string) => void;
  onUnpin: (appId: string) => void;
  userName?: string;
}

export function PhoneShell({ pinnedApps, onPin, onUnpin, userName }: PhoneShellProps) {
  const router = useRouter();
  const [showDrawer, setShowDrawer] = useState(false);

  const resolvedApps = pinnedApps
    .map((id) => getApp(id))
    .filter((app): app is AppManifest => app !== undefined);

  const handleOpen = useCallback(
    (app: AppManifest) => {
      if (app.externalUrl) {
        window.open(app.externalUrl, '_blank');
      } else if (app.route) {
        router.push(app.route);
      }
    },
    [router],
  );

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#0a1628]">
      {/* Status bar area */}
      <div className="px-6 pt-8 pb-2">
        <div className="text-center">
          <div className="text-4xl font-light tracking-tight text-white">{timeStr}</div>
          <div className="mt-1 text-sm text-white/50">{dateStr}</div>
          {userName && (
            <div className="mt-2 text-xs text-[#f5a623]/80">Welcome, {userName}</div>
          )}
        </div>
      </div>

      {/* Widget area (placeholder for Phase 4) */}
      <div className="px-4 py-4">
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <div className="text-center text-xs text-white/30">
            Long-press an app to add widgets here
          </div>
        </div>
      </div>

      {/* Pinned app grid */}
      <div className="flex-1 px-6">
        {resolvedApps.length > 0 ? (
          <div className="grid grid-cols-4 gap-5 sm:grid-cols-5">
            {resolvedApps.map((app) => (
              <AppIcon
                key={app.id}
                app={app}
                isPinned={true}
                onOpen={handleOpen}
                onPin={onPin}
                onUnpin={onUnpin}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center pt-12 text-center">
            <div className="text-4xl">📱</div>
            <div className="mt-3 text-sm text-white/50">No apps pinned yet</div>
            <div className="mt-1 text-xs text-white/30">Swipe up to browse apps</div>
          </div>
        )}
      </div>

      {/* Dock / app drawer trigger */}
      <div className="pb-6 pt-4">
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setShowDrawer(true)}
            className="flex items-center gap-2 rounded-full bg-white/5 px-6 py-3 text-sm text-white/60 transition-colors hover:bg-white/10"
          >
            <span className="text-lg">⬆️</span>
            All Apps
          </button>
        </div>

        {/* Home indicator */}
        <div className="mt-4 flex justify-center">
          <div className="h-1 w-32 rounded-full bg-white/20" />
        </div>
      </div>

      {/* App Drawer overlay */}
      {showDrawer && (
        <AppDrawer
          pinnedApps={pinnedApps}
          onOpen={(app) => {
            handleOpen(app);
            setShowDrawer(false);
          }}
          onPin={(id) => {
            onPin(id);
          }}
          onUnpin={(id) => {
            onUnpin(id);
          }}
          onClose={() => setShowDrawer(false)}
        />
      )}
    </div>
  );
}
