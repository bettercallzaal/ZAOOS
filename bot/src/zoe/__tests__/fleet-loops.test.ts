import { describe, it, expect } from 'vitest';
import { ageStr, formatLoop, formatLoopsAll, type LoopStatus } from '../fleet-loops';

function loop(overrides: Partial<LoopStatus> = {}): LoopStatus {
  return {
    session: 'coc',
    state: 'working',
    lastLine: 'esc to interrupt',
    updatedAt: new Date(Date.now() - 90_000).toISOString(), // 90s ago
    ...overrides,
  };
}

const NOW = 1_700_000_000_000; // fixed reference point for determinism

// ── ageStr ────────────────────────────────────────────────────────────────────

describe('ageStr', () => {
  it('returns "unknown age" when updatedAt is null', () => {
    expect(ageStr(null, NOW)).toBe('unknown age');
  });

  it('returns seconds when age < 90s', () => {
    const ts = new Date(NOW - 45_000).toISOString();
    expect(ageStr(ts, NOW)).toBe('45s ago');
  });

  it('returns minutes when age is 90s to 90m', () => {
    const ts = new Date(NOW - 5 * 60_000).toISOString();
    expect(ageStr(ts, NOW)).toBe('5m ago');
  });

  it('returns hours when age > 90m', () => {
    const ts = new Date(NOW - 2 * 3_600_000).toISOString();
    expect(ageStr(ts, NOW)).toBe('2h ago');
  });

  it('returns "just now" for future timestamps', () => {
    const ts = new Date(NOW + 5_000).toISOString();
    expect(ageStr(ts, NOW)).toBe('just now');
  });
});

// ── formatLoop ────────────────────────────────────────────────────────────────

describe('formatLoop', () => {
  it('includes session name', () => {
    expect(formatLoop(loop({ session: 'ww' }), NOW)).toContain('ww');
  });

  it('includes state in brackets', () => {
    expect(formatLoop(loop({ state: 'working' }), NOW)).toContain('[working]');
  });

  it('includes "idle" state in brackets', () => {
    expect(formatLoop(loop({ state: 'idle' }), NOW)).toContain('[idle]');
  });

  it('includes age string', () => {
    const ts = new Date(NOW - 3 * 60_000).toISOString();
    expect(formatLoop(loop({ updatedAt: ts }), NOW)).toContain('3m ago');
  });

  it('includes last line', () => {
    expect(formatLoop(loop({ lastLine: 'running tests' }), NOW)).toContain('running tests');
  });

  it('replaces empty lastLine with placeholder', () => {
    expect(formatLoop(loop({ lastLine: '' }), NOW)).toContain('(no recent output)');
  });

  it('truncates lastLine to 100 chars', () => {
    const long = 'x'.repeat(200);
    const out = formatLoop(loop({ lastLine: long }), NOW);
    const lastLinePart = out.split('\n')[1].trim();
    expect(lastLinePart.length).toBeLessThanOrEqual(100);
  });
});

// ── formatLoopsAll ────────────────────────────────────────────────────────────

describe('formatLoopsAll', () => {
  it('returns a no-data message when loops is empty', () => {
    expect(formatLoopsAll([], NOW)).toContain('No loop status data');
  });

  it('includes fleet header with working count', () => {
    const loops = [
      loop({ session: 'zoe', state: 'working' }),
      loop({ session: 'coc', state: 'idle' }),
    ];
    const out = formatLoopsAll(loops, NOW);
    expect(out).toContain('Fleet: 1/2 working');
  });

  it('includes all session names', () => {
    const loops = [
      loop({ session: 'zoe' }),
      loop({ session: 'ww' }),
      loop({ session: 'coc' }),
    ];
    const out = formatLoopsAll(loops, NOW);
    expect(out).toContain('zoe');
    expect(out).toContain('ww');
    expect(out).toContain('coc');
  });

  it('reports 0 working when all idle', () => {
    const loops = [loop({ state: 'idle' }), loop({ session: 'ww', state: 'idle' })];
    expect(formatLoopsAll(loops, NOW)).toContain('Fleet: 0/2 working');
  });
});
