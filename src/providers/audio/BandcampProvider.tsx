'use client';

import { ReactNode } from 'react';

/**
 * Bandcamp tracks open externally — iframe embed API doesn't support
 * play/pause/seek control. MusicEmbed.tsx handles the external redirect.
 * This provider is a passthrough wrapper kept for architecture consistency.
 */
export function BandcampProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
