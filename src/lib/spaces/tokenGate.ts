import { createPublicClient, http, type Address } from 'viem';
import { base, mainnet, optimism } from 'viem/chains';

export interface TokenGateConfig {
  type: 'erc20' | 'erc721' | 'erc1155';
  contractAddress: string;
  chainId: number;
  minBalance?: string;
  tokenId?: string;
}

const CHAINS: Record<number, (typeof base)> = {
  1: mainnet,
  8453: base,
  10: optimism,
};

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

const ERC721_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

const ERC1155_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'id', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

function getClient(chainId: number) {
  const chain = CHAINS[chainId];
  if (!chain) throw new Error(`Unsupported chain: ${chainId}`);
  return createPublicClient({ chain, transport: http() });
}

export async function checkTokenGate(
  walletAddress: string,
  gate: TokenGateConfig,
): Promise<{ allowed: boolean; balance: string }> {
  const client = getClient(gate.chainId);
  const address = walletAddress as Address;
  const contract = gate.contractAddress as Address;

  let balance: bigint;

  switch (gate.type) {
    case 'erc20': {
      balance = await client.readContract({
        address: contract,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address],
      });
      const min = BigInt(gate.minBalance || '1');
      return { allowed: balance >= min, balance: balance.toString() };
    }

    case 'erc721': {
      balance = await client.readContract({
        address: contract,
        abi: ERC721_ABI,
        functionName: 'balanceOf',
        args: [address],
      });
      return { allowed: balance > 0n, balance: balance.toString() };
    }

    case 'erc1155': {
      if (!gate.tokenId) throw new Error('tokenId required for ERC-1155 gate');
      balance = await client.readContract({
        address: contract,
        abi: ERC1155_ABI,
        functionName: 'balanceOf',
        args: [address, BigInt(gate.tokenId)],
      });
      return { allowed: balance > 0n, balance: balance.toString() };
    }

    default:
      throw new Error(`Unknown gate type: ${gate.type}`);
  }
}
