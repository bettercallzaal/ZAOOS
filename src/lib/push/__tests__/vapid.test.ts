// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Static mocks declared before any dynamic import so vi.mock hoisting works.
vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type VapidModule = typeof import('../vapid');

async function loadModule(): Promise<VapidModule> {
  return import('../vapid');
}

async function getWebpush() {
  const wp = (await import('web-push')).default;
  return wp as {
    setVapidDetails: ReturnType<typeof vi.fn>;
    sendNotification: ReturnType<typeof vi.fn>;
  };
}

async function getLogger() {
  const { logger } = await import('@/lib/logger');
  return logger as { warn: ReturnType<typeof vi.fn>; info: ReturnType<typeof vi.fn> };
}

const SUBSCRIPTION = {
  endpoint: 'https://push.example.com/sub/123',
  keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
};

const PAYLOAD = { title: 'Hello', body: 'World' };

// ---------------------------------------------------------------------------
// describe: getVapidPublicKey
// ---------------------------------------------------------------------------

describe('getVapidPublicKey', () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;
    vi.resetModules();
  });

  it('returns the NEXT_PUBLIC_VAPID_PUBLIC_KEY env var value', async () => {
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'pk-test-abc';
    process.env.VAPID_PRIVATE_KEY = 'sk-test-xyz';
    const { getVapidPublicKey } = await loadModule();
    expect(getVapidPublicKey()).toBe('pk-test-abc');
  });

  it('returns empty string when NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set', async () => {
    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;
    const { getVapidPublicKey } = await loadModule();
    expect(getVapidPublicKey()).toBe('');
  });
});

// ---------------------------------------------------------------------------
// describe: webpush.setVapidDetails — module init
// ---------------------------------------------------------------------------

describe('webpush.setVapidDetails at module init', () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;
    delete process.env.VAPID_SUBJECT;
    vi.resetModules();
  });

  it('is called with subject, public key, and private key when both keys are set', async () => {
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'pk-init';
    process.env.VAPID_PRIVATE_KEY = 'sk-init';
    process.env.VAPID_SUBJECT = 'mailto:test@example.com';
    await loadModule();
    const wp = await getWebpush();
    expect(wp.setVapidDetails).toHaveBeenCalledWith('mailto:test@example.com', 'pk-init', 'sk-init');
  });

  it('is NOT called when keys are missing', async () => {
    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;
    const wp = await getWebpush();
    wp.setVapidDetails.mockClear();
    await loadModule();
    expect(wp.setVapidDetails).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// describe: sendPushNotification — VAPID keys configured
// ---------------------------------------------------------------------------

describe('sendPushNotification (VAPID keys configured)', () => {
  let sendPushNotification: VapidModule['sendPushNotification'];

  beforeEach(async () => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'pk-test';
    process.env.VAPID_PRIVATE_KEY = 'sk-test';
    const mod = await loadModule();
    sendPushNotification = mod.sendPushNotification;
    // Reset sendNotification mock state so each test starts clean
    const wp = await getWebpush();
    wp.sendNotification.mockReset();
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;
  });

  it('returns true when webpush.sendNotification resolves', async () => {
    const wp = await getWebpush();
    wp.sendNotification.mockResolvedValue(undefined);
    const result = await sendPushNotification(SUBSCRIPTION, PAYLOAD);
    expect(result).toBe(true);
  });

  it('passes JSON.stringify(payload) to webpush.sendNotification', async () => {
    const wp = await getWebpush();
    wp.sendNotification.mockResolvedValue(undefined);
    await sendPushNotification(SUBSCRIPTION, PAYLOAD);
    expect(wp.sendNotification).toHaveBeenCalledWith(SUBSCRIPTION, JSON.stringify(PAYLOAD));
  });

  it('returns false on 404 statusCode (expired subscription)', async () => {
    const wp = await getWebpush();
    wp.sendNotification.mockRejectedValue({ statusCode: 404 });
    const result = await sendPushNotification(SUBSCRIPTION, PAYLOAD);
    expect(result).toBe(false);
  });

  it('logs info message on 404 statusCode', async () => {
    const wp = await getWebpush();
    wp.sendNotification.mockRejectedValue({ statusCode: 404 });
    const log = await getLogger();
    log.info.mockClear();
    await sendPushNotification(SUBSCRIPTION, PAYLOAD);
    expect(log.info).toHaveBeenCalledWith('[push] Subscription expired or invalid, should be removed');
  });

  it('returns false on 410 statusCode (gone subscription)', async () => {
    const wp = await getWebpush();
    wp.sendNotification.mockRejectedValue({ statusCode: 410 });
    const result = await sendPushNotification(SUBSCRIPTION, PAYLOAD);
    expect(result).toBe(false);
  });

  it('returns false on other errors without throwing', async () => {
    const wp = await getWebpush();
    wp.sendNotification.mockRejectedValue(new Error('Network failure'));
    await expect(sendPushNotification(SUBSCRIPTION, PAYLOAD)).resolves.toBe(false);
  });
});

// ---------------------------------------------------------------------------
// describe: sendPushNotification — NO VAPID keys
// ---------------------------------------------------------------------------

describe('sendPushNotification (NO VAPID keys)', () => {
  let sendPushNotification: VapidModule['sendPushNotification'];

  beforeEach(async () => {
    vi.resetModules();
    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;
    const mod = await loadModule();
    sendPushNotification = mod.sendPushNotification;
    const wp = await getWebpush();
    wp.sendNotification.mockReset();
  });

  it('returns false immediately without calling webpush.sendNotification', async () => {
    const wp = await getWebpush();
    const result = await sendPushNotification(SUBSCRIPTION, PAYLOAD);
    expect(result).toBe(false);
    expect(wp.sendNotification).not.toHaveBeenCalled();
  });

  it('logs a warn message when keys are not configured', async () => {
    const log = await getLogger();
    log.warn.mockClear();
    await sendPushNotification(SUBSCRIPTION, PAYLOAD);
    expect(log.warn).toHaveBeenCalledWith('[push] VAPID keys not configured — skipping push notification');
  });
});
