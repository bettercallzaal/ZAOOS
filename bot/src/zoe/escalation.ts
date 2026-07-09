/**
 * escalation.ts - resend super-important pings Zaal hasn't acknowledged.
 *
 * Operating-model rule 5 (feedback_assistant_operating_model): "ZOE resends
 * super-important pings if Zaal does not reply/react in Telegram." Regular
 * pings stay one-shot; only pings recorded as CRITICAL (a P0, a deadline-today,
 * or a needs-your-decision) get one escalation resend if they go unacked past a
 * window. "Acked" = Zaal sent ANY message after the ping (read from ZOE's recent
 * ring buffer). Doc 989 (wheel-and-spoke, backlog item 2).
 *
 * The planner is pure so the escalate/skip logic is unit-tested without I/O.
 */

import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { ZOE_PATHS } from './memory';

export interface CriticalPing {
  id: string;
  text: string;
  chatId: number;
  sentAt: string; // ISO
  resent: boolean;
}

/** Default: resend a critical ping unacked after 45 min. */
export const ESCALATION_WINDOW_MS = 45 * 60 * 1000;

function statePath(): string {
  return join(ZOE_PATHS.home, 'critical-escalations.json');
}

async function readPings(): Promise<CriticalPing[]> {
  try {
    const raw = await fs.readFile(statePath(), 'utf8');
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as CriticalPing[]) : [];
  } catch {
    return [];
  }
}

async function writePings(pings: CriticalPing[]): Promise<void> {
  // Keep the file small: only pings from the last 24h.
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const kept = pings.filter((p) => Date.parse(p.sentAt) >= cutoff);
  await fs.mkdir(ZOE_PATHS.home, { recursive: true });
  await fs.writeFile(statePath(), JSON.stringify(kept, null, 2));
}

/** Record a ping as critical so it can be escalated if unacked. */
export async function recordCriticalPing(text: string, chatId: number, now: number = Date.now()): Promise<void> {
  const pings = await readPings();
  pings.push({
    id: `crit-${now}-${Math.random().toString(36).slice(2, 6)}`,
    text,
    chatId,
    sentAt: new Date(now).toISOString(),
    resent: false,
  });
  await writePings(pings);
}

/**
 * PURE planner: which critical pings should be resent right now?
 * A ping escalates iff: not already resent, past the window, AND Zaal has not
 * replied since it was sent (lastUserReplyAt is null or older than the ping).
 */
export function planEscalations(
  pings: CriticalPing[],
  lastUserReplyAt: string | null,
  now: number = Date.now(),
  windowMs: number = ESCALATION_WINDOW_MS,
): CriticalPing[] {
  const replyMs = lastUserReplyAt ? Date.parse(lastUserReplyAt) : 0;
  return pings.filter((p) => {
    if (p.resent) return false;
    const sentMs = Date.parse(p.sentAt);
    if (now - sentMs < windowMs) return false; // not old enough yet
    if (replyMs >= sentMs) return false; // Zaal replied after it -> acked
    return true;
  });
}

/**
 * Best-effort read of when Zaal last messaged, from ZOE's recent ring buffer
 * (~/.zao/zoe/recent/<chatId>.json). DEFENSIVE: any parse doubt returns "now"
 * (treated as just-replied), so a format change can never cause escalation spam
 * - escalation only fires when we can CONFIDENTLY see no recent reply.
 */
export async function readLastUserReplyAt(chatId: number, now: number = Date.now()): Promise<string | null> {
  const safe = new Date(now).toISOString(); // "just replied" -> won't escalate
  try {
    const raw = await fs.readFile(join(ZOE_PATHS.home, 'recent', `${chatId}.json`), 'utf8');
    const data = JSON.parse(raw);
    const turns: unknown[] = Array.isArray(data) ? data : Array.isArray((data as { turns?: unknown[] })?.turns) ? (data as { turns: unknown[] }).turns : [];
    let latest = 0;
    for (const t of turns) {
      const o = (t ?? {}) as Record<string, unknown>;
      const role = String(o.role ?? o.from ?? o.sender ?? '').toLowerCase();
      const isUser = role === 'user' || role === 'zaal' || role === 'human';
      if (!isUser) continue;
      const tsRaw = o.at ?? o.sentAt ?? o.date ?? o.ts ?? o.timestamp;
      const ms = typeof tsRaw === 'number' ? tsRaw : typeof tsRaw === 'string' ? Date.parse(tsRaw) : NaN;
      if (Number.isFinite(ms)) latest = Math.max(latest, ms as number);
    }
    if (latest === 0) return safe; // couldn't identify a user turn -> be conservative
    return new Date(latest).toISOString();
  } catch {
    return safe;
  }
}

/**
 * Read state, resend any unacked critical pings via sendFn, mark them resent.
 * Best-effort; never throws. Returns how many were resent. The caller supplies
 * lastUserReplyAt (ISO of Zaal's most recent message) so the ack check stays
 * testable and this module doesn't reach into the recent buffer format.
 */
export async function checkAndResend(
  sendFn: (chatId: number, text: string) => Promise<void>,
  lastUserReplyAt: string | null,
  now: number = Date.now(),
): Promise<number> {
  try {
    const pings = await readPings();
    const toResend = planEscalations(pings, lastUserReplyAt, now);
    if (toResend.length === 0) return 0;
    const resentIds = new Set<string>();
    for (const p of toResend) {
      try {
        await sendFn(p.chatId, `Following up - you have not replied to this yet:\n\n${p.text}`);
        resentIds.add(p.id);
      } catch {
        // leave un-resent so a later tick retries
      }
    }
    if (resentIds.size > 0) {
      await writePings(pings.map((p) => (resentIds.has(p.id) ? { ...p, resent: true } : p)));
    }
    return resentIds.size;
  } catch {
    return 0;
  }
}
