/**
 * ZAO Devz dual-bot runner.
 *
 * Boots TWO grammy bots in one Node process:
 *   - ZAODevzBot  (ZAO_DEVZ_BOT_TOKEN): handles `/fix`, runs Coder
 *   - HermesBot   (HERMES_BOT_TOKEN):   posts review/critique narration
 *
 * Both bots live in the ZAO Devz Telegram chat and narrate Hermes phases
 * as distinct identities so the conversation reads like two agents
 * checking each other's work.
 *
 * Telegram setup:
 *   1. Create two bots via @BotFather, get tokens
 *   2. Add both bots to the ZAO Devz private group (admin permission)
 *   3. Set ZAO_DEVZ_CHAT_ID to that group's chat id
 *   4. systemctl --user start zao-devz-stack
 */
import { config as loadEnv } from 'dotenv';
loadEnv();

import { Bot, Context } from 'grammy';
import { dispatchHermesRun, type HermesNarrator } from '../hermes/runner';
import { listOpenRuns, getRun } from '../hermes/db';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';

const devzToken = process.env.ZAO_DEVZ_BOT_TOKEN;
const hermesToken = process.env.HERMES_BOT_TOKEN;
const devzChatRaw = process.env.ZAO_DEVZ_CHAT_ID;

if (!devzToken) {
  console.error('Missing ZAO_DEVZ_BOT_TOKEN');
  process.exit(1);
}
if (!hermesToken) {
  console.error('Missing HERMES_BOT_TOKEN');
  process.exit(1);
}
if (!devzChatRaw) {
  console.error('Missing ZAO_DEVZ_CHAT_ID (the Telegram group id where both bots live)');
  process.exit(1);
}
const devzChatId = Number(devzChatRaw);
if (!Number.isFinite(devzChatId)) {
  console.error(`ZAO_DEVZ_CHAT_ID is not a number: ${devzChatRaw}`);
  process.exit(1);
}

const ADMIN_IDS = (process.env.BOT_ADMIN_TELEGRAM_IDS ?? '')
  .split(',')
  .map((s) => Number(s.trim()))
  .filter((n) => Number.isFinite(n) && n > 0);

const ZAAL_TG_ID = Number(process.env.ZAAL_TELEGRAM_ID ?? '0') || null;

// ---- Bot-name filter (must be declared before bots so it can be `use()`d
//      before any command handlers register).
interface UsernameHolder {
  value: string | null;
}

const devzUsernameHolder: UsernameHolder = { value: null };
const hermesUsernameHolder: UsernameHolder = { value: null };

function buildBotNameFilter(holder: UsernameHolder) {
  return async (ctx: Context, next: () => Promise<void>): Promise<void> => {
    if (!holder.value) {
      await next();
      return;
    }
    const me = holder.value.toLowerCase();
    const text = ctx.message?.text ?? '';
    const m = text.match(/^\/[\w]+@([\w]+)\b/);
    if (m) {
      const target = m[1].toLowerCase();
      if (target !== me) {
        // Tagged for a different bot - drop silently.
        return;
      }
    }
    await next();
  };
}

const devz = new Bot<Context>(devzToken);
const hermes = new Bot<Context>(hermesToken);

// Wire the filter middleware FIRST so it runs before any command handlers
// that get registered below. Holders are populated in boot() via getMe().
devz.use(buildBotNameFilter(devzUsernameHolder));
hermes.use(buildBotNameFilter(hermesUsernameHolder));

function isAdmin(ctx: Context): boolean {
  const id = ctx.from?.id;
  if (!id) return false;
  return ADMIN_IDS.includes(id);
}

async function checkClaudeOnPath(): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn('which', ['claude']);
    child.on('close', (code) => resolve(code === 0));
    child.on('error', () => resolve(false));
  });
}

// ---- Narrator: ZAODevzBot speaks as Coder, HermesBot speaks as Critic ------

function buildNarrator(): HermesNarrator {
  return {
    async onCoderStart(runId, attempt, max, issue) {
      const truncated = issue.length > 120 ? `${issue.slice(0, 120)}...` : issue;
      await devz.api.sendMessage(
        devzChatId,
        `Coder starting (attempt ${attempt}/${max}) on run ${runId.slice(0, 8)}\nIssue: ${truncated}\nModel: opus | Tools: Read/Edit/Write/Glob/Grep`,
      );
    },
    async onCoderDone(runId, attempt, files) {
      const list = files.slice(0, 8).map((f) => `  - ${f}`).join('\n');
      const more = files.length > 8 ? `\n  ...+${files.length - 8} more` : '';
      await devz.api.sendMessage(
        devzChatId,
        `Coder done on run ${runId.slice(0, 8)} (attempt ${attempt}). Changed ${files.length} files:\n${list}${more}\nHanding to @${hermesUsername()}.`,
      );
    },
    async onCriticStart(runId) {
      await hermes.api.sendMessage(
        devzChatId,
        `Reviewing run ${runId.slice(0, 8)}. Reading diff + source. Model: sonnet.`,
      );
    },
    async onCriticDone(runId, score, feedback) {
      const verdict = score >= 70 ? 'PASS' : score >= 50 ? 'NEEDS REVISION' : 'REJECT';
      await hermes.api.sendMessage(
        devzChatId,
        `Score ${score}/100 (${verdict}) on run ${runId.slice(0, 8)}\nFeedback: ${feedback}`,
      );
    },
    async onPrOpened(runId, prNumber, prUrl, score) {
      const cc = ZAAL_TG_ID ? `\ncc <a href="tg://user?id=${ZAAL_TG_ID}">Zaal</a> - push when good` : '';
      await hermes.api.sendMessage(
        devzChatId,
        `READY. Score ${score}/100. PR #${prNumber}: ${prUrl}\nRun: ${runId.slice(0, 8)}${cc}`,
        { parse_mode: 'HTML' },
      );
    },
    async onRetry(runId, nextAttempt, feedback) {
      await devz.api.sendMessage(
        devzChatId,
        `Retrying run ${runId.slice(0, 8)} (attempt ${nextAttempt}). Critic said: ${feedback}`,
      );
    },
    async onEscalated(runId, reason) {
      await hermes.api.sendMessage(
        devzChatId,
        `ESCALATED. Hit max attempts on run ${runId.slice(0, 8)}.\nLast critic feedback: ${reason}\nNeeds human.`,
      );
    },
    async onFailed(runId, reason) {
      await hermes.api.sendMessage(
        devzChatId,
        `FAILED. Run ${runId.slice(0, 8)} crashed.\nReason: ${reason}`,
      );
    },
  };
}

let _hermesUsername: string | null = null;
function hermesUsername(): string {
  return _hermesUsername ?? 'HermesBot';
}

// ---- ZAODevzBot commands ----------------------------------------------------

devz.command('start', async (ctx) => {
  await ctx.reply(
    [
      'ZAO Devz channel bot. I am the Coder half of the Hermes pair.',
      '',
      '/fix <issue> - I write a diff, HermesBot grades it, you get a PR if score >=70',
      '/help - command list',
      '/whoami - confirm chat id + your tg id',
    ].join('\n'),
  );
});

devz.command('help', async (ctx) => {
  await ctx.reply(
    [
      'ZAO Devz - Coder half',
      '',
      'Admin only:',
      '  /fix <issue> - dispatch Hermes loop',
      '  /fix_status [run_id_8chars] - check open runs',
      '',
      'Open:',
      '  /whoami - confirm chat + sender ids',
      '',
      'Pair: HermesBot reviews everything I write.',
    ].join('\n'),
  );
});

devz.command('whoami', async (ctx) => {
  await ctx.reply(`chat_id=${ctx.chat?.id}\nfrom_id=${ctx.from?.id}\nusername=${ctx.from?.username ?? 'none'}`);
});

devz.command('fix', async (ctx) => {
  if (!isAdmin(ctx)) {
    await ctx.reply('Hermes /fix is admin-only. Add yourself to BOT_ADMIN_TELEGRAM_IDS.');
    return;
  }
  if (ctx.chat?.id !== devzChatId) {
    await ctx.reply(`This bot only runs /fix from the ZAO Devz chat (id ${devzChatId}). You're in ${ctx.chat?.id}.`);
    return;
  }
  if (!existsSync(process.env.HERMES_CLAUDE_BIN ?? '/dev/null') && !(await checkClaudeOnPath())) {
    await ctx.reply("Can't find 'claude' CLI on PATH. Install Claude Code on the bot host (Max plan).");
    return;
  }
  const text = (ctx.message?.text ?? '').replace(/^\/fix(@\w+)?\s*/, '').trim();
  if (!text || text.length < 10) {
    await ctx.reply('Usage: /fix <issue> - describe the bug or feature in 1-3 sentences (10+ chars).');
    return;
  }
  const fromId = ctx.from?.id;
  if (!fromId) {
    await ctx.reply('Cannot identify sender.');
    return;
  }

  await ctx.reply('Got it. Spinning up the loop. Updates incoming from me + HermesBot.');

  // Fire-and-forget. Narrator surfaces progress.
  void runWithGuard({
    triggered_by_telegram_id: fromId,
    triggered_in_chat_id: devzChatId,
    issue_text: text,
  });
});

devz.command('fix_status', async (ctx) => {
  const arg = (ctx.message?.text ?? '').replace(/^\/fix_status(@\w+)?\s*/, '').trim();
  if (arg) {
    const matches = await findRunByPrefix(arg);
    if (!matches) {
      await ctx.reply(`No run matching ${arg}`);
      return;
    }
    await ctx.reply(formatRun(matches));
    return;
  }
  const open = await listOpenRuns(10);
  if (open.length === 0) {
    await ctx.reply('No open Hermes runs.');
    return;
  }
  await ctx.reply(open.map(formatRun).join('\n\n'));
});

// ---- HermesBot is mostly observer; expose a status command for visibility -----

hermes.command('start', async (ctx) => {
  await ctx.reply(
    [
      'HermesBot - the Critic half of the Hermes pair.',
      '',
      'I review everything ZAODevzBot writes. I grade 0-100. >=70 = ship, <70 = retry, max 3 attempts.',
      '',
      '/fix_status [run_id_8chars] - inspect a run',
      '/whoami - confirm chat + sender',
    ].join('\n'),
  );
});

hermes.command('whoami', async (ctx) => {
  await ctx.reply(`chat_id=${ctx.chat?.id}\nfrom_id=${ctx.from?.id}\nusername=${ctx.from?.username ?? 'none'}`);
});

hermes.command('fix_status', async (ctx) => {
  const arg = (ctx.message?.text ?? '').replace(/^\/fix_status(@\w+)?\s*/, '').trim();
  if (arg) {
    const r = await findRunByPrefix(arg);
    if (!r) {
      await ctx.reply(`No run matching ${arg}`);
      return;
    }
    await ctx.reply(formatRun(r));
    return;
  }
  const open = await listOpenRuns(10);
  if (open.length === 0) {
    await ctx.reply('No open Hermes runs to review.');
    return;
  }
  await ctx.reply(open.map(formatRun).join('\n\n'));
});

// ---- Helpers ---------------------------------------------------------------

interface MinimalRun {
  id: string;
  status: string;
  fixer_attempts: number;
  critic_score: number | null;
  pr_url: string | null;
  issue_text: string;
}

async function findRunByPrefix(prefix: string): Promise<MinimalRun | null> {
  if (prefix.length >= 36) {
    const r = await getRun(prefix);
    return r as MinimalRun | null;
  }
  const open = await listOpenRuns(50);
  return (open.find((r) => r.id.startsWith(prefix)) as MinimalRun | undefined) ?? null;
}

function formatRun(r: MinimalRun): string {
  const issue = r.issue_text.length > 80 ? `${r.issue_text.slice(0, 80)}...` : r.issue_text;
  return [
    `${r.id.slice(0, 8)} | ${r.status} | attempts=${r.fixer_attempts} | score=${r.critic_score ?? '-'}`,
    `issue: ${issue}`,
    r.pr_url ? `pr: ${r.pr_url}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

async function runWithGuard(input: {
  triggered_by_telegram_id: number;
  triggered_in_chat_id: number;
  issue_text: string;
}): Promise<void> {
  try {
    await dispatchHermesRun(input, buildNarrator());
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    try {
      await hermes.api.sendMessage(devzChatId, `Hermes crashed outside the loop: ${msg}`);
    } catch {
      console.error('[devz] failed to post crash notification', msg);
    }
  }
}

// ---- Boot ------------------------------------------------------------------

async function boot(): Promise<void> {
  const devzInfo = await devz.api.getMe();
  const hermesInfo = await hermes.api.getMe();
  _hermesUsername = hermesInfo.username ?? 'HermesBot';

  // Populate the username holders so the bot-name filter (already wired at
  // module top) can start dropping messages tagged for other bots.
  devzUsernameHolder.value = devzInfo.username ?? 'ZAODevZBot';
  hermesUsernameHolder.value = hermesInfo.username ?? 'HermesBot';
  console.log(`[devz] ZAODevzBot=@${devzInfo.username} HermesBot=@${hermesInfo.username} chat=${devzChatId}`);

  await Promise.all([
    devz.start({ drop_pending_updates: true, onStart: () => console.log('[devz] ZAODevzBot polling') }),
    hermes.start({ drop_pending_updates: true, onStart: () => console.log('[devz] HermesBot polling') }),
  ]);
}

boot().catch((err) => {
  console.error('[devz] boot failed', err);
  process.exit(1);
});

// graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[devz] SIGTERM - stopping bots');
  await Promise.allSettled([devz.stop(), hermes.stop()]);
  process.exit(0);
});
process.on('SIGINT', async () => {
  console.log('[devz] SIGINT - stopping bots');
  await Promise.allSettled([devz.stop(), hermes.stop()]);
  process.exit(0);
});
