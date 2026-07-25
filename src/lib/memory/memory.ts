/**
 * Memory - the organ. Composes layers, maps an incoming Observation to a
 * MemoryRecord once, and fans that write across every layer. Recall reads a
 * single named layer (working for "now", episodic for history). Health rolls up
 * every layer so the Control Plane can see the organ at a glance.
 *
 * Boundary: Memory is fed by the Bloodstream (its `record` method is what a
 * Bloodstream subscriber calls) and read by the Brain/Spine. It does not act.
 */

import type { Observation } from '@/lib/eyes';
import { EpisodicMemory } from './episodic-memory';
import type { LayerHealth, LayerKind, MemoryLayer, MemoryOptions, MemoryQuery, MemoryRecord } from './types';
import { WorkingMemory } from './working-memory';

export interface MemorySnapshot {
  total: number;
  layers: LayerHealth[];
  status: 'healthy' | 'degraded';
}

export class Memory {
  private readonly now: () => string;
  private readonly layers: MemoryLayer[];
  private stored = 0;

  constructor(opts: MemoryOptions = {}) {
    this.now = opts.now ?? (() => new Date().toISOString());
    this.layers = opts.layers ?? [new WorkingMemory({ now: this.now }), new EpisodicMemory()];
  }

  /** Map an Observation to a MemoryRecord (the storable projection of it). */
  private toRecord(obs: Observation): MemoryRecord {
    return {
      id: obs.observationId,
      kind: obs.kind,
      subjectKey: obs.subjectKey,
      contentHash: obs.contentHash,
      observedAt: obs.observedAt,
      storedAt: this.now(),
      source: obs.sensor,
      payload: obs.payload,
    };
  }

  /** Store an Observation across all layers. This is the Bloodstream subscriber hook. */
  record(obs: Observation): void {
    const rec = this.toRecord(obs);
    for (const layer of this.layers) layer.store(rec);
    this.stored++;
  }

  /** Recall from a named layer (default 'working' - the current state of the world). */
  recall(q: MemoryQuery = {}, layer: LayerKind = 'working'): MemoryRecord[] {
    const l = this.layers.find((x) => x.layer === layer);
    if (!l) throw new Error(`memory: no such layer '${layer}'`);
    return l.recall(q);
  }

  /** Total observations recorded (write count, not per-layer size). */
  total(): number {
    return this.stored;
  }

  layerKinds(): LayerKind[] {
    return this.layers.map((l) => l.layer);
  }

  snapshot(): MemorySnapshot {
    const layers = this.layers.map((l) => l.health());
    return {
      total: this.stored,
      layers,
      status: layers.every((h) => h.status === 'healthy') ? 'healthy' : 'degraded',
    };
  }
}
