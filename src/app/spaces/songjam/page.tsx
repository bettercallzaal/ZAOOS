import type { Metadata } from 'next';
import Link from 'next/link';
import { communityConfig } from '@/../community.config';
import {
  SONGJAM_IFRAME_ALLOW,
  SONGJAM_IFRAME_SANDBOX,
  SONGJAM_SPACE_DESCRIPTION,
  SONGJAM_SPACE_LABEL,
  SONGJAM_SPACE_URL,
} from '@/lib/spaces/songjam';

export const metadata: Metadata = {
  title: `${SONGJAM_SPACE_LABEL} - ${communityConfig.name}`,
  description: SONGJAM_SPACE_DESCRIPTION,
  robots: { index: false },
};

/**
 * /spaces/songjam — the $ZABAL live audio space, hosted on Songjam, embedded as
 * a branded full-page window. A "type" of room you can open alongside the
 * native ZAO Stream/100ms rooms and the Juke embed. Hosting and joining happen
 * inside Songjam's own UI (sign in with Farcaster in the iframe).
 */
export default function SongjamSpacePage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#0a1628]">
      <header className="border-b border-white/[0.08] bg-[#0d1b2a]">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link
            href="/spaces"
            aria-label="Back to Spaces"
            className="rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-800 hover:text-[#f5a623]"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-sm font-bold text-white sm:text-base">
                {SONGJAM_SPACE_LABEL}
              </h1>
              <span className="rounded-full bg-[#22d3ee]/15 px-2 py-0.5 text-[10px] font-semibold text-[#22d3ee]">
                Songjam
              </span>
            </div>
            <p className="truncate text-xs text-gray-500">{SONGJAM_SPACE_DESCRIPTION}</p>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <iframe
          src={SONGJAM_SPACE_URL}
          title={SONGJAM_SPACE_LABEL}
          className="h-full min-h-[calc(100dvh-61px)] w-full border-0"
          allow={SONGJAM_IFRAME_ALLOW}
          sandbox={SONGJAM_IFRAME_SANDBOX}
        />
      </main>
    </div>
  );
}
