'use client';

import { useEffect } from 'react';

interface ShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
  /** When false, hide the mic / camera / screen rows because the user has no
   * permission for those capabilities (a stage listener, for example). */
  hasMediaPermissions: boolean;
}

interface Shortcut {
  key: string;
  label: string;
  hint?: string;
}

const MEDIA: Shortcut[] = [
  { key: 'Space', label: 'Mic', hint: 'Tap to toggle. Hold for push-to-talk.' },
  { key: 'C', label: 'Camera' },
  { key: 'S', label: 'Screen share' },
];

const GLOBAL: Shortcut[] = [
  { key: 'H', label: 'Raise / lower hand' },
  { key: '?', label: 'Show this menu' },
  { key: 'Esc', label: 'Close any overlay' },
];

/**
 * Cheatsheet modal listing the room's keyboard shortcuts. Triggered by "?"
 * (handled in useRoomKeyboardShortcuts) or any UI link the host wants to
 * surface. Mirrors the Zoom + Meet cheatsheet pattern so the bindings feel
 * discoverable without forcing a tour on every session.
 */
export function ShortcutsHelp({ open, onClose, hasMediaPermissions }: ShortcutsHelpProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[58] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-0 sm:px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      onClick={onClose}
    >
      <div
        className="bg-[#0d1b2a] border border-white/[0.08] rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 id="shortcuts-title" className="text-white text-lg font-bold">
            Keyboard shortcuts
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close shortcuts"
            className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {hasMediaPermissions && (
          <section className="mb-4">
            <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-2">
              Media
            </h3>
            <ul className="space-y-1.5">
              {MEDIA.map((s) => (
                <ShortcutRow key={s.key} shortcut={s} />
              ))}
            </ul>
          </section>
        )}

        <section>
          <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-2">
            Room
          </h3>
          <ul className="space-y-1.5">
            {GLOBAL.map((s) => (
              <ShortcutRow key={s.key} shortcut={s} />
            ))}
          </ul>
        </section>

        <p className="mt-5 text-gray-600 text-xs leading-relaxed">
          Shortcuts are off while typing in chat. Press <kbd className="px-1 rounded bg-[#1a2a3a] text-gray-300 text-[10px] font-mono">?</kbd> in the room any time to reopen this.
        </p>
      </div>
    </div>
  );
}

function ShortcutRow({ shortcut }: { shortcut: Shortcut }) {
  return (
    <li className="flex items-start justify-between gap-3 py-1.5 px-3 rounded-lg bg-[#0a1628] border border-white/[0.04]">
      <div className="min-w-0">
        <p className="text-white text-sm font-semibold">{shortcut.label}</p>
        {shortcut.hint && (
          <p className="text-gray-500 text-xs leading-snug">{shortcut.hint}</p>
        )}
      </div>
      <kbd className="flex-shrink-0 inline-flex items-center justify-center min-w-[2.25rem] px-2 py-1 rounded-md bg-[#1a2a3a] border border-white/[0.08] text-gray-200 text-[11px] font-mono font-semibold">
        {shortcut.key}
      </kbd>
    </li>
  );
}
