// Ops alerts — bot self-reports errors/startup/shutdown to devops chats.

import { getZaalDmId } from './group';

interface MinimalBot {
  api: { sendMessage: (chatId: number, text: string) => Promise<unknown> };
}

// DevOps alerts (startup/shutdown/errors) DM Zaal instead of posting into a
// group, keeping operational noise out of the team conversation. Drops the
// alert if ZAAL_TELEGRAM_ID is unset rather than fall back to a group chat.
export async function alertDevops(bot: MinimalBot, text: string): Promise<void> {
  const zaalDm = getZaalDmId();
  if (!zaalDm) {
    console.error('[ops] ZAAL_TELEGRAM_ID not set — devops alert dropped:', text);
    return;
  }
  try {
    await bot.api.sendMessage(zaalDm, `[devops] ${text}`);
  } catch (err) {
    console.error('[ops] devops DM to Zaal failed:', err);
  }
}

export async function buildHealthReport(): Promise<string> {
  const uptime = process.uptime();
  const uptimeStr =
    uptime < 60 ? `${Math.floor(uptime)}s` : uptime < 3600 ? `${Math.floor(uptime / 60)}m` : `${Math.floor(uptime / 3600)}h${Math.floor((uptime % 3600) / 60)}m`;
  const mem = process.memoryUsage();
  const memMB = Math.round(mem.rss / 1024 / 1024);
  return [
    `ZAOstock Bot · health`,
    `up · ${uptimeStr} · ${memMB}MB RSS`,
    `node ${process.version}`,
    `pid ${process.pid}`,
  ].join('\n');
}
