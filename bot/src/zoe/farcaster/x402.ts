/**
 * x402 payment header builder for the Neynar write hub (doc 762).
 *
 * The Neynar hub (`hub-api.neynar.com/v1/submitMessage`) is paid per call via x402: an
 * `X-PAYMENT` header carrying a base64-encoded EIP-3009 `transferWithAuthorization` signature
 * for 0.01 USDC on Base. The funds stay in the paying wallet until pulled.
 *
 * Verified against Neynar's autonomous-agent guide (doc 762); price re-verified
 * live 2026-06-24 (Neynar raised it from 0.001 -> 0.01; the old value is now rejected):
 *   - payTo:  0xA6a8736f18f383f1cc2d938576933E5eA7Df01A1 (Neynar)
 *   - value:  '10000' (0.01 USDC, 6 decimals)
 *   - network: 'base', scheme: 'exact', x402Version: 1
 *
 * Env:
 *   X402_PAYMENT_PRIVATE_KEY  Base wallet holding USDC (signs the EIP-3009 authorization).
 *                             Defaults to CUSTODY_PRIVATE_KEY if unset (must hold USDC on Base).
 *   X402_PAY_TO               override recipient (default Neynar address above)
 *   X402_USDC_ADDRESS         override USDC token (default Base USDC)
 *   X402_VALUE                override micro-amount string (default '10000' = 0.01 USDC)
 */
import { privateKeyToAccount } from 'viem/accounts';
import { toHex } from 'viem';
import { randomBytes } from 'node:crypto';

const BASE_CHAIN_ID = 8453;
const BASE_USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC on Base
const NEYNAR_PAY_TO = '0xA6a8736f18f383f1cc2d938576933E5eA7Df01A1';

const EIP3009_TYPES = {
  TransferWithAuthorization: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'validAfter', type: 'uint256' },
    { name: 'validBefore', type: 'uint256' },
    { name: 'nonce', type: 'bytes32' },
  ],
} as const;

/**
 * Build the base64 `X-PAYMENT` header value for one write call. Signs an EIP-3009
 * transferWithAuthorization over Base USDC.
 */
export async function buildX402Header(): Promise<string> {
  const pk = (process.env.X402_PAYMENT_PRIVATE_KEY ?? process.env.CUSTODY_PRIVATE_KEY) as
    | `0x${string}`
    | undefined;
  if (!pk) throw new Error('X402_PAYMENT_PRIVATE_KEY (or CUSTODY_PRIVATE_KEY) required for x402 write payment');
  const account = privateKeyToAccount(pk);

  const usdc = (process.env.X402_USDC_ADDRESS ?? BASE_USDC) as `0x${string}`;
  const payTo = (process.env.X402_PAY_TO ?? NEYNAR_PAY_TO) as `0x${string}`;
  // Neynar raised the per-write x402 price to 0.01 USDC; paying the old 0.001
  // gets rejected ("Failed to verify payment") since the scheme is exact. Verified
  // live 2026-06-24 while bringing ZOL (@zolbot) online. Override via X402_VALUE.
  const value = process.env.X402_VALUE ?? '10000'; // 0.01 USDC (6 decimals)

  const validAfter = '0';
  const validBefore = String(Math.floor(Date.now() / 1000) + 300); // 5 min window
  const nonce = toHex(randomBytes(32)) as `0x${string}`;

  const signature = await account.signTypedData({
    domain: { name: 'USD Coin', version: '2', chainId: BASE_CHAIN_ID, verifyingContract: usdc },
    types: EIP3009_TYPES,
    primaryType: 'TransferWithAuthorization',
    message: {
      from: account.address,
      to: payTo,
      value: BigInt(value),
      validAfter: BigInt(validAfter),
      validBefore: BigInt(validBefore),
      nonce,
    },
  });

  const payload = {
    x402Version: 1,
    scheme: 'exact',
    network: 'base',
    payload: {
      signature,
      authorization: {
        from: account.address,
        to: payTo,
        value, // string
        validAfter,
        validBefore,
        nonce,
      },
    },
  };

  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/** True when the write endpoint should be paid via x402 (default) rather than a bearer key. */
export function isX402Enabled(): boolean {
  return (process.env.FARCASTER_WRITE_MODE ?? 'x402').toLowerCase() !== 'bearer';
}
