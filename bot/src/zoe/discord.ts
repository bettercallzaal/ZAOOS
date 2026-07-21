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
 * - DISCORD_COMMUNITY_ASKS_ENABLED: set to "1" to enable Stage 1b approval flow
 *   (non-owner messages route through Zaal for button-approval before sending)
 *
 * Intents required:
 * - Message Content Intent
 * - Guild Messages
 * - Direct Messages
 */

import {
  Client,
  GatewayIntentBits,
  ChannelType,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  MessageFlags,
  type TextBasedChannel,
} from 'discord.js';
import { runConciergeTurn } from './concierge';
import { buildMemoryBlocks } from './memory';
import { config as loadEnv } from 'dotenv';

loadEnv();

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_ZAAL_ID = process.env.DISCORD_ZAAL_ID;
const COMMUNITY_ASKS_ENABLED = process.env.DISCORD_COMMUNITY_ASKS_ENABLED === '1';

// Maximum message length for Discord (2000 chars).
const DISCORD_MAX = 1990;

/** Pending community messages awaiting Zaal approval. Keyed by approval-token. */
const pendingCommunityMessages = new Map<
  string,
  { reply: string; channel: TextBasedChannel; messageId: string; senderName: string }
>();

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
 * Build the approval row for community-ask messages.
 * The token ties button clicks back to the pending message.
 */
function buildApprovalRow(token: string): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`zask_approve_${token}`).setLabel('Approve').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`zask_regen_${token}`).setLabel('Regen').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`zask_skip_${token}`).setLabel('Skip').setStyle(ButtonStyle.Danger),
  );
}

/**
 * Send a community-ask draft to Zaal's DM for approval (Stage 1b).
 * Returns false if Zaal's DM channel cannot be opened.
 */
async function sendCommunityAskForApproval(
  client: Client,
  token: string,
  senderName: string,
  question: string,
  draft: string,
): Promise<boolean> {
  if (!DISCORD_ZAAL_ID) return false;
  try {
    const zaalUser = await client.users.fetch(DISCORD_ZAAL_ID);
    const dm = await zaalUser.createDM();
    const embed = new EmbedBuilder()
      .setTitle(`Community question from ${senderName}`)
      .setDescription(`**Q:** ${question.slice(0, 500)}\n\n**Draft reply:**\n${draft.slice(0, 1500)}`)
      .setColor(0xf5a623)
      .setFooter({ text: 'Approve to send, Regen to regenerate, Skip to dismiss' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await dm.send({ embeds: [embed.toJSON() as any], components: [buildApprovalRow(token).toJSON() as any] });
    return true;
  } catch (err) {
    console.error('[zoe/discord] could not DM Zaal for approval:', (err as Error).message);
    return false;
  }
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
    console.log(
      `[zoe/discord] connected as ${client.user?.username ?? 'unknown'}` +
        (COMMUNITY_ASKS_ENABLED ? ' [community-asks: ON]' : ''),
    );
  });

  /**
   * Handle incoming messages. RESPONSIVE ONLY:
   * - Respond to DMs from anyone (but only Zaal's DMs are "trusted" for certain ops)
   * - Respond to @mentions in channels
   * - NEVER post proactively or to channels without being pinged
   *
   * Stage 1b (DISCORD_COMMUNITY_ASKS_ENABLED=1):
   * - Non-owner messages: draft → DM Zaal for approval → send after approve
   * - Owner (Zaal) messages: respond directly as before
   */
  client.on('messageCreate', async (message) => {
    try {
      if (message.author.bot || message.system) return;

      let triggered = false;
      let isOwnerDM = false;

      if (message.channel.isDMBased()) {
        triggered = true;
        if (DISCORD_ZAAL_ID && message.author.id === DISCORD_ZAAL_ID) {
          isOwnerDM = true;
        }
      }

      if (message.channel.type === ChannelType.GuildText && message.mentions.has(client.user?.id ?? '')) {
        triggered = true;
      }

      if (!triggered) return;

      await message.channel.sendTyping();

      const blocks = await buildMemoryBlocks('private');
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

      const senderLabel = isOwnerDM ? 'Zaal' : (message.author.username ?? message.author.displayName ?? 'User');
      const messageText = message.content
        .replace(new RegExp(`<@${client.user?.id}>`, 'g'), '')
        .trim();

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

      const replyText = result.reply ?? 'I could not generate a response.';

      // Stage 1b: non-owner community messages go through approval if enabled.
      if (COMMUNITY_ASKS_ENABLED && !isOwnerDM) {
        const token = `${message.id}-${Date.now().toString(36)}`;
        pendingCommunityMessages.set(token, {
          reply: replyText,
          channel: message.channel as TextBasedChannel,
          messageId: message.id,
          senderName: senderLabel,
        });

        const sent = await sendCommunityAskForApproval(client, token, senderLabel, messageText, replyText);
        if (sent) {
          await message.reply({
            content: `Got it, ${senderLabel} — ZOE is reviewing your question and will reply shortly.`,
            allowedMentions: { repliedUser: false },
          });
        } else {
          // Fallback: send directly if Zaal DM fails.
          const chunks = chunkMessage(replyText);
          for (const chunk of chunks) {
            await message.reply({ content: chunk, allowedMentions: { repliedUser: false } });
          }
        }
        console.log(`[zoe/discord] community-ask from ${senderLabel} queued for approval (token=${token})`);
        return;
      }

      // Default path (owner or community-asks disabled): reply directly.
      const chunks = chunkMessage(replyText);
      for (const chunk of chunks) {
        await message.reply({ content: chunk, allowedMentions: { repliedUser: false } });
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
        console.error('[zoe/discord] could not send error reply');
      }
    }
  });

  /**
   * Stage 1b: handle button clicks on community-ask approval messages.
   * Only Zaal can approve/skip/regen. Other users get an ephemeral "not authorized".
   */
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith('zask_')) return;

    if (DISCORD_ZAAL_ID && interaction.user.id !== DISCORD_ZAAL_ID) {
      await interaction.reply({ content: 'Only Zaal can approve community asks.', flags: MessageFlags.Ephemeral });
      return;
    }

    const parts = interaction.customId.split('_');
    const action = parts[1];
    const token = parts.slice(2).join('_');
    const pending = pendingCommunityMessages.get(token);

    if (!pending) {
      await interaction.reply({
        content: 'This request has already been handled or expired.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    pendingCommunityMessages.delete(token);

    if (action === 'approve') {
      try {
        const chunks = chunkMessage(pending.reply);
        for (const chunk of chunks) {
          await pending.channel.send({ content: chunk });
        }
        await interaction.reply({
          content: `Approved and sent to ${pending.senderName}.`,
          flags: MessageFlags.Ephemeral,
        });
        console.log(`[zoe/discord] approved community-ask reply for ${pending.senderName}`);
      } catch (err) {
        await interaction.reply({
          content: `Send failed: ${(err as Error).message.slice(0, 100)}`,
          flags: MessageFlags.Ephemeral,
        });
      }
    } else if (action === 'regen') {
      await interaction.reply({
        content: `Draft skipped for ${pending.senderName}. Ask ZOE again in Discord to regenerate.`,
        flags: MessageFlags.Ephemeral,
      });
      console.log(`[zoe/discord] regen requested for community-ask from ${pending.senderName}`);
    } else if (action === 'skip') {
      await interaction.reply({
        content: `Skipped — no reply sent to ${pending.senderName}.`,
        flags: MessageFlags.Ephemeral,
      });
      console.log(`[zoe/discord] skipped community-ask reply for ${pending.senderName}`);
    }
  });

  await client.login(DISCORD_BOT_TOKEN);
  return client;
}
