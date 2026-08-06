// cost-ledger.ts - ZOE per-model spend visibility.
//
// The frontier "cost observability" gap (research doc 972): callClaudeCli
// already returns model + tokens + cost on every call (ClaudeCliResult), but
// nothing captured it - ZOE's daily call-budget counter counts CALLS, not
// tokens or dollars. This records each call so spend is visible per model per
// day, without changing any behavior.
//
// Storage (mirrors the ZOE_HOME convention used by memory/tasks):
//   ~/.zao/zoe/cost/<YYYY-MM-DD>.jsonl   one line per call
//   ~/.zao/zoe/cost/<YYYY-MM-DD>.md      human-readable daily rollup (per model + total)
//
// Fully fail-safe: any error is swallowed - cost logging must never break a turn.

import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const COST_DIR = process.env.ZOE_HOME
  ? join(process.env.ZOE_HOME, 'cost')
  : join(homedir(), '.zao', 'zoe', 'cost');

/** The subset of ClaudeCliResult the ledger needs. */
export interface CallCost {
  model: string;
  inputTokens: number;
  outputTokens: number;
  /** Input tokens served from the prompt cache (Claude cache_read_input_tokens). */
  cachedInputTokens?: number;
  totalCostUsd: number;
}

export interface ModelRollup {
  model: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  /** Of inputTokens, how many were served from cache. Optional: rollups from
   * pre-cache-observability logs have no value. */
  cachedInputTokens?: number;
  costUsd: number;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Record one Claude CLI call. `caller` labels the source (concierge/worker/reflexion)
 * so spend can be attributed. Never throws.
 */
export function recordCall(caller: string, r: CallCost): void {
  try {
    mkdirSync(COST_DIR, { recursive: true });
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      caller,
      model: r.model,
      in: r.inputTokens ?? 0,
      out: r.outputTokens ?? 0,
      cached: r.cachedInputTokens ?? 0,
      usd: r.totalCostUsd ?? 0,
    });
    appendFileSync(join(COST_DIR, `${today()}.jsonl`), `${line}\n`);
    writeDailySummary();
  } catch {
    /* cost logging is best-effort - never break a turn over it */
  }
}

/** Aggregate today's calls per model. Returns [] if nothing logged / on error. */
export function todaySummary(day = today()): ModelRollup[] {
  try {
    const raw = readFileSync(join(COST_DIR, `${day}.jsonl`), 'utf8');
    const byModel = new Map<string, ModelRollup>();
    for (const l of raw.split('\n')) {
      if (!l.trim()) continue;
      let rec: { model?: string; in?: number; out?: number; cached?: number; usd?: number };
      try {
        rec = JSON.parse(l) as typeof rec;
      } catch {
        continue;
      }
      const model = rec.model ?? 'unknown';
      const m = byModel.get(model) ?? { model, calls: 0, inputTokens: 0, outputTokens: 0, cachedInputTokens: 0, costUsd: 0 };
      m.calls += 1;
      m.inputTokens += rec.in ?? 0;
      m.outputTokens += rec.out ?? 0;
      m.cachedInputTokens = (m.cachedInputTokens ?? 0) + (rec.cached ?? 0);
      m.costUsd += rec.usd ?? 0;
      byModel.set(model, m);
    }
    return [...byModel.values()].sort((a, b) => b.costUsd - a.costUsd);
  } catch {
    return [];
  }
}

/** Render a one-line-per-model text summary of a day's spend, for the /cost view + brief. */
export function summaryText(day = today()): string {
  const rows = todaySummary(day);
  if (rows.length === 0) return `No ZOE model calls logged for ${day}.`;
  const total = rows.reduce((s, r) => s + r.costUsd, 0);
  const totalCalls = rows.reduce((s, r) => s + r.calls, 0);
  const lines = rows.map((r) => {
    const cached = r.cachedInputTokens ?? 0;
    // Cache-hit % = cached / total-input, where total input = fresh (inputTokens,
    // the non-cached count) + cached. Dividing by inputTokens alone overstates it
    // wildly (cache_read can dwarf the tiny fresh input -> >100%).
    const totalInput = r.inputTokens + cached;
    const cacheNote = cached > 0 && totalInput > 0
      ? ` (${Math.round((cached / totalInput) * 100)}% cached in)`
      : '';
    return `- ${r.model}: ${r.calls} calls, ${(r.inputTokens + r.outputTokens).toLocaleString()} tok${cacheNote}, $${r.costUsd.toFixed(4)}`;
  });
  const totalIn = rows.reduce((s, r) => s + r.inputTokens, 0);
  const totalCached = rows.reduce((s, r) => s + (r.cachedInputTokens ?? 0), 0);
  const cacheLine = totalCached > 0 && totalIn + totalCached > 0
    ? ` (${Math.round((totalCached / (totalIn + totalCached)) * 100)}% of input tokens served from cache)`
    : '';
  return [`ZOE spend ${day} - $${total.toFixed(4)} across ${totalCalls} calls${cacheLine}:`, ...lines].join('\n');
}

function writeDailySummary(): void {
  try {
    const day = today();
    writeFileSync(join(COST_DIR, `${day}.md`), `# ZOE spend - ${day}\n\n${summaryText(day)}\n`);
  } catch {
    /* best-effort */
  }
}
