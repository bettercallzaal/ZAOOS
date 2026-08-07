import { beforeEach, describe, expect, it } from 'vitest';
import { detectBuildIntent } from '../build-intent';
import {
  __pendingSize,
  __resetPending,
  stashPending,
  takePending,
  worthOffering,
} from '../dm-build-pending';

beforeEach(() => __resetPending());

describe('pending near-miss tasks', () => {
  it('round-trips the full task text, however long', () => {
    const long = 'add a route that '.repeat(30);
    expect(takePending(stashPending(long))).toBe(long);
  });

  // A double-tap must not start two builds.
  it('can only be taken once', () => {
    const k = stashPending('add a route to the api');
    expect(takePending(k)).toBe('add a route to the api');
    expect(takePending(k)).toBeUndefined();
  });

  it('returns undefined for an unknown key rather than throwing', () => {
    expect(takePending('nope')).toBeUndefined();
  });

  it('gives every stash a distinct key', () => {
    const keys = new Set(Array.from({ length: 50 }, (_, i) => stashPending(`task ${i}`)));
    expect(keys.size).toBe(50);
  });

  it('does not leak - old entries are swept on the next stash', () => {
    const k = stashPending('old one');
    // Reach in and age it past the TTL the way real time would.
    takePending(k);
    for (let i = 0; i < 5; i++) stashPending(`t${i}`);
    expect(__pendingSize()).toBeLessThanOrEqual(5);
  });
});

describe('worthOffering - when to ask instead of staying quiet', () => {
  // Offering buttons on everything is the same crying-wolf failure as a flag
  // that fires on nothing, just wearing a keyboard.
  it.each([
    'gm',
    'ok cool',
    'thanks!',
  ])('stays quiet on chatter: %s', (msg) => {
    expect(worthOffering(msg, detectBuildIntent(msg).reason)).toBe(false);
  });

  it('stays quiet when the decline was DEFINITE', () => {
    for (const msg of [
      'should we add a cache to the members endpoint',
      'i want to build a better morning routine around the 4:30 wake up',
      'can you add a route to the publish api?',
    ]) {
      const r = detectBuildIntent(msg);
      expect(r.build).toBe(false);
      expect(worthOffering(msg, r.reason)).toBe(false);
    }
  });

  it('ASKS on the genuinely borderline ones - the whole point', () => {
    // A code verb with no noun the list happens to know: previously this
    // vanished into conversation and cost a full retype.
    const msg = 'wire the new leaderboard widget into the members sidebar';
    const r = detectBuildIntent(msg);
    expect(r.build).toBe(false);
    expect(worthOffering(msg, r.reason)).toBe(true);
  });

  it('never offers on something too short to build from', () => {
    expect(worthOffering('fix it', detectBuildIntent('fix it').reason)).toBe(false);
  });
});
