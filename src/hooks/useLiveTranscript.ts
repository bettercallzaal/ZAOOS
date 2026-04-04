'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * useLiveTranscript
 *
 * Uses the browser's Web Speech API (SpeechRecognition) to continuously
 * transcribe audio from HMS peers and POST each phrase to the transcript API.
 *
 * Requires: browser with Web Speech API support (Chrome, Edge — not Safari/Firefox).
 * Falls back gracefully if unavailable.
 */
export function useLiveTranscript(roomId: string, enabled: boolean) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const lastTranscriptRef = useRef<string>('');
  const transcriptCountRef = useRef(0);
  const pendingTextRef = useRef('');
  const segmentStartRef = useRef<string>(new Date().toISOString());

  const postSegment = useCallback(
    async (text: string, speakerName: string, speakerRole: string) => {
      if (!text.trim()) return;

      try {
        await fetch('/api/fishbowlz/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId,
            speakerName,
            speakerRole,
            text: text.trim(),
            startedAt: segmentStartRef.current,
            source: 'manual',
          }),
        });
        transcriptCountRef.current++;
      } catch {
        // Non-critical — transcript will be missing
      }
    },
    [roomId]
  );

  useEffect(() => {
    if (!enabled) return;
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Web Speech API not supported in this browser');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = async (event: any) => {
      const results = Array.from(event.results) as any[];

      for (const result of results) {
        const transcript = (result[0] as any).transcript.trim();
        if (!transcript) continue;

        const isFinal = result.isFinal;

        if (isFinal) {
          // Finalized phrase — post to transcript API
          const fullText = pendingTextRef.current + ' ' + transcript;
          pendingTextRef.current = '';
          segmentStartRef.current = new Date().toISOString();

          // Use generic "Speaker" since Web Speech API doesn't always identify who spoke
          await postSegment(fullText, 'Speaker', 'speaker');
          lastTranscriptRef.current = fullText;
        } else {
          // Interim — accumulate
          pendingTextRef.current = transcript;
        }
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') return;
      console.error('Speech recognition error:', event.error);
    };

    recognition.onend = () => {
      // Restart if still enabled
      if (recognitionRef.current && enabled) {
        try {
          recognition.start();
        } catch {
          // Already running
        }
      }
    };

    recognition.start();

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [enabled, postSegment]);

  return {
    transcriptCount: transcriptCountRef.current,
    isListening: !!recognitionRef.current,
  };
}
