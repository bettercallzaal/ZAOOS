'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { usePlayerContext } from './PlayerProvider';

/**
 * Apple Music playback via MusicKit embed iframe.
 * Converts music.apple.com URLs to embed format.
 * Apple Music embeds support auto-play for preview clips (~30s).
 */
export function AppleMusicProvider({ children }: { children: ReactNode }) {
  const { state, dispatch, registerController } = usePlayerContext();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    registerController('applemusic', {
      play: () => { /* Apple Music embed auto-plays preview */ },
      pause: () => {
        if (iframeRef.current) {
          iframeRef.current.src = '';
        }
        dispatch({ type: 'PAUSE' });
      },
      seek: () => { /* Not supported via embed */ },
      load: (url: string) => {
        // Convert music.apple.com/us/album/... to embed.music.apple.com/us/album/...
        const embedUrl = url.replace('music.apple.com', 'embed.music.apple.com');
        if (iframeRef.current) {
          iframeRef.current.src = embedUrl;
          dispatch({ type: 'LOADED' });
          // Apple Music previews are ~30 seconds
          dispatch({ type: 'SET_DURATION', payload: 30000 });
        }
      },
    });
  }, [registerController, dispatch]);

  const isActive = state.metadata?.type === 'applemusic';

  return (
    <>
      {children}
      <iframe
        ref={iframeRef}
        title="Apple Music Player"
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
