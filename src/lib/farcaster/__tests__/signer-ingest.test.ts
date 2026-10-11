// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockProvenanceUpsert = vi.hoisted(() => vi.fn());
const mockAuthorityUpsert = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() =>
  vi.fn().mockImplementation((table: string) => {
    if (table === 'cast_signer_provenance') return { upsert: mockProvenanceUpsert };
    if (table === 'farcaster_signer_authority') return { upsert: mockAuthorityUpsert };
    throw new Error(`unexpected table ${table}`);
  }),
);
vi.mock('@/lib/db/supabase', () => ({ supabaseAdmin: { from: mockFrom } }));

import { recordCastSigner, signerIngestEnabled, signerSecondHubEnabled } from '../signer-ingest';
import { DEFAULT_HUB_URL, SECOND_HUB_URL } from '../signer-provenance';

// Real values from the Haatz Snapchain mirror, fetched 2026-10-09 for FID 3
// (public on-chain data); the same fixtures signer-provenance.test.ts uses.
const FID = 3;
const CAST_HASH = '0x637dac8526ad7a2a1146cadb5b0ba60c77f95a71';
const KEY_A = '0xc887f5bf385a4718eaee166481f1832198938cf33e98a82dc81a0b4b81ffe33d';
const KEY_B = '0x8e59172f529684e8803ec73673da8fae8cdb30e674339249ce3fc090ba526486';
const HUB = 'https://hub.test';
const NOW = () => new Date('2026-10-11T12:00:00Z');
const STAMP = '2026-10-11T12:00:00.000Z';

const hubCast = (signer = KEY_A) => ({
  data: { type: 'MESSAGE_TYPE_CAST_ADD', fid: FID },
  hash: CAST_HASH,
  signatureScheme: 'SIGNATURE_SCHEME_ED25519',
  signer,
});
const event = (key: string, eventType: string, blockNumber: number) => ({
  type: 'EVENT_TYPE_SIGNER',
  fid: FID,
  chainId: 10,
  blockNumber,
  logIndex: 7,
  transactionHash: `0x${String(blockNumber).padStart(64, '0')}`,
  signerEventBody: { key, eventType },
});

/** A hub that answers castById with `cast` and onChainSignersByFid with `events`. */
function hub(cast: unknown, events: unknown) {
  return vi.fn((url: string | URL | Request) => {
    const body = String(url).includes('/v1/castById') ? cast : events;
    if (body instanceof Error) return Promise.reject(body);
    return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
  });
}
const opts = (fetcher: ReturnType<typeof hub>) => ({ hubUrl: HUB, fetcher, now: NOW });

afterEach(() => {
  vi.clearAllMocks();
  delete process.env.FARCASTER_SIGNER_PROVENANCE_INGEST;
  delete process.env.FARCASTER_SIGNER_SECOND_HUB;
});

describe('signerIngestEnabled - default off', () => {
  it.each([
    [undefined, false],
    ['', false],
    ['0', false],
    ['true', false],
    ['1', true],
  ])('FARCASTER_SIGNER_PROVENANCE_INGEST=%s -> %s', (value, want) => {
    if (value !== undefined) process.env.FARCASTER_SIGNER_PROVENANCE_INGEST = value;
    expect(signerIngestEnabled()).toBe(want);
  });
});

describe('recordCastSigner', () => {
  it('stores the signer without overwriting an earlier row, then its active authority', async () => {
    mockProvenanceUpsert.mockResolvedValueOnce({ error: null });
    mockAuthorityUpsert.mockResolvedValueOnce({ error: null });
    const fetcher = hub(hubCast(), { events: [event(KEY_A, 'SIGNER_EVENT_TYPE_ADD', 111898433)] });

    await expect(recordCastSigner(FID, CAST_HASH, opts(fetcher))).resolves.toEqual({
      status: 'recorded',
      hash: CAST_HASH,
      signer: KEY_A,
      authority: 'active',
    });
    expect(mockProvenanceUpsert).toHaveBeenCalledWith(
      {
        cast_hash: CAST_HASH,
        fid: FID,
        signer: KEY_A,
        signature_scheme: 'SIGNATURE_SCHEME_ED25519',
        hub_url: HUB,
        observed_at: STAMP,
      },
      { onConflict: 'cast_hash,signer', ignoreDuplicates: true },
    );
    expect(mockAuthorityUpsert).toHaveBeenCalledWith(
      {
        fid: FID,
        signer: KEY_A,
        status: 'active',
        reason: 'latest-event-add',
        event_chain_id: 10,
        event_block: 111898433,
        event_log_index: 7,
        event_tx: `0x${'111898433'.padStart(64, '0')}`,
        hub_url: HUB,
        checked_at: STAMP,
      },
      { onConflict: 'fid,signer', ignoreDuplicates: false },
    );
  });

  it('a removed key overwrites the stored authority', async () => {
    mockProvenanceUpsert.mockResolvedValueOnce({ error: null });
    mockAuthorityUpsert.mockResolvedValueOnce({ error: null });
    const fetcher = hub(hubCast(), {
      events: [
        event(KEY_A, 'SIGNER_EVENT_TYPE_ADD', 100),
        event(KEY_A, 'SIGNER_EVENT_TYPE_REMOVE', 200),
      ],
    });
    const r = await recordCastSigner(FID, CAST_HASH, opts(fetcher));
    expect(r).toMatchObject({ status: 'recorded', authority: 'removed' });
    expect(mockAuthorityUpsert.mock.calls[0][0]).toMatchObject({
      status: 'removed',
      event_block: 200,
    });
    expect(mockAuthorityUpsert.mock.calls[0][1]).toEqual({
      onConflict: 'fid,signer',
      ignoreDuplicates: false,
    });
  });

  it("signer A's removal is not written against signer B", async () => {
    mockProvenanceUpsert.mockResolvedValueOnce({ error: null });
    mockAuthorityUpsert.mockResolvedValueOnce({ error: null });
    const fetcher = hub(hubCast(KEY_B), {
      events: [
        event(KEY_A, 'SIGNER_EVENT_TYPE_ADD', 100),
        event(KEY_A, 'SIGNER_EVENT_TYPE_REMOVE', 200),
        event(KEY_B, 'SIGNER_EVENT_TYPE_ADD', 150),
      ],
    });
    const r = await recordCastSigner(FID, CAST_HASH, opts(fetcher));
    expect(r).toMatchObject({ status: 'recorded', signer: KEY_B, authority: 'active' });
    expect(mockAuthorityUpsert.mock.calls[0][0]).toMatchObject({ signer: KEY_B, status: 'active' });
  });

  it('an unknown authority (hub down for the key list) never replaces a stored status', async () => {
    mockProvenanceUpsert.mockResolvedValueOnce({ error: null });
    mockAuthorityUpsert.mockResolvedValueOnce({ error: null });
    const fetcher = hub(hubCast(), new Error('timeout'));
    const r = await recordCastSigner(FID, CAST_HASH, opts(fetcher));
    expect(r).toMatchObject({ status: 'recorded', authority: 'unknown' });
    expect(mockAuthorityUpsert.mock.calls[0][0]).toMatchObject({
      status: 'unknown',
      event_chain_id: null,
      event_block: null,
      event_log_index: null,
      event_tx: null,
    });
    expect(mockAuthorityUpsert.mock.calls[0][1]).toEqual({
      onConflict: 'fid,signer',
      ignoreDuplicates: true,
    });
  });

  it('a key with no on-chain record is stored as unknown, not as removed', async () => {
    mockProvenanceUpsert.mockResolvedValueOnce({ error: null });
    mockAuthorityUpsert.mockResolvedValueOnce({ error: null });
    const fetcher = hub(hubCast(), { events: [] });
    const r = await recordCastSigner(FID, CAST_HASH, opts(fetcher));
    expect(r).toMatchObject({ status: 'recorded', authority: 'unknown' });
    expect(mockAuthorityUpsert.mock.calls[0][0]).toMatchObject({ reason: 'no-onchain-record' });
  });

  it.each([
    ['the hub is unreachable', new Error('timeout')],
    ['the hub answer is malformed', { nope: true }],
    ['the hub answers for another cast', { ...hubCast(), hash: `0x${'ee'.repeat(20)}` }],
  ])('writes nothing when %s', async (_name, cast) => {
    const fetcher = hub(cast, { events: [] });
    const r = await recordCastSigner(FID, CAST_HASH, opts(fetcher));
    expect(r.status).toBe('signer-unknown');
    expect(mockFrom).not.toHaveBeenCalled();
    // The key list is never asked for when the signer is not known.
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('writes nothing for an invalid fid or hash, and makes no hub call', async () => {
    const fetcher = hub(hubCast(), { events: [] });
    expect((await recordCastSigner(0, CAST_HASH, opts(fetcher))).status).toBe('signer-unknown');
    expect((await recordCastSigner(FID, 'not-a-hash', opts(fetcher))).status).toBe(
      'signer-unknown',
    );
    expect(fetcher).not.toHaveBeenCalled();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('stores an uppercase hash in lowercase, as the table requires', async () => {
    mockProvenanceUpsert.mockResolvedValueOnce({ error: null });
    mockAuthorityUpsert.mockResolvedValueOnce({ error: null });
    const fetcher = hub(hubCast(), { events: [] });
    const r = await recordCastSigner(
      FID,
      CAST_HASH.toUpperCase().replace('0X', '0x'),
      opts(fetcher),
    );
    expect(r).toMatchObject({ status: 'recorded', hash: CAST_HASH });
    expect(mockProvenanceUpsert.mock.calls[0][0]).toMatchObject({ cast_hash: CAST_HASH });
  });

  it('reports a provenance write error and does not go on to the authority table', async () => {
    mockProvenanceUpsert.mockResolvedValueOnce({ error: { message: 'provenance boom' } });
    const fetcher = hub(hubCast(), { events: [] });
    await expect(recordCastSigner(FID, CAST_HASH, opts(fetcher))).resolves.toEqual({
      status: 'error',
      hash: CAST_HASH,
      error: 'provenance boom',
    });
    expect(mockAuthorityUpsert).not.toHaveBeenCalled();
  });

  it('reports an authority write error', async () => {
    mockProvenanceUpsert.mockResolvedValueOnce({ error: null });
    mockAuthorityUpsert.mockResolvedValueOnce({ error: { message: 'authority boom' } });
    const fetcher = hub(hubCast(), { events: [] });
    await expect(recordCastSigner(FID, CAST_HASH, opts(fetcher))).resolves.toEqual({
      status: 'error',
      hash: CAST_HASH,
      error: 'authority boom',
    });
  });

  it('does not throw when the database client itself throws', async () => {
    mockProvenanceUpsert.mockRejectedValueOnce(new Error('connection reset'));
    const fetcher = hub(hubCast(), { events: [] });
    await expect(recordCastSigner(FID, CAST_HASH, opts(fetcher))).resolves.toEqual({
      status: 'error',
      hash: CAST_HASH,
      error: 'connection reset',
    });
  });
});

describe('signerSecondHubEnabled - default off', () => {
  it.each([
    [undefined, false],
    ['', false],
    ['0', false],
    ['true', false],
    ['1', true],
  ])('FARCASTER_SIGNER_SECOND_HUB=%s -> %s', (value, want) => {
    if (value !== undefined) process.env.FARCASTER_SIGNER_SECOND_HUB = value;
    expect(signerSecondHubEnabled()).toBe(want);
  });
});

describe('recordCastSigner with the second hub', () => {
  const ADD_A = event(KEY_A, 'SIGNER_EVENT_TYPE_ADD', 111898433);
  const REMOVE_A = event(KEY_A, 'SIGNER_EVENT_TYPE_REMOVE', 140000000);
  const BOTH = `${DEFAULT_HUB_URL},${SECOND_HUB_URL}`;

  /** Each default hub answers castById and onChainSignersByFid with its own bodies. */
  function twoHubs(
    first: { cast: unknown; events: unknown },
    second: { cast: unknown; events: unknown },
  ) {
    return vi.fn((url: string | URL | Request) => {
      const u = String(url);
      const mine = u.startsWith(SECOND_HUB_URL) ? second : first;
      const body = u.includes('/v1/castById') ? mine.cast : mine.events;
      if (body instanceof Error) return Promise.reject(body);
      return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
    });
  }
  const asked = (fetcher: ReturnType<typeof twoHubs>) =>
    fetcher.mock.calls.map((c) => String(c[0]));

  it('flag off: only the one hub is asked', async () => {
    mockProvenanceUpsert.mockResolvedValueOnce({ error: null });
    mockAuthorityUpsert.mockResolvedValueOnce({ error: null });
    const same = { cast: hubCast(), events: { events: [ADD_A] } };
    const fetcher = twoHubs(same, same);
    await recordCastSigner(FID, CAST_HASH, { fetcher, now: NOW });
    expect(asked(fetcher).some((u) => u.startsWith(SECOND_HUB_URL))).toBe(false);
    expect(mockProvenanceUpsert.mock.calls[0][0]).toMatchObject({ hub_url: DEFAULT_HUB_URL });
  });

  it('flag on, hubs agree: recorded, and the row names both hubs', async () => {
    process.env.FARCASTER_SIGNER_SECOND_HUB = '1';
    mockProvenanceUpsert.mockResolvedValueOnce({ error: null });
    mockAuthorityUpsert.mockResolvedValueOnce({ error: null });
    const same = { cast: hubCast(), events: { events: [ADD_A] } };
    const fetcher = twoHubs(same, same);
    const r = await recordCastSigner(FID, CAST_HASH, { fetcher, now: NOW });
    expect(r).toMatchObject({ status: 'recorded', signer: KEY_A, authority: 'active' });
    expect(asked(fetcher).some((u) => u.startsWith(SECOND_HUB_URL))).toBe(true);
    expect(mockProvenanceUpsert.mock.calls[0][0]).toMatchObject({ signer: KEY_A, hub_url: BOTH });
    expect(mockAuthorityUpsert.mock.calls[0][0]).toMatchObject({ status: 'active', hub_url: BOTH });
    expect(mockAuthorityUpsert.mock.calls[0][1]).toMatchObject({ ignoreDuplicates: false });
  });

  it('flag on, hubs name different signers: nothing is written', async () => {
    process.env.FARCASTER_SIGNER_SECOND_HUB = '1';
    const fetcher = twoHubs(
      { cast: hubCast(KEY_A), events: { events: [ADD_A] } },
      { cast: hubCast(KEY_B), events: { events: [ADD_A] } },
    );
    const r = await recordCastSigner(FID, CAST_HASH, { fetcher, now: NOW });
    expect(r).toMatchObject({ status: 'signer-unknown', reason: 'hubs-disagree-on-signer' });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('flag on, the second hub is down: nothing is written', async () => {
    process.env.FARCASTER_SIGNER_SECOND_HUB = '1';
    const fetcher = twoHubs(
      { cast: hubCast(), events: { events: [ADD_A] } },
      { cast: new Error('timeout'), events: new Error('timeout') },
    );
    const r = await recordCastSigner(FID, CAST_HASH, { fetcher, now: NOW });
    expect(r.status).toBe('signer-unknown');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('flag on, only one hub reports a removal: stored as unknown, never over a stored status', async () => {
    process.env.FARCASTER_SIGNER_SECOND_HUB = '1';
    mockProvenanceUpsert.mockResolvedValueOnce({ error: null });
    mockAuthorityUpsert.mockResolvedValueOnce({ error: null });
    const fetcher = twoHubs(
      { cast: hubCast(), events: { events: [ADD_A, REMOVE_A] } },
      { cast: hubCast(), events: { events: [ADD_A] } },
    );
    const r = await recordCastSigner(FID, CAST_HASH, { fetcher, now: NOW });
    expect(r).toMatchObject({ status: 'recorded', authority: 'unknown' });
    expect(mockAuthorityUpsert.mock.calls[0][0]).toMatchObject({ status: 'unknown' });
    expect(mockAuthorityUpsert.mock.calls[0][1]).toEqual({
      onConflict: 'fid,signer',
      ignoreDuplicates: true,
    });
  });
});
