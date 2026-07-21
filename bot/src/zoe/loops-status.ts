/**
 * loops-status.ts — read + format the tmux fleet loop status for ZOE's
 * `/loops` and `/loop <name>` Telegram commands.
 *
 * The keepalive supervisor publishes /tmp/fleet-status.json every few minutes:
 *   { "updated": "<ISO>", "loops": [ { "session", "state", "last" }, ... ] }
 * These are pure formatters (nowMs injected) so they unit-test without clocks
 * or the bot; only readFleetStatus() touches the filesystem. index.ts wires the
 * thin command handlers (rule 21: keep testable logic out of the entrypoint).
 */
import { readFile } from 'node:fs/promises';

export interface FleetLoop {
  session: string;
  state: string;
  last: string;
}

export interface FleetStatus {
  updated: string;
  loops: FleetLoop[];
}

const DEFAULT_PATH = '/tmp/fleet-status.json';
const STALE_MS = 10 * 60 * 1000; // keepalive runs */3 min; >10 min = stale

/** Read + validate the fleet status file. Returns null on any error (missing/bad JSON). */
export async function readFleetStatus(path: string = DEFAULT_PATH): Promise<FleetStatus | null> {
  try {
    const raw = await readFile(path, 'utf8');
    const data = JSON.parse(raw) as FleetStatus;
    if (!data || typeof data.updated !== 'string' || !Array.isArray(data.loops)) return null;
    return data;
  } catch {
    return null;
  }
}

export function stateEmoji(state: string): string {
  switch ((state || '').toLowerCase()) {
    case 'working':
      return '🟢';
    case 'idle':
      return '🟡';
    case 'dead':
      return '🔴';
    default:
      return '⚪';
  }
}

export function agoLabel(iso: string, nowMs: number): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return 'unknown';
  const s = Math.max(0, Math.round((nowMs - t) / 1000));
  if (s < 90) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 90) return `${m}m ago`;
  return `${Math.round(m / 60)}h ago`;
}

export function isStale(iso: string, nowMs: number, maxMs: number = STALE_MS): boolean {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return true;
  return nowMs - t > maxMs;
}

/** `/loops` — one-line-per-loop overview. */
export function formatLoopsStatus(data: FleetStatus | null, nowMs: number): string {
  if (!data) {
    return '⚠️ No fleet status available (/tmp/fleet-status.json missing or unreadable). Is the keepalive supervisor running?';
  }
  const staleTag = isStale(data.updated, nowMs) ? ' ⚠️ STALE' : '';
  const header = `🛰️ Fleet loops (updated ${agoLabel(data.updated, nowMs)}${staleTag}):`;
  if (data.loops.length === 0) return `${header}\n(no loops reporting)`;
  const lines = data.loops.map((l) => {
    const last = (l.last || '').trim();
    const tail = last ? ` — ${last.slice(0, 60)}` : '';
    return `${stateEmoji(l.state)} ${l.session}: ${l.state}${tail}`;
  });
  return [header, ...lines, '', 'Use /loop <name> for detail.'].join('\n');
}

/** `/loop <name>` — detail for one loop. */
export function formatLoopDetail(data: FleetStatus | null, name: string, nowMs: number): string {
  if (!data) return '⚠️ No fleet status available.';
  const q = (name || '').trim().toLowerCase();
  const names = data.loops.map((l) => l.session).join(', ');
  if (!q) return `Usage: /loop <name> (e.g. /loop zoe). Loops: ${names}`;
  const loop = data.loops.find((l) => l.session.toLowerCase() === q);
  if (!loop) return `No loop named "${name}". Loops: ${names}`;
  const last = (loop.last || '').trim() || '(no recent output line)';
  return [
    `${stateEmoji(loop.state)} Loop: ${loop.session}`,
    `State: ${loop.state}`,
    `Fleet updated: ${agoLabel(data.updated, nowMs)}${isStale(data.updated, nowMs) ? ' ⚠️ STALE' : ''}`,
    `Last line: ${last}`,
  ].join('\n');
}
