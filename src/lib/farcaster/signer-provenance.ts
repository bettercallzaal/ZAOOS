/**
 * Which key actually signed a cast, and is that key still authorized?
 *
 * DreamNet Phase 1 step 1 (Brandon's contract decisions 1-3, 2026-10-09):
 * record the real message signer at ingestion, resolve authority per
 * (FID, signer key), and keep unknown or stale authority out of
 * current-authority context. Signer A's removal must never suppress signer B
 * on the same FID, so every answer here is about ONE key.
 *
 * WHY THE HUB. Neynar's cast object carries an `app` (the app account) but no
 * signer key, and Neynar's signer-status endpoints only cover signers created
 * under our own API key. A Farcaster hub returns the signed message itself:
 * `GET /v1/castById` includes `signer` (the Ed25519 public key), and
 * `GET /v1/onChainSignersByFid` lists the KeyRegistry events. Both checked
 * live against the Haatz Snapchain mirror on 2026-10-09 (FID 3).
 *
 * TRUST. A hub response is external data: every field is Zod-validated and
 * any failure, timeout or malformed body resolves to `unknown`, never to
 * "removed". A timeout is not proof of revocation (decision 2). One mirror is
 * also not an authoritative resolver on its own, so the hub URL is a parameter
 * and `crossCheckCastSigner` / `crossCheckSignerAuthority` at the bottom of
 * this file ask two hubs and accept only what both say.
 *
 * NOT COVERED: signers that are not on-chain (Brandon's "gasless" signers)
 * resolve to `unknown` with reason `no-onchain-record`, which keeps them out of
 * current authority rather than guessing. Whether the hub returns REMOVE
 * events or only drops removed keys is UNVERIFIED; both cases resolve to a
 * non-active status, so neither can grant authority.
 *
 * Pure library, nothing calls it yet. Storing the signer needs a column or
 * table, which is a migration and Zaal's call.
 */
import { z } from 'zod';
import { castHashSchema } from '@/lib/validation/schemas';

/** Keyless Snapchain mirror ZOE's research worker already uses. */
export const DEFAULT_HUB_URL = 'https://haatz.quilibrium.com';
const TIMEOUT_MS = 8000;
const MAX_PAGES = 5;

const signerKeySchema = z.string().regex(/^0x[0-9a-f]{64}$/i);
const fidSchema = z.number().int().positive();

const hubCastSchema = z.object({
  hash: castHashSchema,
  data: z.object({ fid: fidSchema, type: z.literal('MESSAGE_TYPE_CAST_ADD') }).passthrough(),
  signer: signerKeySchema,
  signatureScheme: z.literal('SIGNATURE_SCHEME_ED25519'),
});

const signerEventSchema = z.object({
  type: z.literal('EVENT_TYPE_SIGNER'),
  fid: fidSchema,
  chainId: z.number().int(),
  blockNumber: z.number().int().nonnegative(),
  logIndex: z.number().int().nonnegative(),
  transactionHash: z.string(),
  signerEventBody: z.object({ key: signerKeySchema, eventType: z.string() }).passthrough(),
});
const signerEventsPageSchema = z.object({
  events: z.array(z.unknown()),
  nextPageToken: z.string().optional(),
});

export type SignerEvent = z.infer<typeof signerEventSchema>;

export type CastSigner =
  | {
      status: 'found';
      fid: number;
      hash: string;
      signer: string;
      hubUrl: string;
      observedAt: string;
    }
  | {
      status: 'unknown';
      fid: number;
      hash: string;
      reason: string;
      hubUrl: string;
      observedAt: string;
    };

export type SignerAuthority = {
  fid: number;
  signer: string;
  status: 'active' | 'removed' | 'unknown';
  reason: string;
  /** The KeyRegistry event the status rests on, for provenance. */
  event: { chainId: number; blockNumber: number; logIndex: number; transactionHash: string } | null;
  hubUrl: string;
  checkedAt: string;
};

type Fetcher = typeof fetch;

async function getJson(fetcher: Fetcher, url: string): Promise<unknown> {
  const res = await fetcher(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`hub HTTP ${res.status}`);
  return res.json();
}

function errorText(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** The key that signed this cast, read from the signed message on a hub. Never throws. */
export async function fetchCastSigner(
  fid: number,
  hash: string,
  opts: { hubUrl?: string; fetcher?: Fetcher; now?: () => Date } = {},
): Promise<CastSigner> {
  const hubUrl = opts.hubUrl ?? DEFAULT_HUB_URL;
  const observedAt = (opts.now ?? (() => new Date()))().toISOString();
  const unknown = (reason: string): CastSigner => ({
    status: 'unknown',
    fid,
    hash,
    reason,
    hubUrl,
    observedAt,
  });
  if (!fidSchema.safeParse(fid).success || !castHashSchema.safeParse(hash).success)
    return unknown('invalid-input');
  try {
    const body = await getJson(
      opts.fetcher ?? fetch,
      `${hubUrl}/v1/castById?fid=${fid}&hash=${encodeURIComponent(hash)}`,
    );
    const parsed = hubCastSchema.safeParse(body);
    if (!parsed.success) return unknown('malformed-hub-response');
    // The hub must answer for the cast we asked about, not some other one.
    if (parsed.data.data.fid !== fid || parsed.data.hash.toLowerCase() !== hash.toLowerCase())
      return unknown('hub-answered-for-another-cast');
    return {
      status: 'found',
      fid,
      hash,
      signer: parsed.data.signer.toLowerCase(),
      hubUrl,
      observedAt,
    };
  } catch (err: unknown) {
    return unknown(`hub-unreachable: ${errorText(err)}`);
  }
}

/**
 * Authority of ONE (FID, key) pair from KeyRegistry events. Pure: the latest
 * event for this key decides. Events for other keys are ignored, so removing
 * signer A never touches signer B.
 */
export function resolveSignerAuthority(
  fid: number,
  signer: string,
  events: SignerEvent[],
): Pick<SignerAuthority, 'status' | 'reason' | 'event'> {
  const key = signer.toLowerCase();
  const mine = events
    .filter((e) => e.fid === fid && e.signerEventBody.key.toLowerCase() === key)
    .sort((a, b) => a.blockNumber - b.blockNumber || a.logIndex - b.logIndex);
  const latest = mine.at(-1);
  if (!latest) return { status: 'unknown', reason: 'no-onchain-record', event: null };
  const event = {
    chainId: latest.chainId,
    blockNumber: latest.blockNumber,
    logIndex: latest.logIndex,
    transactionHash: latest.transactionHash,
  };
  switch (latest.signerEventBody.eventType) {
    case 'SIGNER_EVENT_TYPE_ADD':
      return { status: 'active', reason: 'latest-event-add', event };
    case 'SIGNER_EVENT_TYPE_REMOVE':
      return { status: 'removed', reason: 'latest-event-remove', event };
    default:
      // ADMIN_RESET or anything newer: do not guess either way.
      return {
        status: 'unknown',
        reason: `unhandled-event-${latest.signerEventBody.eventType}`,
        event,
      };
  }
}

/** Fetches the FID's KeyRegistry events from a hub and resolves one key. Never throws. */
export async function checkSignerAuthority(
  fid: number,
  signer: string,
  opts: { hubUrl?: string; fetcher?: Fetcher; now?: () => Date } = {},
): Promise<SignerAuthority> {
  const hubUrl = opts.hubUrl ?? DEFAULT_HUB_URL;
  const checkedAt = (opts.now ?? (() => new Date()))().toISOString();
  const base = { fid, signer: signer.toLowerCase(), hubUrl, checkedAt };
  const unknown = (reason: string): SignerAuthority => ({
    ...base,
    status: 'unknown',
    reason,
    event: null,
  });
  if (!fidSchema.safeParse(fid).success || !signerKeySchema.safeParse(signer).success)
    return unknown('invalid-input');

  const events: SignerEvent[] = [];
  let pageToken: string | undefined;
  try {
    for (let page = 0; page < MAX_PAGES; page++) {
      const url = `${hubUrl}/v1/onChainSignersByFid?fid=${fid}${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
      const parsed = signerEventsPageSchema.safeParse(await getJson(opts.fetcher ?? fetch, url));
      if (!parsed.success) return unknown('malformed-hub-response');
      for (const raw of parsed.data.events) {
        const ev = signerEventSchema.safeParse(raw);
        if (!ev.success) return unknown('malformed-signer-event');
        events.push(ev.data);
      }
      pageToken = parsed.data.nextPageToken || undefined;
      if (!pageToken) return { ...base, ...resolveSignerAuthority(fid, signer, events) };
    }
    // A partial event list could hide a later REMOVE.
    return unknown('too-many-pages');
  } catch (err: unknown) {
    return unknown(`hub-unreachable: ${errorText(err)}`);
  }
}

// ---------------------------------------------------------------------------
// Second-hub cross-check
// ---------------------------------------------------------------------------

/**
 * A second hub run by a different operator than the Haatz mirror: a Snapchain
 * node on farcaster.xyz. Checked live on 2026-10-11: keyless, and its
 * `castById` and `onChainSignersByFid` answers for FID 3 matched Haatz's.
 */
export const SECOND_HUB_URL = 'https://snap.farcaster.xyz:3381';

type CrossCheckOptions = {
  /** The two hubs to compare. They must differ. */
  hubUrls?: readonly [string, string];
  fetcher?: Fetcher;
  now?: () => Date;
};

function twoHubs(opts: CrossCheckOptions): readonly [string, string] {
  return opts.hubUrls ?? [DEFAULT_HUB_URL, SECOND_HUB_URL];
}

/**
 * The key that signed a cast, accepted only when two independent hubs name the
 * same key. One mirror is not an authoritative resolver: if the hubs disagree,
 * or only one answers, the result is `unknown`, and the reason says which.
 * Never picks a side. Never throws. Same return type as `fetchCastSigner`, so
 * a caller can swap one for the other.
 */
export async function crossCheckCastSigner(
  fid: number,
  hash: string,
  opts: CrossCheckOptions = {},
): Promise<CastSigner> {
  const [hubA, hubB] = twoHubs(opts);
  const hubUrl = `${hubA},${hubB}`;
  const observedAt = (opts.now ?? (() => new Date()))().toISOString();
  const unknown = (reason: string): CastSigner => ({
    status: 'unknown',
    fid,
    hash,
    reason,
    hubUrl,
    observedAt,
  });
  if (hubA === hubB) return unknown('cross-check-needs-two-hubs');

  const one = { fetcher: opts.fetcher, now: opts.now };
  const [a, b] = await Promise.all([
    fetchCastSigner(fid, hash, { ...one, hubUrl: hubA }),
    fetchCastSigner(fid, hash, { ...one, hubUrl: hubB }),
  ]);

  if (a.status === 'found' && b.status === 'found') {
    if (a.signer !== b.signer) return unknown('hubs-disagree-on-signer');
    return { status: 'found', fid, hash, signer: a.signer, hubUrl, observedAt };
  }
  if (a.status === 'unknown' && b.status === 'unknown') {
    return unknown(
      a.reason === b.reason ? a.reason : `both-hubs-unknown: ${a.reason}; ${b.reason}`,
    );
  }
  const missing = a.status === 'unknown' ? a : (b as Extract<CastSigner, { status: 'unknown' }>);
  return unknown(`unconfirmed-by-${missing.hubUrl}: ${missing.reason}`);
}

function sameEvent(a: SignerAuthority['event'], b: SignerAuthority['event']): boolean {
  if (a === null || b === null) return a === b;
  return (
    a.chainId === b.chainId &&
    a.blockNumber === b.blockNumber &&
    a.logIndex === b.logIndex &&
    a.transactionHash.toLowerCase() === b.transactionHash.toLowerCase()
  );
}

/**
 * Authority of ONE (FID, key) pair, accepted as `active` or `removed` only
 * when two independent hubs give the same status resting on the same
 * KeyRegistry event. Anything else is `unknown`: the hubs disagree, they
 * agree on the status but cite different events, or one did not answer.
 *
 * A removal reported by one hub alone is NOT treated as a removal. That hub
 * may simply be ahead, but it may also be wrong, and a single mirror being
 * able to revoke a key is the thing this check exists to prevent. The caller
 * keeps whatever status it already holds and asks again later.
 *
 * Never throws. Same return type as `checkSignerAuthority`.
 */
export async function crossCheckSignerAuthority(
  fid: number,
  signer: string,
  opts: CrossCheckOptions = {},
): Promise<SignerAuthority> {
  const [hubA, hubB] = twoHubs(opts);
  const checkedAt = (opts.now ?? (() => new Date()))().toISOString();
  const base = { fid, signer: signer.toLowerCase(), hubUrl: `${hubA},${hubB}`, checkedAt };
  const unknown = (reason: string): SignerAuthority => ({
    ...base,
    status: 'unknown',
    reason,
    event: null,
  });
  if (hubA === hubB) return unknown('cross-check-needs-two-hubs');

  const one = { fetcher: opts.fetcher, now: opts.now };
  const [a, b] = await Promise.all([
    checkSignerAuthority(fid, signer, { ...one, hubUrl: hubA }),
    checkSignerAuthority(fid, signer, { ...one, hubUrl: hubB }),
  ]);

  if (a.status === 'unknown' && b.status === 'unknown') {
    return unknown(
      a.reason === b.reason ? a.reason : `both-hubs-unknown: ${a.reason}; ${b.reason}`,
    );
  }
  if (a.status === 'unknown' || b.status === 'unknown') {
    const missing = a.status === 'unknown' ? a : b;
    const other = a.status === 'unknown' ? b : a;
    return unknown(
      `unconfirmed-by-${missing.hubUrl}: ${missing.reason} (other hub: ${other.status})`,
    );
  }
  if (a.status !== b.status) return unknown(`hubs-disagree-on-status: ${a.status} vs ${b.status}`);
  if (!sameEvent(a.event, b.event)) return unknown(`hubs-disagree-on-event: both ${a.status}`);
  return { ...base, status: a.status, reason: a.reason, event: a.event };
}
