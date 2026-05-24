import type { Metadata } from 'next';
import Link from 'next/link';
import {
  getJukeIntegrationManifest,
  INTEGRATION_ARCHITECTURE_ASCII,
  type IntegrationManifest,
  type ShippedFeature,
  type OpenAsk,
} from '@/lib/spaces/jukeIntegrationManifest';
import {
  buildResolutionIndex,
  fetchJukeChangelog,
  type JukeChangelogEntry,
} from '@/lib/spaces/jukeChangelog';
import {
  getJukeIntegrationStats,
  listRecentJukeSpaces,
  listRecentWebhookEvents,
  type JukeIntegrationStats,
  type RecentJukeSpaceRow,
  type RecentWebhookEventRow,
} from '@/lib/spaces/jukeSpacesDb';
import { communityConfig } from '../../../community.config';

export const metadata: Metadata = {
  title: `ZAO + Juke - Integration Status`,
  description:
    'Public dashboard of what The ZAO has built using Juke, live integration stats, recent webhook deliveries, and open asks for the Juke team. Machine-readable mirror at /api/juke/status.',
  openGraph: {
    title: 'ZAO + Juke - Integration Status',
    description: "Live build status of ZAO's Juke integration. Shipped features, recent webhooks, open asks. Refreshes the moment we ship.",
    siteName: communityConfig.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZAO + Juke - Integration Status',
    description: "Live build status of ZAO's Juke integration. Shipped features, recent webhooks, open asks.",
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

async function safeRecentSpaces(): Promise<RecentJukeSpaceRow[]> {
  try { return await listRecentJukeSpaces(10); } catch { return []; }
}

async function safeRecentEvents(): Promise<RecentWebhookEventRow[]> {
  try { return await listRecentWebhookEvents(15); } catch { return []; }
}

/** Friendly relative time - "2m ago" / "3h ago" / "May 22". */
function ago(value: string | null | undefined): string {
  if (!value) return '-';
  const ts = new Date(value).getTime();
  if (Number.isNaN(ts)) return '-';
  const diffMin = Math.floor((Date.now() - ts) / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffD = Math.floor(diffHr / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
  const [stats, recentSpaces, recentEvents, changelog] = await Promise.all([
    safeStats(),
    safeRecentSpaces(),
    safeRecentEvents(),
    fetchJukeChangelog(),
  ]);
  const resolutionIndex = buildResolutionIndex(changelog);
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
        <WebhookTimelineSection events={recentEvents} />
        <RecentSpacesSection rows={recentSpaces} />
        <ArchitectureSection />
        <ShippedSection manifest={manifest} />
        <AsksSection manifest={manifest} resolutionIndex={resolutionIndex} />
        <CodeExamplesSection />
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

function WebhookTimelineSection({ events }: { events: RecentWebhookEventRow[] }) {
  return (
    <section>
      <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">
        Recent webhooks ({events.length})
      </h2>
      {events.length === 0 ? (
        <div className="bg-[#111d2e] border border-white/[0.08] rounded-xl p-4 text-xs text-gray-500">
          No webhook deliveries yet. Confirm the subscription via{' '}
          <code className="text-gray-300">POST /api/juke/admin/register-webhook</code>; once Juke
          starts posting, the most recent 15 events show up here.
        </div>
      ) : (
        <ul className="bg-[#111d2e] border border-white/[0.08] rounded-xl divide-y divide-white/[0.04]">
          {events.map((ev) => {
            const ok = !!ev.processed_at && !ev.error;
            return (
              <li key={ev.id} className="flex items-center gap-3 px-4 py-2.5">
                <span
                  className={`flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                    ok
                      ? 'bg-green-500/20 text-green-400'
                      : ev.error
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-gray-500/20 text-gray-400'
                  }`}
                  aria-label={ok ? 'processed' : ev.error ? 'failed' : 'pending'}
                >
                  {ok ? 'OK' : ev.error ? '!' : '...'}
                </span>
                <code className="text-xs text-gray-200 font-mono w-44 truncate">{ev.event_type}</code>
                <code className="text-[11px] text-gray-500 font-mono flex-1 truncate">
                  {ev.space_id ?? 'no space_id'}
                </code>
                <span className="text-[11px] text-gray-500 flex-shrink-0">{ago(ev.received_at)}</span>
                {ev.error && (
                  <span
                    className="text-[10px] text-red-400 truncate max-w-[200px]"
                    title={ev.error}
                  >
                    {ev.error}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function RecentSpacesSection({ rows }: { rows: RecentJukeSpaceRow[] }) {
  if (rows.length === 0) {
    return (
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">
          Recent Juke spaces
        </h2>
        <div className="bg-[#111d2e] border border-white/[0.08] rounded-xl p-4 text-xs text-gray-500">
          No Juke spaces minted yet through this integration. Create one via{' '}
          <a href="/spaces" className="text-[#f5a623] hover:underline">/spaces (Go Live - Juke)</a>{' '}
          or <a href="/live/create" className="text-[#f5a623] hover:underline">/live/create</a>.
        </div>
      </section>
    );
  }
  return (
    <section>
      <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">
        Recent Juke spaces ({rows.length})
      </h2>
      <div className="bg-[#111d2e] border border-white/[0.08] rounded-xl overflow-hidden">
        <ul className="divide-y divide-white/[0.04]">
          {rows.map((r) => {
            const statusStyle =
              r.status === 'active'
                ? 'text-red-400 border-red-500/30 bg-red-500/10'
                : r.status === 'scheduled'
                  ? 'text-[#f5a623] border-[#f5a623]/30 bg-[#f5a623]/10'
                  : 'text-gray-400 border-white/[0.08] bg-white/[0.02]';
            const timeLabel = r.status === 'scheduled'
              ? `starts ${ago(r.scheduled_at)}`
              : r.status === 'ended'
                ? `ended ${ago(r.ended_at)}`
                : `started ${ago(r.started_at)}`;
            return (
              <li key={r.id} className="flex items-center gap-3 px-4 py-2.5">
                <span
                  className={`flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${statusStyle}`}
                >
                  {r.status}
                </span>
                <a
                  href={`/live/${r.id}`}
                  className="text-sm text-white truncate flex-1 hover:text-[#f5a623] transition-colors"
                >
                  {r.title || 'Untitled space'}
                </a>
                <span className="text-[11px] text-gray-500 flex-shrink-0">{timeLabel}</span>
                {r.participant_count > 0 && (
                  <span className="text-[11px] text-gray-500 flex-shrink-0">
                    {r.participant_count} listening
                  </span>
                )}
                {r.recording_url && (
                  <a
                    href={r.recording_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-[10px] text-[#f5a623] hover:underline flex-shrink-0"
                  >
                    Recording
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function CodeExamplesSection() {
  return (
    <section>
      <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">
        How ZAO calls Juke
      </h2>
      <p className="text-xs text-gray-500 mb-4 leading-relaxed">
        Reference snippets so Nicky's agent can see ZAO's actual integration patterns. Every line
        matches the live production code paths.
      </p>
      <div className="space-y-3">
        <CodeBlock
          title="Create a space (Path B) - src/lib/spaces/juke-api.ts"
          body={`POST https://api.juke.audio/v1/developer/spaces
X-Juke-Api-Key: <JUKE_API_KEY>
Content-Type: application/json

{
  "title": "ZAO Fractal Call",
  "scheduled_at": null,
  "announce_cast": false,
  "allow_agents": true
}`}
        />
        <CodeBlock
          title="Embed (Path A) - src/components/spaces/JukeEmbed.tsx"
          body={`<iframe
  src="https://juke.audio/embed/{spaceId}"
  title="Juke live audio space"
  allow="autoplay; microphone"
  style="width:100%;max-width:480px;height:720px;border:0;border-radius:24px"
></iframe>`}
        />
        <CodeBlock
          title="Webhook verification - src/lib/spaces/jukeWebhookVerify.ts"
          body={`// Header from Juke:
//   X-Juke-Signature: t={unix-ts-seconds},v1={hex-hmac-sha256}
// Signed payload: \`\${ts}.\${rawBody}\`
// HMAC key: JUKE_WEBHOOK_SECRET (shared on POST /v1/developer/webhooks)

const expected = createHmac('sha256', secret)
  .update(\`\${parsed.ts}.\${rawBody}\`)
  .digest('hex');

if (!timingSafeEqual(
  Buffer.from(expected, 'utf8'),
  Buffer.from(parsed.v1, 'utf8'),
)) return { ok: false, reason: 'Signature mismatch' };

// Plus: reject ts more than 5min from now (replay window).`}
        />
        <CodeBlock
          title="Subscribe to webhooks - src/app/api/juke/admin/register-webhook/route.ts"
          body={`POST https://api.juke.audio/v1/developer/webhooks
X-Juke-Api-Key: <JUKE_API_KEY>
Content-Type: application/json

{
  "url": "https://zaoos.com/api/juke/webhooks",
  "secret": "<JUKE_WEBHOOK_SECRET>",
  "events": [
    "room.started",
    "room.finished",
    "participant.joined",
    "participant.left",
    "recording.ready"
  ]
}`}
        />
      </div>
    </section>
  );
}

function CodeBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-[#0a1628] border border-white/[0.08] rounded-xl overflow-hidden">
      <div className="px-4 py-2 border-b border-white/[0.04] bg-[#111d2e]">
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
          {title}
        </span>
      </div>
      <pre className="text-[11px] sm:text-xs leading-snug text-gray-300 font-mono whitespace-pre-wrap px-4 py-3 overflow-x-auto">
{body}
      </pre>
    </div>
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

function AsksSection({
  manifest,
  resolutionIndex,
}: {
  manifest: IntegrationManifest;
  resolutionIndex: Map<string, JukeChangelogEntry>;
}) {
  const resolvedCount = manifest.open_asks.filter((a) => resolutionIndex.has(a.id)).length;
  return (
    <section>
      <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">
        Open asks for Juke ({manifest.open_asks.length})
        {resolvedCount > 0 && (
          <span className="ml-2 text-green-400 normal-case font-normal">
            - {resolvedCount} resolved by Juke
          </span>
        )}
      </h2>
      <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">
        Auto-resolved from{' '}
        <a
          href="https://juke.audio/changelog.json"
          target="_blank"
          rel="noreferrer noopener"
          className="text-gray-300 hover:text-[#f5a623] underline"
        >
          juke.audio/changelog.json
        </a>
        . Each entry's <code className="text-gray-300">resolves[]</code> array maps to{' '}
        <code className="text-gray-300">open_asks[].id</code> on this page.
      </p>
      <ul className="space-y-3">
        {manifest.open_asks.map((ask) => (
          <AskRow key={ask.id} ask={ask} resolved={resolutionIndex.get(ask.id) ?? null} />
        ))}
      </ul>
    </section>
  );
}

function AskRow({ ask, resolved }: { ask: OpenAsk; resolved: JukeChangelogEntry | null }) {
  const priorityStyles: Record<OpenAsk['priority'], { bg: string; text: string; border: string }> = {
    p0: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
    p1: { bg: 'bg-[#f5a623]/15', text: 'text-[#f5a623]', border: 'border-[#f5a623]/30' },
    p2: { bg: 'bg-blue-500/15', text: 'text-blue-300', border: 'border-blue-500/30' },
  };
  const ps = priorityStyles[ask.priority];
  return (
    <li
      className={`border rounded-xl p-4 ${
        resolved
          ? 'bg-green-500/[0.04] border-green-500/30'
          : 'bg-[#111d2e] border-white/[0.08]'
      }`}
    >
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${ps.bg} ${ps.text} ${ps.border}`}>
          {ask.priority}
        </span>
        {resolved && (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-green-500/15 text-green-400 border-green-500/30">
            Resolved by Juke
          </span>
        )}
        <h3 className={`text-sm font-bold ${resolved ? 'text-green-300' : 'text-white'}`}>
          {ask.title}
        </h3>
      </div>
      <p className="text-xs text-gray-400 leading-relaxed">{ask.reason}</p>
      <p className="text-[11px] text-gray-500 mt-2">
        <span className="font-semibold text-gray-400">Blocks:</span> {ask.blocks}
      </p>
      {resolved && (
        <div className="mt-3 pt-3 border-t border-green-500/15">
          <p className="text-[11px] text-green-300 font-semibold mb-1">
            Shipped {resolved.shipped_at}: {resolved.title}
          </p>
          <p className="text-[11px] text-gray-400 leading-relaxed mb-2">{resolved.summary}</p>
          {resolved.endpoints && resolved.endpoints.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {resolved.endpoints.map((ep) => (
                <code
                  key={ep}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-[#0a1628] border border-white/[0.06] text-gray-300 font-mono"
                >
                  {ep}
                </code>
              ))}
            </div>
          )}
          {resolved.docs && (
            <p className="text-[10px] text-gray-500">
              Docs:{' '}
              <a
                href={resolved.docs}
                target="_blank"
                rel="noreferrer noopener"
                className="text-gray-400 hover:text-[#f5a623] underline"
              >
                {resolved.docs}
              </a>
              {resolved.docs_section && (
                <span className="text-gray-600"> &middot; section: {resolved.docs_section}</span>
              )}
            </p>
          )}
        </div>
      )}
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
