// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import {
  crossCheckCastSigner,
  crossCheckSignerAuthority,
  DEFAULT_HUB_URL,
  SECOND_HUB_URL,
} from '../signer-provenance';

// FID 3 values from the public hubs (on-chain data), as in signer-provenance.test.ts.
const FID = 3;
const CAST_HASH = '0x637dac8526ad7a2a1146cadb5b0ba60c77f95a71';
const KEY_A = '0xc887f5bf385a4718eaee166481f1832198938cf33e98a82dc81a0b4b81ffe33d';
const KEY_B = '0x8e59172f529684e8803ec73673da8fae8cdb30e674339249ce3fc090ba526486';
const HUB_A = 'https://hub-a.test';
const HUB_B = 'https://hub-b.test';
const NOW = () => new Date('2026-10-11T12:00:00Z');
const STAMP = '2026-10-11T12:00:00.000Z';

const cast = (signer: string) => ({
  data: { type: 'MESSAGE_TYPE_CAST_ADD', fid: FID },
  hash: CAST_HASH,
  signatureScheme: 'SIGNATURE_SCHEME_ED25519',
  signer,
});
const event = (key: string, eventType: string, blockNumber: number, logIndex = 0) => ({
  type: 'EVENT_TYPE_SIGNER',
  fid: FID,
  chainId: 10,
  blockNumber,
  logIndex,
  transactionHash: `0x${String(blockNumber).padStart(64, '0')}`,
  signerEventBody: { key, eventType },
});
const ADD_A = event(KEY_A, 'SIGNER_EVENT_TYPE_ADD', 100);
const REMOVE_A = event(KEY_A, 'SIGNER_EVENT_TYPE_REMOVE', 200);
const DOWN = new Error('timeout');

/** Two hubs, each answering every request with its own body (or failing). */
function hubs(a: unknown, b: unknown) {
  return vi.fn((url: string | URL | Request) => {
    const body = String(url).startsWith(HUB_A) ? a : b;
    if (body instanceof Error) return Promise.reject(body);
    return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
  });
}
const opts = (fetcher: ReturnType<typeof hubs>) => ({
  hubUrls: [HUB_A, HUB_B] as const,
  fetcher,
  now: NOW,
});

describe('the default pair of hubs', () => {
  it('is two different operators', () => {
    expect(SECOND_HUB_URL).not.toBe(DEFAULT_HUB_URL);
    expect(new URL(SECOND_HUB_URL).hostname).not.toBe(new URL(DEFAULT_HUB_URL).hostname);
  });

  it('is what both functions ask when no hubs are given', async () => {
    const fetcher = vi.fn(() => Promise.reject(DOWN));
    await crossCheckCastSigner(FID, CAST_HASH, { fetcher });
    const asked = fetcher.mock.calls.map((c) => String((c as unknown[])[0]));
    expect(asked.some((u) => u.startsWith(DEFAULT_HUB_URL))).toBe(true);
    expect(asked.some((u) => u.startsWith(SECOND_HUB_URL))).toBe(true);
  });
});

describe('crossCheckCastSigner', () => {
  it('returns the signer when both hubs name the same key', async () => {
    const r = await crossCheckCastSigner(FID, CAST_HASH, opts(hubs(cast(KEY_A), cast(KEY_A))));
    expect(r).toEqual({
      status: 'found',
      fid: FID,
      hash: CAST_HASH,
      signer: KEY_A,
      hubUrl: `${HUB_A},${HUB_B}`,
      observedAt: STAMP,
    });
  });

  it('treats the same key in different letter case as agreement', async () => {
    const upper = `0x${KEY_A.slice(2).toUpperCase()}`;
    const r = await crossCheckCastSigner(FID, CAST_HASH, opts(hubs(cast(KEY_A), cast(upper))));
    expect(r).toMatchObject({ status: 'found', signer: KEY_A });
  });

  it('is unknown, and picks neither key, when the hubs name different signers', async () => {
    const r = await crossCheckCastSigner(FID, CAST_HASH, opts(hubs(cast(KEY_A), cast(KEY_B))));
    expect(r).toMatchObject({ status: 'unknown', reason: 'hubs-disagree-on-signer' });
    expect(JSON.stringify(r)).not.toContain(KEY_A);
    expect(JSON.stringify(r)).not.toContain(KEY_B);
  });

  it.each([
    ['the first hub is down', DOWN, cast(KEY_A), HUB_A],
    ['the second hub is down', cast(KEY_A), DOWN, HUB_B],
    ['the second hub answers with garbage', cast(KEY_A), { nope: true }, HUB_B],
  ])('is unknown when %s: one hub alone is not enough', async (_n, a, b, missing) => {
    const r = await crossCheckCastSigner(FID, CAST_HASH, opts(hubs(a, b)));
    expect(r.status).toBe('unknown');
    expect(r.status === 'unknown' && r.reason).toContain(`unconfirmed-by-${missing}`);
  });

  it('is unknown when neither hub answers', async () => {
    const r = await crossCheckCastSigner(FID, CAST_HASH, opts(hubs(DOWN, DOWN)));
    expect(r.status).toBe('unknown');
  });

  it('refuses to cross-check a hub against itself', async () => {
    const fetcher = hubs(cast(KEY_A), cast(KEY_A));
    const r = await crossCheckCastSigner(FID, CAST_HASH, {
      hubUrls: [HUB_A, HUB_A],
      fetcher,
      now: NOW,
    });
    expect(r).toMatchObject({ status: 'unknown', reason: 'cross-check-needs-two-hubs' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('makes no hub call for invalid input', async () => {
    const fetcher = hubs(cast(KEY_A), cast(KEY_A));
    const r = await crossCheckCastSigner(0, CAST_HASH, opts(fetcher));
    expect(r).toMatchObject({ status: 'unknown', reason: 'invalid-input' });
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe('crossCheckSignerAuthority', () => {
  it('is active when both hubs say active on the same event', async () => {
    const r = await crossCheckSignerAuthority(
      FID,
      KEY_A,
      opts(hubs({ events: [ADD_A] }, { events: [ADD_A] })),
    );
    expect(r).toEqual({
      fid: FID,
      signer: KEY_A,
      hubUrl: `${HUB_A},${HUB_B}`,
      checkedAt: STAMP,
      status: 'active',
      reason: 'latest-event-add',
      event: {
        chainId: 10,
        blockNumber: 100,
        logIndex: 0,
        transactionHash: ADD_A.transactionHash,
      },
    });
  });

  it('is removed when both hubs say removed on the same event', async () => {
    const both = { events: [ADD_A, REMOVE_A] };
    const r = await crossCheckSignerAuthority(FID, KEY_A, opts(hubs(both, both)));
    expect(r).toMatchObject({ status: 'removed', event: { blockNumber: 200 } });
  });

  it.each([
    ['the first hub', { events: [ADD_A, REMOVE_A] }, { events: [ADD_A] }],
    ['the second hub', { events: [ADD_A] }, { events: [ADD_A, REMOVE_A] }],
  ])('a removal reported only by %s is unknown, not a removal', async (_n, a, b) => {
    const r = await crossCheckSignerAuthority(FID, KEY_A, opts(hubs(a, b)));
    expect(r.status).toBe('unknown');
    expect(r.reason).toContain('hubs-disagree-on-status');
    expect(r.event).toBeNull();
  });

  it('is unknown when the hubs agree on the status but cite different events', async () => {
    const r = await crossCheckSignerAuthority(
      FID,
      KEY_A,
      opts(hubs({ events: [ADD_A] }, { events: [event(KEY_A, 'SIGNER_EVENT_TYPE_ADD', 100, 5)] })),
    );
    expect(r).toMatchObject({ status: 'unknown', reason: 'hubs-disagree-on-event: both active' });
  });

  it.each([
    ['active', { events: [ADD_A] }],
    ['removed', { events: [ADD_A, REMOVE_A] }],
  ])('one hub saying %s while the other is down is unknown', async (status, answer) => {
    const r = await crossCheckSignerAuthority(FID, KEY_A, opts(hubs(answer, DOWN)));
    expect(r.status).toBe('unknown');
    expect(r.reason).toContain(`unconfirmed-by-${HUB_B}`);
    expect(r.reason).toContain(`other hub: ${status}`);
  });

  it('keeps the plain reason when both hubs agree there is no on-chain record', async () => {
    const none = { events: [] };
    const r = await crossCheckSignerAuthority(FID, KEY_A, opts(hubs(none, none)));
    expect(r).toMatchObject({ status: 'unknown', reason: 'no-onchain-record' });
  });

  it("one key's events never decide another key", async () => {
    const both = { events: [ADD_A, REMOVE_A, event(KEY_B, 'SIGNER_EVENT_TYPE_ADD', 150)] };
    const r = await crossCheckSignerAuthority(FID, KEY_B, opts(hubs(both, both)));
    expect(r).toMatchObject({ status: 'active', signer: KEY_B, event: { blockNumber: 150 } });
  });

  it('refuses to cross-check a hub against itself', async () => {
    const fetcher = hubs({ events: [ADD_A] }, { events: [ADD_A] });
    const r = await crossCheckSignerAuthority(FID, KEY_A, {
      hubUrls: [HUB_A, HUB_A],
      fetcher,
      now: NOW,
    });
    expect(r).toMatchObject({ status: 'unknown', reason: 'cross-check-needs-two-hubs' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('does not throw when both hubs fail', async () => {
    await expect(
      crossCheckSignerAuthority(FID, KEY_A, opts(hubs(DOWN, DOWN))),
    ).resolves.toMatchObject({ status: 'unknown', event: null });
  });
});
