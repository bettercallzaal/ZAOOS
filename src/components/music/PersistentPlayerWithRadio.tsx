'use client';

import { useRadio } from '@/hooks/useRadio';
import { PersistentPlayer } from './PersistentPlayer';

/**
 * Client wrapper that connects PersistentPlayer to the radio hook
 * for prev/next track navigation across all authenticated pages.
 */
export function PersistentPlayerWithRadio() {
  const radio = useRadio();

  return (
    <PersistentPlayer
      onPrev={radio.isRadioMode ? radio.prevRadioTrack : undefined}
      onNext={radio.isRadioMode ? radio.nextRadioTrack : undefined}
    />
  );
}
