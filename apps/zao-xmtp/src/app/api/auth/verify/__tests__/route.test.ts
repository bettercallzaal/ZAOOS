import { NextRequest } from 'next/server';
import { createSiweMessage } from 'viem/siwe';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { session, consumeNonce, verifySignInMessage } = vi.hoisted(() => ({
  session: { nonce: undefined as string | undefined, save: vi.fn() },
  consumeNonce: vi.fn(),
  verifySignInMessage: vi.fn(),
}));
vi.mock('@/lib/session', () => ({ getSession: vi.fn(async () => session) }));
vi.mock('@/lib/nonces', () => ({ consumeNonce, NONCE_TTL_MS: 10 * 60 * 1000 }));
vi.mock('@/lib/env', () => ({
  appDomain: () => 'localhost:3000',
  hubUrl: () => undefined,
  optimismRpcUrl: () => 'http://rpc.invalid',
}));
vi.mock('@farcaster/auth-client', () => ({
  createAppClient: () => ({ verifySignInMessage }),
  viemConnector: () => ({}),
}));

import { POST } from '../route';

const NONCE = 'abcdef0123456789';
function message(issuedAt: Date) {
  return createSiweMessage({
    address: '0x1111111111111111111111111111111111111111',
    chainId: 10,
    domain: 'localhost:3000',
    nonce: NONCE,
    uri: 'http://localhost:3000',
    version: '1',
    issuedAt,
  });
}

let ip = 0;
function req(body: unknown, forwardedFor?: string) {
  ip += 1;
  return new NextRequest('http://localhost/api/auth/verify', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': forwardedFor ?? `10.1.0.${ip}` },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/verify - replay and expiry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    session.nonce = NONCE;
    verifySignInMessage.mockResolvedValue({ isError: true, success: false });
  });

  it('refuses a nonce the server store has already consumed (replay), before checking the signature', async () => {
    consumeNonce.mockResolvedValue(false);
    const res = await POST(req({ message: message(new Date()), signature: '0xab' }));
    expect(res.status).toBe(400);
    expect(consumeNonce).toHaveBeenCalledWith(NONCE);
    expect(verifySignInMessage).not.toHaveBeenCalled();
  });

  it('refuses a message issued more than 10 minutes ago, without spending a nonce', async () => {
    consumeNonce.mockResolvedValue(true);
    const old = new Date(Date.now() - 11 * 60 * 1000);
    const res = await POST(req({ message: message(old), signature: '0xab' }));
    expect(res.status).toBe(400);
    expect(consumeNonce).not.toHaveBeenCalled();
  });

  it('refuses when the cookie holds no nonce', async () => {
    session.nonce = undefined;
    const res = await POST(req({ message: message(new Date()), signature: '0xab' }));
    expect(res.status).toBe(400);
  });

  it('answers 503, not "invalid", when the nonce store errors', async () => {
    consumeNonce.mockRejectedValue(new Error('db down'));
    const res = await POST(req({ message: message(new Date()), signature: '0xab' }));
    expect(res.status).toBe(503);
  });

  it('reaches signature verification with a fresh nonce and a recent message', async () => {
    consumeNonce.mockResolvedValue(true);
    const res = await POST(req({ message: message(new Date()), signature: '0xab' }));
    expect(verifySignInMessage).toHaveBeenCalledOnce();
    expect(res.status).toBe(401);
  });

  it('429 after 10 attempts a minute from one IP', async () => {
    consumeNonce.mockResolvedValue(false);
    const statuses: number[] = [];
    for (let i = 0; i < 11; i++) {
      statuses.push((await POST(req({ message: 'x', signature: '0xab' }, '192.0.2.9'))).status);
    }
    expect(statuses[10]).toBe(429);
  });
});
