import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSessionData } from '@/lib/auth/session';
import { EndJukeSpaceButton } from '@/components/spaces/EndJukeSpaceButton';
import { JukeEmbed } from '@/components/spaces/JukeEmbed';
import { JukeListenerBadge } from '@/components/spaces/JukeListenerBadge';
import {
  isValidJukeSpaceId,
  jukeAppDeeplinkUrl,
  jukeSpaceOgImageUrl,
  jukeSpaceUrl,
} from '@/lib/spaces/juke';
import { getJukeSpace, type JukeSpaceRow } from '@/lib/spaces/jukeSpacesDb';
import { communityConfig } from '../../../../community.config';

interface LivePageProps {
  params: Promise<{ spaceId: string }>;
  searchParams: Promise<{ audio?: string }>;
}

/**
 * Try to read the persisted Juke space row. The page degrades gracefully if
 * the row is missing — anyone can still open `/live/{validId}` and listen
 * via the iframe even if our DB never saw the create event.
 */
async function safeGetJukeSpace(id: string): Promise<JukeSpaceRow | null> {
  try {
    return await getJukeSpace(id);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: LivePageProps): Promise<Metadata> {
  const { spaceId } = await params;
  if (!isValidJukeSpaceId(spaceId)) {
    return { title: `Live Audio - ${communityConfig.name}` };
  }
  const row = await safeGetJukeSpace(spaceId);
  const title = row?.title ? `${row.title} - Live on ${communityConfig.name}` : `Live Audio - ${communityConfig.name}`;
  const ogImage = jukeSpaceOgImageUrl(spaceId);
  return {
    title,
    description: `Listen in to a live audio space on Juke, the Farcaster-native audio app.`,
    robots: { index: false },
    openGraph: {
      title,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      images: [ogImage],
    },
  };
}

/**
 * /live/[spaceId] — a Juke live audio space embedded in ZAO OS.
 *
 * Path A of doc 695 (Juke integration). The space is created and hosted on
 * Juke; this route is a thin, brandable window onto it. Anyone with the
 * space link can open `/live/{spaceId}`; listening is anonymous, and
 * participating prompts Sign In With Farcaster inside the Juke iframe.
 *
 * Query params:
 *   ?audio=off  Renders the embed in passive second-screen mode (no audio
 *               connection). Use when the user is already listening via the
 *               Juke iOS app and the laptop should not double-broadcast.
 */
export default async function LivePage({ params, searchParams }: LivePageProps) {
  const { spaceId } = await params;
  const { audio } = await searchParams;

  // Untrusted path segment — reject anything that is not a Juke space id
  // before it can reach the embed URL.
  if (!isValidJukeSpaceId(spaceId)) {
    notFound();
  }

  const [row, session] = await Promise.all([safeGetJukeSpace(spaceId), getSessionData()]);
  const audioOff = audio === 'off';
  const isEnded = row?.status === 'ended';
  const recordingUrl = row?.recording_url ?? null;
  // Host-or-admin gate for the End space button. Iframe Leave is participant-
  // only (LiveKit disconnect, no API hit), so without this the room stays
  // ACTIVE in our DB forever; the button calls our admin endpoint that proxies
  // to Juke's new POST /v1/developer/spaces/{id}/end (Nicky PR #174).
  const canEnd = Boolean(
    !isEnded &&
      row?.created_by_fid &&
      session?.fid &&
      (session.isAdmin || row.created_by_fid === session.fid),
  );

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#0a1628]">
      <header className="border-b border-white/[0.08] bg-[#0d1b2a]">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link
            href="/"
            aria-label="Back home"
            className="rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-800 hover:text-[#f5a623]"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold text-white sm:text-base">
              {row?.title ?? 'Live Audio'}
            </h1>
            <p className="truncate text-xs text-gray-500">
              {row?.status === 'active'
                ? 'Live on Juke'
                : row?.status === 'scheduled'
                  ? 'Scheduled - opening soon'
                  : isEnded
                    ? 'Ended'
                    : 'Powered by Juke'}
              {typeof row?.participant_count === 'number' && row.participant_count > 0 && (
                <>
                  {' - '}
                  {row.participant_count} {row.participant_count === 1 ? 'listener' : 'listeners'}
                </>
              )}
            </p>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center px-4 py-6 gap-4">
        {!isEnded && (
          <JukeListenerBadge
            participants={row?.participants}
            participantCount={row?.participant_count ?? 0}
          />
        )}
        {isEnded && recordingUrl ? (
          <div className="w-full max-w-md flex flex-col gap-3 bg-[#0d1b2a] border border-white/[0.08] rounded-2xl p-6 text-center">
            <h2 className="text-white font-bold text-base">This space has ended</h2>
            <p className="text-gray-500 text-xs">A recording is available.</p>
            <a
              href={recordingUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="px-5 py-2.5 rounded-xl bg-[#f5a623] hover:bg-[#ffd700] text-[#0a1628] font-bold text-sm transition-colors"
            >
              Listen to the recording
            </a>
          </div>
        ) : isEnded ? (
          <div className="w-full max-w-md flex flex-col gap-3 bg-[#0d1b2a] border border-white/[0.08] rounded-2xl p-6 text-center">
            <h2 className="text-white font-bold text-base">This space has ended</h2>
            <p className="text-gray-500 text-xs">No recording was made.</p>
          </div>
        ) : (
          <JukeEmbed spaceId={spaceId} audioOff={audioOff} useSsoToken />
        )}

        <div className="flex flex-wrap gap-2 justify-center">
          <a
            href={jukeAppDeeplinkUrl(spaceId)}
            target="_blank"
            rel="noreferrer noopener"
            className="px-4 py-2 rounded-xl border border-white/[0.12] bg-[#1a2a3a] text-gray-300 text-xs font-semibold hover:bg-[#22364a] transition-colors"
          >
            Open in Juke app
          </a>
          <a
            href={jukeSpaceUrl(spaceId)}
            target="_blank"
            rel="noreferrer noopener"
            className="px-4 py-2 rounded-xl border border-white/[0.12] bg-[#1a2a3a] text-gray-400 text-xs font-semibold hover:bg-[#22364a] transition-colors"
          >
            Share page
          </a>
          {!audioOff && !isEnded && (
            <Link
              href={`/live/${spaceId}?audio=off`}
              className="px-4 py-2 rounded-xl border border-white/[0.12] bg-[#1a2a3a] text-gray-400 text-xs font-semibold hover:bg-[#22364a] transition-colors"
            >
              Mute (second screen)
            </Link>
          )}
        </div>

        {canEnd && (
          <div className="flex flex-col items-center gap-1.5 pt-2">
            <EndJukeSpaceButton spaceId={spaceId} />
            <p className="text-[10px] text-gray-600">
              Iframe Leave only disconnects you. Use this to end the room for everyone.
            </p>
          </div>
        )}

        <p className="mt-2 max-w-[480px] text-center text-xs text-gray-500">
          {audioOff
            ? 'Audio is off. Listen in the Juke iOS app, or open this page in another tab without ?audio=off.'
            : 'Listening is anonymous. To react, raise your hand, or speak, sign in with Farcaster inside the space.'}
        </p>
      </main>
    </div>
  );
}
