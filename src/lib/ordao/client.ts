// src/lib/ordao/client.ts
// Direct on-chain OREC contract reader — fallback for when ornode (frapps.xyz) is down.
// Uses viem to read proposals and respect balances from the OREC contract on Optimism.

import { createPublicClient, http, fallback, parseAbi, type Address } from 'viem';
import { optimism } from 'viem/chains';

// ── Contract Addresses (Optimism) ────────────────────────────────
export const OREC_ADDRESS = '0xcB05F9254765CA521F7698e61E0A6CA6456Be532' as const;
export const ZOR_RESPECT_ADDRESS = '0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c' as const;

// ── Minimal ABIs (only the view functions we need) ───────────────
// Source: sim31/ordao — Orec.sol + Respect1155.sol
// TODO: Replace with full ABI from @ordao/contracts when available as npm package

// PropId is bytes32 in the contract
const orecAbi = parseAbi([
  // Reading proposal state
  'function proposalExists(bytes32 propId) public view returns (bool)',
  'function getStage(bytes32 propId) public view returns (uint8)',
  'function getVoteStatus(bytes32 propId) public view returns (uint8)',
  'function isLive(bytes32 propId) public view returns (bool)',

  // Reading respect / vote weight
  'function respectOf(address account) public view returns (uint256)',
  'function voteWeightOf(address account) public view returns (uint128)',

  // Events — used to discover proposal IDs
  'event Proposed(bytes32 indexed propId, address indexed proposer)',
  'event Executed(bytes32 indexed propId, address indexed executor)',
  'event VotedYes(bytes32 indexed propId, address indexed voter, uint128 weight)',
  'event VotedNo(bytes32 indexed propId, address indexed voter, uint128 weight)',
]);

const respectAbi = parseAbi([
  'function balanceOf(address account, uint256 id) public view returns (uint256)',
]);

// ── Stage & VoteStatus enums (mirror Solidity) ──────────────────
export const Stage = {
  0: 'Voting',
  1: 'Veto',
  2: 'Execution',
  3: 'Expired',
} as const;

export const VoteStatus = {
  0: 'Passing',
  1: 'Failing',
  2: 'Passed',
  3: 'Failed',
} as const;

// ── Viem public client (singleton) — Alchemy primary for reliability ─
const client = createPublicClient({
  chain: optimism,
  transport: fallback([
    ...(process.env.ALCHEMY_API_KEY
      ? [http(`https://opt-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`)]
      : []),
    http('https://mainnet.optimism.io'),
  ]),
});

// ── Types ────────────────────────────────────────────────────────
export interface OnChainProposal {
  id: string; // bytes32 hex
  proposer: string;
  stage: string;
  voteStatus: string;
  isLive: boolean;
  blockNumber: number; // converted from bigint for JSON serialization
}

// ── Helper Functions ─────────────────────────────────────────────

/**
 * Fetch recent proposals directly from the OREC contract on Optimism.
 * Reads Proposed events from the last ~7 days of blocks, then enriches
 * each with on-chain stage/status via multicall.
 */
export async function fetchProposalsOnChain(limit = 20): Promise<OnChainProposal[]> {
  // Get current block to calculate lookback range
  const currentBlock = await client.getBlockNumber();
  // ~7 days of Optimism blocks (2s block time) = ~302,400 blocks
  const lookbackBlocks = BigInt(302_400);
  const fromBlock = currentBlock > lookbackBlocks ? currentBlock - lookbackBlocks : BigInt(0);

  // 1. Discover proposal IDs from Proposed events
  const logs = await client.getLogs({
    address: OREC_ADDRESS,
    event: parseAbi(['event Proposed(bytes32 indexed propId, address indexed proposer)'])[0],
    fromBlock,
    toBlock: 'latest',
  });

  if (logs.length === 0) {
    return [];
  }

  // Dedupe and take most recent first
  const uniqueProps = new Map<string, { propId: `0x${string}`; proposer: string; blockNumber: bigint }>();
  for (const log of logs) {
    const propId = log.args.propId;
    const proposer = log.args.proposer;
    if (propId && proposer && !uniqueProps.has(propId)) {
      uniqueProps.set(propId, { propId, proposer, blockNumber: log.blockNumber });
    }
  }

  // Sort newest first, take limit
  const sorted = [...uniqueProps.values()]
    .sort((a, b) => Number(b.blockNumber - a.blockNumber))
    .slice(0, limit);

  if (sorted.length === 0) {
    return [];
  }

  // 2. Multicall to get stage + voteStatus + isLive for each proposal
  const contracts = sorted.flatMap((p) => [
    {
      address: OREC_ADDRESS as Address,
      abi: orecAbi,
      functionName: 'getStage' as const,
      args: [p.propId],
    },
    {
      address: OREC_ADDRESS as Address,
      abi: orecAbi,
      functionName: 'getVoteStatus' as const,
      args: [p.propId],
    },
    {
      address: OREC_ADDRESS as Address,
      abi: orecAbi,
      functionName: 'isLive' as const,
      args: [p.propId],
    },
  ]);

  const results = await client.multicall({ contracts });

  // 3. Assemble enriched proposals
  const proposals: OnChainProposal[] = sorted.map((p, idx) => {
    const stageResult = results[idx * 3];
    const statusResult = results[idx * 3 + 1];
    const liveResult = results[idx * 3 + 2];

    const stageNum = stageResult.status === 'success' ? Number(stageResult.result) : -1;
    const statusNum = statusResult.status === 'success' ? Number(statusResult.result) : -1;
    const isLive = liveResult.status === 'success' ? (liveResult.result as boolean) : false;

    return {
      id: p.propId,
      proposer: p.proposer,
      stage: Stage[stageNum as keyof typeof Stage] ?? `Unknown(${stageNum})`,
      voteStatus: VoteStatus[statusNum as keyof typeof VoteStatus] ?? `Unknown(${statusNum})`,
      isLive,
      blockNumber: Number(p.blockNumber),
    };
  });

  return proposals;
}

/**
 * Fetch the OREC respect balance (vote weight source) for a wallet address.
 * This reads directly from the OREC contract's respectOf() function.
 */
export async function fetchRespectBalance(wallet: string): Promise<bigint> {
  const balance = await client.readContract({
    address: OREC_ADDRESS,
    abi: orecAbi,
    functionName: 'respectOf',
    args: [wallet as Address],
  });
  return balance;
}

/**
 * Fetch the ZOR Respect1155 token balance for a wallet (tokenId = 0).
 */
export async function fetchZorBalance(wallet: string): Promise<bigint> {
  const balance = await client.readContract({
    address: ZOR_RESPECT_ADDRESS,
    abi: respectAbi,
    functionName: 'balanceOf',
    args: [wallet as Address, BigInt(0)],
  });
  return balance;
}
