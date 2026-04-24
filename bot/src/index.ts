import { config as loadEnv } from 'dotenv';
loadEnv();

import { Bot, Context, session, SessionFlavor } from 'grammy';
import { findMemberByTelegramId, linkTelegramId, type TeamMember } from './auth';
import { buildStatus, buildMyTodos, buildMyContributions } from './status';
import { addGemba, addIdea, addNote } from './capture';
import { executeFromText } from './actions';
import { ask } from './llm';
import { ensureChatRegistered, getChatRow, setChatMode, setPostDigests } from './group';
import { scheduleAll } from './schedule';
import { alertDevops, buildHealthReport } from './ops';
import { morningDigest, eveningRecap, weekAheadDigest, fridayRetro } from './digest';

interface SessionData {
  awaitingCode: boolean;
}

type MyContext = Context & SessionFlavor<SessionData>;

const token = process.env.ZAOSTOCK_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('Missing ZAOSTOCK_BOT_TOKEN');
  process.exit(1);
}

const ADMIN_IDS = (process.env.BOT_ADMIN_TELEGRAM_IDS ?? '')
  .split(',')
  .map((s) => Number(s.trim()))
  .filter((n) => Number.isFinite(n) && n > 0);

const bot = new Bot<MyContext>(token);

bot.use(session({ initial: (): SessionData => ({ awaitingCode: false }) }));

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

async function requireMember(ctx: MyContext): Promise<TeamMember | null> {
  const tgId = ctx.from?.id;
  if (!tgId) {
    await ctx.reply('Could not read your Telegram id.');
    return null;
  }
  const member = await findMemberByTelegramId(tgId);
  if (!member) {
    ctx.session.awaitingCode = true;
    await ctx.reply('I need to verify you first. DM me (not in the group) and send your 4-letter ZAOstock code.');
    return null;
  }
  return member;
}

function isAdmin(ctx: MyContext): boolean {
  const id = ctx.from?.id;
  if (!id) return false;
  return ADMIN_IDS.includes(id);
}

// ---- Commands ---------------------------------------------------------------

bot.command('start', async (ctx) => {
  const tgId = ctx.from?.id;
  if (!tgId) return;
  const member = await findMemberByTelegramId(tgId);
  if (member) {
    await ctx.reply(`You're already linked, ${member.name}. Try /help to see what I can do.`);
    return;
  }
  ctx.session.awaitingCode = true;
  await ctx.reply(
    'Hey! Send your 4-letter ZAOstock login code to link this Telegram to your teammate profile. (Same code you use on zaoos.com/stock/team.)',
  );
});

bot.command('help', async (ctx) => {
  const isGroup = ctx.chat?.type !== 'private';
  await ctx.reply(
    [
      'ZAOstock Team Bot - v1.5',
      '',
      'Read:',
      '  /status - festival snapshot',
      '  /mytodos - your open todos',
      '  /mycontributions - your last 7 days',
      '',
      'Act (I do stuff via LLM parse):',
      '  /do <text> - natural language -> DB action',
      '  /ask <text> - ask me anything (no DB write)',
      '',
      'Capture:',
      '  /gemba <text> - quick standup log',
      '  /idea <text> - drop a suggestion',
      '  /note <text> - add to next meeting notes',
      '',
      'Ops:',
      '  /chatinfo - show chat + topic ids (for setup)',
      '  /health - bot health (admin only)',
      '  /digest morning|evening|week|retro - preview a digest on demand',
      isGroup ? '\n@mention me in a group to act. I respond only when tagged.' : '\nIn DM I auto-parse plain text as an action.',
      'Dashboard: https://zaoos.com/stock/team',
    ].join('\n'),
  );
});

bot.command('status', async (ctx) => {
  const member = await requireMember(ctx);
  if (!member) return;
  await ctx.reply(await buildStatus());
});

bot.command('mytodos', async (ctx) => {
  const member = await requireMember(ctx);
  if (!member) return;
  await ctx.reply(await buildMyTodos(member));
});

bot.command('mycontributions', async (ctx) => {
  const member = await requireMember(ctx);
  if (!member) return;
  await ctx.reply(await buildMyContributions(member));
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
  const member = await requireMember(ctx);
  if (!member) return;
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
    await ctx.reply('Usage: /do <natural language>. Examples:\n  /do add todo call Bangor Savings by Friday\n  /do mark Bangor Savings as contacted\n  /do add milestone merch order 2026-09-01');
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
      threadId != null ? `  message_thread_id: ${threadId}` : '  (no thread_id - posted in General or non-forum chat)',
      '',
      `  mode: ${row?.mode ?? 'unknown'}`,
      `  post_digests: ${row?.post_digests ?? false}`,
      '',
      'Admin: DM me /setmode <chat_id> <team|devops|staging> and /setdigests <chat_id> on|off',
    ].join('\n'),
  );
});

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

bot.command('health', async (ctx) => {
  if (!isAdmin(ctx)) {
    await ctx.reply('Admin only.');
    return;
  }
  await ctx.reply(await buildHealthReport());
});

bot.command('digest', async (ctx) => {
  const member = await requireMember(ctx);
  if (!member) return;
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

// ---- Free-text + @mention handler ------------------------------------------

let cachedUsername: string | null = null;
async function ensureUsername(): Promise<string> {
  if (cachedUsername) return cachedUsername;
  const me = await bot.api.getMe();
  cachedUsername = me.username?.toLowerCase() ?? '';
  return cachedUsername;
}

bot.on('message:text', async (ctx) => {
  const tgId = ctx.from?.id;
  if (!tgId) return;
  const text = ctx.message.text.trim();
  const chatType = ctx.chat?.type ?? 'private';

  // Awaiting code flow (DM only)
  if (chatType === 'private' && ctx.session.awaitingCode && text.length <= 8) {
    const res = await linkTelegramId(text, tgId);
    if (res.ok) {
      ctx.session.awaitingCode = false;
      await ctx.reply(`Linked! You're signed in as ${res.member.name}. Try /help.`);
    } else {
      await ctx.reply(`${res.reason}. Try again, or /start to restart.`);
    }
    return;
  }

  const member = await findMemberByTelegramId(tgId);

  if (chatType === 'private') {
    if (!member) {
      ctx.session.awaitingCode = true;
      await ctx.reply('Send your 4-letter ZAOstock code first.');
      return;
    }
    await ctx.reply('Working on it...');
    const result = await executeFromText(member, text);
    await ctx.reply(result.reply);
    return;
  }

  // Group / supergroup: respond ONLY when @mentioned
  const username = await ensureUsername();
  const mentioned = username && text.toLowerCase().includes(`@${username}`);
  if (!mentioned) return;

  if (!member) {
    await ctx.reply('I see you, but you need to link first. DM me and send your 4-letter code.');
    return;
  }

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
      alertDevops(bot, `${label} digest failed: ${err instanceof Error ? err.message : 'unknown'}`).catch(() => undefined);
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
