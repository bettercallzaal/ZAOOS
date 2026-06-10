import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/overview/bots — server-side proxy to the cowork fleet board
 * (thezao.xyz/api/v1/bots). Lets the admin /overview page show LIVE bot status
 * without exposing the read token to the browser or hitting CORS.
 *
 * Dormant-safe: if COWORK_API_URL / COWORK_READ_TOKEN aren't configured, returns
 * { configured: false } and the page falls back to its documented static table.
 * Admin-only.
 */
export async function GET() {
  const session = await getSessionData();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const url = (process.env.COWORK_API_URL ?? '').replace(/\/$/, '');
  const token = process.env.COWORK_READ_TOKEN ?? '';
  if (!url || !token) {
    return NextResponse.json({ configured: false, bots: [] });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);
  try {
    const res = await fetch(`${url}/api/v1/bots`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!res.ok) {
      return NextResponse.json({ configured: true, error: `HTTP ${res.status}`, bots: [] });
    }
    const data = (await res.json()) as { bots?: unknown };
    return NextResponse.json({ configured: true, bots: Array.isArray(data.bots) ? data.bots : [] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'fetch failed';
    return NextResponse.json({ configured: true, error: message, bots: [] });
  } finally {
    clearTimeout(timer);
  }
}
