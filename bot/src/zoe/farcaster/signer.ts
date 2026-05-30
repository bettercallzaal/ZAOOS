/**
 * Farcaster Ed25519 signer for the ZAO caster.
 *
 * VERDICT (doc 762, confirmed): QKMS CANNOT sign Ed25519. Quilibrium's key types are
 * ed448 / x448 / decaf448 / bls48581 (per `qclient key create <Name> <KeyType>`); there is no
 * Ed25519 key spec. QKMS's "AWS-KMS compatibility" is API-surface only - it does not add the
 * Ed25519 curve Farcaster requires. So:
 *
 *   - THE signer is noble-in-process: @farcaster/hub-nodejs NobleEd25519Signer over the 32-byte
 *     key in FARCASTER_SIGNER_PRIVATE_KEY (hex). This is the default and the only signer.
 *   - QKMS's only possible role is AT-REST CUSTODY of the key blob (store the encrypted seed in
 *     QStorage / a QKMS-managed secret, fetch at boot, then sign in-process with noble). It is
 *     NOT a co-equal signing backend. SIGNER_BACKEND=qkms therefore throws with this verdict.
 *
 * Requires: `@farcaster/hub-nodejs` (in package.json; run npm install).
 */
import type { Signer } from '@farcaster/hub-nodejs';
import { NobleEd25519Signer } from '@farcaster/hub-nodejs';
import { bytesToHex, hexToBytes } from 'viem';

export type SignerBackend = 'noble' | 'qkms';

export function getSignerBackend(): SignerBackend {
  const b = (process.env.SIGNER_BACKEND ?? 'noble').toLowerCase();
  if (b !== 'noble' && b !== 'qkms') {
    throw new Error(`SIGNER_BACKEND must be 'noble' or 'qkms', got '${b}'`);
  }
  return b;
}

/** 32-byte hex (0x...) -> Uint8Array, validating length. */
function hex32(name: string, value: string | undefined): Uint8Array {
  if (!value) throw new Error(`${name} is required`);
  const bytes = hexToBytes(value.startsWith('0x') ? (value as `0x${string}`) : (`0x${value}` as `0x${string}`));
  if (bytes.length !== 32) {
    throw new Error(`${name} must be 32 bytes, got ${bytes.length}`);
  }
  return bytes;
}

/**
 * Build the Farcaster signer. noble-in-process is the only signer (see verdict above).
 * SIGNER_BACKEND=qkms is rejected: QKMS cannot sign Ed25519. To use QKMS for at-rest custody,
 * fetch the key blob into FARCASTER_SIGNER_PRIVATE_KEY before calling this and keep
 * SIGNER_BACKEND=noble.
 */
export function makeSigner(): Signer {
  if (getSignerBackend() === 'qkms') {
    throw new Error(
      'SIGNER_BACKEND=qkms is not a signer: QKMS cannot sign Ed25519 (its key types are ' +
        'ed448/x448/decaf448/bls48581; no Ed25519 spec - doc 762). Use SIGNER_BACKEND=noble. ' +
        'QKMS may custody the key blob at rest, but signing is always noble in-process.',
    );
  }
  const pk = hex32('FARCASTER_SIGNER_PRIVATE_KEY', process.env.FARCASTER_SIGNER_PRIVATE_KEY);
  return new NobleEd25519Signer(pk);
}

/** Get the signer public key as 0x-hex (noble). */
export async function getSignerPublicKeyHex(): Promise<`0x${string}`> {
  const signer = makeSigner();
  const res = await signer.getSignerKey(); // neverthrow HubResult<Uint8Array>
  if (res.isErr()) throw res.error;
  return bytesToHex(res.value);
}

/**
 * Generate a fresh Ed25519 keypair for the noble backend. Prints the private key hex to
 * store in FARCASTER_SIGNER_PRIVATE_KEY. Used by `register-signer.ts --gen-key`.
 *
 * Uses tweetnacl (already in deps). The 32-byte SEED (secretKey[0..32]) is the value
 * NobleEd25519Signer expects as its private key.
 */
export async function generateNobleKeypair(): Promise<{ privateKeyHex: `0x${string}`; publicKeyHex: `0x${string}` }> {
  const nacl = (await import('tweetnacl')).default;
  const kp = nacl.sign.keyPair(); // secretKey = seed(32) || pubkey(32)
  const seed = kp.secretKey.slice(0, 32);
  return { privateKeyHex: bytesToHex(seed), publicKeyHex: bytesToHex(kp.publicKey) };
}
