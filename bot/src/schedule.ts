// Scheduled digests via node-cron. Times in America/New_York so "6am EST" stays 6am after DST.

import cron from 'node-cron';
import { morningDigest, eveningRecap, weekAheadDigest, fridayRetro } from './digest';
import { getZaalDmId } from './group';

interface MinimalBot {
  api: { sendMessage: (chatId: number, text: string) => Promise<unknown> };
}

const TZ = 'America/New_York';

// Digests DM Zaal instead of posting into the team group (so scheduled noise
// doesn't crowd out the group conversation). If ZAAL_TELEGRAM_ID is unset we
// drop the digest rather than fall back to pinging the group.
async function postDigestToZaal(bot: MinimalBot, text: string): Promise<void> {
  const zaalDm = getZaalDmId();
  if (!zaalDm) {
    console.error('[schedule] ZAAL_TELEGRAM_ID not set — digest not sent (refusing to ping the team group)');
    return;
  }
  try {
    await bot.api.sendMessage(zaalDm, text);
  } catch (err) {
    console.error('[schedule] digest DM to Zaal failed:', err);
  }
}

export function scheduleAll(bot: MinimalBot, onError: (err: unknown, label: string) => void): void {
  // Morning: every day 6:00am America/New_York
  cron.schedule(
    '0 6 * * *',
    async () => {
      try {
        const text = await morningDigest();
        await postDigestToZaal(bot, text);
        console.log('[schedule] morning posted');
      } catch (err) {
        onError(err, 'morning-digest');
      }
    },
    { timezone: TZ },
  );

  // Evening: every day 6:00pm America/New_York
  // Skip if eveningRecap returns null (no activity + no closed todos)
  cron.schedule(
    '0 18 * * *',
    async () => {
      try {
        const text = await eveningRecap();
        if (text === null) {
          console.log('[schedule] evening skipped - no activity to recap');
          return;
        }
        await postDigestToZaal(bot, text);
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
        await postDigestToZaal(bot, text);
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
        await postDigestToZaal(bot, text);
        console.log('[schedule] friday-retro posted');
      } catch (err) {
        onError(err, 'friday-retro');
      }
    },
    { timezone: TZ },
  );

  console.log('[schedule] 4 crons armed (morning 6am, evening 6pm, Mon 9am, Fri 5pm · America/New_York)');
}
