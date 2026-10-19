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
 * - DISCORD_CHANNEL_READ: "0" turns whole-channel reading off (default on)
 *
 * Intents:
 * - Guilds, Guild Messages, Direct Messages (not privileged)
 * - Message Content (privileged), unless DISCORD_CHANNEL_READ=0. Zaal,
 *   2026-10-18: ZOE helps in the ZAO Discords, so an @mention reply sees the
 *   channel's recent messages. It still only REPLIES to DMs and @mentions.
 *   The Portal toggle must match, or Discord closes the gateway with 4014.
 *   Doc 2685 D2 had dropped this intent when ZOE read only DMs and @mentions.
 *
 * Other people's turns are capped per hour (DISCORD_TURNS_PER_HOUR, default 6;
 * doc 2685 D1). Zaal's are not.
 */

import { toolPolicyForScope } from './scope-lock';
import {
  Client,
  GatewayIntentBits,
  ChannelType,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  MessageFlags,
  PermissionFlagsBits,
  type Message,
  type TextBasedChannel,
} from 'discord.js';
import { discordIcmEnabled, zaoGroundingFor } from './brand-brain';
import { runConciergeTurn } from './concierge';
import { buildMemoryBlocks } from './memory';
import {
  communityAskOutcome,
  DISCORD_CONTEXT_MESSAGES,
  discordChannelRead,
  discordScopeFor,
  discordShouldReply,
  discordTurnAllowed,
  discordTurnsPerHour,
  formatChannelContext,
  mentionsZoe,
} from './discord-scope';
import { appendGap, extractGap, gapLogEnabled } from './capability-gaps';
import { featureRan } from './feature-ran';
import { markAsked, NAME_SAVED_PUBLIC_LINE, peopleLogEnabled, recordPersonTurn } from './people';
import { MEMBER_DM_LIMIT_LINE, newMemberDmLimiter } from './member-dm';
import {
  ADMIN_REFUSAL_LINE,
  ARCHIVE_POST_PERMS,
  type AdminEnv,
  appendAdminLog,
  archivePerms,
  discordAdminEnabled,
  isDiscordOwner,
  overridesToClear,
  parseAdminCommand,
  runAdminCommand,
} from './discord-admin';
import { config as loadEnv } from 'dotenv';

loadEnv();

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_ZAAL_ID = process.env.DISCORD_ZAAL_ID;
const COMMUNITY_ASKS_ENABLED = process.env.DISCORD_COMMUNITY_ASKS_ENABLED === '1';
const CHANNEL_READ = discordChannelRead();

const turnLimiter = newMemberDmLimiter();

// Maximum message length for Discord (2000 chars).
const DISCORD_MAX = 1990;

/** Pending community messages awaiting Zaal approval. Keyed by approval-token. */
const pendingCommunityMessages = new Map<
  string,
  // askedId: the person whose draft carries the one-time name question, marked asked once it is sent.
  { reply: string; channel: TextBasedChannel; messageId: string; senderName: string; askedId?: string }
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
 * The guild operations discord-admin.ts runs, bound to the server and channel
 * the command was sent in. Only reached for Zaal's own "admin:" messages.
 */
function discordAdminEnv(message: Message<true>): AdminEnv {
  const guild = message.guild;
  const fetchChannel = async (id: string) => {
    const ch = await guild.channels.fetch(id).catch(() => null);
    if (!ch) throw new Error('that channel is not in this server');
    return ch;
  };
  return {
    async findCategory(name) {
      const c = guild.channels.cache.find(
        (ch) => ch.type === ChannelType.GuildCategory && ch.name.toLowerCase() === name.toLowerCase(),
      );
      return c ? { id: c.id, name: c.name } : null;
    },
    async createCategory(name) {
      const c = await guild.channels.create({ name, type: ChannelType.GuildCategory });
      return { id: c.id, name: c.name };
    },
    async createTextChannel(name, parentId) {
      const c = await guild.channels.create({ name, type: ChannelType.GuildText, parent: parentId });
      return { id: c.id, name: c.name };
    },
    async channelName(id) {
      const ch = await guild.channels.fetch(id).catch(() => null);
      return ch ? ch.name : null;
    },
    async renameChannel(id, name) {
      await (await fetchChannel(id)).setName(name);
    },
    async archiveChannel(id, archiveCategoryId) {
      const ch = await fetchChannel(id);
      if (ch.isThread()) throw new Error('a thread cannot be archived this way; it archives itself');
      await ch.setParent(archiveCategoryId, { lockPermissions: false });
      await ch.permissionOverwrites.edit(guild.roles.everyone, archivePerms(false));
      // A role or member override that ALLOWS posting beats the @everyone deny,
      // so clear those allows (set neutral, not deny). Evaluator note, #4022.
      const postBits = ARCHIVE_POST_PERMS.map((p) => PermissionFlagsBits[p]);
      const toClear = overridesToClear(ch.permissionOverwrites.cache.values(), guild.roles.everyone.id, postBits);
      for (const id of toClear) await ch.permissionOverwrites.edit(id, archivePerms(null));
      return { cleared: toClear.length };
    },
    async createThread(name) {
      if (message.channel.type !== ChannelType.GuildText) throw new Error('threads start from a text channel');
      const th = await message.channel.threads.create({ name });
      return { id: th.id, name: th.name };
    },
    async setPinned(channelId, messageId, pin) {
      const ch = channelId ? await fetchChannel(channelId) : message.channel;
      if (!ch.isTextBased()) throw new Error('that channel has no messages to pin');
      const target = await ch.messages.fetch(messageId);
      await (pin ? target.pin() : target.unpin());
    },
  };
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
      GatewayIntentBits.DirectMessages,
      ...(CHANNEL_READ ? [GatewayIntentBits.MessageContent] : []),
    ],
  });

  client.once('ready', () => {
    console.log(
      `[zoe/discord] connected as ${client.user?.username ?? 'unknown'}` +
        (COMMUNITY_ASKS_ENABLED ? ' [community-asks: ON]' : '') +
        (CHANNEL_READ ? ' [channel-read: ON]' : ''),
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

      const isOwnerDM = message.channel.isDMBased() && !!DISCORD_ZAAL_ID && message.author.id === DISCORD_ZAAL_ID;

      // Reading the channel never means speaking in it (discordShouldReply).
      const triggered = discordShouldReply({
        isDM: message.channel.isDMBased(),
        isGuildText: message.channel.type === ChannelType.GuildText,
        mentioned: mentionsZoe(message.mentions, client.user?.id),
      });
      if (!triggered) return;

      if (!discordTurnAllowed(turnLimiter, message.author.id, DISCORD_ZAAL_ID, Date.now(), discordTurnsPerHour())) {
        await message.reply({ content: MEMBER_DM_LIMIT_LINE, allowedMentions: { repliedUser: false } });
        return;
      }

      // Admin commands (discord-admin.ts, ZOE_DISCORD_ADMIN=1, default off).
      // Parsed by code, never by the model; run only for DISCORD_ZAAL_ID, and
      // anyone else is refused before any turn. Logged either way.
      if (discordAdminEnabled()) {
        const adminText = message.content.replace(new RegExp(`<@!?${client.user?.id}>`, 'g'), '').trim();
        const cmd = parseAdminCommand(adminText, message.reference?.messageId);
        if (cmd) {
          const by = message.author.id;
          let reply: string;
          if (!isDiscordOwner(by, DISCORD_ZAAL_ID)) {
            // Refused in private: a public refusal in a channel invites people to
            // keep trying (Evaluator note, #4022). If their DMs are closed, nothing is sent.
            await appendAdminLog({ action: cmd.kind, ok: false, by, guildId: message.guildId ?? undefined, refused: 'not owner' });
            await message.author.send({ content: ADMIN_REFUSAL_LINE, allowedMentions: { parse: [] } }).catch(() => undefined);
            return;
          } else if (!message.inGuild()) {
            reply = 'Run admin commands in the server, with an @mention.';
            await appendAdminLog({ action: cmd.kind, ok: false, by, refused: 'not in a server' });
          } else {
            const result = await runAdminCommand(cmd, discordAdminEnv(message));
            reply = result.reply;
            await appendAdminLog({ action: result.action, ok: result.ok, target: result.target, by, guildId: message.guildId });
            console.log(`[zoe/discord-admin] ${result.action} ${result.ok ? 'ok' : 'failed'} in guild ${message.guildId}`);
            if (result.ok) featureRan('discord-admin', result.action);
          }
          await message.reply({ content: reply, allowedMentions: { parse: [], repliedUser: false } });
          return;
        }
      }

      await message.channel.sendTyping();

      // Scope the memory to the surface. 'private' only for Zaal's own DM; a
      // guild channel or a member's DM gets the sanitized group path, the same
      // one Telegram groups use. See discord-scope.ts for the 2026-09-18 finding.
      const scope = discordScopeFor({
        isDM: message.channel.isDMBased(),
        authorId: message.author.id,
        channelId: message.channel.id,
        ownerId: DISCORD_ZAAL_ID,
      });
      const chatTitle = 'name' in message.channel && typeof message.channel.name === 'string' ? message.channel.name : undefined;
      const blocks = await buildMemoryBlocks(scope, chatTitle);
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

      let senderLabel = isOwnerDM ? 'Zaal' : (message.author.username ?? message.author.displayName ?? 'User');
      const messageText = message.content
        .replace(new RegExp(`<@${client.user?.id}>`, 'g'), '')
        .trim();

      // People list (people.ts, ZOE_PEOPLE_LOG=1, default off). Never Zaal, and
      // nobody at all without DISCORD_ZAAL_ID, so an unset id cannot log him.
      // A message that is only "call me X" gets a thanks and no model turn. In a
      // guild channel the thanks does not say the name back.
      let nameAsk = '';
      if (peopleLogEnabled() && DISCORD_ZAAL_ID && message.author.id !== DISCORD_ZAAL_ID) {
        const seen = await recordPersonTurn({
          platform: 'discord',
          id: message.author.id,
          handle: message.author.username ?? 'User',
          text: messageText,
        });
        if (seen?.nameOnlyReply) {
          const thanks = message.channel.isDMBased() ? seen.nameOnlyReply : NAME_SAVED_PUBLIC_LINE;
          await message.reply({ content: thanks, allowedMentions: { repliedUser: false } });
          featureRan('people-log', 'discord name');
          return;
        }
        if (seen) {
          senderLabel = seen.label;
          nameAsk = seen.askSuffix;
          featureRan('people-log', 'discord');
        }
      }

      // Whole-channel read: an @mention in a guild channel sees that channel's
      // recent messages. Same channel only, same group scope as above. A failed
      // fetch answers without context rather than not at all.
      let channelContext = '';
      if (CHANNEL_READ && !message.channel.isDMBased()) {
        try {
          const earlier = await message.channel.messages.fetch({ limit: DISCORD_CONTEXT_MESSAGES, before: message.id });
          channelContext = formatChannelContext(
            [...earlier.values()].reverse().map((m) => ({
              author: m.author.id === client.user?.id ? 'ZOE' : (m.author.username ?? 'User'),
              content: m.content,
            })),
          );
        } catch (err) {
          console.error('[zoe/discord] channel context fetch failed:', (err as Error).message);
        }
      }

      // Capability gaps (doc 2685 D7, ZOE_GAP_LOG=1): Zaal's own DM asks as in
      // Telegram; everyone else gets the community wording and a 'discord' row.
      const gapLog: boolean | 'community' = gapLogEnabled() ? (scope === 'private' ? true : 'community') : false;

      // ZAO background (brand-brain.ts): The ZAO's ICM box, plus any brand the
      // message names, so "what is ZABAL Gamez?" gets the canonical answer.
      // A failed fetch leaves the turn as it was.
      const grounding = discordIcmEnabled() ? await zaoGroundingFor(messageText).catch(() => undefined) : undefined;
      if (grounding) featureRan('discord-icm', grounding.brands.join(', '));

      const result = await runConciergeTurn({
        message: channelContext + messageText,
        blocks,
        brandContext: grounding?.context,
        context: {
          zaal_tg_id: DISCORD_ZAAL_ID ? Number(DISCORD_ZAAL_ID) : 0,
          current_date: currentDate,
          workspace_dir: process.env.ZOE_REPO_DIR ?? '/home/zaal/zao-os',
        },
        senderLabel,
        // scope-lock.ts: only Zaal's own DM gets tools; every other scope talks.
        toolPolicy: toolPolicyForScope(scope),
        gapLog,
      });

      // Take the GAP line off before the reply is queued or sent. A failed
      // write must not cost the person their answer.
      if (gapLog && result.reply) {
        // Public surface: a lowercase marker on the last line comes off too (Zaal, 2026-10-18).
        const extracted = extractGap(result.reply, { anyCaseLastLine: true });
        result.reply = extracted.reply;
        if (extracted.gap) {
          try {
            const source = scope === 'private' ? undefined : 'discord';
            if (await appendGap(extracted.gap, new Date(), undefined, source)) featureRan('discord-gap-log', scope === 'private' ? 'owner' : 'community');
          } catch (err) {
            console.error('[zoe/discord] capability gap not recorded:', (err as Error).message);
          }
        }
      }

      const replyText = result.reply ? result.reply + nameAsk : 'I could not generate a response.';

      // Stage 1b: non-owner community messages go through approval if enabled.
      if (COMMUNITY_ASKS_ENABLED && !isOwnerDM) {
        const token = `${message.id}-${Date.now().toString(36)}`;
        pendingCommunityMessages.set(token, {
          reply: replyText,
          channel: message.channel as TextBasedChannel,
          messageId: message.id,
          senderName: senderLabel,
          askedId: nameAsk && result.reply ? message.author.id : undefined,
        });

        const sent = await sendCommunityAskForApproval(client, token, senderLabel, messageText, replyText);
        const outcome = communityAskOutcome(sent);
        if (outcome === 'queued') {
          await message.reply({
            content: `Got it, ${senderLabel}. ZOE is reviewing your question and will reply shortly.`,
            allowedMentions: { repliedUser: false },
          });
          console.log(`[zoe/discord] community-ask from ${senderLabel} queued for approval (token=${token})`);
        } else {
          // Zaal could not be asked, so the draft is HELD. It used to be sent
          // unapproved here, which is the one case the approval flow exists for.
          pendingCommunityMessages.delete(token);
          await message.reply({
            content: `Got it, ${senderLabel}. ZOE will come back to you once Zaal has had a look.`,
            allowedMentions: { repliedUser: false },
          });
          console.error(`[zoe/discord] community-ask from ${senderLabel} HELD: could not reach Zaal for approval`);
        }
        return;
      }

      // Default path (owner or community-asks disabled): reply directly.
      const chunks = chunkMessage(replyText);
      for (const chunk of chunks) {
        await message.reply({ content: chunk, allowedMentions: { repliedUser: false } });
      }
      if (nameAsk && result.reply) await markAsked('discord', message.author.id);
      console.log(`[zoe/discord] replied to ${senderLabel} in ${message.channel.isDMBased() ? 'DM' : 'channel'}`);
      featureRan('discord-reply', message.channel.isDMBased() ? 'DM' : 'channel');
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

    // Fail closed: with no DISCORD_ZAAL_ID nobody is Zaal. The old check
    // skipped itself when the id was unset, so anyone could press a button
    // (unreachable today, since no approval card is sent without the id).
    if (!DISCORD_ZAAL_ID || interaction.user.id !== DISCORD_ZAAL_ID) {
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
        if (pending.askedId) await markAsked('discord', pending.askedId);
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
