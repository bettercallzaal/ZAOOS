'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const CommandPalette = dynamic(
  () =>
    import('@/components/navigation/CommandPalette').then((m) => ({
      default: m.CommandPalette,
    })),
  { ssr: false },
);

/**
 * Renders a cmdk command palette with Cmd+K binding.
 * Mount once inside the auth layout so it is available on all protected pages.
 *
 * Keyboard shortcuts:
 * - Cmd+K / Ctrl+K: open/close palette
 * - Esc: close palette
 * - Arrow keys: navigate
 * - Enter: select
 */
export function CommandPaletteProvider() {
  const [isOpen, setIsOpen] = useState(false);

  const close = () => setIsOpen(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl+K → toggle command palette
      if (mod && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return <CommandPalette isOpen={isOpen} onClose={close} />;
}
