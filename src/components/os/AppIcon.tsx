'use client';

import { useState } from 'react';
import type { AppManifest } from '@/lib/os/types';

interface AppIconProps {
  app: AppManifest;
  isPinned: boolean;
  onOpen: (app: AppManifest) => void;
  onPin: (appId: string) => void;
  onUnpin: (appId: string) => void;
}

export function AppIcon({ app, isPinned, onOpen, onPin, onUnpin }: AppIconProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [pressing, setPressing] = useState(false);
  const longPressRef = { current: null as ReturnType<typeof setTimeout> | null };

  function handlePressStart() {
    setPressing(true);
    longPressRef.current = setTimeout(() => {
      setShowMenu(true);
      setPressing(false);
    }, 500);
  }

  function handlePressEnd() {
    setPressing(false);
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  }

  function handleTap() {
    if (!showMenu) {
      onOpen(app);
    }
  }

  return (
    <div className="relative flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={handleTap}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-2xl transition-transform active:scale-90 sm:h-16 sm:w-16 sm:text-3xl ${
          pressing ? 'scale-95 ring-2 ring-[#f5a623]/50' : ''
        }`}
      >
        {app.icon}
      </button>
      <span className="max-w-16 truncate text-center text-xs text-white/70">{app.name}</span>

      {/* Long-press context menu */}
      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute top-16 z-50 min-w-36 rounded-xl border border-white/10 bg-[#0f1d35] p-1 shadow-xl">
            {isPinned ? (
              <button
                type="button"
                onClick={() => {
                  onUnpin(app.id);
                  setShowMenu(false);
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10"
              >
                Remove from Home
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onPin(app.id);
                  setShowMenu(false);
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10"
              >
                Add to Home
              </button>
            )}
            {app.route && (
              <button
                type="button"
                onClick={() => {
                  onOpen(app);
                  setShowMenu(false);
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10"
              >
                Open
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
