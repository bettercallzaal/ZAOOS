/**
 * HTTP-poll Vacuum Spike - a reference ingestion module.
 *
 * The generic shape most external feeds fit (weather, SEC, chain RPC, RSS-as-
 * JSON, market feeds): authenticate via headers, GET an endpoint, validate the
 * body, and map it to Observations. The fetch and the mapping are injectable so
 * the spike is fully testable and adapts to any source without new code.
 *
 * Read-only ingestion: it GETs and reports. It never POSTs, mutates, or acts.
 */

import { createObservation } from '@/lib/eyes';
import type { Observation, SensorHealthSnapshot } from '@/lib/eyes';
import type { VacuumSpike, VacuumSpikeManifest, SpikeHealth, IngestContext, IngestResult } from '../types';
import { assertSafeUrl } from './url-guard';

export interface MappedRecord {
  kind: string;
  subjectKey: string;
  payload: unknown;
  observedAt?: string | null;
  confidence?: number;
}

export interface HttpPollSpikeOptions {
  spikeId: string;
  endpoint: string;
  capabilities: string[];
  produces: string[];
  pollIntervalMs?: number;
  minIntervalMs?: number;
  requiredConfig?: string[];
  /** Injectable fetch (defaults to global fetch). Returns parsed body. */
  fetchJson?: (endpoint: string, headers: Record<string, string>) => Promise<unknown>;
  /** Build auth/other headers from config. Pure. */
  headers?: (config: Readonly<Record<string, string | undefined>>) => Record<string, string>;
  /** Validate + map a body to records. Return [] to ingest nothing. Pure. */
  map: (body: unknown) => MappedRecord[];
  /**
   * SSRF allowlist: if set, the endpoint host must be one of these. Private/
   * loopback/metadata IPs and non-http(s) schemes are always blocked regardless.
   */
  allowedHosts?: string[];
}

async function defaultFetchJson(endpoint: string, headers: Record<string, string>): Promise<unknown> {
  const res = await fetch(endpoint, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${endpoint}`);
  return res.json();
}

export function createHttpPollSpike(opts: HttpPollSpikeOptions): VacuumSpike {
  // SSRF guard: the endpoint is fixed at creation, so validate it once here.
  // Blocks private/loopback/metadata IPs + non-http(s), and enforces the
  // allowlist when given. Throws before any spike that could reach a bad host
  // is ever registered.
  assertSafeUrl(opts.endpoint, opts.allowedHosts);
  const fetchJson = opts.fetchJson ?? defaultFetchJson;
  const manifest: VacuumSpikeManifest = {
    spikeId: opts.spikeId,
    version: '1.0.0',
    description: `HTTP-poll ingestion of ${opts.endpoint}`,
    capabilities: opts.capabilities,
    produces: opts.produces,
    strategy: 'poll',
    pollIntervalMs: opts.pollIntervalMs ?? 60_000,
    minIntervalMs: opts.minIntervalMs,
    requiredConfig: opts.requiredConfig ?? [],
    riskTier: 'passive',
  };

  let totalIngested = 0;
  let totalErrors = 0;
  let consecutiveFailures = 0;
  let lastOkAt: string | null = null;
  let lastLatencyMs = 0;

  function snapshot(): SensorHealthSnapshot {
    return { status: consecutiveFailures >= 5 ? 'failing' : consecutiveFailures >= 2 ? 'degraded' : 'healthy', latencyMs: lastLatencyMs, errorRate: 0, lastOkAt, consecutiveFailures };
  }

  return {
    manifest,
    async ingest(ctx: IngestContext): Promise<IngestResult> {
      const start = ctx.now ? new Date(ctx.now).getTime() : Date.now();
      let body: unknown;
      try {
        const headers = opts.headers ? opts.headers(ctx.config) : {};
        body = await fetchJson(opts.endpoint, headers);
      } catch (err) {
        totalErrors++;
        consecutiveFailures++;
        throw err instanceof Error ? err : new Error(String(err));
      }
      const records = opts.map(body) ?? [];
      const observations: Observation[] = records.map((r) =>
        createObservation(
          {
            sensor: manifest.spikeId,
            kind: r.kind,
            subjectKey: r.subjectKey,
            payload: r.payload,
            confidence: r.confidence ?? 0.9,
            provenance: { method: 'poll', endpoint: opts.endpoint },
            observedAt: r.observedAt ?? null,
            health: snapshot(),
          },
          { observerId: ctx.observerId, now: ctx.now },
        ),
      );
      consecutiveFailures = 0;
      lastOkAt = ctx.now ?? new Date().toISOString();
      lastLatencyMs = Math.max(0, (ctx.now ? new Date(ctx.now).getTime() : Date.now()) - start);
      totalIngested += observations.length;
      return { observations };
    },
    health(): SpikeHealth {
      const snap = snapshot();
      return { spikeId: manifest.spikeId, status: snap.status, latencyMs: snap.latencyMs, errorRate: 0, lastOkAt, consecutiveFailures, totalIngested, totalErrors, rateLimited: 0 };
    },
  };
}
