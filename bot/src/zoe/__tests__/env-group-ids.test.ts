// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { groupIds } from '../env';

afterEach(() => vi.unstubAllEnvs());

describe('groupIds', () => {
  it('reads the canonical names', () => {
    vi.stubEnv('ZAAL_BOTZ_GROUP_ID', '-100123');
    vi.stubEnv('ZAAL_BOTZ_RESEARCH_THREAD', '7');
    vi.stubEnv('ZOL_THREAD', '9');
    vi.stubEnv('ZAO_GROUP_ID', '-100555');
    vi.stubEnv('ZAOSTOCK_TEAM_GROUP_ID', '-100777');
    vi.stubEnv('ZAO_DEVZ_CHAT_ID', '-100888');
    expect(groupIds()).toEqual({
      zaalBotzGroup: -100123, researchThread: 7, zolThread: 9,
      zaoGroup: -100555, zaostockTeamGroup: -100777, devzChat: -100888,
    });
  });
  it('tolerates the old aliases, which the inline process.env reads never did', () => {
    vi.stubEnv('ZAAL_BOTZ_GROUP_ID', '');
    vi.stubEnv('ZAALBOTS_GROUP_CHAT_ID', '-100321');
    vi.stubEnv('ZAAL_BOTZ_RESEARCH_THREAD', '');
    vi.stubEnv('ZAALBOTS_STATUS_THREAD_ID', '4');
    expect(groupIds().zaalBotzGroup).toBe(-100321);
    expect(groupIds().researchThread).toBe(4);
  });
  it('is 0 when unset or not a number, never NaN, so `if (!gid)` keeps working', () => {
    vi.stubEnv('ZAAL_BOTZ_GROUP_ID', '');
    vi.stubEnv('ZAALBOTS_GROUP_CHAT_ID', '');
    vi.stubEnv('ZOL_THREAD', 'not-a-number');
    const g = groupIds();
    expect(g.zaalBotzGroup).toBe(0);
    expect(g.zolThread).toBe(0);
    expect(Number.isNaN(g.zolThread)).toBe(false);
  });
  it('resolves at call time, so a value set after import is seen', () => {
    vi.stubEnv('ZAO_GROUP_ID', '');
    expect(groupIds().zaoGroup).toBe(0);
    vi.stubEnv('ZAO_GROUP_ID', '-100999');
    expect(groupIds().zaoGroup).toBe(-100999);
  });
});
