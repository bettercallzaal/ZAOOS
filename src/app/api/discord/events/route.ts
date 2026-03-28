import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';

/**
 * Day-of-week helpers for calculating next occurrence.
 */
const DAY_MAP: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

function getNextOccurrence(dayOfWeek: string, time: string, timezone: string): Date {
  const targetDay = DAY_MAP[dayOfWeek.toLowerCase()] ?? 0;
  const now = new Date();

  // Parse the time string (e.g. "14:00", "2:00 PM")
  let hours = 0;
  let minutes = 0;
  const timeParts = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (timeParts) {
    hours = parseInt(timeParts[1], 10);
    minutes = parseInt(timeParts[2], 10);
    if (timeParts[3]) {
      const meridiem = timeParts[3].toUpperCase();
      if (meridiem === 'PM' && hours !== 12) hours += 12;
      if (meridiem === 'AM' && hours === 12) hours = 0;
    }
  }

  // Build a date string in the target timezone to figure out "today" in that tz
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone || 'America/New_York',
    weekday: 'long',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '';
  const currentDayName = getPart('weekday').toLowerCase();
  const currentDay = DAY_MAP[currentDayName] ?? now.getDay();

  let daysUntil = targetDay - currentDay;
  if (daysUntil < 0) daysUntil += 7;

  // If it's today, check if the time has passed
  if (daysUntil === 0) {
    const currentHour = parseInt(getPart('hour'), 10);
    const currentMinute = parseInt(getPart('minute'), 10);
    if (currentHour > hours || (currentHour === hours && currentMinute >= minutes)) {
      daysUntil = 7; // Next week
    }
  }

  const nextDate = new Date(now.getTime() + daysUntil * 24 * 60 * 60 * 1000);
  // Set to the target time (approximate — good enough for countdown display)
  nextDate.setHours(hours, minutes, 0, 0);

  return nextDate;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Now';
  const totalMinutes = Math.floor(ms / 60000);
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * GET /api/discord/events
 * Returns all scheduled discord events with next occurrence + countdown.
 */
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data: events, error } = await supabase
      .from('discord_events')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[discord/events] Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    const now = new Date();

    const enriched = (events || []).map((evt) => {
      const nextOccurrence = getNextOccurrence(
        evt.day_of_week || 'monday',
        evt.time || '12:00',
        evt.timezone || 'America/New_York'
      );
      const msUntil = nextOccurrence.getTime() - now.getTime();
      const isToday = msUntil >= 0 && msUntil < 24 * 60 * 60 * 1000;
      const isWithin24h = msUntil >= 0 && msUntil < 24 * 60 * 60 * 1000;

      // Reminder markers
      const reminders = {
        within24h: msUntil > 0 && msUntil <= 24 * 60 * 60 * 1000,
        within6h: msUntil > 0 && msUntil <= 6 * 60 * 60 * 1000,
        within1h: msUntil > 0 && msUntil <= 60 * 60 * 1000,
      };

      return {
        ...evt,
        next_occurrence: nextOccurrence.toISOString(),
        countdown: formatCountdown(msUntil),
        countdown_ms: msUntil,
        is_today: isToday,
        is_within_24h: isWithin24h,
        reminders,
      };
    });

    // Sort by next occurrence
    enriched.sort((a, b) => a.countdown_ms - b.countdown_ms);

    return NextResponse.json({ events: enriched });
  } catch (err) {
    console.error('[discord/events] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
