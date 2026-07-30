import { describe, it, expect } from 'vitest';
import { Bloodstream } from '@/lib/bloodstream';
import type { VacuumSpike } from '@/lib/bloodstream';
import { createObservation } from '@/lib/eyes';
import { ReceiptEmitter } from '../receipt-emitter';
import { verifyReceipt } from '../receipt';
import { toDreamNetReceipt, verifyDreamNetReceipt } from '../interop';

/**
 * ReceiptEmitter - every distributed Observation leaves as verifiable
 * evidence; dedup means no duplicate receipts; sink failures never break
 * circulation.
 */

const NOW = '2026-07-30T05:00:00.000Z';

function fakeSpike(payloads: Array<{ subjectKey: string; price: number }>): VacuumSpike {
  return {
    manifest: {
      spikeId: 'spike:test',
      version: '1',
      riskTier: 'passive',
      strategy: 'poll',
      pollIntervalMs: 1000,
      produces: ['market.price'],
    },
    ingest: async (ctx) => ({
      observations: payloads.map((p) =>
        createObservation(
          {
            sensor: 'spike:test',
            kind: 'market.price',
            subjectKey: p.subjectKey,
            payload: { price: p.price },
            confidence: 1,
            provenance: { method: 'api' },
            health: { status: 'healthy', latencyMs: 1, errorRate: 0, lastOkAt: null, consecutiveFailures: 0 },
          },
          { observerId: ctx.observerId, now: NOW },
        ),
      ),
    }),
  };
}

describe('ReceiptEmitter as a Bloodstream subscriber', () => {
  it('emits one verifiable receipt per distributed observation', async () => {
    const blood = new Bloodstream();
    blood.registerSpike(fakeSpike([{ subjectKey: 'asset:BTC-USD', price: 100 }, { subjectKey: 'asset:ETH-USD', price: 50 }]));
    const emitter = new ReceiptEmitter({ issuer: 'organism:zao:test', now: () => NOW });
    blood.subscribe(emitter.subscriber());

    const result = await blood.circulateSpike('spike:test', { observerId: 'o1', config: {}, now: NOW });
    expect(result.distributed).toBe(2);
    const receipts = emitter.recent();
    expect(receipts).toHaveLength(2);
    for (const r of receipts) {
      expect(r.schemaVersion).toBe('dreamnet.receipt.v1');
      expect(r.issuer).toBe('organism:zao:test');
      expect(verifyReceipt(r)).toBe(true);
      // ...and it round-trips into the SDK receipt.v1 shape and verifies.
      const dn = toDreamNetReceipt(r);
      expect(
        verifyDreamNetReceipt(dn, { kind: r.spore.kind, subjectKey: r.spore.subjectKey, payload: r.spore.payload }).isValid,
      ).toBe(true);
    }
  });

  it('deduped observations do not emit duplicate receipts', async () => {
    const blood = new Bloodstream();
    blood.registerSpike(fakeSpike([{ subjectKey: 'asset:BTC-USD', price: 100 }]));
    const emitter = new ReceiptEmitter({ issuer: 'organism:zao:test', now: () => NOW });
    blood.subscribe(emitter.subscriber());

    await blood.circulateSpike('spike:test', { observerId: 'o1', config: {}, now: NOW });
    await blood.circulateSpike('spike:test', { observerId: 'o1', config: {}, now: NOW });
    expect(emitter.recent()).toHaveLength(1); // second pass was cache-deduped upstream
    expect(emitter.metrics().emitted).toBe(1);
  });

  it('a throwing sink is isolated and counted, circulation continues', async () => {
    const blood = new Bloodstream();
    blood.registerSpike(fakeSpike([{ subjectKey: 'asset:BTC-USD', price: 100 }]));
    const emitter = new ReceiptEmitter({
      issuer: 'organism:zao:test',
      now: () => NOW,
      onReceipt: () => {
        throw new Error('sink down');
      },
    });
    blood.subscribe(emitter.subscriber());

    const result = await blood.circulateSpike('spike:test', { observerId: 'o1', config: {}, now: NOW });
    expect(result.ok).toBe(true);
    expect(result.distributed).toBe(1);
    expect(emitter.metrics().sinkErrors).toBe(1);
    // The receipt still landed in the ring before the sink threw.
    expect(emitter.recent()).toHaveLength(1);
  });

  it('ring buffer drops oldest beyond bufferSize; byId finds buffered receipts', async () => {
    const emitter = new ReceiptEmitter({ issuer: 'organism:zao:test', bufferSize: 2, now: () => NOW });
    const blood = new Bloodstream();
    blood.registerSpike(
      fakeSpike([
        { subjectKey: 'a', price: 1 },
        { subjectKey: 'b', price: 2 },
        { subjectKey: 'c', price: 3 },
      ]),
    );
    blood.subscribe(emitter.subscriber());
    await blood.circulateSpike('spike:test', { observerId: 'o1', config: {}, now: NOW });
    const recent = emitter.recent();
    expect(recent).toHaveLength(2);
    expect(emitter.metrics().emitted).toBe(3);
    expect(emitter.byId(recent[0].receiptId)?.receiptId).toBe(recent[0].receiptId);
    expect(emitter.byId('missing')).toBeUndefined();
  });
});
