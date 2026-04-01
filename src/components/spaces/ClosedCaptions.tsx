'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useCall } from '@stream-io/video-react-sdk';

interface CaptionEntry {
  id: string;
  speakerName: string;
  text: string;
  timestamp: number;
}

export function ClosedCaptions() {
  const call = useCall();
  const [captions, setCaptions] = useState<CaptionEntry[]>([]);
  const nextId = useRef(0);

  const addCaption = useCallback((speakerName: string, text: string) => {
    const id = `cc-${nextId.current++}`;
    setCaptions((prev) => [...prev.slice(-4), { id, speakerName, text, timestamp: Date.now() }]);
  }, []);

  // Listen for closed caption events from Stream
  useEffect(() => {
    if (!call) return;

    const unsubscribe = call.on('call.closed_caption', (event: unknown) => {
      const evt = event as {
        closed_caption?: { speaker_name?: string; text?: string };
      };
      const caption = evt.closed_caption;
      if (caption?.text) {
        addCaption(caption.speaker_name ?? 'Speaker', caption.text);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [call, addCaption]);

  // Fade out captions after 5 seconds
  useEffect(() => {
    if (captions.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setCaptions((prev) => prev.filter((c) => now - c.timestamp < 5000));
    }, 500);

    return () => clearInterval(interval);
  }, [captions.length]);

  if (captions.length === 0) return null;

  return (
    <div className="absolute bottom-4 left-4 right-4 flex flex-col items-center gap-1.5 pointer-events-none z-10">
      {captions.map((caption) => {
        const age = Date.now() - caption.timestamp;
        const opacity = age > 4000 ? Math.max(0, 1 - (age - 4000) / 1000) : 1;

        return (
          <div
            key={caption.id}
            className="bg-black/70 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-lg max-w-lg text-center transition-opacity"
            style={{ opacity }}
          >
            <span className="font-semibold text-[#f5a623] mr-1.5">{caption.speakerName}:</span>
            <span>{caption.text}</span>
          </div>
        );
      })}
    </div>
  );
}
