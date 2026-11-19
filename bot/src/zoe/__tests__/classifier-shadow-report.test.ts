import { describe, expect, it } from 'vitest';
import {
  formatShadowReport,
  parseShadowLine,
  summarizeShadowLog,
} from '../classifier-shadow-report';

function row(
  keyword: string,
  classifier: string | null,
  ms: number,
  at = '2026-11-19T15:00:00.000Z',
  extra: object = {},
): string {
  return JSON.stringify({
    at,
    chars: 10,
    keyword,
    classifier,
    agree: keyword === classifier,
    ms,
    ...extra,
  });
}

describe('parseShadowLine', () => {
  it('reads a row model-classifier.ts writes', () => {
    expect(parseShadowLine(row('default', 'quick', 120))).toEqual({
      at: '2026-11-19T15:00:00.000Z',
      keyword: 'default',
      classifier: 'quick',
      ms: 120,
    });
  });

  it('keeps a failure row with classifier null and its failure kind', () => {
    expect(
      parseShadowLine(row('quick', null, 8000, undefined, { failure: 'threw' })),
    ).toMatchObject({
      classifier: null,
      failure: 'threw',
    });
  });

  it.each([
    ['not JSON', '{oops'],
    ['a JSON number', '42'],
    ['null', 'null'],
    ['a bad time', row('quick', 'quick', 1, 'yesterday')],
    ['an unknown keyword tier', row('opus', 'quick', 1)],
    ['an unknown classifier tier', row('quick', 'opus', 1)],
    [
      'a missing ms',
      JSON.stringify({ at: '2026-11-19T15:00:00Z', keyword: 'quick', classifier: 'quick' }),
    ],
  ])('refuses %s', (_name, line) => {
    expect(parseShadowLine(line)).toBeNull();
  });
});

describe('summarizeShadowLog', () => {
  const log = [
    row('default', 'default', 100, '2026-11-19T15:00:00.000Z'),
    row('default', 'hard', 200, '2026-11-19T15:01:00.000Z'),
    row('default', 'hard', 300, '2026-11-19T15:02:00.000Z'),
    row('quick', 'default', 400, '2026-11-19T15:03:00.000Z'),
    row('default', 'quick', 500, '2026-11-19T14:59:00.000Z'),
    row('quick', null, 8000, '2026-11-19T15:04:00.000Z', { failure: 'bad-reply' }),
    '',
    'not json',
  ].join('\n');

  it('counts agreement, failures and the moves live mode would make', () => {
    const s = summarizeShadowLog(log);
    expect(s).toMatchObject({ rows: 6, unreadable: 1, agree: 1, failed: 1, up: 3, down: 1 });
    expect(s.moves).toEqual({ 'default>hard': 2, 'quick>default': 1, 'default>quick': 1 });
  });

  it('spans the earliest to the latest row, whatever the file order', () => {
    const s = summarizeShadowLog(log);
    expect(s.first).toBe('2026-11-19T14:59:00.000Z');
    expect(s.last).toBe('2026-11-19T15:04:00.000Z');
  });

  it('gives nearest-rank latency percentiles over every readable row', () => {
    const s = summarizeShadowLog(log);
    expect(s.p50Ms).toBe(300);
    expect(s.p95Ms).toBe(8000);
  });

  it('an empty log is zero rows, with no percentiles', () => {
    expect(summarizeShadowLog('')).toMatchObject({
      rows: 0,
      unreadable: 0,
      p50Ms: null,
      p95Ms: null,
    });
  });
});

describe('formatShadowReport', () => {
  it('says what live mode would change, biggest move first', () => {
    const text = formatShadowReport(
      summarizeShadowLog(
        [
          row('default', 'hard', 100),
          row('default', 'hard', 100),
          row('default', 'quick', 100),
          row('quick', 'quick', 100),
        ].join('\n'),
      ),
    );
    expect(text).toContain('4 turn(s)');
    expect(text).toContain('Agree with the keywords: 1 (25%)');
    expect(text).toContain(
      'Live mode would move 3 turn(s): 2 to a stronger model, 1 to a weaker one',
    );
    expect(text.indexOf('default -> hard: 2')).toBeLessThan(text.indexOf('default -> quick: 1'));
  });

  it('with no readable rows, says so and how to get some', () => {
    const text = formatShadowReport(summarizeShadowLog('garbage\n'));
    expect(text).toContain('No readable shadow rows (1 unreadable line(s))');
    expect(text).toContain('ZOE_MODEL_CLASSIFIER=shadow');
  });
});
