'use client';

import { useAuth } from '@/hooks/useAuth';
import { useAppConfig } from '@/lib/os/use-app-config';
import { PhoneShell } from './PhoneShell';

/**
 * ZAO OS Home Screen.
 * Loads user's shell preference and renders the appropriate layout.
 * Phone shell is the only implementation for V1.
 * Desktop, dashboard, and feed shells render phone shell with a toast.
 */
export function OSHome() {
  const { user } = useAuth();
  const { config, loading, pinApp, unpinApp, setShell } = useAppConfig(user?.fid?.toString());

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#0a1628]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#f5a623] border-t-transparent" />
        <div className="mt-3 text-xs text-white/30">Loading ZAO OS...</div>
      </div>
    );
  }

  const pinnedApps = config?.pinnedApps ?? ['chat', 'messages', 'music'];
  const currentShell = config?.shell ?? 'phone';

  return (
    <PhoneShell
      pinnedApps={pinnedApps}
      onPin={pinApp}
      onUnpin={unpinApp}
      onSetShell={setShell}
      currentShell={currentShell}
      userName={user?.displayName ?? undefined}
    />
  );
}
