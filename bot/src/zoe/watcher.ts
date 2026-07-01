/**
 * watcher.ts - the dispatch supervisor (the one genuinely-missing piece of the
 * doc 927 orchestrator vision; decompose/dispatch/workers/critic/reflexion/learn
 * already exist + are wired). Reads the run telemetry that dispatch.ts records
 * (runs.ts) and surfaces cost / failure / quality anomalies so ZOE - and Zaal -
 * notice when the agents under ZOE start misbehaving. Pure analysis + a tick;
 * the scheduler decides whether to ping. No autonomous actions of its own.
 */
import { readRuns, type RunRecord } from './runs';

export interface WatcherAlert {
  level: 'info' | 'warn';
  code: 'cost-over-cap' | 'high-fail-rate' | 'quality-decay' | 'unit-down' | 'unit-healed';
  message: string;
}

export interface WatcherConfig {
  /** Soft daily spend cap across all dispatched workers (USD). */
  dailyCostCapUsd: number;
  /** Warn above this fraction of failed runs. */
  failRateWarn: number;
  /** Critic score below this counts as a low-quality run. */
  lowScore: number;
  /** Minimum scored runs before judging quality decay. */
  minScoredForDecay: number;
}

export const DEFAULT_WATCHER: WatcherConfig = {
  dailyCostCapUsd: Number(process.env.ZOE_DAILY_COST_CAP ?? 8),
  failRateWarn: Number(process.env.ZOE_FAIL_RATE_WARN ?? 0.34),
  lowScore: Number(process.env.ZOE_LOW_SCORE ?? 70),
  minScoredForDecay: 3,
};

/** Pure: analyze a window of run records into zero or more alerts. */
export function analyzeRuns(
  runs: RunRecord[],
  cfg: WatcherConfig = DEFAULT_WATCHER,
): WatcherAlert[] {
  const alerts: WatcherAlert[] = [];
  if (runs.length === 0) return alerts;

  const cost = runs.reduce((s, r) => s + (r.costUsd || 0), 0);
  if (cost > cfg.dailyCostCapUsd) {
    alerts.push({
      level: 'warn',
      code: 'cost-over-cap',
      message: `dispatch spend $${cost.toFixed(2)} over the $${cfg.dailyCostCapUsd} daily cap (${runs.length} runs / 24h)`,
    });
  }

  const failed = runs.filter((r) => r.status === 'failed' || r.error).length;
  const failRate = failed / runs.length;
  if (failRate > cfg.failRateWarn) {
    alerts.push({
      level: 'warn',
      code: 'high-fail-rate',
      message: `worker fail rate ${(failRate * 100).toFixed(0)}% (${failed}/${runs.length}) over 24h`,
    });
  }

  const scored = runs.filter((r) => typeof r.score === 'number');
  const low = scored.filter((r) => (r.score as number) < cfg.lowScore).length;
  if (scored.length >= cfg.minScoredForDecay && low / scored.length > 0.5) {
    alerts.push({
      level: 'warn',
      code: 'quality-decay',
      message: `quality decay: ${low}/${scored.length} runs scored below ${cfg.lowScore}`,
    });
  }

  return alerts;
}

/** Tick: read the last day of telemetry and return any anomalies. */
export async function runWatcherTick(
  cfg: WatcherConfig = DEFAULT_WATCHER,
): Promise<WatcherAlert[]> {
  const runs = await readRuns(1);
  return analyzeRuns(runs, cfg);
}

/** One-line render for a Telegram ping to Zaal. */
export function renderWatcherAlerts(alerts: WatcherAlert[]): string {
  if (alerts.length === 0) return '';
  return ['ZOE watcher:', ...alerts.map((a) => `- ${a.message}`)].join('\n');
}
