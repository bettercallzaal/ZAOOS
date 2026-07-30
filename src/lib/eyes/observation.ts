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

/**
 * Deterministic canonical JSON: keys sorted recursively (lexicographic),
 * arrays in order. Byte-identical to DreamNet's `canonicalJsonStringify`
 * (`sha256:dreamnet-sorted-json:v0` - spore-sdk pinned 4072102), proven by the
 * cross-runtime vectors in `src/lib/spore/__tests__/fixtures/`.
 *
 * Serialization is built manually (NOT via JSON.stringify on a rebuilt object)
 * because the cross-org contract requires:
 *  - LEXICOGRAPHIC key order even for integer-like keys ("10" < "2"; a rebuilt
 *    JS object would reorder them numerically),
 *  - `toJSON` methods ignored (a value is hashed as its own enumerable shape),
 *  - non-finite numbers REJECTED (fail closed), never silently `null`,
 *  - `undefined`/function/symbol object values omitted; `undefined` array
 *    entries serialized as `null`.
 */
export function canonicalize(value: unknown): string {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') {
    return JSON.stringify(value);
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error(`Canonical JSON Error: Non-finite number ${value} cannot be serialized.`);
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => (item === undefined ? 'null' : canonicalize(item))).join(',')}]`;
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keyValues = Object.keys(obj)
      .sort()
      .filter((k) => obj[k] !== undefined && typeof obj[k] !== 'function' && typeof obj[k] !== 'symbol')
      .map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`);
    return `{${keyValues.join(',')}}`;
  }
  throw new Error(`Canonical JSON Error: Unsupported value type ${typeof value}`);
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
