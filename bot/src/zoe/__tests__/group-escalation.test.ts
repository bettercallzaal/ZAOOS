import { describe, it, expect } from 'vitest';
import { detectGroupEscalation } from '../groups';

describe('detectGroupEscalation', () => {
  it('detects tell zaal requests', () => {
    const res = detectGroupEscalation('Please tell Zaal that the soundcheck is at 5pm');
    expect(res.isEscalation).toBe(true);
    expect(res.note).toBe('the soundcheck is at 5pm');
  });

  it('detects mentions followed by tell zaal', () => {
    const res = detectGroupEscalation('@zaoclaw_bot tell Zaal to check Telegram');
    expect(res.isEscalation).toBe(true);
    expect(res.note).toBe('check Telegram');
  });

  it('detects let zaal know', () => {
    const res = detectGroupEscalation('let Zaal know Craig called');
    expect(res.isEscalation).toBe(true);
    expect(res.note).toBe('Craig called');
  });

  it('detects note for zaal', () => {
    const res = detectGroupEscalation('message for Zaal: set times confirmed');
    expect(res.isEscalation).toBe(true);
    expect(res.note).toBe('set times confirmed');
  });

  it('returns false for ordinary questions or group chat', () => {
    expect(detectGroupEscalation('What is The ZAO?').isEscalation).toBe(false);
    expect(detectGroupEscalation('@zaoclaw_bot when is COC Concertz #8?').isEscalation).toBe(false);
    expect(detectGroupEscalation('Can someone send the link?').isEscalation).toBe(false);
  });
});
