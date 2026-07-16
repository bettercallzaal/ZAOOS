import { describe, it, expect, vi } from 'vitest';
import { sendToZaal, constructRoutingDeps, type TelegramRoutingDeps } from '../telegram-routing';

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

      expect(deps.groupId).toBeUndefined();
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });
});
