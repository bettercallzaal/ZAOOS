/**
 * session-checkpoint.ts — Save/recall "where I left off" per thread.
 *
 * Zaal sends /checkpoint <note> to save a checkpoint for the current thread.
 * Later, when he resumes cold (new terminal, new day), ZOE can offer:
 * "Last checkpoint: <saved note>"
 *
 * Storage: ~/.zao/zoe/checkpoints.json
 * Map: { [threadId]: { checkpoint: string; savedAt: string } }
 *
 * Simple pattern: one-line save, one-line recall. Not full context recovery,
 * just a breadcrumb trail so Zaal can orient quickly.
 */

import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export interface CheckpointEntry {
  checkpoint: string;
  savedAt: string; // ISO timestamp
}

export type Checkpoints = Record<string, CheckpointEntry>;

function checkpointFile(): string {
  return join(homedir(), '.zao', 'zoe', 'checkpoints.json');
}

async function ensureDir(): Promise<void> {
  await fs.mkdir(join(homedir(), '.zao', 'zoe'), { recursive: true });
}

/**
 * Read all saved checkpoints. Returns empty object if file doesn't exist.
 */
async function readCheckpoints(): Promise<Checkpoints> {
  try {
    const raw = await fs.readFile(checkpointFile(), 'utf8');
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? (parsed as Checkpoints) : {};
  } catch {
    return {};
  }
}

/**
 * Write checkpoints to disk. Defensive: ensures dir exists.
 */
async function writeCheckpoints(checkpoints: Checkpoints): Promise<void> {
  await ensureDir();
  await fs.writeFile(checkpointFile(), JSON.stringify(checkpoints, null, 2));
}

/**
 * Save a checkpoint for a thread.
 * threadId: a unique identifier per thread (typically the chat/group ID)
 * checkpoint: what Zaal said (his words, one line preferred)
 */
export async function saveCheckpoint(threadId: string, checkpoint: string): Promise<void> {
  const checkpoints = await readCheckpoints();
  checkpoints[threadId] = {
    checkpoint: checkpoint.trim(),
    savedAt: new Date().toISOString(),
  };
  await writeCheckpoints(checkpoints);
}

/**
 * Retrieve the last checkpoint for a thread.
 * Returns null if no checkpoint exists for this thread.
 */
export async function getCheckpoint(threadId: string): Promise<CheckpointEntry | null> {
  const checkpoints = await readCheckpoints();
  return checkpoints[threadId] ?? null;
}

/**
 * Offer the checkpoint to Zaal (the text he'd see when resuming a thread).
 * Returns a friendly message if a checkpoint exists, or null if not.
 */
export async function offerCheckpoint(threadId: string): Promise<string | null> {
  const entry = await getCheckpoint(threadId);
  if (!entry) return null;

  const hoursAgo = Math.round((Date.now() - Date.parse(entry.savedAt)) / (1000 * 60 * 60));
  const timeStr =
    hoursAgo === 0
      ? 'just now'
      : hoursAgo === 1
        ? '1 hour ago'
        : `${hoursAgo} hours ago`;

  return `Last checkpoint (${timeStr}): ${entry.checkpoint}`;
}

/**
 * Clear a checkpoint (e.g. when a thread is fully resolved).
 */
export async function clearCheckpoint(threadId: string): Promise<void> {
  const checkpoints = await readCheckpoints();
  delete checkpoints[threadId];
  await writeCheckpoints(checkpoints);
}
