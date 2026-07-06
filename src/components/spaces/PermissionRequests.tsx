'use client';

import { type PermissionRequestEvent, useCall } from '@stream-io/video-react-sdk';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';

/**
 * Host-only banner that surfaces inbound capability requests from listeners.
 * Stream fires `call.permission_request` whenever a listener taps "request
 * mic" / "request camera" / "request screen share" inside the room. The host
 * grants or denies inline.
 *
 * Patterns lifted from the audio-room research:
 *
 * - Show the requester's pfp + display name, not just the user id, so the
 *   host can recognise people at a glance (Discord Stage moderation default).
 * - Surface the SPECIFIC capability ("camera", "mic", "screen share") rather
 *   than the generic "wants to speak" — Video Rooms can mix all three.
 * - aria-live=polite so screen readers announce new requests.
 * - Allow + Deny are distinguished by both colour AND icon (WCAG, classroom-
 *   kit research) — not colour alone.
 */
export function PermissionRequests() {
  const call = useCall();
  const [requests, setRequests] = useState<PermissionRequestEvent[]>([]);

  useEffect(() => {
    if (!call) return;
    const unsub = call.on('call.permission_request', (event) => {
      setRequests((prev) => [...prev, event as PermissionRequestEvent]);
    });
    return unsub;
  }, [call]);

  const removeRequest = useCallback((userId: string) => {
    setRequests((prev) => prev.filter((r) => r.user.id !== userId));
  }, []);

  const handleGrant = useCallback(
    async (request: PermissionRequestEvent) => {
      await call?.grantPermissions(request.user.id, request.permissions);
      removeRequest(request.user.id);
    },
    [call, removeRequest],
  );

  const handleDeny = useCallback(
    (request: PermissionRequestEvent) => {
      removeRequest(request.user.id);
    },
    [removeRequest],
  );

  if (requests.length === 0) return null;

  return (
    <div
      className="px-4 py-2 border-b border-white/[0.08] bg-[#0d1b2a]/60"
      aria-live="polite"
      aria-label={`${requests.length} pending permission ${requests.length === 1 ? 'request' : 'requests'}`}
    >
      <ul className="space-y-1.5">
        {requests.map((request) => (
          <li key={request.user.id} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              {request.user.image ? (
                <Image
                  src={request.user.image}
                  alt={request.user.name || request.user.id}
                  width={28}
                  height={28}
                  className="w-7 h-7 rounded-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                  {(request.user.name || request.user.id || '?')[0]?.toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-white text-sm font-semibold truncate">
                  {request.user.name || request.user.id}
                </p>
                <p className="text-gray-500 text-xs truncate">
                  wants {humanizePermissions(request.permissions)}
                </p>
              </div>
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => handleGrant(request)}
                aria-label={`Allow ${request.user.name || request.user.id}`}
                className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-green-600/15 border border-green-600/30 text-green-400 rounded-lg hover:bg-green-600/25 transition-colors font-semibold"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Allow
              </button>
              <button
                type="button"
                onClick={() => handleDeny(request)}
                aria-label={`Deny ${request.user.name || request.user.id}`}
                className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-red-600/15 border border-red-600/30 text-red-400 rounded-lg hover:bg-red-600/25 transition-colors font-semibold"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Deny
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Translate Stream's permission ids into human copy. Stream uses constants
 * like "send-audio", "send-video", "screenshare". Anything we do not
 * recognise falls back to "to speak" so the host always sees something.
 */
function humanizePermissions(permissions: string[]): string {
  const parts: string[] = [];
  const has = (needle: string) => permissions.some((p) => p.toLowerCase().includes(needle));
  if (has('audio') || has('mic')) parts.push('mic');
  if (has('video') || has('cam')) parts.push('camera');
  if (has('screen')) parts.push('screen share');
  if (parts.length === 0) return 'to speak';
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} + ${parts[1]}`;
  return parts.slice(0, -1).join(', ') + ', and ' + parts[parts.length - 1];
}
