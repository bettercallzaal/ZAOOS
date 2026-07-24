/**
 * SensorRegistry - the modular organ's plug board.
 *
 * Sensors are hot-swappable: register, unregister, or replace one at runtime
 * without restarting the organ. The registry validates each sensor's manifest,
 * tracks health, and runs observe cycles - but it never interprets what a
 * sensor saw. It moves Observations outward; it does not decide.
 *
 * Pure orchestration + in-memory state. The registry itself does no perceiving;
 * the sensors do. No I/O here beyond calling a sensor's own observe().
 */

import type {
  Sensor,
  SensorManifest,
  SensorHealth,
  SensorStatus,
  Observation,
  ObserveContext,
} from './types';

/** A validation problem with a manifest. */
export class ManifestError extends Error {}

/** Validate a manifest before a sensor is allowed onto the plug board. */
export function validateManifest(m: SensorManifest): void {
  if (!m.sensorId || !m.sensorId.trim()) throw new ManifestError('sensorId required');
  if (!m.version) throw new ManifestError(`${m.sensorId}: version required`);
  if (m.riskTier !== 'passive') throw new ManifestError(`${m.sensorId}: Eyes sensors must be riskTier 'passive'`);
  if (!['poll', 'subscribe', 'on_demand'].includes(m.strategy)) throw new ManifestError(`${m.sensorId}: bad strategy`);
  if (m.strategy === 'poll' && !(m.pollIntervalMs && m.pollIntervalMs > 0)) throw new ManifestError(`${m.sensorId}: poll strategy needs pollIntervalMs > 0`);
  if (!Array.isArray(m.produces) || m.produces.length === 0) throw new ManifestError(`${m.sensorId}: produces[] required`);
}

/** Rolling health tracker for one sensor. */
interface HealthState {
  totalObservations: number;
  totalErrors: number;
  consecutiveFailures: number;
  lastOkAt: string | null;
  lastLatencyMs: number;
  recent: boolean[]; // last N ok/fail for error-rate
}

const WINDOW = 20;

function statusFrom(h: HealthState): SensorStatus {
  if (h.consecutiveFailures >= 5) return 'failing';
  if (h.consecutiveFailures >= 2) return 'degraded';
  return 'healthy';
}

function errorRate(h: HealthState): number {
  if (h.recent.length === 0) return 0;
  const fails = h.recent.filter((ok) => !ok).length;
  return Number((fails / h.recent.length).toFixed(3));
}

export interface RunCycleResult {
  sensorId: string;
  observations: Observation[];
  ok: boolean;
  error?: string;
  cursor?: string;
}

export class SensorRegistry {
  private sensors = new Map<string, Sensor>();
  private health = new Map<string, HealthState>();
  private cursors = new Map<string, string>();

  private freshHealth(): HealthState {
    return { totalObservations: 0, totalErrors: 0, consecutiveFailures: 0, lastOkAt: null, lastLatencyMs: 0, recent: [] };
  }

  /** Register a sensor. Throws on a bad manifest or a duplicate id. */
  register(sensor: Sensor): void {
    validateManifest(sensor.manifest);
    if (this.sensors.has(sensor.manifest.sensorId)) {
      throw new ManifestError(`${sensor.manifest.sensorId}: already registered (use replace to hot-swap)`);
    }
    this.sensors.set(sensor.manifest.sensorId, sensor);
    this.health.set(sensor.manifest.sensorId, this.freshHealth());
  }

  /** Hot-swap: replace a live sensor (or add it if absent). Health resets for the new implementation. */
  replace(sensor: Sensor): void {
    validateManifest(sensor.manifest);
    this.sensors.set(sensor.manifest.sensorId, sensor);
    this.health.set(sensor.manifest.sensorId, this.freshHealth());
  }

  unregister(sensorId: string): boolean {
    this.health.delete(sensorId);
    this.cursors.delete(sensorId);
    return this.sensors.delete(sensorId);
  }

  get(sensorId: string): Sensor | undefined {
    return this.sensors.get(sensorId);
  }

  list(): SensorManifest[] {
    return [...this.sensors.values()].map((s) => s.manifest);
  }

  /** Live health snapshot for one sensor (or null if unknown). */
  healthOf(sensorId: string): SensorHealth | null {
    const h = this.health.get(sensorId);
    if (!h) return null;
    return {
      sensorId,
      status: statusFrom(h),
      latencyMs: h.lastLatencyMs,
      errorRate: errorRate(h),
      lastOkAt: h.lastOkAt,
      consecutiveFailures: h.consecutiveFailures,
      totalObservations: h.totalObservations,
      totalErrors: h.totalErrors,
    };
  }

  /** Health of every registered sensor. */
  allHealth(): SensorHealth[] {
    return [...this.sensors.keys()].map((id) => this.healthOf(id)!).filter(Boolean);
  }

  private record(sensorId: string, ok: boolean, latencyMs: number, count: number, nowIso: string): void {
    const h = this.health.get(sensorId);
    if (!h) return;
    h.lastLatencyMs = latencyMs;
    h.recent.push(ok);
    if (h.recent.length > WINDOW) h.recent.shift();
    if (ok) {
      h.consecutiveFailures = 0;
      h.lastOkAt = nowIso;
      h.totalObservations += count;
    } else {
      h.consecutiveFailures += 1;
      h.totalErrors += 1;
    }
  }

  /**
   * Run one sensor's observe cycle. Isolates failure: a throwing sensor is
   * recorded as unhealthy and returns ok:false, but never takes down the
   * registry or other sensors. Threads the sensor's cursor across cycles.
   */
  async runOnce(sensorId: string, ctx: Omit<ObserveContext, 'cursor' | 'config'> & { config?: ObserveContext['config'] }): Promise<RunCycleResult> {
    const sensor = this.sensors.get(sensorId);
    if (!sensor) return { sensorId, observations: [], ok: false, error: 'not registered' };
    const startMs = ctx.now ? new Date(ctx.now).getTime() : Date.now();
    const fullCtx: ObserveContext = {
      observerId: ctx.observerId,
      cursor: this.cursors.get(sensorId),
      config: ctx.config ?? {},
      now: ctx.now,
    };
    try {
      const result = await sensor.observe(fullCtx);
      const latency = (ctx.now ? new Date(ctx.now).getTime() : Date.now()) - startMs;
      if (result.cursor !== undefined) this.cursors.set(sensorId, result.cursor);
      this.record(sensorId, true, Math.max(0, latency), result.observations.length, ctx.now ?? new Date().toISOString());
      return { sensorId, observations: result.observations, ok: true, cursor: result.cursor };
    } catch (err) {
      const latency = Date.now() - startMs;
      this.record(sensorId, false, Math.max(0, latency), 0, ctx.now ?? new Date().toISOString());
      return { sensorId, observations: [], ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  /**
   * Run every registered sensor once, in isolation. Returns each result; a
   * failing sensor does not stop the others. This is how an Eye takes a full
   * perception pass.
   */
  async runAll(ctx: Omit<ObserveContext, 'cursor' | 'config'> & { config?: ObserveContext['config'] }): Promise<RunCycleResult[]> {
    const ids = [...this.sensors.keys()];
    return Promise.all(ids.map((id) => this.runOnce(id, ctx)));
  }
}
