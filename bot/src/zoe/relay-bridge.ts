/**
 * relay-bridge.ts - Telegram <-> fleet-relay bridge for ZOE.
 *
 * The fleet relay (`~/bin/zao-relay` / `relay`) lets terminals message each other
 * through one shared hub row (tasks.legacy_id = 9000, metadata.relays[]) in the
 * cowork tracker. Terminals pull their own inbox at the shell. This bridge gives
 * Zaal the SAME inbox on his phone: when a relay is addressed to the `zoe` lane,
 * ZOE DMs it to him with a Reply button; his tap/typed answer is relayed back to
 * the original sender's lane - no terminal needed.
 *
 * Why a separate `tg_pushed` flag (not `read`): the terminal auto-grab hook acks
 * with `read`, and the two consumers must not steal messages from each other
 * (one-instance-per-resource, agent-loops rule 9). `tg_pushed` is the bridge's
 * own dedup marker; `read` stays the terminal's. A relay can therefore surface in
 * BOTH the terminal and Telegram - that is the "both options" design, on purpose.
 *
 * Reuses the cowork-tracker REST creds (COWORK_TRACKER_URL/KEY) - the relay hub
 * lives in the same tasks table team-tracker.ts already reads. All IO is
 * best-effort and never throws; the pure helpers are exported for unit tests.
 *
 * SAFETY: reply-to-lane is an INTERNAL fleet message (terminal-to-terminal), not
 * an outbound post/DM to a third party - so it is not a gated action. The bridge
 * is OFF unless ZOE_RELAY_TG_ENABLED === 'true'.
 */

const HUB_LEGACY_ID = '9000';

/** One relay message in the hub. `tg_pushed` is this bridge's dedup marker. */
export interface RelayMsg {
  from: string;
  to: string;
  msg: string;
  ts: string;
  read?: boolean;
  tg_pushed?: boolean;
}

interface HubRow {
  id: string;
  relays: RelayMsg[];
}

// ---------------------------------------------------------------------------
// Pure helpers (unit-tested, no network)
// ---------------------------------------------------------------------------

/** Relays addressed to the `zoe` lane that have not yet been pushed to Telegram.
 *  We do NOT filter on `read` - a relay the terminal already handled still may
 *  not have reached Zaal's phone, and vice versa; `tg_pushed` is the only gate. */
export function pendingInbound(relays: RelayMsg[]): RelayMsg[] {
  return relays.filter((r) => r.to === 'zoe' && !r.tg_pushed);
}

/** Return a NEW relay array with `tg_pushed` set true on the messages whose `ts`
 *  is in `pushedTs`. Pure - the caller PATCHes the result back. */
export function markPushed(relays: RelayMsg[], pushedTs: Set<string>): RelayMsg[] {
  return relays.map((r) => (pushedTs.has(r.ts) ? { ...r, tg_pushed: true } : r));
}

/** Append a ZOE reply to a lane. Pure - returns the new relays array. */
export function appendReply(relays: RelayMsg[], lane: string, msg: string, ts: string): RelayMsg[] {
  return [...relays, { from: 'zoe', to: lane, msg, ts, read: false }];
}

/** qid encoding for a relay-reply question. A qid must not contain ':' (the
 *  question callback parser splits on it), so the lane is joined with '-'. */
export function relayReplyQid(lane: string): string {
  return `rl-${lane}`;
}

/** Extract the target lane from a relay-reply qid, or null if not one. */
export function laneFromReplyQid(qid: string): string | null {
  if (!qid.startsWith('rl-')) return null;
  const lane = qid.slice(3);
  return lane || null;
}

/** Human-readable DM body for an inbound relay. The hint tells Zaal he can just
 *  reply to the message directly (native Telegram reply) - no button tap needed. */
export function formatInboundDm(r: RelayMsg): string {
  const when = (r.ts || '').slice(11, 16);
  return `Relay from ${r.from}${when ? ` (${when})` : ''}:\n\n${r.msg}\n\n(Reply to this message to answer, or tap Reply/Ack.)`;
}

// ---------------------------------------------------------------------------
// Hub IO (best-effort; never throws)
// ---------------------------------------------------------------------------

export function relayBridgeConfigured(): boolean {
  return Boolean(process.env.COWORK_TRACKER_URL && process.env.COWORK_TRACKER_KEY);
}

function creds(): { base: string; key: string } | null {
  const base = process.env.COWORK_TRACKER_URL;
  const key = process.env.COWORK_TRACKER_KEY;
  if (!base || !key) return null;
  return { base: base.replace(/\/$/, ''), key };
}

async function fetchJson(url: string, init?: RequestInit): Promise<unknown> {
  const c = creds();
  if (!c) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      ...init,
      headers: { apikey: c.key, Authorization: `Bearer ${c.key}`, 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : [];
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Read the hub row. Returns null on any error/unconfigured. */
export async function fetchHub(): Promise<HubRow | null> {
  const c = creds();
  if (!c) return null;
  const rows = (await fetchJson(
    `${c.base}/rest/v1/tasks?legacy_id=eq.${HUB_LEGACY_ID}&select=id,metadata`,
  )) as Array<{ id: string; metadata?: { relays?: RelayMsg[] } }> | null;
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return { id: rows[0].id, relays: rows[0].metadata?.relays ?? [] };
}

/** Write the relays array back onto the hub row. Best-effort; returns success. */
export async function saveHubRelays(id: string, relays: RelayMsg[]): Promise<boolean> {
  const c = creds();
  if (!c) return false;
  const out = await fetchJson(`${c.base}/rest/v1/tasks?id=eq.${id}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ metadata: { relays: relays.slice(-500) } }),
  });
  return out !== null;
}

/** Append a ZOE reply to a lane and persist. Best-effort; returns success.
 *  Re-fetches the hub first so a concurrent terminal write is not clobbered. */
export async function sendRelayReply(lane: string, msg: string, ts: string): Promise<boolean> {
  const hub = await fetchHub();
  if (!hub) return false;
  return saveHubRelays(hub.id, appendReply(hub.relays, lane, msg, ts));
}

// ---------------------------------------------------------------------------
// The tick step (push inbound relays to Zaal's DM)
// ---------------------------------------------------------------------------

export interface RelayBridgeDeps {
  /** Zaal's DM chat id (ZAAL_DM_ID). */
  chatId: number;
  /** grammy bot.api.sendMessage - returns the sent Message (we read message_id). */
  sendMessage: (chatId: number, text: string, options?: unknown) => Promise<{ message_id?: number } | unknown>;
  /** Monotonic timestamp for the mark-pushed write (injected so tests are deterministic). */
  now: () => string;
  /** Register the sent message's id -> reply-qid so a NATIVE Telegram reply to the
   *  relay message routes back to the lane with no button tap. Best-effort, optional. */
  recordContext?: (messageId: number, qid: string) => Promise<void>;
}

/** One "Reply" (arms freetext) + one "Ack" quick button, both routed by qid. */
function replyKeyboard(lane: string): unknown {
  const qid = relayReplyQid(lane);
  // TYPE_SENTINEL '__type__' arms index.ts pendingTypeAnswers so the next typed
  // message is captured as this qid's answer. 'ack' is a one-tap acknowledgement.
  return {
    inline_keyboard: [
      [{ text: 'Reply', callback_data: `q:${qid}:${Buffer.from('__type__', 'utf8').toString('base64url')}` }],
      [{ text: 'Ack', callback_data: `q:${qid}:${Buffer.from('ack', 'utf8').toString('base64url')}` }],
    ],
  };
}

/**
 * Push every not-yet-pushed inbound `zoe` relay to Zaal's DM with a Reply button,
 * then mark them pushed. Best-effort; returns the count pushed. Caller gates on
 * ZOE_RELAY_TG_ENABLED.
 */
export async function pushInboundRelays(deps: RelayBridgeDeps): Promise<number> {
  const hub = await fetchHub();
  if (!hub) return 0;
  const pending = pendingInbound(hub.relays);
  if (pending.length === 0) return 0;

  const pushedTs = new Set<string>();
  for (const r of pending) {
    try {
      const sent = await deps.sendMessage(deps.chatId, formatInboundDm(r), { reply_markup: replyKeyboard(r.from) });
      pushedTs.add(r.ts);
      // Register message_id -> rl-<lane> so a plain reply to THIS message routes
      // back to the lane (no button tap). Best-effort - never blocks the push.
      const mid = (sent as { message_id?: number } | null)?.message_id;
      if (mid && deps.recordContext) {
        await deps.recordContext(mid, relayReplyQid(r.from)).catch(() => {});
      }
    } catch {
      // one send failure does not block the others; leave it unpushed to retry next tick
    }
  }
  if (pushedTs.size > 0) {
    // Re-fetch so a concurrent terminal write is not clobbered, then mark pushed.
    const fresh = (await fetchHub()) ?? hub;
    await saveHubRelays(fresh.id, markPushed(fresh.relays, pushedTs));
  }
  return pushedTs.size;
}
