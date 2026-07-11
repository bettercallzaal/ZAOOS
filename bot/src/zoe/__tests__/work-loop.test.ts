import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

let tmp: string;

beforeEach(async () => {
  tmp = join(tmpdir(), 'zoe-workloop-test-' + Math.random().toString(36).slice(2));
  await fs.mkdir(tmp, { recursive: true });
  vi.stubEnv('ZOE_HOME', tmp);
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await fs.rm(tmp, { recursive: true, force: true });
});

describe('work-loop queue', () => {
  it('starts empty', async () => {
    const { queueDepth } = await import('../work-loop');
    expect(await queueDepth()).toBe(0);
  });

  it('enqueues a research item and trims input', async () => {
    const { enqueueWork, queueDepth } = await import('../work-loop');
    const item = await enqueueWork('  research the thing  ');
    expect(item.kind).toBe('research');
    expect(item.input).toBe('research the thing');
    expect(item.id).toMatch(/^wk-/);
    expect(await queueDepth()).toBe(1);
  });

  it('stores a reply target when given (research-from-topic routing)', async () => {
    const { enqueueWork } = await import('../work-loop');
    const item = await enqueueWork('from the research topic', { chatId: -100123, threadId: 8 });
    expect(item.replyTarget).toEqual({ chatId: -100123, threadId: 8 });
    const plain = await enqueueWork('from a DM');
    expect(plain.replyTarget).toBeUndefined();
  });

  it('preserves FIFO order across multiple enqueues', async () => {
    const { enqueueWork, queueDepth } = await import('../work-loop');
    await enqueueWork('first');
    await enqueueWork('second');
    expect(await queueDepth()).toBe(2);
    const raw = JSON.parse(await fs.readFile(join(tmp, 'work-queue.json'), 'utf8'));
    expect(raw[0].input).toBe('first');
    expect(raw[1].input).toBe('second');
  });

  it('runWorkTick on an empty queue is a no-op (no spend, no throw)', async () => {
    const { runWorkTick } = await import('../work-loop');
    const send = vi.fn();
    await expect(
      runWorkTick({ sendToZaal: send, zaalTgId: 1, repoDir: '/x', currentDate: '2026-06-30' }),
    ).resolves.toBeUndefined();
    expect(send).not.toHaveBeenCalled();
  });
});
