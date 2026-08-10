import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const remember = vi.fn();
const bonfireConfigured = vi.fn(() => true);
const containsSecret = vi.fn((_body: string) => false);
const containsPii = vi.fn((_body: string) => false);
const scanPii = vi.fn((_body: string) => [] as Array<{ kind: string }>);

vi.mock('../recall', () => ({
  remember: (...a: unknown[]) => remember(...a),
  bonfireConfigured: () => bonfireConfigured(),
  containsSecret: (b: string) => containsSecret(b),
}));
vi.mock('../pii', () => ({
  containsPii: (b: string) => containsPii(b),
  scanPii: (b: string) => scanPii(b),
}));
vi.mock('../memory', () => ({ ZOE_PATHS: { home: tmpdir() } }));

const { enqueueWrite, flushQueue, loadQueue, saveQueue, MAX_AGE_DAYS } = await import('../bonfire-retry');

let qp: string;

beforeEach(async () => {
  qp = join(await fs.mkdtemp(join(tmpdir(), 'bfq-')), 'q.json');
  remember.mockReset();
  bonfireConfigured.mockReturnValue(true);
  containsSecret.mockReturnValue(false);
  containsPii.mockReturnValue(false);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => vi.restoreAllMocks());

const item = (name = 'ep-1') => ({ body: 'a body', name, sourceTag: 'zoe:test' });

describe('enqueue', () => {
  it('stamps queuedAt and starts attempts at 0', async () => {
    await enqueueWrite(item(), qp);
    const q = await loadQueue(qp);
    expect(q).toHaveLength(1);
    expect(q[0].attempts).toBe(0);
    expect(Number.isNaN(Date.parse(q[0].queuedAt))).toBe(false);
  });
});

describe('flush', () => {
  it('sends and clears on success', async () => {
    remember.mockResolvedValue({ ok: true });
    await enqueueWrite(item(), qp);
    expect(await flushQueue(qp)).toEqual({ sent: 1, kept: 0, dropped: 0 });
    expect(await loadQueue(qp)).toHaveLength(0);
  });

  it('KEEPS a send failure - this is the whole point', async () => {
    remember.mockResolvedValue({ ok: false, error: 'ECONNREFUSED' });
    await enqueueWrite(item(), qp);
    expect(await flushQueue(qp)).toEqual({ sent: 0, kept: 1, dropped: 0 });
    expect(await loadQueue(qp)).toHaveLength(1);
  });

  it('counts attempts so a permanently stuck item is visible', async () => {
    remember.mockResolvedValue({ ok: false, error: 'down' });
    await enqueueWrite(item(), qp);
    await flushQueue(qp);
    await flushQueue(qp);
    expect((await loadQueue(qp))[0].attempts).toBe(2);
  });

  it('DROPS a terminal skip rather than retrying it forever', async () => {
    remember.mockResolvedValue({ ok: false, skipped: 'no-config' });
    await enqueueWrite(item(), qp);
    expect(await flushQueue(qp)).toEqual({ sent: 0, kept: 0, dropped: 1 });
  });

  it('drops an item whose body now trips the secret guard', async () => {
    await enqueueWrite(item(), qp);
    containsSecret.mockReturnValue(true);
    expect(await flushQueue(qp)).toEqual({ sent: 0, kept: 0, dropped: 1 });
    expect(remember).not.toHaveBeenCalled();
  });

  it('drops an item whose body now trips the PII guard', async () => {
    await enqueueWrite(item(), qp);
    containsPii.mockReturnValue(true);
    scanPii.mockReturnValue([{ kind: 'email' }]);
    expect(await flushQueue(qp)).toEqual({ sent: 0, kept: 0, dropped: 1 });
    expect(remember).not.toHaveBeenCalled();
  });

  it('drops items older than the age cap', async () => {
    const old = new Date(Date.now() - (MAX_AGE_DAYS + 1) * 86_400_000).toISOString();
    await saveQueue([{ ...item(), queuedAt: old }], qp);
    expect(await flushQueue(qp)).toEqual({ sent: 0, kept: 0, dropped: 1 });
  });

  it('keeps an item with an unparseable date rather than silently discarding it', async () => {
    remember.mockResolvedValue({ ok: false, error: 'down' });
    await saveQueue([{ ...item(), queuedAt: 'not-a-date' }], qp);
    expect((await flushQueue(qp)).kept).toBe(1);
  });

  it('does nothing when Bonfire is not configured', async () => {
    await enqueueWrite(item(), qp);
    bonfireConfigured.mockReturnValue(false);
    expect(await flushQueue(qp)).toEqual({ sent: 0, kept: 0, dropped: 0 });
    expect(await loadQueue(qp)).toHaveLength(1);
  });

  it('handles a mixed queue without losing the failures', async () => {
    remember
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: false, error: 'down' })
      .mockResolvedValueOnce({ ok: false, skipped: 'empty' });
    await enqueueWrite(item('a'), qp);
    await enqueueWrite(item('b'), qp);
    await enqueueWrite(item('c'), qp);
    expect(await flushQueue(qp)).toEqual({ sent: 1, kept: 1, dropped: 1 });
    expect((await loadQueue(qp))[0].name).toBe('b');
  });

  it('survives a corrupt queue file', async () => {
    await fs.writeFile(qp, 'not json', 'utf8');
    expect(await flushQueue(qp)).toEqual({ sent: 0, kept: 0, dropped: 0 });
  });
});
