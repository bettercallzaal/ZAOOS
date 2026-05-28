import type { Metadata } from 'next';
import Link from 'next/link';
import { jukeSpaceOgImageUrl } from '@/lib/spaces/juke';
import {
  listActiveJukeSpaces,
  listScheduledJukeSpaces,
  listRecordedJukeSpaces,
  type JukeSpaceRow,
} from '@/lib/spaces/jukeSpacesDb';
import { communityConfig } from '../../../community.config';

export const metadata: Metadata = {
  title: `Listen - live audio on ${communityConfig.name}`,
  description:
    'We built live audio on Juke. Come listen. Live ZAO spaces, what is scheduled next, and the recording shelf.',
  openGraph: {
    title: `Listen - live audio on ${communityConfig.name}`,
    description: 'We built live audio on Juke. Come listen.',
    siteName: communityConfig.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `Listen - live audio on ${communityConfig.name}`,
    description: 'We built live audio on Juke. Come listen.',
  },
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
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatEnded(value: string | null): string {
  if (!value) return 'recently';
  const ts = new Date(value).getTime();
  if (Number.isNaN(ts)) return 'recently';
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${Math.max(1, m)}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * /listen - member-facing public page for ZAO's live audio on Juke. Hero +
 * three sections (live now / coming up / recently recorded). Build-in-public
 * voice in the hero per Zaal 2026-05-25. Reuses the same juke_spaces helpers
 * /live uses, but with a more pull-y hierarchy: hero first, live cards
 * dominant, scheduled + recorded compact, footer credits Juke.
 *
 * /live remains the operator-facing dashboard with finer controls. /listen is
 * the "tap me on a phone, I want to hear something now" surface.
 */
// "Live now" stale guard - hide DB rows still flagged active but with no
// recent participant activity. We've been bitten repeatedly by rows that
// stay active forever because the host walked away without triggering
// room.finished and the stale-room cron only runs daily on Hobby tier. A
// row started >60min ago is suspect unless we can prove someone is still
// in it. /spaces uses the same 30min threshold for its "Stale" badge, but
// /listen is a member-pull surface so we exclude rather than dim - showing
// 5 dead rooms as Live actively hurts trust.
const LIVE_STALE_THRESHOLD_MS = 60 * 60 * 1000;
function isJukeRowProbablyLive(row: JukeSpaceRow): boolean {
  if (row.status !== 'active') return false;
  if (!row.started_at) return true;
  const ageMs = Date.now() - new Date(row.started_at).getTime();
  if (ageMs <= LIVE_STALE_THRESHOLD_MS) return true;
  // Older than threshold - only keep if at least one ZAO member is in the
  // room (populated by participant.joined/left webhooks). updated_at lets
  // us be a touch more permissive when there's been recent webhook traffic.
  if ((row.participant_count ?? 0) > 0) return true;
  const updatedMs = row.updated_at ? Date.now() - new Date(row.updated_at).getTime() : Infinity;
  return updatedMs <= LIVE_STALE_THRESHOLD_MS;
}

export default async function ListenPage() {
  const [liveRaw, scheduled, recorded] = await Promise.all([
    safe(listActiveJukeSpaces(16), []),
    safe(listScheduledJukeSpaces(4), []),
    safe(listRecordedJukeSpaces(6), []),
  ]);
  const live = liveRaw.filter(isJukeRowProbablyLive).slice(0, 8);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#0a1628] text-white">
      <header className="border-b border-white/[0.08] bg-gradient-to-b from-[#0d1b2a] to-[#0a1628]">
        <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:py-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#855dcd]/10 border border-[#855dcd]/30 text-[#a78bfa] text-[10px] font-bold uppercase tracking-wider mb-4">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#a78bfa]" aria-hidden="true" />
            Live audio - powered by Juke
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight max-w-xl">
            We built live audio on Juke.
            <span className="block text-[#f5a623]">Come listen.</span>
          </h1>
          <p className="mt-4 max-w-lg text-sm sm:text-base text-gray-400 leading-relaxed">
            Drop into a {communityConfig.name} room when one is on, or scroll back through
            the recordings shelf. Built in public on{' '}
            <a
              href="https://juke.audio"
              target="_blank"
              rel="noreferrer noopener"
              className="text-gray-200 underline decoration-[#855dcd]/40 hover:decoration-[#a78bfa]"
            >
              juke.audio
            </a>
            .
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 space-y-12">
        <Section title="Live now" count={live.length}>
          {live.length === 0 ? (
            <EmptyHint label="No rooms live right now. Check the schedule below." />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {live.map((r) => (
                <LiveCard key={r.id} row={r} />
              ))}
            </ul>
          )}
        </Section>

        <Section title="Coming up" count={scheduled.length}>
          {scheduled.length === 0 ? (
            <EmptyHint label="No scheduled rooms yet." />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {scheduled.map((r) => (
                <ScheduledCard key={r.id} row={r} />
              ))}
            </ul>
          )}
        </Section>

        <Section
          title="Recently recorded"
          count={recorded.length}
          link={recorded.length > 6 ? { href: '/live/recordings', label: 'See all' } : undefined}
        >
          {recorded.length === 0 ? (
            <EmptyHint label="The first ZAO Juke recording will land here." />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recorded.map((r) => (
                <RecordingChip key={r.id} row={r} />
              ))}
            </ul>
          )}
        </Section>
      </main>

      <footer className="border-t border-white/[0.06] bg-[#0d1b2a]">
        <div className="mx-auto w-full max-w-4xl px-4 py-6 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
          <span>
            Live audio for {communityConfig.name}, on{' '}
            <a
              href="https://juke.audio"
              target="_blank"
              rel="noreferrer noopener"
              className="text-gray-300 hover:text-[#f5a623]"
            >
              Juke
            </a>
            .
          </span>
          <div className="flex gap-3 text-[11px]">
            <Link href="/juke" className="text-gray-400 hover:text-[#f5a623]">
              How we built it
            </Link>
            <Link href="/juke-status" className="text-gray-400 hover:text-[#f5a623]">
              Build status
            </Link>
            <Link href="/spaces" className="text-gray-400 hover:text-[#f5a623]">
              All audio surfaces
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Section({
  title,
  count,
  link,
  children,
}: {
  title: string;
  count: number;
  link?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">
          {title}
          {count > 0 && (
            <span className="ml-2 text-[#f5a623] font-normal normal-case tracking-normal text-xs">
              ({count})
            </span>
          )}
        </h2>
        {link && (
          <Link
            href={link.href}
            className="text-xs text-gray-500 hover:text-[#f5a623] transition-colors"
          >
            {link.label} →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function EmptyHint({ label }: { label: string }) {
  return (
    <div className="bg-[#111d2e] border border-white/[0.08] rounded-xl p-4 text-xs text-gray-500">
      {label}
    </div>
  );
}

function LiveCard({ row }: { row: JukeSpaceRow }) {
  return (
    <Link
      href={`/live/${row.id}`}
      className="group block rounded-xl border border-[#855dcd]/30 bg-gradient-to-br from-[#1a1428] to-[#111d2e] p-4 transition-all hover:border-[#a78bfa]/50 hover:shadow-lg hover:shadow-[#855dcd]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#855dcd]"
      aria-label={`Join: ${row.title}`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-bold text-sm leading-tight line-clamp-2 text-white group-hover:text-[#a78bfa] transition-colors">
          {row.title || 'Untitled space'}
        </h3>
        <span className="flex-shrink-0 inline-flex items-center gap-1 text-red-400 text-[10px] font-bold uppercase tracking-wider">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" aria-hidden="true" />
          Live
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {row.participant_count <= 1
            ? 'Just host'
            : `${row.participant_count} listening`}
        </span>
        <span className="inline-flex items-center px-3 py-1 rounded-lg bg-[#855dcd] text-white text-xs font-bold group-hover:bg-[#a78bfa] transition-colors">
          Listen
        </span>
      </div>
    </Link>
  );
}

function ScheduledCard({ row }: { row: JukeSpaceRow }) {
  return (
    <Link
      href={`/live/${row.id}`}
      className="group block rounded-xl border border-white/[0.08] bg-[#111d2e] p-4 transition-all hover:border-[#f5a623]/30"
      aria-label={`Scheduled: ${row.title}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-bold text-sm leading-tight line-clamp-2 text-white group-hover:text-[#f5a623] transition-colors">
          {row.title || 'Untitled space'}
        </h3>
        <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider text-[#f5a623]">
          Soon
        </span>
      </div>
      <p className="text-xs text-gray-500">{formatScheduled(row.scheduled_at)}</p>
    </Link>
  );
}

function RecordingChip({ row }: { row: JukeSpaceRow }) {
  const recordingUrl = row.recording_url;
  if (!recordingUrl) return null;
  const ogImage = jukeSpaceOgImageUrl(row.id);
  return (
    <Link
      href={`/live/${row.id}`}
      className="group block overflow-hidden rounded-xl border border-white/[0.08] bg-[#111d2e] transition-all hover:border-gray-600"
      aria-label={`Recording: ${row.title}`}
    >
      <div className="aspect-[1200/630] bg-[#0a1628] overflow-hidden">
        { }
        <img
          src={ogImage}
          alt=""
          className="h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
          loading="lazy"
        />
      </div>
      <div className="p-3">
        <h3 className="font-bold text-xs leading-tight line-clamp-1 text-white group-hover:text-[#f5a623] transition-colors">
          {row.title || 'Untitled space'}
        </h3>
        <p className="text-[11px] text-gray-500 mt-1">Ended {formatEnded(row.ended_at)}</p>
      </div>
    </Link>
  );
}
