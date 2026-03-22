'use client';

import { ReactNode } from 'react';

/**
 * Apple Music tracks open externally — MusicKit JS requires Apple Developer
 * credentials and only plays 30s previews. MusicEmbed.tsx handles the
 * external redirect for applemusic/tidal type tracks.
 */
export function AppleMusicProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
