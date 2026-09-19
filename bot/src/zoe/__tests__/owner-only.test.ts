// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { OWNER_ONLY_LINE, OWNER_ONLY_WINDOW_MS, newOwnerOnlyState, shouldSendOwnerOnlyLine } from '../owner-only';

describe('owner-only line', () => {
  it('is plain, names Zaal, and carries no jargon', () => {
    expect(OWNER_ONLY_LINE).toBe("That one is Zaal's.");
    expect(OWNER_ONLY_LINE).not.toMatch(/admin|permission|unauthori[sz]ed|owner/i);
  });
  it('sends once per user, then silence inside the hour', () => {
    const st = newOwnerOnlyState();
    expect(shouldSendOwnerOnlyLine(st, 7, 1_000)).toBe(true);
    expect(shouldSendOwnerOnlyLine(st, 7, 1_000 + OWNER_ONLY_WINDOW_MS - 1)).toBe(false);
    expect(shouldSendOwnerOnlyLine(st, 7, 1_000 + OWNER_ONLY_WINDOW_MS)).toBe(true);
  });
  it('one user cannot silence another', () => {
    const st = newOwnerOnlyState();
    expect(shouldSendOwnerOnlyLine(st, 7, 1_000)).toBe(true);
    expect(shouldSendOwnerOnlyLine(st, 8, 1_001)).toBe(true);
  });
  it('forgets users outside the window so the map does not grow forever', () => {
    const st = newOwnerOnlyState();
    for (let i = 0; i < 50; i++) shouldSendOwnerOnlyLine(st, i, 0);
    shouldSendOwnerOnlyLine(st, 999, OWNER_ONLY_WINDOW_MS + 1);
    expect(st.lastSent.size).toBe(1);
  });
});
