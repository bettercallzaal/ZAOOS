/**
 * work-park.ts - failed work survives, and can be asked about afterwards.
 *
 * THE PROBLEM (doc 2271, spec in doc 2272)
 * ----------------------------------------
 * `work-loop.ts` deleted a failed item from the queue outright. Three paths, all
 * ending in the same unconditional filter:
 *
 *   1. the tick threw          - reported to Telegram, then deleted
 *   2. research returned ''    - NOT reported anywhere, deleted, and a receipt
 *                                emitted saying resultType: 'success'
 *   3. the doc failed to commit - research that succeeded but did not LAND was
 *                                discarded exactly like research that never ran
 *
 * After any of them, "what happened to that topic?" had no answer. The receipt
 * carries no item id and no error text; the Telegram line is truncated to 120
 * characters and scrolls away; the queue entry is gone.
 *
 * WHY THIS PARKS INSTEAD OF RETRYING
 * ----------------------------------
 * The comment that guarded the old behaviour was RIGHT:
 *
 *     // Remove from queue even on error to avoid infinite retry loop
 *
 * Dequeuing is correct. Deleting the evidence is the bug. Retrying is how this
 * breaks: an item that fails deterministically - a malformed topic, a revoked
 * token, a permanently 404 URL - would burn DAILY_CAP every day forever and
 * starve everything queued behind it. robertkeus/peter reaches the same
 * conclusion from the other side: loopback counts reset each session, so a
 * `blocked` task that re-enters on its own "retries the same wall unbounded".
 *
 * So a parked item costs nothing. The only thing that changes is that it can
 * still be asked about, and an operator can put it back deliberately.
 *
 * WHY APPEND-ONLY JSONL, AND WHY FOLD-PER-ID
 * ------------------------------------------
 * Append-only because a crash midway through rewriting a file is precisely how
 * you lose the thing you were trying to preserve. `runs.ts` already writes
 * append-only JSONL under ~/.zao/zoe, so this is an established shape here.
 *
 * Fold-per-id rather than latest-record-wins. Peter documents that choice as a
 * retirement of its own earlier design, because under latest-wins "every live
 * run shed fields": a later status-only append silently drops the payload an
 * earlier record carried. Here that would mean appending {id, status:'open'}
 * erases the `item` a resume needs. So: later fields overwrite, absent fields
 * inherit, and an explicit null clears.
 */

import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
// Type-only, so this does NOT create a runtime cycle with work-loop.ts.
// The dependency runs one way at runtime: work-loop imports work-park, never
// the reverse - which is also why resumeWork returns the item rather than
// enqueueing it itself.
import type { WorkItem } from './work-loop';

/** Same resolver work-loop.ts uses, so both agree under ZOE_HOME in tests. */
const dir = (): string => process.env.ZOE_HOME || join(homedir(), '.zao', 'zoe');
const PARK = (): string => join(dir(), 'work-parked.jsonl');

export type ParkReason =
  /** The tick threw. */
  | 'error'
  /** Research returned an empty string - the silent path. */
  | 'empty-output'
  /** Research succeeded; the doc/PR did not land. */
  | 'doc-failed'
  /** A human has to answer before this can proceed. */
  | 'needs-input';

/** Where it died. "It failed" is not resumable; the stage is. */
export type ParkStage = 'research' | 'verify' | 'commit' | 'unknown';

export interface ParkRecord {
  /** The work item's id. Records FOLD on this. */
  id: string;
  ts: string;
  status: 'blocked' | 'open';
  reason?: ParkReason;
  /** The original item, so a resume needs nothing else. */
  item?: WorkItem;
  stage?: ParkStage;
  /** Untruncated - the Telegram message is cut to 120 chars, this is not. */
  error?: string;
  /** For needs-input: re-asked verbatim on resume. */
  question?: string;
  /** The operator's answer, appended as its own record. */
  answer?: string;
  /** Research output worth keeping when only the COMMIT failed. */
  output?: string;
  attempts?: number;
}

/** A single appended line. Partial by design - the fold reassembles it. */
type ParkAppend = Partial<ParkRecord> & { id: string };

async function appendRecord(rec: ParkAppend): Promise<void> {
  await fs.mkdir(dir(), { recursive: true });
  await fs.appendFile(PARK(), `${JSON.stringify({ ts: new Date().toISOString(), ...rec })}\n`, 'utf8');
}

async function readLines(): Promise<ParkAppend[]> {
  let raw: string;
  try {
    raw = await fs.readFile(PARK(), 'utf8');
  } catch {
    return []; // no park file yet is a normal empty state, not an error
  }
  const out: ParkAppend[] = [];
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    try {
      const rec = JSON.parse(t) as ParkAppend;
      if (rec && typeof rec.id === 'string') out.push(rec);
    } catch {
      // One corrupt line must not hide every other parked item. Skipping it
      // loses that record; throwing would lose the whole file, which is the
      // failure this module exists to prevent.
      continue;
    }
  }
  return out;
}

/**
 * Fold records per id, in file order.
 *
 * Later fields overwrite. Absent fields inherit. An explicit null clears.
 * NOT latest-record-wins - see the header.
 */
export function foldRecords(records: ParkAppend[]): Map<string, ParkRecord> {
  const byId = new Map<string, ParkRecord>();
  for (const rec of records) {
    const base = byId.get(rec.id) ?? ({ id: rec.id, ts: '', status: 'blocked' } as ParkRecord);
    const merged: Record<string, unknown> = { ...base };
    for (const [k, v] of Object.entries(rec)) {
      if (v === null) delete merged[k];
      else merged[k] = v;
    }
    byId.set(rec.id, merged as unknown as ParkRecord);
  }
  return byId;
}

/** Park a failed item. It leaves the active queue; it does not leave the record. */
export async function parkWork(
  item: WorkItem,
  reason: ParkReason,
  detail: { stage?: ParkStage; error?: string; question?: string; output?: string } = {},
): Promise<void> {
  const prior = (await parkedById()).get(item.id);
  await appendRecord({
    id: item.id,
    status: 'blocked',
    reason,
    item,
    stage: detail.stage ?? 'unknown',
    ...(detail.error ? { error: detail.error } : {}),
    ...(detail.question ? { question: detail.question } : {}),
    ...(detail.output ? { output: detail.output } : {}),
    attempts: (prior?.attempts ?? 0) + 1,
  });
}

/** Park an item because a human has to answer something first. */
export async function askHuman(item: WorkItem, question: string, stage: ParkStage = 'unknown'): Promise<void> {
  await parkWork(item, 'needs-input', { stage, question });
}

async function parkedById(): Promise<Map<string, ParkRecord>> {
  return foldRecords(await readLines());
}

/** Everything currently blocked, newest first. This is what answers "what failed?". */
export async function parkedWork(): Promise<ParkRecord[]> {
  return [...(await parkedById()).values()]
    .filter((r) => r.status === 'blocked')
    .sort((a, b) => (a.ts < b.ts ? 1 : -1));
}

/**
 * Mark a parked item open and hand it back. **Operator-initiated only.**
 *
 * Returns the item so the CALLER re-enqueues it - which keeps the runtime
 * dependency one-way (work-loop -> work-park) and, more importantly, means
 * nothing inside this module can put work back into the queue by itself.
 *
 * Nothing calls this automatically. Not the tick, not the drain, not boot.
 * `work-park.test.ts` asserts that by reading work-loop.ts as source, because
 * "nothing auto-resumes" is a property that only ever fails silently.
 */
export async function resumeWork(id: string, answer?: string): Promise<WorkItem | null> {
  const rec = (await parkedById()).get(id);
  if (!rec || rec.status !== 'blocked' || !rec.item) return null;
  await appendRecord({ id, status: 'open', ...(answer ? { answer } : {}) });
  return rec.item;
}
