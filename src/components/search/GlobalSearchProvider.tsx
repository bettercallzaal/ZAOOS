'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const GlobalSearch = dynamic(
  () => import('@/components/search/GlobalSearch').then((m) => ({ default: m.GlobalSearch })),
  { ssr: false },
);

/**
 * Renders a global Cmd+K search overlay.
 * Mount once inside the auth layout so it is available on all protected pages.
 */
export function GlobalSearchProvider() {
  const [isOpen, setIsOpen] = useState(false);

  const close = () => setIsOpen(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return <GlobalSearch isOpen={isOpen} onClose={close} />;
}
