import type { Metadata } from 'next';
import Link from 'next/link';
import {
  getJukeIntegrationManifest,
  type ShippedFeature,
} from '@/lib/spaces/jukeIntegrationManifest';
import {
  getJukeIntegrationStats,
  type JukeIntegrationStats,
} from '@/lib/spaces/jukeSpacesDb';
import { communityConfig } from '../../../community.config';

export const metadata: Metadata = {
  title: `${communityConfig.name} x Juke - how we built it`,
  description:
    'Case study of the ZAO + Juke live audio integration - what we shipped, why, and how you can build with Juke yourself. Build-in-public on juke.audio.',
  openGraph: {
    title: `${communityConfig.name} x Juke`,
    description: 'We built live audio on Juke. Here is how, and how you can too.',
    siteName: communityConfig.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${communityConfig.name} x Juke`,
    description: 'We built live audio on Juke. Here is how.',
  },
};

async function safeStats(): Promise<JukeIntegrationStats> {
  try {
    return await getJukeIntegrationStats();
  } catch {
    return {
      total_spaces: 0,
      active: 0,
      scheduled: 0,
      ended: 0,
      with_recording: 0,
      total_webhook_events: 0,
      recent_event_types: {},
      last_event_at: null,
    };
  }
}

/**
 * /juke - partnership case study + build-in-public landing for the ZAO+Juke
 * integration. Aimed at builders + Farcaster ecosystem folks who want to know
 * "how did ZAO ship this?" before they pitch their own integration to Nicky,
 * or who want to embed Juke on their own surface.
 *
 * Pairs with /listen (member-facing pull) and /juke-status (live ops
 * dashboard). This page is the storytelling layer: voice + journey +
 * receipts. Voice per Zaal 2026-05-25 ("build-in-public framing").
 *
 * Data comes from the same jukeIntegrationManifest + juke_spaces stats the
 * dashboard reads, so the "How many shipped" / "How many spaces" numbers stay
 * truthful as we ship more.
 */
export default async function JukeCaseStudyPage() {
  const manifest = getJukeIntegrationManifest();
  const stats = await safeStats();
  const shippedFeatures = manifest.shipped;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#0a1628] text-white">
      <header className="border-b border-white/[0.08] bg-gradient-to-b from-[#0d1b2a] to-[#0a1628]">
        <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:py-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f5a623]/10 border border-[#f5a623]/30 text-[#f5a623] text-[10px] font-bold uppercase tracking-wider mb-4">
            {communityConfig.name} x Juke - build in public
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight max-w-2xl">
            We built live audio on Juke.
            <span className="block text-[#a78bfa]">Come listen.</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm sm:text-base text-gray-400 leading-relaxed">
            {communityConfig.name} ships live audio on{' '}
            <a
              href="https://juke.audio"
              target="_blank"
              rel="noreferrer noopener"
              className="text-gray-200 underline decoration-[#855dcd]/40 hover:decoration-[#a78bfa]"
            >
              juke.audio
            </a>{' '}
            - the Farcaster-native audio app from{' '}
            <a
              href="https://farcaster.xyz/~/profiles/nickysap"
              target="_blank"
              rel="noreferrer noopener"
              className="text-gray-200 underline decoration-[#855dcd]/40 hover:decoration-[#a78bfa]"
            >
              nickysap
            </a>
            . Below: what we shipped, the build journey, and the wires for
            anyone who wants to build with Juke themselves.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/listen"
              className="inline-flex items-center px-5 py-2.5 rounded-xl bg-[#f5a623] hover:bg-[#ffd700] text-[#0a1628] text-sm font-bold transition-colors"
            >
              Listen now
            </Link>
            <Link
              href="/juke-status"
              className="inline-flex items-center px-5 py-2.5 rounded-xl border border-white/[0.12] bg-[#1a2a3a] hover:bg-[#22364a] text-gray-200 text-sm font-bold transition-colors"
            >
              See the wires
            </Link>
            <a
              href="https://juke.audio"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center px-5 py-2.5 rounded-xl border border-[#855dcd]/30 bg-[#855dcd]/10 hover:bg-[#855dcd]/20 text-[#a78bfa] text-sm font-bold transition-colors"
            >
              Build with Juke →
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 space-y-12">
        <StatsStrip stats={stats} shippedCount={shippedFeatures.length} />

        <Section title="Why we built this">
          <p className="text-sm text-gray-300 leading-relaxed">
            {communityConfig.name} runs weekly fractal calls, ZAOstock standups,
            and ad-hoc rooms - all live audio with Farcaster identity as the
            ticket. The legacy stack (Stream.io + 100ms) gave us the rooms but
            not the social graph. Juke gave us both: real-time audio + FID-aware
            identity in the same handshake.
          </p>
          <p className="mt-3 text-sm text-gray-400 leading-relaxed">
            Five days from first read to full integration. Path A iframe + Path
            B developer API + outbound webhooks + recap-cast wired into the
            same /zao channel that runs the community. Build-in-public from
            line one.
          </p>
        </Section>

        <Section title="The build">
          <p className="text-xs text-gray-500 mb-4">
            Every shipped feature, newest first. Each row links to the PR or the
            files that landed it.
          </p>
          <ol className="space-y-3">
            {shippedFeatures
              .slice()
              .sort((a, b) => (b.shippedAt > a.shippedAt ? 1 : -1))
              .map((f) => (
                <BuildRow key={f.id} feature={f} />
              ))}
          </ol>
        </Section>

        <Section title="Screenshots">
          <p className="text-xs text-gray-500 mb-4">
            Live tour - drop screenshots in as we go. Today this section is a
            placeholder; Zaal grabs shots on the next run-through.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              'Host page on /live/{id} with End-space + listener badge',
              'Public /juke-status dashboard with tabs',
              'Recap cast in /zao on Farcaster',
              'Juke iframe with SSO bridge (no QR)',
            ].map((label) => (
              <div
                key={label}
                className="aspect-[1200/630] rounded-xl border border-dashed border-white/[0.12] bg-[#0d1b2a]/40 flex items-center justify-center p-4 text-center"
              >
                <p className="text-[11px] text-gray-500 leading-relaxed">{label}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Build with Juke">
          <div className="grid gap-3 sm:grid-cols-3">
            <ResourceCard
              label="llms.txt"
              href="https://juke.audio/llms.txt"
              hint="Canonical machine-readable spec - feed this to your AI."
            />
            <ResourceCard
              label="changelog.json"
              href="https://juke.audio/changelog.json"
              hint="Auto-polled by /juke-status to flip resolved asks green."
            />
            <ResourceCard
              label="Our wires"
              href="/juke-status"
              hint="HTML dashboard + JSON + markdown mirrors of this integration."
              internal
            />
          </div>
        </Section>
      </main>

      <footer className="border-t border-white/[0.06] bg-[#0d1b2a]">
        <div className="mx-auto w-full max-w-4xl px-4 py-6 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
          <span>
            {communityConfig.name} on{' '}
            <a
              href="https://juke.audio"
              target="_blank"
              rel="noreferrer noopener"
              className="text-gray-300 hover:text-[#f5a623]"
            >
              Juke
            </a>{' '}
            - thanks{' '}
            <a
              href="https://farcaster.xyz/~/profiles/nickysap"
              target="_blank"
              rel="noreferrer noopener"
              className="text-gray-300 hover:text-[#f5a623]"
            >
              @nickysap
            </a>
            .
          </span>
          <div className="flex gap-3 text-[11px]">
            <Link href="/listen" className="text-gray-400 hover:text-[#f5a623]">
              Listen now
            </Link>
            <Link href="/juke-status" className="text-gray-400 hover:text-[#f5a623]">
              Build status
            </Link>
            <Link href="/juke-integration.md" className="text-gray-400 hover:text-[#f5a623]">
              llms.txt mirror
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatsStrip({
  stats,
  shippedCount,
}: {
  stats: JukeIntegrationStats;
  shippedCount: number;
}) {
  const items = [
    { value: shippedCount, label: 'Features shipped' },
    { value: stats.total_spaces, label: 'Spaces created' },
    { value: stats.with_recording, label: 'With recording' },
    { value: stats.total_webhook_events, label: 'Webhook events' },
  ];
  return (
    <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((it) => (
        <div
          key={it.label}
          className="rounded-xl border border-white/[0.08] bg-[#111d2e] px-4 py-3"
        >
          <p className="text-2xl font-bold text-white">{it.value}</p>
          <p className="text-[11px] text-gray-500 uppercase tracking-wider mt-1">{it.label}</p>
        </div>
      ))}
    </section>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">{title}</h2>
      {children}
    </section>
  );
}

function BuildRow({ feature }: { feature: ShippedFeature }) {
  return (
    <li className="rounded-xl border border-white/[0.08] bg-[#111d2e] p-4">
      <div className="flex items-baseline gap-3 flex-wrap mb-1">
        <h3 className="text-sm font-bold text-white">{feature.title}</h3>
        <span className="text-[10px] text-gray-500 font-mono">{feature.shippedAt}</span>
        {feature.pr && (
          <a
            href={feature.pr}
            target="_blank"
            rel="noreferrer noopener"
            className="text-[10px] text-[#f5a623] hover:underline"
          >
            View PR
          </a>
        )}
      </div>
      <p className="text-xs text-gray-400 leading-relaxed">{feature.description}</p>
    </li>
  );
}

function ResourceCard({
  label,
  href,
  hint,
  internal,
}: {
  label: string;
  href: string;
  hint: string;
  internal?: boolean;
}) {
  if (internal) {
    return (
      <Link
        href={href}
        className="block rounded-xl border border-white/[0.08] bg-[#111d2e] p-4 hover:border-[#f5a623]/30 transition-colors"
      >
        <p className="text-sm font-bold text-white">{label}</p>
        <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{hint}</p>
      </Link>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="block rounded-xl border border-white/[0.08] bg-[#111d2e] p-4 hover:border-[#855dcd]/30 transition-colors"
    >
      <p className="text-sm font-bold text-white">{label}</p>
      <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{hint}</p>
    </a>
  );
}
