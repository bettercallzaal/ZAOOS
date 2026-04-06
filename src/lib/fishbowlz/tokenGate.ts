import { createPublicClient, http, parseAbi } from 'viem';
import { base } from 'viem/chains';

const ERC20_ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
]);

const chains: Record<number, { rpcUrl: string; chain: typeof base }> = {
  8453: { rpcUrl: 'https://mainnet.base.org', chain: base },
};

export async function checkTokenGate(params: {
  walletAddress: string;
  tokenAddress: string;
  minBalance: string;
  chainId: number;
  tokenType?: string;
}): Promise<{ allowed: boolean; balance: string; required: string }> {
  const { walletAddress, tokenAddress, minBalance, chainId } = params;

  const chainConfig = chains[chainId];
  if (!chainConfig) {
    return { allowed: false, balance: '0', required: minBalance };
  }

  try {
    const client = createPublicClient({
      chain: chainConfig.chain,
      transport: http(chainConfig.rpcUrl),
    });

    const balance = await client.readContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [walletAddress as `0x${string}`],
    });

    const balanceStr = balance.toString();
    const allowed = BigInt(balanceStr) >= BigInt(minBalance);

    return { allowed, balance: balanceStr, required: minBalance };
  } catch (err) {
    console.error('Token gate check failed:', err);
    return { allowed: false, balance: '0', required: minBalance };
  }
}
