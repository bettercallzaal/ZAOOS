'use client';

import { useRadioContext as useRadio } from '@/providers/audio/RadioProvider';
import { PersistentPlayer } from './PersistentPlayer';

/**
 * Client wrapper that connects PersistentPlayer prev/next to the
 * shared radio context. Auto-advance is handled in RadioProvider.
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
