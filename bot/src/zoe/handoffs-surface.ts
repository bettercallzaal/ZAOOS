/**
 * Surface new handoff-inbox items in the ZAAL BOTZ Handoffs topic. A /handoff
 * drops a tracker row (legacy_source "handoff:<slug>") that feeds the cockpit
 * HANDOFFS lane; this posts each NEW one into the Handoffs topic so a handoff
 * shows up there without Zaal pasting or opening the cockpit. Best-effort +
 * de-duped via a last-seen timestamp.
 */
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const ZOE_HOME = process.env.ZOE_HOME ?? join(homedir(), '.zao', 'zoe');
const SEEN_PATH = join(ZOE_HOME, 'handoffs-seen.json');
const REQUEST_TIMEOUT_MS = 8000;

interface HandoffRow {
  title: string;
  legacy_source: string | null;
  created_at: string | null;
}

async function lastSeen(): Promise<string> {
  try {
    return (JSON.parse(await fs.readFile(SEEN_PATH, 'utf8')) as { at: string }).at;
  } catch {
    // First run: only surface handoffs from the last hour, not the whole backlog.
    return new Date(Date.now() - 3_600_000).toISOString();
  }
}

async function setLastSeen(at: string): Promise<void> {
  await fs.mkdir(ZOE_HOME, { recursive: true });
  await fs.writeFile(SEEN_PATH, JSON.stringify({ at }));
}

/** Handoff rows created after `since`. Best-effort: [] on any failure. */
async function fetchNewHandoffs(since: string): Promise<HandoffRow[]> {
  const base = process.env.COWORK_TRACKER_URL;
  const key = process.env.COWORK_TRACKER_KEY;
  if (!base || !key) return [];
  const url =
    `${base.replace(/\/$/, '')}/rest/v1/tasks` +
    `?legacy_source=like.handoff:*&created_at=gt.${encodeURIComponent(since)}` +
    `&select=title,legacy_source,created_at&order=created_at.asc&limit=20`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const res = await fetch(url, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: controller.signal,
      cache: 'no-store',
    }).finally(() => clearTimeout(timer));
    if (!res.ok) return [];
    return (await res.json()) as HandoffRow[];
  } catch {
    return [];
  }
}

/**
 * Post any new handoff items to the Handoffs topic. `postToTopic` sends one
 * message to that topic. Returns how many were surfaced. Best-effort.
 */
export async function surfaceNewHandoffs(
  postToTopic: (text: string) => Promise<unknown>,
): Promise<number> {
  const since = await lastSeen();
  const rows = await fetchNewHandoffs(since);
  if (rows.length === 0) return 0;
  let maxAt = since;
  for (const r of rows) {
    const line = (r.title ?? 'Handoff').slice(0, 300);
    await postToTopic(line).catch(() => {});
    if (r.created_at && r.created_at > maxAt) maxAt = r.created_at;
  }
  await setLastSeen(maxAt);
  return rows.length;
}
