// @vitest-environment node
// Tests for telegram-routing.ts message chunking and routing logic.
import { describe, expect, it, vi } from 'vitest';
import { sendToZaal, type TelegramRoutingDeps } from '../telegram-routing';

describe('telegram-routing', () => {
  describe('sendToZaal chunking', () => {
    it('sends a short message as a single chunk without prefix', async () => {
      const sendMessageMock = vi.fn().mockResolvedValue({ ok: true });
      const deps: TelegramRoutingDeps = {
        sendMessage: sendMessageMock,
        zaalId: 123,
        groupId: 456,
      };

      const shortText = 'This is a short message';
      await sendToZaal(deps, shortText, { kind: 'status' });

      expect(sendMessageMock).toHaveBeenCalledTimes(1);
      expect(sendMessageMock).toHaveBeenCalledWith(456, shortText, {});
    });

    it('chunks a long message (>3900 chars) into multiple messages', async () => {
      const sendMessageMock = vi.fn().mockResolvedValue({ ok: true });
      const deps: TelegramRoutingDeps = {
        sendMessage: sendMessageMock,
        zaalId: 123,
        groupId: 456,
      };

      // Create a message longer than 3900 chars
      const longText = 'Line of text\n'.repeat(400); // ~5200 chars
      await sendToZaal(deps, longText, { kind: 'status' });

      // Should have been called multiple times
      expect(sendMessageMock.mock.calls.length).toBeGreaterThan(1);

      // Each call except possibly the last should not exceed the chunk prefix + 3900 chars
      for (const call of sendMessageMock.mock.calls) {
        const message = call[1];
        expect(message.length).toBeLessThanOrEqual(3900 + 10); // +10 for prefix like "(1/2) "
      }

      // Verify all chunks have the (n/m) prefix since message is long
      const calls = sendMessageMock.mock.calls;
      expect(calls[0][1]).toMatch(/^\(\d+\/\d+\) /);
      expect(calls[1][1]).toMatch(/^\(\d+\/\d+\) /);
    });

    it('preserves paragraph/line boundaries when splitting', async () => {
      const sendMessageMock = vi.fn().mockResolvedValue({ ok: true });
      const deps: TelegramRoutingDeps = {
        sendMessage: sendMessageMock,
        zaalId: 123,
        groupId: 456,
      };

      // Create a message with clear paragraph boundaries
      const paragraphs = Array(100)
        .fill(0)
        .map((_, i) => `Paragraph ${i}: This is a test paragraph with some content to make it longer.`)
        .join('\n\n');

      await sendToZaal(deps, paragraphs, { kind: 'status' });

      // Check that chunks don't end mid-word
      for (const call of sendMessageMock.mock.calls) {
        const message = call[1].replace(/^\(\d+\/\d+\) /, ''); // Remove prefix
        // Chunk should not end with a space followed by a partial word (i.e., should end cleanly)
        expect(message).not.toMatch(/ $/);
      }
    });

    it('does not split mid-word when chunking', async () => {
      const sendMessageMock = vi.fn().mockResolvedValue({ ok: true });
      const deps: TelegramRoutingDeps = {
        sendMessage: sendMessageMock,
        zaalId: 123,
        groupId: 456,
      };

      // Create a long message with words that could be split
      const longWord = 'supercalifragilisticexpialidocious';
      const text = `${longWord} `.repeat(500); // Creates a very long string of long words

      await sendToZaal(deps, text, { kind: 'status' });

      // Verify each chunk ends with a complete word (no mid-word splits)
      for (const call of sendMessageMock.mock.calls) {
        const message = call[1].replace(/^\(\d+\/\d+\) /, ''); // Remove prefix
        // Should end with word boundary or whitespace, not mid-word
        expect(message).toMatch(/(\s|^)$/);
      }
    });

    it('applies reply_markup only to the first chunk when chunking', async () => {
      const sendMessageMock = vi.fn().mockResolvedValue({ ok: true });
      const deps: TelegramRoutingDeps = {
        sendMessage: sendMessageMock,
        zaalId: 123,
        groupId: 456,
      };

      const markup = {
        inline_keyboard: [[{ text: 'Button', callback_data: 'action' }]],
      };

      const longText = 'Long message content.\n'.repeat(400); // >3900 chars

      await sendToZaal(deps, longText, { kind: 'status', replyMarkup: markup });

      expect(sendMessageMock.mock.calls.length).toBeGreaterThan(1);

      // First call should have reply_markup
      expect(sendMessageMock.mock.calls[0][2]).toHaveProperty('reply_markup');
      expect(sendMessageMock.mock.calls[0][2].reply_markup).toEqual(markup);

      // Second call should NOT have reply_markup
      expect(sendMessageMock.mock.calls[1][2]).not.toHaveProperty('reply_markup');
    });

    it('routes question messages to Zaal DM', async () => {
      const sendMessageMock = vi.fn().mockResolvedValue({ ok: true });
      const deps: TelegramRoutingDeps = {
        sendMessage: sendMessageMock,
        zaalId: 123,
        groupId: 456,
      };

      const text = 'This is a question that needs Zaal reply';
      await sendToZaal(deps, text, { kind: 'question' });

      // Should send to zaalId (DM), not groupId
      expect(sendMessageMock).toHaveBeenCalledWith(123, text, {});
    });

    it('routes status messages to group when groupId is set', async () => {
      const sendMessageMock = vi.fn().mockResolvedValue({ ok: true });
      const deps: TelegramRoutingDeps = {
        sendMessage: sendMessageMock,
        zaalId: 123,
        groupId: 456,
      };

      const text = 'This is a status update';
      await sendToZaal(deps, text, { kind: 'status' });

      // Should send to groupId, not zaalId
      expect(sendMessageMock).toHaveBeenCalledWith(456, text, {});
    });

    it('falls back to DM when groupId is not set for status messages', async () => {
      const sendMessageMock = vi.fn().mockResolvedValue({ ok: true });
      const deps: TelegramRoutingDeps = {
        sendMessage: sendMessageMock,
        zaalId: 123,
      };

      const text = 'This is a status update';
      await sendToZaal(deps, text, { kind: 'status' });

      // Should fall back to zaalId
      expect(sendMessageMock).toHaveBeenCalledWith(123, text, {});
    });

    it('includes group thread id in message options when configured', async () => {
      const sendMessageMock = vi.fn().mockResolvedValue({ ok: true });
      const deps: TelegramRoutingDeps = {
        sendMessage: sendMessageMock,
        zaalId: 123,
        groupId: 456,
        groupThreadId: 789,
      };

      const text = 'Message for group thread';
      await sendToZaal(deps, text, { kind: 'status' });

      expect(sendMessageMock).toHaveBeenCalledWith(456, text, {
        message_thread_id: 789,
      });
    });
  });
});
