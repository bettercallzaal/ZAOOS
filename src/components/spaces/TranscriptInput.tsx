'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface TranscriptInputProps {
  roomId: string;
  speakerRole?: 'speaker' | 'host' | 'listener_rotated' | 'agent';
  onTranscriptAdded?: (text: string) => void;
}

export function TranscriptInput({ roomId, speakerRole = 'speaker', onTranscriptAdded }: TranscriptInputProps) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [added, setAdded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/fishbowlz/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          speakerFid: user.fid,
          speakerName: user.displayName || user.username || 'Anonymous',
          speakerRole,
          text: text.trim(),
          startedAt: new Date().toISOString(),
          source: 'manual',
        }),
      });

      if (res.ok) {
        setText('');
        setAdded(true);
        onTranscriptAdded?.(text.trim());
        setTimeout(() => setAdded(false), 2000);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type what you said (for the transcript)..."
        className="w-full bg-[#0a1628] border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#f5a623] resize-none disabled:opacity-50 disabled:cursor-not-allowed"
        rows={2}
        maxLength={2000}
        disabled={submitting}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{text.length}/2000</span>
        <button
          type="submit"
          disabled={!text.trim() || submitting}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            added
              ? 'bg-green-600/20 text-green-400 border border-green-600/30'
              : 'bg-[#f5a623] text-[#0a1628] hover:bg-[#d4941f] disabled:opacity-50'
          }`}
        >
          {added ? '✓ Added' : submitting ? 'Adding...' : 'Add to transcript'}
        </button>
      </div>
    </form>
  );
}
