import { NextRequest } from 'next/server';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addressClaimMessage, signWithLocalKey } from '@/lib/xmtp/address-claim';

const { requireMember, setXmtpAddress } = vi.hoisted(() => ({
  requireMember: vi.fn(),
  setXmtpAddress: vi.fn(),
}));
vi.mock('@/lib/membership', () => ({ requireMember }));
vi.mock('@/lib/directory', async () => {
  class XmtpAddressTakenError extends Error {}
  class MemberNotInDirectoryError extends Error {}
  return { setXmtpAddress, XmtpAddressTakenError, MemberNotInDirectoryError };
});

import { MemberNotInDirectoryError, XmtpAddressTakenError } from '@/lib/directory';
import { POST } from '../route';

const FID = 42;
const key = generatePrivateKey();
const own = privateKeyToAccount(key).address.toLowerCase();
const other = privateKeyToAccount(generatePrivateKey()).address.toLowerCase();

let ip = 0;
function post(body: unknown) {
  ip += 1; // a fresh IP per request keeps the rate limiter out of these tests
  return new NextRequest('http://localhost/api/users/xmtp-address', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.0.0.${ip}` },
    body: JSON.stringify(body),
  });
}

describe('POST /api/users/xmtp-address', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireMember.mockResolvedValue({ fid: FID });
    setXmtpAddress.mockResolvedValue(undefined);
  });

  it('401 without a member session, before reading the body', async () => {
    requireMember.mockResolvedValue(null);
    const res = await POST(post({}));
    expect(res.status).toBe(401);
    expect(setXmtpAddress).not.toHaveBeenCalled();
  });

  it('saves an address proven by its own key', async () => {
    const signature = await signWithLocalKey(key, addressClaimMessage(own, FID));
    const res = await POST(post({ xmtpAddress: own, signature }));
    expect(res.status).toBe(200);
    expect(setXmtpAddress).toHaveBeenCalledWith(FID, own);
  });

  it('401 when a member tries to register an address they do not control', async () => {
    const signature = await signWithLocalKey(key, addressClaimMessage(other, FID));
    const res = await POST(post({ xmtpAddress: other, signature }));
    expect(res.status).toBe(401);
    expect(setXmtpAddress).not.toHaveBeenCalled();
  });

  it('401 when the signature was made for a different FID', async () => {
    const signature = await signWithLocalKey(key, addressClaimMessage(own, FID + 1));
    const res = await POST(post({ xmtpAddress: own, signature }));
    expect(res.status).toBe(401);
  });

  it('400 with no signature', async () => {
    expect((await POST(post({ xmtpAddress: own }))).status).toBe(400);
  });

  it('409 when the address belongs to another member', async () => {
    setXmtpAddress.mockRejectedValue(new XmtpAddressTakenError('taken'));
    const signature = await signWithLocalKey(key, addressClaimMessage(own, FID));
    expect((await POST(post({ xmtpAddress: own, signature }))).status).toBe(409);
  });

  it('404, not 200, when the member has no directory row to update', async () => {
    setXmtpAddress.mockRejectedValue(new MemberNotInDirectoryError('no row'));
    const signature = await signWithLocalKey(key, addressClaimMessage(own, FID));
    expect((await POST(post({ xmtpAddress: own, signature }))).status).toBe(404);
  });

  it('429 after 10 writes a minute from one IP', async () => {
    requireMember.mockResolvedValue(null);
    const fixed = () =>
      new NextRequest('http://localhost/api/users/xmtp-address', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '192.0.2.1' },
        body: '{}',
      });
    const statuses: number[] = [];
    for (let i = 0; i < 11; i++) statuses.push((await POST(fixed())).status);
    expect(statuses.slice(0, 10).every((s) => s === 401)).toBe(true);
    expect(statuses[10]).toBe(429);
  });
});
