'use client';

import { usePathname } from 'next/navigation';

/**
 * Hides children when on the /os route.
 * Used to suppress BottomNav, PersistentPlayer, etc.
 * when the OS shell provides its own navigation.
 */
export function HideOnOS({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/os') return null;
  return <>{children}</>;
}
