/**
 * Server env, read on first use. `next build` imports route modules without a
 * real env, so a missing value throws when a request needs it, not at import.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var ${name} (see .env.example)`);
  return value;
}

export function sessionSecret(): string {
  const secret = required('SESSION_SECRET');
  if (secret.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters');
  return secret;
}

export const appDomain = (): string => required('APP_DOMAIN');
export const optimismRpcUrl = (): string => process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io';
export const hubUrl = (): string | undefined => process.env.FARCASTER_HUB_URL || undefined;
export const supabaseUrl = (): string => required('SUPABASE_URL');
export const supabaseServiceRoleKey = (): string => required('SUPABASE_SERVICE_ROLE_KEY');
