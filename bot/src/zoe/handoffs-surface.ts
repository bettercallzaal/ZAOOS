/**
 * Surface new handoff-inbox items in the ZAAL BOTZ Handoffs topic. A /handoff
 * drops a tracker row (legacy_source "handoff:<slug>") that feeds the cockpit
 * HANDOFFS lane; this posts each NEW one into the Handoffs topic so a handoff
 * shows up there without Zaal pasting or opening the cockpit. Best-effort +
 * de-duped via a last-seen timestamp.
 *
 * THE CURSOR ONLY MOVES OVER DELIVERED ROWS. The last-seen timestamp is a
 * high-water mark and the query is `created_at=gt.<since>`, so a row the cursor
 * skips past is never fetched again - there is no second chance. Advancing it
 * over a send that did not arrive is permanent loss of a handoff, which is the
 * one artifact a session writes precisely so the next session can read it.
 * Two ways a send fails to arrive without throwing out of the loop below:
 *
 *   - a Telegram error (429, network blip, a bad thread id) - previously
 *     swallowed by a bare `.catch(() => {})` on the post itself;
 *   - the per-day send budget (send-budget.ts), which does not throw at all: a
 *     dropped send RESOLVES with `{ message_id: 0, zoeSendBudget }`, so the
 *     ordinary "it did not reject, so it worked" test says delivered.
 *
 * So each post is checked for BOTH, and the cursor stops at the last row that
 * actually landed. Rows are fetched `created_at.asc`, so stopping on the first
 * failure leaves it and everything after it in range for the next 10-minute
 * tick. The return value is the DELIVERED count, not the fetched count - the
 * scheduler logs it, and a number that counts messages nobody got is the same
 * silent success this fix removes.
 *
 * Mirrors the fix in zaostock-approvals-surface.ts, which was modelled on this
 * file's cursor while this file still had the bug.
 */
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

import { wasSendBlocked } from './send-budget';

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
 * message to that topic. Returns how many were DELIVERED. Best-effort: it
 * never throws, but it also never advances the cursor past a row that did not
 * arrive - see the header.
 */
export async function surfaceNewHandoffs(
  postToTopic: (text: string) => Promise<unknown>,
): Promise<number> {
  const since = await lastSeen();
  const rows = await fetchNewHandoffs(since);
  if (rows.length === 0) return 0;
  let maxAt = since;
  let delivered = 0;
  for (const r of rows) {
    const line = (r.title ?? 'Handoff').slice(0, 300);
    const where = `handoff ${delivered + 1}/${rows.length} (${r.legacy_source ?? 'unknown'})`;
    try {
      const result = await postToTopic(line);
      if (wasSendBlocked(result)) {
        // Blocked by the send budget. It resolved, so nothing threw - the only
        // way to see it is to ask.
        console.warn(
          `[zoe/handoffs-surface] ${where} blocked by the send budget - seen cursor held at ${maxAt}, retrying next tick`,
        );
        break;
      }
    } catch (err) {
      console.warn(
        `[zoe/handoffs-surface] ${where} failed to send (${(err as Error).message}) - seen cursor held at ${maxAt}, retrying next tick`,
      );
      break;
    }
    delivered++;
    if (r.created_at && r.created_at > maxAt) maxAt = r.created_at;
  }
  // Nothing landed: leave the cursor untouched so the whole batch is re-fetched.
  if (delivered === 0) return 0;
  await setLastSeen(maxAt);
  return delivered;
}
