import { describe, it, expect } from 'vitest';
import { assembleOrganism } from '../index';
import { createCoinbaseSpotSpike } from '@/lib/bloodstream/spikes/coinbase-spike';

/**
 * The end-to-end proof: a real-shaped Coinbase Vacuum Spike (fetch injected so
 * CI is deterministic) -> Bloodstream -> Memory, with both organs registered in
 * the Control Plane. This is the "contracts RUN, not just compile" test.
 */
describe('organism - first living end-to-end flow', () => {
  function build() {
    let clock = 0;
    const now = () => new Date(clock).toISOString();
    let amount = '3421.55';
    const spike = createCoinbaseSpotSpike('ETH-USD', {
      fetchJson: async () => ({ data: { amount, base: 'ETH', currency: 'USD' } }),
      minIntervalMs: 0, // isolate the flow from the rate limiter for the test
    });
    const org = assembleOrganism({
      now,
      spike,
      bloodstream: { sleep: async () => {}, cacheTtlMs: 60_000 },
    });
    return {
      org,
      setClock: (t: number) => { clock = t; },
      setAmount: (a: string) => { amount = a; },
    };
  }

  it('pulls a real market observation all the way into Memory, healthy in the Control Plane', async () => {
    const { org } = build();
    const t1 = await org.runTick();

    // circulated end to end
    expect(t1.circulated[0].ok).toBe(true);
    expect(t1.circulated[0].ingested).toBe(1);
    expect(t1.circulated[0].distributed).toBe(1);
    expect(t1.stored).toBe(1);

    // the actual value landed in Memory
    const working = org.memory.recall({ kind: 'market.price' }, 'working');
    expect(working).toHaveLength(1);
    expect((working[0].payload as { price: number }).price).toBe(3421.55);
    expect(working[0].source).toBe('coinbase-eth-usd');

    // the Control Plane sees both organs live + healthy
    expect(t1.snapshot.total).toBe(2);
    expect(t1.snapshot.healthy).toBe(2);
    expect(t1.snapshot.degraded).toBe(0);
    const providers = org.controlPlane.discover('market.price');
    expect(providers.some((p) => p.organId === 'bloodstream' && p.status === 'healthy')).toBe(true);
  });

  it('the Bloodstream cache prevents a double-store of the same value', async () => {
    const { org, setClock } = build();
    await org.runTick();
    setClock(1000); // advance past minInterval, still inside the 60s cache TTL
    const t2 = await org.runTick();
    expect(t2.circulated[0].deduped).toBe(1);
    expect(t2.stored).toBe(1); // cache stopped the repeat from reaching Memory
  });

  it('a changed price flows through as a new observation', async () => {
    const { org, setClock, setAmount } = build();
    await org.runTick();
    setClock(2000);
    setAmount('3500.00');
    const t3 = await org.runTick();
    expect(t3.stored).toBe(2);
    // working dedups by content, so two distinct prices = two live entries
    expect(org.memory.recall({ kind: 'market.price' }, 'working')).toHaveLength(2);
    // episodic keeps the full history in time order
    expect(org.memory.recall({}, 'episodic')).toHaveLength(2);
  });

  it('memory depends on bloodstream, and the plane reports no unmet dependencies', async () => {
    const { org } = build();
    await org.runTick();
    expect(org.controlPlane.unmetDependencies('memory')).toEqual([]);
  });
});
