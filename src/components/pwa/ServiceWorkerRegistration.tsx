'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker on mount.
 * Place this component in the root layout.
 *
 * WHY THE readyState CHECK. This used to register only from inside
 * `window.addEventListener('load', ...)`. A React effect runs after hydration,
 * and hydration is not ordered against `load` - `load` waits on subresources,
 * not on React's scheduler. On a cached, image-light page (or any page where
 * the main thread is busy enough that the passive-effect flush slips a task)
 * `load` has ALREADY fired by the time this effect runs, the listener is
 * attached to an event that will never fire again, and the service worker is
 * silently never registered: no offline page, no precache, no periodic update
 * check, and no error anywhere to say so.
 *
 * So: if the document has already finished loading, register now; otherwise
 * wait for `load` as before (still the right thing - registration should not
 * compete with the initial render for bandwidth).
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    let updateInterval: ReturnType<typeof setInterval> | undefined;
    let cancelled = false;

    const register = () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          if (cancelled) return;
          console.log('[SW] Registered, scope:', registration.scope);

          // Check for updates periodically (every 60 min)
          updateInterval = setInterval(
            () => {
              registration.update();
            },
            60 * 60 * 1000,
          );
        })
        .catch((error) => {
          console.error('[SW] Registration failed:', error);
        });
    };

    // Register after page load to avoid blocking initial render - unless load
    // has already happened, in which case the listener would never fire.
    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register);
    }

    return () => {
      cancelled = true;
      window.removeEventListener('load', register);
      if (updateInterval) clearInterval(updateInterval);
    };
  }, []);

  return null;
}
