'use client';

import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk';

export function LiveButton() {
  const call = useCall();
  const { useIsCallLive } = useCallStateHooks();
  const isLive = useIsCallLive();

  return (
    <button
      onClick={() => (isLive ? call?.stopLive() : call?.goLive())}
      className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 ${
        isLive
          ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30'
          : 'bg-emerald-600 text-white hover:bg-emerald-500'
      }`}
    >
      {isLive && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
      )}
      {isLive ? 'End Live' : 'Go Live'}
    </button>
  );
}
