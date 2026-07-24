/**
 * Bloodstream - the circulatory organ. Public API.
 *
 * One shared system that ingests the outside world via Vacuum Spikes, normalizes
 * to the shared Observation contract, enriches, caches/dedups, and distributes
 * to subscribed organs - so no organ polls the same source twice. It transports;
 * it never decides.
 */

export type {
  VacuumSpike,
  VacuumSpikeManifest,
  SpikeHealth,
  SpikeStatus,
  BackoffPolicy,
  Enricher,
  Subscriber,
  BloodstreamMetrics,
  IngestContext,
  IngestResult,
} from './types';
export { DEFAULT_BACKOFF } from './types';

export { Bloodstream, validateSpikeManifest, SpikeManifestError } from './bloodstream';
export type { CirculateResult, BloodstreamOptions } from './bloodstream';

export { createHttpPollSpike } from './spikes/http-poll-spike';
export type { HttpPollSpikeOptions, MappedRecord } from './spikes/http-poll-spike';
