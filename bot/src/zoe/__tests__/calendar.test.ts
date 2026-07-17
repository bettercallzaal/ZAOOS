// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatEventForBrief, formatTodayTomorrowEvents, type CalendarEvent } from '../calendar';

function makeEvent(startIso: string, title: string, location?: string): CalendarEvent {
  return {
    id: title,
    title,
    start: new Date(startIso),
    end: new Date(startIso),
    location,
  };
}

// ── formatEventForBrief ───────────────────────────────────────────────────────

describe('formatEventForBrief', () => {
  it('includes the event title in the output', () => {
    const event = makeEvent('2026-07-17T18:00:00Z', 'ZAO Community Call');
    expect(formatEventForBrief(event)).toContain('ZAO Community Call');
  });

  it('appends " @ location" when location is provided', () => {
    const event = makeEvent('2026-07-17T18:00:00Z', 'ZAO IRL Event', 'Miami');
    const result = formatEventForBrief(event);
    expect(result).toContain('ZAO IRL Event');
    expect(result).toContain('@ Miami');
  });

  it('omits the location suffix when location is undefined', () => {
    const event = makeEvent('2026-07-17T18:00:00Z', 'ZAO Call');
    expect(formatEventForBrief(event)).not.toContain('@');
  });

  it('includes a date/time portion before the title', () => {
    const event = makeEvent('2026-07-17T18:00:00Z', 'ZAO Drop');
    const result = formatEventForBrief(event);
    // Format is "<date/time>: <title>" — colon + space before title
    const colonIdx = result.indexOf(':');
    const titleIdx = result.indexOf('ZAO Drop');
    expect(colonIdx).toBeGreaterThanOrEqual(0);
    expect(titleIdx).toBeGreaterThan(colonIdx);
  });
});

// ── formatTodayTomorrowEvents ─────────────────────────────────────────────────

describe('formatTodayTomorrowEvents', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // 2026-07-17 10:00 AM EDT (14:00 UTC) — a Friday
    vi.setSystemTime(new Date('2026-07-17T14:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('returns null for an empty array', () => {
    expect(formatTodayTomorrowEvents([])).toBeNull();
  });

  it('returns null when events are neither today nor tomorrow in NY time', () => {
    // 2026-07-20 = 3 days away
    const futureEvent = makeEvent('2026-07-20T18:00:00Z', 'Future Thing');
    expect(formatTodayTomorrowEvents([futureEvent])).toBeNull();
  });

  it('includes TODAY section when there is an event on July 17 in NY time', () => {
    // 2026-07-17T18:00:00Z = 2:00 PM EDT = today
    const todayEvent = makeEvent('2026-07-17T18:00:00Z', 'ZAO Show');
    const result = formatTodayTomorrowEvents([todayEvent]);
    expect(result).toContain('TODAY:');
    expect(result).toContain('ZAO Show');
  });

  it('includes TOMORROW section when there is an event on July 18 in NY time', () => {
    // 2026-07-18T18:00:00Z = 2:00 PM EDT = tomorrow
    const tomorrowEvent = makeEvent('2026-07-18T18:00:00Z', 'ZAO Post-Show Recap');
    const result = formatTodayTomorrowEvents([tomorrowEvent]);
    expect(result).toContain('TOMORROW:');
    expect(result).toContain('ZAO Post-Show Recap');
  });

  it('includes both sections with a blank line separator when events span both days', () => {
    const today = makeEvent('2026-07-17T18:00:00Z', 'Day Event');
    const tomorrow = makeEvent('2026-07-18T18:00:00Z', 'Next Day Event');
    const result = formatTodayTomorrowEvents([today, tomorrow]) ?? '';
    expect(result).toContain('TODAY:');
    expect(result).toContain('TOMORROW:');
    expect(result).toContain('\n\n');
  });

  it('includes location when an event has one', () => {
    const today = makeEvent('2026-07-17T18:00:00Z', 'COC #7', 'Brooklyn, NY');
    const result = formatTodayTomorrowEvents([today]) ?? '';
    expect(result).toContain('@ Brooklyn, NY');
  });

  it('lists multiple events on the same day', () => {
    const e1 = makeEvent('2026-07-17T16:00:00Z', 'Morning Session');
    const e2 = makeEvent('2026-07-17T22:00:00Z', 'Evening Show');
    const result = formatTodayTomorrowEvents([e1, e2]) ?? '';
    expect(result).toContain('Morning Session');
    expect(result).toContain('Evening Show');
  });
});
