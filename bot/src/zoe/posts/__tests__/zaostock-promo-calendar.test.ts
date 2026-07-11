import { describe, it, expect } from 'vitest';
import {
  getTodaysZaostockPromoLine,
  ZAOSTOCK_PROMO_CALENDAR_START,
  ZAOSTOCK_PROMO_CALENDAR_END,
  ZAOSTOCK_PROMO_WEEKS,
} from '../zaostock-promo-calendar';

describe('getTodaysZaostockPromoLine', () => {
  it('returns null before the calendar starts', () => {
    expect(getTodaysZaostockPromoLine('2026-07-12')).toBeNull(); // Sunday, day before start
  });

  it('returns null after the calendar ends', () => {
    expect(getTodaysZaostockPromoLine('2026-10-04')).toBeNull();
  });

  it('returns null on Oct 3 itself (festival day, hands off to doc 1030)', () => {
    expect(getTodaysZaostockPromoLine(ZAOSTOCK_PROMO_CALENDAR_END)).toBeNull();
  });

  it('returns null on non-Mon/Wed/Fri days inside the window', () => {
    expect(getTodaysZaostockPromoLine('2026-07-14')).toBeNull(); // Tuesday
    expect(getTodaysZaostockPromoLine('2026-07-16')).toBeNull(); // Thursday
    expect(getTodaysZaostockPromoLine('2026-07-18')).toBeNull(); // Saturday
    expect(getTodaysZaostockPromoLine('2026-07-19')).toBeNull(); // Sunday
  });

  it('returns the week-1 place theme on the opening Monday', () => {
    const line = getTodaysZaostockPromoLine(ZAOSTOCK_PROMO_CALENDAR_START);
    expect(line).toContain('PLACE PHOTO');
    expect(line).toContain('Downtown Ellsworth intro');
  });

  it('returns the week-1 place theme on the opening Friday too', () => {
    const line = getTodaysZaostockPromoLine('2026-07-17');
    expect(line).toContain('PLACE PHOTO');
    expect(line).toContain('Downtown Ellsworth intro');
  });

  it('returns the artist/event track on Wednesday', () => {
    const line = getTodaysZaostockPromoLine('2026-07-15');
    expect(line).toContain('ARTIST/EVENT TRACK');
    expect(line).toContain('ZAOstock explainer post');
  });

  it('advances to week 3 (Fellenz) on its Wednesday', () => {
    const line = getTodaysZaostockPromoLine('2026-07-29');
    expect(line).toContain('Fellenz');
  });

  it('lands on the final week (countdown) for the last scheduled Friday before Oct 3', () => {
    const line = getTodaysZaostockPromoLine('2026-10-02'); // Friday of week 12
    expect(line).toContain('Countdown week');
  });

  it('covers all 12 weeks from doc 1033', () => {
    expect(ZAOSTOCK_PROMO_WEEKS).toHaveLength(12);
  });
});
