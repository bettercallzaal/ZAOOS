/**
 * Farcaster write path: REFUSED. ZOE does not post to Farcaster.
 *
 * Ruling 305 (Zaal, 2026-11-07): "no zoe doesnt post to farcaster and we dont need to pos to
 * farcaster it should help us post to farcaster adn reivew things on farcaster and tell us to
 * comment on it etc". ZOE drafts casts and suggested replies; Zaal posts them himself.
 *
 * Until this change, publishCast signed a CastAdd with FARCASTER_SIGNER_PRIVATE_KEY and paid the
 * Neynar hub per call via x402 (a USDC signature from X402_PAYMENT_PRIVATE_KEY, falling back to
 * CUSTODY_PRIVATE_KEY). That implementation is in git history (doc 761, doc 762) if a later
 * ruling ever wants it back; it is not kept here as dead code.
 *
 * publishCast stays exported so any caller, old or new, fails closed at this one gate: it logs
 * one line and throws BEFORE it reads any env var, key or signer, and before any network call.
 * Reads are unaffected (read-node.ts, event-stream.ts, wiki.ts).
 */

export const FARCASTER_WRITE_REFUSED =
  'ZOE does not post to Farcaster (ruling 305): the draft goes to Zaal and he posts it himself.';

/** Thrown by publishCast on every call. A distinct type so a caller can tell refusal from failure. */
export class FarcasterWriteRefusedError extends Error {
  constructor() {
    super(FARCASTER_WRITE_REFUSED);
    this.name = 'FarcasterWriteRefusedError';
  }
}

export interface PublishResult {
  hash: `0x${string}`;
  fid: number;
  endpoint: string;
}

export interface CastInput {
  text: string;
  /** parent cast hash for replies (hex) + parent fid, optional */
  parent?: { fid: number; hash: `0x${string}` };
}

/** Always refuses. See the file header. */
export async function publishCast(_input: CastInput): Promise<PublishResult> {
  console.error(`[zoe/farcaster] write refused: ${FARCASTER_WRITE_REFUSED}`);
  throw new FarcasterWriteRefusedError();
}
