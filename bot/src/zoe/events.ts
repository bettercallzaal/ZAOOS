/**
 * events.ts — proactive EVENT candidates for ZOE's reasoning tick.
 *
 * The point: ZOE leads Zaal. Instead of waiting to be asked, each tick this
 * detects notable things that happened across Zaal's work and surfaces them as
 * TAGGED candidates ([SHIPPED], [STALE PR], [CI FAIL], ...). They flow through
 * the same pickBest + threshold gate as everything else (proactive.ts), so only
 * the genuinely-important ones actually ping — routine churn stays silent.
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

const execFileP = promisify(execFile);
const SEEN_FILE = join(ZOE_PATHS.home, 'seen-events.json');
const STALE_PR_HOURS = 48; // an open PR untouched this long is worth surfacing
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
    return []; // gh missing / rate-limited / offline — stay silent, no crash
  }

  const seen = await readSeen();
  const today = new Date(now).toISOString().slice(0, 10);
  const out: Candidate[] = [];

  for (const pr of prs) {
    const updated = pr.updatedAt ? Date.parse(pr.updatedAt) : NaN;
    if (!Number.isFinite(updated)) continue;
    const ageHrs = (now - updated) / 3_600_000;
    if (ageHrs < STALE_PR_HOURS) continue;

    // once per day per PR so a long-stale PR doesn't nag every hour
    const key = `stale:${repoName(pr)}#${pr.number}:${today}`;
    if (seen[key]) continue;
    seen[key] = now;

    const days = Math.floor(ageHrs / 24);
    out.push({
      kind: 'github-event',
      score: 0.65, // actionable: clears the 0.6 bar, but a due commitment still outranks
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
