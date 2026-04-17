import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance: sample 10% in prod, 100% in dev
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session Replay: 1% of sessions, 100% of sessions with errors
  integrations: [
    Sentry.replayIntegration(),
  ],
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
