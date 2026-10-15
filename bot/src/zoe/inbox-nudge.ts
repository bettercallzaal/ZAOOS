/**
 * inbox-nudge.ts - the daily "what waits on you" push that comes back until
 * the count is zero (doc 2679 PR 2). Zaal, 2026-10-14, item 228: "it should
 * daily give me my total grill and todo items and keep bugging me til nothings
 * in my inbox"; addendum: "Push all PRs to this".
 *
 * With ZOE_INBOX_NUDGE=1 a scheduler tick (every 30 minutes) runs
 * runInboxNudgeTick. The totals come from the sources the waiting push and the
 * needs-Zaal digest already read; nothing is read twice in a new way:
 *   lanes  open bullets under "## for the grill" in handoffs/status/*.md
 *          (needs-zaal-digest.ts parseLaneGrillSections, the vault copy at
 *          VAULT_DIR; it is what zao-lanegrill-count counts on the Mac)
 *   page   the seat's "Waiting on Zaal" rows (terminals-digest.ts
 *          readTerminalsPage, vault origin/main; what the waiting push sends)
 *   board  decisions and due-soon cards (needs-zaal-digest.ts
 *          filterNeedsZaalTasks over the cockpit tasks)
 *   prs    open, non-draft PRs by the review owners that do not carry the
 *          `hold` label (cockpit/adapters.ts fetchReviewPRs). Whether a PR is
 *          auto-merge-armed or already passed review is NOT read here: the
 *          search API row has neither, and one call per PR is not worth a
 *          daily count. Stated, not hidden: a PR that will merge itself is
 *          still listed until it does.
 * total = lanes + page + board + prs. Mail is not counted: inbox-ingest.ts
 * folds mail into context and keeps no pending number (IngestResult has
 * ingested, skipped, scanned only), so a mail count would be invented.
 *
 * WHEN IT SENDS (decide(), pure):
 *   - never inside the quiet window (quiet-window.ts), never before
 *     ZOE_INBOX_NUDGE_FROM (default 05:15, America/New_York) on a day
 *   - the first send of a day at the first tick at or after FROM
 *   - again after 2h, then 4h, then 8h (ZOE_INBOX_NUDGE_BACKOFF_H, default
 *     "2,4,8"), each only if the total CHANGED since the last send: an
 *     unchanged count is never sent twice; after the last step the 20:00
 *     needs-Zaal digest is the next word
 *   - total 0: one "clear" message, once a day, and only if something above
 *     zero was sent that day; then silence until tomorrow
 * Buttons: "Next card" sends the first seat item (terminal-grill.ts
 * sendNextTerminalCard, the same card the waiting push sends); "PR merge
 * commands" lists the PRs, one button each, and a tap answers with the
 * one-line gh command as text. Nothing here merges, answers or closes
 * anything for him.
 *
 * State: ~/.zao/zoe/inbox-nudge.json, one day at a time.
 */

import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fetchCockpitTasks, fetchReviewPRs } from '../cockpit/adapters';
import type { ReviewPR } from '../cockpit/types';
import type { Button } from './grill-pause';
import { filterNeedsZaalTasks, parseLaneGrillSections, type NeedsZaalTask } from './needs-zaal-digest';
import { inQuietWindow, parseClock, easternMinute } from './quiet-window';
import { parseTerminalsPage, readTerminalsPage, vaultDir as pageVaultDir } from './terminals-digest';

export function inboxNudgeEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.ZOE_INBOX_NUDGE === '1';
}

export const DEFAULT_FROM = 5 * 60 + 15;
export const DEFAULT_BACKOFF_H = [2, 4, 8];

export interface NudgeConfig {
  /** Minutes after midnight, Eastern, before which nothing is sent. */
  fromMinute: number;
  /** Hours after the previous send before the next repeat; one entry per repeat. */
  backoffH: number[];
}

/** Config from the environment; a bad value falls back, it never opens the day. */
export function nudgeConfig(env: NodeJS.ProcessEnv = process.env): NudgeConfig {
  const raw = (env.ZOE_INBOX_NUDGE_BACKOFF_H ?? '').split(',').map((s) => Number(s.trim())).filter((n) => Number.isFinite(n) && n > 0);
  return { fromMinute: parseClock(env.ZOE_INBOX_NUDGE_FROM, DEFAULT_FROM), backoffH: raw.length ? raw : DEFAULT_BACKOFF_H };
}

export interface Totals {
  lanes: number;
  page: number;
  board: number;
  prs: number;
  total: number;
  /** Which sources could not be read; their count is 0 and the message says so. */
  failed: string[];
  prList: ReviewPR[];
}

export interface NudgeState {
  /** Eastern calendar day the state is for. */
  day: string;
  sends: { at: string; total: number }[];
  clearSaidAt: string | null;
}

export type Decision =
  | { action: 'quiet' }
  | { action: 'before-from' }
  | { action: 'send'; nth: number }
  | { action: 'unchanged' }
  | { action: 'not-due'; dueAt: string }
  | { action: 'exhausted' }
  | { action: 'clear' }
  | { action: 'silent' };

/** "YYYY-MM-DD" in America/New_York, the day the state is keyed on. */
export function easternDay(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export const emptyState = (day: string): NudgeState => ({ day, sends: [], clearSaidAt: null });

/** Pure. What this tick should do, from the state, the clock and the total. */
export function decide(state: NudgeState, now: Date, total: number, cfg: NudgeConfig, quiet: boolean = inQuietWindow(now)): Decision {
  if (quiet) return { action: 'quiet' };
  if (easternMinute(now) < cfg.fromMinute) return { action: 'before-from' };
  const last = state.sends[state.sends.length - 1];
  if (total === 0) {
    if (state.sends.length && !state.clearSaidAt) return { action: 'clear' };
    return { action: 'silent' };
  }
  if (!last) return { action: 'send', nth: 1 };
  const repeats = state.sends.length - 1;
  if (repeats >= cfg.backoffH.length) return { action: 'exhausted' };
  const dueMs = Date.parse(last.at) + cfg.backoffH[repeats] * 3_600_000;
  if (now.getTime() < dueMs) return { action: 'not-due', dueAt: new Date(dueMs).toISOString() };
  if (total === last.total) return { action: 'unchanged' };
  return { action: 'send', nth: state.sends.length + 1 };
}

const holdLabel = (pr: ReviewPR): boolean => (pr.labels ?? []).some((l) => l.toLowerCase() === 'hold');

/** The PRs that wait on his hand: open, not draft, not labelled hold. */
export function waitingPrs(prs: ReviewPR[]): ReviewPR[] {
  return prs.filter((p) => !p.draft && !holdLabel(p));
}

export function ageDays(createdAt: string | null, now: Date): string {
  const t = createdAt ? Date.parse(createdAt) : Number.NaN;
  if (!Number.isFinite(t)) return 'age ?';
  const d = Math.max(0, Math.floor((now.getTime() - t) / 86_400_000));
  return d === 0 ? 'today' : `${d}d`;
}

/** The one line he pastes. Never run here. */
export function mergeCommand(pr: ReviewPR): string {
  return `gh pr merge ${pr.number} -R ${pr.repo} --squash --delete-branch`;
}

/** callback_data for a PR button, or null when it would not fit Telegram's 64 bytes. */
export function prCallback(pr: ReviewPR): string | null {
  const data = `inb:cmd:${pr.repo}:${pr.number}`;
  return Buffer.byteLength(data, 'utf8') <= 64 ? data : null;
}

export function parsePrCallback(data: string): { repo: string; number: number } | null {
  const m = /^inb:cmd:([^:]+\/[^:]+):([0-9]+)$/.exec(data);
  return m ? { repo: m[1], number: Number(m[2]) } : null;
}

/** Pure. The totals message and its buttons. */
export function formatTotals(t: Totals, nth: number, now: Date): { text: string; buttons: Button[][] } {
  const head = nth === 1 ? `Waiting on you today: ${t.total}` : `Still waiting on you: ${t.total} (update ${nth})`;
  const lines = [
    head,
    `Lanes asking: ${t.lanes}`,
    `Seat page: ${t.page}`,
    `Board: ${t.board}`,
    `PRs on your hand: ${t.prs}`,
  ];
  if (t.failed.length) lines.push(`Could not read: ${t.failed.join(', ')} (counted as 0)`);
  lines.push('', 'It repeats while this is above zero and stops the day it hits zero.');
  const buttons: Button[][] = [];
  if (t.page > 0) buttons.push([{ text: 'Next card', data: 'inb:next' }]);
  if (t.prs > 0) buttons.push([{ text: `PR merge commands (${t.prs})`, data: 'inb:prs' }]);
  return { text: lines.join('\n'), buttons };
}

/** Pure. The PR list message: one line and one button per PR. */
export function formatPrList(prs: ReviewPR[], now: Date): { text: string; buttons: Button[][] } {
  if (!prs.length) return { text: 'No PR waits on your hand right now.', buttons: [] };
  const lines = prs.map((p) => `${p.repo} #${p.number} (${ageDays(p.createdAt, now)}): ${p.title.slice(0, 80)}`);
  const buttons = prs
    .map((p) => ({ p, data: prCallback(p) }))
    .filter((x): x is { p: ReviewPR; data: string } => x.data !== null)
    .map(({ p, data }) => [{ text: `${p.repo.split('/')[1] ?? p.repo} #${p.number}: merge cmd`.slice(0, 40), data }]);
  return { text: ['PRs waiting on your hand. Tap one for the merge line; nothing merges by itself.', ...lines].join('\n'), buttons };
}

export const CLEAR_TEXT = 'Inbox clear: nothing waits on you. The next count comes tomorrow.';

const statePath = (): string => join(process.env.ZOE_HOME ?? join(homedir(), '.zao', 'zoe'), 'inbox-nudge.json');

export async function readState(day: string): Promise<NudgeState> {
  try {
    const s = JSON.parse(await fs.readFile(statePath(), 'utf8')) as NudgeState;
    if (s && s.day === day && Array.isArray(s.sends)) return s;
  } catch {
    // missing or unreadable: a fresh day
  }
  return emptyState(day);
}

export async function writeState(s: NudgeState): Promise<void> {
  const p = statePath();
  await fs.mkdir(join(p, '..'), { recursive: true });
  const tmp = `${p}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(s, null, 2));
  await fs.rename(tmp, p);
}

export interface Sources {
  lanes: () => Promise<number>;
  page: () => Promise<number>;
  board: () => Promise<number>;
  prs: () => Promise<ReviewPR[]>;
}

export const defaultSources: Sources = {
  lanes: async () => parseLaneGrillSections(process.env.VAULT_DIR ?? join(homedir(), 'zao-vault')).length,
  page: async () => parseTerminalsPage((await readTerminalsPage(pageVaultDir())).text).waiting.length,
  board: async () => {
    const tasks = await fetchCockpitTasks();
    const adapted: NeedsZaalTask[] = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      due: t.due,
      notes: t.notes,
      metadata: t.next_owner ? { next_owner: t.next_owner } : null,
    }));
    const { dueSoon, decisions } = filterNeedsZaalTasks(adapted);
    return decisions.length + dueSoon.filter((t) => !decisions.some((d) => d.id === t.id)).length;
  },
  prs: fetchReviewPRs,
};

/** Read every source; one that throws counts 0 and is named in `failed`. */
export async function readTotals(src: Sources = defaultSources): Promise<Totals> {
  const failed: string[] = [];
  const num = async (name: string, f: () => Promise<number>): Promise<number> => {
    try {
      return await f();
    } catch (e) {
      console.error(`[zoe/inbox-nudge] ${name} source failed:`, (e as Error)?.message);
      failed.push(name);
      return 0;
    }
  };
  const [lanes, page, board] = await Promise.all([num('lanes', src.lanes), num('page', src.page), num('board', src.board)]);
  let prList: ReviewPR[] = [];
  try {
    prList = waitingPrs(await src.prs());
  } catch (e) {
    console.error('[zoe/inbox-nudge] prs source failed:', (e as Error)?.message);
    failed.push('prs');
  }
  const prs = prList.length;
  return { lanes, page, board, prs, total: lanes + page + board + prs, failed, prList };
}

export type TickResult = Decision['action'] | 'off';

export async function runInboxNudgeTick(deps: {
  send: (text: string, buttons: Button[][]) => Promise<unknown>;
  sources?: Sources;
  now?: Date;
  env?: NodeJS.ProcessEnv;
}): Promise<TickResult> {
  const env = deps.env ?? process.env;
  if (!inboxNudgeEnabled(env)) return 'off';
  const now = deps.now ?? new Date();
  const day = easternDay(now);
  const state = await readState(day);
  // Cheap gates before any source is read: the quiet window and the day's start.
  const pre = decide(state, now, 1, nudgeConfig(env));
  if (pre.action === 'quiet' || pre.action === 'before-from') return pre.action;
  const totals = await readTotals(deps.sources);
  const d = decide(state, now, totals.total, nudgeConfig(env));
  if (d.action === 'send') {
    const { text, buttons } = formatTotals(totals, d.nth, now);
    await deps.send(text, buttons);
    state.sends.push({ at: now.toISOString(), total: totals.total });
    await writeState(state);
  } else if (d.action === 'clear') {
    await deps.send(CLEAR_TEXT, []);
    state.clearSaidAt = now.toISOString();
    await writeState(state);
  }
  return d.action;
}
