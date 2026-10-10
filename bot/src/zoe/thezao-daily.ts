/**
 * thezao-daily.ts - the morning test.thezao.com message.
 *
 * Zaal, 2026-10-10 (seat grill items 83 and 84): "i wanna start using that
 * test.thezao.com more ask me to reveiw it way more each day ... share each day
 * with a new community memeber each day give me a copy and paste one sentance".
 * Ruled: one message each morning, via ZOE on Telegram, with what changed on
 * the site since yesterday, one thing for him to review, and a copy-paste
 * invite sentence naming one member and one page. He replies with feedback.
 *
 * ZOE DOES NOT WRITE ANY OF IT. The thezao lane knows what changed and the
 * zao-core lane picks the member; ZOE is the courier. Both write dated lines
 * into the vault, and this reads them from origin/main the way
 * terminals-digest.ts reads the seat's page (the VPS working tree is stale; the
 * ref is not):
 *
 *   notes/thezao-daily-changes.md   one line per change, each starting with its
 *                                   date. A line whose text starts "review:" is
 *                                   the day's review item.
 *   notes/thezao-daily-invite.md    one dated line per day, newest last: the
 *                                   sentence he pastes.
 *
 *   2026-10-11 The /community page now loads member photos.
 *   2026-10-11 review: does the Join button on the home page read right?
 *
 * ONLY TODAY'S LINES ARE SENT (Eastern date). Yesterday's invite named
 * yesterday's member; sending it again would have him invite the same person
 * twice. A missing part is named as missing in the message, never filled in
 * and never silently dropped, so a feed that stopped is visible the first
 * morning it stops.
 *
 * The invite goes out as its OWN message, nothing else in it, so it can be
 * copied with one long-press. His reply to the main message is recorded as the
 * answer to qid `thezao-<date>` (message-context.ts + handleReplyRoute), which
 * the thezao lane reads with zao-ask-check and closes with zao-ask-done.
 *
 * Off unless ZOE_THEZAO_DAILY=1. Scheduled by ZOE_THEZAO_DAILY_CRON (UTC).
 */
import { readVaultFiles, vaultDir } from './terminals-digest';
import { easternDay, wasSendBlocked } from './send-budget';
import { recordMessageContext } from './message-context';

export const CHANGES_PATH = 'notes/thezao-daily-changes.md';
export const INVITE_PATH = 'notes/thezao-daily-invite.md';
export const SITE = 'test.thezao.com';
const MAX_CHANGES = 8;
const MAX_LINE = 300;

export function thezaoDailyEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.ZOE_THEZAO_DAILY === '1';
}

export interface DatedLine {
  date: string;
  text: string;
}

/**
 * Pure. Every line that starts with a date, in file order. Accepts the forms a
 * lane will actually write: "2026-10-11 text", "- 2026-10-11: text",
 * "2026-10-11 | text". Headings, prose and blank lines are ignored.
 */
export function parseDatedLines(text: string): DatedLine[] {
  const out: DatedLine[] = [];
  for (const raw of text.split('\n')) {
    // The date must END there: a space or a separator follows it. Without that,
    // "2026-10-11T09:00 text" read as the date plus the text "T09:00 text".
    const m = /^\s*(?:[-*]\s+)?(\d{4}-\d{2}-\d{2})(?:\s*[:|]\s*|\s+-\s+|\s+)(\S.*?)\s*$/.exec(raw);
    if (!m) continue;
    out.push({ date: m[1], text: m[2] });
  }
  return out;
}

export interface DailyParts {
  changes: string[];
  review: string | null;
  invite: string | null;
}

/** Pure. Today's parts only. A null file (not written yet) reads as no lines. */
export function buildDailyParts(changesFile: string | null, inviteFile: string | null, today: string): DailyParts {
  const changes: string[] = [];
  let review: string | null = null;
  for (const l of parseDatedLines(changesFile ?? '')) {
    if (l.date !== today) continue;
    const r = /^review\s*:\s*(.+)$/i.exec(l.text);
    if (r) review = r[1].trim();
    else changes.push(l.text);
  }
  // The NEWEST line decides, not any line dated today: the contract is "newest
  // last", so a file whose last line is older has no sentence for today.
  const invites = parseDatedLines(inviteFile ?? '');
  const last = invites[invites.length - 1];
  const invite = last && last.date === today ? last.text : null;
  return { changes, review, invite };
}

const clip = (s: string) => (s.length > MAX_LINE ? `${s.slice(0, MAX_LINE - 3)}...` : s);

/** Pure. The main message. The invite sentence is NOT in it; see formatInvite. */
export function formatDaily(p: DailyParts, today: string, opts: { fetched: boolean }): string {
  const lines = [`${SITE} - ${today}`];
  if (!opts.fetched) lines.push('Could not reach the vault; this is the last copy the VPS had.');
  lines.push('');
  if (p.changes.length) {
    lines.push('What changed since yesterday:');
    for (const c of p.changes.slice(0, MAX_CHANGES)) lines.push(`- ${clip(c)}`);
    if (p.changes.length > MAX_CHANGES) lines.push(`- and ${p.changes.length - MAX_CHANGES} more (${CHANGES_PATH})`);
  } else {
    lines.push('What changed since yesterday: nothing was written for today.');
  }
  lines.push('');
  lines.push(p.review ? `One thing to review: ${clip(p.review)}` : 'One thing to review: none was written for today.');
  lines.push('');
  lines.push(
    p.invite
      ? "Today's invite sentence is the next message. Copy it and send it."
      : 'No invite sentence today.',
  );
  lines.push('');
  lines.push('Reply to this message with your feedback.');
  return lines.join('\n');
}

/** 'partial': the main message went out and the invite it promised did not. */
export type DailyResult = 'off' | 'sent' | 'blocked' | 'failed' | 'partial';

export interface DailyDeps {
  /** Send one message; resolves with Telegram's result (message_id when sent). */
  send: (text: string) => Promise<unknown>;
  now?: Date;
  read?: () => Promise<{ files: Record<string, string | null>; fetched: boolean }>;
  recordContext?: typeof recordMessageContext;
}

/** One morning send: the main message, then the invite sentence alone. */
export async function sendThezaoDaily(deps: DailyDeps): Promise<DailyResult> {
  if (!thezaoDailyEnabled()) return 'off';
  const today = easternDay(deps.now ?? new Date());
  let page: { files: Record<string, string | null>; fetched: boolean };
  try {
    page = await (deps.read ?? (() => readVaultFiles(vaultDir(), [CHANGES_PATH, INVITE_PATH])))();
  } catch (error: unknown) {
    console.error('[zoe/thezao-daily] could not read the vault:', (error as Error)?.message);
    await deps.send(
      `${SITE} - ${today}\nCould not read the vault on the VPS, so there is no update this morning. ${(error as Error)?.message?.slice(0, 160) ?? ''}`,
    );
    return 'failed';
  }
  const parts = buildDailyParts(page.files[CHANGES_PATH] ?? null, page.files[INVITE_PATH] ?? null, today);
  const sent = await deps.send(formatDaily(parts, today, { fetched: page.fetched }));
  // A budget-blocked send RESOLVES. Promising "the next message" and then
  // sending the invite on its own, under nothing, would be worse than silence.
  if (wasSendBlocked(sent)) return 'blocked';
  const mid = sent && typeof sent === 'object' ? (sent as { message_id?: number }).message_id : undefined;
  if (mid) {
    await (deps.recordContext ?? recordMessageContext)(mid, { qid: `thezao-${today}` }).catch((e) =>
      console.error('[zoe/thezao-daily] could not record reply context:', (e as Error)?.message),
    );
  }
  if (parts.invite) {
    // The main message has already promised this one. If it is blocked or
    // throws, say so in the log and in the result: 'sent' would be a lie, and
    // a throw here would lose the fact that the main message did go out.
    let invite: unknown;
    try {
      invite = await deps.send(parts.invite);
    } catch (error: unknown) {
      console.error('[zoe/thezao-daily] the invite sentence failed to send:', (error as Error)?.message);
      return 'partial';
    }
    if (wasSendBlocked(invite)) {
      console.error('[zoe/thezao-daily] the invite sentence was blocked by the send budget');
      return 'partial';
    }
  }
  return 'sent';
}
