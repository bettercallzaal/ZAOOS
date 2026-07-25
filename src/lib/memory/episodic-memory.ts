/**
 * Episodic memory - the ordered log of what happened. Append-only: unlike
 * working memory it does NOT dedup, because each occurrence of an event is part
 * of the history (a price re-served twice is two data points in time). Bounded
 * by a max length; when full the oldest episode is dropped (the archive layer,
 * not yet implemented, will eventually catch what falls off the end).
 */

import type { LayerHealth, MemoryLayer, MemoryQuery, MemoryRecord } from './types';

export interface EpisodicMemoryOptions {
  /** Max episodes retained (oldest dropped when exceeded). */
  maxItems?: number;
}

export class EpisodicMemory implements MemoryLayer {
  readonly layer = 'episodic' as const;
  private readonly maxItems: number;
  /** Oldest-first append log. */
  private log: MemoryRecord[] = [];
  private dropped = 0;

  constructor(opts: EpisodicMemoryOptions = {}) {
    this.maxItems = opts.maxItems ?? 10_000;
  }

  store(rec: MemoryRecord): void {
    this.log.push(rec);
    while (this.log.length > this.maxItems) {
      this.log.shift();
      this.dropped++;
    }
  }

  recall(q: MemoryQuery): MemoryRecord[] {
    const sinceMs = q.since ? Date.parse(q.since) : -Infinity;
    const out: MemoryRecord[] = [];
    // Newest-first.
    for (let i = this.log.length - 1; i >= 0; i--) {
      const rec = this.log[i];
      if (q.kind && rec.kind !== q.kind) continue;
      if (q.subjectKey && rec.subjectKey !== q.subjectKey) continue;
      if (Date.parse(rec.storedAt) < sinceMs) continue;
      out.push(rec);
      if (q.limit && out.length >= q.limit) break;
    }
    return out;
  }

  size(): number {
    return this.log.length;
  }

  health(): LayerHealth {
    return {
      layer: this.layer,
      count: this.log.length,
      status: 'healthy',
      note: this.dropped > 0 ? `${this.dropped} dropped past cap` : undefined,
    };
  }
}
