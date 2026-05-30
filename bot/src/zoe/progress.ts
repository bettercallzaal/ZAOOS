/**
 * progress.ts — token-free live progress rendering for plan dispatch.
 *
 * Pure string builders. The caller (index.ts runApprovedPlan) sends ONE
 * Telegram message and edits it in place as subtasks start/finish — Telegram
 * edits are free API calls, so a live progress bar costs zero LLM tokens. The
 * only token spend is the worker calls themselves.
 */

export type ProgressStatus = 'pending' | 'running' | 'done' | 'warn' | 'failed';

export interface ProgressRow {
  id: string;
  worker: string;
  status: ProgressStatus;
  /** Critic score, if the subtask produced one. */
  score?: number | null;
}

const ICON: Record<ProgressStatus, string> = {
  pending: '·',
  running: '⏳',
  done: '✓',
  warn: '⚠',
  failed: '✗',
};

/** mm:ss from a millisecond duration. */
export function fmtElapsed(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** A 10-cell block bar for done/total. */
export function bar(done: number, total: number, cells = 10): string {
  if (total <= 0) return '░'.repeat(cells);
  const filled = Math.max(0, Math.min(cells, Math.round((done / total) * cells)));
  return '█'.repeat(filled) + '░'.repeat(cells - filled);
}

/**
 * Render the live progress block. Counts done/warn/failed toward "done" (the
 * subtask is finished either way). Score shown only once a subtask resolves.
 */
export function renderProgress(
  rows: ProgressRow[],
  elapsedMs: number,
  opts: { costUsd?: number; title?: string; final?: boolean } = {},
): string {
  const total = rows.length;
  const done = rows.filter(
    (r) => r.status === 'done' || r.status === 'warn' || r.status === 'failed',
  ).length;
  const title = opts.title ?? (opts.final ? 'Plan complete' : '🔄 Dispatching');
  const cost = opts.costUsd != null ? ` · $${opts.costUsd.toFixed(2)}` : '';

  const lines: string[] = [];
  lines.push(`${title} — ${done}/${total}`);
  lines.push(`[${bar(done, total)}] ${fmtElapsed(elapsedMs)}${cost}`);
  for (const r of rows) {
    const score =
      (r.status === 'done' || r.status === 'warn') && r.score != null ? ` ${r.score}` : '';
    lines.push(`${ICON[r.status]} ${r.id} ${r.worker}${score}`);
  }
  return lines.join('\n');
}
