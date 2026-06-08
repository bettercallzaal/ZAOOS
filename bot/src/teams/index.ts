/**
 * Team-bots entry. Boots BOTH Magnetiq and AttaBotty bots in one Node process.
 * One systemd unit (zao-team-bots), two grammy Bot instances, two TG groups,
 * two personas, shared brain + memory layer.
 *
 * Telegram setup (one-time, Zaal's task):
 *   1. @BotFather: /newbot twice. Names suggested:
 *      - @zao_magnetiq_bot (token -> MAGNETIQ_BOT_TOKEN)
 *      - @z_attabotty_bot  (token -> ATTABOTTY_BOT_TOKEN)
 *   2. Create two private TG groups:
 *      - "ZAO x Magnetiq"  -> add @zao_magnetiq_bot as admin. Chat id -> MAGNETIQ_CHAT_ID
 *      - "Z x AttaBotty"   -> add @z_attabotty_bot as admin.  Chat id -> ATTABOTTY_CHAT_ID
 *   3. Send /whoami in each group once the bot is live to confirm chat_id.
 *   4. Populate allowlists:
 *      - MAGNETIQ_ALLOWED_IDS=<zaal_tg_id>,<tyler_tg_id>[,<caitlin_tg_id>]
 *      - ATTABOTTY_ALLOWED_IDS=<zaal_tg_id>,<attabotty_tg_id>[,<onagi_tg_id>]
 *
 * Cost guardrails (env-tunable in shared.ts/brain.ts):
 *   - Chat reply: $0.50 budget, Sonnet, allowlist + mention gated
 *   - /research:  $3.00 budget, Opus, allowlist only
 *   - Daily summary: $1.00 budget, Opus, posts to group automatically
 */
import { config as loadEnv } from 'dotenv';
loadEnv();

import { Bot, Context } from 'grammy';
import { envBotConfig, scheduleDailySummary } from './shared';
import { registerCommands } from './commands';
import { startHeartbeatAs } from '../lib/cowork';

interface BootedBot {
  cfg: ReturnType<typeof envBotConfig>;
  bot: Bot<Context>;
}

// Each team bot reports to the cowork board as its own identity, using its own
// cowork token (dormant unless COWORK_API_URL + that token are set).
function coworkTokenFor(name: 'magnetiq' | 'attabotty'): string {
  return name === 'magnetiq'
    ? (process.env.COWORK_TOKEN_MAGNETIQ ?? '')
    : (process.env.COWORK_TOKEN_ATTABOTTY ?? '');
}

async function bootBot(name: 'magnetiq' | 'attabotty'): Promise<BootedBot> {
  const cfg = envBotConfig(name);
  const bot = new Bot<Context>(cfg.token);
  registerCommands(bot, cfg);

  const info = await bot.api.getMe();
  cfg.username = info.username;
  console.log(`[teams] ${name} bot=@${cfg.username} chat=${cfg.chatId} allowlist=[${cfg.allowedTelegramIds.join(',')}]`);

  scheduleDailySummary(bot, cfg);
  // Cowork board heartbeat - one row per team bot.
  startHeartbeatAs(coworkTokenFor(name), 60_000, () => 'up', {
    unit: 'zao-team-bots',
    identity: name,
  });
  return { cfg, bot };
}

async function main(): Promise<void> {
  const wants = (process.env.TEAMS_RUN ?? 'magnetiq,attabotty')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s === 'magnetiq' || s === 'attabotty') as Array<'magnetiq' | 'attabotty'>;
  if (wants.length === 0) {
    console.error('TEAMS_RUN env is empty - set to "magnetiq", "attabotty", or "magnetiq,attabotty"');
    process.exit(1);
  }

  const booted: BootedBot[] = [];
  for (const name of wants) {
    try {
      booted.push(await bootBot(name));
    } catch (err) {
      console.error(`[teams] ${name} boot failed:`, (err as Error).message);
      // Continue with the others so a half-configured deploy still runs partially
    }
  }
  if (booted.length === 0) {
    console.error('[teams] no bots booted - exiting');
    process.exit(1);
  }

  await Promise.all(
    booted.map(({ cfg, bot }) =>
      bot.start({
        drop_pending_updates: true,
        onStart: () => console.log(`[teams/${cfg.name}] polling`),
      }),
    ),
  );
}

main().catch((err) => {
  console.error('[teams] fatal:', err);
  process.exit(1);
});

const shutdown = async (signal: string): Promise<void> => {
  console.log(`[teams] ${signal} - shutting down`);
  process.exit(0);
};
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
