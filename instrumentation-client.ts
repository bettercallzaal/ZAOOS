import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance: sample 10% in prod, 100% in dev
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session Replay sample rates — applied when the lazy integration loads below.
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,

  sendDefaultPii: false,

  ignoreErrors: [
    'ResizeObserver loop',
    'AbortError',
    'NotAllowedError',
    'ChunkLoadError',
    'Load failed',
    'Failed to fetch',
  ],
});

// Defer Session Replay off the critical path. Replay is the heaviest
// part of the Sentry SDK (~50KB gzip + DOM serialization runtime); loading
// it after `requestIdleCallback` keeps initial bundle slim while still
// capturing replays for sessions that error after first idle.
if (typeof window !== 'undefined' && !!process.env.NEXT_PUBLIC_SENTRY_DSN) {
  const loadReplay = async () => {
    try {
      const replay = await Sentry.lazyLoadIntegration('replayIntegration');
      Sentry.addIntegration(replay());
    } catch {
      // Network-level failures shouldn't break the page; Sentry errors still capture.
    }
  };
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(loadReplay, { timeout: 5000 });
  } else {
    setTimeout(loadReplay, 2000);
  }
}

// Capture client-side router transitions in Sentry for navigation traces.
// Required hook export per @sentry/nextjs (Next 16 App Router).
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
