import { describe, it, expect, vi } from 'vitest';
import { formatCrashAlert, sendEmergencyAlert, installCrashGuard } from '../crash-guard';

describe('crash-guard', () => {
  it('formats crash alerts with error, unit, and stack', () => {
    const err = new Error('Database connection pool exhausted');
    const alert = formatCrashAlert(err, 'zoe-bot');
    expect(alert).toContain('ALERT: zoe-bot CRASHED');
    expect(alert).toContain('Database connection pool exhausted');
    expect(alert).toContain('Supervisor (systemd) will restart unit with backoff.');
  });

  it('sends emergency alert to telegram api', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    const sent = await sendEmergencyAlert('Test alert', {
      botToken: 'fake-token-123',
      zaalId: 999888,
      fetchFn: mockFetch as any,
    });
    expect(sent).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.telegram.org/botfake-token-123/sendMessage',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          chat_id: 999888,
          text: 'Test alert',
        }),
      }),
    );
  });

  it('returns false when token or chat id is missing', async () => {
    const sent = await sendEmergencyAlert('Test alert', {
      botToken: '',
      zaalId: 0,
      fetchFn: vi.fn() as any,
    });
    expect(sent).toBe(false);
  });

  it('installs process signal handlers that exit cleanly (0) on SIGTERM', () => {
    const mockExit = vi.fn();
    const cleanup = installCrashGuard({ onExit: mockExit });

    process.emit('SIGTERM');
    expect(mockExit).toHaveBeenCalledWith(0);

    cleanup();
  });

  it('installs process signal handlers that exit cleanly (0) on SIGINT', () => {
    const mockExit = vi.fn();
    const cleanup = installCrashGuard({ onExit: mockExit });

    process.emit('SIGINT');
    expect(mockExit).toHaveBeenCalledWith(0);

    cleanup();
  });

  it('sends emergency alert and exits 1 on uncaughtException', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    const mockExit = vi.fn();
    const cleanup = installCrashGuard({
      botToken: 'fake-token-123',
      zaalId: 999888,
      fetchFn: mockFetch as any,
      onExit: mockExit,
    });

    const fatalErr = new Error('Fatal unrecoverable memory leak');
    process.emit('uncaughtException', fatalErr);

    await vi.waitFor(() => {
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.telegram.org/botfake-token-123/sendMessage',
      expect.objectContaining({
        method: 'POST',
      }),
    );

    cleanup();
  });

  it('exits 1 on uncaughtException even if emergency alert fails', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network offline'));
    const mockExit = vi.fn();
    const cleanup = installCrashGuard({
      botToken: 'fake-token-123',
      zaalId: 999888,
      fetchFn: mockFetch as any,
      onExit: mockExit,
    });

    const fatalErr = new Error('Fatal database corruption');
    process.emit('uncaughtException', fatalErr);

    await vi.waitFor(() => {
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    cleanup();
  });

  it('sends emergency alert and exits 1 on unhandledRejection', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    const mockExit = vi.fn();
    const cleanup = installCrashGuard({
      botToken: 'fake-token-123',
      zaalId: 999888,
      fetchFn: mockFetch as any,
      onExit: mockExit,
    });

    const fatalRejection = new Error('Unhandled promise failure');
    process.emit('unhandledRejection', fatalRejection, Promise.resolve());

    await vi.waitFor(() => {
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.telegram.org/botfake-token-123/sendMessage',
      expect.objectContaining({
        method: 'POST',
      }),
    );

    cleanup();
  });

  it('exits 1 on unhandledRejection even if emergency alert fails', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Telegram API unreachable'));
    const mockExit = vi.fn();
    const cleanup = installCrashGuard({
      botToken: 'fake-token-123',
      zaalId: 999888,
      fetchFn: mockFetch as any,
      onExit: mockExit,
    });

    const fatalRejection = new Error('Unhandled network timeout');
    process.emit('unhandledRejection', fatalRejection, Promise.resolve());

    await vi.waitFor(() => {
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    cleanup();
  });
});
