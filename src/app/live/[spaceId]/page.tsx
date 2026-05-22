import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JukeEmbed } from '@/components/spaces/JukeEmbed';
import { isValidJukeSpaceId } from '@/lib/spaces/juke';
import { communityConfig } from '../../../../community.config';

interface LivePageProps {
  params: Promise<{ spaceId: string }>;
}

export async function generateMetadata({ params }: LivePageProps): Promise<Metadata> {
  const { spaceId } = await params;
  if (!isValidJukeSpaceId(spaceId)) {
    return { title: `Live Audio - ${communityConfig.name}` };
  }
  return {
    title: `Live Audio - ${communityConfig.name}`,
    description: `Listen in to a live audio space on Juke, the Farcaster-native audio app.`,
    robots: { index: false },
  };
}

/**
 * /live/[spaceId] — a Juke live audio space embedded in ZAO OS.
 *
 * Path A of doc 695 (Juke integration). The space is created and hosted on
 * Juke; this route is a thin, brandable window onto it. Anyone with the
 * space link can open `/live/{spaceId}`; listening is anonymous, and
 * participating prompts Sign In With Farcaster inside the Juke iframe.
 */
export default async function LivePage({ params }: LivePageProps) {
  const { spaceId } = await params;

  // Untrusted path segment — reject anything that is not a Juke space id
  // before it can reach the embed URL.
  if (!isValidJukeSpaceId(spaceId)) {
    notFound();
  }

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
            <h1 className="text-sm font-bold text-white sm:text-base">Live Audio</h1>
            <p className="truncate text-xs text-gray-500">Farcaster-native space, powered by Juke</p>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center px-4 py-6">
        <JukeEmbed spaceId={spaceId} />
        <p className="mt-4 max-w-[480px] text-center text-xs text-gray-500">
          Listening is anonymous. To react, raise your hand, or speak, sign in
          with Farcaster inside the space.
        </p>
      </main>
    </div>
  );
}
