'use client';

import { useState, useEffect } from 'react';

export function useMiniApp() {
  const [isMiniApp, setIsMiniApp] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    async function detect() {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        const inMiniApp = await sdk.isInMiniApp();
        setIsMiniApp(inMiniApp);

        if (inMiniApp) {
          await sdk.actions.ready();
          setSdkReady(true);
        }
      } catch {
        // SDK not available — we're in a browser
      }
    }
    detect();
  }, []);

  return { isMiniApp, sdkReady };
}
