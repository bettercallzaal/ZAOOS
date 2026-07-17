// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockMkdirSync = vi.hoisted(() => vi.fn());
const mockAppendFileSync = vi.hoisted(() => vi.fn());
const mockReadFileSync = vi.hoisted(() => vi.fn());
const mockWriteFileSync = vi.hoisted(() => vi.fn());

vi.mock('node:fs', () => ({
  mkdirSync: mockMkdirSync,
  appendFileSync: mockAppendFileSync,
  readFileSync: mockReadFileSync,
  writeFileSync: mockWriteFileSync,
}));

import { recordCall, summaryText, todaySummary } from '../cost-ledger';

const TEST_DAY = '2026-07-17';

afterEach(() => vi.clearAllMocks());

// ── todaySummary ──────────────────────────────────────────────────────────────

describe('todaySummary', () => {
  it('returns [] when the JSONL file does not exist', () => {
    mockReadFileSync.mockImplementation(() => { throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' }); });
    expect(todaySummary(TEST_DAY)).toEqual([]);
  });

  it('returns [] when the file is empty', () => {
    mockReadFileSync.mockReturnValue('');
    expect(todaySummary(TEST_DAY)).toEqual([]);
  });

  it('aggregates calls per model', () => {
    const line1 = JSON.stringify({ model: 'sonnet', in: 100, out: 50, usd: 0.001 });
    const line2 = JSON.stringify({ model: 'haiku', in: 200, out: 80, usd: 0.0005 });
    const line3 = JSON.stringify({ model: 'sonnet', in: 150, out: 60, usd: 0.002 });
    mockReadFileSync.mockReturnValue(`${line1}\n${line2}\n${line3}\n`);
    const rows = todaySummary(TEST_DAY);
    const sonnet = rows.find((r) => r.model === 'sonnet');
    expect(sonnet).toBeDefined();
    expect(sonnet!.calls).toBe(2);
    expect(sonnet!.inputTokens).toBe(250);
    expect(sonnet!.outputTokens).toBe(110);
    expect(sonnet!.costUsd).toBeCloseTo(0.003, 5);
  });

  it('sorts models by costUsd descending', () => {
    const cheap = JSON.stringify({ model: 'haiku', in: 10, out: 5, usd: 0.0001 });
    const expensive = JSON.stringify({ model: 'opus', in: 500, out: 200, usd: 0.05 });
    mockReadFileSync.mockReturnValue(`${cheap}\n${expensive}\n`);
    const rows = todaySummary(TEST_DAY);
    expect(rows[0].model).toBe('opus');
    expect(rows[1].model).toBe('haiku');
  });

  it('skips corrupt (non-JSON) lines without throwing', () => {
    const good = JSON.stringify({ model: 'sonnet', in: 100, out: 50, usd: 0.001 });
    mockReadFileSync.mockReturnValue(`corrupt-line\n${good}\n`);
    const rows = todaySummary(TEST_DAY);
    expect(rows).toHaveLength(1);
    expect(rows[0].model).toBe('sonnet');
  });

  it('skips empty lines without throwing', () => {
    const good = JSON.stringify({ model: 'haiku', in: 10, out: 5, usd: 0.0001 });
    mockReadFileSync.mockReturnValue(`\n\n${good}\n\n`);
    expect(todaySummary(TEST_DAY)).toHaveLength(1);
  });

  it('handles missing fields gracefully (defaults to 0)', () => {
    mockReadFileSync.mockReturnValue(JSON.stringify({ model: 'sonnet' }) + '\n');
    const rows = todaySummary(TEST_DAY);
    expect(rows[0].inputTokens).toBe(0);
    expect(rows[0].costUsd).toBe(0);
  });
});

// ── summaryText ───────────────────────────────────────────────────────────────

describe('summaryText', () => {
  it('returns a "no calls" message when there is no data', () => {
    mockReadFileSync.mockImplementation(() => { throw new Error('ENOENT'); });
    expect(summaryText(TEST_DAY)).toContain('No ZOE model calls logged');
  });

  it('includes total cost and call count in the header', () => {
    const line1 = JSON.stringify({ model: 'sonnet', in: 100, out: 50, usd: 0.01 });
    const line2 = JSON.stringify({ model: 'haiku', in: 50, out: 20, usd: 0.001 });
    mockReadFileSync.mockReturnValue(`${line1}\n${line2}\n`);
    const text = summaryText(TEST_DAY);
    expect(text).toContain('$0.0110'); // total
    expect(text).toContain('2 calls');
  });

  it('lists each model with call count, tokens, and cost', () => {
    const line = JSON.stringify({ model: 'sonnet', in: 1000, out: 500, usd: 0.025 });
    mockReadFileSync.mockReturnValue(`${line}\n`);
    const text = summaryText(TEST_DAY);
    expect(text).toContain('sonnet');
    expect(text).toContain('1 calls');
    expect(text).toContain('$0.0250');
  });
});

// ── recordCall ────────────────────────────────────────────────────────────────

describe('recordCall', () => {
  it('creates the directory and appends a JSONL entry', () => {
    mockWriteFileSync.mockImplementation(() => {}); // for writeDailySummary
    mockReadFileSync.mockReturnValue(''); // for todaySummary inside writeDailySummary
    recordCall('concierge', { model: 'sonnet', inputTokens: 100, outputTokens: 50, totalCostUsd: 0.001 });
    expect(mockMkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
    expect(mockAppendFileSync).toHaveBeenCalledOnce();
    const content: string = mockAppendFileSync.mock.calls[0][1];
    const parsed = JSON.parse(content.trim());
    expect(parsed.caller).toBe('concierge');
    expect(parsed.model).toBe('sonnet');
    expect(parsed.in).toBe(100);
  });

  it('swallows errors without throwing (best-effort telemetry)', () => {
    mockMkdirSync.mockImplementation(() => { throw new Error('disk full'); });
    expect(() => recordCall('test', { model: 'haiku', inputTokens: 0, outputTokens: 0, totalCostUsd: 0 })).not.toThrow();
  });
});
