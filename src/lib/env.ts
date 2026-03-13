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
  NEXT_PUBLIC_SIWF_DOMAIN: requirePublicEnv('NEXT_PUBLIC_SIWF_DOMAIN'),

  // Server-only secrets
  SUPABASE_SERVICE_ROLE_KEY: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  NEYNAR_API_KEY: requireEnv('NEYNAR_API_KEY'),
  SESSION_SECRET: requireEnv('SESSION_SECRET'),
  APP_FID: requireEnv('APP_FID'),
  APP_SIGNER_PRIVATE_KEY: requireEnv('APP_SIGNER_PRIVATE_KEY'),
} as const;
