import { describe, it, expect, vi } from 'vitest';
import { startSpan, endSpan, appendChild, summarizeTrace, Trace, writeTrace } from '../trace';

describe('span builders', () => {
  it('starts, ends, and nests spans', () => {
    const root = startSpan('run', 'run', 0);
    const child = endSpan(startSpan('llm', 'generation', 1, { 'gen_ai.request.model': 'haiku' }), 5, 'ok', {
      'gen_ai.usage.output_tokens': 42,
    });
    appendChild(root, child);
    endSpan(root, 6);
    expect(root.children).toHaveLength(1);
    expect(root.children[0].endMs).toBe(5);
    expect(root.children[0].attrs['gen_ai.usage.output_tokens']).toBe(42);
    expect(root.endMs).toBe(6);
  });
});

describe('summarizeTrace', () => {
  it('counts spans, computes duration, and finds the FIRST failed span', () => {
    const root = startSpan('worker:x', 'run', 0);
    appendChild(root, endSpan(startSpan('llm.call', 'generation', 1), 3, 'ok'));
    appendChild(root, endSpan(startSpan('critic', 'critic', 4), 7, 'error', { error: 'critic blew up' }));
    endSpan(root, 8);
    const s = summarizeTrace(root);
    expect(s.spanCount).toBe(3);
    expect(s.durationMs).toBe(8);
    expect(s.failedSpan).toBe('critic'); // the "where did it fail" answer
    expect(s.ok).toBe(false);
  });
  it('reports ok when nothing errored', () => {
    const root = endSpan(startSpan('run', 'run', 0), 10);
    expect(summarizeTrace(root)).toMatchObject({ ok: true, failedSpan: null, spanCount: 1 });
  });
});

describe('Trace (stack tracer)', () => {
  it('builds a nested tree via begin/end and finish', () => {
    const t = new Trace('worker:research', 0, { 'gen_ai.request.model': 'sonnet' });
    t.begin('llm.call', 'generation', 1);
    t.end(4, 'ok', { 'gen_ai.usage.input_tokens': 100 });
    t.begin('critic', 'critic', 5);
    t.end(9, 'error', { error: 'low score' });
    t.finish(10, 'error');
    const s = summarizeTrace(t.root);
    expect(s.spanCount).toBe(3);
    expect(t.root.children.map((c) => c.name)).toEqual(['llm.call', 'critic']);
    expect(t.root.children[0].attrs['gen_ai.usage.input_tokens']).toBe(100);
    expect(s.failedSpan).toBe('critic');
  });
});

describe('writeTrace', () => {
  it('serializes the trace + a summary as one JSONL line to the day file', async () => {
    const root = endSpan(startSpan('worker:x', 'run', 0), 5);
    const write = vi.fn(async (_path: string, _line: string) => {});
    await writeTrace(root, '2026-08-05T12:00:00Z', write);
    expect(write).toHaveBeenCalledTimes(1);
    const [path, line] = write.mock.calls[0] as [string, string];
    expect(path).toContain('/traces/2026-08-05.jsonl');
    const parsed = JSON.parse(line.trim());
    expect(parsed.name).toBe('worker:x');
    expect(parsed._summary.spanCount).toBe(1);
    expect(line.endsWith('\n')).toBe(true);
  });
  it('never throws (best-effort) when the writer fails', async () => {
    const root = startSpan('x', 'run', 0);
    await expect(writeTrace(root, '2026-08-05', async () => { throw new Error('disk full'); })).resolves.toBeUndefined();
  });
});
