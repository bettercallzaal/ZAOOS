/**
 * Bloodstream - the circulatory core.
 *
 * Registers Vacuum Spikes, circulates (ingest with retry/backoff + rate-limit),
 * normalizes into the shared Observation contract, enriches, caches + dedups,
 * prioritizes, and distributes to subscribers. Downstream organs SUBSCRIBE by
 * observation kind rather than polling the outside world themselves - that is
 * the whole point of a shared circulatory system.
 *
 * It transports; it never decides. Pure orchestration + in-memory state; the
 * only outward I/O is a spike's own read-only ingest().
 */

import { observationContentHash } from '@/lib/eyes';
import type { Observation } from '@/lib/eyes';
import {
  DEFAULT_BACKOFF,
  type VacuumSpike,
  type VacuumSpikeManifest,
  type SpikeHealth,
  type SpikeStatus,
  type Enricher,
  type Subscriber,
  type BloodstreamMetrics,
  type IngestContext,
  type BackoffPolicy,
} from './types';

export class SpikeManifestError extends Error {}

export function validateSpikeManifest(m: VacuumSpikeManifest): void {
  if (!m.spikeId?.trim()) throw new SpikeManifestError('spikeId required');
  if (!m.version) throw new SpikeManifestError(`${m.spikeId}: version required`);
  if (m.riskTier !== 'passive') throw new SpikeManifestError(`${m.spikeId}: spikes must be riskTier 'passive'`);
  if (!['poll', 'subscribe'].includes(m.strategy)) throw new SpikeManifestError(`${m.spikeId}: bad strategy`);
  if (m.strategy === 'poll' && !(m.pollIntervalMs && m.pollIntervalMs > 0)) throw new SpikeManifestError(`${m.spikeId}: poll needs pollIntervalMs`);
  if (!Array.isArray(m.produces) || m.produces.length === 0) throw new SpikeManifestError(`${m.spikeId}: produces[] required`);
}

interface SpikeState {
  consecutiveFailures: number;
  lastOkAt: string | null;
  lastLatencyMs: number;
  lastPollAtMs: number;
  totalIngested: number;
  totalErrors: number;
  rateLimited: number;
  cursor?: string;
  recent: boolean[];
}

const WINDOW = 20;

export interface CirculateResult {
  spikeId: string;
  ingested: number;
  distributed: number;
  deduped: number;
  ok: boolean;
  skipped?: 'rate-limited';
  error?: string;
}

export interface BloodstreamOptions {
  /** TTL for the observation cache, ms. */
  cacheTtlMs?: number;
  /** Max cache entries (drop-oldest). */
  cacheSize?: number;
  /** Sleep function - injectable so backoff is deterministic in tests. */
  sleep?: (ms: number) => Promise<void>;
}

export class Bloodstream {
  private spikes = new Map<string, VacuumSpike>();
  private state = new Map<string, SpikeState>();
  private enrichers: Enricher[] = [];
  private subscribers = new Map<string, Subscriber>();
  private cache = new Map<string, { at: number; obs: Observation }>();
  private metrics: BloodstreamMetrics = { spikes: 0, subscribers: 0, circulated: 0, cachedHits: 0, deduped: 0, distributed: 0, deliveryErrors: 0 };
  private readonly cacheTtlMs: number;
  private readonly cacheSize: number;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(opts: BloodstreamOptions = {}) {
    this.cacheTtlMs = opts.cacheTtlMs ?? 60_000;
    this.cacheSize = opts.cacheSize ?? 5000;
    this.sleep = opts.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  }

  // ---- registration ----
  registerSpike(spike: VacuumSpike): void {
    validateSpikeManifest(spike.manifest);
    if (this.spikes.has(spike.manifest.spikeId)) throw new SpikeManifestError(`${spike.manifest.spikeId}: already registered`);
    this.spikes.set(spike.manifest.spikeId, spike);
    this.state.set(spike.manifest.spikeId, { consecutiveFailures: 0, lastOkAt: null, lastLatencyMs: 0, lastPollAtMs: 0, totalIngested: 0, totalErrors: 0, rateLimited: 0, recent: [] });
    this.metrics.spikes = this.spikes.size;
  }
  replaceSpike(spike: VacuumSpike): void {
    validateSpikeManifest(spike.manifest);
    this.spikes.set(spike.manifest.spikeId, spike);
    if (!this.state.has(spike.manifest.spikeId)) this.state.set(spike.manifest.spikeId, { consecutiveFailures: 0, lastOkAt: null, lastLatencyMs: 0, lastPollAtMs: 0, totalIngested: 0, totalErrors: 0, rateLimited: 0, recent: [] });
    this.metrics.spikes = this.spikes.size;
  }
  removeSpike(spikeId: string): boolean {
    this.state.delete(spikeId);
    const ok = this.spikes.delete(spikeId);
    this.metrics.spikes = this.spikes.size;
    return ok;
  }
  listSpikes(): VacuumSpikeManifest[] {
    return [...this.spikes.values()].map((s) => s.manifest);
  }
  addEnricher(e: Enricher): void {
    this.enrichers.push(e);
  }
  subscribe(sub: Subscriber): () => void {
    this.subscribers.set(sub.id, sub);
    this.metrics.subscribers = this.subscribers.size;
    return () => {
      this.subscribers.delete(sub.id);
      this.metrics.subscribers = this.subscribers.size;
    };
  }

  getMetrics(): BloodstreamMetrics {
    return { ...this.metrics };
  }

  // ---- health ----
  private status(s: SpikeState): SpikeStatus {
    if (s.consecutiveFailures >= 5) return 'failing';
    if (s.consecutiveFailures >= 2) return 'degraded';
    return 'healthy';
  }
  private errorRate(s: SpikeState): number {
    if (s.recent.length === 0) return 0;
    return Number((s.recent.filter((ok) => !ok).length / s.recent.length).toFixed(3));
  }
  healthOf(spikeId: string): SpikeHealth | null {
    const s = this.state.get(spikeId);
    if (!s) return null;
    return { spikeId, status: this.status(s), latencyMs: s.lastLatencyMs, errorRate: this.errorRate(s), lastOkAt: s.lastOkAt, consecutiveFailures: s.consecutiveFailures, totalIngested: s.totalIngested, totalErrors: s.totalErrors, rateLimited: s.rateLimited };
  }
  allHealth(): SpikeHealth[] {
    return [...this.spikes.keys()].map((id) => this.healthOf(id)!).filter(Boolean);
  }

  // ---- circulation ----
  private nowMs(ctx: IngestContext): number {
    return ctx.now ? new Date(ctx.now).getTime() : Date.now();
  }

  private async ingestWithBackoff(spike: VacuumSpike, ctx: IngestContext, policy: BackoffPolicy) {
    let attempt = 0;
    let lastErr: unknown;
    while (attempt <= policy.maxRetries) {
      try {
        return await spike.ingest(ctx);
      } catch (err) {
        lastErr = err;
        if (attempt === policy.maxRetries) break;
        const delay = Math.min(policy.maxDelayMs, policy.baseDelayMs * policy.factor ** attempt);
        await this.sleep(delay);
        attempt++;
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
  }

  private cacheGetFresh(hash: string, nowMs: number): boolean {
    const hit = this.cache.get(hash);
    if (hit && nowMs - hit.at < this.cacheTtlMs) return true;
    return false;
  }
  private cachePut(hash: string, obs: Observation, nowMs: number): void {
    this.cache.set(hash, { at: nowMs, obs });
    if (this.cache.size > this.cacheSize) {
      const oldest = this.cache.keys().next().value;
      if (oldest !== undefined) this.cache.delete(oldest);
    }
  }

  private enrich(obs: Observation): Observation {
    let cur = obs;
    for (const e of this.enrichers) {
      if (e.appliesTo.length === 0 || e.appliesTo.includes(cur.kind)) {
        try {
          cur = e.enrich(cur);
        } catch {
          // an enricher failure must not drop the observation
        }
      }
    }
    return cur;
  }

  private async distribute(obs: Observation): Promise<void> {
    for (const sub of this.subscribers.values()) {
      if (sub.kinds.length && !sub.kinds.includes(obs.kind)) continue;
      try {
        await sub.deliver(obs);
        this.metrics.distributed++;
      } catch {
        this.metrics.deliveryErrors++;
      }
    }
  }

  /**
   * Circulate one spike: rate-limit check, ingest with retry/backoff, then for
   * each observation enrich -> cache-dedup -> distribute. A cached-fresh
   * observation (same contentHash within TTL) is NOT re-distributed - that is
   * how the Bloodstream stops N subsystems from re-processing the same feed.
   */
  async circulateSpike(spikeId: string, ctx: IngestContext): Promise<CirculateResult> {
    const spike = this.spikes.get(spikeId);
    const s = this.state.get(spikeId);
    if (!spike || !s) return { spikeId, ingested: 0, distributed: 0, deduped: 0, ok: false, error: 'not registered' };
    const nowMs = this.nowMs(ctx);

    // Rate limit: honor minIntervalMs since the last poll.
    const minInterval = spike.manifest.minIntervalMs ?? 0;
    if (minInterval && s.lastPollAtMs && nowMs - s.lastPollAtMs < minInterval) {
      s.rateLimited++;
      return { spikeId, ingested: 0, distributed: 0, deduped: 0, ok: true, skipped: 'rate-limited' };
    }
    s.lastPollAtMs = nowMs;

    let result;
    try {
      result = await this.ingestWithBackoff(spike, { ...ctx, cursor: s.cursor }, spike.manifest.backoff ?? DEFAULT_BACKOFF);
    } catch (err) {
      s.totalErrors++;
      s.consecutiveFailures++;
      s.recent.push(false);
      if (s.recent.length > WINDOW) s.recent.shift();
      return { spikeId, ingested: 0, distributed: 0, deduped: 0, ok: false, error: err instanceof Error ? err.message : String(err) };
    }

    if (result.cursor !== undefined) s.cursor = result.cursor;
    let distributed = 0;
    let deduped = 0;
    for (const raw of result.observations) {
      const enriched = this.enrich(raw);
      const hash = enriched.contentHash || observationContentHash({ kind: enriched.kind, subjectKey: enriched.subjectKey, payload: enriched.payload });
      if (this.cacheGetFresh(hash, nowMs)) {
        deduped++;
        this.metrics.deduped++;
        this.metrics.cachedHits++;
        continue;
      }
      this.cachePut(hash, enriched, nowMs);
      await this.distribute(enriched);
      distributed++;
    }
    s.totalIngested += result.observations.length;
    s.consecutiveFailures = 0;
    s.lastOkAt = ctx.now ?? new Date().toISOString();
    s.lastLatencyMs = Math.max(0, this.nowMs(ctx) - nowMs);
    s.recent.push(true);
    if (s.recent.length > WINDOW) s.recent.shift();
    this.metrics.circulated++;
    return { spikeId, ingested: result.observations.length, distributed, deduped, ok: true };
  }

  /** Circulate every registered spike once, isolated. */
  async circulateAll(ctx: IngestContext): Promise<CirculateResult[]> {
    return Promise.all([...this.spikes.keys()].map((id) => this.circulateSpike(id, ctx)));
  }
}
