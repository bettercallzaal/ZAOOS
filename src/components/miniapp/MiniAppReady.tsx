'use client';

import { useEffect } from 'react';

/**
 * Calls `sdk.actions.ready()` as early as possible to dismiss the Farcaster
 * native splash screen on every route.
 *
 * This is intentionally separate from `MiniAppGate` (which handles auth +
 * allowlist + redirects) so the splash dismissal is NOT blocked by the
 * lazy-loaded RainbowKit + AuthKit chunks. A stuck splash is one of the most
 * common Farcaster Mini App bugs and the SDK docs explicitly call out
 * "ready() never invoked" as the #1 cause.
 *
 * Mounted in the root <body> before <Providers> so it runs on the very first
 * client render, regardless of which page is being viewed (including server
 * components like /sopha).
 *
 * Defensive design:
 *   - Idempotent — safe to call multiple times. MiniAppGate also calls it.
 *   - Fallback timer fires `ready()` after 2.5s even if the SDK import is
 *     slow, so the splash never hangs forever on bad networks.
 *   - Errors are swallowed (and logged) so an SDK init failure on the web
 *     context does not crash the route.
 */
export function MiniAppReady() {
  useEffect(() => {
    let cancelled = false;
    let fallbackFired = false;

    const fireReady = async (reason: 'primary' | 'fallback') => {
      if (cancelled) return;
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        await sdk.actions.ready();
        if (reason === 'fallback') {
          // eslint-disable-next-line no-console
          console.warn('[miniapp-ready] dismissed via fallback timer');
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[miniapp-ready] sdk.actions.ready() failed', err);
      }
    };

    // Primary path — fire ASAP
    fireReady('primary');

    // Fallback — if primary somehow hangs (slow SDK import, blocked iframe,
    // CSP weirdness), force a second attempt at 2.5s so the splash is never
    // stuck for more than that.
    const timer = setTimeout(() => {
      fallbackFired = true;
      fireReady('fallback');
    }, 2500);

    return () => {
      cancelled = true;
      if (!fallbackFired) clearTimeout(timer);
    };
  }, []);

  return null;
}
