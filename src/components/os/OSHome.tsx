'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAppConfig } from '@/lib/os/use-app-config';
import type { ShellId } from '@/lib/os/types';
import { CommandCenterShell } from './CommandCenterShell';
import { DesktopShell } from './DesktopShell';
import { PhoneShell } from './PhoneShell';

/**
 * ZAO OS Home Screen.
 * Loads user's shell preference and renders the appropriate layout:
 * - dashboard / feed -> CommandCenterShell (Zaal's primary operations cockpit)
 * - desktop -> DesktopShell (workspace windows and taskbar)
 * - phone -> PhoneShell (mobile grid and quick widgets)
 */
export function OSHome() {
  const { user } = useAuth();
  const { config, loading, pinApp, unpinApp, setShell } = useAppConfig(user?.fid?.toString());
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    function checkScreen() {
      setIsLargeScreen(typeof window !== 'undefined' && window.innerWidth >= 1024);
    }
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#0a1628]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#f5a623] border-t-transparent" />
        <div className="mt-3 text-xs text-white/30">Loading ZAO OS...</div>
      </div>
    );
  }

  const pinnedApps = config?.pinnedApps ?? ['chat', 'messages', 'music'];

  // Default to dashboard (Command Center) on desktop screens unless explicitly configured otherwise
  let effectiveShell: ShellId = config?.shell ?? (isLargeScreen ? 'dashboard' : 'phone');
  if (config?.shell === 'dashboard' || config?.shell === 'feed') {
    effectiveShell = 'dashboard';
  } else if (config?.shell === 'desktop') {
    effectiveShell = 'desktop';
  } else if (config?.shell === 'phone') {
    effectiveShell = 'phone';
  }

  if (effectiveShell === 'dashboard') {
    return (
      <CommandCenterShell
        pinnedApps={pinnedApps}
        onPin={pinApp}
        onUnpin={unpinApp}
        onSetShell={setShell}
        currentShell={effectiveShell}
        userName={user?.displayName ?? undefined}
      />
    );
  }

  if (effectiveShell === 'desktop') {
    return (
      <DesktopShell
        pinnedApps={pinnedApps}
        onPin={pinApp}
        onUnpin={unpinApp}
        onSetShell={setShell}
        currentShell={effectiveShell}
        userName={user?.displayName ?? undefined}
      />
    );
  }

  return (
    <PhoneShell
      pinnedApps={pinnedApps}
      onPin={pinApp}
      onUnpin={unpinApp}
      onSetShell={setShell}
      currentShell={effectiveShell}
      userName={user?.displayName ?? undefined}
    />
  );
}
