/**
 * Farcaster write path (doc 761, Phase 2). Signs a CastAdd with the configured Ed25519 signer
 * and submits it to the WRITE endpoint - NOT the read node (the self-hosted Hypersnap node is
 * read-only; doc 586 / doc 761 caveat 1).
 *
 * Shared by the caster pipeline. scripts/first-cast.ts mirrors this for the standalone Phase 1
 * smoke test.
 *
 * Env:
 *   FARCASTER_BOT_FID
 *   FARCASTER_WRITE_API_BASE   write-enabled hub base (NOT :3381)
 *   FARCASTER_WRITE_API_KEY    optional
 *   FC_NETWORK_ID              1 = MAINNET
 *   + signer env (see signer.ts)
 */
import { makeCastAdd, FarcasterNetwork, Message } from '@farcaster/hub-nodejs';
import { makeSigner } from './signer';

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

export async function publishCast(input: CastInput): Promise<PublishResult> {
  const text = input.text;
  if (!text) throw new Error('cast text required');
  if (text.length > 320) throw new Error(`cast too long: ${text.length} bytes (max 320)`);

  const fid = Number(process.env.FARCASTER_BOT_FID);
  if (!fid) throw new Error('FARCASTER_BOT_FID not set');
  const writeBase = process.env.FARCASTER_WRITE_API_BASE?.replace(/\/$/, '');
  if (!writeBase) throw new Error('FARCASTER_WRITE_API_BASE not set');

  const network =
    (process.env.FC_NETWORK_ID ?? '1') === '1' ? FarcasterNetwork.MAINNET : FarcasterNetwork.TESTNET;
  const signer = makeSigner();

  const castBody: Parameters<typeof makeCastAdd>[0] = {
    text,
    embeds: [],
    embedsDeprecated: [],
    mentions: [],
    mentionsPositions: [],
  };
  if (input.parent) {
    // parentCastId expects { fid, hash: Uint8Array }
    castBody.parentCastId = {
      fid: input.parent.fid,
      hash: Buffer.from(input.parent.hash.replace(/^0x/, ''), 'hex'),
    };
  }

  const result = await makeCastAdd(castBody, { fid, network }, signer);
  if (result.isErr()) throw result.error;
  const message = result.value;

  const bytes = Message.encode(message).finish();
  const headers: Record<string, string> = { 'Content-Type': 'application/octet-stream' };
  if (process.env.FARCASTER_WRITE_API_KEY) {
    headers['api_key'] = process.env.FARCASTER_WRITE_API_KEY;
    headers['Authorization'] = `Bearer ${process.env.FARCASTER_WRITE_API_KEY}`;
  }

  const endpoint = `${writeBase}/v1/submitMessage`;
  const res = await fetch(endpoint, { method: 'POST', headers, body: Buffer.from(bytes) });
  const respBody = await res.text();
  if (!res.ok) throw new Error(`submitMessage failed: ${res.status} ${respBody}`);

  return { hash: `0x${Buffer.from(message.hash).toString('hex')}`, fid, endpoint };
}
