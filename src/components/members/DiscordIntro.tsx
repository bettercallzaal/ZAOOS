'use client';

import { useState, useEffect } from 'react';

interface DiscordIntroData {
  discordId: string;
  discordUsername: string;
  introText: string;
  postedAt: string;
}

/**
 * Render basic markdown-ish formatting: **bold** and newlines.
 */
function formatIntroText(text: string) {
  // Split into segments by **bold** markers
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="text-white font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    // Convert newlines to <br />
    const lines = part.split('\n');
    return lines.map((line, j) => (
      <span key={`${i}-${j}`}>
        {j > 0 && <br />}
        {line}
      </span>
    ));
  });
}

export default function DiscordIntro({ discordId }: { discordId: string }) {
  const [intro, setIntro] = useState<DiscordIntroData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!discordId) {
      setLoading(false);
      return;
    }

    fetch(`/api/discord/intros?discord_id=${encodeURIComponent(discordId)}`)
      .then((r) => r.json())
      .then((data) => {
        setIntro(data.intro || null);
      })
      .catch(() => {
        // Silently fail — component just won't render
        setIntro(null);
      })
      .finally(() => setLoading(false));
  }, [discordId]);

  // Graceful fallback: show nothing if no intro or still loading
  if (loading || !intro) return null;

  const postedDate = new Date(intro.postedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="bg-[#0d1b2a] rounded-xl border border-gray-800 p-4 mb-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        {/* Discord icon */}
        <svg
          className="w-4 h-4 text-[#5865F2] flex-shrink-0"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
        <p className="text-xs text-gray-500 uppercase tracking-wider">Discord Intro</p>
        <span className="px-2 py-0.5 rounded-full bg-[#5865F2]/10 text-[#5865F2] text-[9px] font-medium">
          #{intro.discordUsername || 'member'}
        </span>
      </div>

      {/* Intro text */}
      <div className="text-sm text-gray-400 leading-relaxed whitespace-pre-line">
        {formatIntroText(intro.introText)}
      </div>

      {/* Footer with date */}
      <div className="mt-3 pt-2 border-t border-gray-800/50">
        <p className="text-[10px] text-gray-600">
          Introduced on {postedDate}
        </p>
      </div>
    </div>
  );
}
