import { describe, expect, it } from 'vitest';
import { isCommandPrefixed, parseBatchAnswer } from '../tg-interactions';
import { detectBuildIntent } from '../build-intent';

/**
 * THE 1/10 BUG, 2026-08-08.
 *
 * Zaal sent "build: add a comment at the top of README.md saying hello from
 * the phone" to the ZOE DM. Twice. Both times ZOE replied "Logged 1 answer
 * from batch." and nothing built.
 *
 * The batch-answer guard accepted any lowercase-word-plus-colon as a question
 * key, and it sits ~1000 lines above detectBuildIntent and RETURNS. So every
 * verb in the build vocabulary was swallowed before the classifier ran - the
 * feature was unreachable through its own documented syntax.
 *
 * Confirmed by the journal: zero [zoe/ran] lines for build-intent, meaning it
 * never executed rather than executing and declining.
 */
describe('a build request must never be parsed as a batch answer', () => {
  const THE_MESSAGE = 'build: add a comment at the top of README.md saying hello from the phone';

  it('the exact message that failed now reaches the build classifier', () => {
    expect(parseBatchAnswer(THE_MESSAGE)).toEqual([]);
    expect(detectBuildIntent(THE_MESSAGE).build).toBe(true);
  });

  // Every verb in EXPLICIT_PREFIX is lowercase letters plus a colon, so every
  // one of them was swallowed. Not just "build".
  it.each(['build', 'code', 'fix', 'ship', 'implement'])(
    '"%s:" is a command, not a batch answer',
    (verb) => {
      const msg = `${verb}: add a health endpoint to the api router`;
      expect(isCommandPrefixed(msg)).toBe(true);
      expect(parseBatchAnswer(msg)).toEqual([]);
    },
  );

  it.each(['note', 'todo', 'research', 'capture'])(
    'the other capture prefixes are protected too: "%s:"',
    (verb) => {
      expect(parseBatchAnswer(`${verb}: something worth keeping`)).toEqual([]);
    },
  );

  it('is case-insensitive - Build: is still a command', () => {
    expect(isCommandPrefixed('Build: add a thing to the codebase')).toBe(true);
  });

  it('tolerates a space before the colon', () => {
    expect(isCommandPrefixed('build : add a thing')).toBe(true);
  });
});

describe('real batch answers still parse - the fix must not break the feature', () => {
  it('numeric keys work', () => {
    const a = parseBatchAnswer('1:A\n2:best\n3:skip');
    expect(a).toHaveLength(3);
    expect(a[0].choice).toBe(1);
    expect(a[1].value).toBe('best');
  });

  it('a non-command alphabetic key still works', () => {
    const a = parseBatchAnswer('a:yes');
    expect(a).toHaveLength(1);
    expect(a[0].choice).toBe('a');
  });

  it('a single numeric answer works', () => {
    expect(parseBatchAnswer('2:option b')).toHaveLength(1);
  });

  it('ordinary prose is not a batch answer', () => {
    expect(parseBatchAnswer('hey what is on the board today')).toEqual([]);
  });
});
