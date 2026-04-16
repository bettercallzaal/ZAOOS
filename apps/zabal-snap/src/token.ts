import { createPublicClient, http, parseAbi, type Address } from 'viem';
import { base } from 'viem/chains';

// ── Constants ──────────────────────────────────────────────

export const ZABAL = {
  address: '0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07' as Address,
  chainId: 8453,
  decimals: 18,
  symbol: 'ZABAL',
  caip19: 'eip155:8453/erc20:0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07',
  zaalAddress: '0x7234c36A71ec237c2Ae7698e8916e0735001E9Af' as Address,
  burnAddress: '0x000000000000000000000000000000000000dEaD' as Address,
} as const;

const erc20Abi = parseAbi([
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
]);

const client = createPublicClient({
  chain: base,
  transport: http(),
});

// ── Types ──────────────────────────────────────────────────

export interface TokenDashboardData {
  totalSupply: bigint;
  burned: bigint;
  zaalBalance: bigint;
  distributed: bigint;
  holders: number;
  priceUsd: number;
  marketCapUsd: number;
}

export interface TopRecipient {
  address: Address;
  amount: bigint;
}

// ── Data Fetching ──────────────────────────────────────────

export async function getDashboardData(): Promise<TokenDashboardData> {
  const [totalSupply, burned, zaalBalance] = await client.multicall({
    contracts: [
      { address: ZABAL.address, abi: erc20Abi, functionName: 'totalSupply' },
      { address: ZABAL.address, abi: erc20Abi, functionName: 'balanceOf', args: [ZABAL.burnAddress] },
      { address: ZABAL.address, abi: erc20Abi, functionName: 'balanceOf', args: [ZABAL.zaalAddress] },
    ],
  });

  const supply = totalSupply.result ?? 0n;
  const burnedAmt = burned.result ?? 0n;
  const zaalBal = zaalBalance.result ?? 0n;

  const distributed = supply - burnedAmt - zaalBal;

  const priceUsd = 0.000000141;
  const circulatingFloat = Number(supply - burnedAmt) / 1e18;
  const marketCapUsd = circulatingFloat * priceUsd;

  return {
    totalSupply: supply,
    burned: burnedAmt,
    zaalBalance: zaalBal,
    distributed,
    holders: 340,
    priceUsd,
    marketCapUsd,
  };
}

export async function getTopRecipients(limit: number = 5): Promise<TopRecipient[]> {
  const logs = await client.getLogs({
    address: ZABAL.address,
    event: {
      type: 'event',
      name: 'Transfer',
      inputs: [
        { type: 'address', name: 'from', indexed: true },
        { type: 'address', name: 'to', indexed: true },
        { type: 'uint256', name: 'value' },
      ],
    },
    args: { from: ZABAL.zaalAddress },
    fromBlock: 0n,
    toBlock: 'latest',
  });

  const totals = new Map<string, bigint>();
  for (const log of logs) {
    const to = log.args.to as string;
    const value = log.args.value as bigint;
    if (to && value) {
      totals.set(to, (totals.get(to) ?? 0n) + value);
    }
  }

  return [...totals.entries()]
    .filter(([addr]) => addr.toLowerCase() !== ZABAL.burnAddress.toLowerCase())
    .sort((a, b) => (b[1] > a[1] ? 1 : -1))
    .slice(0, limit)
    .map(([address, amount]) => ({ address: address as Address, amount }));
}
