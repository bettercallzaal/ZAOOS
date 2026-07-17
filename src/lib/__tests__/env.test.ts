// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// All required env vars that env.ts calls requireEnv() on at module load
const REQUIRED_VARS: Record<string, string> = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  NEXT_PUBLIC_NEYNAR_CLIENT_ID: 'test-neynar-client-id',
  SUPABASE_SERVICE_ROLE_KEY: 'test-supabase-service-role-key',
  NEYNAR_API_KEY: 'test-neynar-api-key',
  SESSION_SECRET: 'test-session-secret',
  APP_FID: '12345',
  APP_SIGNER_PRIVATE_KEY: 'test-app-signer-private-key',
};

function setRequired() {
  for (const [k, v] of Object.entries(REQUIRED_VARS)) process.env[k] = v;
}

function clearRequired() {
  for (const k of Object.keys(REQUIRED_VARS)) delete process.env[k];
}

describe('ENV module', () => {
  beforeEach(() => {
    vi.resetModules();
    setRequired();
  });

  afterEach(() => {
    clearRequired();
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.CRM_BOT_SECRET;
    delete process.env.CRM_CAPTURE_TOKEN;
  });

  it('loads and exposes required var values', async () => {
    const { ENV } = await import('../env');
    expect(ENV.NEXT_PUBLIC_SUPABASE_URL).toBe('https://test.supabase.co');
    expect(ENV.NEYNAR_API_KEY).toBe('test-neynar-api-key');
    expect(ENV.APP_FID).toBe('12345');
  });

  it('throws when a required var is missing', async () => {
    delete process.env.NEYNAR_API_KEY;
    await expect(import('../env')).rejects.toThrow(
      'Missing required environment variable: NEYNAR_API_KEY',
    );
  });

  it('returns undefined for unset optional vars', async () => {
    const { ENV } = await import('../env');
    expect(ENV.TELEGRAM_BOT_TOKEN).toBeUndefined();
    expect(ENV.DISCORD_WEBHOOK_URL).toBeUndefined();
    expect(ENV.PRIVY_APP_ID).toBeUndefined();
    expect(ENV.CRM_BOT_SECRET).toBeUndefined();
  });

  it('captures an optional var when set', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token';
    const { ENV } = await import('../env');
    expect(ENV.TELEGRAM_BOT_TOKEN).toBe('test-bot-token');
  });
});

describe('optionalSecretEnv validation', () => {
  beforeEach(() => {
    vi.resetModules();
    setRequired();
  });

  afterEach(() => {
    clearRequired();
    delete process.env.CRM_BOT_SECRET;
    delete process.env.CRM_CAPTURE_TOKEN;
  });

  it('throws when CRM_BOT_SECRET is set but shorter than 32 chars', async () => {
    process.env.CRM_BOT_SECRET = 'tooshort';
    await expect(import('../env')).rejects.toThrow('CRM_BOT_SECRET is set but too short');
  });

  it('allows CRM_BOT_SECRET when exactly 32 chars', async () => {
    const secret = 'a'.repeat(32);
    process.env.CRM_BOT_SECRET = secret;
    const { ENV } = await import('../env');
    expect(ENV.CRM_BOT_SECRET).toBe(secret);
  });

  it('allows CRM_BOT_SECRET longer than 32 chars', async () => {
    const secret = 'a'.repeat(64);
    process.env.CRM_BOT_SECRET = secret;
    const { ENV } = await import('../env');
    expect(ENV.CRM_BOT_SECRET).toBe(secret);
  });

  it('throws when CRM_CAPTURE_TOKEN is shorter than 16 chars', async () => {
    process.env.CRM_CAPTURE_TOKEN = 'short';
    await expect(import('../env')).rejects.toThrow('CRM_CAPTURE_TOKEN is set but too short');
  });

  it('allows CRM_CAPTURE_TOKEN when at least 16 chars', async () => {
    const token = 'a'.repeat(16);
    process.env.CRM_CAPTURE_TOKEN = token;
    const { ENV } = await import('../env');
    expect(ENV.CRM_CAPTURE_TOKEN).toBe(token);
  });
});
