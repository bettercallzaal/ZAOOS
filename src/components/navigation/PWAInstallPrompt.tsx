'use client';
import { useState, useEffect } from 'react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Don't show if already installed as standalone app
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    // Don't show if user previously dismissed
    if (localStorage.getItem('zao-pwa-dismissed')) return;

    // Track page views — only show after 3 views
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

  // Auto-hide after 10 seconds if user doesn't interact
  useEffect(() => {
    if (!showPrompt) return;
    const timer = setTimeout(() => setShowPrompt(false), 10000);
    return () => clearTimeout(timer);
  }, [showPrompt]);

  const handleInstall = async () => {
    if (deferredPrompt && 'prompt' in deferredPrompt) {
      (deferredPrompt as { prompt: () => void }).prompt();
    }
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('zao-pwa-dismissed', '1');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-80 animate-in slide-in-from-bottom-4 duration-300">
      {/* Gold accent top bar */}
      <div className="h-0.5 w-full bg-gradient-to-r from-[#f5a623] to-[#f5a623]/30 rounded-t-xl" />

      <div className="bg-[#0d1b2a] border border-[#f5a623]/30 border-t-0 rounded-b-xl p-4 shadow-2xl shadow-black/50">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="w-10 h-10 rounded-lg bg-[#f5a623]/10 border border-[#f5a623]/20 flex items-center justify-center flex-shrink-0">
            <span className="text-lg" role="img" aria-label="music note">🎵</span>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white leading-snug">Install ZAO OS</p>
            <p className="text-xs text-gray-400 mt-0.5 leading-snug">
              {isIOS
                ? 'Tap Share \u2192 Add to Home Screen'
                : 'Get the full app experience'}
            </p>
          </div>

          {/* Dismiss */}
          <button
            onClick={handleDismiss}
            aria-label="Dismiss install prompt"
            className="text-gray-600 hover:text-gray-400 transition-colors text-xl leading-none flex-shrink-0 -mt-0.5"
          >
            &times;
          </button>
        </div>

        {/* Install button — only on platforms with native prompt */}
        {!isIOS && (
          <button
            onClick={handleInstall}
            className="w-full mt-3 px-4 py-2 rounded-lg bg-[#f5a623] text-[#0a1628] text-sm font-semibold hover:bg-[#f5a623]/90 active:scale-[0.98] transition-all"
          >
            Install
          </button>
        )}
      </div>
    </div>
  );
}
