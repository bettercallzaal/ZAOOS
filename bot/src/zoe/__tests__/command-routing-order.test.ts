/**
 * Command routing order - assertable without booting the bot.
 *
 * index.ts routes positionally: ~153 early-return branches, no routing table,
 * first match wins and returns. A broad matcher above a narrow one makes the
 * narrow one unreachable and nothing reports an error, because the swallowing
 * branch succeeds. That is the 2026-08-08 failure class
 * (.claude/rules/first-handler-wins.md).
 *
 * Testing it directly is not possible: agent-loops.md rule 21 forbids importing
 * index.ts in a test, since its top level boots a live poller that would collide
 * with the running instance. So COMMAND_TABLE in commands.ts declares the order
 * once, classifyCommand applies it, and the last test here asserts the declared
 * order still matches the order in index.ts SOURCE - read as text, never
 * imported. Two lists that can disagree is what this replaces.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { COMMAND_TABLE, classifyCommand, isZoeCommand } from '../commands';
import { isCommandPrefixed } from '../tg-interactions';

const INDEX_SOURCE = readFileSync(fileURLToPath(new URL('../index.ts', import.meta.url)), 'utf8');

describe('classifyCommand routes verbatim input to the right command', () => {
  const cases: Array<[string, string | null]> = [
    ['/focus', 'focus-on'],
    ['/focus on', 'focus-on'],
    ['/focus off', 'focus-off'],
    ['/audit', 'audit'],
    ['/budget', 'budget'],
    ['/budget detailed', 'budget'],
    ['/checkpoint shipped the bus fix', 'checkpoint'],
    ['note: remember the Artizen boost math', 'note'],
    ['cc: same thing, other prefix', 'note'],
    ['plan: ship the federation canary', 'plan'],
    ['decompose: ship the federation canary', 'plan'],
    ['queue: how do endowment LPs price', 'queue'],
    ['stop nudges', 'nudge-toggle'],
    ['resume tips', 'nudge-toggle'],
    ['what did we ship today', null],
    ['', null],
  ];

  for (const [input, expected] of cases) {
    it(`${JSON.stringify(input)} -> ${expected ?? 'not a command'}`, () => {
      expect(classifyCommand(input)).toBe(expected);
    });
  }

  it('/focus off does not get eaten by /focus on', () => {
    // Both patterns start with /focus. They are disjoint today because FOCUS_ON_RE
    // is anchored, but that is a property worth asserting rather than assuming -
    // an unanchored edit would silently make "/focus off" turn focus ON.
    expect(classifyCommand('/focus off')).toBe('focus-off');
  });

  it('trims, because a phone keyboard adds whitespace', () => {
    expect(classifyCommand('  /audit  ')).toBe('audit');
  });
});

describe('build vocabulary must NOT be classified as a command here', () => {
  // `build:` is lowercase letters plus a colon, the exact shape that the
  // batch-answer guard ate in the 1/10 DM build incident. It is handled by
  // isCommandPrefixed, not by this table, and must fall through so the build
  // classifier can see it.
  for (const input of ['build: a fix for the poller', 'fix: the ledger', 'ship: it']) {
    it(`${JSON.stringify(input)} falls through classifyCommand`, () => {
      expect(classifyCommand(input)).toBeNull();
      expect(isCommandPrefixed(input)).toBe(true);
    });
  }
});

describe('isZoeCommand still behaves, now with one list instead of two', () => {
  it('true for every kind in the table', () => {
    const samples = ['/focus', '/focus off', '/audit', '/budget', '/checkpoint x', 'note: x', 'plan: x', 'queue: x', 'stop nudges'];
    for (const s of samples) expect(isZoeCommand(s), s).toBe(true);
  });

  it('false for ordinary prose, so a reflection answer is not mistaken for a command', () => {
    expect(isZoeCommand('had a good day, shipped the bus fix')).toBe(false);
  });
});

describe('the declared order matches index.ts, so the two cannot drift', () => {
  it('every dispatched command appears in index.ts', () => {
    const missing = COMMAND_TABLE.filter((r) => r.indexToken !== null)
      .filter((r) => !INDEX_SOURCE.includes(`${r.indexToken}.`))
      .map((r) => r.kind);
    expect(missing, `declared as dispatched in index.ts but not found there: ${missing.join(', ')}`).toEqual([]);
  });

  it('COMMAND_TABLE order equals index.ts dispatch order', () => {
    // Position of each token's first DISPATCH use, skipping the import block.
    const importBlockEnd = INDEX_SOURCE.indexOf("} from './commands'");
    const positions = COMMAND_TABLE.filter((r) => r.indexToken !== null).map((r) => ({
      kind: r.kind,
      at: INDEX_SOURCE.indexOf(`${r.indexToken}.`, importBlockEnd > 0 ? importBlockEnd : 0),
    }));

    expect(
      positions.every((p) => p.at > 0),
      `a dispatch site was not found: ${positions.filter((p) => p.at <= 0).map((p) => p.kind).join(', ')}`,
    ).toBe(true);

    const declared = positions.map((p) => p.kind);
    const actual = [...positions].sort((a, b) => a.at - b.at).map((p) => p.kind);

    expect(
      declared,
      'COMMAND_TABLE no longer matches the order index.ts dispatches in.\n' +
        'One of them moved. Routing is positional, so a reordering can make a\n' +
        'command unreachable with every other test still green - decide which\n' +
        'order is correct and change both together, deliberately.\n' +
        `declared: ${declared.join(' -> ')}\n` +
        `index.ts: ${actual.join(' -> ')}`,
    ).toEqual(actual);
  });
});
