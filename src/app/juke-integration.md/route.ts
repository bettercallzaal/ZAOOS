import {
  getJukeIntegrationManifest,
  renderIntegrationMarkdown,
} from '@/lib/spaces/jukeIntegrationManifest';
import { getJukeIntegrationStats } from '@/lib/spaces/jukeSpacesDb';

/**
 * GET /juke-integration.md - llms.txt-style markdown summary of ZAO's Juke
 * integration. The Juke team's agent can fetch this URL and get a stable,
 * grep-friendly listing of shipped features, open asks, and live stats - the
 * same shape Juke publishes at juke.audio/llms.txt for us.
 *
 * Served with text/markdown so most LLM-fetch tools render it cleanly. Cached
 * short, same SLA as the JSON endpoint.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  const manifest = getJukeIntegrationManifest();
  let statsObject: Record<string, unknown> | undefined;
  try {
    const stats = await getJukeIntegrationStats();
    statsObject = {
      total_spaces: stats.total_spaces,
      active: stats.active,
      scheduled: stats.scheduled,
      ended: stats.ended,
      with_recording: stats.with_recording,
      total_webhook_events: stats.total_webhook_events,
      last_event_at: stats.last_event_at ?? 'never',
    };
  } catch {
    statsObject = undefined;
  }
  const body = renderIntegrationMarkdown(manifest, statsObject);
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=120',
      'Access-Control-Allow-Origin': '*',
      'X-ZAO-Juke-Status': 'v1',
    },
  });
}
