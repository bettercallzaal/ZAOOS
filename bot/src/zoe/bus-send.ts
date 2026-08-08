/**
 * bus-send.ts - make the reply instruction in every bus message actually work.
 *
 * THE BUG. Every message `bus-poll.py` pushes to Telegram ends with:
 *
 *     TO REPLY: type   reply eb8238 <your words>
 *
 * Typing that does nothing. Nothing in ZOE parses it, so it falls through to the
 * concierge and is answered as ordinary chat. The instruction has been a lie for
 * as long as the poller has been running.
 *
 * bus-bridge.ts already had `parseBusReply()` for exactly this and was left
 * deliberately unwired - its header says "the live wiring is a small reviewed
 * step". This is that step. The parsing was never the missing part; the send was.
 *
 * This is the same failure as the POST button that re-sent the draft instead of
 * publishing: a surface that TELLS you to do something and then ignores you is
 * worse than one that offers nothing, because you blame yourself first.
 *
 * HONEST WHEN UNCONFIGURED. BUS_URL / BUS_TOKEN are not set on the live host
 * today, so this cannot actually deliver yet. It says so, in one line, and shows
 * what it would have sent - rather than silently swallowing the reply or claiming
 * a success that did not happen (silent-failure-guard).
 */

export interface BusSendResult {
  ok: boolean;
  /** What to say back in Telegram. Always present - never a silent outcome. */
  reply: string;
  /** Set when the send failed or was impossible, for logs. */
  reason?: string;
}

export interface BusConfig {
  url?: string;
  token?: string;
}

export function busConfig(): BusConfig {
  return { url: process.env.BUS_URL || '', token: process.env.BUS_TOKEN || '' };
}

export function busConfigured(cfg: BusConfig = busConfig()): boolean {
  return Boolean(cfg.url && cfg.token);
}

/**
 * Deliver a reply to the partner bus.
 *
 * `to` defaults to the coordinator because that is who the poller surfaces; a
 * caller that knows better should pass it explicitly rather than let this guess.
 */
export async function sendBusReply(
  input: { to: string; subject: string; body: string },
  cfg: BusConfig = busConfig(),
  fetchImpl: typeof fetch = fetch,
): Promise<BusSendResult> {
  const body = (input.body || '').trim();
  if (!body) {
    return { ok: false, reply: 'Nothing to send - the reply was empty.', reason: 'empty' };
  }

  if (!busConfigured(cfg)) {
    // Do NOT pretend. Show him exactly what would have gone out so the thinking
    // is not wasted, and name the one thing that is missing.
    return {
      ok: false,
      reason: 'unconfigured',
      reply:
        'Bus not connected - BUS_URL and BUS_TOKEN are not set, so this did not send.\n\n' +
        `Would have sent to ${input.to}:\n"${body.slice(0, 500)}"\n\n` +
        'Set both on the VPS and send it again.',
    };
  }

  try {
    const res = await fetchImpl(`${cfg.url!.replace(/\/$/, '')}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.token}`,
      },
      body: JSON.stringify({ to: input.to, subject: input.subject, body }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      return {
        ok: false,
        reason: `http ${res.status}`,
        reply: `Bus rejected it (${res.status}). Your text is safe - try again or check the bus.`,
      };
    }
    const data = (await res.json().catch(() => ({}))) as { id?: string };
    const id = data.id ? ` (id ${String(data.id).slice(0, 8)})` : '';
    return { ok: true, reply: `Sent to ${input.to}${id}.` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'request failed';
    return {
      ok: false,
      reason: msg,
      reply: `Could not reach the bus: ${msg.slice(0, 120)}\n\nYour text is safe - try again.`,
    };
  }
}

/** Subject line for a reply, derived from what we are replying to. */
export function replySubject(originalSubject?: string): string {
  const s = (originalSubject || '').trim();
  if (!s) return 'Re: (no subject)';
  return s.toLowerCase().startsWith('re:') ? s : `Re: ${s}`;
}
