/**
 * Organism - the first LIVING end-to-end flow. This is the wiring that turns the
 * organ contracts into running tissue:
 *
 *   Coinbase Vacuum Spike  ->  Bloodstream  ->  Memory (working + episodic)
 *                                    |
 *                                    +--> Control Plane (all organs registered,
 *                                         heartbeats reflect real metrics)
 *
 * A tick pulls real market data, circulates it once, Memory stores it, and the
 * Control Plane's health rolls up from the actual results - so a snapshot after
 * a tick proves the contracts RUN, not just compile.
 *
 * Boundary: this module only ASSEMBLES and drives organs; it holds no business
 * logic of its own. Each organ keeps its single responsibility and enforced
 * boundary (spike read-only, Bloodstream transport-only, Memory store-only,
 * Control Plane registry-only).
 */

import { Bloodstream, type BloodstreamOptions, type CirculateResult } from '@/lib/bloodstream';
import { createCoinbaseSpotSpike, type CoinbaseSpikeOptions } from '@/lib/bloodstream/spikes/coinbase-spike';
import { ControlPlane } from '@/lib/control-plane';
import type { HealthReport, OrganRegistration, OrganStatus } from '@/lib/control-plane';
import { Memory } from '@/lib/memory';
import type { VacuumSpike } from '@/lib/bloodstream';

export interface OrganismOptions {
  /** Clock - injectable for deterministic tests. */
  now?: () => string;
  /** Override the spike (tests inject a deterministic fetch). Defaults to real Coinbase ETH-USD. */
  spike?: VacuumSpike;
  /** Passed through to the Bloodstream (injectable sleep for backoff tests). */
  bloodstream?: BloodstreamOptions;
  /** Options for the default Coinbase spike when none is provided. */
  coinbase?: CoinbaseSpikeOptions;
}

export interface TickResult {
  circulated: CirculateResult[];
  /** Total observations Memory has recorded across all ticks. */
  stored: number;
  /** Records currently in working memory. */
  workingSize: number;
  snapshot: ReturnType<ControlPlane['snapshot']>;
}

export interface Organism {
  readonly controlPlane: ControlPlane;
  readonly bloodstream: Bloodstream;
  readonly memory: Memory;
  /** Pull -> circulate -> store -> heartbeat -> snapshot. One heartbeat of life. */
  runTick(): Promise<TickResult>;
  snapshot(): ReturnType<ControlPlane['snapshot']>;
}

const VERSION = '0.1.0';

/** Roll a set of circulate results up to a single organ status. */
function statusFromResults(results: CirculateResult[]): OrganStatus {
  if (results.length === 0) return 'healthy';
  const failed = results.filter((r) => !r.ok).length;
  if (failed === 0) return 'healthy';
  if (failed >= results.length) return 'failing';
  return 'degraded';
}

export function assembleOrganism(opts: OrganismOptions = {}): Organism {
  const now = opts.now ?? (() => new Date().toISOString());
  const stamp = (status: OrganStatus, metrics: Record<string, number>): HealthReport => ({
    status,
    metrics,
    reportedAt: now(),
  });

  const controlPlane = new ControlPlane({ now });
  const bloodstream = new Bloodstream(opts.bloodstream);
  const memory = new Memory({ now });

  const spike = opts.spike ?? createCoinbaseSpotSpike('ETH-USD', opts.coinbase);
  bloodstream.registerSpike(spike);

  // Memory subscribes to the Bloodstream - every distributed Observation is stored.
  bloodstream.subscribe({ id: 'memory', kinds: [], deliver: (obs) => memory.record(obs) });

  // Register the organs so the organism can discover + health-check itself.
  const registrations: OrganRegistration[] = [
    {
      organId: 'bloodstream',
      name: 'Bloodstream (circulatory)',
      version: VERSION,
      layer: 'core',
      capabilities: [{ name: 'market.price', version: '1', description: 'circulates market price observations' }],
      dependencies: [],
      endpoints: [{ name: 'circulate', address: 'internal:bloodstream', protocol: 'internal' }],
      secrets: [],
      health: stamp('starting', { spikes: 1 }),
    },
    {
      organId: 'memory',
      name: 'Memory (working + episodic)',
      version: VERSION,
      layer: 'data',
      capabilities: [{ name: 'recall.market.price', version: '1', description: 'stores + recalls observations' }],
      dependencies: ['bloodstream'],
      endpoints: [{ name: 'recall', address: 'internal:memory', protocol: 'internal' }],
      secrets: [],
      health: stamp('starting', { records: 0 }),
    },
  ];
  for (const reg of registrations) controlPlane.register(reg);

  async function runTick(): Promise<TickResult> {
    const circulated = await bloodstream.circulateAll({ observerId: 'organism-1', config: {}, now: now() });

    const bloodMetrics = bloodstream.getMetrics();
    controlPlane.heartbeat('bloodstream', stamp(statusFromResults(circulated), {
      circulated: bloodMetrics.circulated,
      distributed: circulated.reduce((n, r) => n + (r.distributed ?? 0), 0),
      deduped: bloodMetrics.deduped,
    }));

    const mem = memory.snapshot();
    controlPlane.heartbeat('memory', stamp(mem.status, {
      records: mem.total,
      working: mem.layers.find((l) => l.layer === 'working')?.count ?? 0,
      episodic: mem.layers.find((l) => l.layer === 'episodic')?.count ?? 0,
    }));

    return {
      circulated,
      stored: memory.total(),
      workingSize: memory.recall({ kind: 'market.price' }, 'working').length,
      snapshot: controlPlane.snapshot(),
    };
  }

  return {
    controlPlane,
    bloodstream,
    memory,
    runTick,
    snapshot: () => controlPlane.snapshot(),
  };
}
