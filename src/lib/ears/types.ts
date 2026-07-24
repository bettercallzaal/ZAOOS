/**
 * Ears - the event-listening organ. Types + contracts.
 *
 * Ears are the push/subscribe twin of the Eyes. Where Eyes actively poll, Ears
 * passively RECEIVE events that are pushed to them (webhooks, websockets, SSE,
 * chain event subscriptions, chat streams, queues) and normalize each into the
 * SAME Observation contract the Eyes produce - so any consumer (Brain, Spine,
 * Memory) treats an Ear-heard event and an Eye-seen state identically.
 *
 * Boundary: Ears RECEIVE and NORMALIZE only. They do NOT poll (that is Eyes),
 * do NOT act, and do NOT decide. A Listener's only output is Observation[].
 * There is no action/write/decide surface in these interfaces - the organ
 * boundary is structural, exactly as with Eyes.
 */

import type { Observation, SensorHealthSnapshot } from '@/lib/eyes';

/** A raw inbound event as delivered by a transport, before normalization. */
export interface EventEnvelope {
  /** The source that pushed it (e.g. 'github-webhook', 'farcaster-stream'). */
  source: string;
  /** ISO time the transport received it. */
  receivedAt: string;
  /** The raw payload. Listener-defined shape per transport. */
  raw: unknown;
  /**
   * The transport/provider's own delivery id, when present. Used for dedup of
   * at-least-once delivery in addition to the Observation contentHash.
   */
  deliveryId?: string;
}

export type ListenerConnState = 'connected' | 'lagging' | 'dropped' | 'idle';

/** Health of a listener - richer than the per-observation snapshot. */
export interface ListenerHealth {
  listenerId: string;
  connection: ListenerConnState;
  /** Buffered-but-undelivered depth (backpressure signal). */
  lag: number;
  reconnects: number;
  totalReceived: number;
  totalDeduped: number;
  totalObservations: number;
  totalErrors: number;
  lastEventAt: string | null;
}

/** Declarative description of a listener - what the registry validates. */
export interface ListenerManifest {
  listenerId: string;
  version: string;
  description: string;
  /** How events arrive. */
  transport: 'webhook' | 'websocket' | 'sse' | 'queue' | 'poll-bridge';
  /** Observation kinds it can emit (e.g. 'github.pr.event', 'chain.tx.event'). */
  produces: string[];
  requiredConfig: string[];
  /** Ears are ALWAYS passive - receive-only, fixed at the type level. */
  riskTier: 'passive';
}

/** Read-only context for normalizing one event. */
export interface EarContext {
  observerId: string;
  config: Readonly<Record<string, string | undefined>>;
  now?: string;
}

/**
 * A Listener is raw-event-in, Observation-out. Note there is NO method that
 * acts, writes, or decides - onEvent() normalizes and health() reports.
 * subscribe/unsubscribe manage the transport connection only. That is the whole
 * surface. This is the organ boundary in code.
 */
export interface Listener {
  readonly manifest: ListenerManifest;
  /** Normalize one raw inbound event into zero or more Observations. Read-only. */
  onEvent(event: EventEnvelope, ctx: EarContext): Observation[];
  /** Open the transport connection (no-op for pure webhook push). Optional. */
  subscribe?(): Promise<void>;
  /** Close the transport connection. Optional. */
  unsubscribe?(): Promise<void>;
  health(): ListenerHealth;
}

export type { Observation, SensorHealthSnapshot };
