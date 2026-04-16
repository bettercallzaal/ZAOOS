'use client';

import { useEffect } from 'react';

interface ShortcutHandlers {
  onSearch?: () => void;
  onFocusCompose?: () => void;
  onClosePanels?: () => void;
  onToggleSidebar?: () => void;
  onToggleMusic?: () => void;
  onShowHelp?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Cmd/Ctrl+K → open search (works even in inputs)
      if (mod && e.key === 'k') {
        e.preventDefault();
        handlers.onSearch?.();
        return;
      }

      // Escape → close panels (works everywhere)
      if (e.key === 'Escape') {
        handlers.onClosePanels?.();
        return;
      }

      // Don't trigger these shortcuts when typing
      if (isInput) return;

      // / → focus compose bar
      if (e.key === '/') {
        e.preventDefault();
        handlers.onFocusCompose?.();
        return;
      }

      // Cmd/Ctrl+B → toggle sidebar
      if (mod && e.key === 'b') {
        e.preventDefault();
        handlers.onToggleSidebar?.();
        return;
      }

      // M → toggle music sidebar
      if (e.key === 'm') {
        e.preventDefault();
        handlers.onToggleMusic?.();
        return;
      }

      // ? → show help/shortcuts
      if (e.key === '?') {
        e.preventDefault();
        handlers.onShowHelp?.();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}
