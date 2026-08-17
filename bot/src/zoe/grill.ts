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
import { getCalendarEvents } from './calendar';

export type GrillKind = 'decision' | 'review' | 'blocked' | 'event';

/** A calendar event for today, fed into the day-driver grill (informational). */
export interface GrillEvent {
  key: string; // stable id (calendar uid)
  title: string; // "5:30pm - Promotions Committee @ Franklin St Parklet"
  link?: string;
}

export interface GrillItem {
  key: string; // stable id: task legacy_id/id, or PR url
  kind: GrillKind;
  title: string;
  link?: string;
  priority: number; // lower = more urgent
  /** One-line context from the task notes, so the card explains itself. */
  context?: string;
}

export interface GrillItemState {
  askedAt: string;
  status: 'asked' | 'done' | 'skipped' | 'snoozed';
  snoozeUntil?: string;
  /** The one-click answer Zaal chose, if any. */
  answer?: string;
  /**
   * When this item was FIRST surfaced, never overwritten on a re-ask. `askedAt`
   * moves every time the card is pushed, so it can only answer "how long since
   * the last nudge" - it cannot answer "how long has this been unanswered",
   * which is the question the cooldown needs (see askCooldownMs).
   */
  firstAskedAt?: string;
}

export interface GrillState {
  items: Record<string, GrillItemState>;
  activeKey: string | null;
  activeTitle?: string | null;
  /** kind of the active item, so a text-reply resolve knows how to route it. */
  activeKind?: GrillKind | null;
  /** message_id of the pinned open question, so we can unpin it on answer. */
  activeMessageId?: number | null;
  /** Parsed one-click options of the active decision, so typed answers and the
   * multi-select keyboard can match against them (#51). */
  activeOptions?: { value: string; label: string }[] | null;
  /** Values toggled on in multi-select mode (order follows activeOptions). */
  activeMulti?: string[] | null;
  lastAskedAt: string | null;
  /** How many items ZOE has proactively pushed today, so it caps at DAILY_PUSH_CAP
   * (top-N-not-96). Reset when the date rolls. /grill and post-answer advances
   * bypass the cap - it only gates unsolicited cron pushes. */
  daySurfaced?: { date: string; count: number };
}

/** ZOE proactively pushes at most this many items/day (the "top few, not 96"
 * fix). Zaal can always pull more with /grill; answering also flows past it. */
const DAILY_PUSH_CAP = 5;

/**
 * Extract one-click answer options from a decision title, if it cleanly has any.
 * Handles "pick 1 (intro) / 2 (map) / 3 (both)", "yes / no", "publish / hold".
 * Returns [] when there is no clean 2-4 option set (falls back to Done/Skip/Later).
 */
export function parseOptions(title: string): { value: string; label: string }[] {
  // The options may themselves contain colons ("... 1: intro test / 2: map"),
  // so neither first- nor last-colon splitting alone is safe. Try candidates
  // from longest to shortest; the first that parses cleanly into 2-4 options
  // wins: after the FIRST colon, after the LAST colon, then the whole title.
  const candidates: string[] = [];
  const firstColon = title.indexOf(':');
  const lastColon = title.lastIndexOf(':');
  if (firstColon >= 0) candidates.push(title.slice(firstColon + 1));
  if (lastColon > firstColon) candidates.push(title.slice(lastColon + 1));
  candidates.push(title);
  for (const body of candidates) {
    const opts = parseOptionsBody(body);
    if (opts.length >= 2) return opts;
  }
  return [];
}

function parseOptionsBody(body: string): { value: string; label: string }[] {
  const parts = body
    .split('/')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length < 2 || parts.length > 4) return [];
  const opts: { value: string; label: string }[] = [];
  for (const part of parts) {
    // Numbered option: "1 (intro test)", "1: intro test", "1 - intro test",
    // "pick 1 (intro)", or a bare "3".
    const num = part.match(/^(?:pick\s+)?(\d+)\s*(?:\(([^)]+)\)|[:.\-]\s*(.+))?$/i);
    if (num) {
      const v = num[1];
      const label = (num[2] ?? num[3])?.trim();
      opts.push({ value: v, label: label ? `${v}: ${label}` : v });
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

/**
 * Match a TYPED message against the active decision's options, so a plain
 * typed answer registers without a button tap (the #51 capture fix). Returns
 * the option value, a comma-joined multi ("1,3"), or null when the text is not
 * option-shaped - null means "this is normal chat, leave it alone".
 */
export function matchTypedAnswer(
  text: string,
  options: { value: string; label: string }[],
): string | null {
  if (!options.length) return null;
  const t = text.trim().toLowerCase();
  if (!t || t.length > 80) return null;
  for (const o of options) {
    if (t === o.value.toLowerCase() || t === o.label.toLowerCase()) return o.value;
    // "2: map" typed as just "map" (the label tail)
    const tail = o.label.toLowerCase().replace(/^\d+:\s*/, '');
    if (tail && t === tail) return o.value;
  }
  // Multi-choice: "1,2", "1 and 3", "1 2", "1 & 2" - every token must be a value.
  const values = new Set(options.map((o) => o.value.toLowerCase()));
  const tokens = t.split(/\s*(?:,|\band\b|&|\+|\s)\s*/).filter(Boolean);
  if (tokens.length >= 2 && tokens.every((tok) => values.has(tok))) {
    const uniq = [...new Set(tokens)];
    if (uniq.length >= 2) return uniq.join(',');
  }
  return null;
}

/** Pure multi-select toggle: add/remove a value, preserving option order. */
export function toggleSelection(
  selected: string[],
  value: string,
  options: { value: string; label: string }[],
): string[] {
  const next = selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value];
  const order = options.map((o) => o.value);
  return next.sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

/**
 * Keyboard rows for multi-select mode: each option toggles ([x]/[ ] prefix),
 * plus Send/Cancel. Pure - index.ts renders it into grammy's shape.
 */
export function multiKeyboard(
  options: { value: string; label: string }[],
  selected: string[],
): { text: string; data: string }[][] {
  const rows = options.map((o) => [
    {
      text: `${selected.includes(o.value) ? '[x]' : '[ ]'} ${o.label.slice(0, 24)}`,
      data: `grill:tog:${o.value}`.slice(0, 60),
    },
  ]);
  rows.push([
    { text: `Send${selected.length ? ` (${selected.length})` : ''}`, data: 'grill:multisend' },
    { text: 'Cancel', data: 'grill:multicancel' },
  ]);
  return rows;
}

const ASK_COOLDOWN_MS = 3 * 60 * 60 * 1000; // don't re-surface a still-open item within 3h
const SNOOZE_MS = 6 * 60 * 60 * 1000;

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/**
 * How long to wait before re-surfacing a still-open item - SHORTER the longer it
 * has gone unanswered.
 *
 * Zaal, 2026-08-11: "older cards must nag MORE frequently, not expire." The
 * instinct to age an item out is exactly backwards. An item that has sat for a
 * week is not less important than one raised this morning; it is the one thing
 * demonstrably not getting done, and letting it go quiet is how it disappears.
 * Nothing here ever removes an item - only `done` does that, and only Zaal
 * produces a `done`.
 *
 * The floor is deliberate. A cooldown that keeps shrinking would eventually
 * re-ask on every scheduler tick, and a card that arrives constantly is one that
 * stops being read (`noisy-signal-guard.md`). 45m is the floor, and
 * DAILY_PUSH_CAP still bounds the day at 5 unsolicited pushes regardless - so
 * this changes WHICH item gets those five slots, not how many arrive.
 */
export function askCooldownMs(ageMs: number): number {
  if (ageMs >= 7 * DAY_MS) return 45 * 60 * 1000;
  if (ageMs >= 3 * DAY_MS) return 1.5 * HOUR_MS;
  if (ageMs >= 1 * DAY_MS) return 2 * HOUR_MS;
  return ASK_COOLDOWN_MS;
}

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

/** Build the ranked grill queue from cockpit tasks + review PRs + today's events. Pure. */
export function toQueue(tasks: CockpitTask[], prs: ReviewPR[], events: GrillEvent[] = []): GrillItem[] {
  // Today's events lead the day - they are time-bound, so priority -1 (above P0).
  const evts: GrillItem[] = events.map((e) => ({
    key: e.key,
    kind: 'event',
    title: e.title,
    link: e.link,
    priority: -1,
  }));
  const firstLine = (s: string | null | undefined): string | undefined => {
    const line = (s ?? '').split('\n').map((l) => l.trim()).find(Boolean);
    return line ? line.slice(0, 140) : undefined;
  };
  const decisions: GrillItem[] = needsYou(tasks).map((t) => ({
    key: t.legacy_id ?? String(t.id),
    kind: 'decision',
    title: t.title,
    priority: priorityRank(t.priority),
    context: firstLine(t.notes),
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
    context: firstLine(t.notes),
  }));
  // dedupe by key, keep the most-urgent instance
  const byKey = new Map<string, GrillItem>();
  for (const it of [...evts, ...decisions, ...reviews, ...blk]) {
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
    if (s.status === 'asked') {
      // Age is measured from the FIRST ask, not the last one. Falling back to
      // askedAt keeps every pre-existing state file working - an item written
      // before this field existed simply reads as new and gets the 3h default.
      const age = now - Date.parse(s.firstAskedAt ?? s.askedAt);
      if (now - Date.parse(s.askedAt) < askCooldownMs(age)) continue; // waiting on a reply, don't nag yet
    }
    return item; // skipped / cooled-down / snooze-elapsed -> re-surface
  }
  return null;
}

/** Format the DM text + inline buttons for one grill item. Pure. */
export function formatGrill(
  item: GrillItem,
  remaining: number,
): { text: string; buttons: { text: string; data: string }[][]; options: { value: string; label: string }[] } {
  const lead =
    item.kind === 'event'
      ? `On your calendar today:\n${item.title}`
      : item.kind === 'review'
        ? `Built and waiting on you - review/test:\n${item.title}`
        : item.kind === 'blocked'
          ? `Blocked, needs you to unblock:\n${item.title}`
          : `Decision needed:\n${item.title}`;
  // One-line context from the task notes makes the card self-explaining, so Zaal
  // decides at a glance without opening anything.
  const context = item.context ? `\n${item.context}` : '';
  const link = item.link ? `\n${item.link}` : '';
  // No running count at all - even "+85" read as a chore when AFK. ZOE caps its
  // daily pushes (top few); the rest just live in /cockpit, pulled on demand.
  const tail = remaining > 0 ? `\n\n(more in /cockpit when you want them)` : '';

  // Events are informational (acknowledge, don't resolve). Everything else: a reply
  // to the (pinned) question IS the resolve path - Zaal can voice/text his call and
  // ZOE logs it + moves it off his plate. Tell him so; buttons alone never made
  // "resolve" discoverable (the gap he flagged).
  const resolveHint =
    item.kind === 'event'
      ? '\n\nReply if you want me to prep or remind you for this.'
      : item.kind === 'review'
        ? '\n\nReply with a note, or tap Reviewed to clear it.'
        : '\n\nReply with your call and I log it + move it off your plate. Or use the buttons.';

  // If the decision has baked-in options ("pick 1/2/3", "yes/no"), make THOSE
  // the buttons so Zaal answers in one tap. Otherwise a kind-specific resolve
  // button (Approve/Reviewed/Unblock) that actually acts, + Skip/Later.
  const options = item.kind === 'decision' ? parseOptions(item.title) : [];
  let buttons: { text: string; data: string }[][];
  if (options.length >= 2) {
    const answerRow = options.map((o) => ({ text: o.label.slice(0, 28), data: `grill:ans:${o.value}`.slice(0, 60) }));
    const tailRow = [{ text: 'Skip', data: 'grill:skip' }, { text: 'Later', data: 'grill:snooze' }];
    // 3+ options: offer multi-select ("1 and 3"), single taps still instant.
    if (options.length >= 3) tailRow.unshift({ text: 'Pick multiple', data: 'grill:multi' });
    buttons = [answerRow, tailRow];
  } else {
    // grill:approve resolves a single-action decision ("yes, do this") - it
    // records the call AND moves the source task off the needs-you queue.
    // Reviews/blocked use grill:done (mark handled). Skip = not mine, Later = snooze.
    const resolveBtn =
      item.kind === 'event'
        ? { text: 'Got it', data: 'grill:done' }
        : item.kind === 'review'
          ? { text: 'Reviewed', data: 'grill:done' }
          : item.kind === 'blocked'
            ? { text: 'Unblock', data: 'grill:approve' }
            : { text: 'Approve', data: 'grill:approve' };
    buttons = [[resolveBtn, { text: 'Skip', data: 'grill:skip' }, { text: 'Later', data: 'grill:snooze' }]];
  }
  return { text: `${lead}${context}${link}${resolveHint}${tail}`, buttons, options };
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
  fetchEvents?: () => Promise<GrillEvent[]>;
  /** When true, ignore the daily push cap (Zaal pulled it via /grill, or is
   * actively answering and advancing). The cap only gates unsolicited crons. */
  bypassCap?: boolean;
}

/** Today's calendar events -> grill events. Best-effort; [] if the calendar is off. */
export async function todaysGrillEvents(now = Date.now()): Promise<GrillEvent[]> {
  try {
    const events = await getCalendarEvents(2, now);
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    return events
      .filter((e) => e.start >= startOfDay && e.start <= endOfDay)
      .map((e) => {
        const t = e.start.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          timeZone: 'America/New_York',
        });
        const loc = e.location ? ` @ ${e.location.split(',')[0]}` : '';
        return { key: `evt:${e.id}`, title: `${t} - ${e.title}${loc}`, link: e.url };
      });
  } catch {
    return [];
  }
}

/** One proactive tick: DM Zaal the next item that needs him. Returns what it did. */
export async function surfaceGrill(deps: SurfaceGrillDeps): Promise<{ sent: boolean; item?: GrillItem }> {
  const now = deps.now ?? Date.now();
  const tasks = await (deps.fetchTasks ?? fetchCockpitTasks)();
  const prs = await (deps.fetchPRs ?? fetchReviewPRs)().catch(() => [] as ReviewPR[]);
  const events = await (deps.fetchEvents ?? (() => todaysGrillEvents(now)))().catch(() => [] as GrillEvent[]);
  const queue = toQueue(tasks, prs, events);
  const state = await readGrillState();

  // Daily push cap: ZOE surfaces at most DAILY_PUSH_CAP items/day unsolicited, so
  // it drives the top few instead of firehosing all 88. /grill + post-answer
  // advances pass bypassCap=true so Zaal can always flow past it on demand.
  const today = new Date(now).toISOString().slice(0, 10);
  const day = state.daySurfaced?.date === today ? state.daySurfaced : { date: today, count: 0 };
  if (!deps.bypassCap && day.count >= DAILY_PUSH_CAP) return { sent: false };

  const item = pickNext(queue, state, now);
  if (!item) return { sent: false };

  const remaining = queue.filter((q) => {
    const s = state.items[q.key];
    return q.key !== item.key && (!s || s.status !== 'done');
  }).length;

  // Unpin the previous open question so at most ONE question is ever pinned.
  if (deps.unpin && state.activeMessageId) await deps.unpin(state.activeMessageId).catch(() => {});

  const { text, buttons, options } = formatGrill(item, remaining);
  const sent = (await deps.sendDM(text, buttons)) as { message_id?: number } | undefined;
  const messageId = sent && typeof sent === 'object' ? sent.message_id : undefined;

  // Pin the new open question (silent) so it stays easy to find until answered.
  if (deps.pin && messageId) await deps.pin(messageId).catch(() => {});

  // firstAskedAt survives every re-ask - it is what makes an old item nag harder.
  // Writing the whole object fresh (rather than spreading the old one) is on
  // purpose: a re-ask must clear a stale snoozeUntil/answer. Only the age carries.
  const prior = state.items[item.key];
  const askedAt = new Date(now).toISOString();
  state.items[item.key] = {
    askedAt,
    status: 'asked',
    firstAskedAt: prior?.firstAskedAt ?? prior?.askedAt ?? askedAt,
  };
  state.activeKey = item.key;
  state.activeTitle = item.title;
  state.activeKind = item.kind;
  state.activeMessageId = messageId ?? null;
  state.activeOptions = options.length ? options : null;
  state.activeMulti = null;
  state.lastAskedAt = new Date(now).toISOString();
  state.daySurfaced = { date: today, count: day.count + 1 };
  await writeGrillState(state);
  return { sent: true, item };
}

/** Apply a button action to the currently-active grill item. */
export async function applyGrillAction(
  action: 'done' | 'skip' | 'snooze',
  now = Date.now(),
  unpinCallback?: (messageId: number) => Promise<void>,
): Promise<string> {
  const state = await readGrillState();
  const key = state.activeKey;
  if (!key || !state.items[key]) return 'Nothing active.';
  if (action === 'done') state.items[key] = { ...state.items[key], status: 'done' };
  else if (action === 'skip') state.items[key] = { ...state.items[key], status: 'skipped' };
  else state.items[key] = { ...state.items[key], status: 'snoozed', snoozeUntil: new Date(now + SNOOZE_MS).toISOString() };
  const messageIdToUnpin = state.activeMessageId;
  state.activeKey = null;
  state.activeMessageId = null;
  await writeGrillState(state);
  if (messageIdToUnpin && unpinCallback) {
    await unpinCallback(messageIdToUnpin).catch(() => {});
  }
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
  unpinCallback?: (messageId: number) => Promise<void>,
): Promise<{ note: string; key: string | null; title: string | null; value: string }> {
  const state = await readGrillState();
  const key = state.activeKey;
  const title = state.activeTitle ?? null;
  if (!key || !state.items[key]) return { note: 'Nothing active to answer.', key: null, title: null, value };
  state.items[key] = { ...state.items[key], status: 'done', answer: value };
  const messageIdToUnpin = state.activeMessageId;
  state.activeKey = null;
  state.activeTitle = null;
  state.activeKind = null;
  state.activeMessageId = null;
  state.activeOptions = null;
  state.activeMulti = null;
  await writeGrillState(state);
  if (messageIdToUnpin && unpinCallback) {
    await unpinCallback(messageIdToUnpin).catch(() => {});
  }
  return { note: `Locked in: ${value}. Next one coming.`, key, title, value };
}

/**
 * Read the active decision's options + current multi selection (for the
 * multi-select keyboard and typed-answer matching). Null when nothing active
 * or the active item has no parsed options.
 */
export async function getActiveGrill(): Promise<{
  key: string;
  options: { value: string; label: string }[];
  selected: string[];
  messageId: number | null;
} | null> {
  const state = await readGrillState();
  if (!state.activeKey || !state.activeOptions?.length) return null;
  return {
    key: state.activeKey,
    options: state.activeOptions,
    selected: state.activeMulti ?? [],
    messageId: state.activeMessageId ?? null,
  };
}

/** Toggle a value in multi-select mode; returns the new keyboard state. */
export async function toggleGrillMulti(
  value: string,
): Promise<{ options: { value: string; label: string }[]; selected: string[] } | null> {
  const state = await readGrillState();
  if (!state.activeKey || !state.activeOptions?.length) return null;
  const selected = toggleSelection(state.activeMulti ?? [], value, state.activeOptions);
  state.activeMulti = selected;
  await writeGrillState(state);
  return { options: state.activeOptions, selected };
}

/**
 * Commit the multi selection as the answer ("1,3"). Returns the same shape as
 * applyGrillAnswer so index.ts reuses one resolve path; null when nothing is
 * selected (the tap is answered with a hint instead).
 */
export async function commitGrillMulti(
  now = Date.now(),
): Promise<{ note: string; key: string | null; title: string | null; value: string } | null> {
  const state = await readGrillState();
  const selected = state.activeMulti ?? [];
  if (!state.activeKey || selected.length === 0) return null;
  return applyGrillAnswer(selected.join(','), now);
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
  state.activeOptions = null;
  state.activeMulti = null;
  await writeGrillState(state);
  return { key, kind, title, value: replyText };
}
