import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';

// Live fleet status, proxied from the cowork control-plane board
// (GET /api/v1/bots on the cowork-zaodevz app). Heartbeats live in that app's
// Supabase, not ours, so this route is a thin server-side proxy: it injects the
// bot bearer token (server-only) and normalizes the response for the /overview
// Bots tab. Admin-gated — this is ops data.
//
// Config (Vercel env, server-only):
//   COWORK_API_URL   e.g. https://www.thezao.xyz
//   COWORK_BOT_TOKEN a bot bearer token with read access to /api/v1/bots
// If either is missing, returns { configured: false } so the UI can show a
// "not wired up" hint instead of erroring.

export const dynamic = 'force-dynamic';

interface CoworkBot {
  bot: string;
  status: 'up' | 'degraded' | 'down';
  ts: string;
  online: boolean;
  ageSeconds: number;
  meta?: Record<string, unknown>;
}

interface FleetStatusResponse {
  configured: boolean;
  fetchedAt: string;
  bots: CoworkBot[];
  error?: string;
}

export async function GET(): Promise<NextResponse<FleetStatusResponse>> {
  const session = await getSessionData();
  if (!session?.isAdmin) {
    return NextResponse.json(
      { configured: false, fetchedAt: new Date().toISOString(), bots: [], error: 'unauthorized' },
      { status: 401 },
    );
  }

  const base = process.env.COWORK_API_URL;
  const token = process.env.COWORK_BOT_TOKEN;
  if (!base || !token) {
    return NextResponse.json({
      configured: false,
      fetchedAt: new Date().toISOString(),
      bots: [],
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`${base.replace(/\/$/, '')}/api/v1/bots`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
      cache: 'no-store',
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) {
      return NextResponse.json(
        {
          configured: true,
          fetchedAt: new Date().toISOString(),
          bots: [],
          error: `cowork board returned ${res.status}`,
        },
        { status: 502 },
      );
    }

    const data = (await res.json()) as { bots?: CoworkBot[] };
    return NextResponse.json({
      configured: true,
      fetchedAt: new Date().toISOString(),
      bots: Array.isArray(data.bots) ? data.bots : [],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'unknown error';
    console.error('[api/bots/status] cowork fetch failed:', message);
    return NextResponse.json(
      {
        configured: true,
        fetchedAt: new Date().toISOString(),
        bots: [],
        error: 'could not reach the cowork board',
      },
      { status: 502 },
    );
  }
}
