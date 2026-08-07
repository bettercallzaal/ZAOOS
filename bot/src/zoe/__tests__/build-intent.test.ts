import { describe, expect, it } from 'vitest';
import { detectBuildIntent } from '../build-intent';

// The false-POSITIVE cases matter more than the false negatives here. A missed
// build costs one retyped message. A spurious build spins the coder on an
// offhand remark, opens a junk PR, and teaches Zaal to distrust the feature -
// which lands him back at the 1/10 this was built to fix.
describe('detectBuildIntent', () => {
  describe('explicit prefix - Zaal overriding the classifier', () => {
    it.each([
      ['build: add a /health route to zaalcaster that returns uptime', 'build'],
      ['fix: the inbox cache keeps answered casts for 60s', 'fix'],
      ['code: a script that dumps the surface map to json', 'code'],
      ['ship: the wavewarz card on the grow tab', 'ship'],
      ['implement: bustInboxCache on the snooze path', 'implement'],
    ])('%s -> builds', (msg, verb) => {
      const r = detectBuildIntent(msg);
      expect(r.build).toBe(true);
      expect(r.confidence).toBe('explicit');
      expect(r.reason).toContain(verb);
    });

    it('strips the prefix so the coder gets the task, not the keyword', () => {
      const r = detectBuildIntent('build: add a /health route to zaalcaster');
      expect(r.task).toBe('add a /health route to zaalcaster');
    });

    it('is case- and spacing-insensitive', () => {
      expect(detectBuildIntent('BUILD:  add a /health route to zaalcaster').build).toBe(true);
    });

    it('honours the prefix even when the body would otherwise be vetoed', () => {
      // "should we" normally vetoes. After an explicit prefix, he has decided.
      const r = detectBuildIntent('build: should we add a retry to the webhook handler');
      expect(r.build).toBe(true);
      expect(r.confidence).toBe('explicit');
    });

    it('rejects a bare prefix with nothing after it', () => {
      expect(detectBuildIntent('build:').build).toBe(false);
      expect(detectBuildIntent('build: x').build).toBe(false);
    });
  });

  describe('unprefixed requests that ARE code work', () => {
    it.each([
      'add a route to the publish api that returns the last cast hash',
      'fix the bug where the members directory returns duplicate rows',
      'refactor the surface map generator to emit json as well',
      'remove the unused imports from the discord events handler',
    ])('%s -> builds', (msg) => {
      const r = detectBuildIntent(msg);
      expect(r.build).toBe(true);
      expect(r.confidence).toBe('likely');
    });

    it('passes the whole message through as the task', () => {
      const msg = 'fix the bug where the members directory returns duplicate rows';
      expect(detectBuildIntent(msg).task).toBe(msg);
    });
  });

  describe('must NOT build - questions, opinions, status', () => {
    it.each([
      ['should we add a cache to the members endpoint', 'a question about direction'],
      ['what should the api return here', 'asking for an answer'],
      ['how do i add a route in next 16', 'asking how, not asking for it'],
      ['do you think the webhook handler is worth refactoring', 'asking an opinion'],
      ['the build failed on ci again', 'a status report'],
      ['did you add the route yet', 'asking about past work'],
      ['thinking about a plan for the api rewrite', 'thinking aloud'],
    ])('%s -> no build (%s)', (msg) => {
      expect(detectBuildIntent(msg).build).toBe(false);
    });

    it('never builds anything with a question mark', () => {
      expect(detectBuildIntent('can you add a route to the publish api?').build).toBe(false);
    });
  });

  describe('must NOT build - "build" that is not software', () => {
    it.each([
      'i want to build a better morning routine around the 4:30 wake up',
      'we should build trust with the partners before asking',
      'build the audience first then launch the token',
      'how to build a community that actually shows up',
    ])('%s -> no build', (msg) => {
      expect(detectBuildIntent(msg).build).toBe(false);
    });
  });

  describe('must NOT build - too thin to act on', () => {
    it('rejects a code-shaped message with no detail', () => {
      const r = detectBuildIntent('fix the api');
      expect(r.build).toBe(false);
      expect(r.reason).toContain('too short');
    });

    it('rejects a verb with no code-shaped target', () => {
      const r = detectBuildIntent('add that to the list when you get a chance');
      expect(r.build).toBe(false);
    });

    it('rejects ordinary conversation', () => {
      for (const msg of ['gm', 'yeah that works', 'ok cool', 'thanks!', '']) {
        expect(detectBuildIntent(msg).build).toBe(false);
      }
    });
  });

  it('always explains itself - every result carries a reason', () => {
    for (const msg of ['gm', 'build: add a /health route to zaalcaster', 'fix the api', 'should we add a cache to the api']) {
      expect(detectBuildIntent(msg).reason.length).toBeGreaterThan(0);
    }
  });
});

// Added after the noun list proved un-completable: "refactor the surface map
// generator" is obviously code, and "generator" will always be missing from
// somebody's list. Code-exclusive verbs now carry the signal alone - so these
// guard that the looser tier did not open a false-positive hole.
describe('code-exclusive verbs stand alone, but still obey every veto', () => {
  it('builds on a code-only verb with no noun match', () => {
    const r = detectBuildIntent('refactor the surface map generator to emit json as well');
    expect(r.build).toBe(true);
    expect(r.reason).toContain('code-only');
  });

  it('still refuses a question about refactoring', () => {
    expect(detectBuildIntent('should we refactor the surface map generator').build).toBe(false);
    expect(detectBuildIntent('is it worth refactoring the generator soon').build).toBe(false);
  });

  it('still refuses a status report about a refactor', () => {
    expect(detectBuildIntent('did you refactor the generator like we discussed').build).toBe(false);
  });

  it('still refuses one that is too thin to act on', () => {
    expect(detectBuildIntent('refactor it').build).toBe(false);
  });
});
