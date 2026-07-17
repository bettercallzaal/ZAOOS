// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { matchInterest } from '../routing';

// matchInterest scores keyword hits per portal category, returns the Portal
// with the highest score (or null if nothing matches).

describe('matchInterest', () => {
  it('returns null for an empty string', () => {
    expect(matchInterest('')).toBeNull();
  });

  it('returns null for an unrecognised string', () => {
    expect(matchInterest('xyzzy frobnicator quantum')).toBeNull();
  });

  it('matches "music" to the music portal', () => {
    const result = matchInterest('I love music');
    expect(result?.id).toBe('music');
  });

  it('matches "beat" to the music portal', () => {
    expect(matchInterest('Looking for beat producers')?.id).toBe('music');
  });

  it('matches "battle" to the music portal', () => {
    expect(matchInterest('I want to watch a battle')?.id).toBe('music');
  });

  it('matches "build" to the build portal', () => {
    expect(matchInterest('I want to build something')?.id).toBe('build');
  });

  it('matches "code" to the build portal', () => {
    expect(matchInterest('I like to code')?.id).toBe('build');
  });

  it('matches "agent" keyword to the build portal', () => {
    expect(matchInterest('working on an AI agent')?.id).toBe('build');
  });

  it('matches "earn" to the earn portal', () => {
    expect(matchInterest('I want to earn tokens')?.id).toBe('earn');
  });

  it('matches "stake" to the earn portal', () => {
    expect(matchInterest('stake my crypto')?.id).toBe('earn');
  });

  it('matches "vote" to the govern portal', () => {
    expect(matchInterest('I want to vote on proposals')?.id).toBe('govern');
  });

  it('matches "dao" to the govern portal', () => {
    expect(matchInterest('DAO governance')?.id).toBe('govern');
  });

  it('matches "member" to the vip portal', () => {
    expect(matchInterest('I am a member')?.id).toBe('vip');
  });

  it('matches "everything" to the vip portal', () => {
    expect(matchInterest('I want everything')?.id).toBe('vip');
  });

  it('picks the portal with the highest keyword count', () => {
    // "music listen song" → 3 music hits vs 0 others → music
    const result = matchInterest('music listen song');
    expect(result?.id).toBe('music');
  });

  it('is case-insensitive', () => {
    expect(matchInterest('MUSIC LISTEN')?.id).toBe('music');
  });

  it('returns a Portal object with required fields', () => {
    const result = matchInterest('build code develop');
    expect(result).toMatchObject({
      id: 'build',
      title: expect.any(String),
      icon: expect.any(String),
      destinations: expect.any(Array),
    });
  });
});
