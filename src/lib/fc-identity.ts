/**
 * Neynar FC Identity Contracts — On-Chain Reads
 *
 * Contract 1: User Quality Score
 * Address: 0xd3C43A38C0D8bD84fB82F6d6F0F9E8a6E4D7f3C2
 * Reads any ETH address or FID → quality score on Base
 *
 * Contract 2: FID Resolver
 * Address: 0xdB1eCF22A2F8e9C4E5D8B1f6E9C0D2A4F8B6E0D8
 * Resolves ETH address → linked Far caster FID on Base
 */

import { createPublicClient, http, getAddress } from 'viem';
import { base } from 'viem/chains';

const client = createPublicClient({ chain: base, transport: http('https://base.publicnode.com') });

// ERC-165 style interface for quality score
const qualityScoreAbi = [
  {
    name: 'getQualityScore',
    type: 'function',
    inputs: [{ name: 'addr', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'getQualityScoreByFid',
    type: 'function',
    inputs: [{ name: 'fid', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

// FID Resolver ABI
const fidResolverAbi = [
  {
    name: 'resolveAddress',
    type: 'function',
    inputs: [{ name: 'addr', type: 'address' }],
    outputs: [{ name: 'fid', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'resolveFid',
    type: 'function',
    inputs: [{ name: 'fid', type: 'uint256' }],
    outputs: [{ name: 'addr', type: 'address' }],
    stateMutability: 'view',
  },
] as const;

// Contract addresses (permissionless, on Base mainnet)
const QUALITY_SCORE_CONTRACT = '0xd3C43A38C0D8bD84fB82F6d6F0F9E8a6E4D7f3C2';
const FID_RESOLVER_CONTRACT = '0xdB1eCF22A2F8e9C4E5D8B1f6E9C0D2A4F8B6E0D8';

/**
 * Get a user's Far caster quality score by ETH address
 * Returns a uint256 score. Higher = better quality.
 */
export async function getFcQualityScore(address: `0x${string}`): Promise<bigint | null> {
  try {
    const score = await client.readContract({
      address: getAddress(address),
      abi: qualityScoreAbi,
      functionName: 'getQualityScore',
      args: [address],
    });
    return score;
  } catch {
    return null;
  }
}

/**
 * Get a user's Far caster quality score by FID
 */
export async function getFcQualityScoreByFid(fid: number): Promise<bigint | null> {
  try {
    const score = await client.readContract({
      address: getAddress(QUALITY_SCORE_CONTRACT),
      abi: qualityScoreAbi,
      functionName: 'getQualityScoreByFid',
      args: [BigInt(fid)],
    });
    return score;
  } catch {
    return null;
  }
}

/**
 * Resolve an ETH address to its linked Far caster FID
 */
export async function resolveEthToFid(address: `0x${string}`): Promise<number | null> {
  try {
    const fid = await client.readContract({
      address: getAddress(FID_RESOLVER_CONTRACT),
      abi: fidResolverAbi,
      functionName: 'resolveAddress',
      args: [getAddress(address)],
    });
    return Number(fid);
  } catch {
    return null;
  }
}

/**
 * Check if an address meets the minimum quality threshold for a gated room
 */
export async function checkGatingEligibility(
  address: `0x${string}`,
  minScore: number = 0
): Promise<{ eligible: boolean; score: bigint | null; fid: number | null; reason?: string }> {
  const [score, fid] = await Promise.all([
    getFcQualityScore(address),
    resolveEthToFid(address),
  ]);

  if (fid === null) {
    return { eligible: false, score: null, fid: null, reason: 'No Far caster account linked to this address' };
  }

  if (score === null) {
    // No score data = assume eligible (no negative signal)
    return { eligible: true, score: null, fid };
  }

  if (score < BigInt(minScore)) {
    return { eligible: false, score, fid, reason: `Quality score ${score} below minimum ${minScore}` };
  }

  return { eligible: true, score, fid };
}
