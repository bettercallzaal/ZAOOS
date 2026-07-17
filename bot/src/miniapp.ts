import { type Context, InlineKeyboard } from 'grammy';

function getBoardUrl(): string | null {
  const url = process.env.BOARD_MINI_URL;
  return url && url.trim() ? url.trim() : null;
}

export async function cmdBoard(ctx: Context): Promise<void> {
  const url = getBoardUrl();
  if (!url) {
    await ctx.reply('ZAO Cowork Board: https://thezao.xyz/board');
    return;
  }
  const kb = new InlineKeyboard().webApp('Open Board', url);
  await ctx.reply('ZAO Cowork Board — tap to open inside Telegram:', {
    reply_markup: kb,
  });
}
