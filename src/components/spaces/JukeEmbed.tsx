'use client';

import { useEffect, useState } from 'react';
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
  /**
   * When true, fetch a Juke partner-SSO JWT from /api/juke/partner-token
   * (requires a signed-in ZAO session) and pass it as ?token=... on the
   * iframe src so the visitor adopts the Juke session without re-running
   * SIWF. Closes the double-sign-in pain. Silently falls back to the no-
   * token embed if the user is not signed in or the mint fails.
   */
  useSsoToken?: boolean;
}

interface PartnerTokenState {
  status: 'idle' | 'loading' | 'ready' | 'skipped';
  token?: string;
}

/**
 * Embeds a Juke live audio space (Path A — hosted iframe, no API keys). Juke
 * renders the whole experience: anonymous listening, Sign In With Farcaster,
 * hand-raise, and mic control. A loading skeleton covers the iframe until it
 * reports `load`. "Powered by Juke" attribution is kept visible per Juke's
 * branding requirements.
 *
 * Partner-SSO bridge: when `useSsoToken` is true, the component blocks the
 * iframe render until either the token mints (~100ms) or the mint fails (then
 * renders un-authed). This means a signed-in ZAO user lands inside the embed
 * already-authenticated, skipping the SIWF QR.
 */
export function JukeEmbed({
  spaceId,
  className,
  audioOff = false,
  useSsoToken = false,
}: JukeEmbedProps) {
  const [loaded, setLoaded] = useState(false);
  const [partnerToken, setPartnerToken] = useState<PartnerTokenState>({
    status: useSsoToken ? 'loading' : 'skipped',
  });

  useEffect(() => {
    if (!useSsoToken) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/juke/partner-token', { cache: 'no-store' });
        if (!res.ok) {
          if (!cancelled) setPartnerToken({ status: 'ready' });
          return;
        }
        const body = (await res.json()) as { ok?: boolean; token?: string };
        if (!cancelled) {
          setPartnerToken({
            status: 'ready',
            token: body?.ok && body.token ? body.token : undefined,
          });
        }
      } catch {
        if (!cancelled) setPartnerToken({ status: 'ready' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [useSsoToken]);

  const waitingForToken = useSsoToken && partnerToken.status === 'loading';

  return (
    <div className={`flex flex-col items-center gap-3 ${className ?? ''}`}>
      <div className="relative aspect-[2/3] min-h-[520px] w-full max-w-[480px]">
        {(!loaded || waitingForToken) && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl bg-[#0d1b2a] text-gray-400"
            aria-hidden="true"
          >
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#f5a623] border-t-transparent" />
            <span className="text-sm">
              {waitingForToken ? 'Signing you in to Juke...' : 'Connecting to Juke...'}
            </span>
          </div>
        )}
        {!waitingForToken && (
          <iframe
            src={jukeEmbedUrl(spaceId, { audioOff, partnerToken: partnerToken.token })}
            title="Juke live audio space"
            allow={audioOff ? 'autoplay' : 'autoplay; microphone'}
            onLoad={() => setLoaded(true)}
            className="h-full w-full rounded-3xl border-0"
          />
        )}
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
