/**
 * Doc numbering must not hand out a number that already exists.
 *
 * On 2026-08-15 ZOE's research-worker produced its first doc in days and
 * numbered it 2249 - already taken by research/agents/2249-cli-messaging-vs-ssh-
 * orchestration. The collision guard caught it, but only after a PR was open.
 *
 * Cause: nextDocNum read a LOCAL checkout. REPO defaults to ~/zao-os while the
 * bot runs from ~/zao-bot-live, and nothing keeps ~/zao-os current - it was six
 * days behind, where the highest doc really was 2248.
 *
 * Two things are pinned here: the parser reads EVERY topic dir (the hardcoded
 * TOPICS list names 13 of the repo's 25), and it ignores digits that are not a
 * doc number.
 */
import { describe, expect, it } from 'vitest';
import { maxDocNumFrom } from '../research-doc';

describe('maxDocNumFrom', () => {
  it('finds the highest number across topic dirs', () => {
    expect(
      maxDocNumFrom(
        [
          'research/agents/2285-zol-draft-only-eleven-days',
          'research/events/2287-yerb-recap',
          'research/business/2282-fleet-output-audit',
        ].join('\n'),
      ),
    ).toBe(2287);
  });

  it('reads topic dirs that are NOT in the hardcoded TOPICS list', () => {
    // TOPICS names 13; the repo has 25. `technology` and `estate` are real dirs
    // that the old scan never looked at, so a doc landing there was invisible.
    expect(maxDocNumFrom('research/technology/2278-ambient-voice')).toBe(2278);
    expect(maxDocNumFrom('research/estate/2299-something')).toBe(2299);
  });

  it('the exact collision: a listing ending at 2248 must not yield 2249 as free', () => {
    // Reading a six-day-old checkout gave 2248, so nextDocNum returned 2249 -
    // which research/agents/2249 already held. The fix is reading origin/main,
    // and this pins the arithmetic the caller depends on.
    const stale = 'research/agents/2248-something';
    const fresh = 'research/agents/2248-something\nresearch/infrastructure/2288-code-with-no-home';
    expect(maxDocNumFrom(stale) + 1).toBe(2249);
    expect(maxDocNumFrom(fresh) + 1).toBe(2289);
  });

  it('ignores digits that are not a doc number', () => {
    expect(maxDocNumFrom('research/agents/notes-2026-08-15')).toBe(0);
    expect(maxDocNumFrom('research/agents/2285-doc/sub-9999-nested')).toBe(2285);
    expect(maxDocNumFrom('')).toBe(0);
  });

  it('does not let a 5+ digit slug poison the max', () => {
    // The loose-regex bug the /zao-research skill already learned in July.
    expect(maxDocNumFrom('research/agents/1234567-huge')).toBe(0);
  });
});
