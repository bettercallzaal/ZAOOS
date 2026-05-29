/**
 * runs.ts — append-only telemetry for ZOE's dispatch loop.
 *
 * Every worker run (and its critic verdict) is recorded as one JSONL line in
 * ~/.zao/zoe/runs/YYYY-MM-DD.jsonl. This is the data source the Gap 5
 * learning loop (learn.ts) clusters over weekly: "in the last 30 runs, 6
 * comms-drafter outputs were flagged for fabricated specifics" -> propose a
 * sharper line in comms-drafter.md.
 *
 * Append-only, best-effort, never throws into the dispatch path. A failed
 * write logs and is dropped — telemetry must never break a live run.
 */

import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { ZOE_PATHS } from './memory';

export interface RunRecord {
  /** Unique id: run-<ts>-<rand>. */
  id: string;
  /** ISO 8601 timestamp the run completed. */
  ts: string;
  /** ZOE's higher-level goal this subtask served. */
  goal: string;
  subtaskId: string;
  worker: string;
  status: 'completed' | 'failed' | 'needs-revision';
  /** Critic score 0-100, or null if no critic ran. */
  score: number | null;
  /** Critic one-line summary, or null. */
  criticSummary: string | null;
  /** Itemized critic issues as "severity: issue" strings (for clustering). */
  criticIssues: string[];
  /** True if a revision pass ran. */
  revised: boolean;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  durationMs: number;
  error: string | null;
}

function runsDir(): string {
  return join(ZOE_PATHS.home, 'runs');
}

function fileForDate(d: Date): string {
  const day = d.toISOString().slice(0, 10); // YYYY-MM-DD
  return join(runsDir(), `${day}.jsonl`);
}

export function newRunId(): string {
  return `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Append one run record. Best-effort; logs and swallows on failure. */
export async function recordRun(rec: RunRecord): Promise<void> {
  try {
    await fs.mkdir(runsDir(), { recursive: true });
    await fs.appendFile(fileForDate(new Date()), JSON.stringify(rec) + '\n', 'utf8');
  } catch (err) {
    console.error('[zoe/runs] recordRun failed:', (err as Error).message);
  }
}

/**
 * Read run records from the last `sinceDays` days (inclusive of today).
 * Returns newest-last. Skips unparseable lines. Never throws.
 */
export async function readRuns(sinceDays = 7): Promise<RunRecord[]> {
  const out: RunRecord[] = [];
  const now = Date.now();
  for (let i = sinceDays - 1; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    let raw: string;
    try {
      raw = await fs.readFile(fileForDate(d), 'utf8');
    } catch {
      continue; // no file for that day
    }
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        out.push(JSON.parse(trimmed) as RunRecord);
      } catch {
        // skip corrupt line
      }
    }
  }
  return out;
}
