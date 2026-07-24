/**
 * Bloodstream - the circulatory organ. Types + contracts.
 *
 * Eyes collect. The Bloodstream TRANSPORTS. Rather than every subsystem polling
 * the same APIs independently, the Bloodstream is one shared circulatory system
 * that continuously ingests (via Vacuum Spikes), normalizes to the shared
 * Observation contract, enriches, caches, prioritizes, and DISTRIBUTES to every
 * downstream organ that subscribed - so no organ polls the outside world twice.
 *
 * Flow: External World -> Vacuum Spike -> Observation -> normalization ->
 * Bloodstream -> Memory -> Brain -> Spine -> Hands -> Proof Drops.
 *
 * Boundary: the Bloodstream MOVES information; it never decides what it means.
 * A Vacuum Spike ingests read-only and emits Observations; there is no action,
 * write-to-the-world, or decide surface in these interfaces.
 */

import type { Observation } from '@/lib/eyes';

export type SpikeStatus = 'healthy' | 'degraded' | 'failing' | 'stopped';

/** Retry/backoff policy for a spike's ingest. */
export interface BackoffPolicy {
  maxRetries: number;
  baseDelayMs: number;
  /** Multiplier per attempt (exponential when > 1). */
  factor: number;
  maxDelayMs: number;
}

export const DEFAULT_BACKOFF: BackoffPolicy = { maxRetries: 3, baseDelayMs: 500, factor: 2, maxDelayMs: 8000 };

export interface SpikeHealth {
  spikeId: string;
  status: SpikeStatus;
  latencyMs: number;
  errorRate: number;
  lastOkAt: string | null;
  consecutiveFailures: number;
  totalIngested: number;
  totalErrors: number;
  /** Times the rate limiter deferred a poll. */
  rateLimited: number;
}

/**
 * A Vacuum Spike is a pluggable ingestion module for one external source. It
 * authenticates, polls or subscribes, validates, rate-limits, and emits
 * standardized Observations. It is read-only w.r.t. the outside world.
 */
export interface VacuumSpikeManifest {
  spikeId: string;
  version: string;
  description: string;
  /** What this spike can pull, e.g. ['weather.current', 'weather.forecast']. */
  capabilities: string[];
  /** Observation kinds it emits. */
  produces: string[];
  strategy: 'poll' | 'subscribe';
  pollIntervalMs?: number;
  requiredConfig: string[];
  /** Minimum ms between polls this source tolerates (rate limit). */
  minIntervalMs?: number;
  backoff?: BackoffPolicy;
  /** Ingestion is read-only. Fixed at the type level. */
  riskTier: 'passive';
}

/** Read-only context for one ingest cycle. */
export interface IngestContext {
  observerId: string;
  cursor?: string;
  config: Readonly<Record<string, string | undefined>>;
  now?: string;
}

export interface IngestResult {
  observations: Observation[];
  cursor?: string;
}

export interface VacuumSpike {
  readonly manifest: VacuumSpikeManifest;
  /** Authenticate + poll/subscribe + validate + normalize -> Observations. Read-only. */
  ingest(ctx: IngestContext): Promise<IngestResult>;
  health(): SpikeHealth;
}

/**
 * An Enricher augments an Observation as it flows through the Bloodstream (e.g.
 * attach a market symbol's metadata, geocode a location). Pure: it returns a
 * new payload/evidence; it does not act. Optional per Bloodstream.
 */
export interface Enricher {
  id: string;
  /** Which observation kinds it applies to (empty = all). */
  appliesTo: string[];
  enrich(obs: Observation): Observation;
}

/** A downstream consumer subscribes to observation kinds instead of polling. */
export interface Subscriber {
  id: string;
  /** Observation kinds it wants (empty = all). */
  kinds: string[];
  /** Called for each distributed observation. Should not throw; failures are isolated. */
  deliver(obs: Observation): void | Promise<void>;
}

export interface BloodstreamMetrics {
  spikes: number;
  subscribers: number;
  circulated: number;
  cachedHits: number;
  deduped: number;
  distributed: number;
  deliveryErrors: number;
}

export type { Observation };
