/**
 * fleet-loops.ts - fetch and format loop status for the /loops and /loop commands.
 *
 * Reads from the Supabase `fleet_status` table which the loops-keepalive.sh script
 * refreshes every ~10s. ZOE can call this from the VPS without needing access to
 * the local tmux sessions.
 */

const REQUEST_TIMEOUT_MS = 8_000;

const KNOWN_LOOPS = ['zoe', 'ww', 'coc', 'human', 'zol'] as const;
type LoopName = (typeof KNOWN_LOOPS)[number];

export interface LoopStatus {
  session: string;
  state: string;
  lastLine: string;
  updatedAt: string | null;
}

/** Fetch loop statuses from Supabase fleet_status table. Returns [] on error. */
export async function fetchLoopStatuses(sessions?: string[]): Promise<LoopStatus[]> {
  const base = process.env.COWORK_TRACKER_URL;
  const key = process.env.COWORK_TRACKER_KEY;
  if (!base || !key) return [];

  const targets = sessions ?? [...KNOWN_LOOPS];
  const inClause = targets.map((s) => `"${s}"`).join(',');
  const url =
    `${base.replace(/\/$/, '')}/rest/v1/fleet_status` +
    `?session=in.(${inClause})&select=session,state,last_line,updated_at&order=session`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const res = await fetch(url, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: controller.signal,
      cache: 'no-store',
    }).finally(() => clearTimeout(timer));
    if (!res.ok) return [];
    const rows = (await res.json()) as Array<{
      session: string;
      state: string;
      last_line: string | null;
      updated_at: string | null;
    }>;
    return rows.map((r) => ({
      session: r.session,
      state: r.state ?? '?',
      lastLine: (r.last_line ?? '').trim().replace(/\s+/g, ' '),
      updatedAt: r.updated_at ?? null,
    }));
  } catch {
    return [];
  }
}

/** Age string relative to now. */
export function ageStr(updatedAt: string | null, now = Date.now()): string {
  if (!updatedAt) return 'unknown age';
  const ms = now - new Date(updatedAt).getTime();
  if (ms < 0) return 'just now';
  const secs = Math.round(ms / 1000);
  if (secs < 90) return `${secs}s ago`;
  const mins = Math.round(ms / 60_000);
  if (mins < 90) return `${mins}m ago`;
  const hrs = Math.round(ms / 3_600_000);
  return `${hrs}h ago`;
}

/** Format a single loop as a compact status line. */
export function formatLoop(loop: LoopStatus, now = Date.now()): string {
  const icon = loop.state === 'working' ? 'working' : loop.state === 'idle' ? 'idle' : loop.state;
  const age = ageStr(loop.updatedAt, now);
  const last = loop.lastLine.slice(0, 100) || '(no recent output)';
  return `${loop.session} [${icon}] (${age})\n  ${last}`;
}

/** Format all loops as a multi-line Telegram status reply. */
export function formatLoopsAll(loops: LoopStatus[], now = Date.now()): string {
  if (loops.length === 0) return 'No loop status data in fleet_status table.';
  const working = loops.filter((l) => l.state === 'working').length;
  const header = `Fleet: ${working}/${loops.length} working`;
  const lines = loops.map((l) => formatLoop(l, now)).join('\n\n');
  return `${header}\n\n${lines}`;
}

export { KNOWN_LOOPS };
export type { LoopName };
