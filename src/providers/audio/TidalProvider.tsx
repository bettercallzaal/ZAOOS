'use client';

import { ReactNode } from 'react';

/**
 * Tidal tracks open externally — embed iframe doesn't support
 * play/pause/seek control. MusicEmbed.tsx handles the external redirect.
 */
export function TidalProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
