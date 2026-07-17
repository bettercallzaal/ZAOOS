// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockGetZaalDmId = vi.hoisted(() => vi.fn());
vi.mock('../group', () => ({ getZaalDmId: mockGetZaalDmId }));

import { alertDevops, buildHealthReport } from '../ops';

afterEach(() => vi.clearAllMocks());

// ── buildHealthReport ─────────────────────────────────────────────────────────

describe('buildHealthReport', () => {
  it('returns a string containing uptime, memory, node version, and pid', async () => {
    const report = await buildHealthReport();
    expect(report).toContain('ZAOstock Bot');
    expect(report).toContain('MB RSS');
    expect(report).toContain('node');
    expect(report).toContain(`pid ${process.pid}`);
  });

  it('formats short uptimes as seconds', async () => {
    const uptimeSpy = vi.spyOn(process, 'uptime').mockReturnValue(45);
    const report = await buildHealthReport();
    expect(report).toContain('45s');
    uptimeSpy.mockRestore();
  });

  it('formats minute-range uptimes with m suffix', async () => {
    const uptimeSpy = vi.spyOn(process, 'uptime').mockReturnValue(90); // 1m 30s
    const report = await buildHealthReport();
    expect(report).toContain('1m');
    uptimeSpy.mockRestore();
  });

  it('formats hour-range uptimes with h and m', async () => {
    const uptimeSpy = vi.spyOn(process, 'uptime').mockReturnValue(7290); // 2h 1m 30s
    const report = await buildHealthReport();
    expect(report).toContain('2h1m');
    uptimeSpy.mockRestore();
  });
});

// ── alertDevops ───────────────────────────────────────────────────────────────

describe('alertDevops', () => {
  it('does not send when ZAAL_TELEGRAM_ID is not set (getZaalDmId returns null)', async () => {
    mockGetZaalDmId.mockReturnValue(null);
    const bot = { api: { sendMessage: vi.fn() } };
    await alertDevops(bot, 'startup');
    expect(bot.api.sendMessage).not.toHaveBeenCalled();
  });

  it('sends a [devops] prefixed message to Zaal DM when configured', async () => {
    mockGetZaalDmId.mockReturnValue(12345);
    const sendMessage = vi.fn().mockResolvedValue(undefined);
    const bot = { api: { sendMessage } };
    await alertDevops(bot, 'bot started');
    expect(sendMessage).toHaveBeenCalledWith(12345, '[devops] bot started');
  });

  it('swallows errors from sendMessage without throwing', async () => {
    mockGetZaalDmId.mockReturnValue(12345);
    const bot = { api: { sendMessage: vi.fn().mockRejectedValue(new Error('network')) } };
    await expect(alertDevops(bot, 'test')).resolves.toBeUndefined();
  });
});
