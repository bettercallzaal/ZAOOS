/**
 * ENS NameWrapper on-chain subnames for thezao.eth
 *
 * Creates real ERC-1155 subname NFTs that members OWN in their wallet.
 * Uses ENS NameWrapper contract on Ethereum mainnet via viem.
 *
 * Contracts:
 * - NameWrapper: 0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401
 * - Public Resolver: 0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63
 */

import {
  createWalletClient,
  createPublicClient,
  http,
  fallback,
  namehash,
  encodeFunctionData,
  type Address,
  type Hex,
} from 'viem';
import { mainnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// ── Contract addresses ──

const NAME_WRAPPER = '0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401' as const;
const PUBLIC_RESOLVER = '0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63' as const;
const DOMAIN = 'thezao.eth';
const PARENT_NODE = namehash(DOMAIN);

// ── Fuse values (bitflags) ──

export const FUSES = {
  CANNOT_UNWRAP: 1,
  CANNOT_BURN_FUSES: 2,
  CANNOT_TRANSFER: 4,
  CANNOT_SET_RESOLVER: 8,
  CANNOT_SET_TTL: 16,
  CANNOT_CREATE_SUBDOMAIN: 32,
  CANNOT_APPROVE: 64,
  PARENT_CANNOT_CONTROL: 1 << 16, // 65536 — emancipates the subname
  CAN_EXTEND_EXPIRY: 1 << 18,     // 262144 — owner can extend
} as const;

// ── ABI fragments ──

const NAME_WRAPPER_ABI = [
  {
    name: 'setSubnodeRecord',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'parentNode', type: 'bytes32' },
      { name: 'label', type: 'string' },
      { name: 'owner', type: 'address' },
      { name: 'resolver', type: 'address' },
      { name: 'ttl', type: 'uint64' },
      { name: 'fuses', type: 'uint32' },
      { name: 'expiry', type: 'uint64' },
    ],
    outputs: [{ type: 'bytes32' }],
  },
  {
    name: 'setSubnodeOwner',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'parentNode', type: 'bytes32' },
      { name: 'label', type: 'string' },
      { name: 'owner', type: 'address' },
      { name: 'fuses', type: 'uint32' },
      { name: 'expiry', type: 'uint64' },
    ],
    outputs: [{ type: 'bytes32' }],
  },
  {
    name: 'ownerOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [{ type: 'address' }],
  },
  {
    name: 'getData',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [
      { name: 'owner', type: 'address' },
      { name: 'fuses', type: 'uint32' },
      { name: 'expiry', type: 'uint64' },
    ],
  },
] as const;

const RESOLVER_ABI = [
  {
    name: 'setText',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'key', type: 'string' },
      { name: 'value', type: 'string' },
    ],
    outputs: [],
  },
  {
    name: 'setAddr',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'addr', type: 'address' },
    ],
    outputs: [],
  },
] as const;

// ── Clients ──

const publicClient = createPublicClient({
  chain: mainnet,
  transport: fallback([
    ...(process.env.ALCHEMY_API_KEY
      ? [http(`https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`)]
      : []),
    http('https://eth.llamarpc.com'),
    http('https://ethereum-rpc.publicnode.com'),
  ]),
});

function getWalletClient() {
  const key = process.env.ENS_OWNER_PRIVATE_KEY;
  if (!key) throw new Error('ENS_OWNER_PRIVATE_KEY not configured — needed to create subnames');
  const account = privateKeyToAccount(key as Hex);
  return createWalletClient({
    account,
    chain: mainnet,
    transport: fallback([
      ...(process.env.ALCHEMY_API_KEY
        ? [http(`https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`)]
        : []),
      http('https://eth.llamarpc.com'),
      http('https://ethereum-rpc.publicnode.com'),
    ]),
  });
}

// ── Validation ──

const NAME_REGEX = /^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/;

export function isValidSubname(name: string): boolean {
  if (name.length < 1 || name.length > 63) return false;
  if (name.length === 1) return /^[a-z0-9]$/.test(name);
  return NAME_REGEX.test(name);
}

export function sanitizeSubname(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);
}

// ── Create subname (on-chain) ──

export async function createSubname(
  label: string,
  ownerAddress: string,
  textRecords?: Record<string, string>,
): Promise<{ success: boolean; fullName: string; txHash?: string; error?: string }> {
  const sanitized = sanitizeSubname(label);
  if (!isValidSubname(sanitized)) {
    return { success: false, fullName: '', error: `Invalid subname: "${label}"` };
  }

  const fullName = `${sanitized}.${DOMAIN}`;

  try {
    const wallet = getWalletClient();

    // Check if subname already exists
    const subnameNode = namehash(fullName);
    try {
      const existing = await publicClient.readContract({
        address: NAME_WRAPPER,
        abi: NAME_WRAPPER_ABI,
        functionName: 'getData',
        args: [BigInt(subnameNode)],
      });
      if (existing[0] !== '0x0000000000000000000000000000000000000000') {
        return { success: false, fullName, error: `Subname "${sanitized}" already exists (owner: ${existing[0]})` };
      }
    } catch {
      // getData may revert if name doesn't exist — that's fine
    }

    // Set expiry to ~10 years from now
    const expiry = BigInt(Math.floor(Date.now() / 1000) + 10 * 365 * 24 * 60 * 60);

    // Create the subname — no fuses burned so parent retains control
    // Members get ownership but parent can still manage if needed
    const txHash = await wallet.writeContract({
      address: NAME_WRAPPER,
      abi: NAME_WRAPPER_ABI,
      functionName: 'setSubnodeRecord',
      args: [
        PARENT_NODE,
        sanitized,
        ownerAddress as Address,
        PUBLIC_RESOLVER,
        BigInt(0), // ttl
        0,         // fuses — none burned, parent retains control
        expiry,
      ],
    });

    // Wait for confirmation
    await publicClient.waitForTransactionReceipt({ hash: txHash });

    // Set text records if provided
    if (textRecords && Object.keys(textRecords).length > 0) {
      for (const [key, value] of Object.entries(textRecords)) {
        try {
          const textTx = await wallet.writeContract({
            address: PUBLIC_RESOLVER,
            abi: RESOLVER_ABI,
            functionName: 'setText',
            args: [subnameNode, key, value],
          });
          await publicClient.waitForTransactionReceipt({ hash: textTx });
        } catch (err) {
          console.warn(`[ens/subnames] Failed to set text record "${key}":`, err);
        }
      }
    }

    return { success: true, fullName, txHash };
  } catch (err) {
    const message = (err as Error).message;
    return { success: false, fullName, error: `On-chain creation failed: ${message.slice(0, 200)}` };
  }
}

// ── Create with conflict resolution ──

export async function createSubnameWithFallback(
  name: string,
  ownerAddress: string,
  zid: number | null,
  textRecords?: Record<string, string>,
): Promise<{ success: boolean; fullName: string; txHash?: string; error?: string }> {
  const result = await createSubname(name, ownerAddress, textRecords);
  if (result.success) return result;

  // If conflict and we have a ZID, try name-zid
  if (zid && result.error?.includes('already exists')) {
    const fallback = `${sanitizeSubname(name)}-${zid}`;
    return createSubname(fallback, ownerAddress, textRecords);
  }

  return result;
}

// ── Batch Create ──

export async function batchCreateSubnames(
  names: { name: string; address: string; zid: number | null; textRecords?: Record<string, string> }[],
): Promise<{ created: { name: string; txHash?: string }[]; failed: { name: string; error: string }[] }> {
  const created: { name: string; txHash?: string }[] = [];
  const failed: { name: string; error: string }[] = [];

  for (const entry of names) {
    const result = await createSubnameWithFallback(
      entry.name,
      entry.address,
      entry.zid,
      entry.textRecords,
    );
    if (result.success) {
      created.push({ name: result.fullName, txHash: result.txHash });
    } else {
      failed.push({ name: entry.name, error: result.error || 'Unknown error' });
    }
  }

  return { created, failed };
}

// ── Check ownership ──

export async function getSubnameOwner(label: string): Promise<string | null> {
  const fullName = `${sanitizeSubname(label)}.${DOMAIN}`;
  const node = namehash(fullName);

  try {
    const data = await publicClient.readContract({
      address: NAME_WRAPPER,
      abi: NAME_WRAPPER_ABI,
      functionName: 'getData',
      args: [BigInt(node)],
    });
    const owner = data[0];
    if (owner === '0x0000000000000000000000000000000000000000') return null;
    return owner;
  } catch {
    return null;
  }
}

// ── Build default text records for a member ──

export function buildMemberTextRecords(member: {
  username?: string | null;
  pfpUrl?: string | null;
  bio?: string | null;
}): Record<string, string> {
  const records: Record<string, string> = {};
  if (member.username) records.url = `https://zaoos.com/members/${member.username}`;
  if (member.pfpUrl) records.avatar = member.pfpUrl;
  records.description = member.bio || 'ZAO Member';
  return records;
}
