import { describe, it, expect } from 'vitest';
import { analyzeRuns, renderWatcherAlerts, DEFAULT_WATCHER, type WatcherConfig } from '../watcher';
import type { RunRecord } from '../runs';

const CFG: WatcherConfig = { dailyCostCapUsd: 8, failRateWarn: 0.34, lowScore: 70, minScoredForDecay: 3 };

function run(p: Partial<RunRecord>): RunRecord {
  return {
    id: 'r', ts: new Date().toISOString(), goal: 'g', subtaskId: 's',
    worker: 'research' as RunRecord['worker'], status: 'completed' as RunRecord['status'],
    score: null, criticSummary: null, criticIssues: [], revised: false,
    inputTokens: 0, outputTokens: 0, costUsd: 0, durationMs: 0, error: null,
    ...p,
  };
}

describe('analyzeRuns', () => {
  it('returns no alerts for an empty window', () => {
    expect(analyzeRuns([], CFG)).toEqual([]);
  });

  it('returns no alerts for healthy runs', () => {
    const runs = [run({ costUsd: 1, score: 90 }), run({ costUsd: 1, score: 85 })];
    expect(analyzeRuns(runs, CFG)).toEqual([]);
  });

  it('flags cost over the daily cap', () => {
    const runs = [run({ costUsd: 5 }), run({ costUsd: 5 })];
    const a = analyzeRuns(runs, CFG);
    expect(a.some((x) => x.code === 'cost-over-cap')).toBe(true);
  });

  it('flags a high failure rate', () => {
    const runs = [run({ status: 'failed', error: 'boom' }), run({ status: 'failed', error: 'boom' }), run({})];
    const a = analyzeRuns(runs, CFG);
    expect(a.some((x) => x.code === 'high-fail-rate')).toBe(true);
  });

  it('flags quality decay when most scored runs are low', () => {
    const runs = [run({ score: 40 }), run({ score: 50 }), run({ score: 90 })];
    const a = analyzeRuns(runs, CFG);
    expect(a.some((x) => x.code === 'quality-decay')).toBe(true);
  });

  it('does not flag quality decay below the minimum scored count', () => {
    const runs = [run({ score: 10 }), run({ score: 10 })];
    expect(analyzeRuns(runs, CFG).some((x) => x.code === 'quality-decay')).toBe(false);
  });
});

describe('renderWatcherAlerts', () => {
  it('returns empty string for no alerts', () => {
    expect(renderWatcherAlerts([])).toBe('');
  });

  it('renders a header + one line per alert', () => {
    const out = renderWatcherAlerts([{ level: 'warn', code: 'cost-over-cap', message: 'over' }]);
    expect(out).toContain('ZOE watcher:');
    expect(out).toContain('- over');
  });
});

describe('DEFAULT_WATCHER', () => {
  it('has sane defaults', () => {
    expect(DEFAULT_WATCHER.dailyCostCapUsd).toBeGreaterThan(0);
    expect(DEFAULT_WATCHER.lowScore).toBeGreaterThan(0);
  });
});
