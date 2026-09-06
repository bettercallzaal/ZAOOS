import { describe, it, expect, vi } from 'vitest';
import { sendToZaal, type TelegramRoutingDeps } from '../telegram-routing';
import { wasSendBlocked } from '../send-budget';

// sendToZaal is the router most ZOE sends go through, and several of its
// callers write durable state on the strength of a send (proactive.recordPush,
// threads.markNudged, nudges.markNudgeSent). The per-day send budget wraps
// bot.api.sendMessage at boot and a blocked send RESOLVES with
// `{ message_id: 0, zoeSendBudget }` rather than throwing - so the router MUST
// pass that value back, or no caller downstream of it can tell a delivered
// message from a dropped one.
//
// It used to hard-return `undefined` under a comment claiming it returned the
// last message.

const BLOCKED = { message_id: 0, zoeSendBudget: 'dropped' as const };
const DELIVERED = { message_id: 42, chat: { id: 111 } };

function depsWith(sendMessage: TelegramRoutingDeps['sendMessage']): TelegramRoutingDeps {
  return { sendMessage, zaalId: 111 };
}

describe('sendToZaal surfaces the send-budget verdict', () => {
  it('returns a blocked result so wasSendBlocked can see it', async () => {
    const send = vi.fn().mockResolvedValue(BLOCKED);
    const res = await sendToZaal(depsWith(send), 'nudge', { kind: 'status' });
    expect(wasSendBlocked(res)).toBe(true);
  });

  it('returns the delivered message for a send that actually went out', async () => {
    const send = vi.fn().mockResolvedValue(DELIVERED);
    const res = await sendToZaal(depsWith(send), 'nudge', { kind: 'status' });
    expect(wasSendBlocked(res)).toBe(false);
    expect(res).toEqual(DELIVERED);
  });

  it('reports a partially blocked multi-chunk message as blocked', async () => {
    // First chunk lands, the cap is spent mid-message, the rest is dropped.
    // Zaal did not receive the message; recording delivery for the half he got
    // is the same loss in a smaller box.
    const send = vi
      .fn()
      .mockResolvedValueOnce(DELIVERED)
      .mockResolvedValue(BLOCKED);
    const longText = 'x'.repeat(5000);
    const res = await sendToZaal(depsWith(send), longText, { kind: 'status' });
    expect(send.mock.calls.length).toBeGreaterThan(1);
    expect(wasSendBlocked(res)).toBe(true);
  });

  it('does not treat an ordinary undefined-returning send as blocked', async () => {
    // Plenty of call sites (and tests) resolve with undefined. That is "no
    // information", not "blocked" - grading it blocked would suppress state
    // writes for messages that were delivered.
    const send = vi.fn().mockResolvedValue(undefined);
    const res = await sendToZaal(depsWith(send), 'nudge', { kind: 'status' });
    expect(wasSendBlocked(res)).toBe(false);
  });
});
