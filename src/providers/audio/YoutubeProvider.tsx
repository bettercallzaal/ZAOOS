'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { usePlayerContext } from './PlayerProvider';

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        options: {
          height?: number | string;
          width?: number | string;
          videoId?: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (e: { target: YTPlayer }) => void;
            onStateChange?: (e: { data: number }) => void;
          };
        },
      ) => YTPlayer;
      PlayerState: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  loadVideoById(videoId: string): void;
  destroy(): void;
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /[?&]v=([^&]+)/,
    /youtu\.be\/([^?&#]+)/,
    /youtube\.com\/embed\/([^?&#]+)/,
    /youtube\.com\/shorts\/([^?&#]+)/,
    /music\.youtube\.com\/watch\?.*v=([^&]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export function YoutubeProvider({ children }: { children: ReactNode }) {
  const { state, dispatch, registerController, onEndedRef } = usePlayerContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const apiReadyRef = useRef(false);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopProgress = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  };

  const startProgress = (player: YTPlayer) => {
    stopProgress();
    progressInterval.current = setInterval(() => {
      if (!window.YT) return;
      const ps = player.getPlayerState();
      if (ps === window.YT.PlayerState.PLAYING) {
        dispatch({ type: 'PROGRESS', payload: player.getCurrentTime() * 1000 });
      }
    }, 500);
  };

  // Load YT IFrame API
  useEffect(() => {
    if (document.getElementById('yt-iframe-api')) {
      if (window.YT?.Player) apiReadyRef.current = true;
      return;
    }

    window.onYouTubeIframeAPIReady = () => {
      apiReadyRef.current = true;
    };

    const script = document.createElement('script');
    script.id = 'yt-iframe-api';
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(script);

    return () => {
      window.onYouTubeIframeAPIReady = undefined;
    };
  }, []);

  // Register controller
  useEffect(() => {
    registerController('youtube', {
      play: () => playerRef.current?.playVideo(),
      pause: () => {
        playerRef.current?.pauseVideo();
        stopProgress();
      },
      seek: (ms) => playerRef.current?.seekTo(ms / 1000, true),
      load: () => {
        // Loading is handled in the state watcher below
      },
    });
  }, [registerController]);

  // React to new YouTube tracks
  useEffect(() => {
    const { metadata, status } = state;
    if (!metadata || metadata.type !== 'youtube') {
      stopProgress();
      return;
    }
    if (status !== 'loading') return;

    const videoId = extractVideoId(metadata.url);
    if (!videoId) return;

    const initPlayer = () => {
      if (!apiReadyRef.current || !containerRef.current || !window.YT?.Player) return;

      // Destroy existing player
      if (playerRef.current) {
        stopProgress();
        playerRef.current.destroy();
        playerRef.current = null;
      }

      playerRef.current = new window.YT.Player('yt-player-inner', {
        height: 1,
        width: 1,
        videoId,
        playerVars: { autoplay: 1, controls: 0, rel: 0 },
        events: {
          onReady: (e) => {
            e.target.playVideo();
            dispatch({ type: 'SET_DURATION', payload: e.target.getDuration() * 1000 });
            dispatch({ type: 'LOADED' });
            startProgress(e.target);
          },
          onStateChange: (e) => {
            if (!window.YT) return;
            if (e.data === window.YT.PlayerState.PLAYING) {
              startProgress(playerRef.current!);
            } else if (e.data === window.YT.PlayerState.PAUSED) {
              stopProgress();
            } else if (e.data === window.YT.PlayerState.ENDED) {
              stopProgress();
              if (onEndedRef.current) {
                onEndedRef.current();
              } else {
                dispatch({ type: 'STOP' });
              }
            }
          },
        },
      });
    };

    if (apiReadyRef.current) {
      initPlayer();
    } else {
      const original = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        original?.();
        apiReadyRef.current = true;
        initPlayer();
      };
    }

    return () => stopProgress();
  }, [state.metadata?.url, state.status, state.metadata?.type]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProgress();
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        style={{ display: 'none', position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}
        aria-hidden="true"
      >
        <div id="yt-player-inner" />
      </div>
      {children}
    </>
  );
}
