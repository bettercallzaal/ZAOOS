/**
 * bonfire-queue.ts — ZOE drains the ZABAL Gamez community submission queue.
 * Phase 2 of doc 781 (Option A: the website owns the Upstash queue, ZOE promotes).
 *
 * The zabalgames website (Vercel edge + Upstash) LPUSHes pending submissions —
 * with the submitter's FID VERIFIED server-side via Farcaster Quick Auth — onto
 * the Upstash LIST `zg:bonfire:pending`. ZOE reads them (LRANGE), a steward
 * approves via the approval machine (see index.ts / approvals.ts), and on approve
 * ZOE promotes the item into the canonical ZABAL Bonfire graph (episode/create,
 * reusing recall.remember — which carries the secret-scan) then removes it
 * (LREM the exact value). Reject = LREM + log, no write.
 *
 * Env:
 *   ZG_UPSTASH_REST_URL    dedicated Upstash DB REST URL for the queue
 *   ZG_UPSTASH_REST_TOKEN  read-write REST token (needs write for LREM)
 *   BONFIRE_STEWARD_FIDS   comma-separated FIDs allowed to approve (v1: just Zaal)
 */

import { remember, type RememberResult } from './recall';

const QUEUE_KEY = 'zg:bonfire:pending';
const REST_URL = process.env.ZG_UPSTASH_REST_URL ?? '';
const REST_TOKEN = process.env.ZG_UPSTASH_REST_TOKEN ?? '';
const CMD_TIMEOUT_MS = 10_000;

export type SubmissionType = 'fact' | 'project' | 'doc';

/** The pending-item contract shared with the website (doc 781 Phase 2). */
export interface BonfireSubmission {
  id: string;
  fid: number;
  username: string | null;
  type: SubmissionType;
  title?: string;
  body: string;
  url?: string;
  source: string; // 'zabalgames-web'
  status: string; // 'pending'
  ts: number;
}

/** A queue entry plus the EXACT raw string — needed for an LREM-by-value. */
export interface QueueEntry {
  item: BonfireSubmission;
  raw: string;
}

export function queueConfigured(): boolean {
  return !!REST_URL && !!REST_TOKEN;
}

function stewardFids(): Set<number> {
  return new Set(
    (process.env.BONFIRE_STEWARD_FIDS ?? '')
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0),
  );
}

/** v1: approval is also gated to Zaal's DM in index.ts; this is the FID list. */
export function isBonfireSteward(fid: number): boolean {
  return stewardFids().has(fid);
}

// --- Upstash REST (POST-array command form; safe for arbitrary values) -------
async function upstash(cmd: (string | number)[]): Promise<unknown> {
  const res = await fetch(REST_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(cmd),
    signal: AbortSignal.timeout(CMD_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Upstash ${cmd[0]} failed: HTTP ${res.status}`);
  const json = (await res.json()) as { result?: unknown; error?: string };
  if (json.error) throw new Error(`Upstash ${cmd[0]} error: ${json.error}`);
  return json.result;
}

/** Parse + validate one raw queue string into a submission, or null if junk. */
export function parseSubmission(raw: string): BonfireSubmission | null {
  let o: Record<string, unknown>;
  try {
    o = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
  const type = o.type;
  if (
    typeof o.id !== 'string' ||
    typeof o.body !== 'string' ||
    !o.body.trim() ||
    (type !== 'fact' && type !== 'project' && type !== 'doc')
  ) {
    return null;
  }
  return {
    id: o.id,
    fid: typeof o.fid === 'number' ? o.fid : Number(o.fid) || 0,
    username: typeof o.username === 'string' ? o.username : null,
    type,
    title: typeof o.title === 'string' ? o.title : undefined,
    body: o.body,
    url: typeof o.url === 'string' ? o.url : undefined,
    source: typeof o.source === 'string' ? o.source : 'unknown',
    status: typeof o.status === 'string' ? o.status : 'pending',
    ts: typeof o.ts === 'number' ? o.ts : Number(o.ts) || 0,
  };
}

/** Read all pending submissions. Never throws on bad items (skips them). */
export async function fetchPending(): Promise<QueueEntry[]> {
  if (!queueConfigured()) return [];
  const result = (await upstash(['LRANGE', QUEUE_KEY, 0, -1])) as string[] | null;
  const out: QueueEntry[] = [];
  for (const raw of result ?? []) {
    const item = parseSubmission(raw);
    if (item) out.push({ item, raw });
  }
  return out;
}

/** Remove an exact entry from the queue (LREM count=1 by value). */
export async function removeFromQueue(raw: string): Promise<number> {
  const result = (await upstash(['LREM', QUEUE_KEY, 1, raw])) as number;
  return typeof result === 'number' ? result : 0;
}

/** Build the canonical episode (with provenance) for a submission. */
export function buildEpisode(item: BonfireSubmission): {
  body: string;
  name: string;
  sourceTag: string;
} {
  const who = item.username ? `@${item.username}` : `fid ${item.fid}`;
  const date = new Date(item.ts || Date.now()).toISOString().slice(0, 10);
  const ref = item.url ? `\nReference: ${item.url}` : '';
  const head = item.title ? `${item.title}\n\n` : '';
  const provenance = `\n\n(Submitted by ${who} (fid ${item.fid}) via ZABAL Gamez, ${date}.)`;
  return {
    body: `${head}${item.body}${ref}${provenance}`,
    name: `zg-submission:${item.type}:${item.id}`,
    sourceTag: item.source || 'zabalgames-web',
  };
}

/** Promote a submission into the canonical graph (episode/create). */
export async function promoteSubmission(item: BonfireSubmission): Promise<RememberResult> {
  return remember(buildEpisode(item));
}

/** Telegram render of a submission under review. */
export function renderSubmission(entry: QueueEntry, remaining: number): string {
  const { item } = entry;
  const who = item.username ? `@${item.username}` : `fid ${item.fid}`;
  const lines = [
    `📥 ZABAL Bonfire submission (${remaining} in queue)`,
    `From: ${who} (fid ${item.fid})`,
    `Type: ${item.type}`,
  ];
  if (item.title) lines.push(`Title: ${item.title}`);
  lines.push('', item.body.slice(0, 1200));
  if (item.url) lines.push('', `Ref: ${item.url}`);
  lines.push('', 'Reply "y" to promote to the graph, "n" to reject.');
  return lines.join('\n');
}
