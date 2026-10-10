// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  deferSend,
  drainDeferred,
  readDeferred,
  requeueDeferred,
  resetSendBudgetForTest,
  type DeferredSend,
} from '../send-budget';

const entry = (text: string): DeferredSend => ({ at: '2026-10-10T00:00:00Z', cls: 'digest', chatId: 1, text });

let home: string;
beforeEach(async () => {
  home = await fs.mkdtemp(join(tmpdir(), 'zoe-deferred-lock-'));
  vi.stubEnv('ZOE_HOME', home);
  resetSendBudgetForTest();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  await fs.rm(home, { recursive: true, force: true });
});

describe('the deferred queue under concurrent writers', () => {
  it('ten defers in the same tick all survive (before the lock: 1 of 10)', async () => {
    await Promise.all(Array.from({ length: 10 }, (_, i) => deferSend(entry(`t${i}`))));
    expect((await readDeferred()).map((e) => e.text).sort()).toEqual(
      Array.from({ length: 10 }, (_, i) => `t${i}`).sort(),
    );
  });

  it('a defer that lands during a drain is kept for the next batch, not wiped by the clear', async () => {
    await deferSend(entry('old'));
    const [drained] = await Promise.all([drainDeferred(), deferSend(entry('new'))]);
    const left = await readDeferred();
    // Every entry is in exactly one place: the batch, or still queued.
    expect([...drained, ...left].map((e) => e.text).sort()).toEqual(['new', 'old']);
  });

  it('a requeue racing a defer keeps both, requeued entries first', async () => {
    await Promise.all([requeueDeferred([entry('r1'), entry('r2')]), deferSend(entry('d1'))]);
    expect((await readDeferred()).map((e) => e.text)).toEqual(['r1', 'r2', 'd1']);
  });

  it('a failing writer does not jam the chain for the next one', async () => {
    // A directory where the file should be makes every write throw (caught and
    // warned inside), so the next writer must still run once the home is fixed.
    await fs.mkdir(join(home, 'send-deferred.jsonl'));
    await deferSend(entry('lost'));
    await fs.rmdir(join(home, 'send-deferred.jsonl'));
    await deferSend(entry('kept'));
    expect((await readDeferred()).map((e) => e.text)).toEqual(['kept']);
  });
});
