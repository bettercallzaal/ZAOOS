'use client';

import { useCallStateHooks } from '@stream-io/video-react-sdk';
import { useEffect, useRef, useState } from 'react';

/**
 * One-time confirmation toast that fires the first time the user unmutes in
 * a room session. Pattern lifted from Zoom + Google Meet - the "mic is live"
 * confirmation closes the "did my mic actually work" doubt loop documented
 * in the Clubhouse + Twitter Spaces audio-room postmortems.
 *
 * Renders nothing on initial mount (so an already-unmuted host does not get
 * a phantom toast on join). Tracks the prior `isMute` value via a ref and
 * fires only on the off-to-on transition.
 *
 * Auto-dismisses after 3 seconds. Shows once per session - we do not
 * persist across reloads, the gap is "first unmute of this session" not
 * "first ever."
 */
export function MicLiveToast() {
  const { useMicrophoneState } = useCallStateHooks();
  const { isMute } = useMicrophoneState();
  const wasMuteRef = useRef<boolean | null>(null);
  const hasShownRef = useRef(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // First mount - record current state and skip.
    if (wasMuteRef.current === null) {
      wasMuteRef.current = isMute;
      return;
    }
    const transitionedToLive = wasMuteRef.current === true && isMute === false;
    wasMuteRef.current = isMute;

    if (!transitionedToLive || hasShownRef.current) return;
    hasShownRef.current = true;
    setShow(true);
    const t = setTimeout(() => setShow(false), 3000);
    return () => clearTimeout(t);
  }, [isMute]);

  if (!show) return null;

  return (
    <div
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[57] pointer-events-none"
      aria-live="polite"
    >
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/15 border border-green-500/40 text-green-300 text-sm font-semibold backdrop-blur-md shadow-lg shadow-green-500/10">
        <span className="relative flex h-2 w-2" aria-hidden="true">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        Your mic is live - say something
      </div>
    </div>
  );
}
