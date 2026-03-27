'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCall, type PermissionRequestEvent } from '@stream-io/video-react-sdk';

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

  const handleGrant = useCallback(
    async (request: PermissionRequestEvent) => {
      await call?.grantPermissions(request.user.id, request.permissions);
      setRequests((prev) => prev.filter((r) => r.user.id !== request.user.id));
    },
    [call]
  );

  const handleDeny = useCallback(
    (request: PermissionRequestEvent) => {
      setRequests((prev) => prev.filter((r) => r.user.id !== request.user.id));
    },
    []
  );

  if (requests.length === 0) return null;

  return (
    <div className="px-4 py-2 border-b border-gray-800">
      {requests.map((request) => (
        <div key={request.user.id} className="flex items-center justify-between py-1.5">
          <span className="text-gray-300 text-sm">
            <strong>{request.user.name || request.user.id}</strong> wants to speak
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handleGrant(request)}
              className="text-xs px-3 py-1 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30"
            >
              Allow
            </button>
            <button
              onClick={() => handleDeny(request)}
              className="text-xs px-3 py-1 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30"
            >
              Deny
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
