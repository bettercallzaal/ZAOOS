/**
 * lanes-board.ts - /lanes: the Mac's Claude Code lanes, read from a snapshot.
 *
 * Zaal, 2026-09-11, on seeing the board from his phone: "Can we do a combo of
 * telegram message tailscale and maybe an orca option". This is the Telegram
 * half. ZOE cannot see the Mac's terminals, so the Mac pushes a snapshot
 * (zaal-dotfiles bin/zao-board-push, every 5 minutes once installed) to
 * ~/.zao/board-snapshot.json, and this renders it on request. It never
 * pushes on its own: a board nobody asked for is the volume that lost Zaal.
 *
 * The snapshot already carries only rank, state, title, repo, ctx and a
 * scrubbed first line of each lane's question. This file adds nothing to it.
 * A snapshot older than 15 minutes is said to be stale, never shown as now.
 */
import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export interface LaneRow {
  rank: number | null;
  state: string;
  title: string;
  repo: string;
  ctx: number | null;
  question: string;
  /**
   * Over the compact line. OPTIONAL because an older Mac still pushes the six-
   * field payload, and an absent flag must read as false rather than break the
   * render - a phone showing nothing is worse than a phone missing one badge.
   */
  critical?: boolean;
}

export interface LaneSnapshot {
  at: number;
  host: string;
  rows: LaneRow[];
}

export const STALE_AFTER_S = 15 * 60;

export function snapshotPath(): string {
  return process.env.ZOE_BOARD_SNAPSHOT ?? join(homedir(), '.zao', 'board-snapshot.json');
}

const WANTS: Record<string, string> = {
  'choice-prompt': 'picker',
  'asked-question': 'asked',
};

/**
 * A lane wants Zaal if it is asking, OR if it is over the compact line whatever
 * else it is doing.
 *
 * 'ctx-critical' used to be a STATE and this map keyed off it. zaal-dotfiles
 * #212 correctly split criticality into its own field - a lane waiting at 86%
 * now reports state 'waiting' with critical true - and this renderer is the
 * THIRD boundary that string crossed, after the classifier and the push
 * payload. Until all three moved, the phone silently stopped surfacing exactly
 * the lanes that most need him.
 */
function wants(r: LaneRow): string | null {
  if (r.state in WANTS) return WANTS[r.state];
  return r.critical ? 'context full' : null;
}

function name(r: LaneRow): string {
  const ctx = typeof r.ctx === 'number' ? ` ${r.ctx}%` : '';
  return `${r.title || r.repo}${ctx}`;
}

function ago(s: number): string {
  if (s < 90) return `${Math.max(0, Math.round(s))}s`;
  if (s < 5400) return `${Math.round(s / 60)} min`;
  return `${Math.round(s / 3600)}h`;
}

/** Pure: the snapshot and the current time in, the reply text out. */
export function renderLanes(snap: LaneSnapshot | null, nowS: number): string {
  if (!snap || !Array.isArray(snap.rows)) {
    return 'No lane snapshot yet. The Mac pushes one every 5 minutes once zao-board-push is installed (zaal-dotfiles cron/mac.proposed).';
  }
  const age = nowS - snap.at;
  const when = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(snap.at * 1000));
  const lines: string[] = [];
  if (age > STALE_AFTER_S) {
    lines.push(`STALE: this snapshot is ${ago(age)} old. The Mac may be asleep or offline, so this is not now.`);
  }
  lines.push(`Lanes at ${when} ET (${ago(age)} ago, ${snap.host})`);

  const want = snap.rows.filter((r) => wants(r) !== null);
  const rest = snap.rows.filter((r) => wants(r) === null);
  const working = rest.filter((r) => r.state === 'working');
  const waiting = rest.filter((r) => r.state === 'waiting');
  const other = rest.filter((r) => r.state !== 'working' && r.state !== 'waiting');

  if (want.length) {
    lines.push('', `WANT YOU (${want.length}):`);
    for (const r of want) {
      lines.push(`- ${name(r)} [${wants(r)}]${r.question ? `: ${r.question}` : ''}`);
    }
  } else {
    lines.push('', 'Nothing is waiting on you.');
  }
  if (working.length) lines.push('', `WORKING (${working.length}): ${working.map(name).join(', ')}`);
  if (waiting.length) lines.push('', `IDLE AT A PROMPT (${waiting.length}): ${waiting.map(name).join(', ')}`);
  if (other.length) lines.push('', `OTHER (${other.length}): ${other.map((r) => `${name(r)} (${r.state})`).join(', ')}`);
  return lines.join('\n');
}

/** Read the snapshot; null when it is missing or unreadable (render says so). */
export async function readLaneSnapshot(path: string = snapshotPath()): Promise<LaneSnapshot | null> {
  try {
    const parsed = JSON.parse(await fs.readFile(path, 'utf8')) as LaneSnapshot;
    return typeof parsed?.at === 'number' && Array.isArray(parsed.rows) ? parsed : null;
  } catch {
    return null;
  }
}
