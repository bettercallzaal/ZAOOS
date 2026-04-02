'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

type LocationContext =
  | { type: 'cast_embed'; cast: { hash: string; text: string; author: { fid: number } } }
  | { type: 'cast_share'; cast: { hash: string; text: string; author: { fid: number } } }
  | { type: 'notification'; notification: { notificationId: string; title: string; body: string } }
  | { type: 'open_miniapp'; referrerDomain: string }
  | null;

interface MiniAppContext {
  userFid: number | null;
  safeAreaInsets: SafeAreaInsets;
  location: LocationContext;
  added: boolean;
}

type HapticImpact = 'light' | 'medium' | 'heavy' | 'soft' | 'rigid';
type HapticNotification = 'success' | 'warning' | 'error';

interface MiniAppResult {
  isMiniApp: boolean;
  sdkReady: boolean;
  sdkAvailable: boolean;
  context: MiniAppContext;
  composeCast: (options: { text?: string; embeds?: string[]; channelKey?: string }) => Promise<boolean>;
  hapticImpact: (style: HapticImpact) => Promise<void>;
  hapticNotification: (type: HapticNotification) => Promise<void>;
  hapticSelection: () => Promise<void>;
  viewProfile: (fid: number) => Promise<void>;
  viewCast: (hash: string) => Promise<void>;
  addMiniApp: () => Promise<boolean>;
}

const DEFAULT_INSETS: SafeAreaInsets = { top: 0, bottom: 0, left: 0, right: 0 };

export function useMiniApp(): MiniAppResult {
  const [isMiniApp, setIsMiniApp] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkAvailable, setSdkAvailable] = useState(false);
  const [context, setContext] = useState<MiniAppContext>({
    userFid: null,
    safeAreaInsets: DEFAULT_INSETS,
    location: null,
    added: false,
  });

  const sdkRef = useRef<typeof import('@farcaster/miniapp-sdk')['sdk'] | null>(null);
  const capabilitiesRef = useRef<string[]>([]);

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

          // Enable automatic back navigation integration
          try {
            await sdk.back.enableWebNavigation();
          } catch {
            // Back navigation not supported in this client
          }

          // Cache capabilities for feature detection
          try {
            capabilitiesRef.current = await sdk.getCapabilities();
          } catch {
            capabilitiesRef.current = [];
          }

          // Extract context: user FID, safe area insets, location, added state
          try {
            const sdkContext = await sdk.context;
            if (sdkContext) {
              setContext({
                userFid: sdkContext.user?.fid ?? null,
                safeAreaInsets: sdkContext.client?.safeAreaInsets ?? DEFAULT_INSETS,
                location: (sdkContext.location as LocationContext) ?? null,
                added: sdkContext.client?.added ?? false,
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
    async (options: { text?: string; embeds?: string[]; channelKey?: string }): Promise<boolean> => {
      if (!sdkRef.current || !isMiniApp || !sdkReady) return false;
      try {
        await sdkRef.current.actions.composeCast({
          text: options.text,
          embeds: options.embeds as [`https://${string}`] | undefined,
          channelKey: options.channelKey,
        });
        return true;
      } catch (err) {
        console.error('[useMiniApp] composeCast failed:', err);
        return false;
      }
    },
    [isMiniApp, sdkReady],
  );

  const hapticImpact = useCallback(
    async (style: HapticImpact) => {
      if (!sdkRef.current || !isMiniApp) return;
      if (!capabilitiesRef.current.includes('haptics.impactOccurred')) return;
      try {
        await sdkRef.current.haptics.impactOccurred(style);
      } catch { /* not supported */ }
    },
    [isMiniApp],
  );

  const hapticNotification = useCallback(
    async (type: HapticNotification) => {
      if (!sdkRef.current || !isMiniApp) return;
      if (!capabilitiesRef.current.includes('haptics.notificationOccurred')) return;
      try {
        await sdkRef.current.haptics.notificationOccurred(type);
      } catch { /* not supported */ }
    },
    [isMiniApp],
  );

  const hapticSelection = useCallback(async () => {
    if (!sdkRef.current || !isMiniApp) return;
    if (!capabilitiesRef.current.includes('haptics.selectionChanged')) return;
    try {
      await sdkRef.current.haptics.selectionChanged();
    } catch { /* not supported */ }
  }, [isMiniApp]);

  const viewProfile = useCallback(
    async (fid: number) => {
      if (!sdkRef.current || !isMiniApp) return;
      try {
        await sdkRef.current.actions.viewProfile({ fid });
      } catch { /* not supported */ }
    },
    [isMiniApp],
  );

  const viewCast = useCallback(
    async (hash: string) => {
      if (!sdkRef.current || !isMiniApp) return;
      try {
        await sdkRef.current.actions.viewCast({ hash });
      } catch { /* not supported */ }
    },
    [isMiniApp],
  );

  const addMiniApp = useCallback(async (): Promise<boolean> => {
    if (!sdkRef.current || !isMiniApp) return false;
    try {
      await sdkRef.current.actions.addMiniApp();
      return true;
    } catch {
      return false;
    }
  }, [isMiniApp]);

  return {
    isMiniApp,
    sdkReady,
    sdkAvailable,
    context,
    composeCast,
    hapticImpact,
    hapticNotification,
    hapticSelection,
    viewProfile,
    viewCast,
    addMiniApp,
  };
}
