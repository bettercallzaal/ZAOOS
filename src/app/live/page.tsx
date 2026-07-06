import type { Metadata } from 'next';
import Link from 'next/link';
import { jukeSpaceOgImageUrl } from '@/lib/spaces/juke';
import {
  type JukeSpaceRow,
  listActiveJukeSpaces,
  listRecordedJukeSpaces,
  listScheduledJukeSpaces,
} from '@/lib/spaces/jukeSpacesDb';
import { communityConfig } from '../../../community.config';
import { JukeLinkOpener } from './JukeLinkOpener';

export const metadata: Metadata = {
  title: `Live on Juke - ${communityConfig.name}`,
  description:
    'Live, scheduled, and recorded Juke audio spaces hosted by The ZAO. Anyone can listen.',
};

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

function formatScheduled(value: string | null): string {
  if (!value) return 'Soon';
  const ts = new Date(value).getTime();
  if (Number.isNaN(ts)) return 'Soon';
  const diff = ts - Date.now();
  if (diff <= 0) return 'Starting now';
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `In ${Math.max(1, minutes)}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `In ${hours}h`;
  return new Date(value).toLocaleString('en-US', {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * /live - public index of Juke spaces hosted by ZAO. No auth required. Three
 * sections: active right now, scheduled to start, and recordings of past
 * spaces. Each card routes to /live/{id} which renders the keyless Juke
 * iframe. A paste-link form at the bottom keeps the original "open any Juke
 * link inside ZAO OS" flow alive for non-ZAO spaces.
 */
export default async function LiveIndexPage() {
  const [active, scheduled, recordings] = await Promise.all([
    safe(listActiveJukeSpaces(12), [] as JukeSpaceRow[]),
    safe(listScheduledJukeSpaces(12), [] as JukeSpaceRow[]),
    safe(listRecordedJukeSpaces(8), [] as JukeSpaceRow[]),
  ]);

  const empty = active.length === 0 && scheduled.length === 0 && recordings.length === 0;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#0a1628] text-white">
      <header className="border-b border-white/[0.08] bg-[#0d1b2a]">
        <div className="flex items-center justify-between gap-3 px-4 py-4 max-w-5xl mx-auto w-full">
          <div className="min-w-0 flex items-center gap-3">
            <Link
              href="/"
              aria-label="Back home"
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
            <div>
              <h1 className="text-base sm:text-lg font-bold">Live on Juke</h1>
              <p className="text-xs text-gray-500">
                Public audio spaces hosted by {communityConfig.name}. Anyone can listen.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/live/recordings"
              className="hidden sm:inline-flex px-3 py-1.5 text-xs font-medium text-gray-300 border border-white/[0.12] rounded-lg hover:bg-white/[0.04] transition-colors"
            >
              Recordings
            </Link>
            <Link
              href="/juke-status"
              className="hidden sm:inline-flex px-3 py-1.5 text-xs font-medium text-[#f5a623] border border-[#f5a623]/30 rounded-lg hover:bg-[#f5a623]/10 transition-colors"
            >
              Build status
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 max-w-5xl mx-auto w-full space-y-10">
        {empty && <EmptyState />}

        {active.length > 0 && (
          <SectionRow title="Live now" accent="text-red-400" badge="LIVE" pulse>
            {active.map((row) => (
              <SpaceCard key={row.id} row={row} subtitle="Live now" cta="Join" emphasize />
            ))}
          </SectionRow>
        )}

        {scheduled.length > 0 && (
          <SectionRow title="Scheduled" accent="text-[#f5a623]" badge="SOON">
            {scheduled.map((row) => (
              <SpaceCard
                key={row.id}
                row={row}
                subtitle={formatScheduled(row.scheduled_at)}
                cta="Set reminder"
              />
            ))}
          </SectionRow>
        )}

        {recordings.length > 0 && (
          <SectionRow title="Recent recordings" accent="text-gray-300" badge="REPLAY">
            {recordings.map((row) => (
              <SpaceCard
                key={row.id}
                row={row}
                subtitle={
                  row.ended_at ? `Ended ${new Date(row.ended_at).toLocaleDateString()}` : 'Ended'
                }
                cta="Listen back"
              />
            ))}
          </SectionRow>
        )}

        <section className="border-t border-white/[0.06] pt-8">
          <h2 className="text-sm font-bold text-white mb-1">Open any Juke space</h2>
          <p className="text-xs text-gray-500 mb-4">
            Paste a juke.audio link and we will open it inside ZAO OS - works for spaces ZAO does
            not host.
          </p>
          <JukeLinkOpener />
          <p className="mt-3 text-xs text-gray-600">
            Built on Juke -{' '}
            <a
              href="https://juke.audio"
              className="text-gray-400 hover:text-[#f5a623]"
              target="_blank"
              rel="noreferrer noopener"
            >
              juke.audio
            </a>
            .
          </p>
        </section>
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div
        className="w-16 h-16 rounded-full bg-[#f5a623]/10 flex items-center justify-center mb-5"
        aria-hidden="true"
      >
        <svg
          className="w-8 h-8 text-[#f5a623]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
          />
        </svg>
      </div>
      <h2 className="text-lg font-semibold mb-1">Nothing live right now</h2>
      <p className="text-gray-500 text-sm max-w-sm">
        ZAO hosts on Juke - check back during a fractal call, a ZAOstock standup, or a COC Concertz
        night. Recordings live at{' '}
        <Link href="/live/recordings" className="text-[#f5a623] hover:underline">
          /live/recordings
        </Link>
        .
      </p>
    </div>
  );
}

function SectionRow({
  title,
  accent,
  badge,
  pulse,
  children,
}: {
  title: string;
  accent: string;
  badge: string;
  pulse?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border border-current/30 ${accent}`}
        >
          {pulse && (
            <span
              className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"
              aria-hidden="true"
            />
          )}
          {badge}
        </span>
        <h2 className="text-sm font-bold text-white">{title}</h2>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</ul>
    </section>
  );
}

function SpaceCard({
  row,
  subtitle,
  cta,
  emphasize,
}: {
  row: JukeSpaceRow;
  subtitle: string;
  cta: string;
  emphasize?: boolean;
}) {
  return (
    <li className="bg-[#111d2e] border border-white/[0.08] rounded-xl overflow-hidden transition-all hover:border-gray-600 hover:shadow-lg hover:shadow-black/20">
      <Link
        href={`/live/${row.id}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5a623] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1628]"
        aria-label={`${cta}: ${row.title}`}
      >
        <div className="aspect-[1200/630] bg-[#0a1628] relative overflow-hidden">
          {}
          <img
            src={jukeSpaceOgImageUrl(row.id)}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
          />
        </div>
        <div className="p-4">
          <h3 className="text-sm font-bold leading-tight line-clamp-2">
            {row.title || 'Untitled space'}
          </h3>
          <p className="text-gray-500 text-xs mt-1">{subtitle}</p>
        </div>
      </Link>
      <div className="px-4 pb-4">
        <span
          className={`inline-flex items-center justify-center w-full px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            emphasize
              ? 'bg-[#f5a623] hover:bg-[#ffd700] text-[#0a1628]'
              : 'bg-[#1a2a3a] hover:bg-[#22364a] text-gray-200 border border-white/[0.08]'
          }`}
        >
          {cta}
        </span>
      </div>
    </li>
  );
}
