'use client';

import { useEffect, useRef, useState } from 'react';
import { useCall, useCallStateHooks, OwnCapability } from '@stream-io/video-react-sdk';

/**
 * Listener-side promotion confirm. Fires when the host grants SEND_AUDIO (or
 * SEND_VIDEO / SCREEN_SHARE) to the current user — Stream owns the underlying
 * permission state, this UI gives the listener a 5-second window to either
 * "Go on stage" (accept + auto-unmute mic) or "Stay as listener" (the host's
 * grant remains, but the mic stays off).
 *
 * Why veto matters: Clubhouse auto-promoted with no listener consent and the
 * "I wasn't ready to speak" complaint was one of the loudest in the post-
 * mortem. The 5s countdown auto-accepts, so the silent path still lands a
 * speaker on stage if they just walk away from the screen.
 *
 * Detection: subscribes to `useOwnCapabilities()`. When the set goes from
 * "missing SEND_AUDIO" to "has SEND_AUDIO" (or video / screen-share), the
 * dialog opens once and remembers the granted set so it does not re-open
 * for the same grant on rerenders.
 */
export function PromotionConfirm() {
  const call = useCall();
  const { useOwnCapabilities } = useCallStateHooks();
  const ownCapabilities = useOwnCapabilities();

  const [open, setOpen] = useState(false);
  const [countdown, setCountdown] = useState(5);
  // Stable set so re-entering an already-acknowledged capability does not
  // re-pop the dialog after the user dismissed it.
  const lastSeenSet = useRef<Set<string>>(new Set());
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Detect new grants and open the dialog.
  useEffect(() => {
    const current = new Set(ownCapabilities ?? []);
    const newlyGranted = [...current].some((cap) => !lastSeenSet.current.has(cap));
    const wantedNew = [
      OwnCapability.SEND_AUDIO,
      OwnCapability.SEND_VIDEO,
      OwnCapability.SCREENSHARE,
    ].some((cap) => current.has(cap) && !lastSeenSet.current.has(cap));

    if (newlyGranted && wantedNew) {
      setOpen(true);
      setCountdown(5);
    }
    lastSeenSet.current = current;
  }, [ownCapabilities]);

  // Countdown to auto-accept.
  useEffect(() => {
    if (!open) return;
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleAccept();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleStay();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleAccept() {
    setOpen(false);
    if (timerRef.current) clearInterval(timerRef.current);
    // Best-effort. Stream raises if the SDK is mid-disconnect; harmless.
    await call?.microphone?.enable().catch(() => {});
  }

  function handleStay() {
    setOpen(false);
    if (timerRef.current) clearInterval(timerRef.current);
    // Intentionally leaves the underlying SDK permission set unchanged. The
    // listener can flip the mic on later via the controls panel.
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[59] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-0 sm:px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="promotion-title"
    >
      <div className="bg-[#0d1b2a] border border-[#f5a623]/30 rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md shadow-xl shadow-[#f5a623]/10">
        <div className="mb-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f5a623]/10 border border-[#f5a623]/30 text-[#f5a623] text-[10px] font-bold tracking-wider uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f5a623] animate-pulse" aria-hidden="true" />
          Host promoted you
        </div>
        <h2 id="promotion-title" className="text-white text-lg font-bold mt-2 mb-1">
          You can speak now
        </h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-5">
          Tap <span className="text-white font-semibold">Go on stage</span> to unmute, or stay as a listener. Auto-accepts in {countdown}s.
        </p>

        <div className="grid grid-cols-2 gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={handleStay}
            className="px-4 py-2.5 rounded-xl border border-white/[0.08] bg-[#1a2a3a] text-gray-300 text-sm font-semibold hover:bg-[#22364a] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5a623]"
          >
            Stay as listener
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="px-4 py-2.5 rounded-xl bg-[#f5a623] hover:bg-[#ffd700] text-[#0a1628] text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Go on stage ({countdown})
          </button>
        </div>
      </div>
    </div>
  );
}
