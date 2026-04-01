'use client';

import { useState, useCallback } from 'react';
import { useCallStateHooks, useCall, OwnCapability } from '@stream-io/video-react-sdk';

export function NoiseCancelButton() {
  const call = useCall();
  const { useHasPermissions } = useCallStateHooks();
  const hasPermission = useHasPermissions(OwnCapability.ENABLE_NOISE_CANCELLATION);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  const toggle = useCallback(async () => {
    if (!call || loading) return;
    setLoading(true);
    try {
      if (enabled) {
        await call.microphone.disableNoiseCancellation();
        setEnabled(false);
      } else {
        // Dynamically import the audio-filters package — may not be installed
        const { NoiseCancellation } = await import('@stream-io/audio-filters-web');
        const nc = new NoiseCancellation();
        await call.microphone.enableNoiseCancellation(nc);
        setEnabled(true);
      }
    } catch (err) {
      console.warn('[NoiseCancelButton] Noise cancellation unavailable:', err);
      setUnavailable(true);
    } finally {
      setLoading(false);
    }
  }, [call, enabled, loading]);

  if (!hasPermission || unavailable) return null;

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center gap-1.5 ${
        enabled
          ? 'bg-blue-600 text-white hover:bg-blue-500'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      } disabled:opacity-50`}
      title={enabled ? 'Disable noise cancellation' : 'Enable noise cancellation'}
    >
      <NoiseCancelIcon active={enabled} />
      {loading ? 'Loading...' : enabled ? 'NC On' : 'NC'}
    </button>
  );
}

function NoiseCancelIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 14.959V9.04C2 8.466 2.448 8 3 8h3.586a.98.98 0 0 0 .707-.305l3-3.388C10.923 3.627 12 4.068 12 5.003v13.995c0 .934-1.077 1.375-1.707.695l-3-3.388A.98.98 0 0 0 6.586 16H3c-.552 0-1-.466-1-1.041Z" />
        <path d="M16 9s1.5 1 1.5 3-1.5 3-1.5 3" />
        <path d="M19.5 6.5S22 8.5 22 12s-2.5 5.5-2.5 5.5" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 14.959V9.04C2 8.466 2.448 8 3 8h3.586a.98.98 0 0 0 .707-.305l3-3.388C10.923 3.627 12 4.068 12 5.003v13.995c0 .934-1.077 1.375-1.707.695l-3-3.388A.98.98 0 0 0 6.586 16H3c-.552 0-1-.466-1-1.041Z" />
      <line x1="16" y1="9" x2="22" y2="15" />
      <line x1="22" y1="9" x2="16" y2="15" />
    </svg>
  );
}
