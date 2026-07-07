import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ZABAL Games — Stream Overlay',
  description: 'Generic OBS / Restream browser-source overlay for ZABAL Games workshops',
  robots: 'noindex, nofollow',
};

/**
 * Minimal layout for OBS / Restream browser source — no nav, no chrome.
 * Transparent background so the overlay composites over the live scene.
 * Mirrors src/app/overlay/now-playing/layout.tsx.
 */
export default function ZabalGamesOverlayLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'transparent', minHeight: '100vh', overflow: 'hidden' }}>
      {/* Force the app's global navy body/html to transparent so this route is a
          true transparent browser source (in-browser too, not only via OBS custom CSS). */}
      <style>{'html,body{background:transparent !important;}'}</style>
      {children}
    </div>
  );
}
