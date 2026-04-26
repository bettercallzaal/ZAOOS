import type { Context } from 'grammy';
import { dispatchHermesRun } from './runner';
import { getRun, listOpenRuns } from './db';
import type { TeamMember } from '../auth';

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

  if (!process.env.ANTHROPIC_API_KEY) {
    await ctx.reply('Hermes needs ANTHROPIC_API_KEY on the bot host. Not configured yet.');
    return;
  }

  const text = (ctx.message?.text ?? '').replace(/^\/fix(@\w+)?\s*/, '').trim();
  if (!text || text.length < 10) {
    await ctx.reply('Usage: /fix <issue> - describe the bug or feature in 1-3 sentences.');
    return;
  }

  const fromId = ctx.from?.id;
  const chatId = ctx.chat?.id;
  if (!fromId || !chatId) {
    await ctx.reply('Cannot identify sender or chat.');
    return;
  }

  await ctx.reply('Hermes starting. Coder writes diff, Critic grades, you get a PR link if score >=70. Max 3 attempts.');

  // Fire-and-forget: long-running, will report back via Telegram.
  void runAndReport(ctx, { triggered_by_telegram_id: fromId, triggered_in_chat_id: chatId, issue_text: text });
}

async function runAndReport(
  ctx: Context,
  input: { triggered_by_telegram_id: number; triggered_in_chat_id: number; issue_text: string },
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
