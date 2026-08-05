/**
 * trace.ts - step-level execution tracing for ZOE's worker runs, WITHOUT a new
 * dependency. runs.ts records one line per RUN (did it pass/fail); this records
 * the TREE of steps inside a run (worker -> each model call -> critic), so ZOE
 * can answer "WHERE did this run fail", not just "it failed" - the gap doc 2200
 * named. A trace is a nested span tree written to ~/.zao/zoe/traces/DATE.jsonl.
 *
 * Shaped to the OpenTelemetry GenAI semantic conventions (gen_ai.request.model,
 * gen_ai.usage.input_tokens, ...) so a real @opentelemetry exporter can be bolted
 * on later WITHOUT reshaping - that exporter is a follow-up (it needs a new dep,
 * which is "ask first"). For now this is pure local telemetry, no dependency.
 *
 * Pure builders (startSpan/endSpan/appendChild/summarizeTrace) are unit-tested;
 * Trace is a thin stack wrapper for instrumentation; writeTrace is best-effort +
 * never throws (telemetry must never break a live run - runs.ts's rule).
 */
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { ZOE_PATHS } from './memory';

export type SpanKind = 'run' | 'worker' | 'generation' | 'tool' | 'critic';
export type SpanStatus = 'ok' | 'error';

export interface SpanAttrs {
  'gen_ai.request.model'?: string;
  'gen_ai.usage.input_tokens'?: number;
  'gen_ai.usage.output_tokens'?: number;
  'gen_ai.cost_usd'?: number;
  error?: string;
  [k: string]: unknown;
}

export interface Span {
  name: string;
  kind: SpanKind;
  startMs: number;
  endMs?: number;
  status: SpanStatus;
  attrs: SpanAttrs;
  children: Span[];
}

/** Begin a span (status defaults ok; caller flips to error on failure). */
export function startSpan(name: string, kind: SpanKind, nowMs: number, attrs: SpanAttrs = {}): Span {
  return { name, kind, startMs: nowMs, status: 'ok', attrs: { ...attrs }, children: [] };
}

/** Close a span: set endMs, optionally the status + extra attributes. */
export function endSpan(span: Span, nowMs: number, status: SpanStatus = 'ok', attrs: SpanAttrs = {}): Span {
  span.endMs = nowMs;
  span.status = status;
  span.attrs = { ...span.attrs, ...attrs };
  return span;
}

export function appendChild(parent: Span, child: Span): Span {
  parent.children.push(child);
  return parent;
}

export interface TraceSummary {
  durationMs: number | null;
  spanCount: number;
  /** name of the FIRST span (depth-first) whose status is error - the "where it failed" answer. */
  failedSpan: string | null;
  ok: boolean;
}

/** Flatten + summarize a trace: total spans, duration, and where the first failure was. */
export function summarizeTrace(root: Span): TraceSummary {
  let count = 0;
  let failed: string | null = null;
  // POST-order (children first) so the deepest/actual failing STEP is reported,
  // not the root's rollup-error. "where did it fail" wants the leaf, not the run.
  const walk = (s: Span) => {
    count += 1;
    for (const c of s.children) walk(c);
    if (failed === null && s.status === 'error') failed = s.name;
  };
  walk(root);
  const durationMs = root.endMs != null ? root.endMs - root.startMs : null;
  return { durationMs, spanCount: count, failedSpan: failed, ok: failed === null };
}

/**
 * A thin stack-based tracer for instrumenting a run. begin() pushes a child span
 * under the current one; end() closes the current span and pops. The root is a
 * 'run' span. Kept minimal on purpose - the smarts live in the pure fns above.
 */
export class Trace {
  readonly root: Span;
  private stack: Span[];
  constructor(rootName: string, nowMs: number, attrs: SpanAttrs = {}) {
    this.root = startSpan(rootName, 'run', nowMs, attrs);
    this.stack = [this.root];
  }
  private get current(): Span {
    return this.stack[this.stack.length - 1];
  }
  begin(name: string, kind: SpanKind, nowMs: number, attrs: SpanAttrs = {}): Span {
    const s = startSpan(name, kind, nowMs, attrs);
    appendChild(this.current, s);
    this.stack.push(s);
    return s;
  }
  end(nowMs: number, status: SpanStatus = 'ok', attrs: SpanAttrs = {}): void {
    if (this.stack.length <= 1) {
      endSpan(this.root, nowMs, status, attrs);
      return;
    }
    endSpan(this.current, nowMs, status, attrs);
    this.stack.pop();
  }
  finish(nowMs: number, status: SpanStatus = 'ok', attrs: SpanAttrs = {}): void {
    endSpan(this.root, nowMs, status, attrs);
  }
}

function tracesDir(): string {
  return join(ZOE_PATHS.home, 'traces');
}

/**
 * Append a finished trace to ~/.zao/zoe/traces/DATE.jsonl (one JSON line per
 * trace). Best-effort: any failure is swallowed - telemetry must never break a
 * run (mirrors runs.ts). Injected writeImpl for testing.
 */
export async function writeTrace(
  root: Span,
  dateIso: string,
  writeImpl?: (path: string, line: string) => Promise<void>,
): Promise<void> {
  try {
    const summary = summarizeTrace(root);
    const line = JSON.stringify({ ...root, _summary: summary }) + '\n';
    if (writeImpl) {
      await writeImpl(join(tracesDir(), `${dateIso.slice(0, 10)}.jsonl`), line);
      return;
    }
    await fs.mkdir(tracesDir(), { recursive: true });
    await fs.appendFile(join(tracesDir(), `${dateIso.slice(0, 10)}.jsonl`), line, 'utf8');
  } catch (e) {
    console.error('[zoe/trace] writeTrace failed (non-fatal):', (e as Error)?.message);
  }
}
