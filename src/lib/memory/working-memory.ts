/**
 * Working memory - "what is happening now". Bounded, TTL-expiring, and deduped
 * by contentHash so the same value re-served by a feed does not pile up. This
 * is the hot, small layer the Brain reads to know the current state of the
 * world; it is NOT the historical record (that is episodic).
 */

import type { LayerHealth, MemoryLayer, MemoryQuery, MemoryRecord } from './types';

export interface WorkingMemoryOptions {
  /** Max items retained (oldest evicted first). */
  maxItems?: number;
  /** Time-to-live per item in ms; expired items are dropped on access. */
  ttlMs?: number;
  now?: () => string;
}

export class WorkingMemory implements MemoryLayer {
  readonly layer = 'working' as const;
  private readonly maxItems: number;
  private readonly ttlMs: number;
  private readonly now: () => string;
  /** Keyed by contentHash - one live entry per distinct observed content. */
  private items = new Map<string, MemoryRecord>();
  private evicted = 0;

  constructor(opts: WorkingMemoryOptions = {}) {
    this.maxItems = opts.maxItems ?? 500;
    this.ttlMs = opts.ttlMs ?? 5 * 60_000;
    this.now = opts.now ?? (() => new Date().toISOString());
  }

  private nowMs(): number {
    return Date.parse(this.now());
  }

  /** Drop expired entries. Called on every access so recall never returns stale. */
  private sweep(): void {
    const cutoff = this.nowMs() - this.ttlMs;
    for (const [hash, rec] of this.items) {
      if (Date.parse(rec.storedAt) < cutoff) {
        this.items.delete(hash);
        this.evicted++;
      }
    }
  }

  store(rec: MemoryRecord): void {
    this.sweep();
    // Re-inserting a hash refreshes its recency (Map keeps insertion order).
    this.items.delete(rec.contentHash);
    this.items.set(rec.contentHash, rec);
    while (this.items.size > this.maxItems) {
      const oldest = this.items.keys().next().value;
      if (oldest === undefined) break;
      this.items.delete(oldest);
      this.evicted++;
    }
  }

  recall(q: MemoryQuery): MemoryRecord[] {
    this.sweep();
    const sinceMs = q.since ? Date.parse(q.since) : -Infinity;
    const out: MemoryRecord[] = [];
    // Iterate newest-first (Map is oldest-first, so reverse).
    for (const rec of [...this.items.values()].reverse()) {
      if (q.kind && rec.kind !== q.kind) continue;
      if (q.subjectKey && rec.subjectKey !== q.subjectKey) continue;
      if (Date.parse(rec.storedAt) < sinceMs) continue;
      out.push(rec);
      if (q.limit && out.length >= q.limit) break;
    }
    return out;
  }

  size(): number {
    this.sweep();
    return this.items.size;
  }

  health(): LayerHealth {
    return {
      layer: this.layer,
      count: this.size(),
      status: this.items.size <= this.maxItems ? 'healthy' : 'degraded',
      note: this.evicted > 0 ? `${this.evicted} evicted (ttl/cap)` : undefined,
    };
  }
}
