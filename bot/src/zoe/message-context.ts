/**
 * message-context.ts - Track message_id -> {qid, taskId, questionText}
 *
 * When ZOE sends a question to Telegram, we track the message ID so that when
 * Zaal replies to that message, we know which question he's answering.
 *
 * Storage at ~/.zao/zoe/.zoe-msg-context.json:
 *  {
 *    "<message_id>": { qid?: string, taskId?: string, questionText?: string },
 *    ...
 *  }
 *
 * This solves Feature 1: REPLY-TO-ROUTE + QUESTION-CONTEXT.
 * When Zaal replies to a message, look it up here and route as [answer:qid].
 */

import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const ZOE_HOME = process.env.ZOE_HOME ?? join(homedir(), '.zao', 'zoe');
const MESSAGE_CONTEXT_PATH = join(ZOE_HOME, '.zoe-msg-context.json');

export interface MessageContext {
  qid?: string;
  taskId?: string;
  questionText?: string;
  timestamp?: number;
}

interface MessageContextMap {
  [messageId: string]: MessageContext;
}

let cachedMap: MessageContextMap | null = null;

/**
 * Load the message context map from disk. Caches in memory for the lifetime
 * of the process.
 */
export async function readMessageContext(): Promise<MessageContextMap> {
  if (cachedMap) {
    return cachedMap;
  }

  try {
    const raw = await fs.readFile(MESSAGE_CONTEXT_PATH, 'utf8');
    cachedMap = JSON.parse(raw);
    return cachedMap;
  } catch {
    // File doesn't exist yet, return empty map
    cachedMap = {};
    return cachedMap;
  }
}

/**
 * Write the message context map to disk and update cache.
 */
export async function writeMessageContext(map: MessageContextMap): Promise<void> {
  cachedMap = map;
  await fs.mkdir(ZOE_HOME, { recursive: true });
  await fs.writeFile(MESSAGE_CONTEXT_PATH, JSON.stringify(map, null, 2), 'utf8');
}

/**
 * Get the context for a specific message ID. Returns null if not found.
 */
export async function getContextForMessage(messageId: number): Promise<MessageContext | null> {
  const map = await readMessageContext();
  return map[String(messageId)] ?? null;
}

/**
 * Track a question that was sent (map message ID to question context).
 * Call this when ZOE sends a question message so we can route replies to it.
 */
export async function trackQuestion(
  messageId: number,
  qid: string,
  questionText: string,
): Promise<void> {
  const map = await readMessageContext();
  map[String(messageId)] = {
    qid,
    questionText,
    timestamp: Date.now(),
  };
  await writeMessageContext(map);
}

/**
 * Track a task that was referenced in a message.
 * Call this when ZOE posts a task status message so reactions can mark it done.
 */
export async function trackTask(messageId: number, taskId: string): Promise<void> {
  const map = await readMessageContext();
  map[String(messageId)] = {
    taskId,
    timestamp: Date.now(),
  };
  await writeMessageContext(map);
}

/**
 * Clean up old entries (older than retentionMs, default 7 days).
 * Run periodically to keep the map from growing unbounded.
 */
export async function cleanOldEntries(retentionMs: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
  const map = await readMessageContext();
  const now = Date.now();
  const filtered: MessageContextMap = {};

  for (const [mid, ctx] of Object.entries(map)) {
    if (!ctx.timestamp || now - ctx.timestamp < retentionMs) {
      filtered[mid] = ctx;
    }
  }

  await writeMessageContext(filtered);
}
