/**
 * config.ts — ZAI Discord bot configuration validation.
 *
 * Reads and validates environment variables on startup. All required config
 * must be present before the bot can start.
 */

import { z } from 'zod';

const ConfigSchema = z.object({
  discordToken: z.string().min(1).describe('DISCORD_CAPTURE_TOKEN or ZAI_DISCORD_TOKEN'),
  zaalGuildId: z.string().min(1).describe('Guild (server) ID where ZAI operates'),
  zaalUserId: z.string().min(1).describe('Zaal user ID for admin checks'),
  groqApiKey: z.string().min(1).describe('GROQ_API_KEY for voice transcription'),
  anthropicApiKey: z.string().min(1).describe('ANTHROPIC_API_KEY for Q&A + summaries'),
});

type Config = z.infer<typeof ConfigSchema>;

let cachedConfig: Config | null = null;

export function loadConfig(): Config {
  if (cachedConfig) return cachedConfig;

  const token = process.env.DISCORD_CAPTURE_TOKEN || process.env.ZAI_DISCORD_TOKEN;
  const config = ConfigSchema.parse({
    discordToken: token,
    zaalGuildId: process.env.ZAAL_GUILD_ID || process.env.DISCORD_GUILD_ID || '',
    zaalUserId: process.env.ZAAL_USER_ID || '0',
    groqApiKey: process.env.GROQ_API_KEY || '',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  });

  cachedConfig = config;
  return config;
}

export function getConfig(): Config {
  return cachedConfig || loadConfig();
}

export function isConfigured(): boolean {
  try {
    loadConfig();
    return true;
  } catch {
    return false;
  }
}
