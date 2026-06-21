import { describe, it, expect, afterEach } from 'vitest';
import { getZaalDmId } from '../group';

// First unit coverage for the ZAOstock bot. getZaalDmId is the linchpin of the
// "DM Zaal instead of pinging the group" reroute (doc 869 / PR #881): if it
// returns null, proactive pings are dropped rather than sent to the group.
describe('getZaalDmId', () => {
  afterEach(() => {
    delete process.env.ZAAL_TELEGRAM_ID;
  });

  it('returns the numeric id when ZAAL_TELEGRAM_ID is a valid number', () => {
    process.env.ZAAL_TELEGRAM_ID = '12345678';
    expect(getZaalDmId()).toBe(12345678);
  });

  it('returns null when unset (ping is dropped, never sent to the group)', () => {
    delete process.env.ZAAL_TELEGRAM_ID;
    expect(getZaalDmId()).toBeNull();
  });

  it('returns null for an empty string', () => {
    process.env.ZAAL_TELEGRAM_ID = '';
    expect(getZaalDmId()).toBeNull();
  });

  it('returns null for a non-numeric value', () => {
    process.env.ZAAL_TELEGRAM_ID = 'not-a-number';
    expect(getZaalDmId()).toBeNull();
  });

  it('returns null for 0 (not a real chat id)', () => {
    process.env.ZAAL_TELEGRAM_ID = '0';
    expect(getZaalDmId()).toBeNull();
  });

  it('handles negative ids (Telegram group/channel ids can be negative)', () => {
    process.env.ZAAL_TELEGRAM_ID = '-1001234567890';
    expect(getZaalDmId()).toBe(-1001234567890);
  });
});
