/**
 * Ears - the event-listening organ. Public API.
 *
 * One responsibility: receive pushed events and normalize them into the shared
 * Observation contract (defined by Eyes, reused here so Ears and Eyes are
 * interchangeable to any consumer). Ears do not poll, act, or decide. The
 * registry handles push-specific concerns: dedup of at-least-once delivery,
 * backpressure via a bounded replay buffer, and connection-state health.
 */

export type {
  Listener,
  ListenerManifest,
  ListenerHealth,
  ListenerConnState,
  EventEnvelope,
  EarContext,
} from './types';

export {
  ListenerRegistry,
  validateListenerManifest,
  ListenerManifestError,
} from './registry';
export type { IngestResult, ListenerRegistryOptions } from './registry';

export { createWebhookListener } from './listeners/webhook-listener';
export type { WebhookListenerOptions, ExtractedEvent } from './listeners/webhook-listener';
