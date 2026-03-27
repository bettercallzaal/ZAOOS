function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string): string | undefined {
  return process.env[name] || undefined;
}

export const ENV = {
  // Public (safe for client)
  NEXT_PUBLIC_SUPABASE_URL: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  NEXT_PUBLIC_NEYNAR_CLIENT_ID: requireEnv('NEXT_PUBLIC_NEYNAR_CLIENT_ID'),

  // Server-only secrets
  SUPABASE_SERVICE_ROLE_KEY: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  NEYNAR_API_KEY: requireEnv('NEYNAR_API_KEY'),
  SESSION_SECRET: requireEnv('SESSION_SECRET'),
  APP_FID: requireEnv('APP_FID'),
  APP_SIGNER_PRIVATE_KEY: requireEnv('APP_SIGNER_PRIVATE_KEY'),

  // Optional
  NEYNAR_WEBHOOK_SECRET: optionalEnv('NEYNAR_WEBHOOK_SECRET'),
  NEXT_PUBLIC_SIWF_DOMAIN: optionalEnv('NEXT_PUBLIC_SIWF_DOMAIN'),
  NEXT_PUBLIC_WC_PROJECT_ID: optionalEnv('NEXT_PUBLIC_WC_PROJECT_ID'),

  // Content moderation (optional)
  PERSPECTIVE_API_KEY: optionalEnv('PERSPECTIVE_API_KEY'),

  // Minimax (optional)
  MINIMAX_API_KEY: optionalEnv('MINIMAX_API_KEY'),
  MINIMAX_MODEL: optionalEnv('MINIMAX_MODEL'),
  MINIMAX_API_URL: optionalEnv('MINIMAX_API_URL'),

  // @thezao official account (governance-powered posting)
  ZAO_OFFICIAL_FID: optionalEnv('ZAO_OFFICIAL_FID'),
  ZAO_OFFICIAL_SIGNER_UUID: optionalEnv('ZAO_OFFICIAL_SIGNER_UUID'),
  ZAO_OFFICIAL_NEYNAR_API_KEY: optionalEnv('ZAO_OFFICIAL_NEYNAR_API_KEY'),

  // WaveWarZ official account (governance-powered posting to /wavewarz channel)
  WAVEWARZ_OFFICIAL_FID: optionalEnv('WAVEWARZ_OFFICIAL_FID'),
  WAVEWARZ_OFFICIAL_SIGNER_UUID: optionalEnv('WAVEWARZ_OFFICIAL_SIGNER_UUID'),
  WAVEWARZ_OFFICIAL_NEYNAR_API_KEY: optionalEnv('WAVEWARZ_OFFICIAL_NEYNAR_API_KEY'),

  // X/Twitter cross-posting (shared ZAO app account, admin-only)
  X_API_KEY: optionalEnv('X_API_KEY'),
  X_API_SECRET: optionalEnv('X_API_SECRET'),
  X_ACCESS_TOKEN: optionalEnv('X_ACCESS_TOKEN'),
  X_ACCESS_SECRET: optionalEnv('X_ACCESS_SECRET'),

  // Lens Protocol V3
  NEXT_PUBLIC_LENS_APP_ADDRESS: optionalEnv('NEXT_PUBLIC_LENS_APP_ADDRESS'),

  // Telegram Bot API (cross-posting to Telegram channel/group)
  TELEGRAM_BOT_TOKEN: optionalEnv('TELEGRAM_BOT_TOKEN'),
  TELEGRAM_CHAT_ID: optionalEnv('TELEGRAM_CHAT_ID'),

  // Discord webhook (cross-posting to Discord channel)
  DISCORD_WEBHOOK_URL: optionalEnv('DISCORD_WEBHOOK_URL'),

  // NameStone ENS subnames (gasless subdomains for thezao.eth)
  NAMESTONE_API_KEY: optionalEnv('NAMESTONE_API_KEY'),
} as const;
