import { config as loadEnv } from 'dotenv';
loadEnv();

import { Bot, Context, session, SessionFlavor } from 'grammy';
import { findMemberByTelegramId, linkTelegramId, type TeamMember } from './auth.ts';
import { buildStatus, buildMyTodos, buildMyContributions } from './status.ts';
import { addGemba, addIdea, addNote } from './capture.ts';

interface SessionData {
  awaitingCode: boolean;
}

type MyContext = Context & SessionFlavor<SessionData>;

const token = process.env.ZAOSTOCK_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('Missing ZAOSTOCK_BOT_TOKEN');
  process.exit(1);
}

const bot = new Bot<MyContext>(token);

bot.use(session({ initial: (): SessionData => ({ awaitingCode: false }) }));

async function requireMember(ctx: MyContext): Promise<TeamMember | null> {
  const tgId = ctx.from?.id;
  if (!tgId) {
    await ctx.reply('Could not read your Telegram id.');
    return null;
  }
  const member = await findMemberByTelegramId(tgId);
  if (!member) {
    ctx.session.awaitingCode = true;
    await ctx.reply(
      'Welcome to the ZAOstock Team Bot. Send your 4-letter login code (same one you use on zaoos.com/stock/team) to link this Telegram account.',
    );
    return null;
  }
  return member;
}

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
  await ctx.reply(
    [
      'ZAOstock Team Bot — v1',
      '',
      '/status — festival snapshot (sponsors, artists, volunteers, overdue)',
      '/mytodos — your open todos',
      '/mycontributions — what you logged in the last 7 days',
      '/gemba <text> — quick standup log ("finished x, blocked on y")',
      '/idea <text> — drop a suggestion into the box',
      '/note <text> — add a line to the next upcoming meeting notes',
      '/help — this list',
      '',
      'You can also just DM natural language (v1.1).',
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

bot.on('message:text', async (ctx) => {
  const tgId = ctx.from?.id;
  if (!tgId) return;
  const text = ctx.message.text.trim();

  // If we are awaiting their code, try to link.
  if (ctx.session.awaitingCode && text.length <= 8) {
    const res = await linkTelegramId(text, tgId);
    if (res.ok) {
      ctx.session.awaitingCode = false;
      await ctx.reply(
        `Linked! You're signed in as ${res.member.name}. Try /help to see commands.`,
      );
    } else {
      await ctx.reply(`${res.reason}. Try again, or type /start to restart.`);
    }
    return;
  }

  const member = await findMemberByTelegramId(tgId);
  if (!member) {
    ctx.session.awaitingCode = true;
    await ctx.reply('Send your 4-letter ZAOstock code first so I know who you are.');
    return;
  }

  // v1: fall back to treating any raw text as a gemba-style note.
  if (text.toLowerCase().startsWith('idea:') || text.toLowerCase().startsWith('💡')) {
    await ctx.reply(await addIdea(member, text.replace(/^idea:\s*/i, '').replace(/^💡\s*/, '')));
    return;
  }
  if (text.toLowerCase().startsWith('note:')) {
    await ctx.reply(await addNote(member, text.replace(/^note:\s*/i, '')));
    return;
  }
  await ctx.reply(
    `Got it, ${member.name}. For now, use /gemba, /idea, /note, /status, /mytodos, /mycontributions. Natural-language parsing ships next.`,
  );
});

bot.catch((err) => {
  console.error('[zaostock-bot] error:', err);
});

console.log('[zaostock-bot] starting...');
bot.start({
  onStart: (info) => {
    console.log(`[zaostock-bot] running as @${info.username}`);
  },
});
