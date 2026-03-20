'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { usePlayerContext } from './PlayerProvider';

/**
 * Tidal playback via embed iframe.
 * Converts tidal.com/browse/track/{id} → embed.tidal.com/tracks/{id}
 */
export function TidalProvider({ children }: { children: ReactNode }) {
  const { state, dispatch, registerController } = usePlayerContext();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    registerController('tidal', {
      play: () => { /* Tidal embed auto-plays */ },
      pause: () => {
        if (iframeRef.current) {
          iframeRef.current.src = '';
        }
        dispatch({ type: 'PAUSE' });
      },
      seek: () => { /* Not supported via embed */ },
      load: (url: string) => {
        // Extract track ID from URL
        const match = url.match(/track\/(\d+)/);
        if (match && iframeRef.current) {
          const embedUrl = `https://embed.tidal.com/tracks/${match[1]}?layout=gridify&disableAnalytics=true`;
          iframeRef.current.src = embedUrl;
          dispatch({ type: 'LOADED' });
        }
      },
    });
  }, [registerController, dispatch]);

  const isActive = state.metadata?.type === 'tidal';

  return (
    <>
      {children}
      <iframe
        ref={iframeRef}
        title="Tidal Player"
        style={{
          position: 'fixed',
          width: isActive ? '1px' : '0',
          height: isActive ? '1px' : '0',
          opacity: 0,
          pointerEvents: 'none',
          border: 'none',
        }}
        allow="autoplay; encrypted-media"
        sandbox="allow-scripts allow-same-origin allow-popups"
      />
    </>
  );
}
