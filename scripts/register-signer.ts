/**
 * scripts/register-signer.ts
 *
 * Phase 1 (doc 761): register a DEDICATED bot FID on Optimism and add an Ed25519 signer key
 * to it, so the caster can post casts. Supports BOTH signer backends (noble fallback + QKMS).
 *
 * Flow:
 *   --gen-key : generate a fresh Ed25519 keypair (noble backend), print the private key hex
 *               to store in FARCASTER_SIGNER_PRIVATE_KEY, then exit.
 *   (default) : 1. ensure custody wallet has an FID (register via IdGateway if not, ~$1 gas)
 *               2. build EIP-712 SignedKeyRequest signed by the custody wallet
 *               3. ABI-encode SignedKeyRequestMetadata
 *               4. KeyGateway.add(1, signerPubkey, 1, metadata)
 *               5. print BOT_FID + signer pubkey
 *
 * Env:
 *   OP_RPC_URL                    Optimism RPC endpoint
 *   CUSTODY_PRIVATE_KEY           secp256k1 custody wallet (funded ~$2 on Optimism)
 *   SIGNER_BACKEND                'noble' (default) | 'qkms'
 *   FARCASTER_SIGNER_PRIVATE_KEY  Ed25519 32-byte hex (noble backend)
 *   RECOVERY_ADDRESS              (optional) recovery address for the new FID; defaults to custody
 *   FARCASTER_VERIFY_OK=1         set after confirming contract addresses against docs.farcaster.xyz
 *
 * Run: node --import tsx scripts/register-signer.ts [--gen-key]
 * Requires: npm i @farcaster/hub-nodejs   (viem already in deps)
 */
import {
  createPublicClient,
  createWalletClient,
  http,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { optimism } from 'viem/chains';
import {
  FARCASTER_CONTRACTS,
  OP_CHAIN_ID,
  SIGNED_KEY_REQUEST_DOMAIN,
  SIGNED_KEY_REQUEST_TYPES,
  SIGNED_KEY_REQUEST_VALIDATOR_ABI,
  ID_GATEWAY_ABI,
  ID_REGISTRY_ABI,
  KEY_GATEWAY_ABI,
} from './lib/farcaster-contracts';
import {
  getSignerBackend,
  getSignerPublicKeyHex,
  generateNobleKeypair,
} from '../bot/src/zoe/farcaster/signer';

const SIGNED_KEY_REQUEST_TYPE = 1; // metadataType for SignedKeyRequestValidator
const ED25519_KEY_TYPE = 1; // keyType

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is required`);
  return v;
}

async function main() {
  if (process.argv.includes('--gen-key')) {
    const { privateKeyHex, publicKeyHex } = await generateNobleKeypair();
    console.log('Generated Ed25519 signer keypair (noble backend).');
    console.log('Store this private key in env FARCASTER_SIGNER_PRIVATE_KEY (keep secret):');
    console.log(`  FARCASTER_SIGNER_PRIVATE_KEY=${privateKeyHex}`);
    console.log(`Signer public key: ${publicKeyHex}`);
    return;
  }

  if (process.env.FARCASTER_VERIFY_OK !== '1') {
    throw new Error(
      'Refusing to run: set FARCASTER_VERIFY_OK=1 after confirming the Farcaster contract ' +
        'addresses in scripts/lib/farcaster-contracts.ts against docs.farcaster.xyz. ' +
        '(Anti-fabrication gate - do not spend gas on unverified addresses.)',
    );
  }

  const backend = getSignerBackend();
  console.log(`Signer backend: ${backend}`);

  const rpc = requireEnv('OP_RPC_URL');
  const custodyPk = requireEnv('CUSTODY_PRIVATE_KEY') as `0x${string}`;
  const account = privateKeyToAccount(custodyPk);
  const recovery = (process.env.RECOVERY_ADDRESS ?? account.address) as `0x${string}`;

  const publicClient = createPublicClient({ chain: optimism, transport: http(rpc) });
  const walletClient = createWalletClient({ account, chain: optimism, transport: http(rpc) });

  // 1. Ensure the custody wallet owns an FID.
  let fid = (await publicClient.readContract({
    address: FARCASTER_CONTRACTS.IdRegistry,
    abi: ID_REGISTRY_ABI,
    functionName: 'idOf',
    args: [account.address],
  })) as bigint;

  if (fid === 0n) {
    const price = (await publicClient.readContract({
      address: FARCASTER_CONTRACTS.IdGateway,
      abi: ID_GATEWAY_ABI,
      functionName: 'price',
    })) as bigint;
    console.log(`No FID for ${account.address}. Registering via IdGateway (price=${price} wei)...`);
    const hash = await walletClient.writeContract({
      address: FARCASTER_CONTRACTS.IdGateway,
      abi: ID_GATEWAY_ABI,
      functionName: 'register',
      args: [recovery],
      value: price,
    });
    console.log(`  register tx: ${hash}`);
    await publicClient.waitForTransactionReceipt({ hash });
    fid = (await publicClient.readContract({
      address: FARCASTER_CONTRACTS.IdRegistry,
      abi: ID_REGISTRY_ABI,
      functionName: 'idOf',
      args: [account.address],
    })) as bigint;
  }
  console.log(`BOT_FID=${fid}`);

  // 2. Get the Ed25519 signer public key (noble derives locally; qkms throws until verified).
  const signerPubHex = await getSignerPublicKeyHex();
  console.log(`Signer pubkey: ${signerPubHex}`);

  // 3. EIP-712 SignedKeyRequest signed by the custody wallet (the request signer).
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 60); // 1h
  const signature = await walletClient.signTypedData({
    account,
    domain: SIGNED_KEY_REQUEST_DOMAIN,
    types: SIGNED_KEY_REQUEST_TYPES,
    primaryType: 'SignedKeyRequest',
    message: { requestFid: fid, key: signerPubHex, deadline },
  });

  // 4. Encode metadata via the validator's on-chain encodeMetadata (NOT manual ABI encoding -
  //    manual misses the dynamic offset pointer and the validator rejects it; doc 762).
  const metadata = (await publicClient.readContract({
    address: FARCASTER_CONTRACTS.SignedKeyRequestValidator,
    abi: SIGNED_KEY_REQUEST_VALIDATOR_ABI,
    functionName: 'encodeMetadata',
    args: [fid, account.address, signature, deadline],
  })) as `0x${string}`;

  // 5. KeyGateway.add(keyType=1, key=pubkey, metadataType=1, metadata).
  console.log('Adding signer key via KeyGateway.add ...');
  const addHash = await walletClient.writeContract({
    address: FARCASTER_CONTRACTS.KeyGateway,
    abi: KEY_GATEWAY_ABI,
    functionName: 'add',
    args: [ED25519_KEY_TYPE, signerPubHex, SIGNED_KEY_REQUEST_TYPE, metadata],
  });
  console.log(`  KeyGateway.add tx: ${addHash}`);
  await publicClient.waitForTransactionReceipt({ hash: addHash });

  console.log('\nDone. Signer registered on-chain.');
  console.log(`Set these in env (chainId ${OP_CHAIN_ID}):`);
  console.log(`  FARCASTER_BOT_FID=${fid}`);
  console.log('Wait for hub sync (~minutes), then run scripts/first-cast.ts.');
}

main().catch((e) => {
  console.error('[register-signer] failed:', e instanceof Error ? e.message : e);
  process.exit(1);
});
