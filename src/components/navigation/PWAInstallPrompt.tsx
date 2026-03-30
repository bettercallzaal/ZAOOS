'use client';
import { useState, useEffect, useCallback } from 'react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Don't show if already installed as standalone app
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    // Don't show if user permanently dismissed
    if (localStorage.getItem('zao-pwa-dismissed-permanent') === '1') return;

    // Check temporary dismiss (24h cooldown)
    const lastDismissed = localStorage.getItem('zao-pwa-dismissed-at');
    if (lastDismissed) {
      const elapsed = Date.now() - Number(lastDismissed);
      if (elapsed < 24 * 60 * 60 * 1000) return; // 24 hours
    }

    // Track page views — only show after 3rd visit
    const views = Number(localStorage.getItem('zao-pwa-views') || '0') + 1;
    localStorage.setItem('zao-pwa-views', String(views));
    if (views < 3) return;

    // iOS detection — Safari doesn't support beforeinstallprompt
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream) {
      setIsIOS(true);
      setShowPrompt(true);
      return;
    }

    // Android / Desktop Chrome — listen for the native install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const animateClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setShowPrompt(false);
      setIsExiting(false);
    }, 300);
  }, []);

  // Auto-hide after 15 seconds if user doesn't interact
  useEffect(() => {
    if (!showPrompt) return;
    const timer = setTimeout(() => animateClose(), 15000);
    return () => clearTimeout(timer);
  }, [showPrompt, animateClose]);

  const handleInstall = async () => {
    if (deferredPrompt && 'prompt' in deferredPrompt) {
      (deferredPrompt as { prompt: () => void }).prompt();
    }
    animateClose();
  };

  /** Temporary dismiss — will show again after 24h */
  const handleDismiss = () => {
    localStorage.setItem('zao-pwa-dismissed-at', String(Date.now()));
    animateClose();
  };

  /** Permanent dismiss — never show again */
  const handleDismissPermanently = () => {
    localStorage.setItem('zao-pwa-dismissed-permanent', '1');
    animateClose();
  };

  if (!showPrompt) return null;

  return (
    <div
      className={`fixed bottom-20 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-80 transition-all duration-300 ${
        isExiting
          ? 'opacity-0 translate-y-4'
          : 'opacity-100 translate-y-0 animate-slide-up'
      }`}
    >
      {/* Gold accent top bar */}
      <div className="h-0.5 w-full bg-gradient-to-r from-[#f5a623] to-[#f5a623]/30 rounded-t-xl" />

      <div className="bg-[#0d1b2a] border border-[#f5a623]/30 border-t-0 rounded-b-xl p-4 shadow-2xl shadow-black/50">
        <div className="flex items-start gap-3">
          {/* App icon */}
          <div className="w-10 h-10 rounded-lg bg-[#f5a623]/10 border border-[#f5a623]/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-[#f5a623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
            </svg>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white leading-snug">Install ZAO OS</p>
            <p className="text-xs text-gray-400 mt-0.5 leading-snug">
              {isIOS
                ? 'Tap the Share button, then "Add to Home Screen"'
                : 'Add to your home screen for the full app experience'}
            </p>
          </div>

          {/* Dismiss (X) */}
          <button
            onClick={handleDismiss}
            aria-label="Dismiss install prompt"
            className="text-gray-600 hover:text-gray-400 transition-colors p-1 flex-shrink-0 -mt-1 -mr-1"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-3">
          {!isIOS && (
            <button
              onClick={handleInstall}
              className="flex-1 px-4 py-2 rounded-lg bg-[#f5a623] text-[#0a1628] text-sm font-semibold hover:bg-[#f5a623]/90 active:scale-[0.98] transition-all"
            >
              Install
            </button>
          )}
          <button
            onClick={handleDismissPermanently}
            className="px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
          >
            Don&apos;t show again
          </button>
        </div>
      </div>
    </div>
  );
}
