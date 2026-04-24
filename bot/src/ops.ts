// Ops alerts — bot self-reports errors/startup/shutdown to devops chats.

import { getDevopsChats } from './group';

interface MinimalBot {
  api: { sendMessage: (chatId: number, text: string) => Promise<unknown> };
}

export async function alertDevops(bot: MinimalBot, text: string): Promise<void> {
  try {
    const chats = await getDevopsChats();
    if (chats.length === 0) return;
    await Promise.all(
      chats.map((chat) =>
        bot.api.sendMessage(chat.chat_id, `[devops] ${text}`).catch((e) => console.error('[ops] send failed:', e)),
      ),
    );
  } catch (err) {
    console.error('[ops] alert failed:', err);
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
