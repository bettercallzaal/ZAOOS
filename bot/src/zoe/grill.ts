/**
 * grill - the bot->agent upgrade. Instead of waiting to be messaged, ZOE pulls
 * what actually needs Zaal (cockpit need-you decisions + open PRs to review/test
 * + blocked items) and DMs him ONE at a time, advancing as he answers. This is
 * the proactive, goal-directed loop the reactive bot lacked.
 *
 * Design:
 * - Queue is built fresh each tick from the cockpit (single source of truth).
 * - ONE active item at a time. Buttons act on the active item (Done/Skip/Snooze),
 *   so callback_data stays tiny (no long PR urls in it).
 * - State (grill_state.json) records what was asked/answered so it never repeats
 *   within a cooldown and always advances to the next unanswered item.
 * - Sends to Zaal's DM, never a group (the old nudge bug).
 *
 * Boundary: grill only SURFACES + tracks. It does not act on Zaal's behalf; the
 * decisions/merges/tests stay his.
 */

import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fetchCockpitTasks, fetchReviewPRs, needsYou, blocked, priorityRank } from '../cockpit/adapters';
import type { CockpitTask, ReviewPR } from '../cockpit/types';

export type GrillKind = 'decision' | 'review' | 'blocked';

export interface GrillItem {
  key: string; // stable id: task legacy_id/id, or PR url
  kind: GrillKind;
  title: string;
  link?: string;
  priority: number; // lower = more urgent
}

export interface GrillItemState {
  askedAt: string;
  status: 'asked' | 'done' | 'skipped' | 'snoozed';
  snoozeUntil?: string;
}

export interface GrillState {
  items: Record<string, GrillItemState>;
  activeKey: string | null;
  lastAskedAt: string | null;
}

const ASK_COOLDOWN_MS = 3 * 60 * 60 * 1000; // don't re-surface a still-open item within 3h
const SNOOZE_MS = 6 * 60 * 60 * 1000;

const DEFAULT_STATE: GrillState = { items: {}, activeKey: null, lastAskedAt: null };
const stateFile = () => join(homedir(), '.zao', 'zoe', 'grill_state.json');

export async function readGrillState(): Promise<GrillState> {
  try {
    const raw = await fs.readFile(stateFile(), 'utf8');
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export async function writeGrillState(s: GrillState): Promise<void> {
  await fs.mkdir(join(homedir(), '.zao', 'zoe'), { recursive: true });
  await fs.writeFile(stateFile(), JSON.stringify(s, null, 2));
}

/** Build the ranked grill queue from cockpit tasks + review PRs. Pure. */
export function toQueue(tasks: CockpitTask[], prs: ReviewPR[]): GrillItem[] {
  const decisions: GrillItem[] = needsYou(tasks).map((t) => ({
    key: t.legacy_id ?? String(t.id),
    kind: 'decision',
    title: t.title,
    priority: priorityRank(t.priority),
  }));
  const reviews: GrillItem[] = prs.map((p) => ({
    key: p.url,
    kind: 'review',
    title: p.title,
    link: p.url,
    priority: 2, // a PR waiting on you sits at P2 urgency
  }));
  const blk: GrillItem[] = blocked(tasks).map((t) => ({
    key: t.legacy_id ?? String(t.id),
    kind: 'blocked',
    title: t.title,
    priority: 3,
  }));
  // dedupe by key, keep the most-urgent instance
  const byKey = new Map<string, GrillItem>();
  for (const it of [...decisions, ...reviews, ...blk]) {
    const cur = byKey.get(it.key);
    if (!cur || it.priority < cur.priority) byKey.set(it.key, it);
  }
  return [...byKey.values()].sort((a, b) => a.priority - b.priority);
}

/** Pick the next item to grill: most urgent that is not done and not on cooldown/snooze. */
export function pickNext(queue: GrillItem[], state: GrillState, now: number): GrillItem | null {
  for (const item of queue) {
    const s = state.items[item.key];
    if (!s) return item; // never asked
    if (s.status === 'done') continue;
    if (s.status === 'snoozed' && s.snoozeUntil && Date.parse(s.snoozeUntil) > now) continue;
    if (s.status === 'asked' && now - Date.parse(s.askedAt) < ASK_COOLDOWN_MS) continue; // waiting on a reply, don't nag yet
    return item; // skipped / cooled-down / snooze-elapsed -> re-surface
  }
  return null;
}

/** Format the DM text + inline buttons for one grill item. Pure. */
export function formatGrill(
  item: GrillItem,
  remaining: number,
): { text: string; buttons: { text: string; data: string }[][] } {
  const lead =
    item.kind === 'review'
      ? `Built and waiting on you - review/test:\n${item.title}`
      : item.kind === 'blocked'
        ? `Blocked, needs you to unblock:\n${item.title}`
        : `Decision needed:\n${item.title}`;
  const link = item.link ? `\n${item.link}` : '';
  const tail = remaining > 0 ? `\n\n${remaining} more waiting under this - answer and the next pops up.` : '';
  const doneLabel = item.kind === 'review' ? 'Reviewed' : 'Done';
  const buttons = [
    [
      { text: doneLabel, data: 'grill:done' },
      { text: 'Skip', data: 'grill:skip' },
      { text: 'Later', data: 'grill:snooze' },
    ],
  ];
  return { text: `${lead}${link}${tail}`, buttons };
}

export interface SurfaceGrillDeps {
  sendDM: (text: string, buttons: { text: string; data: string }[][]) => Promise<unknown>;
  now?: number;
  /** Injectable fetchers for tests. */
  fetchTasks?: () => Promise<CockpitTask[]>;
  fetchPRs?: () => Promise<ReviewPR[]>;
}

/** One proactive tick: DM Zaal the next item that needs him. Returns what it did. */
export async function surfaceGrill(deps: SurfaceGrillDeps): Promise<{ sent: boolean; item?: GrillItem }> {
  const now = deps.now ?? Date.now();
  const tasks = await (deps.fetchTasks ?? fetchCockpitTasks)();
  const prs = await (deps.fetchPRs ?? fetchReviewPRs)().catch(() => [] as ReviewPR[]);
  const queue = toQueue(tasks, prs);
  const state = await readGrillState();
  const item = pickNext(queue, state, now);
  if (!item) return { sent: false };

  const remaining = queue.filter((q) => {
    const s = state.items[q.key];
    return q.key !== item.key && (!s || s.status !== 'done');
  }).length;

  const { text, buttons } = formatGrill(item, remaining);
  await deps.sendDM(text, buttons);

  state.items[item.key] = { askedAt: new Date(now).toISOString(), status: 'asked' };
  state.activeKey = item.key;
  state.lastAskedAt = new Date(now).toISOString();
  await writeGrillState(state);
  return { sent: true, item };
}

/** Apply a button action to the currently-active grill item. */
export async function applyGrillAction(action: 'done' | 'skip' | 'snooze', now = Date.now()): Promise<string> {
  const state = await readGrillState();
  const key = state.activeKey;
  if (!key || !state.items[key]) return 'Nothing active.';
  if (action === 'done') state.items[key] = { ...state.items[key], status: 'done' };
  else if (action === 'skip') state.items[key] = { ...state.items[key], status: 'skipped' };
  else state.items[key] = { ...state.items[key], status: 'snoozed', snoozeUntil: new Date(now + SNOOZE_MS).toISOString() };
  state.activeKey = null;
  await writeGrillState(state);
  return action === 'done' ? 'Done - next one coming.' : action === 'skip' ? 'Skipped.' : 'Snoozed for a bit.';
}
