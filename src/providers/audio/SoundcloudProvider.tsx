'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { usePlayerContext } from './PlayerProvider';

interface SCWidget {
  bind(event: string, handler: (data?: unknown) => void): void;
  play(): void;
  pause(): void;
  seekTo(ms: number): void;
  getDuration(callback: (duration: number) => void): void;
  load(url: string, options?: Record<string, unknown>): void;
}

declare global {
  interface Window {
    SC?: {
      Widget: {
        (element: HTMLIFrameElement): SCWidget;
        Events: {
          READY: string;
          PLAY: string;
          PLAY_PROGRESS: string;
          PAUSE: string;
          FINISH: string;
          ERROR: string;
        };
      };
    };
  }
}

export function SoundcloudProvider({ children }: { children: ReactNode }) {
  const { state, dispatch, registerController, onEndedRef } = usePlayerContext();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const widgetRef = useRef<SCWidget | null>(null);
  const widgetReadyRef = useRef(false);
  const pendingUrlRef = useRef<string | null>(null);

  // Load SC Widget API and initialize widget
  useEffect(() => {
    const loadApi = () => {
      if (document.getElementById('sc-widget-api')) return;
      const script = document.createElement('script');
      script.id = 'sc-widget-api';
      script.src = 'https://w.soundcloud.com/player/api.js';
      document.head.appendChild(script);
    };
    loadApi();

    // Poll until SC global and iframe are ready
    const interval = setInterval(() => {
      if (!window.SC || !iframeRef.current || widgetRef.current) return;

      const widget = window.SC.Widget(iframeRef.current);
      widgetRef.current = widget;

      widget.bind(window.SC.Widget.Events.READY, () => {
        widgetReadyRef.current = true;
        if (pendingUrlRef.current) {
          widget.load(pendingUrlRef.current, {
            auto_play: true,
            hide_related: true,
            show_comments: false,
            show_user: false,
          });
          pendingUrlRef.current = null;
        }
      });

      widget.bind(window.SC.Widget.Events.PLAY, () => {
        dispatch({ type: 'LOADED' });
        widget.getDuration((dur) => dispatch({ type: 'SET_DURATION', payload: dur }));
      });

      widget.bind(window.SC.Widget.Events.PLAY_PROGRESS, (data: unknown) => {
        const d = data as { currentPosition: number };
        dispatch({ type: 'PROGRESS', payload: d.currentPosition });
      });

      widget.bind(window.SC.Widget.Events.FINISH, () => {
        if (onEndedRef.current) {
          onEndedRef.current();
        } else {
          dispatch({ type: 'STOP' });
        }
      });

      registerController('soundcloud', {
        play: () => widget.play(),
        pause: () => widget.pause(),
        seek: (ms) => widget.seekTo(ms),
        load: (url) => {
          if (!widgetReadyRef.current) {
            pendingUrlRef.current = url;
            return;
          }
          widget.load(url, {
            auto_play: true,
            hide_related: true,
            show_comments: false,
            show_user: false,
          });
        },
      });

      clearInterval(interval);
    }, 200);

    return () => clearInterval(interval);
  }, [dispatch, registerController]);

  // React to new SoundCloud tracks
  useEffect(() => {
    const { metadata, status } = state;
    if (!metadata || metadata.type !== 'soundcloud') return;
    if (status !== 'loading') return;

    const widget = widgetRef.current;
    if (!widget || !widgetReadyRef.current) {
      pendingUrlRef.current = metadata.url;
      return;
    }

    widget.load(metadata.url, {
      auto_play: true,
      hide_related: true,
      show_comments: false,
      show_user: false,
    });
    // LOADED dispatched via PLAY event handler above
  }, [state.metadata?.url, state.status, state.metadata?.type]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <iframe
        ref={iframeRef}
        id="sc-widget"
        allow="autoplay"
        src="https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/&auto_play=false"
        style={{ display: 'none', position: 'absolute', width: 0, height: 0 }}
        title="SoundCloud Player"
      />
      {children}
    </>
  );
}
