/**
 * classifier-shadow-report.ts - read the model classifier's shadow log and say
 * what turning ZOE_MODEL_CLASSIFIER=1 on would have changed.
 *
 * The shadow log is written by model-classifier.ts in shadow mode
 * (ZOE_MODEL_CLASSIFIER=shadow, ZAOOS #4322): one JSON line per concierge turn
 * the keywords did not send to hard, holding the keyword tier, the classifier
 * tier (null when it failed), and the latency. No message text.
 *
 * The row shape is restated here, not imported, so this report builds on its
 * own and reads a log from any version that wrote these fields. A row missing
 * a field it needs is counted as unreadable, never guessed at.
 *
 * Run: npx tsx bot/scripts/zoe-classifier-shadow-report.ts [path]
 */

export type Tier = 'quick' | 'default' | 'hard';

export interface ShadowLogRow {
  at: string;
  keyword: Tier;
  classifier: Tier | null;
  failure?: string;
  ms: number;
}

export interface ShadowSummary {
  rows: number;
  unreadable: number;
  first?: string;
  last?: string;
  agree: number;
  failed: number;
  /** "keyword>classifier" -> count, disagreements only (failures excluded). */
  moves: Record<string, number>;
  /** Live mode would answer on a stronger model than the keywords did. */
  up: number;
  /** Live mode would answer on a weaker model than the keywords did. */
  down: number;
  p50Ms: number | null;
  p95Ms: number | null;
}

const RANK: Record<Tier, number> = { quick: 0, default: 1, hard: 2 };

function isTier(v: unknown): v is Tier {
  return v === 'quick' || v === 'default' || v === 'hard';
}

/** One line to a row, or null if it is not a row this report can read. */
export function parseShadowLine(line: string): ShadowLogRow | null {
  let v: unknown;
  try {
    v = JSON.parse(line);
  } catch {
    return null;
  }
  if (!v || typeof v !== 'object') return null;
  const r = v as Record<string, unknown>;
  if (typeof r.at !== 'string' || !Number.isFinite(Date.parse(r.at))) return null;
  if (!isTier(r.keyword)) return null;
  if (r.classifier !== null && !isTier(r.classifier)) return null;
  if (typeof r.ms !== 'number' || !Number.isFinite(r.ms)) return null;
  return {
    at: r.at,
    keyword: r.keyword,
    classifier: r.classifier as Tier | null,
    ...(typeof r.failure === 'string' ? { failure: r.failure } : {}),
    ms: r.ms,
  };
}

function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null;
  const i = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, i)];
}

/** Pure: the whole log's text to a summary. Blank lines are skipped, not counted. */
export function summarizeShadowLog(text: string): ShadowSummary {
  const s: ShadowSummary = {
    rows: 0,
    unreadable: 0,
    agree: 0,
    failed: 0,
    moves: {},
    up: 0,
    down: 0,
    p50Ms: null,
    p95Ms: null,
  };
  const ms: number[] = [];
  const ats: string[] = [];
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    const row = parseShadowLine(line);
    if (!row) {
      s.unreadable += 1;
      continue;
    }
    s.rows += 1;
    ats.push(row.at);
    ms.push(row.ms);
    if (row.classifier === null) {
      s.failed += 1;
      continue;
    }
    if (row.classifier === row.keyword) {
      s.agree += 1;
      continue;
    }
    const key = `${row.keyword}>${row.classifier}`;
    s.moves[key] = (s.moves[key] ?? 0) + 1;
    if (RANK[row.classifier] > RANK[row.keyword]) s.up += 1;
    else s.down += 1;
  }
  ats.sort((a, b) => Date.parse(a) - Date.parse(b));
  s.first = ats[0];
  s.last = ats[ats.length - 1];
  ms.sort((a, b) => a - b);
  s.p50Ms = percentile(ms, 50);
  s.p95Ms = percentile(ms, 95);
  return s;
}

function pct(n: number, of: number): string {
  return of === 0 ? '0%' : `${Math.round((n / of) * 100)}%`;
}

/** Pure: the summary as plain text for a terminal. */
export function formatShadowReport(s: ShadowSummary): string {
  if (s.rows === 0) {
    return `No readable shadow rows (${s.unreadable} unreadable line(s)). Is ZOE_MODEL_CLASSIFIER=shadow set, and has ZOE answered a turn since?`;
  }
  const lines = [
    `Model classifier shadow report: ${s.rows} turn(s), ${s.first} to ${s.last}`,
    `Agree with the keywords: ${s.agree} (${pct(s.agree, s.rows)})`,
    `Classifier failed (live mode keeps the keyword pick): ${s.failed} (${pct(s.failed, s.rows)})`,
    `Live mode would move ${s.up + s.down} turn(s): ${s.up} to a stronger model, ${s.down} to a weaker one`,
  ];
  const moves = Object.entries(s.moves).sort((a, b) => b[1] - a[1]);
  for (const [k, n] of moves) lines.push(`  ${k.replace('>', ' -> ')}: ${n}`);
  lines.push(
    `Classifier latency: p50 ${s.p50Ms} ms, p95 ${s.p95Ms} ms (shadow mode never waits on it; live mode does)`,
  );
  if (s.unreadable > 0) lines.push(`Unreadable lines skipped: ${s.unreadable}`);
  return lines.join('\n');
}
