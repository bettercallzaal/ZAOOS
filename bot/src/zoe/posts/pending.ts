// Post slate v2 - pending draft persistence + state machine.
// Single in-flight model: at most ONE pending draft at a time. Scheduler
// blocks new fires until pending is dispositioned (POST / REGEN / SKIP)
// or expires (4h absolute TTL, or 3 resends).

import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { ZOE_PATHS } from '../memory';
import type { PostCategory } from './types';

const POSTS_STATE_DIR = join(ZOE_PATHS.home, 'posts');
const PENDING_FILE = join(POSTS_STATE_DIR, 'pending.json');

export const PENDING_TTL_MS = 4 * 60 * 60_000; // 4 hours absolute
export const RESEND_INTERVAL_MS = 30 * 60_000; // 30 minutes between resends
export const MAX_RESENDS = 3;

export interface PendingDraft {
  id: string;
  category: PostCategory;
  text: string;
  createdAt: string;
  lastSentAt: string;
  messageId: number | null;
  resendCount: number;
  state: 'pending' | 'approved' | 'skipped' | 'expired';
}

export async function loadPending(): Promise<PendingDraft | null> {
  try {
    const raw = await fs.readFile(PENDING_FILE, 'utf8');
    const parsed = JSON.parse(raw) as PendingDraft;
    return parsed;
  } catch {
    return null;
  }
}

export async function savePending(p: PendingDraft): Promise<void> {
  await fs.mkdir(POSTS_STATE_DIR, { recursive: true });
  await fs.writeFile(PENDING_FILE, JSON.stringify(p, null, 2), 'utf8');
}

export async function clearPending(): Promise<void> {
  try {
    await fs.unlink(PENDING_FILE);
  } catch {
    // already absent - fine
  }
}

export function isExpired(p: PendingDraft, nowMs: number = Date.now()): boolean {
  return nowMs - new Date(p.createdAt).getTime() > PENDING_TTL_MS;
}

export function shouldResend(p: PendingDraft, nowMs: number = Date.now()): boolean {
  if (p.state !== 'pending') return false;
  if (p.resendCount >= MAX_RESENDS) return false;
  return nowMs - new Date(p.lastSentAt).getTime() > RESEND_INTERVAL_MS;
}

export function newPendingId(category: PostCategory): string {
  const iso = new Date().toISOString().replace(/[:.]/g, '-');
  return `${iso}-${category}`;
}
