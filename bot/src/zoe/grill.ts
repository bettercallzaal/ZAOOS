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
  /** The one-click answer Zaal chose, if any. */
  answer?: string;
}

export interface GrillState {
  items: Record<string, GrillItemState>;
  activeKey: string | null;
  activeTitle?: string | null;
  /** kind of the active item, so a text-reply resolve knows how to route it. */
  activeKind?: GrillKind | null;
  /** message_id of the pinned open question, so we can unpin it on answer. */
  activeMessageId?: number | null;
  lastAskedAt: string | null;
}

/**
 * Extract one-click answer options from a decision title, if it cleanly has any.
 * Handles "pick 1 (intro) / 2 (map) / 3 (both)", "yes / no", "publish / hold".
 * Returns [] when there is no clean 2-4 option set (falls back to Done/Skip/Later).
 */
export function parseOptions(title: string): { value: string; label: string }[] {
  const body = title.includes(':') ? title.slice(title.lastIndexOf(':') + 1) : title;
  const parts = body
    .split('/')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length < 2 || parts.length > 4) return [];
  const opts: { value: string; label: string }[] = [];
  for (const part of parts) {
    const num = part.match(/^(?:pick\s+)?(\d+)\s*(?:\(([^)]+)\))?/i);
    if (num) {
      const v = num[1];
      const paren = num[2]?.trim();
      opts.push({ value: v, label: paren ? `${v}: ${paren}` : v });
      continue;
    }
    const word = part.replace(/[()]/g, '').trim();
    if (/^[A-Za-z][A-Za-z0-9 -]{0,13}$/.test(word)) {
      opts.push({ value: word.toLowerCase().split(' ')[0], label: word });
      continue;
    }
    return []; // a part did not parse cleanly -> generic buttons
  }
  if (new Set(opts.map((o) => o.value)).size !== opts.length) return []; // colliding values
  return opts;
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

  // A reply to the (pinned) question IS the resolve path for any item - Zaal can
  // voice/text his call and ZOE logs it + moves it off his plate. Tell him so;
  // the buttons alone never made "resolve" discoverable (the gap he flagged).
  const resolveHint =
    item.kind === 'review'
      ? '\n\nReply with a note, or tap Reviewed to clear it.'
      : '\n\nReply with your call and I log it + move it off your plate. Or use the buttons.';

  // If the decision has baked-in options ("pick 1/2/3", "yes/no"), make THOSE
  // the buttons so Zaal answers in one tap. Otherwise a kind-specific resolve
  // button (Approve/Reviewed/Unblock) that actually acts, + Skip/Later.
  const options = item.kind === 'decision' ? parseOptions(item.title) : [];
  let buttons: { text: string; data: string }[][];
  if (options.length >= 2) {
    const answerRow = options.map((o) => ({ text: o.label.slice(0, 28), data: `grill:ans:${o.value}`.slice(0, 60) }));
    buttons = [answerRow, [{ text: 'Skip', data: 'grill:skip' }, { text: 'Later', data: 'grill:snooze' }]];
  } else {
    // grill:approve resolves a single-action decision ("yes, do this") - it
    // records the call AND moves the source task off the needs-you queue.
    // Reviews/blocked use grill:done (mark handled). Skip = not mine, Later = snooze.
    const resolveBtn =
      item.kind === 'review'
        ? { text: 'Reviewed', data: 'grill:done' }
        : item.kind === 'blocked'
          ? { text: 'Unblock', data: 'grill:approve' }
          : { text: 'Approve', data: 'grill:approve' };
    buttons = [[resolveBtn, { text: 'Skip', data: 'grill:skip' }, { text: 'Later', data: 'grill:snooze' }]];
  }
  return { text: `${lead}${link}${resolveHint}${tail}`, buttons };
}

export interface SurfaceGrillDeps {
  /** Send the DM; returns the sent message so we can pin it. */
  sendDM: (text: string, buttons: { text: string; data: string }[][]) => Promise<{ message_id?: number } | unknown>;
  now?: number;
  /** Pin the open question so ONLY it is pinned; unpin the previous one. Optional. */
  pin?: (messageId: number) => Promise<unknown>;
  unpin?: (messageId: number) => Promise<unknown>;
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

  // Unpin the previous open question so at most ONE question is ever pinned.
  if (deps.unpin && state.activeMessageId) await deps.unpin(state.activeMessageId).catch(() => {});

  const { text, buttons } = formatGrill(item, remaining);
  const sent = (await deps.sendDM(text, buttons)) as { message_id?: number } | undefined;
  const messageId = sent && typeof sent === 'object' ? sent.message_id : undefined;

  // Pin the new open question (silent) so it stays easy to find until answered.
  if (deps.pin && messageId) await deps.pin(messageId).catch(() => {});

  state.items[item.key] = { askedAt: new Date(now).toISOString(), status: 'asked' };
  state.activeKey = item.key;
  state.activeTitle = item.title;
  state.activeKind = item.kind;
  state.activeMessageId = messageId ?? null;
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
  state.activeMessageId = null;
  await writeGrillState(state);
  return action === 'done' ? 'Done - next one coming.' : action === 'skip' ? 'Skipped.' : 'Snoozed for a bit.';
}

/**
 * Record a one-click ANSWER to the active grill item (e.g. Zaal tapped "2 (map)").
 * Marks it done + stores the answer, and returns the key/title/value so the caller
 * can log the decision where ZOE's brain + loops will act on it.
 */
export async function applyGrillAnswer(
  value: string,
  now = Date.now(),
): Promise<{ note: string; key: string | null; title: string | null; value: string }> {
  const state = await readGrillState();
  const key = state.activeKey;
  const title = state.activeTitle ?? null;
  if (!key || !state.items[key]) return { note: 'Nothing active to answer.', key: null, title: null, value };
  state.items[key] = { ...state.items[key], status: 'done', answer: value };
  state.activeKey = null;
  state.activeTitle = null;
  state.activeKind = null;
  state.activeMessageId = null;
  await writeGrillState(state);
  return { note: `Locked in: ${value}. Next one coming.`, key, title, value };
}

/**
 * Resolve the active grill item by a TEXT REPLY to its pinned message. This is
 * the general "resolve" path: Zaal replies (voice/text) with his call, ZOE
 * captures it, marks the item done, and hands the key/kind back so the caller
 * can record the decision + move the source task off the board's needs-you queue.
 * Returns null when the reply was not to the currently-active pinned question
 * (so normal message handling continues).
 */
export async function resolveGrillByReply(
  repliedMessageId: number,
  replyText: string,
  now = Date.now(),
): Promise<{ key: string; kind: GrillKind; title: string | null; value: string } | null> {
  const state = await readGrillState();
  if (!state.activeMessageId || state.activeMessageId !== repliedMessageId) return null;
  const key = state.activeKey;
  if (!key || !state.items[key]) return null;
  const title = state.activeTitle ?? null;
  const kind = state.activeKind ?? 'decision';
  state.items[key] = { ...state.items[key], status: 'done', answer: replyText };
  state.activeKey = null;
  state.activeTitle = null;
  state.activeKind = null;
  state.activeMessageId = null;
  await writeGrillState(state);
  return { key, kind, title, value: replyText };
}
