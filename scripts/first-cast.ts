/**
 * scripts/first-cast.ts
 *
 * Phase 1 (doc 761): sign a CastAdd (SIGNATURE_SCHEME_ED25519) with the registered signer and
 * submit it to the WRITE endpoint (NOT the read node - the self-hosted Hypersnap node is
 * read-only and cannot accept writes; see doc 586 / doc 761 caveat 1).
 *
 * Works with BOTH signer backends (noble fallback signs in-process; qkms throws until verified).
 *
 * Env:
 *   FARCASTER_BOT_FID            the dedicated bot FID (from register-signer.ts)
 *   SIGNER_BACKEND               'noble' (default) | 'qkms'
 *   FARCASTER_SIGNER_PRIVATE_KEY Ed25519 hex (noble backend)
 *   FARCASTER_WRITE_API_BASE     write-enabled hub base, e.g. https://hub.example/  (NOT :3381)
 *   FARCASTER_WRITE_API_KEY      (optional) bearer/api key header for the write endpoint
 *   FC_NETWORK_ID                1 (mainnet); maps to FarcasterNetwork.MAINNET
 *
 * Run: node --import tsx scripts/first-cast.ts --text "gm from ZOE"
 * Requires: npm i @farcaster/hub-nodejs
 */
import { makeCastAdd, FarcasterNetwork, Message } from '@farcaster/hub-nodejs';
import { makeSigner } from '../bot/src/zoe/farcaster/signer';

function getArg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is required`);
  return v;
}

async function main() {
  const text = getArg('--text');
  if (!text) throw new Error('usage: first-cast.ts --text "your cast"');
  if (text.length > 320) throw new Error(`cast too long: ${text.length} bytes (max 320)`);

  const fid = Number(requireEnv('FARCASTER_BOT_FID'));
  const writeBase = requireEnv('FARCASTER_WRITE_API_BASE').replace(/\/$/, '');
  const network =
    (process.env.FC_NETWORK_ID ?? '1') === '1' ? FarcasterNetwork.MAINNET : FarcasterNetwork.TESTNET;

  const signer = makeSigner();

  const castResult = await makeCastAdd(
    { text, embeds: [], embedsDeprecated: [], mentions: [], mentionsPositions: [] },
    { fid, network },
    signer,
  );
  if (castResult.isErr()) {
    throw castResult.error;
  }
  const message = castResult.value;

  // Serialize to protobuf bytes and submit to the WRITE endpoint via hub HTTP submitMessage.
  // (Generic write-enabled hub. For the Neynar write API, swap this for the SDK's publishCast
  //  with a managed signer - see doc 761.)
  const bytes = Message.encode(message).finish();
  const headers: Record<string, string> = { 'Content-Type': 'application/octet-stream' };
  if (process.env.FARCASTER_WRITE_API_KEY) {
    headers['api_key'] = process.env.FARCASTER_WRITE_API_KEY;
    headers['Authorization'] = `Bearer ${process.env.FARCASTER_WRITE_API_KEY}`;
  }

  const res = await fetch(`${writeBase}/v1/submitMessage`, {
    method: 'POST',
    headers,
    body: Buffer.from(bytes),
  });
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`submitMessage failed: ${res.status} ${body}`);
  }

  const hashHex = Buffer.from(message.hash).toString('hex');
  console.log('Cast submitted.');
  console.log(`  fid: ${fid}`);
  console.log(`  hash: 0x${hashHex}`);
  console.log(`  endpoint: ${writeBase}/v1/submitMessage`);
  console.log(`  response: ${body.slice(0, 200)}`);
  console.log('\nConfirm it appears on Farcaster (e.g. via the read node /v1/castsByFid).');
}

main().catch((e) => {
  console.error('[first-cast] failed:', e instanceof Error ? e.message : e);
  process.exit(1);
});
