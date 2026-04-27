import { config as loadEnv } from 'dotenv';
loadEnv();

import { Bot, Context } from 'grammy';
import {
  resolveMember,
  linkUsernameToMember,
  unlinkUsername,
  type TeamMember,
} from './auth';
import { buildStatus, buildMyTodos, buildMyContributions, buildAllOpenTodos, buildTeamRoster } from './status';
import { addGemba, addIdea, addNote } from './capture';
import { executeFromText } from './actions';
import { ask } from './llm';
import { ensureChatRegistered, getChatRow, setChatMode, setPostDigests } from './group';
import { scheduleAll } from './schedule';
import { alertDevops, buildHealthReport } from './ops';
import { morningDigest, eveningRecap, weekAheadDigest, fridayRetro } from './digest';
import { cmdOp } from './onepagers';
import { cmdFix, cmdFixStatus } from './hermes/commands';
import {
  cmdCircles,
  cmdJoin,
  cmdLeave,
  cmdMyCircles,
  cmdCoordinators,
  cmdPropose,
  cmdProposals,
  cmdObject,
  cmdConsent,
  cmdBuddy,
  cmdRespect,
} from './circles';

const token = process.env.ZAOSTOCK_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('Missing ZAOSTOCK_BOT_TOKEN');
  process.exit(1);
}

const ADMIN_IDS = (process.env.BOT_ADMIN_TELEGRAM_IDS ?? '')
  .split(',')
  .map((s) => Number(s.trim()))
  .filter((n) => Number.isFinite(n) && n > 0);

const bot = new Bot<Context>(token);

// Register every chat we see (on first message).
bot.use(async (ctx, next) => {
  if (ctx.chat) {
    try {
      await ensureChatRegistered({
        chat_id: ctx.chat.id,
        chat_type: ctx.chat.type,
        title: 'title' in ctx.chat ? (ctx.chat.title ?? '') : '',
        forum_enabled: 'is_forum' in ctx.chat ? Boolean(ctx.chat.is_forum) : false,
      });
    } catch {
      /* ignore */
    }
  }
  await next();
});

async function currentMember(ctx: Context): Promise<TeamMember | null> {
  return resolveMember(ctx.from?.id, ctx.from?.username);
}

async function requireMember(ctx: Context): Promise<TeamMember | null> {
  const member = await currentMember(ctx);
  if (member) return member;
  const u = ctx.from?.username ? `@${ctx.from.username}` : 'your account';
  await ctx.reply(`Not on the roster yet. Ping Zaal to link ${u}.`);
  return null;
}

function isAdmin(ctx: Context): boolean {
  const id = ctx.from?.id;
  if (!id) return false;
  return ADMIN_IDS.includes(id);
}

// ---- Commands ---------------------------------------------------------------

bot.command('start', async (ctx) => {
  const member = await currentMember(ctx);
  if (member) {
    await ctx.reply(
      [
        `Hey ${member.name}. Dashboard is your hub: https://zaoos.com/stock/team`,
        '',
        'Bot is backup. Useful for:',
        '  /mytodos - what you are owning',
        '  /do <text> - tell me what happened, I update the board',
        '  /circles - the 8 circles, /join <slug> to grab one',
        '  /op - 1-pagers (sponsor / partner / venue briefings)',
        '  /digest morning - daily brief',
        '  /ask - ask me anything',
        '  /help - full list',
      ].join('\n'),
    );
    return;
  }
  const u = ctx.from?.username ? `@${ctx.from.username}` : 'your account';
  await ctx.reply(
    [
      `Hey - I'm the ZAOstock Team Bot. ZAO Festivals presents ZAOstock, Oct 3 in Ellsworth.`,
      '',
      `Don't recognize ${u} on the roster yet. Ping Zaal to link you.`,
      '',
      'Open to anyone: /status /help /ask /press',
      'Dashboard: https://zaoos.com/stock/team',
    ].join('\n'),
  );
});

bot.command('help', async (ctx) => {
  const isGroup = ctx.chat?.type !== 'private';
  await ctx.reply(
    [
      'ZAOstock Team Bot - I save you typing. Dashboard has the context.',
      '',
      'Read:',
      '  /status - festival snapshot, top blockers',
      '  /mytodos - what you are owning',
      '  /mytodos_all - everything open across the team (claimable)',
      '  /mycontributions - your last 7 days',
      '  /digest morning|evening|week|retro - the brief I post automatically',
      '',
      'Tell me what happened:',
      '  /do <text> - I parse + update the board',
      '  /idea <text> - drop into the pool, Zaal sees daily',
      '  /note <text> - meeting note, goes to dashboard',
      '  /gemba <text> - quick standup log',
      '',
      'Ask me anything:',
      '  /ask <question> - LLM reply, no DB write',
      '  /whoami - confirm who I think you are',
      '',
      'Circles:',
      '  /circles - all 8 + who coordinates',
      '  /join <slug> - grab one (music, ops, partners, finance, merch, marketing, media, host)',
      '  /leave <slug> - step out',
      '  /mycircles - what you are in',
      '',
      '1-pagers (sponsor / partner / venue briefings):',
      '  /op - list',
      '  /op <slug> - read one',
      '  /op <slug> status <draft|review|final|sent|archived>',
      '  /op <slug> note <text> - log activity',
      '  /op <slug> share <recipient> - log a send',
      '  /op <slug> append <text> - extend the body',
      '',
      'External (anyone, no link needed):',
      '  /press - press kit + contact info',
      '',
      'Hermes (admin only, runs via Claude Code CLI on Max plan):',
      '  /fix <issue> - Coder writes diff, Critic grades, you get a PR if score >=70',
      '  /fix_status [run_id] - check open Hermes runs',
      '',
      'Ops:',
      '  /chatinfo - chat + topic ids',
      isGroup
        ? '\n@mention me in a group to act. I respond only when tagged.'
        : '\nIn DM I auto-parse plain text. Just type what happened.',
      'Dashboard is your hub: https://zaoos.com/stock/team',
    ].join('\n'),
  );
});

bot.command('status', async (ctx) => {
  await ctx.reply(await buildStatus());
});

bot.command('mytodos', async (ctx) => {
  const member = await requireMember(ctx);
  if (!member) return;
  await ctx.reply(await buildMyTodos(member));
});

bot.command('mytodos_all', async (ctx) => {
  await ctx.reply(await buildAllOpenTodos());
});

bot.command('mycontributions', async (ctx) => {
  const member = await requireMember(ctx);
  if (!member) return;
  await ctx.reply(await buildMyContributions(member));
});

bot.command('fix', async (ctx) => {
  const member = await resolveMember(ctx.from?.id, ctx.from?.username);
  await cmdFix(ctx, member);
});

bot.command('fix_status', async (ctx) => {
  await cmdFixStatus(ctx);
});

bot.command('press', async (ctx) => {
  await ctx.reply(
    [
      'ZAO Festivals presents ZAOstock - Year 1, Oct 3 2026, Ellsworth Maine.',
      '',
      'Press kit + 1-pagers: https://zaoos.com/stock/onepagers',
      'Public overview: https://zaoos.com/stock/onepagers/overview',
      'Landing page: https://zaoos.com/stock',
      '',
      'Run by The ZAO (ZTalent Artist Organization). Music first.',
      '',
      'For interviews, photo passes, sponsor inquiries, partnership:',
      '  zaal@thezao.com',
      '',
      'Newsletter: https://paragraph.com/@thezao',
    ].join('\n'),
  );
});

bot.command('gemba', async (ctx) => {
  const member = await requireMember(ctx);
  if (!member) return;
  await ctx.reply(await addGemba(member, ctx.match));
});

bot.command('idea', async (ctx) => {
  const member = await requireMember(ctx);
  if (!member) return;
  await ctx.reply(await addIdea(member, ctx.match));
});

bot.command('note', async (ctx) => {
  const member = await requireMember(ctx);
  if (!member) return;
  await ctx.reply(await addNote(member, ctx.match));
});

bot.command('ask', async (ctx) => {
  const text = ctx.match?.trim();
  if (!text) {
    await ctx.reply('Usage: /ask <question>');
    return;
  }
  try {
    const reply = await ask(
      text,
      `You are the ZAOstock Team Bot advisor. Answer briefly (under 300 words). If the user is asking about festival state, tell them to use /status or /mytodos.`,
    );
    await ctx.reply(reply.text);
  } catch (err) {
    await ctx.reply(`Couldn't reach LLM: ${err instanceof Error ? err.message : 'unknown'}`);
  }
});

bot.command('do', async (ctx) => {
  const member = await requireMember(ctx);
  if (!member) return;
  const text = ctx.match?.trim();
  if (!text) {
    await ctx.reply(
      'Usage: /do <natural language>. Examples:\n  /do add todo call Bangor Savings by Friday\n  /do mark Bangor Savings as contacted\n  /do add milestone merch order 2026-09-01',
    );
    return;
  }
  await ctx.reply('Working on it...');
  const result = await executeFromText(member, text);
  await ctx.reply(result.reply);
});

bot.command('chatinfo', async (ctx) => {
  const chat = ctx.chat;
  if (!chat) return;
  const threadId = ctx.message?.message_thread_id;
  const row = await getChatRow(chat.id);
  await ctx.reply(
    [
      'Chat info:',
      `  chat_id: ${chat.id}`,
      `  type: ${chat.type}`,
      `  title: ${'title' in chat ? chat.title ?? '(DM)' : '(DM)'}`,
      `  forum: ${'is_forum' in chat ? Boolean(chat.is_forum) : false}`,
      threadId != null
        ? `  message_thread_id: ${threadId}`
        : '  (no thread_id - posted in General or non-forum chat)',
      '',
      `  mode: ${row?.mode ?? 'unknown'}`,
      `  post_digests: ${row?.post_digests ?? false}`,
    ].join('\n'),
  );
});

// ---- Admin commands ---------------------------------------------------------

bot.command('setmode', async (ctx) => {
  if (!isAdmin(ctx)) {
    await ctx.reply('Admin only.');
    return;
  }
  const parts = (ctx.match ?? '').trim().split(/\s+/);
  if (parts.length !== 2) {
    await ctx.reply('Usage: /setmode <chat_id> <team|devops|staging>');
    return;
  }
  const chatId = Number(parts[0]);
  const mode = parts[1] as 'team' | 'devops' | 'staging';
  if (!['team', 'devops', 'staging'].includes(mode)) {
    await ctx.reply('mode must be team | devops | staging');
    return;
  }
  await setChatMode(chatId, mode);
  await ctx.reply(`Set chat ${chatId} mode to ${mode}.`);
});

bot.command('setdigests', async (ctx) => {
  if (!isAdmin(ctx)) {
    await ctx.reply('Admin only.');
    return;
  }
  const parts = (ctx.match ?? '').trim().split(/\s+/);
  if (parts.length !== 2) {
    await ctx.reply('Usage: /setdigests <chat_id> on|off');
    return;
  }
  const chatId = Number(parts[0]);
  const on = parts[1] === 'on';
  await setPostDigests(chatId, on);
  await ctx.reply(`Set chat ${chatId} post_digests to ${on}.`);
});

bot.command('link', async (ctx) => {
  if (!isAdmin(ctx)) {
    await ctx.reply('Admin only.');
    return;
  }
  const raw = (ctx.match ?? '').trim();
  const m = raw.match(/^(@?\S+)\s+(.+)$/);
  if (!m) {
    await ctx.reply('Usage: /link @username Member Name\nExample: /link @dfreshmaker DFresh');
    return;
  }
  const [, username, memberName] = m;
  const res = await linkUsernameToMember(username, memberName);
  if (!res.ok) {
    await ctx.reply(`Link failed: ${res.reason}`);
    return;
  }
  await ctx.reply(
    `Linked @${res.member.telegram_username} -> ${res.member.name} (${res.member.role}${
      res.member.scope ? ` / ${res.member.scope}` : ''
    }).`,
  );
});

bot.command('unlink', async (ctx) => {
  if (!isAdmin(ctx)) {
    await ctx.reply('Admin only.');
    return;
  }
  const raw = (ctx.match ?? '').trim();
  if (!raw) {
    await ctx.reply('Usage: /unlink @username');
    return;
  }
  const res = await unlinkUsername(raw);
  if (!res.ok) {
    await ctx.reply(res.reason);
    return;
  }
  await ctx.reply(`Unlinked @${raw.replace(/^@/, '').toLowerCase()} (was ${res.name}).`);
});

bot.command('whoami', async (ctx) => {
  const member = await currentMember(ctx);
  if (!member) {
    const u = ctx.from?.username ? `@${ctx.from.username}` : '(no username)';
    await ctx.reply(`Not linked. Your Telegram: id=${ctx.from?.id ?? '?'}, ${u}`);
    return;
  }
  await ctx.reply(
    `${member.name} (${member.role}${member.scope ? ` / ${member.scope}` : ''}) - linked via @${member.telegram_username ?? '(id only)'}.`,
  );
});

bot.command('ping', async (ctx) => {
  await ctx.reply(`pong ${Date.now()}`);
});

bot.command('version', async (ctx) => {
  await ctx.reply('v1.6 hermes loop');
});

bot.command('health', async (ctx) => {
  if (!isAdmin(ctx)) {
    await ctx.reply('Admin only.');
    return;
  }
  await ctx.reply(await buildHealthReport());
});

bot.command('digest', async (ctx) => {
  const which = (ctx.match ?? '').trim().toLowerCase();
  let text: string;
  try {
    if (which === 'evening') text = await eveningRecap();
    else if (which === 'week') text = await weekAheadDigest();
    else if (which === 'retro') text = await fridayRetro();
    else text = await morningDigest();
  } catch (err) {
    text = `Digest failed: ${err instanceof Error ? err.message : 'unknown'}`;
  }
  await ctx.reply(text);
});

// ---- One-pagers (sponsor/partner/venue briefings) --------------------------

bot.command('op', async (ctx) => {
  const member = await currentMember(ctx);
  await cmdOp(ctx, member);
});

bot.command('team', async (ctx) => {
  await ctx.reply(await buildTeamRoster());
});

// ---- Circles governance commands -------------------------------------------

bot.command('circles', async (ctx) => {
  await cmdCircles(ctx);
});

bot.command('join', async (ctx) => {
  const member = await requireMember(ctx);
  if (!member) return;
  const slug = (ctx.match ?? '').trim().toLowerCase();
  if (!slug) {
    await ctx.reply('Usage: /join <circle-slug>\nExample: /join music');
    return;
  }
  await cmdJoin(ctx, member, slug);
});

bot.command('leave', async (ctx) => {
  const member = await requireMember(ctx);
  if (!member) return;
  const slug = (ctx.match ?? '').trim().toLowerCase();
  if (!slug) {
    await ctx.reply('Usage: /leave <circle-slug>');
    return;
  }
  await cmdLeave(ctx, member, slug);
});

bot.command('mycircles', async (ctx) => {
  const member = await requireMember(ctx);
  if (!member) return;
  await cmdMyCircles(ctx, member);
});

bot.command('coordinators', async (ctx) => {
  await cmdCoordinators(ctx);
});

bot.command('propose', async (ctx) => {
  const member = await requireMember(ctx);
  if (!member) return;
  const args = (ctx.match ?? '').trim();
  if (!args) {
    await ctx.reply('Usage: /propose <circle-slug> <title> | <body>');
    return;
  }
  await cmdPropose(ctx, member, args);
});

bot.command('proposals', async (ctx) => {
  const member = await requireMember(ctx);
  if (!member) return;
  await cmdProposals(ctx, member);
});

bot.command('object', async (ctx) => {
  const member = await requireMember(ctx);
  if (!member) return;
  const args = (ctx.match ?? '').trim();
  if (!args) {
    await ctx.reply('Usage: /object <proposal-id> <reason>');
    return;
  }
  await cmdObject(ctx, member, args);
});

bot.command('consent', async (ctx) => {
  const member = await requireMember(ctx);
  if (!member) return;
  const proposalId = (ctx.match ?? '').trim();
  if (!proposalId) {
    await ctx.reply('Usage: /consent <proposal-id>');
    return;
  }
  await cmdConsent(ctx, member, proposalId);
});

bot.command('buddy', async (ctx) => {
  const member = await requireMember(ctx);
  if (!member) return;
  await cmdBuddy(ctx, member);
});

bot.command('respect', async (ctx) => {
  const member = await requireMember(ctx);
  if (!member) return;
  await cmdRespect(ctx, member);
});

// ---- Free-text + @mention handler ------------------------------------------

let cachedUsername: string | null = null;
async function ensureUsername(): Promise<string> {
  if (cachedUsername) return cachedUsername;
  const me = await bot.api.getMe();
  cachedUsername = me.username?.toLowerCase() ?? '';
  return cachedUsername;
}

bot.on('message:text', async (ctx) => {
  const text = ctx.message.text.trim();
  if (text.startsWith('/')) return; // commands handled above
  const chatType = ctx.chat?.type ?? 'private';

  if (chatType === 'private') {
    const member = await requireMember(ctx);
    if (!member) return;
    await ctx.reply('Working on it...');
    const result = await executeFromText(member, text);
    await ctx.reply(result.reply);
    return;
  }

  // Group / supergroup: respond ONLY when @mentioned
  const username = await ensureUsername();
  const mentioned = username && text.toLowerCase().includes(`@${username}`);
  if (!mentioned) return;

  const member = await requireMember(ctx);
  if (!member) return;

  const cleaned = text.replace(new RegExp(`@${username}`, 'gi'), '').trim();
  if (!cleaned) {
    await ctx.reply(`Hi ${member.name}. Tag me with something like "@${username} add todo X" or ask a question.`);
    return;
  }
  await ctx.reply('Working on it...');
  const result = await executeFromText(member, cleaned);
  await ctx.reply(result.reply);
});

// ---- Error hook -------------------------------------------------------------

bot.catch((err) => {
  console.error('[zaostock-bot] error:', err);
  alertDevops(bot, `error: ${err?.message ?? String(err)}`).catch(() => undefined);
});

// ---- Startup ---------------------------------------------------------------

console.log('[zaostock-bot] starting...');
bot.start({
  onStart: async (info) => {
    console.log(`[zaostock-bot] running as @${info.username}`);
    cachedUsername = info.username.toLowerCase();
    scheduleAll(bot, (err, label) => {
      console.error(`[schedule] ${label} failed:`, err);
      alertDevops(bot, `${label} digest failed: ${err instanceof Error ? err.message : 'unknown'}`).catch(
        () => undefined,
      );
    });
    alertDevops(bot, `bot started · @${info.username} · ${new Date().toISOString()}`).catch(() => undefined);
  },
});

process.on('SIGTERM', () => {
  alertDevops(bot, 'bot stopping (SIGTERM)').catch(() => undefined);
  bot.stop();
});
process.on('SIGINT', () => {
  alertDevops(bot, 'bot stopping (SIGINT)').catch(() => undefined);
  bot.stop();
});
