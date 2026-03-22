import { REST } from '@discordjs/rest';
import { Routes, type APIMessage, type APIGuildMember, type APIThreadChannel } from 'discord-api-types/v10';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;

let restClient: REST | null = null;

function getClient(): REST | null {
  if (!DISCORD_BOT_TOKEN) return null;
  if (!restClient) {
    restClient = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN);
  }
  return restClient;
}

/**
 * Read messages from a Discord channel
 */
export async function getChannelMessages(
  channelId: string,
  limit = 50
): Promise<APIMessage[]> {
  const client = getClient();
  if (!client) return [];

  try {
    const messages = await client.get(
      Routes.channelMessages(channelId),
      { query: new URLSearchParams({ limit: String(limit) }) }
    ) as APIMessage[];
    return messages;
  } catch (err) {
    console.error('[Discord] Failed to fetch messages:', err);
    return [];
  }
}

/**
 * Read guild members
 */
export async function getGuildMembers(limit = 100): Promise<APIGuildMember[]> {
  const client = getClient();
  if (!client || !DISCORD_GUILD_ID) return [];

  try {
    const members = await client.get(
      Routes.guildMembers(DISCORD_GUILD_ID),
      { query: new URLSearchParams({ limit: String(limit) }) }
    ) as APIGuildMember[];
    return members;
  } catch (err) {
    console.error('[Discord] Failed to fetch members:', err);
    return [];
  }
}

/**
 * Read active threads in a channel
 */
export async function getActiveThreads(): Promise<APIThreadChannel[]> {
  const client = getClient();
  if (!client || !DISCORD_GUILD_ID) return [];

  try {
    const result = await client.get(
      Routes.guildActiveThreads(DISCORD_GUILD_ID)
    ) as { threads: APIThreadChannel[] };
    return result.threads ?? [];
  } catch (err) {
    console.error('[Discord] Failed to fetch threads:', err);
    return [];
  }
}

/**
 * Read messages from a specific thread
 */
export async function getThreadMessages(
  threadId: string,
  limit = 50
): Promise<APIMessage[]> {
  return getChannelMessages(threadId, limit);
}

/**
 * Check if Discord integration is configured
 */
export function isDiscordConfigured(): boolean {
  return Boolean(DISCORD_BOT_TOKEN && DISCORD_GUILD_ID);
}
