/**
 * outbox.ts - durable record of APPROVED outbound drafts.
 *
 * When Zaal taps Post on a cast/newsletter draft, ZOE cannot actually send it
 * yet: the ZOL signer lives on the Pi (unreachable from the VPS) and the
 * newsletter builder is a separate Supabase project. Rather than fake a "Posted"
 * (dishonest - nothing sent), the tap appends the approved item here. This is
 * the ZOE-side half of the eventual bridge: a future Pi drainer (or the
 * newsletter sync) reads this outbox and actually casts/publishes. Until then
 * it is an honest, durable "approved, awaiting send" queue that survives restart
 * (the in-memory drafts do not).
 *
 * JSONL, one file per channel under ~/.zao/zoe/outbox/. Best-effort: a write
 * failure returns null and the caller surfaces it - it never throws into the
 * Telegram handler.
 */
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const ZOE_HOME = process.env.ZOE_HOME ?? join(homedir(), '.zao', 'zoe');
const OUTBOX_DIR = join(ZOE_HOME, 'outbox');

export interface OutboxEntry {
  kind: string;
  text: string;
  approvedAt: string;
  sent: boolean;
}

/** Which channel a draft kind belongs to (selects the outbox file + wording). */
export type OutboxChannel = 'cast' | 'newsletter';

/** Map a draft kind to its outbox channel, or null if it is not an outbox kind
 *  (e.g. a plain proactive-post that the current [POSTED] path already handles). */
export function outboxChannelFor(kind: string): OutboxChannel | null {
  if (kind.endsWith('-cast')) return 'cast';
  if (kind === 'newsletter') return 'newsletter';
  return null;
}

/** Build the JSONL line for an approved entry. Pure - unit-testable. */
export function outboxLine(kind: string, text: string, now: number): string {
  const entry: OutboxEntry = {
    kind,
    text,
    approvedAt: new Date(now).toISOString(),
    sent: false,
  };
  return JSON.stringify(entry);
}

/** The file an entry of this channel lands in. */
export function outboxPathFor(channel: OutboxChannel): string {
  return join(OUTBOX_DIR, `${channel}.jsonl`);
}

/**
 * Append an approved draft to its channel's outbox. Returns the channel so the
 * caller can word the confirmation, or null if the kind is not an outbox kind.
 * Best-effort: throws only if fs is truly broken; caller catches.
 */
export async function appendApproved(
  kind: string,
  text: string,
  now: number = Date.now(),
): Promise<OutboxChannel | null> {
  const channel = outboxChannelFor(kind);
  if (!channel) return null;
  await fs.mkdir(OUTBOX_DIR, { recursive: true });
  await fs.appendFile(outboxPathFor(channel), outboxLine(kind, text, now) + '\n');
  return channel;
}
