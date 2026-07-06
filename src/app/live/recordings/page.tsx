import type { Metadata } from 'next';
import Link from 'next/link';
import { jukeSpaceOgImageUrl } from '@/lib/spaces/juke';
import { type JukeSpaceRow, listRecordedJukeSpaces } from '@/lib/spaces/jukeSpacesDb';
import { communityConfig } from '../../../../community.config';

export const metadata: Metadata = {
  title: `Juke Recordings - ${communityConfig.name}`,
  description: 'Past Juke audio spaces hosted by The ZAO, with recordings.',
  robots: { index: false },
};

/** Render a friendly relative date — "3h ago", "2d ago", "May 22" once we
 * pass a week, so the recording shelf stays scannable. */
function formatEndedAt(value: string | null): string {
  if (!value) return 'recently';
  const ts = new Date(value).getTime();
  if (Number.isNaN(ts)) return 'recently';
  const diffMs = Date.now() - ts;
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Safe wrapper around the Supabase query — returns [] on any failure so the
 * page still renders an empty state instead of a 500. */
async function safeListRecordings(): Promise<JukeSpaceRow[]> {
  try {
    return await listRecordedJukeSpaces(25);
  } catch {
    return [];
  }
}

/**
 * /live/recordings - shelf of past Juke spaces with recordings.
 *
 * Driven by the `recording.ready` webhook from Juke (PR 2026-05-23 item #4):
 * once Juke stores the recording URL on `juke_spaces.recording_url`, every
 * ended space with a recording shows up here without further plumbing.
 *
 * The OG image comes from juke.audio/space/{id}/opengraph-image so each row
 * carries Juke's branded thumbnail.
 */
export default async function LiveRecordingsPage() {
  const recordings = await safeListRecordings();

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#0a1628] text-white">
      <header className="border-b border-white/[0.08] bg-[#0d1b2a]">
        <div className="flex items-center gap-3 px-4 py-4 max-w-4xl mx-auto w-full">
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
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-lg font-bold">Juke recordings</h1>
            <p className="text-xs text-gray-500">
              Past audio spaces hosted by {communityConfig.name}.
            </p>
          </div>
          <span
            className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full bg-[#f5a623]/10 border border-[#f5a623]/30 text-[#f5a623] text-[11px] font-bold"
            aria-label={`${recordings.length} ${recordings.length === 1 ? 'recording' : 'recordings'}`}
          >
            {recordings.length}
          </span>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 max-w-4xl mx-auto w-full">
        {recordings.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {recordings.map((row) => (
              <RecordingCard key={row.id} row={row} endedLabel={formatEndedAt(row.ended_at)} />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-[#f5a623]/10 flex items-center justify-center mb-5">
        <svg
          className="w-8 h-8 text-[#f5a623]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 11a7 7 0 01-14 0m7 7v4m-4 0h8m-7-15a3 3 0 016 0v6a3 3 0 11-6 0V5z"
          />
        </svg>
      </div>
      <h2 className="text-lg font-semibold mb-1">No recordings yet</h2>
      <p className="text-gray-500 text-sm max-w-xs">
        When a ZAO Juke space ends with recording on, it shows up here. Host enables recording from
        the Juke iOS app.
      </p>
      <Link
        href="/spaces"
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#f5a623] hover:bg-[#ffd700] text-[#0a1628] text-sm font-bold transition-colors"
      >
        Back to Spaces
      </Link>
    </div>
  );
}

function RecordingCard({ row, endedLabel }: { row: JukeSpaceRow; endedLabel: string }) {
  // `row.recording_url` is filtered to NOT NULL in the query, but the type is
  // still `string | null` — guard locally so TypeScript is happy and the
  // anchor stays well-formed.
  const recordingUrl = row.recording_url ?? '';
  const ogImage = jukeSpaceOgImageUrl(row.id);
  return (
    <li className="group bg-[#111d2e] border border-white/[0.08] rounded-xl overflow-hidden transition-all hover:border-gray-600 hover:shadow-lg hover:shadow-black/20">
      <Link
        href={`/live/${row.id}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5a623] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1628]"
        aria-label={`Open recording: ${row.title}`}
      >
        <div className="aspect-[1200/630] bg-[#0a1628] relative overflow-hidden">
          {}
          <img
            src={ogImage}
            alt=""
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
            loading="lazy"
          />
          <div className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider text-gray-200">
            Recording
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-sm font-bold leading-tight line-clamp-2 group-hover:text-[#f5a623] transition-colors">
            {row.title || 'Untitled space'}
          </h3>
          <p className="text-gray-500 text-xs mt-2">
            Ended {endedLabel}
            {typeof row.participant_count === 'number' && row.participant_count > 0 && (
              <>
                {' - '}
                {row.participant_count} {row.participant_count === 1 ? 'listener' : 'listeners'}
              </>
            )}
          </p>
        </div>
      </Link>
      <div className="px-4 pb-4 space-y-2">
        {/* Native HTML5 player so desktop visitors can preview without opening
            a new tab. Mobile + Safari still get a usable control set. */}
        <audio
          controls
          preload="none"
          src={recordingUrl}
          className="w-full h-9 [&::-webkit-media-controls-panel]:bg-[#0a1628]"
        >
          Your browser does not support inline audio playback.
        </audio>
        <a
          href={recordingUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center justify-center w-full px-4 py-2 rounded-xl border border-white/[0.12] bg-[#1a2a3a] text-gray-300 text-[11px] font-semibold hover:bg-[#22364a] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5a623] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1628]"
        >
          Open recording in new tab
        </a>
      </div>
    </li>
  );
}
