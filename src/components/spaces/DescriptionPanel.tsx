'use client';

import { useState } from 'react';
import { useCallStateHooks } from '@stream-io/video-react-sdk';
import { ConnectionQuality } from './ConnectionQuality';

export function DescriptionPanel() {
  const { useCallCustomData, useParticipantCount } = useCallStateHooks();
  const custom = useCallCustomData();
  const participantCount = useParticipantCount();
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="px-6 py-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-white text-lg font-bold">{(custom as Record<string, string>)?.title || 'Audio Room'}</h2>
          {(custom as Record<string, string>)?.description && (
            <p className="text-gray-400 text-sm mt-1">{(custom as Record<string, string>).description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-gray-400 text-xs">{participantCount}</span>
          </div>
          <ConnectionQuality />
          <button
            onClick={handleShare}
            className="text-gray-400 hover:text-white text-xs px-3 py-1 border border-gray-700 rounded-lg transition-colors"
          >
            {copied ? 'Copied!' : 'Share'}
          </button>
        </div>
      </div>
    </div>
  );
}
