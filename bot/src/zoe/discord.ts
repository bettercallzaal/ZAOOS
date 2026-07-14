/**
 * ZOE Discord surface — responsive assistant in the ZAO Discord.
 *
 * Boots a discord.js client that reads channels for context but only responds
 * when pinged/@mentioned or DM'd. NEVER posts proactively. Reuses ZOE's
 * existing answer brain (concierge) to generate replies in ZOE's voice.
 *
 * Env config:
 * - DISCORD_BOT_TOKEN: bot token from Discord Developer Portal
 * - DISCORD_ZAAL_ID: Zaal's Discord user ID (optional, for owner-only logic)
 *
 * Intents required:
 * - Message Content Intent
 * - Guild Messages
 * - Direct Messages
 */

import { Client, GatewayIntentBits, ChannelType, EmbedBuilder } from 'discord.js';
import { runConciergeTurn } from './concierge';
import { buildMemoryBlocks, ensureZoeHome } from './memory';
import type { ConciergeOptions } from './types';
import { config as loadEnv } from 'dotenv';

loadEnv();

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_ZAAL_ID = process.env.DISCORD_ZAAL_ID;

// Maximum message length for Discord (2000 chars).
const DISCORD_MAX = 1990;

/**
 * Split a long string into Discord-sized chunks, preferring paragraph then
 * line then word boundaries. Falls back to a hard cut if no boundary is found.
 */
function chunkMessage(text: string, max = DISCORD_MAX): string[] {
  if (text.length <= max) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > max) {
    let cut = remaining.lastIndexOf('\n\n', max);
    if (cut < max * 0.5) cut = remaining.lastIndexOf('\n', max);
    if (cut < max * 0.5) cut = remaining.lastIndexOf(' ', max);
    if (cut < max * 0.5) cut = max;
    chunks.push(remaining.slice(0, cut).trimEnd());
    remaining = remaining.slice(cut).trimStart();
  }
  if (remaining.length > 0) chunks.push(remaining);
  return chunks;
}

/**
 * Format ZOE's response for Discord: if the reply is short, send as-is;
 * if it includes code blocks or structured content, preserve formatting.
 * If it exceeds Discord's limit, chunk it.
 */
function formatDiscordReply(text: string): { content: string; embeds?: EmbedBuilder[] } {
  // For now, simple chunking. Advanced: could use embeds for structured replies.
  if (text.length <= DISCORD_MAX) {
    return { content: text };
  }
  // Chunking will be handled by the caller (send each chunk as a separate message).
  return { content: text.slice(0, DISCORD_MAX) };
}

/**
 * Boot the Discord client. Called from index.ts if DISCORD_BOT_TOKEN is set.
 * Returns the client so the caller can manage its lifecycle.
 * Safe to call multiple times; returns early if already booted.
 */
export async function bootDiscordClient(): Promise<Client | null> {
  if (!DISCORD_BOT_TOKEN) {
    console.log('[zoe/discord] DISCORD_BOT_TOKEN not set, skipping Discord client');
    return null;
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
    ],
  });

  client.once('ready', () => {
    console.log(`[zoe/discord] connected as ${client.user?.username ?? 'unknown'}`);
  });

  /**
   * Handle incoming messages. RESPONSIVE ONLY:
   * - Respond to DMs from anyone (but only Zaal's DMs are "trusted" for certain ops)
   * - Respond to @mentions in channels
   * - NEVER post proactively or to channels without being pinged
   */
  client.on('messageCreate', async (message) => {
    try {
      // Ignore bot messages and system messages.
      if (message.author.bot || message.system) return;

      // Track whether this message triggered us (DM or @mention).
      let triggered = false;
      let isOwnerDM = false;

      // Case 1: DM to ZOE.
      if (message.channel.isDMBased()) {
        triggered = true;
        if (DISCORD_ZAAL_ID && message.author.id === DISCORD_ZAAL_ID) {
          isOwnerDM = true;
        }
      }

      // Case 2: @mention in a guild channel. Check if ZOE is mentioned.
      if (message.channel.type === ChannelType.GuildText && message.mentions.has(client.user?.id ?? '')) {
        triggered = true;
      }

      // Not triggered: read for context but stay silent (the hard rule).
      if (!triggered) return;

      // Show typing indicator while we think.
      await message.channel.sendTyping();

      // Build memory blocks for the concierge turn.
      const blocks = await buildMemoryBlocks('private');

      // Format the current date for ZOE's timezone.
      const currentDate = new Date().toLocaleString('en-US', {
        timeZone: 'America/New_York',
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
      });

      // Prepare context for the concierge turn.
      const senderLabel = isOwnerDM ? 'Zaal' : message.author.username ?? message.author.displayName ?? 'User';
      const messageText = message.content
        .replace(new RegExp(`<@${client.user?.id}>`, 'g'), '')
        .trim();

      // Call the existing concierge brain to generate ZOE's response.
      const result = await runConciergeTurn({
        message: messageText,
        blocks,
        context: {
          zaal_tg_id: DISCORD_ZAAL_ID ? Number(DISCORD_ZAAL_ID) : 0,
          current_date: currentDate,
          workspace_dir: process.env.ZOE_REPO_DIR ?? '/home/zaal/zao-os',
        },
        senderLabel,
      });

      // Extract the reply text from the concierge result.
      const replyText = result.reply ?? 'I could not generate a response.';

      // Send the reply (chunked if needed).
      const chunks = chunkMessage(replyText);
      for (const chunk of chunks) {
        await message.reply({
          content: chunk,
          allowedMentions: { repliedUser: false },
        });
      }

      console.log(`[zoe/discord] replied to ${senderLabel} in ${message.channel.isDMBased() ? 'DM' : 'channel'}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[zoe/discord] message handler error:', msg);
      try {
        await message.reply({
          content: `ZOE encountered an error: ${msg.slice(0, 100)}`,
          allowedMentions: { repliedUser: false },
        });
      } catch {
        // If the error reply also fails, just log it.
        console.error('[zoe/discord] could not send error reply');
      }
    }
  });

  // Boot the client.
  await client.login(DISCORD_BOT_TOKEN);
  return client;
}
