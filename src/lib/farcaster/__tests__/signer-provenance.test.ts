// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import {
  checkSignerAuthority,
  fetchCastSigner,
  resolveSignerAuthority,
  type SignerEvent,
} from '../signer-provenance';

// Real values from the Haatz Snapchain mirror, fetched 2026-10-09 for FID 3
// (public on-chain data), trimmed to the fields the code reads.
const FID = 3;
const CAST_HASH = '0x637dac8526ad7a2a1146cadb5b0ba60c77f95a71';
const KEY_A = '0xc887f5bf385a4718eaee166481f1832198938cf33e98a82dc81a0b4b81ffe33d';
const KEY_B = '0x8e59172f529684e8803ec73673da8fae8cdb30e674339249ce3fc090ba526486';
const HUB_CAST = {
  data: {
    type: 'MESSAGE_TYPE_CAST_ADD',
    fid: FID,
    timestamp: 1,
    network: 'FARCASTER_NETWORK_MAINNET',
  },
  hash: CAST_HASH,
  hashScheme: 'HASH_SCHEME_BLAKE3',
  signatureScheme: 'SIGNATURE_SCHEME_ED25519',
  signer: KEY_A,
};

function ev(
  key: string,
  eventType: string,
  blockNumber: number,
  logIndex = 0,
  fid = FID,
): SignerEvent {
  return {
    type: 'EVENT_TYPE_SIGNER',
    fid,
    chainId: 10,
    blockNumber,
    logIndex,
    transactionHash: `0x${String(blockNumber).padStart(64, '0')}`,
    signerEventBody: { key, eventType },
  };
}
const HUB_EVENTS = [
  ev(KEY_A, 'SIGNER_EVENT_TYPE_ADD', 111898433, 26),
  ev(KEY_B, 'SIGNER_EVENT_TYPE_ADD', 135350371, 98),
];

const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));
const NOW = () => new Date('2026-10-09T12:00:00Z');

describe('fetchCastSigner', () => {
  it('returns the key that signed the cast', async () => {
    const fetcher = vi.fn(() => json(HUB_CAST));
    const r = await fetchCastSigner(FID, CAST_HASH, { fetcher, now: NOW });
    expect(r).toMatchObject({
      status: 'found',
      signer: KEY_A,
      observedAt: '2026-10-09T12:00:00.000Z',
    });
    expect(fetcher).toHaveBeenCalledWith(
      `https://haatz.quilibrium.com/v1/castById?fid=3&hash=${CAST_HASH}`,
      expect.anything(),
    );
  });

  it.each([
    ['an HTTP error', () => json({}, 500), 'hub-unreachable'],
    ['a network failure', () => Promise.reject(new Error('timeout')), 'hub-unreachable'],
    [
      'a body without a signer',
      () => json({ ...HUB_CAST, signer: undefined }),
      'malformed-hub-response',
    ],
    [
      'a non-Ed25519 signature',
      () => json({ ...HUB_CAST, signatureScheme: 'X' }),
      'malformed-hub-response',
    ],
    [
      'an answer for another FID',
      () => json({ ...HUB_CAST, data: { ...HUB_CAST.data, fid: 4 } }),
      'hub-answered-for-another-cast',
    ],
    [
      'an answer for another hash',
      () => json({ ...HUB_CAST, hash: `0x${'1'.repeat(40)}` }),
      'hub-answered-for-another-cast',
    ],
  ])('is unknown, never a signer, on %s', async (_name, impl, reason) => {
    const r = await fetchCastSigner(FID, CAST_HASH, { fetcher: vi.fn(impl) });
    expect(r.status).toBe('unknown');
    expect(r.status === 'unknown' && r.reason).toContain(reason);
  });

  it('does not call the hub for invalid input', async () => {
    const fetcher = vi.fn();
    expect((await fetchCastSigner(0, CAST_HASH, { fetcher })).status).toBe('unknown');
    expect((await fetchCastSigner(FID, 'not-a-hash', { fetcher })).status).toBe('unknown');
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe('resolveSignerAuthority - one key at a time', () => {
  it('removing signer A does not touch signer B on the same FID', () => {
    const events = [...HUB_EVENTS, ev(KEY_A, 'SIGNER_EVENT_TYPE_REMOVE', 140000000)];
    expect(resolveSignerAuthority(FID, KEY_A, events).status).toBe('removed');
    expect(resolveSignerAuthority(FID, KEY_B, events).status).toBe('active');
  });

  it('the latest event wins, whatever order the hub returns them in', () => {
    const removedThenReadded = [
      ev(KEY_A, 'SIGNER_EVENT_TYPE_ADD', 300, 1),
      ev(KEY_A, 'SIGNER_EVENT_TYPE_ADD', 100),
      ev(KEY_A, 'SIGNER_EVENT_TYPE_REMOVE', 300, 0),
    ];
    expect(resolveSignerAuthority(FID, KEY_A, removedThenReadded)).toMatchObject({
      status: 'active',
      event: { blockNumber: 300, logIndex: 1 },
    });
  });

  it('a key with no on-chain record is unknown, not active', () => {
    expect(resolveSignerAuthority(FID, `0x${'ab'.repeat(32)}`, HUB_EVENTS)).toMatchObject({
      status: 'unknown',
      reason: 'no-onchain-record',
    });
  });

  it("another FID's event for the same key grants nothing", () => {
    expect(
      resolveSignerAuthority(FID, KEY_A, [ev(KEY_A, 'SIGNER_EVENT_TYPE_ADD', 1, 0, 99)]).status,
    ).toBe('unknown');
  });

  it('an event type it does not handle is unknown', () => {
    expect(
      resolveSignerAuthority(FID, KEY_A, [ev(KEY_A, 'SIGNER_EVENT_TYPE_ADMIN_RESET', 5)]).status,
    ).toBe('unknown');
  });

  it('matches keys case-insensitively', () => {
    expect(
      resolveSignerAuthority(FID, KEY_A.toUpperCase().replace('0X', '0x'), HUB_EVENTS).status,
    ).toBe('active');
  });
});

describe('checkSignerAuthority', () => {
  it('resolves a key from the hub, with the event it rests on', async () => {
    const fetcher = vi.fn(() => json({ events: HUB_EVENTS }));
    const r = await checkSignerAuthority(FID, KEY_A, { fetcher, now: NOW });
    expect(r).toMatchObject({
      status: 'active',
      event: { chainId: 10, blockNumber: 111898433, logIndex: 26 },
    });
    expect(r.checkedAt).toBe('2026-10-09T12:00:00.000Z');
  });

  it('a failed check is unknown, never removed (a timeout is not a revocation)', async () => {
    const r = await checkSignerAuthority(FID, KEY_A, {
      fetcher: vi.fn(() => Promise.reject(new Error('timeout'))),
    });
    expect(r.status).toBe('unknown');
  });

  it('follows page tokens and sees a REMOVE on a later page', async () => {
    const fetcher = vi
      .fn()
      .mockImplementationOnce(() => json({ events: HUB_EVENTS, nextPageToken: 'p2' }))
      .mockImplementationOnce(() =>
        json({ events: [ev(KEY_A, 'SIGNER_EVENT_TYPE_REMOVE', 150000000)] }),
      );
    expect((await checkSignerAuthority(FID, KEY_A, { fetcher })).status).toBe('removed');
    expect(fetcher.mock.calls[1][0]).toContain('pageToken=p2');
  });

  it('a list it could not read to the end is unknown', async () => {
    const fetcher = vi.fn(() => json({ events: HUB_EVENTS, nextPageToken: 'more' }));
    expect(await checkSignerAuthority(FID, KEY_A, { fetcher })).toMatchObject({
      status: 'unknown',
      reason: 'too-many-pages',
    });
  });

  it('one malformed event makes the whole answer unknown', async () => {
    const fetcher = vi.fn(() =>
      json({ events: [...HUB_EVENTS, { type: 'EVENT_TYPE_SIGNER', fid: 3 }] }),
    );
    expect((await checkSignerAuthority(FID, KEY_A, { fetcher })).status).toBe('unknown');
  });
});
