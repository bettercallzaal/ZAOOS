/**
 * Receipt emitter - Phase 2 completed in the LIVE path.
 *
 * A Bloodstream Subscriber that turns every distributed Observation into a
 * portable `dreamnet.receipt.v1` (Phase 3-conformant, PR #2704) and hands it
 * to an injectable sink. The Bloodstream transports and never decides; receipt
 * emission is therefore a SUBSCRIBER, not a core change - unplug the
 * subscriber and the organism runs exactly as before.
 *
 * The default sink is a bounded in-memory ring (drop-oldest), which is enough
 * for the organism demo + the Phase 4 verify endpoint to serve recent
 * receipts. A durable sink (DB/outbox) plugs in via `onReceipt` without
 * touching this module - that is the transactional-outbox milestone
 * (doc 2142 next focus).
 */
import type { Observation } from '@/lib/eyes';
import type { Subscriber } from '@/lib/bloodstream/types';
import { observationToReceipt, type PortableReceipt } from './receipt';

export interface ReceiptEmitterOptions {
  /** Receipt issuer identity, e.g. 'organism:zao:main'. */
  issuer: string;
  /** Receive each receipt (durable store, transport, ...). Errors are isolated. */
  onReceipt?: (receipt: PortableReceipt) => void | Promise<void>;
  /** Ring size for the in-memory buffer. Default 500. */
  bufferSize?: number;
  /** Injectable clock for deterministic tests. */
  now?: () => string;
}

export class ReceiptEmitter {
  private readonly issuer: string;
  private readonly onReceipt?: ReceiptEmitterOptions['onReceipt'];
  private readonly bufferSize: number;
  private readonly nowFn?: () => string;
  private readonly ring: PortableReceipt[] = [];
  private emittedCount = 0;
  private sinkErrors = 0;

  constructor(opts: ReceiptEmitterOptions) {
    if (!opts.issuer?.trim()) throw new Error('ReceiptEmitter: issuer required');
    this.issuer = opts.issuer;
    this.onReceipt = opts.onReceipt;
    this.bufferSize = opts.bufferSize ?? 500;
    this.nowFn = opts.now;
  }

  /** The Bloodstream subscriber. Never throws (delivery isolation is ours too). */
  subscriber(): Subscriber {
    return {
      id: 'receipt-emitter',
      kinds: [], // every observation becomes portable evidence
      deliver: async (obs: Observation) => {
        try {
          const receipt = observationToReceipt(obs, this.issuer, this.nowFn ? { now: this.nowFn() } : undefined);
          this.ring.push(receipt);
          if (this.ring.length > this.bufferSize) this.ring.shift();
          this.emittedCount++;
          if (this.onReceipt) await this.onReceipt(receipt);
        } catch {
          // A sink failure must never break circulation; count it loudly in
          // metrics instead of swallowing silently (silent-failure-guard 6).
          this.sinkErrors++;
        }
      },
    };
  }

  /** Most-recent receipts, newest last. */
  recent(limit = 50): readonly PortableReceipt[] {
    return this.ring.slice(-limit);
  }

  /** Find a buffered receipt by id (the Phase 4 GET /receipts/:id read). */
  byId(receiptId: string): PortableReceipt | undefined {
    return this.ring.find((r) => r.receiptId === receiptId);
  }

  metrics(): { emitted: number; buffered: number; sinkErrors: number } {
    return { emitted: this.emittedCount, buffered: this.ring.length, sinkErrors: this.sinkErrors };
  }
}
