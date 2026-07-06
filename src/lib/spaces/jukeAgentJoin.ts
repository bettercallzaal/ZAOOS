/**
 * Thin helper to call Juke's free partner-scoped agent-join endpoint. Shared
 * by the admin route (`POST /api/juke/admin/agent-join`) and the optional
 * auto-join hook that fires on `room.started` webhooks (off by default, gated
 * by `ZAO_AUTO_AGENT_JOIN=true`).
 *
 * Returns the session_token on success. Caller decides whether to persist it
 * (the token is short-lived + tied to the room, so storing long-term has no
 * value). Logs everything so we have an audit trail when ZOE joins a room.
 *
 * Constraints (per Juke 2026-05-23 ship + llms.txt agents section):
 * - Room must be `active` with `allow_agents: true`
 * - Per-room cap: 5 concurrent agents
 * - Rate: 10/min + 100/day per developer key
 * - Cross-app rooms 404 (no enumeration oracle)
 * - Agents publish DATA only in v1 (audio-publish on v1.x roadmap)
 */
import { ENV } from '@/lib/env';
import { logger } from '@/lib/logger';

export interface AgentJoinResult {
  ok: boolean;
  sessionToken?: string;
  status?: number;
  juke?: unknown;
  error?: string;
}

export interface AgentJoinInput {
  spaceId: string;
  agentName?: string;
  agentPfpUrl?: string;
}

const ENDPOINT_BASE = 'https://api.juke.audio/v1/developer/rooms';

export async function joinAgentInJukeRoom(input: AgentJoinInput): Promise<AgentJoinResult> {
  const apiKey = ENV.JUKE_API_KEY;
  if (!apiKey) {
    return { ok: false, error: 'JUKE_API_KEY not configured' };
  }
  const { spaceId, agentName = 'ZOE', agentPfpUrl } = input;
  const endpoint = `${ENDPOINT_BASE}/${encodeURIComponent(spaceId)}/agent-join`;

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
    logger.error('[juke/agent-join] fetch failed', err);
    return { ok: false, error: 'Juke agent-join API unreachable' };
  }
  const text = await res.text();
  let jukeBody: unknown;
  try {
    jukeBody = JSON.parse(text);
  } catch {
    jukeBody = text;
  }
  if (!res.ok) {
    logger.warn('[juke/agent-join] Juke rejected', res.status, jukeBody);
    return { ok: false, status: res.status, juke: jukeBody };
  }
  const sessionToken =
    typeof jukeBody === 'object' && jukeBody !== null
      ? ((jukeBody as { session_token?: string }).session_token ?? undefined)
      : undefined;
  return { ok: true, status: res.status, juke: jukeBody, sessionToken };
}

/**
 * Should we auto-join an agent into a freshly-started ZAO room? Off by
 * default. Flip the env var when ZOE is ready to consume agent sessions on
 * the VPS side (currently we'd join + immediately drop the token, which has
 * no real value beyond making sure the wiring works).
 */
export function isAutoAgentJoinEnabled(): boolean {
  return process.env.ZAO_AUTO_AGENT_JOIN === 'true';
}
