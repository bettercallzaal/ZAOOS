/**
 * Filesystem sensor - a reference Eye.
 *
 * Watches a directory and emits an Observation for each file that is new or
 * changed since the last cycle (diffed against the sensor's cursor). It is a
 * pure perceiver: it reads the directory, reports what changed, and stops. It
 * never writes, deletes, or acts on anything it sees.
 *
 * The directory read is injectable (readDir) so the sensor is fully testable
 * with a fake filesystem; the default reads the real fs via node:fs/promises.
 */

import { stat, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { createObservation } from '../observation';
import { sha256Hex } from '../observation';
import type {
  Sensor,
  SensorManifest,
  SensorHealth,
  SensorHealthSnapshot,
  ObserveContext,
  ObserveResult,
} from '../types';

export interface DirEntry {
  path: string;
  size: number;
  mtimeMs: number;
}

export interface FilesystemSensorOptions {
  /** Directory to watch. */
  watchPath: string;
  /** Injectable read for tests; defaults to a real recursive-ish listing. */
  readDir?: (watchPath: string) => Promise<DirEntry[]>;
  /** Max files to report per cycle (bounded blast radius). */
  maxPerCycle?: number;
}

async function defaultReadDir(watchPath: string): Promise<DirEntry[]> {
  const names = await readdir(watchPath);
  const out: DirEntry[] = [];
  for (const name of names) {
    try {
      const p = join(watchPath, name);
      const s = await stat(p);
      if (s.isFile()) out.push({ path: p, size: s.size, mtimeMs: s.mtimeMs });
    } catch {
      // a file vanished mid-listing - skip, do not fail the whole cycle
    }
  }
  return out;
}

function entryHash(e: DirEntry): string {
  return sha256Hex(`${e.size}:${e.mtimeMs}`);
}

export function createFilesystemSensor(opts: FilesystemSensorOptions): Sensor {
  const readDir = opts.readDir ?? defaultReadDir;
  const maxPerCycle = opts.maxPerCycle ?? 200;

  const manifest: SensorManifest = {
    sensorId: `filesystem:${opts.watchPath}`,
    version: '1.0.0',
    description: `Observes new/changed files in ${opts.watchPath}`,
    strategy: 'poll',
    pollIntervalMs: 30_000,
    produces: ['fs.change'],
    requiredConfig: [],
    riskTier: 'passive',
  };

  // Self-reported health (the registry keeps the authoritative organ view).
  let totalObservations = 0;
  let totalErrors = 0;
  let consecutiveFailures = 0;
  let lastOkAt: string | null = null;
  let lastLatencyMs = 0;

  function snapshot(): SensorHealthSnapshot {
    return {
      status: consecutiveFailures >= 5 ? 'failing' : consecutiveFailures >= 2 ? 'degraded' : 'healthy',
      latencyMs: lastLatencyMs,
      errorRate: 0,
      lastOkAt,
      consecutiveFailures,
    };
  }

  return {
    manifest,
    async observe(ctx: ObserveContext): Promise<ObserveResult> {
      const start = ctx.now ? new Date(ctx.now).getTime() : Date.now();
      let prev: Record<string, string> = {};
      if (ctx.cursor) {
        try {
          prev = JSON.parse(ctx.cursor);
        } catch {
          prev = {};
        }
      }
      let entries: DirEntry[];
      try {
        entries = await readDir(opts.watchPath);
      } catch (err) {
        totalErrors++;
        consecutiveFailures++;
        throw err instanceof Error ? err : new Error(String(err));
      }

      const next: Record<string, string> = {};
      const observations = [];
      for (const e of entries) {
        const h = entryHash(e);
        next[e.path] = h;
        const before = prev[e.path];
        if (before === h) continue; // unchanged
        if (observations.length >= maxPerCycle) continue; // bounded; unchanged files still tracked in cursor
        observations.push(
          createObservation(
            {
              sensor: manifest.sensorId,
              kind: 'fs.change',
              subjectKey: e.path,
              payload: { path: e.path, size: e.size, mtimeMs: e.mtimeMs, change: before ? 'modified' : 'added' },
              confidence: 1,
              provenance: { method: 'filesystem', endpoint: opts.watchPath },
              evidence: [{ kind: 'snapshot', uri: e.path }],
              observedAt: new Date(e.mtimeMs).toISOString(),
              health: snapshot(),
            },
            { observerId: ctx.observerId, now: ctx.now },
          ),
        );
      }

      lastLatencyMs = Math.max(0, (ctx.now ? new Date(ctx.now).getTime() : Date.now()) - start);
      lastOkAt = ctx.now ?? new Date().toISOString();
      consecutiveFailures = 0;
      totalObservations += observations.length;
      return { observations, cursor: JSON.stringify(next) };
    },
    health(): SensorHealth {
      const snap = snapshot();
      return { sensorId: manifest.sensorId, ...snap, totalObservations, totalErrors };
    },
  };
}
