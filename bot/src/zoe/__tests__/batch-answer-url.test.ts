// @vitest-environment node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { isUrlLed, parseBatchAnswer } from '../tg-interactions';

// Verbatim inputs (first-handler-wins.md rule 5). Before 2026-10-09 each of
// these was logged as batch answer "https" and ZOE replied
// "Logged 1 answer from batch." - nothing downstream ever saw the link.
const LINK_ONLY = 'https://x.com/someone/status/1234567890';
const LINK_WITH_NOTE = 'https://x.com/someone/status/123 reply to this';

describe('a DM that opens with a link is not a batch answer', () => {
  it.each([LINK_ONLY, LINK_WITH_NOTE, 'http://example.com/a', '  https://paragraph.com/@thezao/x'])('%s', (text) => {
    expect(isUrlLed(text)).toBe(true);
    expect(parseBatchAnswer(text)).toEqual([]);
  });

  it('red control: real batch answers still parse', () => {
    expect(parseBatchAnswer('1:A\n2:best\n3:skip').map((a) => a.choice)).toEqual([1, 2, 3]);
    expect(parseBatchAnswer('q:yes').map((a) => a.choice)).toEqual(['q']);
  });

  it('a link line inside a real batch is skipped, the answers are kept', () => {
    expect(parseBatchAnswer('1:A\nhttps://x.com/a/status/99999\n2:B').map((a) => a.choice)).toEqual([1, 2]);
  });

  it('a link later in the text does not make it URL-led', () => {
    expect(isUrlLed('1: see https://x.com/a/status/12345')).toBe(false);
    expect(isUrlLed('build: the thing')).toBe(false);
  });

  it('the index.ts batch gate carries the isUrlLed exclusion', () => {
    const src = readFileSync(fileURLToPath(new URL('../index.ts', import.meta.url)), 'utf8');
    const at = src.indexOf('/^\\d+:|^[a-z]+:/i.test(text.trim())');
    expect(at).toBeGreaterThan(-1);
    expect(src.slice(Math.max(0, at - 300), at)).toContain('!isUrlLed(text)');
  });
});
