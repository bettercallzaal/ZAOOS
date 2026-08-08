/**
 * teammate-heartbeat.ts - ask a teammate what they are on, so nobody has to police it.
 *
 * WHY (measured from a month of the Zaal/Iman thread, 2026-08-08)
 * -------------------------------------------------------------
 * Zaal, in Telegram: "Why didn't I get anything update wise past 24 hours. I
 * asked every 4 hours when we doing work."
 *
 * That expectation lived in his head and nowhere else. Nothing reminded Iman,
 * and nothing showed Zaal a heartbeat, so the gap was invisible until it was
 * 24 hours wide - at which point it surfaced as a confrontation rather than a
 * notification. Both people then spent an afternoon on it.
 *
 * THE TIMEZONE IS THE REAL MECHANISM
 * ---------------------------------
 * Iman wrote "it's Midnight here" at 6:06 PM Zaal's time, which puts him about
 * six hours ahead. So:
 *
 *   Zaal 09:00 -> Iman 15:00     the standing sync. Good.
 *   Zaal 14:00 -> Iman 20:00     end of real overlap
 *   Zaal 16:00 -> Iman 22:00     Zaal's stated build window starts
 *   Zaal 18:00 -> Iman 00:00     Iman's midnight
 *
 * Zaal's most productive hours are precisely when Iman is offline. The 2:54 PM
 * "why no update" landed at 8:54 PM Iman's time. Reading that silence as
 * unresponsiveness is a timezone artifact, not a work-ethic one - so this module
 * schedules in the TEAMMATE's local hours, never the asker's.
 *
 * WHERE IT POSTS: THE GROUP, NOT A DM
 * ----------------------------------
 * Zaal, 2026-08-08: "I don't want Zoe to directly dm him I want it to be in the
 * zao devz group."
 *
 * That is the better shape for three reasons. The check-in becomes a normal
 * team ritual rather than a manager tapping one person on the shoulder, which
 * is a very different thing to receive three times a day. Zaal sees the answer
 * where it is posted instead of needing it relayed to him. And the rest of the
 * team gets ambient awareness of what is moving, which a DM would keep private
 * to two people.
 *
 * The SILENCE alert is the exception and goes to Zaal privately. "No word from
 * X in 9h" is information a lead needs; announcing it to the group is a public
 * reprimand, and this module is not built to do that to anyone.
 *
 * WHAT IT DOES NOT DO
 * ------------------
 * It does not chase, escalate on a ladder, or nag. One question per slot, three
 * slots a day, inside working hours. If someone does not answer, that silence is
 * reported ONCE to the person who needs to know - and a check that fires
 * constantly is a check nobody reads (noisy-signal-guard).
 *
 * Pure by construction: every decision is a function of (now, config, last
 * activity), so the whole schedule is unit-testable without a clock, a network,
 * or a bot.
 */

/** Minutes past midnight, in the teammate's own local time. */
const HOUR = 60;

export interface HeartbeatConfig {
  /** team_members.legacy_owner, e.g. "iman". */
  slug: string;
  /** Hours ahead of UTC. Iman is +2; Zaal is -4 in EDT. */
  utcOffsetHours: number;
  /** First local hour it is acceptable to ask. */
  workStartHour: number;
  /** Last local hour it is acceptable to ask - no pings after this. */
  workEndHour: number;
  /** Hours between asks. */
  everyHours: number;
  /**
   * Telegram handle used to address them in the group. The ask is a group
   * message that mentions them, never a direct message.
   */
  mentionHandle: string;
}

/**
 * Iman's window, from the thread itself rather than a guess: he was active at
 * 09:01 Zaal-time (15:01 his) and signed off at "Midnight here".
 */
export const IMAN_DEFAULT: HeartbeatConfig = {
  slug: 'iman',
  utcOffsetHours: 2,
  workStartHour: 10,
  workEndHour: 20,
  everyHours: 4,
  mentionHandle: '@iman',
};

/** The teammate's local hour for a given UTC instant. */
export function localHour(nowUtcMs: number, utcOffsetHours: number): number {
  const utcMinutes = Math.floor(nowUtcMs / 60000) % (24 * HOUR);
  const local = (utcMinutes + utcOffsetHours * HOUR) % (24 * HOUR);
  return Math.floor(((local % (24 * HOUR)) + 24 * HOUR) % (24 * HOUR) / HOUR);
}

/**
 * The local hours at which this teammate gets asked.
 *
 * From workStart, stepping by everyHours, while still inside the window. For
 * Iman that is 10:00, 14:00, 18:00 - three a day, none at night.
 */
export function slotHours(cfg: HeartbeatConfig): number[] {
  const out: number[] = [];
  for (let h = cfg.workStartHour; h <= cfg.workEndHour; h += cfg.everyHours) out.push(h);
  return out;
}

export interface DueInput {
  nowUtcMs: number;
  cfg: HeartbeatConfig;
  /** When we last ASKED. Null if never. */
  lastAskedUtcMs: number | null;
  /** When the teammate last said or did anything. Null if never. */
  lastActivityUtcMs: number | null;
}

export interface DueResult {
  due: boolean;
  reason: string;
}

/**
 * Should we ask right now?
 *
 * Order matters and is cheapest-first. The activity check comes before the slot
 * check on purpose: someone who is visibly working should never be interrupted
 * to confirm that they are working. The ping exists to make SILENCE visible, not
 * to collect a status report from someone already talking.
 */
export function isAskDue(input: DueInput): DueResult {
  const { nowUtcMs, cfg, lastAskedUtcMs, lastActivityUtcMs } = input;
  const hour = localHour(nowUtcMs, cfg.utcOffsetHours);

  if (hour < cfg.workStartHour || hour > cfg.workEndHour) {
    return { due: false, reason: `outside working hours (their local ${hour}:00)` };
  }
  if (!slotHours(cfg).includes(hour)) {
    return { due: false, reason: `not a slot hour (their local ${hour}:00)` };
  }

  const sinceAsk = lastAskedUtcMs === null ? Infinity : nowUtcMs - lastAskedUtcMs;
  // Half a slot of slack absorbs a late cron tick without double-asking.
  if (sinceAsk < cfg.everyHours * 3600_000 * 0.5) {
    return { due: false, reason: 'already asked this slot' };
  }

  const sinceActivity = lastActivityUtcMs === null ? Infinity : nowUtcMs - lastActivityUtcMs;
  if (sinceActivity < cfg.everyHours * 3600_000) {
    return { due: false, reason: 'they have been active recently - no need to interrupt' };
  }

  return { due: true, reason: 'due' };
}

export interface SilenceInput {
  nowUtcMs: number;
  cfg: HeartbeatConfig;
  lastActivityUtcMs: number | null;
  /** When we last told the asker about silence. Prevents a repeating alarm. */
  lastAlertUtcMs: number | null;
}

/**
 * Has this gone quiet long enough that the asker should be told?
 *
 * Two slots without a word, during working hours. Reported at most once per
 * working day - the point is that Zaal learns in eight hours instead of
 * twenty-four, not that he gets a recurring alarm he starts ignoring.
 *
 * Never fires outside working hours, so a normal night is never an alert. That
 * single rule is what stops this becoming the check nobody reads.
 */
export function isSilenceAlertDue(input: SilenceInput): DueResult {
  const { nowUtcMs, cfg, lastActivityUtcMs, lastAlertUtcMs } = input;
  const hour = localHour(nowUtcMs, cfg.utcOffsetHours);
  if (hour < cfg.workStartHour || hour > cfg.workEndHour) {
    return { due: false, reason: 'their night - silence is expected' };
  }
  if (lastActivityUtcMs === null) {
    return { due: false, reason: 'no activity baseline yet' };
  }
  const quietMs = nowUtcMs - lastActivityUtcMs;
  if (quietMs < cfg.everyHours * 2 * 3600_000) {
    return { due: false, reason: 'not quiet long enough' };
  }
  const sinceAlert = lastAlertUtcMs === null ? Infinity : nowUtcMs - lastAlertUtcMs;
  if (sinceAlert < 12 * 3600_000) {
    return { due: false, reason: 'already reported today' };
  }
  return { due: true, reason: `quiet ${Math.floor(quietMs / 3600_000)}h during their working day` };
}

/**
 * The group message.
 *
 * Addressed to them by handle, posted in ZAO Devz. Short, because it is
 * answered on a phone mid-task; names the open work so the reply can be a tap
 * rather than a recall exercise; and never opens with a reprimand - in a group,
 * tone is the whole difference between a ritual and a summons.
 */
export function renderAsk(openTitles: string[], cfg: HeartbeatConfig = IMAN_DEFAULT): string {
  const lines = [`${cfg.mentionHandle} what are you on right now?`];
  if (openTitles.length > 0) {
    lines.push('');
    lines.push('Your open ones:');
    for (const t of openTitles.slice(0, 3)) lines.push(`- ${t.slice(0, 70)}`);
  }
  return lines.join('\n');
}

/** Buttons, always - tapping beats typing when you are mid-task on a phone. */
export function askButtons(openTitles: string[]): string[] {
  const b = openTitles.slice(0, 3).map((t) => `On: ${t.slice(0, 24)}`);
  b.push('Blocked - need Zaal');
  b.push('Something else');
  return b;
}

/** What the asker sees. States the local time so silence reads correctly. */
/**
 * The silence alert - sent to ZAAL PRIVATELY, never to the group.
 *
 * A lead needs to know; a group does not need to watch someone be named for
 * being quiet. Same information, chosen audience.
 */
export function renderSilenceAlert(cfg: HeartbeatConfig, quietHours: number, nowUtcMs: number): string {
  const theirHour = localHour(nowUtcMs, cfg.utcOffsetHours);
  return (
    `No word from ${cfg.slug} in ${quietHours}h. It is ${String(theirHour).padStart(2, '0')}:00 ` +
    `their time, so they should be working. Nudged them; telling you now rather than at the end of the day.`
  );
}
