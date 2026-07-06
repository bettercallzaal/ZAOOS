/**
 * Keyboard shortcuts for ZAO Spaces rooms. Standard bindings borrowed from
 * Zoom + Google Meet + Discord so first-timers do not need to learn ours:
 *
 *   Space  -  toggle mic (push-to-talk if held; toggle on quick tap)
 *   C      -  toggle camera
 *   S      -  toggle screen share
 *   H      -  raise / lower hand (fires the supplied onToggleHand callback)
 *   ?      -  shouldShowHelp toggles via the supplied onToggleHelp callback
 *
 * Disabled while the user is typing in an input / textarea / contenteditable
 * (matches Zoom + Meet behaviour - otherwise typing "c" in chat would kill
 * the camera).
 *
 * Stream.io owns the actual mic/camera/screen-share state. The hook reads
 * useCall() and dispatches to call.microphone / call.camera / call.screenShare.
 * Hand-raise lives in our own Supabase table - the caller passes the toggle.
 */

import { useCall } from '@stream-io/video-react-sdk';
import { useEffect, useRef } from 'react';

const PUSH_TO_TALK_HOLD_MS = 250;

interface UseRoomKeyboardShortcutsOptions {
  /** Toggle the user's hand-raise state. Skipped when undefined. */
  onToggleHand?: () => void;
  /** Toggle the shortcuts-help overlay. Bound to "?". Skipped when undefined. */
  onToggleHelp?: () => void;
  /** Default true. Set false on stages where the listener has no mic. */
  enableMic?: boolean;
  /** Default true. Set false on stages where the listener has no camera. */
  enableCamera?: boolean;
  /** Default true. Set false where screen-share is not allowed. */
  enableScreen?: boolean;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

export function useRoomKeyboardShortcuts(options: UseRoomKeyboardShortcutsOptions = {}) {
  const call = useCall();
  const {
    onToggleHand,
    onToggleHelp,
    enableMic = true,
    enableCamera = true,
    enableScreen = true,
  } = options;

  // Space-held push-to-talk: remember the press time so a short tap toggles
  // and a long hold unmutes only while held.
  const spaceDownAtRef = useRef<number | null>(null);
  const spaceHeldRef = useRef(false);

  useEffect(() => {
    if (!call) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;

      if (e.code === 'Space' && enableMic) {
        if (e.repeat) {
          // First real held-down repeat - flip to push-to-talk mode.
          if (!spaceHeldRef.current && spaceDownAtRef.current !== null) {
            const heldFor = performance.now() - spaceDownAtRef.current;
            if (heldFor >= PUSH_TO_TALK_HOLD_MS) {
              spaceHeldRef.current = true;
              call?.microphone?.enable().catch(() => {});
            }
          }
          e.preventDefault();
          return;
        }
        if (spaceDownAtRef.current === null) {
          spaceDownAtRef.current = performance.now();
        }
        e.preventDefault();
        return;
      }

      const key = e.key.toLowerCase();
      if (key === 'c' && enableCamera) {
        e.preventDefault();
        call?.camera?.toggle().catch(() => {});
        return;
      }
      if (key === 's' && enableScreen) {
        e.preventDefault();
        call?.screenShare?.toggle().catch(() => {});
        return;
      }
      if (key === 'h' && onToggleHand) {
        e.preventDefault();
        onToggleHand();
        return;
      }
      if (key === '?' && onToggleHelp) {
        e.preventDefault();
        onToggleHelp();
        return;
      }
    }

    function onKeyUp(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;
      if (e.code !== 'Space' || !enableMic) return;
      e.preventDefault();
      const downAt = spaceDownAtRef.current;
      const wasHeld = spaceHeldRef.current;
      spaceDownAtRef.current = null;
      spaceHeldRef.current = false;
      if (wasHeld) {
        // Push-to-talk release - mute again.
        call?.microphone?.disable().catch(() => {});
        return;
      }
      if (downAt !== null) {
        const heldFor = performance.now() - downAt;
        if (heldFor < PUSH_TO_TALK_HOLD_MS) {
          // Short tap - treat as toggle.
          call?.microphone?.toggle().catch(() => {});
        }
      }
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [call, enableMic, enableCamera, enableScreen, onToggleHand, onToggleHelp]);
}
