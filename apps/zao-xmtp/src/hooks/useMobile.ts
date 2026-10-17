'use client';

// Ported from ZAOOS src/hooks/useMobile.ts (bettercallzaal/ZAOOS, MIT) on 2026-10-17. Code unchanged; comment em dashes became hyphens.

import { useEffect, useState } from 'react';

export function useMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);

  return isMobile;
}
