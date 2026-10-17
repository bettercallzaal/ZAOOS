import { describe, expect, it, vi } from 'vitest';
import { type Fetcher, getProfile, getVerifiedEthAddresses } from '@/lib/hub';

function respond(pages: Array<{ ok?: boolean; status?: number; body?: unknown; throws?: boolean }>): Fetcher & {
  mock: { calls: unknown[][] };
} {
  let i = 0;
  return vi.fn(async () => {
    const page = pages[Math.min(i++, pages.length - 1)];
    if (page.throws) throw new Error('network');
    return { ok: page.ok ?? true, status: page.status ?? 200, json: async () => page.body };
  }) as unknown as Fetcher & { mock: { calls: unknown[][] } };
}

const eth = (address: string) => ({
  data: { verificationAddAddressBody: { address, protocol: 'PROTOCOL_ETHEREUM' } },
});
const sol = (address: string) => ({
  data: { verificationAddAddressBody: { address, protocol: 'PROTOCOL_SOLANA' } },
});

describe('getVerifiedEthAddresses', () => {
  it('returns Ethereum addresses only, lowercased and deduped', async () => {
    const fetcher = respond([
      { body: { messages: [eth('0xAbC0000000000000000000000000000000000001'), sol('So1'), eth('0xabc0000000000000000000000000000000000001')] } },
    ]);
    await expect(getVerifiedEthAddresses(1, { fetcher })).resolves.toEqual([
      '0xabc0000000000000000000000000000000000001',
    ]);
  });

  it('follows nextPageToken', async () => {
    const fetcher = respond([
      { body: { messages: [eth('0x0000000000000000000000000000000000000001')], nextPageToken: 'p2' } },
      { body: { messages: [eth('0x0000000000000000000000000000000000000002')] } },
    ]);
    const result = await getVerifiedEthAddresses(1, { fetcher, hubUrl: 'https://hub.example' });
    expect(result).toHaveLength(2);
    expect(fetcher.mock.calls[1][0]).toBe('https://hub.example/v1/verificationsByFid?fid=1&pageToken=p2');
  });

  it('returns [] when the hub answers with no verifications', async () => {
    await expect(getVerifiedEthAddresses(1, { fetcher: respond([{ body: { messages: [] } }]) })).resolves.toEqual([]);
  });

  it.each([
    ['a non-200', { ok: false, status: 500, body: {} }],
    ['a network error', { throws: true }],
    ['a body without messages', { body: { error: 'x' } }],
  ])('returns null (unreadable, not empty) on %s', async (_label, page) => {
    await expect(getVerifiedEthAddresses(1, { fetcher: respond([page]) })).resolves.toBeNull();
  });
});

describe('getProfile', () => {
  it('reads username, display name and avatar', async () => {
    const fetcher = respond([
      {
        body: {
          messages: [
            { data: { userDataBody: { type: 'USER_DATA_TYPE_USERNAME', value: 'zaal' } } },
            { data: { userDataBody: { type: 'USER_DATA_TYPE_DISPLAY', value: 'Zaal' } } },
            { data: { userDataBody: { type: 'USER_DATA_TYPE_PFP', value: 'https://img.example/p.png' } } },
            { data: { userDataBody: { type: 'USER_DATA_TYPE_BIO', value: 'ignored' } } },
          ],
        },
      },
    ]);
    await expect(getProfile(1, { fetcher })).resolves.toEqual({
      username: 'zaal',
      displayName: 'Zaal',
      pfpUrl: 'https://img.example/p.png',
    });
  });

  it('returns nulls when the hub is unreadable', async () => {
    await expect(getProfile(1, { fetcher: respond([{ throws: true }]) })).resolves.toEqual({
      username: null,
      displayName: null,
      pfpUrl: null,
    });
  });
});
