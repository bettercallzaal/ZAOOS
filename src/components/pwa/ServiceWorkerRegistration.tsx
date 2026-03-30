'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker on mount.
 * Place this component in the root layout.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // Register after page load to avoid blocking initial render
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[SW] Registered, scope:', registration.scope);

          // Check for updates periodically (every 60 min)
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);
        })
        .catch((error) => {
          console.error('[SW] Registration failed:', error);
        });
    });
  }, []);

  return null;
}
