import { describe, expect, it } from 'vitest';
import { DEVZ_GROUP_PROFILE, buildGroupContext, isDevzGroup } from '../memory';

describe('isDevzGroup', () => {
  it.each([
    ['the export title', '-100111', 'ZAO DEVZ', undefined, true],
    ['a spaced title', '-100111', 'ZAO Devz', undefined, true],
    ['the devz chat id, any title', '-100222', 'Builders', '-100222', true],
    ['another group', '-100333', 'General Web3 Chat', '-100222', false],
    ['a title that only contains devz inside a word', '-100444', 'zaodevzz fans', undefined, false],
  ] as const)('%s', (_l, id, title, env, expected) => {
    expect(isDevzGroup(id, title, env)).toBe(expected);
  });
});

describe('buildGroupContext for ZAO Devz', () => {
  const ctx = buildGroupContext('-100111', 'ZAO DEVZ', undefined);

  it('carries the Devz profile, not the generic one-liner', () => {
    expect(ctx).toContain('Group Profile: ZAO Devz');
    expect(ctx).not.toContain('Group Profile: ZAO DEVZ');
    expect(ctx).toContain(DEVZ_GROUP_PROFILE);
  });

  it('names the live projects, the daily themes and the house rules', () => {
    for (const s of ['MixZ', 'RewindZ', 'Sparkz', 'ZAO Desk', 'Tue music', 'Sat WaveWarZ', 'not in DMs', 'one screen']) {
      expect(ctx).toContain(s);
    }
  });

  it('says what ZOE cannot do here, so she does not guess', () => {
    expect(ctx).toContain('cannot open Paragraph editor links');
    expect(ctx).toContain('never guess');
  });

  it('keeps the privacy and escalation boundaries after the profile', () => {
    expect(ctx.indexOf('Group Profile: ZAO Devz')).toBeLessThan(ctx.indexOf('Role & Boundaries:'));
    expect(ctx).toContain("Privacy: Do not share Zaal's private schedule");
  });

  it('carries no handle or Telegram id', () => {
    expect(DEVZ_GROUP_PROFILE).not.toMatch(/@\w+/);
    expect(DEVZ_GROUP_PROFILE).not.toMatch(/\d{6,}/);
  });

  it('leaves COC and other groups as they were', () => {
    expect(buildGroupContext('-1001609766705', '+Community of Communities')).toContain('Community of Communities (COC)');
    expect(buildGroupContext('-1009999999', 'General Web3 Chat')).toContain('Group Profile: General Web3 Chat');
  });
});
