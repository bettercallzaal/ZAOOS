'use client';

import { useState } from 'react';

/**
 * Lens Protocol auth hook — STUB until @lens-protocol packages are installed (Sprint 7).
 * See docs/superpowers/specs/2026-03-23-cross-platform-distribution-design.md for full spec.
 */
export function useLensAuth() {
  const [state] = useState({
    isConnecting: false,
    error: null as string | null,
    connectedHandle: null as string | null,
  });

  const connect = async () => {
    // Lens packages not yet installed — this is Sprint 7 work
    console.warn('[Lens] @lens-protocol packages not yet installed. See Sprint 7 plan.');
  };

  return { ...state, connect, walletAddress: undefined as string | undefined };
}
