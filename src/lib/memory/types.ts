/**
 * Memory - the layered remembering organ. Types + contracts.
 *
 * Memory is not one store; it is a stack of layers, each with a different job
 * and retention (doc 2064). The organism writes an Observation once and every
 * layer that cares keeps its own view of it:
 *
 *   working      - what is happening NOW (bounded, TTL, deduped by contentHash)
 *   episodic     - the ordered log of what happened (append-only, time-ranged)
 *   semantic     - distilled facts (not yet implemented)
 *   vector       - embeddings for similarity recall (not yet implemented)
 *   receipt      - immutable proof records (not yet implemented)
 *   archive      - cold long-term storage (not yet implemented)
 *   swarm        - shared across organism instances (not yet implemented)
 *   organism-state - the organism's own operational state (not yet implemented)
 *
 * Boundary: Memory STORES and RECALLS. It never decides what an observation
 * means, never acts on it, and never reaches back out to the world. It is fed
 * by the Bloodstream and read by the Brain/Spine.
 */

export type LayerKind =
  | 'working'
  | 'episodic'
  | 'semantic'
  | 'vector'
  | 'receipt'
  | 'archive'
  | 'swarm'
  | 'organism-state';

/**
 * One remembered item. Derived from an Observation but decoupled from it - a
 * layer keeps only what recall needs, plus the content hash for dedup/lineage.
 */
export interface MemoryRecord {
  /** Stable id (the source observationId). */
  id: string;
  kind: string;
  subjectKey: string;
  /** sha256 of the observed content - dedup + lineage back to the Observation. */
  contentHash: string;
  /** When the observed event happened, if known. */
  observedAt: string | null;
  /** When this layer stored it (ISO). */
  storedAt: string;
  /** The sensor/spike that originally produced it. */
  source: string;
  payload: unknown;
}

/** A recall query. All fields optional - omitted means "any". */
export interface MemoryQuery {
  kind?: string;
  subjectKey?: string;
  /** storedAt >= since (ISO). */
  since?: string;
  /** Newest N (layers return newest-first). */
  limit?: number;
}

export interface LayerHealth {
  layer: LayerKind;
  count: number;
  status: 'healthy' | 'degraded';
  /** Layer-specific note (e.g. evictions, capacity). */
  note?: string;
}

/**
 * A memory layer. Same interface for every layer so the Memory organ can fan a
 * write across all of them and the Control Plane can roll up their health,
 * regardless of what each layer does internally.
 */
export interface MemoryLayer {
  readonly layer: LayerKind;
  store(rec: MemoryRecord): void;
  recall(q: MemoryQuery): MemoryRecord[];
  size(): number;
  health(): LayerHealth;
}

export interface MemoryOptions {
  /** Clock - injectable for deterministic tests. */
  now?: () => string;
  /** Override the default layer set (working + episodic). */
  layers?: MemoryLayer[];
}
