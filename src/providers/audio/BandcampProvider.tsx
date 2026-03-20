'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { usePlayerContext } from './PlayerProvider';

/**
 * Bandcamp playback via iframe embed.
 * Bandcamp URLs are converted to embed format.
 * Limited control — play/pause via iframe API is not available,
 * so we load/unload the iframe.
 */
export function BandcampProvider({ children }: { children: ReactNode }) {
  const { state, dispatch, registerController } = usePlayerContext();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    registerController('bandcamp', {
      play: () => { /* Bandcamp iframe auto-plays on load */ },
      pause: () => {
        // Remove iframe to stop playback
        if (iframeRef.current) {
          iframeRef.current.src = '';
        }
        dispatch({ type: 'PAUSE' });
      },
      seek: () => { /* Not supported via iframe */ },
      load: (url: string) => {
        // Bandcamp embeds need the track/album ID from oembed
        // For now, create an iframe with the page URL
        if (iframeRef.current) {
          const embedUrl = `${url}?embedded=true`;
          iframeRef.current.src = embedUrl;
          dispatch({ type: 'LOADED' });
        }
      },
    });
  }, [registerController, dispatch]);

  const isActive = state.metadata?.type === 'bandcamp';

  return (
    <>
      {children}
      <iframe
        ref={iframeRef}
        title="Bandcamp Player"
        style={{
          position: 'fixed',
          width: isActive ? '1px' : '0',
          height: isActive ? '1px' : '0',
          opacity: 0,
          pointerEvents: 'none',
          border: 'none',
        }}
        allow="autoplay"
        sandbox="allow-scripts allow-same-origin allow-popups"
      />
    </>
  );
}
