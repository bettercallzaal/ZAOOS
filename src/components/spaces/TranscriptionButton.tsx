'use client';

import { useState } from 'react';
import { useCall } from '@stream-io/video-react-sdk';

interface TranscriptionButtonProps {
  isHost: boolean;
}

export function TranscriptionButton({ isHost }: TranscriptionButtonProps) {
  const call = useCall();
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isHost) return null;

  const handleToggle = async () => {
    if (!call || isLoading) return;
    setIsLoading(true);

    try {
      if (isActive) {
        await Promise.allSettled([
          call.stopTranscription(),
          call.stopClosedCaptions(),
        ]);
        setIsActive(false);
      } else {
        await Promise.allSettled([
          call.startTranscription(),
          call.startClosedCaptions(),
        ]);
        setIsActive(true);
      }
    } catch {
      // Silently handle — button state stays unchanged on error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`p-2.5 rounded-xl text-sm transition-colors border ${
        isActive
          ? 'bg-[#f5a623]/15 border-[#f5a623]/30 text-[#f5a623]'
          : 'bg-[#1a2a3a] text-gray-400 hover:text-white border-gray-700/50 hover:border-gray-600'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={isActive ? 'Stop captions & transcription' : 'Start captions & transcription'}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    </button>
  );
}
