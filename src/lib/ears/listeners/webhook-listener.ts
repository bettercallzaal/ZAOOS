/**
 * Webhook listener - a reference Ear.
 *
 * Normalizes a generic inbound webhook payload into Observations. It is a pure
 * normalizer: it reads the raw event and reports what arrived. It never acts on
 * it. The field extraction is injectable (extract) so it adapts to any provider
 * without new code, and stays fully testable.
 */

import { createObservation } from '@/lib/eyes';
import type { Observation, SensorHealthSnapshot } from '@/lib/eyes';
import type { Listener, ListenerManifest, ListenerHealth, EventEnvelope, EarContext } from '../types';

/** What a provider-specific extractor pulls out of a raw webhook body. */
export interface ExtractedEvent {
  /** Observation kind, e.g. 'github.pr.event'. */
  kind: string;
  /** Stable key for the subject (so this event clusters with Eye observations of the same thing). */
  subjectKey: string;
  /** The normalized structured payload. */
  payload: unknown;
  /** When the event actually happened, if the payload carries it. */
  observedAt?: string | null;
  /** 0..1 self-report. Webhooks from a trusted provider are typically high. */
  confidence?: number;
}

export interface WebhookListenerOptions {
  listenerId: string;
  /** Observation kinds this webhook can produce (for the manifest). */
  produces: string[];
  /**
   * Turn one raw webhook body into zero or more normalized events. Return []
   * for an irrelevant/ignored payload. Pure - no side effects.
   */
  extract: (raw: unknown) => ExtractedEvent[];
  requiredConfig?: string[];
}

export function createWebhookListener(opts: WebhookListenerOptions): Listener {
  const manifest: ListenerManifest = {
    listenerId: opts.listenerId,
    version: '1.0.0',
    description: `Webhook listener for ${opts.produces.join(', ')}`,
    transport: 'webhook',
    produces: opts.produces,
    requiredConfig: opts.requiredConfig ?? [],
    riskTier: 'passive',
  };

  let totalReceived = 0;
  let totalObservations = 0;
  let totalErrors = 0;
  let lastEventAt: string | null = null;

  function snapshot(): SensorHealthSnapshot {
    return { status: 'healthy', latencyMs: 0, errorRate: 0, lastOkAt: lastEventAt, consecutiveFailures: 0 };
  }

  return {
    manifest,
    onEvent(event: EventEnvelope, ctx: EarContext): Observation[] {
      totalReceived += 1;
      lastEventAt = event.receivedAt;
      let extracted: ExtractedEvent[];
      try {
        extracted = opts.extract(event.raw) ?? [];
      } catch (err) {
        totalErrors += 1;
        throw err instanceof Error ? err : new Error(String(err));
      }
      const obs = extracted.map((e) =>
        createObservation(
          {
            sensor: manifest.listenerId,
            kind: e.kind,
            subjectKey: e.subjectKey,
            payload: e.payload,
            confidence: e.confidence ?? 0.95,
            provenance: { method: 'subscribe', endpoint: event.source },
            evidence: event.deliveryId ? [{ kind: 'raw', uri: `delivery:${event.deliveryId}` }] : [],
            observedAt: e.observedAt ?? event.receivedAt,
            health: snapshot(),
          },
          { observerId: ctx.observerId, now: ctx.now },
        ),
      );
      totalObservations += obs.length;
      return obs;
    },
    health(): ListenerHealth {
      return {
        listenerId: manifest.listenerId,
        connection: 'connected',
        lag: 0,
        reconnects: 0,
        totalReceived,
        totalDeduped: 0,
        totalObservations,
        totalErrors,
        lastEventAt,
      };
    },
  };
}
