/**
 * ListenerRegistry - the Ears plug board.
 *
 * Mirrors the Eyes SensorRegistry but for PUSH: instead of running observe
 * cycles, it ingests raw events pushed to it, hands them to the right listener
 * for normalization, and handles the two problems push has that poll does not:
 *   - at-least-once delivery -> DEDUP (by delivery id and Observation contentHash)
 *   - event storms -> BACKPRESSURE (a bounded replay buffer, drop-oldest)
 * plus connection-state health for reconnect tracking.
 *
 * It moves Observations outward; it never decides what they mean.
 */

import type { Observation } from '@/lib/eyes';
import type {
  Listener,
  ListenerManifest,
  ListenerHealth,
  ListenerConnState,
  EventEnvelope,
  EarContext,
} from './types';

export class ListenerManifestError extends Error {}

export function validateListenerManifest(m: ListenerManifest): void {
  if (!m.listenerId || !m.listenerId.trim()) throw new ListenerManifestError('listenerId required');
  if (!m.version) throw new ListenerManifestError(`${m.listenerId}: version required`);
  if (m.riskTier !== 'passive') throw new ListenerManifestError(`${m.listenerId}: Ears listeners must be riskTier 'passive'`);
  if (!['webhook', 'websocket', 'sse', 'queue', 'poll-bridge'].includes(m.transport)) throw new ListenerManifestError(`${m.listenerId}: bad transport`);
  if (!Array.isArray(m.produces) || m.produces.length === 0) throw new ListenerManifestError(`${m.listenerId}: produces[] required`);
}

interface HealthState {
  connection: ListenerConnState;
  reconnects: number;
  totalReceived: number;
  totalDeduped: number;
  totalObservations: number;
  totalErrors: number;
  lastEventAt: string | null;
}

export interface IngestResult {
  listenerId: string;
  /** Newly-seen observations (dedup already applied). */
  observations: Observation[];
  /** How many were dropped as duplicates. */
  deduped: number;
  ok: boolean;
  error?: string;
}

export interface ListenerRegistryOptions {
  /** Max recent contentHashes/deliveryIds kept for dedup. */
  dedupWindow?: number;
  /** Max observations kept in the replay buffer (backpressure bound). */
  replayBufferSize?: number;
}

export class ListenerRegistry {
  private listeners = new Map<string, Listener>();
  private health = new Map<string, HealthState>();
  private seen = new Set<string>(); // dedup keys (deliveryId or contentHash), insertion-ordered
  private replay: Observation[] = [];
  private readonly dedupWindow: number;
  private readonly replayBufferSize: number;

  constructor(opts: ListenerRegistryOptions = {}) {
    this.dedupWindow = opts.dedupWindow ?? 5000;
    this.replayBufferSize = opts.replayBufferSize ?? 1000;
  }

  private fresh(): HealthState {
    return { connection: 'idle', reconnects: 0, totalReceived: 0, totalDeduped: 0, totalObservations: 0, totalErrors: 0, lastEventAt: null };
  }

  register(listener: Listener): void {
    validateListenerManifest(listener.manifest);
    if (this.listeners.has(listener.manifest.listenerId)) {
      throw new ListenerManifestError(`${listener.manifest.listenerId}: already registered (use replace to hot-swap)`);
    }
    this.listeners.set(listener.manifest.listenerId, listener);
    this.health.set(listener.manifest.listenerId, this.fresh());
  }

  /** Hot-swap a live listener (or add it). Connection health resets. */
  replace(listener: Listener): void {
    validateListenerManifest(listener.manifest);
    this.listeners.set(listener.manifest.listenerId, listener);
    this.health.set(listener.manifest.listenerId, this.fresh());
  }

  unregister(listenerId: string): boolean {
    this.health.delete(listenerId);
    return this.listeners.delete(listenerId);
  }

  get(listenerId: string): Listener | undefined {
    return this.listeners.get(listenerId);
  }

  list(): ListenerManifest[] {
    return [...this.listeners.values()].map((l) => l.manifest);
  }

  /** Record a transport reconnect (a listener calls this when it re-establishes). */
  markReconnect(listenerId: string): void {
    const h = this.health.get(listenerId);
    if (h) {
      h.reconnects += 1;
      h.connection = 'connected';
    }
  }

  /** Record a dropped transport connection. */
  markDropped(listenerId: string): void {
    const h = this.health.get(listenerId);
    if (h) h.connection = 'dropped';
  }

  private remember(key: string): boolean {
    // returns true if NEW, false if already seen
    if (this.seen.has(key)) return false;
    this.seen.add(key);
    if (this.seen.size > this.dedupWindow) {
      // drop oldest (insertion order)
      const oldest = this.seen.values().next().value;
      if (oldest !== undefined) this.seen.delete(oldest);
    }
    return true;
  }

  private buffer(obs: Observation): void {
    this.replay.push(obs);
    if (this.replay.length > this.replayBufferSize) this.replay.shift(); // backpressure: drop-oldest
  }

  /**
   * Ingest one raw event: normalize via the listener, dedup (by deliveryId AND
   * per-observation contentHash), buffer for replay, and return the newly-seen
   * observations. Isolates failure - a throwing listener is recorded and returns
   * ok:false, never taking down the registry.
   */
  ingest(listenerId: string, event: EventEnvelope, ctx: Omit<EarContext, 'config'> & { config?: EarContext['config'] }): IngestResult {
    const listener = this.listeners.get(listenerId);
    if (!listener) return { listenerId, observations: [], deduped: 0, ok: false, error: 'not registered' };
    const h = this.health.get(listenerId)!;
    h.totalReceived += 1;
    h.lastEventAt = event.receivedAt;
    h.connection = 'connected';

    // Transport-level dedup by delivery id (before we even normalize).
    if (event.deliveryId && !this.remember(`d:${listenerId}:${event.deliveryId}`)) {
      h.totalDeduped += 1;
      return { listenerId, observations: [], deduped: 1, ok: true };
    }

    let produced: Observation[];
    try {
      produced = listener.onEvent(event, { observerId: ctx.observerId, config: ctx.config ?? {}, now: ctx.now });
    } catch (err) {
      h.totalErrors += 1;
      return { listenerId, observations: [], deduped: 0, ok: false, error: err instanceof Error ? err.message : String(err) };
    }

    // Content-level dedup by contentHash (catches redelivery with a new delivery id).
    const fresh: Observation[] = [];
    let deduped = 0;
    for (const o of produced) {
      if (this.remember(`h:${o.contentHash}`)) {
        fresh.push(o);
        this.buffer(o);
      } else {
        deduped += 1;
      }
    }
    h.totalObservations += fresh.length;
    h.totalDeduped += deduped;
    return { listenerId, observations: fresh, deduped, ok: true };
  }

  /** The replay buffer - recent observations, for a consumer that reconnected. */
  replayBuffer(): readonly Observation[] {
    return this.replay;
  }

  healthOf(listenerId: string): ListenerHealth | null {
    const h = this.health.get(listenerId);
    if (!h) return null;
    // lag = how full the replay buffer is (a coarse backpressure signal).
    return {
      listenerId,
      connection: h.connection,
      lag: this.replay.length,
      reconnects: h.reconnects,
      totalReceived: h.totalReceived,
      totalDeduped: h.totalDeduped,
      totalObservations: h.totalObservations,
      totalErrors: h.totalErrors,
      lastEventAt: h.lastEventAt,
    };
  }

  allHealth(): ListenerHealth[] {
    return [...this.listeners.keys()].map((id) => this.healthOf(id)!).filter(Boolean);
  }
}
