/**
 * Observation factory - the one canonical way to mint an Observation.
 *
 * Pure. Stamps the content hash over a canonical serialization so two Eyes that
 * saw the same thing produce the same contentHash (enabling downstream
 * consensus), and so any later tampering is detectable. No I/O.
 */

import { createHash, randomUUID } from 'node:crypto';
import type {
  Observation,
  EvidenceRef,
  SensorHealthSnapshot,
  ObserveContext,
} from './types';

/** Deterministic canonical JSON: keys sorted recursively, arrays in order. */
export function canonicalize(value: unknown): string {
  const sortDeep = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(sortDeep);
    if (v && typeof v === 'object') {
      const out: Record<string, unknown> = {};
      for (const k of Object.keys(v as Record<string, unknown>).sort()) {
        out[k] = sortDeep((v as Record<string, unknown>)[k]);
      }
      return out;
    }
    return v;
  };
  return JSON.stringify(sortDeep(value));
}

/** sha256 hex of a string. */
export function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

/**
 * The content hash groups observations of the same subject for consensus, so it
 * is computed over WHAT was seen (kind + subjectKey + payload), NOT over the
 * capture metadata (observationId, capturedAt, observerId, health). Two Eyes
 * seeing the same PR at slightly different times therefore hash identically.
 */
export function observationContentHash(input: {
  kind: string;
  subjectKey: string;
  payload: unknown;
}): string {
  return sha256Hex(
    canonicalize({ kind: input.kind, subjectKey: input.subjectKey, payload: input.payload }),
  );
}

export interface CreateObservationInput {
  sensor: string;
  kind: string;
  subjectKey: string;
  payload: unknown;
  confidence: number;
  provenance: Observation['provenance'];
  evidence?: EvidenceRef[];
  observedAt?: string | null;
  health: SensorHealthSnapshot;
}

/**
 * Mint an Observation from a sensor. `ctx` supplies observerId + a deterministic
 * `now`. Clamps confidence to [0,1]. The Eyes never assert truth - confidence is
 * the sensor's own self-report, nothing more.
 */
export function createObservation(
  input: CreateObservationInput,
  ctx: Pick<ObserveContext, 'observerId' | 'now'>,
): Observation {
  const capturedAt = ctx.now ?? new Date().toISOString();
  const confidence = Math.max(0, Math.min(1, input.confidence));
  return {
    schemaVersion: 'zao.observation.v1',
    observationId: randomUUID(),
    sensor: input.sensor,
    observerId: ctx.observerId,
    kind: input.kind,
    subjectKey: input.subjectKey,
    observedAt: input.observedAt ?? null,
    capturedAt,
    confidence,
    provenance: input.provenance,
    contentHash: observationContentHash(input),
    payload: input.payload,
    evidence: input.evidence ?? [],
    health: input.health,
  };
}

/**
 * Verify an observation's content hash - lets a consumer confirm the payload was
 * not altered since capture. (capturedAt/observerId/health are intentionally
 * outside the hash, per observationContentHash.)
 */
export function verifyObservation(obs: Observation): boolean {
  return (
    obs.contentHash ===
    observationContentHash({ kind: obs.kind, subjectKey: obs.subjectKey, payload: obs.payload })
  );
}

/**
 * Group observations of the SAME subject by contentHash - the raw material for
 * downstream consensus. This does NOT decide what is true; it only clusters
 * matching reports so a Brain/Spine consumer can reconcile them. Returns, per
 * subjectKey, the set of distinct contentHashes and how many Eyes reported each.
 */
export function clusterForConsensus(
  observations: Observation[],
): Record<string, Array<{ contentHash: string; count: number; observerIds: string[] }>> {
  const bySubject: Record<string, Map<string, { count: number; observerIds: Set<string> }>> = {};
  for (const o of observations) {
    const m = (bySubject[o.subjectKey] ??= new Map());
    const e = m.get(o.contentHash) ?? { count: 0, observerIds: new Set<string>() };
    e.count++;
    e.observerIds.add(o.observerId);
    m.set(o.contentHash, e);
  }
  const out: Record<string, Array<{ contentHash: string; count: number; observerIds: string[] }>> = {};
  for (const [subject, m] of Object.entries(bySubject)) {
    out[subject] = [...m.entries()]
      .map(([contentHash, e]) => ({ contentHash, count: e.count, observerIds: [...e.observerIds] }))
      .sort((a, b) => b.count - a.count);
  }
  return out;
}
