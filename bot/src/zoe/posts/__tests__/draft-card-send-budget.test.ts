// @vitest-environment node
//
// The POST/REGEN/SKIP draft card versus the daily send budget.
//
// The card is an approval card, and send-budget.ts calls that class `gated`
// (always passes, still counts). Its two cron call sites - the 14:00 UTC
// best-draft notice in posts/scheduler.ts and the Sunday fractal promo - send
// from outside any runWithSendClass context, so without an explicit tag the
// class defaults to `status` and the card is DROPPED once the day's cap is
// spent. A dropped send RESOLVES, so the old code then persisted a pending
// draft for a message Zaal never got; with MAX_RESENDS = 0 it expired unseen
// on the 4h TTL while the log said `best-notice`.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockAppendFile = vi.hoisted(() => vi.fn());
const mockWriteFile = vi.hoisted(() => vi.fn());
const mockReadFile = vi.hoisted(() => vi.fn());
const mockMkdir = vi.hoisted(() => vi.fn());
const mockUnlink = vi.hoisted(() => vi.fn());

vi.mock('../../memory', () => ({ ZOE_PATHS: { home: '/tmp/zoe-draft-card-test' } }));
vi.mock('../drafters', () => ({ draftPost: vi.fn() }));
vi.mock('../sources', () => ({
  gatherBuildSignals: vi.fn(),
  gatherEcosystemSignals: vi.fn(),
  gatherEventSignals: vi.fn(),
  gatherPersonalSignals: vi.fn(),
}));
vi.mock('node:fs', () => ({
  promises: {
    appendFile: mockAppendFile,
    writeFile: mockWriteFile,
    readFile: mockReadFile,
    mkdir: mockMkdir,
    unlink: mockUnlink,
  },
}));

import { sendDraftWithKeyboard } from '../buttons';

/** The exact shape send-budget.ts returns for a send it blocked. */
const blocked = { message_id: 0, zoeSendBudget: 'dropped' };

function loggedEvents(): string[] {
  return mockAppendFile.mock.calls.map((c) => JSON.parse(String(c[1])).event as string);
}

// Path separator differs by platform, so match on the filename, not the join.
function pendingWrites(): string[] {
  return mockWriteFile.mock.calls
    .filter((c) => String(c[0]).endsWith('pending.json'))
    .map((c) => String(c[1]));
}

beforeEach(() => {
  vi.clearAllMocks();
  mockReadFile.mockRejectedValue(new Error('ENOENT')); // no pending draft in flight
  mockAppendFile.mockResolvedValue(undefined);
  mockWriteFile.mockResolvedValue(undefined);
  mockMkdir.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('sendDraftWithKeyboard vs the daily send budget', () => {
  it('tags both bubbles `gated`, so a cron card is never capped away', async () => {
    const sendMessage = vi.fn().mockResolvedValue({ message_id: 77 });

    await sendDraftWithKeyboard({
      bot: { sendMessage } as never,
      zaalTgId: 1,
      category: 'build',
      text: 'draft body',
    });

    expect(sendMessage).toHaveBeenCalledTimes(2);
    for (const call of sendMessage.mock.calls) {
      expect(call[2]).toMatchObject({ zoeSendClass: 'gated' });
    }
  });

  it('persists the pending draft when the send really lands', async () => {
    const sendMessage = vi.fn().mockResolvedValue({ message_id: 77 });

    const pending = await sendDraftWithKeyboard({
      bot: { sendMessage } as never,
      zaalTgId: 1,
      category: 'build',
      text: 'draft body',
    });

    expect(pending?.messageId).toBe(77);
    expect(pendingWrites()).toHaveLength(1);
    expect(loggedEvents()).toContain('sent');
  });

  it('records NOTHING when the budget blocks the card - no phantom pending draft', async () => {
    const sendMessage = vi.fn().mockResolvedValue(blocked);

    const pending = await sendDraftWithKeyboard({
      bot: { sendMessage } as never,
      zaalTgId: 1,
      category: 'build',
      text: 'draft body',
    });

    // The old bug: `{ message_id: 0 }` is a resolved, non-null object, so the
    // card was saved as pending-awaiting-Zaal for a message nobody received.
    expect(pending).toBeNull();
    expect(pendingWrites()).toHaveLength(0);
    expect(loggedEvents()).toContain('send-error');
    expect(loggedEvents()).not.toContain('sent');
  });

  it('treats a blocked SECOND bubble as a failure too', async () => {
    // The header bubble lands, the one carrying the keyboard does not - so the
    // card Zaal can actually tap never arrived.
    const sendMessage = vi
      .fn()
      .mockResolvedValueOnce({ message_id: 76 })
      .mockResolvedValueOnce({ message_id: 0, zoeSendBudget: 'deferred' });

    const pending = await sendDraftWithKeyboard({
      bot: { sendMessage } as never,
      zaalTgId: 1,
      category: 'build',
      text: 'draft body',
    });

    expect(pending).toBeNull();
    expect(pendingWrites()).toHaveLength(0);
    expect(loggedEvents()).toContain('send-error');
  });
});
