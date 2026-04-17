'use client';

import { useAuth } from '@/hooks/useAuth';
import { useAppConfig } from '@/lib/os/use-app-config';
import { PhoneShell } from './PhoneShell';

/**
 * ZAO OS Home Screen.
 * Loads user's shell preference and renders the appropriate layout.
 * For now, only phone shell is implemented. Others fall back to phone.
 */
export function OSHome() {
  const { user } = useAuth();
  const { config, loading, pinApp, unpinApp } = useAppConfig(user?.fid?.toString());

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#0a1628]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#f5a623] border-t-transparent" />
      </div>
    );
  }

  if (!config) {
    return (
      <PhoneShell
        pinnedApps={['chat', 'messages', 'music']}
        onPin={() => {}}
        onUnpin={() => {}}
      />
    );
  }

  // Shell routing - all shells implemented as phone for V1
  // Desktop, dashboard, and feed shells will be added in future phases
  return (
    <PhoneShell
      pinnedApps={config.pinnedApps}
      onPin={pinApp}
      onUnpin={unpinApp}
      userName={user?.displayName ?? undefined}
    />
  );
}
