import { describe, it, expect, vi, afterEach } from 'vitest';
import { sendToZaal, constructRoutingDeps, chunkText, type TelegramRoutingDeps } from '../telegram-routing';

describe('telegram-routing', () => {
  describe('sendToZaal routing', () => {
    it('routes questions to Zaal DM', async () => {
      const sendMessage = vi.fn().mockResolvedValue({});
      const deps: TelegramRoutingDeps = {
        sendMessage,
        zaalId: 123,
        groupId: 456,
        groupThreadId: 789,
      };

      await sendToZaal(deps, 'What should I do?', { kind: 'question' });

      // No markup → no third arg (cleaner DM call)
      expect(sendMessage).toHaveBeenCalledWith(123, 'What should I do?');
      expect(sendMessage).toHaveBeenCalledTimes(1);
    });

    it('routes status to group with thread id', async () => {
      const sendMessage = vi.fn().mockResolvedValue({});
      const deps: TelegramRoutingDeps = {
        sendMessage,
        zaalId: 123,
        groupId: 456,
        groupThreadId: 789,
      };

      await sendToZaal(deps, 'Status update', { kind: 'status' });

      expect(sendMessage).toHaveBeenCalledWith(456, 'Status update', { message_thread_id: 789 });
      expect(sendMessage).toHaveBeenCalledTimes(1);
    });

    it('routes status to group without thread id', async () => {
      const sendMessage = vi.fn().mockResolvedValue({});
      const deps: TelegramRoutingDeps = {
        sendMessage,
        zaalId: 123,
        groupId: 456,
      };

      await sendToZaal(deps, 'Status update', { kind: 'status' });

      expect(sendMessage).toHaveBeenCalledWith(456, 'Status update', {});
      expect(sendMessage).toHaveBeenCalledTimes(1);
    });

    it('defaults to status when kind is unspecified', async () => {
      const sendMessage = vi.fn().mockResolvedValue({});
      const deps: TelegramRoutingDeps = {
        sendMessage,
        zaalId: 123,
        groupId: 456,
      };

      await sendToZaal(deps, 'Some message');

      expect(sendMessage).toHaveBeenCalledWith(456, 'Some message', {});
    });

    it('falls back to DM when group id is not configured', async () => {
      const sendMessage = vi.fn().mockResolvedValue({});
      const deps: TelegramRoutingDeps = {
        sendMessage,
        zaalId: 123,
      };

      await sendToZaal(deps, 'Status message', { kind: 'status' });

      // DM fallback: no markup → no third arg
      expect(sendMessage).toHaveBeenCalledWith(123, 'Status message');
    });

    it('questions always go to DM even if group is configured', async () => {
      const sendMessage = vi.fn().mockResolvedValue({});
      const deps: TelegramRoutingDeps = {
        sendMessage,
        zaalId: 123,
        groupId: 456,
      };

      await sendToZaal(deps, 'What do you think?', { kind: 'question' });

      // No markup → no third arg
      expect(sendMessage).toHaveBeenCalledWith(123, 'What do you think?');
    });
  });

  describe('constructRoutingDeps', () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it('constructs deps from environment', () => {
      process.env.ZAAL_TELEGRAM_ID = '999';
      process.env.ZAALBOTS_GROUP_CHAT_ID = '888';
      process.env.ZAALBOTS_STATUS_THREAD_ID = '777';

      const sendMessage = vi.fn();
      const deps = constructRoutingDeps(sendMessage);

      expect(deps.zaalId).toBe(999);
      expect(deps.groupId).toBe(888);
      expect(deps.groupThreadId).toBe(777);
      expect(deps.sendMessage).toBe(sendMessage);
    });

    it('throws if ZAAL_TELEGRAM_ID is missing', () => {
      delete process.env.ZAAL_TELEGRAM_ID;
      const sendMessage = vi.fn();

      expect(() => constructRoutingDeps(sendMessage)).toThrow('Missing ZAAL_TELEGRAM_ID');
    });

    it('ignores missing group id (optional)', () => {
      process.env.ZAAL_TELEGRAM_ID = '999';
      delete process.env.ZAALBOTS_GROUP_CHAT_ID;

      const sendMessage = vi.fn();
      const deps = constructRoutingDeps(sendMessage);

      expect(deps.groupId).toBeUndefined();
    });

    it('ignores invalid group id', () => {
      process.env.ZAAL_TELEGRAM_ID = '999';
      process.env.ZAALBOTS_GROUP_CHAT_ID = 'not-a-number';

      const sendMessage = vi.fn();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const deps = constructRoutingDeps(sendMessage);

      // Invalid group id should be coerced to undefined, not NaN
      expect(deps.groupId).toBeUndefined();
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe('chunkText', () => {
    it('returns single chunk when text is under limit', () => {
      const result = chunkText('hello world', 100);
      expect(result).toEqual(['hello world']);
    });

    it('returns single chunk when text equals limit exactly', () => {
      const text = 'x'.repeat(4000);
      const result = chunkText(text);
      expect(result).toEqual([text]);
    });

    it('splits at newline boundary when text exceeds limit', () => {
      const line1 = 'a'.repeat(3990) + '\n';
      const line2 = 'b'.repeat(50);
      const result = chunkText(line1 + line2, 4000);
      expect(result).toHaveLength(2);
      expect(result[0]).toBe(line1);
      expect(result[1]).toBe(line2);
    });

    it('falls back to hard cut when no newline within limit', () => {
      const text = 'x'.repeat(4100);
      const result = chunkText(text, 4000);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveLength(4000);
      expect(result[1]).toHaveLength(100);
    });

    it('produces three chunks for very long text', () => {
      const block = 'line\n'.repeat(1000); // 5000 chars
      const result = chunkText(block, 2000);
      expect(result.length).toBeGreaterThan(2);
      for (const chunk of result) {
        expect(chunk.length).toBeLessThanOrEqual(2000);
      }
      expect(result.join('')).toBe(block);
    });
  });

  describe('chunked sending', () => {
    const KEYBOARD = {
      inline_keyboard: [[{ text: 'ok', callback_data: 'ok' }]],
    };

    it('sends long text as multiple chunks to group, markup on last only', async () => {
      const sendMessage = vi.fn().mockResolvedValue({});
      const deps: TelegramRoutingDeps = { sendMessage, zaalId: 1, groupId: 2 };
      const chunk1 = 'A'.repeat(3990) + '\n';
      const chunk2 = 'B'.repeat(100);
      await sendToZaal(deps, chunk1 + chunk2, { kind: 'status', replyMarkup: KEYBOARD });

      expect(sendMessage).toHaveBeenCalledTimes(2);
      // First chunk: no markup
      expect(sendMessage).toHaveBeenNthCalledWith(1, 2, chunk1, {});
      // Last chunk: markup attached
      expect(sendMessage).toHaveBeenNthCalledWith(2, 2, chunk2, { reply_markup: KEYBOARD });
    });

    it('sends long question as multiple DM chunks, markup on last only', async () => {
      const sendMessage = vi.fn().mockResolvedValue({});
      const deps: TelegramRoutingDeps = { sendMessage, zaalId: 1, groupId: 2 };
      // 3999 Q's + newline = 4000 chars; + 'end' = 4003 total → splits at the newline
      const chunk1 = 'Q'.repeat(3999) + '\n';
      const chunk2 = 'end';
      await sendToZaal(deps, chunk1 + chunk2, { kind: 'question', replyMarkup: KEYBOARD });

      expect(sendMessage).toHaveBeenCalledTimes(2);
      expect(sendMessage).toHaveBeenNthCalledWith(1, 1, chunk1);
      expect(sendMessage).toHaveBeenNthCalledWith(2, 1, chunk2, { reply_markup: KEYBOARD });
    });

    it('sends single short message without splitting', async () => {
      const sendMessage = vi.fn().mockResolvedValue({});
      const deps: TelegramRoutingDeps = { sendMessage, zaalId: 1, groupId: 2 };
      await sendToZaal(deps, 'short', { kind: 'status' });
      expect(sendMessage).toHaveBeenCalledTimes(1);
    });
  });
});
