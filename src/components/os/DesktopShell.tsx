'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { APP_REGISTRY, getApp } from '@/lib/os/app-manifest';
import type { AppManifest, ShellId } from '@/lib/os/types';
import { usePlayerContext } from '@/providers/audio/PlayerProvider';
import { AppDrawer } from './AppDrawer';

interface DesktopShellProps {
  pinnedApps: string[];
  onPin: (appId: string) => void;
  onUnpin: (appId: string) => void;
  onSetShell?: (shell: ShellId) => void;
  currentShell?: ShellId;
  userName?: string;
}

export function DesktopShell({
  pinnedApps,
  onPin,
  onUnpin,
  onSetShell,
  currentShell = 'desktop',
  userName,
}: DesktopShellProps) {
  const router = useRouter();
  const { state: playerState } = usePlayerContext();
  const [showDrawer, setShowDrawer] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    function updateClock() {
      setCurrentTime(
        new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      );
    }
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenApp = useCallback(
    (app: AppManifest) => {
      if (app.externalUrl) {
        window.open(app.externalUrl, '_blank');
      } else if (app.route) {
        router.push(app.route);
      }
    },
    [router],
  );

  const resolvedPinned = pinnedApps
    .map((id) => getApp(id))
    .filter((app): app is AppManifest => app !== undefined);

  return (
    <div className="relative min-h-screen bg-[#070e18] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0f213c] via-[#070e18] to-[#040810] text-white flex flex-col justify-between overflow-hidden select-none">
      {/* ── DESKTOP WORKSPACE ICONS ─────────────────────────────────── */}
      <div className="p-6 grid grid-flow-col grid-rows-6 auto-cols-max gap-6 max-h-[calc(100vh-60px)]">
        {APP_REGISTRY.slice(0, 12).map((app) => (
          <button
            key={app.id}
            type="button"
            onClick={() => handleOpenApp(app)}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/10 active:bg-white/15 focus:outline-none focus:ring-1 focus:ring-[#f5a623] w-20 transition-all text-center group"
          >
            <div className="h-12 w-12 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-2xl group-hover:scale-105 group-hover:border-[#f5a623]/50 transition-all shadow-md">
              {app.icon}
            </div>
            <span className="text-xs font-medium text-white/90 drop-shadow truncate w-full">
              {app.name}
            </span>
          </button>
        ))}
      </div>

      {/* ── BOTTOM TASKBAR ─────────────────────────────────────────── */}
      <footer className="h-12 border-t border-white/10 bg-[#0a1628]/95 backdrop-blur-md px-3 flex items-center justify-between z-40">
        {/* Left: Start / App Drawer Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDrawer((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f5a623] text-[#070e18] font-bold text-xs hover:bg-[#ffd700] transition-colors shadow"
          >
            <span>ZAO</span>
          </button>

          <span className="h-4 w-px bg-white/20" />

          {/* Running / Pinned Apps */}
          <div className="flex items-center gap-1">
            {resolvedPinned.map((app) => (
              <button
                key={app.id}
                type="button"
                onClick={() => handleOpenApp(app)}
                title={app.name}
                className="px-2.5 py-1 rounded-lg hover:bg-white/10 text-xs flex items-center gap-1.5 text-white/80 transition-colors border border-transparent hover:border-white/10"
              >
                <span>{app.icon}</span>
                <span className="hidden sm:inline text-xs">{app.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: System Tray & Clock */}
        <div className="flex items-center gap-3">
          {/* Now playing indicator */}
          {playerState.metadata && (
            <Link
              href="/music"
              className="hidden md:flex items-center gap-1.5 text-xs text-white/60 hover:text-white px-2 py-1 rounded bg-white/5"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#f5a623] animate-pulse" />
              <span className="truncate max-w-[120px]">{playerState.metadata.trackName}</span>
            </Link>
          )}

          {/* Shell Switcher */}
          {onSetShell && (
            <div className="flex items-center gap-1 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => onSetShell('dashboard')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  currentShell === 'dashboard'
                    ? 'bg-[#f5a623] text-[#070e18] font-bold'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                Cockpit
              </button>
              <button
                type="button"
                onClick={() => onSetShell('phone')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  currentShell === 'phone'
                    ? 'bg-[#f5a623] text-[#070e18] font-bold'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                Mobile
              </button>
            </div>
          )}

          {/* User badge */}
          {userName && (
            <span className="hidden lg:inline text-[11px] font-mono text-[#f5a623] px-2 py-0.5 rounded bg-white/5 border border-white/5">
              {userName}
            </span>
          )}

          {/* Clock */}
          <div className="text-xs font-mono font-medium text-white/90 bg-black/40 px-2.5 py-1 rounded border border-white/5">
            {currentTime || '00:00'}
          </div>
        </div>
      </footer>

      {/* App Drawer Popup */}
      {showDrawer && (
        <AppDrawer
          pinnedApps={pinnedApps}
          onOpen={(app) => {
            handleOpenApp(app);
            setShowDrawer(false);
          }}
          onPin={onPin}
          onUnpin={onUnpin}
          onClose={() => setShowDrawer(false)}
        />
      )}
    </div>
  );
}
