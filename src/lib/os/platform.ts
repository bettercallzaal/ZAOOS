/**
 * ZAO OS Platform Detection
 * Detects whether running in web browser, iOS app, or Android app.
 * Used to conditionally enable native features (background audio, push, etc.)
 */

export type Platform = 'web' | 'ios' | 'android';

let cachedPlatform: Platform | null = null;

export function getPlatform(): Platform {
  if (cachedPlatform) return cachedPlatform;
  if (typeof window === 'undefined') return 'web';

  // Capacitor injects this on the window object
  const win = window as unknown as { Capacitor?: { getPlatform(): string; isNativePlatform(): boolean } };

  if (win.Capacitor?.isNativePlatform()) {
    const p = win.Capacitor.getPlatform();
    cachedPlatform = p === 'ios' ? 'ios' : p === 'android' ? 'android' : 'web';
  } else {
    cachedPlatform = 'web';
  }

  return cachedPlatform;
}

export function isNative(): boolean {
  const p = getPlatform();
  return p === 'ios' || p === 'android';
}

export function isIOS(): boolean {
  return getPlatform() === 'ios';
}

export function isAndroid(): boolean {
  return getPlatform() === 'android';
}
