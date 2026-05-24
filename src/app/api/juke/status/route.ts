import { NextResponse } from 'next/server';
import { getJukeIntegrationManifest } from '@/lib/spaces/jukeIntegrationManifest';
import { buildResolutionIndex, fetchJukeChangelog } from '@/lib/spaces/jukeChangelog';
import {
  getJukeIntegrationStats,
  listRecentJukeSpaces,
  listRecentWebhookEvents,
} from '@/lib/spaces/jukeSpacesDb';

/**
 * GET /api/juke/status - machine-readable ZAO + Juke integration state.
 *
 * Same data as /juke-status (HTML) and /juke-integration.md (markdown). Built
 * for the Juke team's agent to fetch without scraping the HTML page.
 *
 * Cached short (60s) at the CDN; ZAO ships new features faster than Juke
 * polls, so a one-minute staleness ceiling is fine.
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
  // Decorate open_asks with juke_resolved so consumers see closed asks
  // without re-joining against juke.audio/changelog.json themselves.
  const open_asks = manifest.open_asks.map((ask) => {
    const resolved = resolutionIndex.get(ask.id);
    return resolved ? { ...ask, juke_resolved: resolved } : ask;
  });

  return NextResponse.json(
    {
      ...manifest,
      open_asks,
      stats,
      recent_spaces: recentSpaces,
      recent_events: recentEvents,
      release_feed: 'https://juke.audio/changelog.json',
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=120',
        'Access-Control-Allow-Origin': '*',
        'X-ZAO-Juke-Status': 'v3',
      },
    },
  );
}
