import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { ENV } from '@/lib/env';
import { logger } from '@/lib/logger';

/**
 * POST /api/juke/admin/agent-join
 *
 * Drops a partner-scoped agent (ZOE by default) into a Juke room ZAO owns.
 * Uses the free `POST /v1/developer/rooms/{spaceId}/agent-join` endpoint
 * Nicky shipped 2026-05-23 — key-only auth, no x402 toll for rooms whose
 * `created_by_app_id` matches our developer app. Agents publish data only
 * in v1 (audio-publishing on v1.x roadmap), so the first ZOE use case is
 * taking notes / posting recap casts, not voice.
 *
 * Constraints from llms.txt "Agents" section:
 * - room.status must be 'active' and allow_agents must be true
 * - per-room cap: 5 concurrent agents
 * - rate limit: 10/min + 100/day per key
 * - cross-app rooms 404 (cannot be used to enumerate other apps)
 *
 * The returned session_token is what the ZOE bot uses for the duration of
 * the room (X-Session-Token header on token-refresh / leave). Storing it
 * is the caller's responsibility - this route only mints.
 *
 * Admin-only. The session_token is short-lived but treat it as a secret -
 * do not leak to chat or persist long-term.
 */

const BodySchema = z.object({
  spaceId: z.string().min(1).max(128),
  agentName: z.string().trim().min(1).max(64).default('ZOE'),
  agentPfpUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  const session = await getSessionData();
  if (!session?.isAdmin) {
    return NextResponse.json({ ok: false, error: 'Admin only' }, { status: 401 });
  }

  const apiKey = ENV.JUKE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: 'JUKE_API_KEY not configured on the server' },
      { status: 503 },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Request body must be valid JSON' },
      { status: 400 },
    );
  }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Invalid body', details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { spaceId, agentName, agentPfpUrl } = parsed.data;

  const endpoint = `https://api.juke.audio/v1/developer/rooms/${encodeURIComponent(spaceId)}/agent-join`;
  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'X-Juke-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ agent_name: agentName, agent_pfp_url: agentPfpUrl }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err: unknown) {
    logger.error('[juke/admin/agent-join] fetch failed', err);
    return NextResponse.json(
      { ok: false, error: 'Juke agent-join API unreachable' },
      { status: 502 },
    );
  }
  const text = await res.text();
  let jukeBody: unknown;
  try {
    jukeBody = JSON.parse(text);
  } catch {
    jukeBody = text;
  }
  if (!res.ok) {
    // 404 = either the space does not exist OR it belongs to another app -
    // Juke does not distinguish, on purpose.
    // 429 = rate-limited (10/min, 100/day per key) OR per-room cap (5 agents).
    logger.warn('[juke/admin/agent-join] Juke rejected', res.status, jukeBody);
    return NextResponse.json(
      { ok: false, error: `Juke returned ${res.status}`, juke: jukeBody },
      { status: res.status >= 500 ? 502 : res.status },
    );
  }
  return NextResponse.json(
    {
      ok: true,
      spaceId,
      agentName,
      juke: jukeBody,
      action_required:
        'Capture session_token from juke.session_token. Pass it as X-Session-Token on subsequent calls (token refresh, leave). Do not persist long-term; it dies with the room.',
    },
    { status: 201 },
  );
}

export const GET = () =>
  NextResponse.json(
    { ok: false, error: 'POST only - send { spaceId, agentName?, agentPfpUrl? }' },
    { status: 405 },
  );
