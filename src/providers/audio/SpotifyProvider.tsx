'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { usePlayerContext } from './PlayerProvider';

interface SpotifyController {
  play(): void;
  pause(): void;
  seek(positionMs: number): void;
  loadUri(uri: string): void;
  addListener(event: string, callback: (data: unknown) => void): void;
  removeListener(event: string): void;
  destroy(): void;
}

interface SpotifyIFrameAPI {
  createController(
    element: HTMLElement,
    options: { uri: string; width?: string | number; height?: string | number },
    callback: (controller: SpotifyController) => void,
  ): void;
}

declare global {
  interface Window {
    SpotifyIframeApi?: SpotifyIFrameAPI;
    onSpotifyIframeApiReady?: (api: SpotifyIFrameAPI) => void;
  }
}

function spotifyUriFromUrl(url: string): string {
  const match = url.match(/spotify\.com\/(track|album|playlist|episode)\/([a-zA-Z0-9]+)/);
  if (match) return `spotify:${match[1]}:${match[2]}`;
  return url;
}

export function SpotifyProvider({ children }: { children: ReactNode }) {
  const { state, dispatch, registerController, onEndedRef } = usePlayerContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<SpotifyController | null>(null);
  const apiRef = useRef<SpotifyIFrameAPI | null>(null);
  const pendingUriRef = useRef<string | null>(null);

  // Load Spotify IFrame API
  useEffect(() => {
    if (document.getElementById('spotify-iframe-api')) {
      if (window.SpotifyIframeApi) apiRef.current = window.SpotifyIframeApi;
      return;
    }

    window.onSpotifyIframeApiReady = (api: SpotifyIFrameAPI) => {
      apiRef.current = api;
      window.SpotifyIframeApi = api;
      if (pendingUriRef.current) {
        createSpotifyController(api, pendingUriRef.current);
        pendingUriRef.current = null;
      }
    };

    const script = document.createElement('script');
    script.id = 'spotify-iframe-api';
    script.src = 'https://open.spotify.com/embed/iframe-api/v1';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      window.onSpotifyIframeApiReady = undefined;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const createSpotifyController = (api: SpotifyIFrameAPI, uri: string) => {
    if (!containerRef.current) return;

    // Destroy existing controller
    if (controllerRef.current) {
      controllerRef.current.destroy();
      controllerRef.current = null;
    }

    api.createController(
      containerRef.current,
      { uri, width: 1, height: 1 },
      (controller) => {
        controllerRef.current = controller;

        controller.addListener('playback_update', (data: unknown) => {
          const d = data as { data: { position: number; duration: number; isPaused: boolean } };
          if (d?.data) {
            dispatch({ type: 'PROGRESS', payload: d.data.position });
            if (d.data.duration) {
              dispatch({ type: 'SET_DURATION', payload: d.data.duration });
            }
            // Detect track end: position within 1s of duration and paused
            if (d.data.duration > 0 && d.data.isPaused && d.data.position >= d.data.duration - 1000) {
              if (onEndedRef.current) {
                onEndedRef.current();
              } else {
                dispatch({ type: 'STOP' });
              }
            }
          }
        });

        controller.addListener('ready', () => {
          dispatch({ type: 'LOADED' });
          controller.play();
        });
      },
    );
  };

  // Register controller
  useEffect(() => {
    registerController('spotify', {
      play: () => controllerRef.current?.play(),
      pause: () => controllerRef.current?.pause(),
      seek: (ms) => controllerRef.current?.seek(ms),
      load: () => {
        // Loading handled in state watcher below
      },
    });
  }, [registerController]);

  // React to new Spotify tracks
  useEffect(() => {
    const { metadata, status } = state;
    if (!metadata || metadata.type !== 'spotify') return;
    if (status !== 'loading') return;

    const uri = spotifyUriFromUrl(metadata.url);

    if (!apiRef.current) {
      pendingUriRef.current = uri;
      return;
    }

    if (controllerRef.current) {
      controllerRef.current.loadUri(uri);
      controllerRef.current.play();
      dispatch({ type: 'LOADED' });
    } else {
      createSpotifyController(apiRef.current, uri);
    }
  }, [state.metadata?.url, state.status, state.metadata?.type]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div
        ref={containerRef}
        style={{ display: 'none', position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}
        aria-hidden="true"
      />
      {children}
    </>
  );
}
