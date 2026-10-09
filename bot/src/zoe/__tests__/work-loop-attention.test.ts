// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// The worker produces nothing, so the item parks quickly with no spend.
vi.mock('../dispatch', () => ({ dispatchPlan: vi.fn(async () => undefined) }));
vi.mock('../receipts', () => ({ emitReceipt: vi.fn(async () => undefined) }));
vi.mock('../../hermes/claude-cli', () => ({ callClaudeCli: vi.fn(async () => ({ text: '' })) }));

let tmp: string;
beforeEach(async () => {
  tmp = join(tmpdir(), 'zoe-wl-attention-' + Math.random().toString(36).slice(2));
  await fs.mkdir(tmp, { recursive: true });
  vi.stubEnv('ZOE_HOME', tmp);
});
afterEach(async () => {
  vi.unstubAllEnvs();
  await fs.rm(tmp, { recursive: true, force: true });
});

async function runOne(): Promise<string[]> {
  const { enqueueWork, runWorkTick } = await import('../work-loop');
  await enqueueWork('Investigate sound gear in Ellsworth');
  const sent: string[] = [];
  await runWorkTick({
    sendToZaal: async (t: string) => {
      sent.push(t);
    },
    zaalTgId: 1,
    repoDir: tmp,
    currentDate: '2026-10-09',
  });
  return sent;
}

describe('work-loop progress ping under ZOE_ATTENTION', () => {
  it('red control: flag off sends the researching ping', async () => {
    const sent = await runOne();
    expect(sent.some((t) => t.startsWith('Work-loop: researching'))).toBe(true);
  });

  it('flag on sends only the outcome, never the progress ping', async () => {
    vi.stubEnv('ZOE_ATTENTION', '1');
    const sent = await runOne();
    expect(sent.some((t) => t.startsWith('Work-loop: researching'))).toBe(false);
    expect(sent.length).toBeGreaterThan(0);
  });
});
