import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';
import { FarcasterWriteRefusedError, publishCast } from '../write';

// Ruling 305 (2026-11-07): ZOE does not post to Farcaster. publishCast is the one write gate and
// must refuse every call, before it reads a key or touches the network.

const KEY_VARS = [
  'FARCASTER_BOT_FID',
  'FARCASTER_WRITE_API_BASE',
  'FARCASTER_SIGNER_PRIVATE_KEY',
  'X402_PAYMENT_PRIVATE_KEY',
  'CUSTODY_PRIVATE_KEY',
] as const;

describe('publishCast refuses (ruling 305)', () => {
  const saved: Record<string, string | undefined> = {};
  let errSpy: MockInstance<typeof console.error>;
  let fetchSpy: MockInstance<typeof fetch>;
  const reads: string[] = [];
  let realEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    for (const k of KEY_VARS) saved[k] = process.env[k];
    // A fully configured write env: the refusal must not depend on anything being missing.
    process.env.FARCASTER_BOT_FID = '123';
    process.env.FARCASTER_WRITE_API_BASE = 'https://hub.example.com';
    process.env.FARCASTER_SIGNER_PRIVATE_KEY = 'stub-signer-not-a-key';
    process.env.X402_PAYMENT_PRIVATE_KEY = 'stub-x402-not-a-key';
    process.env.CUSTODY_PRIVATE_KEY = 'stub-custody-not-a-key';
    reads.length = 0;
    // Record any read of a key var during the call.
    realEnv = process.env;
    process.env = new Proxy(realEnv, {
      get(env, name) {
        if (typeof name === 'string' && (KEY_VARS as readonly string[]).includes(name)) reads.push(name);
        return Reflect.get(env, name);
      },
    });
    errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok'));
  });

  afterEach(() => {
    process.env = realEnv;
    errSpy.mockRestore();
    fetchSpy.mockRestore();
    for (const k of KEY_VARS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it('throws FarcasterWriteRefusedError for a cast', async () => {
    await expect(publishCast({ text: 'gm' })).rejects.toBeInstanceOf(FarcasterWriteRefusedError);
  });

  it('throws for a reply too', async () => {
    await expect(
      publishCast({ text: 'nice', parent: { fid: 1, hash: `0x${'ab'.repeat(20)}` } }),
    ).rejects.toThrow(/does not post to Farcaster \(ruling 305\)/);
  });

  it('logs exactly one refusal line', async () => {
    await publishCast({ text: 'gm' }).catch(() => {});
    expect(errSpy).toHaveBeenCalledTimes(1);
    expect(String(errSpy.mock.calls[0][0])).toContain('[zoe/farcaster] write refused');
  });

  it('makes no network call and reads no key or signer env var', async () => {
    await publishCast({ text: 'gm' }).catch(() => {});
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(reads).toEqual([]);
  });
});
