/**
 * Calendar reader — fetches and caches the ZAO Luma calendar (ICS format).
 *
 * Source: ZAO Luma calendar at luma.com/zao (public ICS feed, no auth).
 *
 * Design:
 * - Fetches ICS from CALENDAR_ICS_URL env var (defaults to ZAO Luma public feed)
 * - Lightweight custom ICS parser (no heavy dep)
 * - Caches parsed events to ~/.zao/zoe/calendar.json
 * - Refreshes a few times/day; returns upcoming events (next 7-14 days)
 * - No-op gracefully if URL unset or unreachable
 *
 * This is INFORM-ONLY: ZOE tells Zaal about events but does NOT create/modify/RSVP.
 */

import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { ZOE_PATHS } from './memory';

/**
 * Parsed calendar event.
 */
export interface CalendarEvent {
  id: string;           // uid from ICS
  title: string;        // SUMMARY
  start: Date;          // DTSTART parsed
  end: Date;            // DTEND parsed
  location?: string;    // LOCATION (optional)
  url?: string;         // URL (optional)
  description?: string; // DESCRIPTION (optional)
}

/**
 * Cached calendar state: metadata + events.
 */
interface CacheData {
  fetchedAt: string;    // ISO 8601 timestamp
  expiresAt: string;    // When to refresh next
  events: Array<{
    id: string;
    title: string;
    start: string;      // ISO 8601
    end: string;        // ISO 8601
    location?: string;
    url?: string;
    description?: string;
  }>;
}

const CACHE_DIR = join(ZOE_PATHS.home, 'calendar');
const CACHE_FILE = join(CACHE_DIR, 'cache.json');
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // refresh every 6 hours

/**
 * Get the configured calendar ICS URL.
 * Default: ZAO Luma public feed.
 * Unset: returns null (calendar feature disabled).
 */
function getCalendarUrl(): string | null {
  const configured = process.env.CALENDAR_ICS_URL;
  if (configured) return configured;

  // Default to ZAO Luma public ICS feed.
  // luma.com/zao has cal id cal-jPH4al7AMlXzdNN.
  // The public ICS endpoint is: https://lu.ma/event/cal-<ID>/ics
  return 'https://lu.ma/event/cal-jPH4al7AMlXzdNN/ics';
}

/**
 * Lightweight ICS parser. Extracts VEVENT blocks and parses key fields.
 * No external deps. Returns an array of events or [] on parse error.
 */
function parseIcs(icsText: string): Omit<CalendarEvent, 'start' | 'end'>[] {
  const events: Omit<CalendarEvent, 'start' | 'end'>[] = [];

  // Split by VEVENT blocks (simple regex split)
  const veventMatches = icsText.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || [];

  for (const vevent of veventMatches) {
    const event: Omit<CalendarEvent, 'start' | 'end'> = {
      id: '',
      title: '',
    };

    // Extract UID
    const uidMatch = vevent.match(/^UID:(.+?)$/m);
    if (uidMatch) event.id = uidMatch[1].trim();

    // Extract SUMMARY (title)
    const summaryMatch = vevent.match(/^SUMMARY:(.+?)$/m);
    if (summaryMatch) event.title = summaryMatch[1].trim();

    // Extract LOCATION
    const locMatch = vevent.match(/^LOCATION:(.+?)$/m);
    if (locMatch) event.location = locMatch[1].trim();

    // Extract URL
    const urlMatch = vevent.match(/^URL:(.+?)$/m);
    if (urlMatch) event.url = urlMatch[1].trim();

    // Extract DESCRIPTION
    const descMatch = vevent.match(/^DESCRIPTION:(.+?)$/m);
    if (descMatch) event.description = descMatch[1].trim();

    // Only include if we got at least a title
    if (event.title && event.id) {
      events.push(event);
    }
  }

  return events;
}

/**
 * Parse an ICS datetime (DTSTART / DTEND).
 * Handles: 20250714T100000Z, 20250714T100000, 20250714 (all-day).
 */
function parseIcsDate(dtStr: string): Date | null {
  if (!dtStr) return null;

  // Try to parse ISO 8601-ish format
  if (dtStr.includes('T')) {
    // DateTime: 20250714T100000Z or 20250714T100000
    const m = dtStr.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
    if (m) {
      const [, year, month, day, hour, min, sec, isUTC] = m;
      const dateStr = `${year}-${month}-${day}T${hour}:${min}:${sec}${isUTC ? 'Z' : ''}`;
      const d = new Date(dateStr);
      return Number.isFinite(d.getTime()) ? d : null;
    }
  } else {
    // All-day: 20250714 -> treat as midnight UTC
    const m = dtStr.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (m) {
      const [, year, month, day] = m;
      const dateStr = `${year}-${month}-${day}T00:00:00Z`;
      const d = new Date(dateStr);
      return Number.isFinite(d.getTime()) ? d : null;
    }
  }

  return null;
}

/**
 * Fetch and parse the ICS feed. Caches result. Returns upcoming events.
 * Best-effort: returns [] on any error (network, parse, cache).
 */
export async function getCalendarEvents(
  lookaheadDays: number = 14,
  now: number = Date.now(),
): Promise<CalendarEvent[]> {
  const url = getCalendarUrl();
  if (!url) {
    // Calendar feature disabled
    return [];
  }

  try {
    // Check cache first
    const cached = await readCache();
    if (cached && new Date(cached.expiresAt).getTime() > now) {
      // Cache valid
      return eventsFromCache(cached, lookaheadDays, now);
    }

    // Fetch fresh ICS
    const icsText = await fetchIcs(url);
    const events = parseIcs(icsText);

    // Extract start/end datetimes
    const fullEvents: CalendarEvent[] = [];
    const veventMatches = icsText.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || [];
    for (let i = 0; i < events.length; i++) {
      const vevent = veventMatches[i] || '';
      const ev = events[i];

      // Extract DTSTART and DTEND from the raw vevent block
      const startMatch = vevent.match(/^DTSTART(?:;[^:]*)?:(.+?)$/m);
      const endMatch = vevent.match(/^DTEND(?:;[^:]*)?:(.+?)$/m);

      const start = startMatch ? parseIcsDate(startMatch[1].trim()) : null;
      const end = endMatch ? parseIcsDate(endMatch[1].trim()) : null;

      if (start && end) {
        fullEvents.push({
          ...ev,
          start,
          end,
        });
      }
    }

    // Cache the fetched events
    await writeCache({
      fetchedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + CACHE_TTL_MS).toISOString(),
      events: fullEvents.map((e) => ({
        id: e.id,
        title: e.title,
        start: e.start.toISOString(),
        end: e.end.toISOString(),
        location: e.location,
        url: e.url,
        description: e.description,
      })),
    });

    // Return upcoming events
    return filterUpcoming(fullEvents, lookaheadDays, now);
  } catch (err) {
    // Best-effort: log and return empty
    console.warn('[zoe/calendar] fetch/parse failed:', (err as Error).message);
    return [];
  }
}

/**
 * Fetch ICS from the given URL with a timeout.
 */
async function fetchIcs(url: string): Promise<string> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching calendar ICS`);
  }
  const text = await response.text();
  if (!text.includes('BEGIN:VCALENDAR')) {
    throw new Error('Response is not valid ICS (no VCALENDAR)');
  }
  return text;
}

/**
 * Read cached events from disk.
 */
async function readCache(): Promise<CacheData | null> {
  try {
    const data = await fs.readFile(CACHE_FILE, 'utf8');
    const parsed = JSON.parse(data) as CacheData;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Write cached events to disk.
 */
async function writeCache(data: CacheData): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    await fs.writeFile(CACHE_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.warn('[zoe/calendar] cache write failed:', (err as Error).message);
    // Non-fatal; cache misses just mean re-fetch next time
  }
}

/**
 * Extract upcoming events from cached data.
 */
function eventsFromCache(cache: CacheData, lookaheadDays: number, now: number): CalendarEvent[] {
  const events: CalendarEvent[] = cache.events.map((e) => ({
    ...e,
    start: new Date(e.start),
    end: new Date(e.end),
  }));
  return filterUpcoming(events, lookaheadDays, now);
}

/**
 * Filter events to only those starting within the next N days.
 */
function filterUpcoming(events: CalendarEvent[], lookaheadDays: number, now: number): CalendarEvent[] {
  const window = now + lookaheadDays * 24 * 60 * 60 * 1000;
  return events
    .filter((e) => e.start.getTime() >= now && e.start.getTime() <= window)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

/**
 * Format an event for display in briefs/messages.
 */
export function formatEventForBrief(event: CalendarEvent): string {
  const date = event.start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const loc = event.location ? ` @ ${event.location}` : '';
  return `${date}: ${event.title}${loc}`;
}

/**
 * Format Today and Tomorrow events separately for the morning brief.
 * Returns null if no events in the next 2 days.
 */
export function formatTodayTomorrowEvents(events: CalendarEvent[]): string | null {
  const now = new Date();
  const tz = 'America/New_York';

  // Get today and tomorrow midnight in the user's timezone
  const getDateOnly = (d: Date): string => d.toLocaleDateString('en-US', { timeZone: tz }).split('/').reverse().join('-');
  const todayStr = getDateOnly(now);
  const tomorrowDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowStr = getDateOnly(tomorrowDate);

  const todayEvents = events.filter((e) => getDateOnly(e.start) === todayStr);
  const tomorrowEvents = events.filter((e) => getDateOnly(e.start) === tomorrowStr);

  if (todayEvents.length === 0 && tomorrowEvents.length === 0) {
    return null;
  }

  const lines: string[] = [];

  if (todayEvents.length > 0) {
    lines.push('TODAY:');
    for (const event of todayEvents) {
      const time = event.start.toLocaleTimeString('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit' });
      const loc = event.location ? ` @ ${event.location}` : '';
      lines.push(`- ${time}: ${event.title}${loc}`);
    }
  }

  if (tomorrowEvents.length > 0) {
    if (lines.length > 0) lines.push('');
    lines.push('TOMORROW:');
    for (const event of tomorrowEvents) {
      const time = event.start.toLocaleTimeString('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit' });
      const loc = event.location ? ` @ ${event.location}` : '';
      lines.push(`- ${time}: ${event.title}${loc}`);
    }
  }

  return lines.length > 0 ? lines.join('\n') : null;
}
