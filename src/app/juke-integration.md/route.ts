import {
  getJukeIntegrationManifest,
  renderIntegrationMarkdown,
} from '@/lib/spaces/jukeIntegrationManifest';
import { buildResolutionIndex, fetchJukeChangelog } from '@/lib/spaces/jukeChangelog';
import {
  getJukeIntegrationStats,
  listRecentJukeSpaces,
  listRecentWebhookEvents,
} from '@/lib/spaces/jukeSpacesDb';

/**
 * GET /juke-integration.md - llms.txt-style markdown summary of ZAO's Juke
 * integration. The Juke team's agent can fetch this URL and get a stable,
 * grep-friendly listing of shipped features, open asks, live stats, recent
 * webhook deliveries, and recent space activity - same shape Juke publishes
 * at juke.audio/llms.txt for us.
 *
 * Served with text/markdown so most LLM-fetch tools render it cleanly. Cached
 * short, same SLA as the JSON endpoint.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  const manifest = getJukeIntegrationManifest();
  const [stats, recentSpaces, recentEvents, changelog] = await Promise.all([
    getJukeIntegrationStats().catch(() => null),
    listRecentJukeSpaces(10).catch(() => []),
    listRecentWebhookEvents(15).catch(() => []),
    fetchJukeChangelog(),
  ]);
  const resolutionIndex = buildResolutionIndex(changelog);
  const statsObject: Record<string, unknown> | undefined = stats
    ? {
        total_spaces: stats.total_spaces,
        active: stats.active,
        scheduled: stats.scheduled,
        ended: stats.ended,
        with_recording: stats.with_recording,
        total_webhook_events: stats.total_webhook_events,
        last_event_at: stats.last_event_at ?? 'never',
      }
    : undefined;

  const lines: string[] = [renderIntegrationMarkdown(manifest, statsObject)];

  if (resolutionIndex.size > 0) {
    lines.push('## Asks resolved by Juke');
    lines.push(
      `Joined from https://juke.audio/changelog.json — \`entries[].resolves[]\` maps to \`open_asks[].id\` on this page.`,
    );
    lines.push('');
    for (const ask of manifest.open_asks) {
      const r = resolutionIndex.get(ask.id);
      if (!r) continue;
      lines.push(`### ${ask.id} → ${r.id}`);
      lines.push(`- Ask: ${ask.title}`);
      lines.push(`- Juke shipped: ${r.shipped_at} — ${r.title}`);
      lines.push(`- Summary: ${r.summary}`);
      if (r.endpoints && r.endpoints.length > 0) {
        lines.push(`- Endpoints: ${r.endpoints.map((e) => `\`${e}\``).join(', ')}`);
      }
      if (r.docs) {
        lines.push(`- Docs: ${r.docs}${r.docs_section ? ` (section: ${r.docs_section})` : ''}`);
      }
      lines.push('');
    }
  }


  if (recentEvents.length > 0) {
    lines.push('## Recent webhooks');
    for (const ev of recentEvents) {
      const status = ev.error ? `FAIL ${ev.error}` : ev.processed_at ? 'OK' : 'PENDING';
      lines.push(
        `- ${ev.event_type}  space=${ev.space_id ?? '-'}  received=${ev.received_at}  ${status}`,
      );
    }
    lines.push('');
  }

  if (recentSpaces.length > 0) {
    lines.push('## Recent spaces');
    for (const r of recentSpaces) {
      const time =
        r.status === 'scheduled'
          ? `scheduled_at=${r.scheduled_at ?? '-'}`
          : r.status === 'ended'
            ? `ended_at=${r.ended_at ?? '-'}`
            : `started_at=${r.started_at ?? '-'}`;
      lines.push(
        `- [${r.status}] ${r.title}  id=${r.id}  ${time}  participants=${r.participant_count}${r.recording_url ? `  recording=${r.recording_url}` : ''}`,
      );
    }
    lines.push('');
  }

  return new Response(lines.join('\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=120',
      'Access-Control-Allow-Origin': '*',
      'X-ZAO-Juke-Status': 'v2',
    },
  });
}
