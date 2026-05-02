import type { Context } from 'grammy';
import { dispatchHermesRun } from './runner';
import { countRunsByTelegramIdToday, getRun, listOpenRuns } from './db';
import type { HermesRepoTarget } from './types';
import type { TeamMember } from '../auth';

/**
 * Parse `/fix [<target>] <issue text>` where <target> is an optional repo
 * profile name. Returns the resolved target + the trimmed issue text.
 *
 * Examples:
 *   /fix tighten the hero copy           -> { target: 'zaoos', text: 'tighten the hero copy' }
 *   /fix zaostock drop the lineup TBA    -> { target: 'zaostock', text: 'drop the lineup TBA' }
 *   /fix zaoos rename auth helper        -> { target: 'zaoos', text: 'rename auth helper' }
 */
function parseFixCommand(rawText: string): { target: HermesRepoTarget; text: string } {
  const stripped = rawText.replace(/^\/fix(@\w+)?\s*/, '').trim();
  const firstWord = stripped.split(/\s+/)[0]?.toLowerCase() ?? '';
  if (firstWord === 'zaostock') {
    return { target: 'zaostock', text: stripped.slice(firstWord.length).trim() };
  }
  if (firstWord === 'zaoos') {
    return { target: 'zaoos', text: stripped.slice(firstWord.length).trim() };
  }
  return { target: 'zaoos', text: stripped };
}

const ZAAL_TG_ID = Number(process.env.ZAAL_TELEGRAM_ID ?? '0') || null;

function isAdmin(ctx: Context, member: TeamMember | null): boolean {
  const adminIds = (process.env.BOT_ADMIN_TELEGRAM_IDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const fromId = ctx.from?.id;
  if (!fromId) return false;
  if (adminIds.includes(String(fromId))) return true;
  if (member?.role === 'admin') return true;
  return false;
}

/**
 * /fix <issue text> - kicks off Hermes Coder + Critic loop.
 * Admin-only for v1 (gates spend).
 */
export async function cmdFix(ctx: Context, member: TeamMember | null): Promise<void> {
  if (!isAdmin(ctx, member)) {
    await ctx.reply('Hermes /fix is admin-only for v1. Ask Zaal to add you to BOT_ADMIN_TELEGRAM_IDS.');
    return;
  }

  // Hermes uses Claude Code CLI on the bot host (Max plan auth, no API key needed).
  // Verify the binary is on PATH before starting.
  const { existsSync } = await import('node:fs');
  const claudePath = process.env.HERMES_CLAUDE_BIN ?? '';
  const claudeOnPath =
    claudePath && existsSync(claudePath)
      ? true
      : await checkOnPath('claude');
  if (!claudeOnPath) {
    await ctx.reply(
      "Hermes can't find the 'claude' CLI on PATH. Install Claude Code on the bot host (Max plan), or set HERMES_CLAUDE_BIN.",
    );
    return;
  }

  const { target, text } = parseFixCommand(ctx.message?.text ?? '');
  if (!text || text.length < 10) {
    await ctx.reply('Usage: /fix [zaostock|zaoos] <issue> - describe the bug or feature in 1-3 sentences. Default target is zaoos.');
    return;
  }

  const fromId = ctx.from?.id;
  const chatId = ctx.chat?.id;
  if (!fromId || !chatId) {
    await ctx.reply('Cannot identify sender or chat.');
    return;
  }

  await ctx.reply(`Hermes starting against ${target}. Coder writes diff, Critic grades, you get a PR link if score >=70. Max 3 attempts.`);

  // Fire-and-forget: long-running, will report back via Telegram.
  void runAndReport(ctx, { triggered_by_telegram_id: fromId, triggered_in_chat_id: chatId, issue_text: text, target_repo: target });
}

async function runAndReport(
  ctx: Context,
  input: { triggered_by_telegram_id: number; triggered_in_chat_id: number; issue_text: string; target_repo?: HermesRepoTarget },
): Promise<void> {
  try {
    const result = await dispatchHermesRun(input);
    const r = result.run;
    if (result.kind === 'ready') {
      const pingZaal = ZAAL_TG_ID && ZAAL_TG_ID !== input.triggered_by_telegram_id ? `\n\ncc @${ZAAL_TG_ID}` : '';
      await ctx.api.sendMessage(
        input.triggered_in_chat_id,
        `Hermes READY. PR ${r.pr_url}\nCritic score: ${r.critic_score}/100\nAttempts: ${r.fixer_attempts}\nCost: $${r.estimated_cost_usd ?? 'n/a'}${pingZaal}\n\nPush when good.`,
      );
    } else if (result.kind === 'escalated') {
      await ctx.api.sendMessage(
        input.triggered_in_chat_id,
        `Hermes ESCALATED. Hit max ${r.fixer_max_attempts} attempts. Last feedback: ${result.reason}\nRun ID: ${r.id}`,
      );
    } else {
      await ctx.api.sendMessage(
        input.triggered_in_chat_id,
        `Hermes FAILED. ${result.reason}\nRun ID: ${r.id}`,
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await ctx.api.sendMessage(input.triggered_in_chat_id, `Hermes crashed outside the loop: ${msg}`);
  }
}

export async function cmdFixStatus(ctx: Context): Promise<void> {
  const text = (ctx.message?.text ?? '').replace(/^\/fix-status(@\w+)?\s*/, '').trim();
  if (text) {
    const run = await getRun(text);
    if (!run) {
      await ctx.reply(`No Hermes run with ID ${text}`);
      return;
    }
    await ctx.reply(formatRun(run));
    return;
  }
  const open = await listOpenRuns(10);
  if (open.length === 0) {
    await ctx.reply('No open Hermes runs.');
    return;
  }
  await ctx.reply(open.map(formatRun).join('\n\n'));
}

async function checkOnPath(bin: string): Promise<boolean> {
  const { spawn } = await import('node:child_process');
  return new Promise((resolve) => {
    const child = spawn('which', [bin]);
    child.on('close', (code) => resolve(code === 0));
    child.on('error', () => resolve(false));
  });
}

function formatRun(r: { id: string; status: string; fixer_attempts: number; critic_score: number | null; pr_url: string | null; issue_text: string }): string {
  const issue = r.issue_text.slice(0, 80) + (r.issue_text.length > 80 ? '...' : '');
  return [
    `${r.id.slice(0, 8)} | ${r.status} | attempts=${r.fixer_attempts} | score=${r.critic_score ?? '-'}`,
    `issue: ${issue}`,
    r.pr_url ? `pr: ${r.pr_url}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * /zsedit <issue> - team-facing direct website edit on bettercallzaal/zaostock.
 *
 * How it differs from /fix:
 *   - target_repo is HARDCODED to 'zaostock' (cannot be tricked into editing ZAO OS)
 *   - Open to any active team member (no admin gate)
 *   - Per-member daily cap (default 2/day, override via ZSEDIT_DAILY_PER_MEMBER)
 *   - Kill switch: set ZSEDIT_DISABLED=1 to pause all team edits without redeploying
 *
 * Why a separate command vs opening /fix to all:
 *   /fix can target any repo profile and is the admin's catch-all. /zsedit is
 *   the safe, scoped, rate-limited surface for the team. If costs spike or
 *   the team needs lockdown, flip ZSEDIT_DISABLED and /fix still works for
 *   admins.
 */
export async function cmdZsEdit(ctx: Context, member: TeamMember | null): Promise<void> {
  if (!member) {
    await ctx.reply('You need to be a registered team member to use /zsedit. Run /whoami to confirm or DM Zaal to get added.');
    return;
  }

  if (process.env.ZSEDIT_DISABLED === '1') {
    await ctx.reply('Team /zsedit is paused right now. /zsfb still works for logging feedback. Ping Zaal if it is urgent.');
    return;
  }

  const text = (ctx.message?.text ?? '').replace(/^\/zsedit(@\w+)?\s*/, '').trim();
  if (!text || text.length < 10) {
    await ctx.reply(
      [
        'Usage: /zsedit <change you want on the /test ZAOstock site>',
        '',
        'Examples:',
        '  /zsedit drop the lineup TBA placeholders, keep the section header',
        '  /zsedit hero copy too long - cut the second sentence',
        '  /zsedit add a "lineup drops Aug 2026" pill near the top',
        '',
        'I clone bettercallzaal/zaostock, write the diff, run a critic, and open a PR if it passes 70/100. Max 3 attempts.',
      ].join('\n'),
    );
    return;
  }

  const fromId = ctx.from?.id;
  const chatId = ctx.chat?.id;
  if (!fromId || !chatId) {
    await ctx.reply('Cannot identify sender or chat.');
    return;
  }

  // Per-member daily cap. Counts ALL runs by this telegram id today (including
  // failed/escalated) so spend pressure is honored even on retries.
  const dailyCap = Number(process.env.ZSEDIT_DAILY_PER_MEMBER ?? '2');
  let usedToday = 0;
  try {
    usedToday = await countRunsByTelegramIdToday(fromId);
  } catch (err) {
    console.error('[zsedit] daily cap query failed', err);
    // fail-open: if the count query breaks, still allow the run rather than
    // hard-blocking the team. Spend is still gated by the fleet daily cap in
    // runner.ts.
  }
  if (usedToday >= dailyCap) {
    await ctx.reply(
      `Daily /zsedit cap reached (${usedToday}/${dailyCap}). Resets at UTC midnight. Use /zsfb to log feedback for tomorrow's batch, or ping Zaal if it is urgent.`,
    );
    return;
  }

  // Reuse the same Claude CLI presence check /fix uses.
  const { existsSync } = await import('node:fs');
  const claudePath = process.env.HERMES_CLAUDE_BIN ?? '';
  const claudeOnPath = claudePath && existsSync(claudePath) ? true : await checkOnPath('claude');
  if (!claudeOnPath) {
    await ctx.reply("Hermes can't find the 'claude' CLI on the bot host. Ping Zaal.");
    return;
  }

  await ctx.reply(
    [
      `Hermes editing zaostock for ${member.name}. (${usedToday + 1}/${dailyCap} today.)`,
      'Coder writes diff, Critic grades, you get a PR link if score >=70. Max 3 attempts.',
    ].join('\n'),
  );

  void runAndReport(ctx, {
    triggered_by_telegram_id: fromId,
    triggered_in_chat_id: chatId,
    issue_text: text,
    target_repo: 'zaostock',
  });
}
