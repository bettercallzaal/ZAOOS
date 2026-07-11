// Post slate v1 - data gathering per category.
// Each source is best-effort. Empty arrays mean "skip the category for this fire."

import { execSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { ZOE_PATHS } from '../memory';
import type { PostSourceSnapshot } from './types';
import { getTodaysZaostockPromoLine } from './zaostock-promo-calendar';

const VOICE_MEMOS_DIR = join(ZOE_PATHS.home, 'voice-memos');

export async function gatherBuildSignals(repoDir: string): Promise<PostSourceSnapshot['build']> {
  let recentCommits: string[] = [];
  try {
    const log = execSync(
      `git -C ${JSON.stringify(repoDir)} log --since="24 hours ago" --no-merges --pretty=format:"%s" 2>/dev/null`,
      { encoding: 'utf8', timeout: 5000 },
    );
    recentCommits = log.split('\n').filter((l) => l.trim()).slice(0, 10);
  } catch {
    recentCommits = [];
  }

  let openPrs: Array<{ number: number; title: string }> = [];
  try {
    const json = execSync(
      'gh pr list --repo bettercallzaal/ZAOOS --state open --limit 8 --json number,title',
      { encoding: 'utf8', timeout: 8000 },
    );
    openPrs = JSON.parse(json) as Array<{ number: number; title: string }>;
  } catch {
    openPrs = [];
  }

  return { recentCommits, openPrs };
}

export async function gatherEcosystemSignals(repoDir: string): Promise<PostSourceSnapshot['ecosystem']> {
  // v1: proxy ecosystem activity via recent commits to ZAOOS lab repo (community activity
  // shows up as new research docs, doc 422 patterns). v2: add Farcaster /thezao channel pulls,
  // ZABAL contract events via Base RPC, member roster diffs.
  let repoActivity: string[] = [];
  try {
    const log = execSync(
      `git -C ${JSON.stringify(repoDir)} log --since="7 days ago" --no-merges --pretty=format:"%s" 2>/dev/null`,
      { encoding: 'utf8', timeout: 5000 },
    );
    repoActivity = log.split('\n').filter((l) => l.trim()).slice(0, 15);
  } catch {
    repoActivity = [];
  }
  return { repoActivity };
}

export async function gatherEventSignals(now: number = Date.now()): Promise<PostSourceSnapshot['event']> {
  // v1 stub: drop a file at ~/.zao/zoe/events/today.txt + tomorrow.txt with one event per
  // line. Cron or manual seeding writes it. v2: wire Google Calendar MCP via Claude CLI
  // subprocess (Hermes pattern) once the MCP is authenticated on VPS.
  const eventsDir = join(ZOE_PATHS.home, 'events');
  let todaysEvents: string[] = [];
  let tomorrowsEvents: string[] = [];
  try {
    const today = await fs.readFile(join(eventsDir, 'today.txt'), 'utf8');
    todaysEvents = today.split('\n').map((l) => l.trim()).filter(Boolean);
  } catch {
    todaysEvents = [];
  }
  try {
    const tomorrow = await fs.readFile(join(eventsDir, 'tomorrow.txt'), 'utf8');
    tomorrowsEvents = tomorrow.split('\n').map((l) => l.trim()).filter(Boolean);
  } catch {
    tomorrowsEvents = [];
  }

  // Doc 1033's 12-week ZAOstock promo calendar folds into this SAME event
  // category by design (doc 1033: "run inside that same 12-week frame rather
  // than compete with it"), not a separate category. Mon/Wed/Fri only, Jul 13
  // - Oct 3, 2026; silent (adds nothing) every other day.
  const todayIso = new Date(now).toISOString().slice(0, 10);
  const promoLine = getTodaysZaostockPromoLine(todayIso);
  if (promoLine) todaysEvents = [...todaysEvents, promoLine];

  return { todaysEvents, tomorrowsEvents };
}

/**
 * Pull recent commits across ALL Zaal's GitHub repos (any org, any visibility the
 * gh CLI has access to). This is the primary signal for personal-category posts -
 * his builder narrative emerges from what he shipped, not from voice memos he has
 * to remember to record.
 *
 * Uses `gh search commits --author=bettercallzaal --sort=author-date` which spans
 * bettercallzaal/*, songchaindao-dot/*, clawdbotatg/*, anywhere his email/github
 * account commits. Last 7 days.
 */
async function gatherGithubActivity(): Promise<string[]> {
  try {
    const out = execSync(
      `gh search commits --author=bettercallzaal --sort=author-date -L 40 --json repository,commit 2>/dev/null`,
      { encoding: 'utf8', timeout: 15000 },
    );
    interface SearchCommit {
      repository?: { fullName?: string };
      commit?: { message?: string; author?: { date?: string } };
    }
    const items = JSON.parse(out) as SearchCommit[];
    const cutoff = Date.now() - 7 * 86400_000;
    return items
      .filter((i) => {
        const d = i.commit?.author?.date;
        return d ? new Date(d).getTime() > cutoff : false;
      })
      .map((i) => {
        const repo = i.repository?.fullName ?? '(unknown)';
        const headline = (i.commit?.message ?? '').split('\n')[0].slice(0, 80);
        return `${repo}: ${headline}`;
      })
      .slice(0, 25);
  } catch {
    return [];
  }
}

export async function gatherPersonalSignals(): Promise<PostSourceSnapshot['personal']> {
  // Voice memos: per-day file under ~/.zao/zoe/voice-memos/YYYY-MM-DD.md (append-mode).
  // Drafter reads the last 2 days. Optional secondary signal - if Zaal drops a /vm
  // thought it weights into the draft.
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400_000).toISOString().slice(0, 10);
  const voiceMemos: string[] = [];
  for (const date of [today, yesterday]) {
    try {
      const raw = await fs.readFile(join(VOICE_MEMOS_DIR, `${date}.md`), 'utf8');
      voiceMemos.push(...raw.split('\n').filter((l) => l.trim()));
    } catch {
      // file might not exist - normal
    }
  }
  const githubActivity = await gatherGithubActivity();
  return { githubActivity, voiceMemos };
}

export async function appendVoiceMemo(text: string): Promise<void> {
  await fs.mkdir(VOICE_MEMOS_DIR, { recursive: true });
  const today = new Date().toISOString().slice(0, 10);
  const stamp = new Date().toISOString();
  const file = join(VOICE_MEMOS_DIR, `${today}.md`);
  await fs.appendFile(file, `\n[${stamp}] ${text}\n`, 'utf8');
}
