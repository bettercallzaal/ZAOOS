'use client';

import { useState, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { getApp } from '@/lib/os/app-manifest';
import { AppIcon } from './AppIcon';
import { AppDrawer } from './AppDrawer';
import { Dock } from './Dock';
import { ShellPicker } from './ShellPicker';
import type { AppManifest, ShellId } from '@/lib/os/types';
import NowPlayingWidget from './widgets/NowPlayingWidget';
import UnreadWidget from './widgets/UnreadWidget';
import AgentStatusWidget from './widgets/AgentStatusWidget';

interface PhoneShellProps {
  pinnedApps: string[];
  onPin: (appId: string) => void;
  onUnpin: (appId: string) => void;
  onSetShell?: (shell: ShellId) => void;
  currentShell?: ShellId;
  userName?: string;
}

export function PhoneShell({
  pinnedApps,
  onPin,
  onUnpin,
  onSetShell,
  currentShell = 'phone',
  userName,
}: PhoneShellProps) {
  const router = useRouter();
  const [showDrawer, setShowDrawer] = useState(false);
  const [showShellPicker, setShowShellPicker] = useState(false);

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
    <div className="flex min-h-[100dvh] flex-col bg-[#0a1628] pb-20">
      {/* Status bar */}
      <div className="flex items-center justify-between px-4 pt-6 pb-1">
        <button
          type="button"
          onClick={() => setShowShellPicker(true)}
          className="rounded-lg p-2 text-xs text-white/30 transition-colors hover:bg-white/5 hover:text-white/50"
          title="Change shell layout"
        >
          📱 Shell
        </button>
        <div className="text-center">
          <div className="text-3xl font-light tracking-tight text-white">{timeStr}</div>
          <div className="text-xs text-white/40">{dateStr}</div>
        </div>
        <button
          type="button"
          onClick={() => router.push('/settings')}
          className="rounded-lg p-2 text-xs text-white/30 transition-colors hover:bg-white/5 hover:text-white/50"
        >
          ⚙️
        </button>
      </div>

      {userName && (
        <div className="px-4 pb-2 text-center text-xs text-[#f5a623]/70">
          {userName}
        </div>
      )}

      {/* Widgets */}
      <div className="flex flex-col gap-2.5 px-4 py-3">
        <Suspense fallback={<div className="h-16 animate-pulse rounded-2xl bg-white/5" />}>
          <NowPlayingWidget size="medium" onExpand={() => router.push('/music')} />
        </Suspense>
        <div className="grid grid-cols-2 gap-2.5">
          <Suspense fallback={<div className="h-14 animate-pulse rounded-2xl bg-white/5" />}>
            <UnreadWidget size="small" onExpand={() => router.push('/messages')} />
          </Suspense>
          <Suspense fallback={<div className="h-14 animate-pulse rounded-2xl bg-white/5" />}>
            <AgentStatusWidget size="small" onExpand={() => router.push('/admin')} />
          </Suspense>
        </div>
      </div>

      {/* Pinned apps grid */}
      <div className="flex-1 px-4 pt-2">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-medium uppercase tracking-wider text-white/30">Pinned</h3>
          <button
            type="button"
            onClick={() => setShowDrawer(true)}
            className="text-xs text-[#f5a623]/60 transition-colors hover:text-[#f5a623]"
          >
            Edit
          </button>
        </div>
        {resolvedApps.length > 0 ? (
          <div className="grid grid-cols-4 gap-4 sm:grid-cols-5">
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
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-3xl">📱</div>
            <div className="mt-2 text-sm text-white/40">No apps pinned</div>
            <button
              type="button"
              onClick={() => setShowDrawer(true)}
              className="mt-2 text-xs text-[#f5a623]"
            >
              Browse apps
            </button>
          </div>
        )}
      </div>

      {/* Persistent dock */}
      <Dock onOpenDrawer={() => setShowDrawer(true)} />

      {/* Overlays */}
      {showDrawer && (
        <AppDrawer
          pinnedApps={pinnedApps}
          onOpen={(app) => {
            handleOpen(app);
            setShowDrawer(false);
          }}
          onPin={onPin}
          onUnpin={onUnpin}
          onClose={() => setShowDrawer(false)}
        />
      )}

      {showShellPicker && onSetShell && (
        <ShellPicker
          currentShell={currentShell}
          onSelect={onSetShell}
          onClose={() => setShowShellPicker(false)}
        />
      )}
    </div>
  );
}
