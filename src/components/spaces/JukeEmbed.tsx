'use client';

import { useState } from 'react';
import { JUKE_EMBED_ORIGIN, jukeEmbedUrl } from '@/lib/spaces/juke';

interface JukeEmbedProps {
  /**
   * Juke space id. The caller MUST validate this with `isValidJukeSpaceId`
   * (and 404 on failure) before rendering — `jukeEmbedUrl` throws otherwise.
   */
  spaceId: string;
  /** Optional extra classes for the outer wrapper. */
  className?: string;
  /**
   * Passive second-screen mode. Renders the same Juke UI but with
   * `?audio=off`, so the embed never connects audio — use when the user is
   * already in the Juke iOS app and the laptop should not double-broadcast.
   */
  audioOff?: boolean;
}

/**
 * Embeds a Juke live audio space (Path A of doc 695 — hosted iframe, no API
 * keys). Juke renders the whole experience: anonymous listening, Sign In With
 * Farcaster, hand-raise, and mic control. A loading skeleton covers the iframe
 * until it reports `load`. "Powered by Juke" attribution is kept visible per
 * Juke's branding requirements.
 */
export function JukeEmbed({ spaceId, className, audioOff = false }: JukeEmbedProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={`flex flex-col items-center gap-3 ${className ?? ''}`}>
      <div className="relative aspect-[2/3] min-h-[520px] w-full max-w-[480px]">
        {!loaded && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl bg-[#0d1b2a] text-gray-400"
            aria-hidden="true"
          >
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#f5a623] border-t-transparent" />
            <span className="text-sm">Connecting to Juke...</span>
          </div>
        )}
        <iframe
          src={jukeEmbedUrl(spaceId, { audioOff })}
          title="Juke live audio space"
          allow={audioOff ? 'autoplay' : 'autoplay; microphone'}
          onLoad={() => setLoaded(true)}
          className="h-full w-full rounded-3xl border-0"
        />
      </div>
      <a
        href={JUKE_EMBED_ORIGIN}
        target="_blank"
        rel="noreferrer noopener"
        className="text-xs text-gray-500 transition-colors hover:text-[#f5a623]"
      >
        Powered by Juke
      </a>
    </div>
  );
}
