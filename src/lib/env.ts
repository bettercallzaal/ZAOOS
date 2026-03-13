function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function requirePublicEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const ENV = {
  // Public (safe for client)
  NEXT_PUBLIC_SUPABASE_URL: requirePublicEnv('NEXT_PUBLIC_SUPABASE_URL'),
  NEXT_PUBLIC_NEYNAR_CLIENT_ID: requirePublicEnv('NEXT_PUBLIC_NEYNAR_CLIENT_ID'),

  // Server-only secrets
  SUPABASE_SERVICE_ROLE_KEY: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  NEYNAR_API_KEY: requireEnv('NEYNAR_API_KEY'),
  SESSION_SECRET: requireEnv('SESSION_SECRET'),
  APP_FID: requireEnv('APP_FID'),
} as const;
