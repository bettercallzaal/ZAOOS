/**
 * Shared command handlers for team bots. Each handler is bot-agnostic: it
 * receives the BotConfig + grammy Context and uses the brain + memory layers.
 */
import { Bot, Context } from 'grammy';
import { think } from './brain';
import {
  saveIdea,
  saveTask,
  saveClip,
  listOpenTasks,
  markTaskDone,
  listFacts,
  saveFact,
  logMessage,
} from './memory';
import { BotConfig, brainReply, chatGate, isMentioned, shouldReplyToText, userGate } from './shared';

const HELP_TEXT = (botUsername: string) =>
  [
    `I am @${botUsername}. I am the private collab brain for this group.`,
    '',
    'Commands:',
    '  /research <topic>  - I run a research pass and post findings here (Opus)',
    '  /idea <text>       - I log an idea to Supabase, never forgotten',
    '  /task <text>       - I log a task. /tasks lists open. /done <id> closes',
    '  /tasks             - list open tasks',
    '  /done <id>         - mark task done (id from /tasks)',
    '  /clip <url> <note> - log a clip-worthy moment',
    '  /context           - dump what I know about this team (for correction)',
    '  /fact <text>       - teach me a fact about the team or project',
    '  /summary           - run today\'s summary now (also fires daily on cron)',
    '  /whoami            - print my id + chat id (debug)',
    '  /help              - this list',
    '',
    'Talk to me by @mentioning my handle or replying to my messages. No mention = I stay silent.',
  ].join('\n');

export function registerCommands(bot: Bot<Context>, cfg: BotConfig): void {
  // chat gate first so EVERY downstream handler is scoped to the right group
  bot.use(chatGate(cfg));

  // log every message we see (both user + own replies later)
  bot.on('message:text', async (ctx, next) => {
    try {
      const m = ctx.message;
      if (m && ctx.chat) {
        await logMessage({
          bot: cfg.name,
          chat_id: ctx.chat.id,
          message_id: m.message_id,
          from_id: ctx.from?.id ?? 0,
          from_username: ctx.from?.username ?? null,
          text: m.text ?? '',
          is_bot_reply: false,
        });
      }
    } catch {
      /* logging never blocks */
    }
    await next();
  });

  bot.command('start', async (ctx) => {
    await ctx.reply(HELP_TEXT(cfg.username ?? cfg.name));
  });

  bot.command('help', async (ctx) => {
    await ctx.reply(HELP_TEXT(cfg.username ?? cfg.name));
  });

  bot.command('whoami', async (ctx) => {
    await ctx.reply(
      `bot=${cfg.name} | chat_id=${ctx.chat?.id} | your_id=${ctx.from?.id} | username=${ctx.from?.username ?? 'none'}`,
    );
  });

  bot.command('idea', async (ctx) => {
    if (!userGate(cfg, ctx)) {
      await ctx.reply('Not on the allowlist. Ping Zaal to add your TG id.');
      return;
    }
    const text = (ctx.message?.text ?? '').replace(/^\/idea(@\w+)?\s*/, '').trim();
    if (text.length < 4) {
      await ctx.reply('Usage: /idea <text> - min 4 chars');
      return;
    }
    try {
      const id = await saveIdea(cfg.name, ctx.from?.id ?? 0, text);
      await ctx.reply(`Idea saved (${id.slice(0, 8)}).`);
    } catch (err) {
      await ctx.reply(`Failed: ${(err as Error).message}`);
    }
  });

  bot.command('task', async (ctx) => {
    if (!userGate(cfg, ctx)) {
      await ctx.reply('Not on the allowlist.');
      return;
    }
    const text = (ctx.message?.text ?? '').replace(/^\/task(@\w+)?\s*/, '').trim();
    if (text.length < 4) {
      await ctx.reply('Usage: /task <text> - min 4 chars');
      return;
    }
    try {
      const id = await saveTask(cfg.name, ctx.from?.id ?? 0, text);
      await ctx.reply(`Task ${id.slice(0, 8)} added.`);
    } catch (err) {
      await ctx.reply(`Failed: ${(err as Error).message}`);
    }
  });

  bot.command('tasks', async (ctx) => {
    const open = await listOpenTasks(cfg.name, 20);
    if (open.length === 0) {
      await ctx.reply('No open tasks.');
      return;
    }
    const list = open
      .map((t) => `${t.id.slice(0, 8)} - ${t.text}`)
      .join('\n');
    await ctx.reply(`Open tasks (${open.length}):\n${list}\n\n/done <id> to close one.`);
  });

  bot.command('done', async (ctx) => {
    if (!userGate(cfg, ctx)) {
      await ctx.reply('Not on the allowlist.');
      return;
    }
    const arg = (ctx.message?.text ?? '').replace(/^\/done(@\w+)?\s*/, '').trim();
    if (!arg) {
      await ctx.reply('Usage: /done <id> - first 8 chars from /tasks');
      return;
    }
    const open = await listOpenTasks(cfg.name, 100);
    const match = open.find((t) => t.id.startsWith(arg));
    if (!match) {
      await ctx.reply(`No open task starting with ${arg}.`);
      return;
    }
    const ok = await markTaskDone(cfg.name, match.id);
    await ctx.reply(ok ? `Closed: ${match.text}` : 'Failed to close.');
  });

  bot.command('clip', async (ctx) => {
    if (!userGate(cfg, ctx)) {
      await ctx.reply('Not on the allowlist.');
      return;
    }
    const raw = (ctx.message?.text ?? '').replace(/^\/clip(@\w+)?\s*/, '').trim();
    const urlMatch = raw.match(/(https?:\/\/\S+)/);
    if (!urlMatch) {
      await ctx.reply('Usage: /clip <url> <note> - url required');
      return;
    }
    const url = urlMatch[1];
    const note = raw.replace(url, '').trim();
    try {
      const id = await saveClip(cfg.name, ctx.from?.id ?? 0, url, note);
      await ctx.reply(`Clip ${id.slice(0, 8)} logged.`);
    } catch (err) {
      await ctx.reply(`Failed: ${(err as Error).message}`);
    }
  });

  bot.command('fact', async (ctx) => {
    if (!userGate(cfg, ctx)) {
      await ctx.reply('Not on the allowlist.');
      return;
    }
    const text = (ctx.message?.text ?? '').replace(/^\/fact(@\w+)?\s*/, '').trim();
    if (text.length < 6) {
      await ctx.reply('Usage: /fact <statement> - min 6 chars');
      return;
    }
    await saveFact(cfg.name, text);
    await ctx.reply('Fact saved. I will respect it going forward.');
  });

  bot.command('context', async (ctx) => {
    const facts = await listFacts(cfg.name, 30);
    const tasks = await listOpenTasks(cfg.name, 20);
    const lines = [
      `Context for ${cfg.name}:`,
      '',
      `Allowlist (${cfg.allowedTelegramIds.length}): ${cfg.allowedTelegramIds.join(', ') || '(empty - permissive)'}`,
      `Daily summary cron: ${cfg.dailySummaryCron}`,
      `Persona: ${cfg.personaPath}`,
      '',
      `Facts I know (${facts.length}):`,
      ...facts.slice(0, 10).map((f, i) => `${i + 1}. ${f}`),
      '',
      `Open tasks (${tasks.length}):`,
      ...tasks.slice(0, 10).map((t) => `- ${t.text}`),
    ];
    await ctx.reply(lines.join('\n').slice(0, 3500));
  });

  bot.command('research', async (ctx) => {
    if (!userGate(cfg, ctx)) {
      await ctx.reply('Not on the allowlist.');
      return;
    }
    const topic = (ctx.message?.text ?? '').replace(/^\/research(@\w+)?\s*/, '').trim();
    if (topic.length < 4) {
      await ctx.reply('Usage: /research <topic or question> - min 4 chars');
      return;
    }
    await ctx.reply(`Researching: ${topic.slice(0, 200)}\nStanding by, Opus is reading. ~1-3 min.`);
    try {
      const prompt = [
        'You are doing a focused research pass for this team. Tier: STANDARD.',
        '',
        'Steps:',
        '1. Grep the research/ library at ../../research/ for prior coverage. Cite doc numbers if found.',
        '2. Look at relevant code paths in bot/src/ or src/ for ground truth.',
        '3. If web context is needed, use WebSearch/WebFetch.',
        '4. Produce a structured reply (max 25 lines):',
        '   - TL;DR (one line)',
        '   - Key findings (bullets, max 5)',
        '   - Action recommendation (one bullet, decisive)',
        '   - Sources (URLs or doc paths)',
        '',
        `Topic: ${topic}`,
      ].join('\n');

      const reply = await think({
        kind: 'research',
        personaPath: cfg.personaPath,
        prompt,
      });
      await ctx.reply(reply.text.slice(0, 3800));
      console.log(`[teams/${cfg.name}] research cost $${reply.costUsd.toFixed(3)} (${reply.durationMs}ms)`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await ctx.reply(`Research failed: ${msg.slice(0, 300)}`);
    }
  });

  bot.command('summary', async (ctx) => {
    if (!userGate(cfg, ctx)) {
      await ctx.reply('Not on the allowlist.');
      return;
    }
    await ctx.reply('Generating summary now (cron also fires daily). ~30-90s.');
    try {
      const reply = await think({
        kind: 'summary',
        personaPath: cfg.personaPath,
        prompt:
          'Generate the same daily-summary format as the cron job, but for right now. Pull recent chat context + open tasks. Max 12 lines.',
      });
      await ctx.reply(reply.text.slice(0, 3800));
    } catch (err) {
      await ctx.reply(`Summary failed: ${(err as Error).message}`);
    }
  });

  // Reactive: @mention or reply triggers a chat-tier brain call
  bot.on('message:text', async (ctx) => {
    const text = ctx.message?.text ?? '';
    if (text.startsWith('/')) return;
    if (!shouldReplyToText(ctx, cfg)) return;
    if (!userGate(cfg, ctx)) return; // silent ignore for non-allowlist mentions

    const cleaned = cfg.username
      ? text.replace(new RegExp(`@${cfg.username}\\b`, 'gi'), '').trim()
      : text.trim();
    if (cleaned.length < 2) return;

    try {
      const reply = await brainReply(cfg, cleaned, 'chat');
      await ctx.reply(reply.slice(0, 3800), { reply_parameters: { message_id: ctx.message!.message_id } });
      // Log my own reply so it lands in memory for next stitch
      await logMessage({
        bot: cfg.name,
        chat_id: ctx.chat!.id,
        message_id: ctx.message!.message_id,
        from_id: 0,
        from_username: cfg.username ?? cfg.name,
        text: reply.slice(0, 4000),
        is_bot_reply: true,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[teams/${cfg.name}] chat reply failed: ${msg}`);
      await ctx.reply(`Brain hiccup: ${msg.slice(0, 200)}`);
    }
  });

  // Surface mention detection as no-op so isMentioned export survives tree-shake
  void isMentioned;
}
