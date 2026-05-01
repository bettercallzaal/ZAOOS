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

// Module-level iframe — survives component re-mounts and route changes
let scIframe: HTMLIFrameElement | null = null;

function ensureIframe(): HTMLIFrameElement {
  if (!scIframe || !document.body.contains(scIframe)) {
    scIframe = document.createElement('iframe');
    scIframe.id = 'sc-widget';
    scIframe.allow = 'autoplay';
    scIframe.src = 'about:blank';
    scIframe.title = 'SoundCloud Player';
    scIframe.style.cssText = 'display:none;position:absolute;width:0;height:0';
    document.body.appendChild(scIframe);
  }
  return scIframe;
}

const SC_LOAD_OPTS = {
  auto_play: true,
  hide_related: true,
  show_comments: false,
  show_user: false,
};

export function SoundcloudProvider({ children }: { children: ReactNode }) {
  const { state, dispatch, registerController, onEndedRef } = usePlayerContext();
  const widgetRef = useRef<SCWidget | null>(null);
  const widgetReadyRef = useRef(false);
  const pendingUrlRef = useRef<string | null>(null);
  const sdkLoadStartedRef = useRef(false);

  // Register controller eagerly so PlayerProvider can dispatch the moment
  // a SoundCloud track is queued — the widget itself is initialized lazily
  // when the SDK finishes loading (see deferred effect below). All four
  // entry points are widget-aware: optional-chained for the hot path,
  // queued via pendingUrlRef for load.
  useEffect(() => {
    registerController('soundcloud', {
      play: () => widgetRef.current?.play(),
      pause: () => widgetRef.current?.pause(),
      seek: (ms) => widgetRef.current?.seekTo(ms),
      setVolume: (v) =>
        (widgetRef.current as unknown as { setVolume?: (v: number) => void } | null)?.setVolume?.(v * 100),
      load: (url) => {
        if (!widgetReadyRef.current || !widgetRef.current) {
          pendingUrlRef.current = url;
          return;
        }
        widgetRef.current.load(url, SC_LOAD_OPTS);
      },
    });
  }, [registerController]);

  // Load SC Widget API + initialize widget — deferred until the first
  // SoundCloud track plays. Skips ~15KB JS + a TLS handshake to
  // soundcloud.com on every authed page for users who never play SC.
  useEffect(() => {
    if (state.metadata?.type !== 'soundcloud') return;
    if (sdkLoadStartedRef.current) return;
    sdkLoadStartedRef.current = true;

    if (!document.getElementById('sc-widget-api')) {
      const script = document.createElement('script');
      script.id = 'sc-widget-api';
      script.src = 'https://w.soundcloud.com/player/api.js';
      document.head.appendChild(script);
    }

    let pollCount = 0;
    const MAX_POLLS = 150; // 150 × 200ms = 30s
    const interval = setInterval(() => {
      pollCount++;
      if (pollCount >= MAX_POLLS) {
        clearInterval(interval);
        dispatch({ type: 'ERROR', payload: 'SoundCloud player failed to load' });
        return;
      }
      if (!window.SC || widgetRef.current) return;
      const iframe = ensureIframe();

      const widget = window.SC.Widget(iframe);
      widgetRef.current = widget;

      widget.bind(window.SC.Widget.Events.READY, () => {
        widgetReadyRef.current = true;
        if (pendingUrlRef.current) {
          widget.load(pendingUrlRef.current, SC_LOAD_OPTS);
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

      clearInterval(interval);
    }, 200);

    return () => clearInterval(interval);
  }, [state.metadata?.type, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

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

    widget.load(metadata.url, SC_LOAD_OPTS);
    // LOADED dispatched via PLAY event handler above
  }, [state.metadata?.url, state.status, state.metadata?.type]); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
