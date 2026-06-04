// Post slate v3 - silent drafts backlog (doc 796 Decision 2).
//
// Old behavior: each scheduled slot DM'd a draft immediately (~7 pushes/day,
// the loudest channel). New behavior: slots generate drafts SILENTLY into this
// backlog; once a day a single "N drafts ready - /drafts" notice goes out; Zaal
// pulls them on demand with /drafts, which feeds each into the existing
// POST/REGEN/SKIP review flow (pending.ts / buttons.ts) one at a time.
//
// This file is just the silent backlog + the once-a-day notice sentinel. The
// review state machine is unchanged.

import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { ZOE_PATHS } from '../memory';
import type { PostCategory } from './types';

const POSTS_STATE_DIR = join(ZOE_PATHS.home, 'posts');
const DRAFTS_FILE = join(POSTS_STATE_DIR, 'drafts.json');
const NOTICE_SENTINEL = join(POSTS_STATE_DIR, 'last-batch-notice.txt');

/** Cap the backlog so a quiet week of un-pulled drafts can't grow unbounded. */
export const MAX_QUEUED_DRAFTS = 30;

export interface QueuedDraft {
  id: string;
  category: PostCategory;
  text: string;
  createdAt: string;
}

function newDraftId(category: PostCategory): string {
  const iso = new Date().toISOString().replace(/[:.]/g, '-');
  return `${iso}-${category}`;
}

export async function loadDrafts(): Promise<QueuedDraft[]> {
  try {
    const raw = await fs.readFile(DRAFTS_FILE, 'utf8');
    const arr = JSON.parse(raw) as QueuedDraft[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

async function saveDrafts(drafts: QueuedDraft[]): Promise<void> {
  await fs.mkdir(POSTS_STATE_DIR, { recursive: true });
  // Keep the most recent MAX_QUEUED_DRAFTS (oldest dropped first).
  await fs.writeFile(DRAFTS_FILE, JSON.stringify(drafts.slice(-MAX_QUEUED_DRAFTS), null, 2), 'utf8');
}

/** Silently add a generated draft to the backlog. Returns the new queue depth. */
export async function enqueueDraft(category: PostCategory, text: string): Promise<number> {
  const drafts = await loadDrafts();
  drafts.push({ id: newDraftId(category), category, text, createdAt: new Date().toISOString() });
  await saveDrafts(drafts);
  return Math.min(drafts.length, MAX_QUEUED_DRAFTS);
}

export async function countDrafts(): Promise<number> {
  return (await loadDrafts()).length;
}

/** Remove and return the oldest queued draft (FIFO), or null if empty. */
export async function dequeueDraft(): Promise<QueuedDraft | null> {
  const drafts = await loadDrafts();
  const next = drafts.shift();
  if (!next) return null;
  await saveDrafts(drafts);
  return next;
}

/** Remove a specific draft by id (e.g. after it's posted/skipped from /drafts). */
export async function removeDraft(id: string): Promise<boolean> {
  const drafts = await loadDrafts();
  const filtered = drafts.filter((d) => d.id !== id);
  if (filtered.length === drafts.length) return false;
  await saveDrafts(filtered);
  return true;
}

/**
 * Whether the once-a-day batch notice should fire now. True at most once per
 * ET calendar day, and only when the backlog is non-empty. Writes the sentinel
 * as a side effect when it returns true, so a caller that acts on `true` won't
 * re-notify the same day.
 */
export async function claimDailyBatchNotice(today: string): Promise<boolean> {
  if ((await countDrafts()) === 0) return false;
  try {
    const last = (await fs.readFile(NOTICE_SENTINEL, 'utf8')).trim();
    if (last === today) return false;
  } catch {
    // no sentinel yet
  }
  await fs.mkdir(POSTS_STATE_DIR, { recursive: true });
  await fs.writeFile(NOTICE_SENTINEL, today, 'utf8');
  return true;
}
