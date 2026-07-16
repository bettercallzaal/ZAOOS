/**
 * events.ts - proactive EVENT candidates for ZOE's reasoning tick.
 *
 * The point: ZOE leads Zaal. Instead of waiting to be asked, each tick this
 * detects notable things that happened across Zaal's work and surfaces them as
 * TAGGED candidates ([SHIPPED], [STALE PR], [CI FAIL], ...). They flow through
 * the same pickBest + threshold gate as everything else (proactive.ts), so only
 * the genuinely-important ones actually ping - routine churn stays silent.
 *
 * Dedup: a seen-events file (~/.zao/zoe/seen-events.json) keyed per event so the
 * same thing never pings twice (merged once ever; stale/ci once per day).
 *
 * v1 source: GitHub PRs across ALL Zaal's repos (gh authed as bettercallzaal).
 * Extensible: add graph-decision / stale-relationship sources the same way -
 * return Candidate[] and they compete in the gate.
 */
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { ZOE_PATHS } from './memory';
import type { Candidate } from './proactive';
import { graphTopicAgeDays } from './recall';

const execFileP = promisify(execFile);
const SEEN_FILE = join(ZOE_PATHS.home, 'seen-events.json');
// Only nudge PRs in the ACTIONABLE window: stuck a few days (worth a poke) but
// not abandoned (older = not a nudge target, just noise). Tuned down from 48h
// after a first run surfaced 12 stale PRs including dead repos.
const STALE_PR_MIN_HOURS = 96; // stuck 4+ days = worth surfacing
const STALE_PR_MAX_DAYS = 21; // older than this = abandoned, do not nag
const SEEN_TTL_MS = 14 * 24 * 60 * 60 * 1000; // forget event keys after 2 weeks

interface SearchPr {
  number: number;
  title: string;
  url: string;
  createdAt?: string;
  updatedAt?: string;
  repository?: { name?: string; nameWithOwner?: string };
}

async function readSeen(): Promise<Record<string, number>> {
  try {
    const raw = await fs.readFile(SEEN_FILE, 'utf8');
    const obj = JSON.parse(raw) as Record<string, number>;
    return obj && typeof obj === 'object' ? obj : {};
  } catch {
    return {};
  }
}

async function writeSeen(seen: Record<string, number>): Promise<void> {
  // prune old keys so the file stays small
  const cutoff = Date.now() - SEEN_TTL_MS;
  const pruned: Record<string, number> = {};
  for (const [k, ts] of Object.entries(seen)) if (ts >= cutoff) pruned[k] = ts;
  await fs.mkdir(ZOE_PATHS.home, { recursive: true });
  await fs.writeFile(SEEN_FILE, JSON.stringify(pruned, null, 2), 'utf8');
}

function repoName(pr: SearchPr): string {
  return pr.repository?.name ?? pr.repository?.nameWithOwner ?? 'repo';
}

/**
 * Detect notable GitHub events across Zaal's open PRs and return tagged
 * candidates. Best-effort: never throws (a gh failure -> []). Dedupes so a given
 * event only pings once per its window.
 */
export async function gatherEventCandidates(now: number = Date.now()): Promise<Candidate[]> {
  let prs: SearchPr[] = [];
  try {
    const { stdout } = await execFileP(
      'gh',
      [
        'search', 'prs',
        '--author=bettercallzaal',
        '--state=open',
        '--limit=30',
        '--json', 'number,title,url,createdAt,updatedAt,repository',
      ],
      { timeout: 12_000, encoding: 'utf8' },
    );
    prs = JSON.parse(stdout) as SearchPr[];
  } catch {
    return []; // gh missing / rate-limited / offline - stay silent, no crash
  }

  const seen = await readSeen();
  const today = new Date(now).toISOString().slice(0, 10);
  const out: Candidate[] = [];

  for (const pr of prs) {
    const updated = pr.updatedAt ? Date.parse(pr.updatedAt) : NaN;
    if (!Number.isFinite(updated)) continue;
    const ageHrs = (now - updated) / 3_600_000;
    if (ageHrs < STALE_PR_MIN_HOURS) continue; // not stuck long enough yet
    if (ageHrs / 24 > STALE_PR_MAX_DAYS) continue; // abandoned, not a nudge target

    // once per day per PR so a long-stale PR doesn't nag every hour
    const key = `stale:${repoName(pr)}#${pr.number}:${today}`;
    if (seen[key]) continue;
    seen[key] = now;

    const days = Math.floor(ageHrs / 24);
    out.push({
      kind: 'github-event',
      score: 0.65, // actionable: clears the 0.6 bar, but a due commitment still outranks
      tier: 'standard',
      message: `[STALE PR] ${repoName(pr)} #${pr.number} has sat ${days}d with no movement: "${pr.title}". Merge it, close it, or want me to look?`,
    });
  }

  // [CI FAIL] - a red build is high-signal + actionable. Check CI on the most
  // recently-updated open PRs (capped, bounded gh calls per tick). Best-effort.
  for (const pr of prs.slice(0, CI_CHECK_LIMIT)) {
    const slug = pr.repository?.nameWithOwner;
    if (!slug) continue;
    const key = `cifail:${repoName(pr)}#${pr.number}:${today}`;
    if (seen[key]) continue; // once per day per PR
    const failing = await ciIsFailing(slug, pr.number);
    if (!failing) continue;
    seen[key] = now;
    out.push({
      kind: 'github-event',
      score: 0.82, // a broken build outranks a stale PR + most nudges
      tier: 'critical',
      message: `[CI FAIL] ${repoName(pr)} #${pr.number} has failing checks: "${pr.title}". Want me to look at what broke?`,
    });
  }

  if (out.length > 0) await writeSeen(seen);
  return out;
}

const CI_CHECK_LIMIT = 8; // bound the per-tick gh calls

/** True iff the PR's check rollup contains a FAILURE/ERROR. Best-effort. */
async function ciIsFailing(repoSlug: string, num: number): Promise<boolean> {
  try {
    const { stdout } = await execFileP(
      'gh',
      ['pr', 'view', String(num), '--repo', repoSlug, '--json', 'statusCheckRollup'],
      { timeout: 10_000, encoding: 'utf8' },
    );
    const data = JSON.parse(stdout) as {
      statusCheckRollup?: Array<{ conclusion?: string; state?: string }>;
    };
    const checks = data.statusCheckRollup ?? [];
    return checks.some((c) => {
      const v = (c.conclusion ?? c.state ?? '').toUpperCase();
      return v === 'FAILURE' || v === 'ERROR' || v === 'TIMED_OUT';
    });
  } catch {
    return false; // gh failure / no checks -> not failing, stay silent
  }
}

// ---- graph-staleness nudges (doc 859) --------------------------------------
// ZOE watches Zaal's active fronts and pings when one goes COLD in the graph
// (no new episode in GRAPH_STALE_DAYS). Edit this list to change what she watches.
// 'farscout' watches the Farcaster research scout's own graph output - if it
// goes cold (>GRAPH_STALE_DAYS with no new finding), the bot likely went down.
const WATCH_TOPICS = ['ZAOstock', 'WaveWarZ', 'ZABAL Games', 'Brazil network', 'ZAO Festivals', 'farscout'];
const GRAPH_STALE_DAYS = 10;

/**
 * Detect the coldest watched topic in the graph and surface a single tagged
 * nudge. Daily-gated (one full check per day) so the 5 /delve calls don't run
 * every tick, and deduped per topic per day. Best-effort: never throws.
 */
export async function gatherGraphCandidates(now: number = Date.now()): Promise<Candidate[]> {
  const seen = await readSeen();
  const today = new Date(now).toISOString().slice(0, 10);

  // Daily gate: only run the graph sweep once per day.
  if (seen[`graphcheck:${today}`]) return [];

  let coldest: { topic: string; days: number } | null = null;
  for (const topic of WATCH_TOPICS) {
    let days: number | null = null;
    try {
      days = await graphTopicAgeDays(topic, now);
    } catch {
      days = null;
    }
    if (days == null || days < GRAPH_STALE_DAYS) continue;
    if (!coldest || days > coldest.days) coldest = { topic, days };
  }

  seen[`graphcheck:${today}`] = now; // mark the sweep done for today regardless
  await writeSeen(seen);

  if (!coldest) return [];
  return [
    {
      kind: 'graph-event',
      score: 0.62, // clears the 0.6 bar but a due commitment/CI-fail outranks
      tier: 'signal',
      message: `[GRAPH] Nothing new on "${coldest.topic}" in the graph for ${coldest.days}d. Still active, or want to log an update?`,
    },
  ];
}

// ---- inactivity check-in ---------------------------------------------------

const LAST_SEEN_FILE = join(ZOE_PATHS.home, 'last-seen.txt');
const INACTIVITY_HOURS = 4; // silent for 4h during the day → soft check-in

/**
 * Write a last-seen timestamp when Zaal sends a DM. Called by the message
 * handler in index.ts so inactivity detection knows he was active.
 */
export async function touchLastSeen(now: number = Date.now()): Promise<void> {
  await fs.mkdir(ZOE_PATHS.home, { recursive: true });
  await fs.writeFile(LAST_SEEN_FILE, String(now), 'utf8');
}

/**
 * Surface a soft check-in if Zaal has been silent for INACTIVITY_HOURS during
 * waking hours (9am-9pm EDT). Once per day, lowest score that still clears the
 * default threshold. Best-effort: never throws.
 */
export async function gatherInactivityCandidates(now: number = Date.now()): Promise<Candidate[]> {
  // Waking hours: 9am-9pm EDT (UTC-4 summer) = 13:00-01:00 UTC.
  const hourUtc = new Date(now).getUTCHours();
  if (hourUtc < 13 && hourUtc >= 1) return []; // not daytime EDT

  let lastSeen: number;
  try {
    const raw = await fs.readFile(LAST_SEEN_FILE, 'utf8');
    lastSeen = Number(raw.trim());
    if (!Number.isFinite(lastSeen)) return [];
  } catch {
    return []; // no file yet → skip
  }

  const silentHrs = (now - lastSeen) / 3_600_000;
  if (silentHrs < INACTIVITY_HOURS) return [];

  // Once per day dedup
  const seen = await readSeen();
  const today = new Date(now).toISOString().slice(0, 10);
  const key = `inactivity:${today}`;
  if (seen[key]) return [];
  seen[key] = now;
  await writeSeen(seen);

  const hrs = Math.floor(silentHrs);
  return [
    {
      kind: 'inactivity',
      score: 0.62, // just clears the 0.6 bar — lowest interrupt priority
      tier: 'signal',
      message: `You've been quiet for ${hrs}h. Everything on track, or anything stuck?`,
    },
  ];
}

// ---- calendar nudges -------------------------------------------------------

const ZAO_PRIVATE_DIR = join(ZOE_PATHS.home, '..', 'private');
const GCAL_FILE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // skip stale dumps (>24h old)
const CALENDAR_LOOKAHEAD_MS = 2 * 60 * 60 * 1000;  // events starting within 2h

interface GCalEvent {
  id?: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
}

/**
 * Surface calendar events starting within 2 hours. Reads from:
 * 1. Most recent gcal-*.json dump in ~/.zao/private/ (Google Calendar exports)
 * 2. ZOE's calendar reader (ZAO Luma ICS feed via calendar.ts)
 *
 * Skips stale files (>24h). Scores at 0.72 (time-sensitive: outranks stale PR,
 * beaten by overdue commitment thread). Best-effort: never throws.
 */
export async function gatherCalendarCandidates(now: number = Date.now()): Promise<Candidate[]> {
  const seen = await readSeen();
  const windowEnd = now + CALENDAR_LOOKAHEAD_MS;
  const out: Candidate[] = [];

  // Check Google Calendar exports (from ~/.zao/private/gcal-*.json)
  let gcalFiles: string[] = [];
  try {
    const entries = await fs.readdir(ZAO_PRIVATE_DIR);
    gcalFiles = entries.filter((f) => f.startsWith('gcal-') && f.endsWith('.json')).sort();
  } catch {
    // no private dir yet — continue with ZOE calendar
  }

  if (gcalFiles.length > 0) {
    const latestPath = join(ZAO_PRIVATE_DIR, gcalFiles[gcalFiles.length - 1]);
    try {
      const stat = await fs.stat(latestPath);
      if (now - stat.mtimeMs <= GCAL_FILE_MAX_AGE_MS) {
        // not stale — process it
        let events: GCalEvent[] = [];
        try {
          const raw = await fs.readFile(latestPath, 'utf8');
          const data = JSON.parse(raw) as GCalEvent[] | { items?: GCalEvent[]; events?: GCalEvent[] };
          events = Array.isArray(data) ? data : (data.items ?? data.events ?? []);
        } catch {
          // parse error — continue to ZOE calendar
        }

        for (const ev of events) {
          const startStr = ev.start?.dateTime ?? ev.start?.date;
          if (!startStr) continue;
          const start = Date.parse(startStr);
          if (!Number.isFinite(start) || start < now || start > windowEnd) continue;

          const key = `calendar:${ev.id ?? ev.summary}:${new Date(start).toISOString().slice(0, 10)}`;
          if (seen[key]) continue;
          seen[key] = now;

          const minsAway = Math.round((start - now) / 60_000);
          out.push({
            kind: 'calendar',
            score: 0.72,
            tier: 'standard',
            message: `[CALENDAR] "${ev.summary ?? 'Event'}" in ${minsAway}m. Anything to prep?`,
          });
        }
      }
    } catch {
      // stat failed — continue to ZOE calendar
    }
  }

  // Check ZOE's calendar (ZAO Luma ICS feed via calendar.ts)
  try {
    const { getCalendarEvents } = await import('./calendar');
    const zoeEvents = await getCalendarEvents(1); // 1-day lookahead for reminders
    for (const ev of zoeEvents) {
      if (ev.start.getTime() < now || ev.start.getTime() > windowEnd) continue;

      const key = `calendar-zoe:${ev.id}:${ev.start.toISOString().slice(0, 10)}`;
      if (seen[key]) continue;
      seen[key] = now;

      const minsAway = Math.round((ev.start.getTime() - now) / 60_000);
      out.push({
        kind: 'calendar',
        score: 0.72,
        tier: 'standard',
        message: `[CALENDAR] "${ev.title}" in ${minsAway}m${ev.location ? ` @ ${ev.location}` : ''}. Anything to prep?`,
      });
    }
  } catch (err) {
    // calendar.ts import or fetch failed — best-effort, continue anyway
    console.warn('[zoe/events] ZOE calendar check failed (nbd):', (err as Error).message);
  }

  if (out.length > 0) await writeSeen(seen);
  return out;
}
