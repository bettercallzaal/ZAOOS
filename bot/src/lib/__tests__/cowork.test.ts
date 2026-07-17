// @vitest-environment node
// Tests for bot/src/lib/cowork.ts — the ZAOOS cowork REST client.
//
// The module reads COWORK_API_URL and COWORK_BOT_TOKEN at load time, so:
//   • Dormant tests use the top-level import (env vars absent → dormant).
//   • Active tests use vi.resetModules() + dynamic import to reload the
//     module after setting env vars.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Top-level import — env vars not set, so the module loads in dormant mode.
import {
  coworkEnabled,
  heartbeat,
  markDone,
  pushItem,
  reportEvent,
  startCommandPoller,
  startHeartbeat,
  updateItem,
  type CommandHandlers,
} from '../cowork';

const mockFetch = vi.fn();

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  delete process.env.COWORK_API_URL;
  delete process.env.COWORK_BOT_TOKEN;
});

// ── dormant mode (no env vars) ─────────────────────────────────────────────

describe('dormant mode (COWORK_API_URL / COWORK_BOT_TOKEN not set)', () => {
  it('coworkEnabled returns false', () => {
    expect(coworkEnabled()).toBe(false);
  });

  it('pushItem returns { ok: false, skipped: true } without fetching', async () => {
    vi.stubGlobal('fetch', mockFetch);
    const result = await pushItem({ title: 'Task' });
    expect(result).toEqual({ ok: false, skipped: true });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('heartbeat returns { ok: false, skipped: true } without fetching', async () => {
    vi.stubGlobal('fetch', mockFetch);
    const result = await heartbeat();
    expect(result).toEqual({ ok: false, skipped: true });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('reportEvent returns { ok: false, skipped: true } without fetching', async () => {
    vi.stubGlobal('fetch', mockFetch);
    const result = await reportEvent('test_event');
    expect(result).toEqual({ ok: false, skipped: true });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('startHeartbeat returns a no-op stop function', () => {
    vi.stubGlobal('fetch', mockFetch);
    const stop = startHeartbeat();
    expect(typeof stop).toBe('function');
    stop(); // must not throw
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('startCommandPoller returns a no-op stop function', () => {
    vi.stubGlobal('fetch', mockFetch);
    const stop = startCommandPoller({});
    expect(typeof stop).toBe('function');
    stop();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

// ── active mode (env vars set) ─────────────────────────────────────────────

async function loadActive() {
  vi.resetModules();
  process.env.COWORK_API_URL = 'http://test.cowork.example.com';
  process.env.COWORK_BOT_TOKEN = 'test-token';
  vi.stubGlobal('fetch', mockFetch);
  return import('../cowork');
}

describe('active mode — request layer', () => {
  it('coworkEnabled returns true when both vars are set', async () => {
    const m = await loadActive();
    expect(m.coworkEnabled()).toBe(true);
  });

  it('pushItem makes POST to /api/v1/items with Authorization header', async () => {
    const m = await loadActive();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ id: '5' }),
    });
    const result = await m.pushItem({ title: 'New task', notes: 'detail' });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ id: '5' });
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('http://test.cowork.example.com/api/v1/items');
    expect(opts.method).toBe('POST');
    expect(opts.headers.Authorization).toBe('Bearer test-token');
  });

  it('updateItem strips leading # and makes PATCH', async () => {
    const m = await loadActive();
    mockFetch.mockResolvedValue({ ok: true, status: 200, text: async () => '' });
    await m.updateItem('#12', { status: 'WIP' });
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/v1/items/12');
    expect(opts.method).toBe('PATCH');
  });

  it('markDone sends { status: "DONE" }', async () => {
    const m = await loadActive();
    mockFetch.mockResolvedValue({ ok: true, status: 200, text: async () => '' });
    await m.markDone('7');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.status).toBe('DONE');
  });

  it('markDone includes notes when provided', async () => {
    const m = await loadActive();
    mockFetch.mockResolvedValue({ ok: true, status: 200, text: async () => '' });
    await m.markDone('7', 'shipped');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.notes).toBe('shipped');
  });

  it('heartbeat makes POST to /api/v1/bots/heartbeat', async () => {
    const m = await loadActive();
    mockFetch.mockResolvedValue({ ok: true, status: 200, text: async () => '' });
    await m.heartbeat();
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/v1/bots/heartbeat');
    expect(mockFetch.mock.calls[0][1].method).toBe('POST');
  });

  it('non-OK HTTP response returns { ok: false, status, error }', async () => {
    const m = await loadActive();
    mockFetch.mockResolvedValue({ ok: false, status: 403, text: async () => '{"error":"Forbidden"}' });
    const result = await m.pushItem({ title: 'x' });
    expect(result.ok).toBe(false);
    expect(result.status).toBe(403);
    expect(result.error).toBe('HTTP 403');
  });

  it('network exception returns { ok: false, error } without throwing', async () => {
    const m = await loadActive();
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));
    const result = await m.pushItem({ title: 'x' });
    expect(result.ok).toBe(false);
    expect(result.error).toBe('ECONNREFUSED');
  });
});

// ── command poller — executeCommand ────────────────────────────────────────

describe('startCommandPoller — executeCommand dispatch', () => {
  // Each test reloads the active module, then directly invokes the poller
  // by making getCommands() return a specific command, then calling startCommandPoller.
  // We immediately advance time (or let the initial tick run) and check results.

  async function runCommandTest(
    command: string,
    args: Record<string, unknown> | null,
    handlers: CommandHandlers,
  ) {
    const m = await loadActive();
    let postResultBody: unknown = null;
    mockFetch
      // First call: getCommands
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            commands: [{ id: 101, bot: 'test-bot', command, args, status: 'pending', created_at: '' }],
          }),
      })
      // Second call: postCommandResult
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => {
          postResultBody = null;
          return '';
        },
      });

    // Capture the body sent to postCommandResult
    mockFetch.mockImplementationOnce(async (_url: string, opts: RequestInit) => {
      postResultBody = JSON.parse(opts.body as string);
      return { ok: true, status: 200, text: async () => '' };
    });

    // Reset and re-setup with proper order
    mockFetch.mockReset();
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            commands: [{ id: 101, bot: 'test-bot', command, args, status: 'pending', created_at: '' }],
          }),
      })
      .mockImplementationOnce(async (_url: string, opts: RequestInit) => {
        postResultBody = JSON.parse(opts.body as string);
        return { ok: true, status: 200, text: async () => '' };
      });

    const stop = m.startCommandPoller(handlers, 60_000);
    // Let the initial tick's promises resolve
    await new Promise((r) => setTimeout(r, 50));
    stop();
    return postResultBody as Record<string, unknown> | null;
  }

  it('pause: calls onPause and posts done result', async () => {
    const onPause = vi.fn();
    const result = await runCommandTest('pause', null, { onPause });
    expect(onPause).toHaveBeenCalledOnce();
    expect(result?.status).toBe('done');
  });

  it('run_task without handler: posts error result', async () => {
    const result = await runCommandTest('run_task', { task: 'write-tests' }, {});
    expect(result?.status).toBe('error');
    expect((result?.result as Record<string, unknown>)?.error).toContain('not supported');
  });

  it('run_task with handler: posts done result with handler output', async () => {
    const onRunTask = vi.fn().mockResolvedValue({ output: 'finished' });
    const result = await runCommandTest('run_task', { task: 'something' }, { onRunTask });
    expect(onRunTask).toHaveBeenCalledWith({ task: 'something' });
    expect(result?.status).toBe('done');
  });

  it('unknown command: posts error result', async () => {
    const result = await runCommandTest('do_magic', null, {});
    expect(result?.status).toBe('error');
    expect((result?.result as Record<string, unknown>)?.error).toContain('unknown command');
  });
});
