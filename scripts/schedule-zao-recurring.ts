/**
 * Pre-create Juke spaces for ZAO's recurring weekly events.
 *
 * Reads `scripts/zao-recurring-events.json` for the list of events (title +
 * weekday + local time + announce-cast). For each event, computes every
 * upcoming occurrence in the next N days (default 14), checks `juke_spaces`
 * for an already-scheduled row within +/- 30 minutes of that occurrence, and
 * POSTs `/api/juke/space` (admin-or-password path) to mint the room if it is
 * missing.
 *
 * Idempotent by intent: re-running on the same day skips already-scheduled
 * occurrences and only fills the gaps. Safe to wire into a weekly cron.
 *
 * Usage:
 *
 *   npx tsx scripts/schedule-zao-recurring.ts --dry-run
 *   ZAO_BASE_URL=https://zaoos.com npx tsx scripts/schedule-zao-recurring.ts
 *   npx tsx scripts/schedule-zao-recurring.ts --days 7
 *
 * Env:
 *   ZAO_BASE_URL          (default: http://localhost:3000)
 *   JUKE_CREATE_PASSWORD  (required unless ZAO_ADMIN_COOKIE is set)
 *   ZAO_ADMIN_COOKIE      (optional - full Cookie header for an admin session)
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
import * as fs from 'fs';
import * as path from 'path';

interface EventConfig {
  id: string;
  title: string;
  weekday: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  time: string;
  announce_cast?: boolean;
  notes?: string;
}

interface RecurringConfig {
  timezone: string;
  events: EventConfig[];
}

interface JukeSpaceRow {
  id: string;
  title: string;
  status: 'scheduled' | 'active' | 'ended';
  scheduled_at: string | null;
}

const WEEKDAY_INDEX: Record<EventConfig['weekday'], number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const DEDUPE_WINDOW_MS = 30 * 60 * 1000;

function loadConfig(): RecurringConfig {
  const file = path.join(process.cwd(), 'scripts', 'zao-recurring-events.json');
  return JSON.parse(fs.readFileSync(file, 'utf8')) as RecurringConfig;
}

function loadEnv(): Record<string, string> {
  const out = { ...process.env } as Record<string, string>;
  const file = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m && !out[m[1].trim()]) out[m[1].trim()] = m[2].trim();
  }
  return out;
}

/** Minutes east of UTC for `tz` at `d`. */
function tzOffsetMinutes(d: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(d);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const tzDate = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return Math.round((tzDate - d.getTime()) / 60_000);
}

function computeOccurrences(event: EventConfig, tz: string, days: number, now: Date): string[] {
  const out: string[] = [];
  const [hhStr, mmStr] = event.time.split(':');
  const hour = Number(hhStr);
  const minute = Number(mmStr);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    throw new Error(`Bad time on event ${event.id}: ${event.time}`);
  }
  const targetWeekday = WEEKDAY_INDEX[event.weekday];
  const weekdayShortIndex: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  for (let dayOffset = 0; dayOffset <= days; dayOffset++) {
    const candidate = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    const localParts = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short',
    }).formatToParts(candidate);
    const localYear = Number(localParts.find((p) => p.type === 'year')?.value);
    const localMonth = Number(localParts.find((p) => p.type === 'month')?.value);
    const localDay = Number(localParts.find((p) => p.type === 'day')?.value);
    const localWeekdayShort = localParts.find((p) => p.type === 'weekday')?.value ?? '';
    if (weekdayShortIndex[localWeekdayShort] !== targetWeekday) continue;
    const guess = new Date(Date.UTC(localYear, localMonth - 1, localDay, hour, minute, 0, 0));
    const actual = new Date(guess.getTime() - tzOffsetMinutes(guess, tz) * 60_000);
    if (actual.getTime() <= now.getTime()) continue;
    out.push(actual.toISOString());
  }
  return out;
}

async function fetchExistingScheduled(supabaseUrl: string, anon: string): Promise<JukeSpaceRow[]> {
  const url = `${supabaseUrl}/rest/v1/juke_spaces?select=id,title,status,scheduled_at&status=eq.scheduled`;
  const res = await fetch(url, { headers: { apikey: anon, Authorization: `Bearer ${anon}` } });
  if (!res.ok) throw new Error(`Supabase fetch failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as JukeSpaceRow[];
}

interface PlanItem {
  eventId: string;
  title: string;
  scheduledAt: string;
  announceCast: boolean;
  exists: boolean;
  existingId?: string;
}

function buildPlan(config: RecurringConfig, existing: JukeSpaceRow[], days: number, now: Date): PlanItem[] {
  const out: PlanItem[] = [];
  for (const ev of config.events) {
    for (const occ of computeOccurrences(ev, config.timezone, days, now)) {
      const occTs = new Date(occ).getTime();
      const match = existing.find(
        (r) => r.title === ev.title && r.scheduled_at !== null &&
          Math.abs(new Date(r.scheduled_at).getTime() - occTs) <= DEDUPE_WINDOW_MS,
      );
      out.push({
        eventId: ev.id,
        title: ev.title,
        scheduledAt: occ,
        announceCast: !!ev.announce_cast,
        exists: !!match,
        existingId: match?.id,
      });
    }
  }
  return out;
}

async function createSpace(
  baseUrl: string,
  body: { title: string; scheduledAt: string; announceCast: boolean; password?: string },
  cookie: string | undefined,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(`${baseUrl}/api/juke/space`, {
    method: 'POST', headers, body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !(json as { success?: boolean }).success) {
    return { ok: false, error: (json as { error?: string }).error ?? `HTTP ${res.status}` };
  }
  return { ok: true, id: (json as { data?: { id?: string } }).data?.id };
}

async function main(): Promise<void> {
  const env = loadEnv();
  const baseUrl = env.ZAO_BASE_URL ?? 'http://localhost:3000';
  const password = env.JUKE_CREATE_PASSWORD;
  const cookie = env.ZAO_ADMIN_COOKIE;
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const daysArg = process.argv.findIndex((a) => a === '--days');
  const days = daysArg >= 0 ? Number(process.argv[daysArg + 1]) || 14 : 14;
  const dryRun = process.argv.includes('--dry-run');

  if (!supabaseUrl || !anon) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.');
    process.exit(1);
  }
  if (!cookie && !password) {
    console.error('Need ZAO_ADMIN_COOKIE or JUKE_CREATE_PASSWORD.');
    process.exit(1);
  }

  const config = loadConfig();
  console.log(`Loaded ${config.events.length} event(s). Window: ${days}d from ${new Date().toISOString()}.`);
  console.log(`Target: ${baseUrl}.${dryRun ? ' DRY RUN.' : ''}`);

  const existing = await fetchExistingScheduled(supabaseUrl, anon);
  console.log(`Existing scheduled rows: ${existing.length}.`);

  const plan = buildPlan(config, existing, days, new Date());
  let created = 0, skipped = 0, failed = 0;

  for (const item of plan) {
    const when = new Date(item.scheduledAt).toLocaleString('en-US', { timeZone: config.timezone });
    if (item.exists) {
      console.log(`[SKIP]   ${item.title} @ ${when} - exists ${item.existingId}`);
      skipped++; continue;
    }
    if (dryRun) {
      console.log(`[PLAN]   ${item.title} @ ${when}`);
      continue;
    }
    const res = await createSpace(baseUrl, {
      title: item.title, scheduledAt: item.scheduledAt, announceCast: item.announceCast, password,
    }, cookie);
    if (res.ok) {
      console.log(`[CREATE] ${item.title} @ ${when} -> ${res.id}`);
      created++;
    } else {
      console.error(`[FAIL]   ${item.title} @ ${when}: ${res.error}`);
      failed++;
    }
  }

  console.log(`\nDone. created=${created} skipped=${skipped} failed=${failed} plan=${plan.length}`);
  if (failed > 0) process.exit(1);
}

main().catch((err: unknown) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
