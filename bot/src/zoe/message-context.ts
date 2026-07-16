/**
 * message-context.ts - Persistent store for mapping Telegram message IDs to ZOE contexts.
 *
 * When ZOE posts a question message (or a task status), we record the message ID
 * so that when Zaal replies to that specific message, we can route his reply with
 * the correct context (qid for questions, taskId for tasks).
 *
 * Storage: ~/.zao/zoe/.zoe-msg-context.json
 * Format: { [messageId]: { qid?: string; taskId?: string; questionText?: string; ts: string } }
 */

import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const ZOE_HOME = process.env.ZOE_HOME ?? join(homedir(), '.zao', 'zoe');
const CONTEXT_PATH = join(ZOE_HOME, '.zoe-msg-context.json');

export interface MessageContext {
  qid?: string;
  taskId?: string;
  questionText?: string;
  ts: string;
}

/**
 * Ensure the context store exists and is writable.
 */
async function ensureContextStore(): Promise<void> {
  try {
    await fs.stat(ZOE_HOME);
  } catch {
    await fs.mkdir(ZOE_HOME, { recursive: true });
  }

  try {
    await fs.stat(CONTEXT_PATH);
  } catch {
    // File doesn't exist, create it empty
    await fs.writeFile(CONTEXT_PATH, JSON.stringify({}, null, 2), 'utf8');
  }
}

/**
 * Read the entire context map.
 */
async function readContextMap(): Promise<Record<string, MessageContext>> {
  await ensureContextStore();
  try {
    const raw = await fs.readFile(CONTEXT_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Write the context map (overwrites the file).
 */
async function writeContextMap(map: Record<string, MessageContext>): Promise<void> {
  await ensureContextStore();
  await fs.writeFile(CONTEXT_PATH, JSON.stringify(map, null, 2), 'utf8');
}

/**
 * Record a message context when ZOE sends a question or task message.
 * Call this after bot.api.sendMessage() succeeds.
 */
export async function recordMessageContext(
  messageId: number,
  context: Omit<MessageContext, 'ts'>,
): Promise<void> {
  const map = await readContextMap();
  map[String(messageId)] = {
    ...context,
    ts: new Date().toISOString(),
  };
  await writeContextMap(map);
}

/**
 * Get the context for a message ID, or undefined if not found.
 */
export async function getMessageContext(messageId: number): Promise<MessageContext | undefined> {
  const map = await readContextMap();
  return map[String(messageId)];
}

/**
 * Remove a context entry (called after it's been used).
 */
export async function clearMessageContext(messageId: number): Promise<void> {
  const map = await readContextMap();
  delete map[String(messageId)];
  await writeContextMap(map);
}

/**
 * Cleanup: remove stale entries older than maxAgeMs (default 24h).
 * Called periodically to prevent unbounded growth.
 */
export async function cleanupStaleContexts(maxAgeMs = 24 * 60 * 60 * 1000): Promise<number> {
  const map = await readContextMap();
  const now = Date.now();
  const before = Object.keys(map).length;

  for (const [msgId, ctx] of Object.entries(map)) {
    try {
      const age = now - new Date(ctx.ts).getTime();
      if (age > maxAgeMs) {
        delete map[msgId];
      }
    } catch {
      // Invalid timestamp, remove it
      delete map[msgId];
    }
  }

  const after = Object.keys(map).length;
  if (after < before) {
    await writeContextMap(map);
  }
  return before - after;
}
