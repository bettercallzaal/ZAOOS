/**
 * Farcaster Ed25519 signer abstraction for the ZAO caster.
 *
 * Two backends, selected by SIGNER_BACKEND env:
 *   - 'noble'  (default, FULLY WORKING): in-process Ed25519 via @farcaster/hub-nodejs's
 *              NobleEd25519Signer. The 32-byte private key lives in
 *              FARCASTER_SIGNER_PRIVATE_KEY (hex). QKMS may still hold this key as custody;
 *              this path just signs in-process.
 *   - 'qkms'   (VERIFY - UNVERIFIED): sign via Quilibrium QKMS. QKMS Ed25519 support is
 *              INFERRED from its AWS-KMS compatibility, NOT confirmed (docs login-walled).
 *              This branch is a marked stub that throws until the key-spec + Sign API are
 *              verified at qconsole.quilibrium.com. See research doc 761.
 *
 * Both backends implement @farcaster/hub-nodejs's `Signer` interface so they drop straight
 * into makeCastAdd / makeSignerAdd etc.
 *
 * Requires: `npm i @farcaster/hub-nodejs` (not yet in package.json - see OPS-RUNBOOK).
 */

// NOTE: @farcaster/hub-nodejs is the canonical lib for Ed25519Signer + message builders.
// Install before running. Types imported lazily so the module loads even pre-install.
import type { Signer } from '@farcaster/hub-nodejs';
import { NobleEd25519Signer, SignatureScheme } from '@farcaster/hub-nodejs';
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
 * QKMS-backed Ed25519 signer. VERIFY: this is a marked stub.
 *
 * Quilibrium QKMS Ed25519 support is INFERRED, not confirmed. Before this can be used:
 *   1. Log into qconsole.quilibrium.com, create a key, confirm key-spec
 *      ECC_NIST_EDWARDS25519 / Ed25519.
 *   2. Confirm the Sign + GetPublicKey API shapes (the published docs are login-walled).
 *   3. Replace the throw bodies below with real QKMS calls.
 *
 * We intentionally do NOT invent QKMS method signatures here. The fallback ('noble') is
 * fully working and is the default.
 */
class QkmsEd25519Signer implements Signer {
  public readonly scheme = SignatureScheme.ED25519;

  private notVerified(method: string): never {
    throw new Error(
      `QKMS signer ${method}() is not yet wired: QKMS Ed25519 support is UNVERIFIED ` +
        `(inferred from AWS-KMS compat, docs login-walled). Verify the key-spec ` +
        `(ECC_NIST_EDWARDS25519) and Sign/GetPublicKey API at qconsole.quilibrium.com, ` +
        `then implement this branch. Until then set SIGNER_BACKEND=noble. See doc 761.`,
    );
  }

  // Methods throw rather than returning a fabricated Result. The default backend is 'noble';
  // these only fire if someone explicitly selects SIGNER_BACKEND=qkms before verifying it.
  async getSignerKey(): Promise<never> {
    // QKMS GetPublicKey would return the Ed25519 public key wrapped in ok(...) here.
    this.notVerified('getSignerKey');
  }

  async signMessageHash(_hash: Uint8Array): Promise<never> {
    // QKMS Sign over the message hash would return the 64-byte signature wrapped in ok(...).
    this.notVerified('signMessageHash');
  }
}

/**
 * Build the active Farcaster signer for the configured backend.
 *
 * noble: requires FARCASTER_SIGNER_PRIVATE_KEY (hex, 32 bytes).
 * qkms:  returns the stub (throws on use until verified).
 */
export function makeSigner(): Signer {
  const backend = getSignerBackend();
  if (backend === 'qkms') {
    return new QkmsEd25519Signer();
  }
  const pk = hex32('FARCASTER_SIGNER_PRIVATE_KEY', process.env.FARCASTER_SIGNER_PRIVATE_KEY);
  return new NobleEd25519Signer(pk);
}

/** Get the signer public key as 0x-hex. Works for the noble backend; qkms throws (VERIFY). */
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
