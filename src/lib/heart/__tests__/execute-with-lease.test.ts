import { describe, it, expect, vi, beforeEach } from 'vitest';

const acquireLease = vi.fn();
const renewLease = vi.fn().mockResolvedValue(null);
const releaseLease = vi.fn().mockResolvedValue(null);
vi.mock('../lease-manager', () => ({ acquireLease: (i: unknown) => acquireLease(i), renewLease: (i: unknown) => renewLease(i), releaseLease: (i: unknown) => releaseLease(i) }));

import { executeWithLease } from '../execute-with-lease';
const OPTS = { runId: '11111111-1111-1111-1111-111111111111', owner: 'inst-a', ttlSeconds: 4 };

beforeEach(() => { acquireLease.mockReset(); renewLease.mockClear(); releaseLease.mockClear(); renewLease.mockResolvedValue(null); releaseLease.mockResolvedValue(null); });

describe('executeWithLease', () => {
  it('runs the work and releases as completed when the lease is acquired', async () => {
    acquireLease.mockResolvedValue({ acquired: true, run: { id: OPTS.runId } });
    const out = await executeWithLease(OPTS, async () => 42);
    expect(out).toEqual({ ran: true, result: 42 });
    expect(releaseLease).toHaveBeenCalledWith(expect.objectContaining({ runId: OPTS.runId, owner: 'inst-a', nextStatus: 'completed' }));
  });

  it('SKIPS the work (no double-execution) when another owner holds the lease', async () => {
    acquireLease.mockResolvedValue({ acquired: false, run: { id: OPTS.runId }, reason: 'held by inst-b' });
    const work = vi.fn();
    const out = await executeWithLease(OPTS, work as () => Promise<unknown>);
    expect(out).toEqual({ ran: false, reason: 'lease-held' });
    expect(work).not.toHaveBeenCalled();
    expect(releaseLease).not.toHaveBeenCalled();
  });

  it('releases as failed and rethrows when the work throws', async () => {
    acquireLease.mockResolvedValue({ acquired: true, run: { id: OPTS.runId } });
    await expect(executeWithLease(OPTS, async () => { throw new Error('boom'); })).rejects.toThrow('boom');
    expect(releaseLease).toHaveBeenCalledWith(expect.objectContaining({ nextStatus: 'failed' }));
  });

  it('reports lease-error when the run cannot be found/parsed', async () => {
    acquireLease.mockResolvedValue({ acquired: false, run: null });
    const out = await executeWithLease(OPTS, async () => 1);
    expect(out).toEqual({ ran: false, reason: 'lease-error' });
  });
});
