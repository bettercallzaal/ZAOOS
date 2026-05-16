// Post slate v1 - /voicememo Telegram command + plain-text capture.
//
// Usage on Telegram:
//   /voicememo <text>       - append a one-liner to today's voice memo file
//   /vm <text>              - shorthand
//
// File: ~/.zao/zoe/voice-memos/YYYY-MM-DD.md  (one entry per line, timestamped)
//
// v2: accept actual voice notes via grammy's `ctx.message.voice`, transcribe
// via Whisper or the existing zao-transcribe script, then append.

import type { Context } from 'grammy';
import { appendVoiceMemo } from './sources';

export async function handleVoiceMemo(ctx: Context, isFromZaal: boolean): Promise<void> {
  if (!isFromZaal) return;
  const text = ctx.message?.text ?? '';
  // Strip the leading command + 1 space.
  const body = text.replace(/^\/(voicememo|vm)(@[^\s]+)?\s*/i, '').trim();
  if (!body) {
    await ctx.reply('Usage: /voicememo <thought>  - I save it for the next personal-post draft.');
    return;
  }
  try {
    await appendVoiceMemo(body);
    await ctx.reply(`Saved. (${body.length} chars). It'll feed the next personal post draft.`);
  } catch (err) {
    await ctx.reply(`Failed to save: ${(err as Error).message}`);
  }
}
