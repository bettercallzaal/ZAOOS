import { describe, expect, it } from 'vitest';
import { DEVZ_GROUP_PROFILE, buildGroupContext, isDevzGroup } from '../memory';

describe('isDevzGroup', () => {
  it.each([
    ['the devz chat id', '-100222', '-100222', true],
    ['the devz chat id with spaces in env', '-100222', ' -100222 ', true],
    ['another chat id', '-100333', '-100222', false],
    ['env unset', '-100222', undefined, false],
    ['env empty', '-100222', '', false],
  ] as const)('%s', (_l, id, env, expected) => {
    expect(isDevzGroup(id, env)).toBe(expected);
  });

  it('does not match by title, so a look-alike group stays generic', () => {
    const prev = process.env.ZAO_DEVZ_CHAT_ID;
    process.env.ZAO_DEVZ_CHAT_ID = '-100222';
    try {
      expect(buildGroupContext('-100999', 'ZAO Devz Alumni')).not.toContain('Group Profile: ZAO Devz\n');
      expect(buildGroupContext('-100999', 'ZAO Devz Alumni')).toContain('Group Profile: ZAO Devz Alumni');
    } finally {
      if (prev === undefined) delete process.env.ZAO_DEVZ_CHAT_ID;
      else process.env.ZAO_DEVZ_CHAT_ID = prev;
    }
  });
});

describe('buildGroupContext for ZAO Devz', () => {
  const prev = process.env.ZAO_DEVZ_CHAT_ID;
  process.env.ZAO_DEVZ_CHAT_ID = '-100111';
  const ctx = buildGroupContext('-100111', 'ZAO DEVZ', undefined);
  if (prev === undefined) delete process.env.ZAO_DEVZ_CHAT_ID;
  else process.env.ZAO_DEVZ_CHAT_ID = prev;

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
