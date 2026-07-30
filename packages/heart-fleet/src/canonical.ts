/**
 * Canonical JSON + sha256 for heart-fleet receipts and deterministic identity.
 *
 * Byte-identical to `src/lib/eyes/observation.ts:canonicalize` and the bot copy
 * (`sha256:dreamnet-sorted-json:v0`, proven vs the DreamNet SDK - see
 * src/lib/spore/__tests__/fixtures/). Duplicated here because the package must
 * be importable from BOTH builds with zero cross-tree imports; the shared
 * cross-runtime fixtures pin all three copies (heart-fleet-properties.test.ts).
 */
import { createHash } from 'node:crypto';

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

export function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

/**
 * Deterministic resource identity: the same (kind, key) ALWAYS maps to the
 * same id, on any fleet member, with no coordination. Used as agent_runs
 * idempotency_key so per-resource mutex rows are created exactly once.
 */
export function deterministicResourceId(kind: string, key: string): string {
  if (!kind || !key) throw new Error('deterministicResourceId: kind and key are required');
  return `heart:resource:${sha256Hex(canonicalize({ kind, key }))}`;
}
