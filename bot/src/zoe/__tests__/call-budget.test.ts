import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { checkAndRecordZoeCall, zoeCallsToday, _resetCallBudget } from '../call-budget';

describe('call-budget (ZOE 50/day cap)', () => {
  beforeEach(() => {
    _resetCallBudget();
    delete process.env.ZOE_DAILY_CALL_CAP;
    delete process.env.ZOE_CALL_CAP_ENFORCE;
  });
  afterEach(() => {
    delete process.env.ZOE_DAILY_CALL_CAP;
    delete process.env.ZOE_CALL_CAP_ENFORCE;
  });

  it('counts calls and stays under the default cap of 50', () => {
    for (let i = 0; i < 50; i++) {
      const r = checkAndRecordZoeCall();
      expect(r.allowed).toBe(true);
      expect(r.warn).toBe(false);
    }
    expect(zoeCallsToday()).toEqual({ count: 50, cap: 50 });
  });

  it('warns (but still allows) once the cap is crossed, by default', () => {
    process.env.ZOE_DAILY_CALL_CAP = '3';
    checkAndRecordZoeCall(); // 1
    checkAndRecordZoeCall(); // 2
    const atCap = checkAndRecordZoeCall(); // 3 == cap, not over yet
    expect(atCap.warn).toBe(false);

    const over = checkAndRecordZoeCall(); // 4 > cap
    expect(over.allowed).toBe(true);
    expect(over.warn).toBe(true);
    expect(over.justCrossed).toBe(true);
    expect(over.count).toBe(4);

    const stillOver = checkAndRecordZoeCall(); // 5
    expect(stillOver.warn).toBe(true);
    expect(stillOver.justCrossed).toBe(false); // only the first crossing flags
  });

  it('soft-blocks past the cap when ZOE_CALL_CAP_ENFORCE=block (and does not count blocked calls)', () => {
    process.env.ZOE_DAILY_CALL_CAP = '2';
    process.env.ZOE_CALL_CAP_ENFORCE = 'block';
    expect(checkAndRecordZoeCall().allowed).toBe(true); // 1
    expect(checkAndRecordZoeCall().allowed).toBe(true); // 2 == cap
    const blocked = checkAndRecordZoeCall(); // would be 3 > cap
    expect(blocked.allowed).toBe(false);
    expect(blocked.warn).toBe(true);
    expect(blocked.count).toBe(2); // not incremented while blocked
    // still blocked on subsequent attempts
    expect(checkAndRecordZoeCall().allowed).toBe(false);
    expect(zoeCallsToday().count).toBe(2);
  });

  it('respects a custom cap via ZOE_DAILY_CALL_CAP', () => {
    process.env.ZOE_DAILY_CALL_CAP = '1';
    expect(checkAndRecordZoeCall()).toMatchObject({ allowed: true, warn: false, count: 1, cap: 1 });
    expect(checkAndRecordZoeCall()).toMatchObject({ allowed: true, warn: true, justCrossed: true, count: 2 });
  });

  it('falls back to the default cap when the env value is invalid', () => {
    process.env.ZOE_DAILY_CALL_CAP = 'not-a-number';
    expect(checkAndRecordZoeCall().cap).toBe(50);
  });
});
