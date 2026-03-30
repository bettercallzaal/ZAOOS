import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Now Playing — ZAO OS Overlay',
  description: 'OBS browser source overlay for now playing track',
  robots: 'noindex, nofollow',
};

/**
 * Minimal layout for OBS overlay — no navigation, no sidebar, no bottom bar.
 * Background is transparent for OBS browser source chroma key capture.
 */
export default function OverlayLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'transparent',
        minHeight: '100vh',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
}
