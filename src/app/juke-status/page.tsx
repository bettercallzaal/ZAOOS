import type { Metadata } from 'next';
import Link from 'next/link';
import {
  getJukeIntegrationManifest,
  INTEGRATION_ARCHITECTURE_ASCII,
  type IntegrationManifest,
  type ShippedFeature,
  type OpenAsk,
} from '@/lib/spaces/jukeIntegrationManifest';
import { getJukeIntegrationStats, type JukeIntegrationStats } from '@/lib/spaces/jukeSpacesDb';
import { communityConfig } from '../../../community.config';

export const metadata: Metadata = {
  title: `ZAO + Juke - Integration Status`,
  description:
    'Public dashboard of what The ZAO has built using Juke, live integration stats, and open asks for the Juke team. Machine-readable mirror at /api/juke/status.',
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
 * /juke-status - public dashboard for the Juke team (and their agent) to see
 * what ZAO has shipped, live stats, and what is blocking the next slice of
 * work. Same data is exposed machine-readable at /api/juke/status and
 * markdown-friendly at /juke-integration.md.
 *
 * Three audiences:
 * - Nicky + the Juke team scanning the page directly.
 * - Their AI agent fetching it via WebFetch / WebSearch.
 * - ZAO members linking the page to show off the integration.
 */
export default async function JukeStatusPage() {
  const manifest = getJukeIntegrationManifest();
  const stats = await safeStats();
  const lastEvent = stats.last_event_at ? new Date(stats.last_event_at) : null;

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white">
      <header className="border-b border-white/[0.08] bg-[#0d1b2a]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-[#f5a623]/10 border border-[#f5a623]/30 text-[#f5a623] text-[10px] font-bold uppercase tracking-wider mb-2">
              ZAO + Juke - build status
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">{communityConfig.name} on Juke</h1>
            <p className="text-sm text-gray-400 mt-1 max-w-xl">
              Public dashboard of what we have shipped, live stats from the integration, and the
              open asks blocking the next slice. Built so anyone (including agents) can read where
              we are without a Slack ping.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <a
              href="/api/juke/status"
              className="inline-flex px-3 py-1.5 text-xs font-medium text-gray-300 border border-white/[0.12] rounded-lg hover:bg-white/[0.04] transition-colors"
            >
              JSON
            </a>
            <a
              href="/juke-integration.md"
              className="inline-flex px-3 py-1.5 text-xs font-medium text-gray-300 border border-white/[0.12] rounded-lg hover:bg-white/[0.04] transition-colors"
            >
              Markdown
            </a>
            <Link
              href="/live"
              className="inline-flex px-3 py-1.5 text-xs font-medium text-[#f5a623] border border-[#f5a623]/30 rounded-lg hover:bg-[#f5a623]/10 transition-colors"
            >
              Live spaces
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        <StatsRow stats={stats} lastEvent={lastEvent} />
        <ArchitectureSection />
        <ShippedSection manifest={manifest} />
        <AsksSection manifest={manifest} />
        <ConventionsSection manifest={manifest} />
        <ContactSection manifest={manifest} />
      </main>
    </div>
  );
}

function StatsRow({ stats, lastEvent }: { stats: JukeIntegrationStats; lastEvent: Date | null }) {
  const items: Array<{ label: string; value: number | string }> = [
    { label: 'Spaces created', value: stats.total_spaces },
    { label: 'Active now', value: stats.active },
    { label: 'Scheduled', value: stats.scheduled },
    { label: 'Ended', value: stats.ended },
    { label: 'With recording', value: stats.with_recording },
    { label: 'Webhook events', value: stats.total_webhook_events },
  ];
  return (
    <section>
      <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">Live stats</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="bg-[#111d2e] border border-white/[0.08] rounded-xl px-4 py-3"
          >
            <p className="text-2xl font-bold text-white">{item.value}</p>
            <p className="text-[11px] text-gray-500 uppercase tracking-wider mt-1">{item.label}</p>
          </div>
        ))}
      </div>
      {lastEvent && (
        <p className="text-xs text-gray-500 mt-3">
          Last webhook delivered {lastEvent.toLocaleString('en-US')}
        </p>
      )}
    </section>
  );
}

function ArchitectureSection() {
  return (
    <section>
      <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">
        Architecture
      </h2>
      <div className="bg-[#0a1628] border border-white/[0.08] rounded-xl p-4 overflow-x-auto">
        <pre className="text-[11px] sm:text-xs leading-snug text-gray-300 font-mono whitespace-pre">
{INTEGRATION_ARCHITECTURE_ASCII}
        </pre>
      </div>
      <p className="text-xs text-gray-500 mt-3 leading-relaxed">
        ZAO holds two persisted tables: <code className="text-gray-300">juke_spaces</code> (one row per
        Juke-minted space, publicly readable) + <code className="text-gray-300">juke_webhook_events</code>{' '}
        (audit + idempotency, service-role only). Every other surface is a read against those two
        tables or against juke.audio directly.
      </p>
    </section>
  );
}

function ShippedSection({ manifest }: { manifest: IntegrationManifest }) {
  return (
    <section>
      <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">
        Shipped ({manifest.shipped.length})
      </h2>
      <ul className="space-y-3">
        {manifest.shipped.map((feature) => (
          <ShippedRow key={feature.id} feature={feature} />
        ))}
      </ul>
    </section>
  );
}

function ShippedRow({ feature }: { feature: ShippedFeature }) {
  return (
    <li className="bg-[#111d2e] border border-white/[0.08] rounded-xl p-4">
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
      <p className="text-xs text-gray-400 leading-relaxed mb-2">{feature.description}</p>
      {feature.reference && (
        <p className="text-[11px] text-gray-500 italic mb-2">Ref: {feature.reference}</p>
      )}
      <div className="flex flex-wrap gap-1">
        {feature.files.map((file) => (
          <code
            key={file}
            className="text-[10px] px-1.5 py-0.5 rounded bg-[#0a1628] border border-white/[0.06] text-gray-300 font-mono"
          >
            {file}
          </code>
        ))}
      </div>
    </li>
  );
}

function AsksSection({ manifest }: { manifest: IntegrationManifest }) {
  return (
    <section>
      <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">
        Open asks for Juke ({manifest.open_asks.length})
      </h2>
      <ul className="space-y-3">
        {manifest.open_asks.map((ask) => (
          <AskRow key={ask.id} ask={ask} />
        ))}
      </ul>
    </section>
  );
}

function AskRow({ ask }: { ask: OpenAsk }) {
  const priorityStyles: Record<OpenAsk['priority'], { bg: string; text: string; border: string }> = {
    p0: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
    p1: { bg: 'bg-[#f5a623]/15', text: 'text-[#f5a623]', border: 'border-[#f5a623]/30' },
    p2: { bg: 'bg-blue-500/15', text: 'text-blue-300', border: 'border-blue-500/30' },
  };
  const ps = priorityStyles[ask.priority];
  return (
    <li className="bg-[#111d2e] border border-white/[0.08] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${ps.bg} ${ps.text} ${ps.border}`}>
          {ask.priority}
        </span>
        <h3 className="text-sm font-bold text-white">{ask.title}</h3>
      </div>
      <p className="text-xs text-gray-400 leading-relaxed">{ask.reason}</p>
      <p className="text-[11px] text-gray-500 mt-2">
        <span className="font-semibold text-gray-400">Blocks:</span> {ask.blocks}
      </p>
    </li>
  );
}

function ConventionsSection({ manifest }: { manifest: IntegrationManifest }) {
  return (
    <section>
      <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">Conventions</h2>
      <ul className="bg-[#111d2e] border border-white/[0.08] rounded-xl p-4 space-y-2">
        {manifest.conventions.map((c) => (
          <li key={c} className="text-xs text-gray-400 leading-relaxed flex gap-2">
            <span className="text-[#f5a623]" aria-hidden="true">-</span>
            <span>{c}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ContactSection({ manifest }: { manifest: IntegrationManifest }) {
  return (
    <section className="border-t border-white/[0.06] pt-8 text-xs text-gray-500">
      <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">Contact</h2>
      <ul className="space-y-1">
        <li>ZAO dev: {manifest.contact.zao_dev}</li>
        <li>
          General:{' '}
          <a
            className="text-gray-300 hover:text-[#f5a623]"
            href={manifest.contact.general}
            target="_blank"
            rel="noreferrer noopener"
          >
            {manifest.contact.general}
          </a>
        </li>
        <li>{manifest.contact.partnership}</li>
      </ul>
      <p className="mt-4 text-gray-600">
        Page generated server-side at request time. Machine-readable mirror at{' '}
        <a href="/api/juke/status" className="text-gray-400 hover:text-[#f5a623]">
          /api/juke/status
        </a>
        ; markdown for agents at{' '}
        <a href="/juke-integration.md" className="text-gray-400 hover:text-[#f5a623]">
          /juke-integration.md
        </a>
        .
      </p>
    </section>
  );
}
