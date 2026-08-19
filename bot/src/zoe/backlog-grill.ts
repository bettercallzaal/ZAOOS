/**
 * backlog-grill.ts - drip the board backlog to Zaal's phone, one card every
 * couple of minutes, answered by pressing a number.
 *
 * WHAT ALREADY EXISTS (extend, never rebuild)
 * ------------------------------------------
 * grill.ts already DMs Zaal one item at a time, keeps state so nothing repeats,
 * pins the open question, renders buttons, and matches a typed answer. None of
 * that is rebuilt here. Three things were missing for what Zaal asked for:
 *
 *   1. SOURCE. grill.ts pulls from the cockpit - decisions that need him, PRs to
 *      review, blocked items. It has no path to the 356-task board backlog,
 *      which is where the actual pile is.
 *   2. OPTIONS. parseOptions() reads choices OUT of a title ("1: intro / 2: map").
 *      A backlog task has no options in its title; it needs the same five
 *      verdicts every time, so the answer becomes muscle memory.
 *   3. CADENCE. The grill cron is every 2 hours. Zaal asked for one added every
 *      couple of minutes so a queue builds and he sweeps it in one pass.
 *
 * WHY FIVE FIXED VERDICTS
 * ----------------------
 * The terminal grill today proved the shape: 24 tasks reviewed, 9 closed, in
 * minutes, because every question had the same small set of answers. Zaal:
 * "ill just come though and go though the whole queu just like today and knock
 * them out with pressing 1,2,3,4,5 or typign in a reply."
 *
 * So the options never change per card. 1 is always done, 3 is always work-on-it.
 * You stop reading the options after the first few cards, which is the entire
 * point - the bottleneck is his attention, not the interface.
 *
 * WHY "WORK ON IT" IS ONE OF THE FIVE
 * ----------------------------------
 * Also from today: sending a task to be worked mid-grill, and having it come
 * back at the END of the queue for confirmation, is what turns the grill from
 * sorting into progress. A task never gets marked done because work STARTED -
 * it re-enters the queue and is confirmed by a human, which is why `requeue` is
 * part of the verdict shape rather than an afterthought.
 */

/** The five, in the order they are pressed. Stable - do not reorder. */
export const VERDICTS = [
  { n: 1, key: 'done', label: 'Done - close it' },
  { n: 2, key: 'keep', label: 'Keep open' },
  { n: 3, key: 'work', label: 'Work on it now' },
  { n: 4, key: 'drop', label: 'Drop it' },
  { n: 5, key: 'skip', label: 'Skip for now' },
] as const;

export type VerdictKey = (typeof VERDICTS)[number]['key'];

export interface Verdict {
  key: VerdictKey;
  /** Anything Zaal typed instead of, or alongside, a number. */
  note?: string;
  /** Does this go back in the queue for a later confirmation? */
  requeue: boolean;
  /** Does this change the board now? */
  closesTask: boolean;
}

/**
 * Read an answer.
 *
 * Accepts a bare number, the word, or free text. Free text is never discarded -
 * it becomes the note, because "1" and "1 but ask iman first" mean different
 * things and the second one is the more valuable message.
 *
 * A bare number is deliberately the fastest path: it is what a thumb does at a
 * traffic light.
 */
export function parseVerdict(reply: string): Verdict | null {
  const raw = (reply || '').trim();
  if (!raw) return null;

  // A leading number, optionally followed by anything else.
  const m = /^([1-5])\b[\s.:)-]*(.*)$/s.exec(raw);
  if (m) {
    const v = VERDICTS.find((x) => x.n === Number(m[1]));
    if (v) return build(v.key, m[2].trim() || undefined);
  }

  // The word itself: "done", "keep", "drop", "skip", "work on it".
  const lower = raw.toLowerCase();
  for (const v of VERDICTS) {
    if (lower === v.key || lower.startsWith(`${v.key} `)) {
      return build(v.key, raw.slice(v.key.length).trim() || undefined);
    }
  }
  if (/^work on it/i.test(lower)) return build('work', raw.slice(10).trim() || undefined);

  // Anything else is a real instruction. Treat it as "work on it" with the
  // typed text as the brief - a sentence is a richer answer than a number, and
  // dropping it because it did not start with a digit would be the wrong call.
  return build('work', raw);
}

function build(key: VerdictKey, note?: string): Verdict {
  return {
    key,
    note,
    // Work re-enters the queue: a task is never done because work STARTED.
    requeue: key === 'work' || key === 'skip',
    closesTask: key === 'done' || key === 'drop',
  };
}

/**
 * The card.
 *
 * One task, its age, its why if it has one, and the five options. Age is shown
 * because a 36-day-old task and a 2-day-old one deserve different answers, and
 * that is invisible from a title.
 */
export function renderCard(
  task: { title: string; createdAt?: string; why?: string | null },
  position: { index: number; total: number },
  now = Date.now(),
): string {
  const lines: string[] = [];
  lines.push(`${position.index}/${position.total}`);
  lines.push('');
  lines.push(task.title.slice(0, 200));

  if (task.createdAt) {
    const days = Math.floor((now - Date.parse(task.createdAt)) / 86400_000);
    if (Number.isFinite(days) && days >= 0) {
      lines.push(`open ${days}d`);
    }
  }
  const why = (task.why || '').trim();
  // The boilerplate note is worse than nothing - it takes up a line and says
  // nothing. 13 of Iman's 20 open tasks carry it; do not put it on a card.
  if (why && !/Reply to Claude in next session/i.test(why)) {
    lines.push('');
    lines.push(why.slice(0, 180));
  }
  lines.push('');
  for (const v of VERDICTS) lines.push(`${v.n}. ${v.label}`);
  return lines.join('\n');
}

/**
 * Buttons, always - a number is faster to tap than to type.
 *
 * The task id rides IN the callback data. Cards deliberately pile up (that is
 * the queue Zaal sweeps), so by the time he taps card 3 the newest card is 20 -
 * a button that only said "done" would be applied to whatever was sent last,
 * closing the wrong task. The tap has to carry its own subject.
 *
 * Telegram caps callback_data at 64 bytes; `bg:done:` is 8, leaving 56 for the
 * id (a uuid is 36).
 */
export function verdictButtons(taskId: string): { text: string; data: string }[][] {
  const d = (key: VerdictKey) => `bg:${key}:${taskId}`;
  return [
    [
      { text: '1 Done', data: d('done') },
      { text: '2 Keep', data: d('keep') },
      { text: '3 Work', data: d('work') },
    ],
    [
      { text: '4 Drop', data: d('drop') },
      { text: '5 Skip', data: d('skip') },
    ],
  ];
}

export interface DripConfig {
  /** Minutes between cards. Zaal asked for ~2. */
  everyMinutes: number;
  /** Most unanswered cards allowed to pile up before we stop adding. */
  maxOutstanding: number;
  /**
   * How long a sent card counts against `maxOutstanding`. Past this it is no
   * longer "on his phone" and stops holding a slot - see DRIP_DEFAULT.
   */
  capWindowMs: number;
  /** Local hours (Zaal's) in which cards may be sent. */
  startHour: number;
  endHour: number;
}

/**
 * A pile is fine; a flood is not.
 *
 * Zaal wants a queue to sweep, so outstanding cards are the FEATURE - but
 * unbounded they become a wall he never opens, and a check nobody reads is
 * worth nothing. 20 is roughly one sweep's worth at the pace he cleared them
 * today.
 *
 * WHY THE CAP NEEDS A WINDOW (2026-08-14)
 * --------------------------------------
 * Without one, `maxOutstanding` counted every card ever sent and never
 * answered - including cards sent days ago and buried under a week of
 * Telegram. Twenty of those pinned the cap on 2026-08-09 and the drip stopped
 * for five days: 324 open board tasks frozen behind 20 cards Zaal could no
 * longer scroll back to. The count could only fall if he answered cards he
 * could not find, so it could never reach zero, and `grill JAMMED 20/20`
 * printed the identical string on every lane until it stopped being read
 * (noisy-signal-guard.md).
 *
 * The cap was always trying to measure "how much is in front of him right
 * now". 12h says that plainly: a card sent this morning is pressure, a card
 * sent on Saturday is not. Releasing the slot does NOT release the card -
 * nothing here removes anything, and the re-ask ladder in grill.ts brings old
 * cards back HARDER as they age (Zaal, 2026-08-11: "older cards must nag MORE
 * frequently, not expire").
 */
export const DRIP_DEFAULT: DripConfig = {
  everyMinutes: 2,
  // ZOE_GRILL_MAX_OUTSTANDING overrides the unanswered-card ceiling (Zaal,
  // 2026-08-17: "make sure the grill doesn't only max at 20"). Falls back to
  // 20 when unset or not a positive integer - never NaN into the gate.
  maxOutstanding: (() => {
    const raw = Number(process.env.ZOE_GRILL_MAX_OUTSTANDING);
    return Number.isInteger(raw) && raw > 0 ? raw : 20;
  })(),
  capWindowMs: 12 * 60 * 60 * 1000,
  startHour: 6,
  endHour: 22,
};

export interface DripInput {
  nowMs: number;
  /** Zaal's local hour, 0-23. */
  localHour: number;
  lastSentMs: number | null;
  outstanding: number;
  remainingInQueue: number;
  cfg?: DripConfig;
}

export function shouldSendNext(input: DripInput): { send: boolean; reason: string } {
  const cfg = input.cfg ?? DRIP_DEFAULT;
  if (input.remainingInQueue <= 0) return { send: false, reason: 'queue empty' };
  if (input.localHour < cfg.startHour || input.localHour >= cfg.endHour) {
    return { send: false, reason: `outside ${cfg.startHour}-${cfg.endHour}` };
  }
  if (input.outstanding >= cfg.maxOutstanding) {
    return { send: false, reason: `${input.outstanding} already unanswered - let him catch up` };
  }
  const since = input.lastSentMs === null ? Infinity : input.nowMs - input.lastSentMs;
  if (since < cfg.everyMinutes * 60_000) {
    return { send: false, reason: 'too soon since the last card' };
  }
  return { send: true, reason: 'due' };
}

/** What gets written into the task's notes, so every close explains itself. */
export function verdictNote(v: Verdict, date: string): string {
  const base = {
    done: 'confirmed done',
    keep: 'still wanted - kept open',
    work: 'sent to be worked on',
    drop: 'dropped - not doing it',
    skip: 'skipped for now',
  }[v.key];
  const note = v.note ? ` Zaal added: "${v.note}"` : '';
  return `GRILL ${date} (Telegram): ${base}.${note}`;
}

// ── reconcile (grill unification, card 6b6875d1) ────────────────────────────
// Zaal grills from BOTH ends - this Telegram drip and terminal grill sessions.
// The terminal end closes tasks and writes verdict lines into notes, and the
// Telegram state file has no idea: 23 stale asked-entries were hand-reconciled
// on 2026-08-19 (209 -> 186 outstanding). These helpers make that automatic.

/**
 * A terminal grill verdict as it actually appears in task notes, measured on
 * the live board 2026-08-19 (14/346 todo tasks): a line starting
 * "GRILL <date>" (terminal sessions stamp "(Zaal)", this file's own close path
 * stamps "(Telegram)") or "ZAAL VERDICT <date>". The Telegram variant only
 * ever lands on tasks this runner ALREADY answered, so matching it here is
 * harmless - reconcile only looks at unanswered entries.
 */
export const TERMINAL_VERDICT_RE =
  /(^|\n)\s*(GRILL \d{4}-\d{2}-\d{2}|ZAAL VERDICT \d{4}-\d{2}-\d{2})/;

/**
 * Classify one asked-entry's board row for reconcile.
 *
 *  - row missing (task deleted): 'board-closed' - there is nothing left to ask.
 *  - status no longer todo, or archived: 'board-closed' - the other end dealt
 *    with it; the card must stop counting and stop re-asking.
 *  - still todo but notes carry a terminal verdict: 'verdict-synced' - Zaal
 *    already ruled on it in a terminal; asking again on the phone is a dupe.
 *  - otherwise null: a genuinely open card, leave it alone.
 */
export function classifyReconcile(
  row: { status?: string; archived_at?: string | null; notes?: string | null } | undefined,
): 'board-closed' | 'verdict-synced' | null {
  if (!row) return 'board-closed';
  if (row.status !== 'todo' || row.archived_at) return 'board-closed';
  if (row.notes && TERMINAL_VERDICT_RE.test(row.notes)) return 'verdict-synced';
  return null;
}
