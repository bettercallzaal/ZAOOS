import { describe, it, expect, vi } from 'vitest';
import { sendToZaal, type TelegramRoutingDeps } from '../telegram-routing';

// zoe-message-quality / workflow-contract-v2: the morning brief builds veto
// buttons; this asserts sendToZaal actually forwards them (reply_markup) to
// Telegram on every route, so the buttons render instead of being dropped.

const KEYBOARD = {
  inline_keyboard: [[{ text: '🚫 task A', callback_data: 'veto:a' }]],
};

function depsWith(sendMessage: TelegramRoutingDeps['sendMessage'], over: Partial<TelegramRoutingDeps> = {}): TelegramRoutingDeps {
  return { sendMessage, zaalId: 111, ...over };
}

describe('sendToZaal replyMarkup passthrough', () => {
  it('attaches reply_markup on a status route to the group', async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    await sendToZaal(depsWith(send, { groupId: 222, groupThreadId: 7 }), 'brief', {
      kind: 'status',
      replyMarkup: KEYBOARD,
    });
    expect(send).toHaveBeenCalledWith(222, 'brief', {
      message_thread_id: 7,
      reply_markup: KEYBOARD,
    });
  });

  it('attaches reply_markup on the DM fallback when no group is configured', async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    await sendToZaal(depsWith(send), 'brief', { kind: 'status', replyMarkup: KEYBOARD });
    expect(send).toHaveBeenCalledWith(111, 'brief', { reply_markup: KEYBOARD });
  });

  it('attaches reply_markup on a question route (DM)', async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    await sendToZaal(depsWith(send), 'pick?', { kind: 'question', replyMarkup: KEYBOARD });
    expect(send).toHaveBeenCalledWith(111, 'pick?', { reply_markup: KEYBOARD });
  });

  it('sends an empty opts object (no reply_markup) when none is provided', async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    await sendToZaal(depsWith(send, { groupId: 222 }), 'status only', { kind: 'status' });
    expect(send).toHaveBeenCalledWith(222, 'status only', {});
  });
});
