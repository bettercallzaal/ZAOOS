/**
 * thread-memory.ts — open-threads → Bonfire emit (doc 796 Move 2, Layer B).
 *
 * Decision 4: Bonfire is ZOE's durable, cross-agent memory backbone. When a
 * thread opens / resolves / drops, ZOE writes a natural-language episode to the
 * ZABAL graph so Hermes / Devz / future agents can recall "what did Zaal commit
 * to" without touching ZOE's private threads.json.
 *
 * Highest-leakage path in the stack (graph-wide queryable), so EVERY emit runs
 * BOTH guards before POST and SKIPS on a match:
 *   - containsSecret (recall.ts) — API keys / private keys / tokens
 *   - containsPii    (pii.ts)    — emails / phones / addresses / handles
 * This closes the gap the pii-hygiene rule flagged: the Bonfire write path did
 * not previously scan for personal data.
 *
 * Graceful degradation: Bonfire lives on the VPS and can be unreachable. A
 * failed emit (network/HTTP, NOT a scan-skip) is queued to disk and retried by
 * flushEmitQueue(); the hot threads.json store stays the source of truth for
 * live behavior, so a down graph never blocks a reminder.
 */

import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { ZOE_PATHS } from './memory';
import { remember, containsSecret, bonfireConfigured } from './recall';
import { containsPii, scanPii } from './pii';
import { setBonfireId, type OpenThread } from './threads';

const EMIT_QUEUE_FILE = join(ZOE_PATHS.home, 'thread-emit-queue.json');
const MAX_QUEUE = 200;

export type ThreadTransition = 'open' | 'resolved' | 'dropped';

export interface ThreadEmitResult {
  ok: boolean;
  episodeId?: string;
  /** Why no episode was written, when ok=false. */
  skipped?: 'no-config' | 'secret-detected' | 'pii-detected' | 'send-failed-queued';
}

interface QueuedEmit {
  threadId: string;
  transition: ThreadTransition;
  body: string;
  name: string;
  queuedAt: string;
}

/** Compose the prose episode body for a thread transition. */
export function buildThreadEpisodeBody(t: OpenThread, transition: ThreadTransition): string {
  const due = t.dueAt ? ` Due ${t.dueAt.slice(0, 16).replace('T', ' ')} UTC.` : '';
  switch (transition) {
    case 'open':
      return `Zaal committed to: ${t.summary}.${due} ZOE is tracking this as an open thread.`;
    case 'resolved':
      return `Zaal resolved a commitment: ${t.summary}. It is done.`;
    case 'dropped':
      return `Zaal dropped a commitment: ${t.summary}. It will not be pursued.`;
  }
}

function episodeName(t: OpenThread, transition: ThreadTransition): string {
  return `zoe-thread-${transition}:${t.id}`;
}

/**
 * Emit a thread transition to Bonfire, gated by both scans. On a transient
 * send failure the episode is queued for retry. On a scan match it is dropped
 * (never queued — we do not retry leaking content). On `open`, a successful
 * emit stamps the episode id back onto the hot thread.
 */
export async function emitThreadTransition(
  t: OpenThread,
  transition: ThreadTransition,
): Promise<ThreadEmitResult> {
  if (!bonfireConfigured()) return { ok: false, skipped: 'no-config' };

  const body = buildThreadEpisodeBody(t, transition);
  const name = episodeName(t, transition);

  if (containsSecret(body)) {
    console.warn(`[zoe/thread-memory] emit blocked — secret-shaped string in ${name}`);
    return { ok: false, skipped: 'secret-detected' };
  }
  if (containsPii(body)) {
    const kinds = [...new Set(scanPii(body).map((m) => m.kind))].join(',');
    console.warn(`[zoe/thread-memory] emit blocked — PII (${kinds}) in ${name}`);
    return { ok: false, skipped: 'pii-detected' };
  }

  const r = await remember({ body, name, sourceTag: `zoe:thread-${transition}` });
  if (r.ok) {
    if (transition === 'open' && r.taskId) {
      await setBonfireId(t.id, r.taskId).catch(() => {});
    }
    return { ok: true, episodeId: r.taskId };
  }

  // Skips from remember() (no-config / secret / empty) are terminal, not queued.
  if (r.skipped) return { ok: false, skipped: 'no-config' };

  // A genuine send failure (HTTP/network) — queue for retry, never block.
  await enqueueEmit({ threadId: t.id, transition, body, name, queuedAt: new Date().toISOString() });
  console.warn(`[zoe/thread-memory] emit queued for retry — ${name}: ${r.error ?? 'send failed'}`);
  return { ok: false, skipped: 'send-failed-queued' };
}

// ---- retry queue ------------------------------------------------------------

async function loadQueue(): Promise<QueuedEmit[]> {
  try {
    const raw = await fs.readFile(EMIT_QUEUE_FILE, 'utf8');
    const arr = JSON.parse(raw) as QueuedEmit[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

async function saveQueue(q: QueuedEmit[]): Promise<void> {
  await fs.mkdir(ZOE_PATHS.home, { recursive: true });
  await fs.writeFile(EMIT_QUEUE_FILE, JSON.stringify(q.slice(-MAX_QUEUE), null, 2), 'utf8');
}

async function enqueueEmit(item: QueuedEmit): Promise<void> {
  const q = await loadQueue();
  q.push(item);
  await saveQueue(q);
}

/**
 * Retry queued emits (call from a low-frequency scheduler tick). Re-scans each
 * body before re-sending — content that now trips a guard is dropped from the
 * queue rather than re-attempted. Returns counts for observability.
 */
export async function flushEmitQueue(): Promise<{ sent: number; kept: number; dropped: number }> {
  if (!bonfireConfigured()) return { sent: 0, kept: 0, dropped: 0 };
  const q = await loadQueue();
  if (q.length === 0) return { sent: 0, kept: 0, dropped: 0 };

  const remaining: QueuedEmit[] = [];
  let sent = 0;
  let dropped = 0;

  for (const item of q) {
    if (containsSecret(item.body) || containsPii(item.body)) {
      dropped += 1;
      continue;
    }
    const r = await remember({ body: item.body, name: item.name, sourceTag: `zoe:thread-${item.transition}` });
    if (r.ok) {
      sent += 1;
      if (item.transition === 'open' && r.taskId) await setBonfireId(item.threadId, r.taskId).catch(() => {});
    } else if (r.skipped) {
      dropped += 1; // terminal skip
    } else {
      remaining.push(item); // still failing — keep for next flush
    }
  }

  await saveQueue(remaining);
  return { sent, kept: remaining.length, dropped };
}
