'use client';

import { useRouter, usePathname } from 'next/navigation';

/**
 * Floating back button that appears on any page except /os.
 * Returns to the OS home screen. Only shows when user came from OS.
 */
export function OSBackButton() {
  const router = useRouter();
  const pathname = usePathname();

  // Don't show on OS home or landing page
  if (pathname === '/os' || pathname === '/') return null;

  return (
    <button
      type="button"
      onClick={() => router.push('/os')}
      className="fixed left-3 top-3 z-50 flex items-center gap-1.5 rounded-full bg-[#0a1628]/80 px-3 py-1.5 text-xs text-white/50 backdrop-blur-md transition-colors hover:bg-[#0a1628] hover:text-white/80"
    >
      <span>←</span>
      <span>OS</span>
    </button>
  );
}
