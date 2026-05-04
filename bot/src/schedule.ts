// Scheduled digests via node-cron. Times in America/New_York so "6am EST" stays 6am after DST.

import cron from 'node-cron';
import { morningDigest, eveningRecap, weekAheadDigest, fridayRetro } from './digest';
import { getDigestChats } from './group';

interface MinimalBot {
  api: { sendMessage: (chatId: number, text: string) => Promise<unknown> };
}

const TZ = 'America/New_York';

async function postToAllDigestChats(bot: MinimalBot, text: string): Promise<void> {
  const chats = await getDigestChats();
  for (const chat of chats) {
    try {
      await bot.api.sendMessage(chat.chat_id, text);
    } catch (err) {
      console.error(`[schedule] send to ${chat.chat_id} failed:`, err);
    }
  }
}

export function scheduleAll(bot: MinimalBot, onError: (err: unknown, label: string) => void): void {
  // Morning: every day 6:00am America/New_York
  cron.schedule(
    '0 6 * * *',
    async () => {
      try {
        const text = await morningDigest();
        await postToAllDigestChats(bot, text);
        console.log('[schedule] morning posted');
      } catch (err) {
        onError(err, 'morning-digest');
      }
    },
    { timezone: TZ },
  );

  // Evening: every day 6:00pm America/New_York
  cron.schedule(
    '0 18 * * *',
    async () => {
      try {
        const text = await eveningRecap();
        await postToAllDigestChats(bot, text);
        console.log('[schedule] evening posted');
      } catch (err) {
        onError(err, 'evening-recap');
      }
    },
    { timezone: TZ },
  );

  // Week ahead: Monday 9:00am America/New_York
  cron.schedule(
    '0 9 * * 1',
    async () => {
      try {
        const text = await weekAheadDigest();
        await postToAllDigestChats(bot, text);
        console.log('[schedule] week-ahead posted');
      } catch (err) {
        onError(err, 'week-ahead');
      }
    },
    { timezone: TZ },
  );

  // Friday retro: Friday 5:00pm America/New_York
  cron.schedule(
    '0 17 * * 5',
    async () => {
      try {
        const text = await fridayRetro();
        await postToAllDigestChats(bot, text);
        console.log('[schedule] friday-retro posted');
      } catch (err) {
        onError(err, 'friday-retro');
      }
    },
    { timezone: TZ },
  );

  console.log('[schedule] 4 crons armed (morning 6am, evening 6pm, Mon 9am, Fri 5pm · America/New_York)');
}
