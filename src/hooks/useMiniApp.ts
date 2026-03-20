'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface MiniAppContext {
  userFid: number | null;
  safeAreaInsets: SafeAreaInsets;
}

interface MiniAppResult {
  isMiniApp: boolean;
  sdkReady: boolean;
  sdkAvailable: boolean;
  context: MiniAppContext;
  composeCast: (options: { text?: string; embeds?: string[] }) => Promise<boolean>;
}

const DEFAULT_INSETS: SafeAreaInsets = { top: 0, bottom: 0, left: 0, right: 0 };

export function useMiniApp(): MiniAppResult {
  const [isMiniApp, setIsMiniApp] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkAvailable, setSdkAvailable] = useState(false);
  const [context, setContext] = useState<MiniAppContext>({
    userFid: null,
    safeAreaInsets: DEFAULT_INSETS,
  });

  // Keep a ref to the sdk module so composeCast can use it without re-importing
  const sdkRef = useRef<typeof import('@farcaster/miniapp-sdk')['sdk'] | null>(null);

  useEffect(() => {
    async function detect() {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        setSdkAvailable(true);
        sdkRef.current = sdk;

        const inMiniApp = await sdk.isInMiniApp();
        setIsMiniApp(inMiniApp);

        if (inMiniApp) {
          await sdk.actions.ready();
          setSdkReady(true);

          // Extract context: user FID and safe area insets
          try {
            const sdkContext = await sdk.context;
            if (sdkContext) {
              setContext({
                userFid: sdkContext.user?.fid ?? null,
                safeAreaInsets: sdkContext.client?.safeAreaInsets ?? DEFAULT_INSETS,
              });
            }
          } catch {
            // Context not available — keep defaults
          }
        }
      } catch {
        // SDK not available — we're in a browser
        setSdkAvailable(false);
      }
    }
    detect();
  }, []);

  const composeCast = useCallback(
    async (options: { text?: string; embeds?: string[] }): Promise<boolean> => {
      if (!sdkRef.current || !isMiniApp || !sdkReady) {
        return false;
      }
      try {
        await sdkRef.current.actions.composeCast({
          text: options.text,
          embeds: options.embeds as [`https://${string}`] | undefined,
        });
        return true;
      } catch (err) {
        console.error('[useMiniApp] composeCast failed:', err);
        return false;
      }
    },
    [isMiniApp, sdkReady]
  );

  return { isMiniApp, sdkReady, sdkAvailable, context, composeCast };
}
