import { BASE_CHAIN_ID } from './types';

const ZX_API_BASE = 'https://api.0x.org';

interface SwapQuote {
  to: string;
  data: string;
  value: string;
  gas: string;
  gasPrice: string;
  buyAmount: string;
  sellAmount: string;
  price: string;
  estimatedGas: string;
}

/**
 * Get a swap quote from 0x API on Base chain.
 * Handles multi-hop routing (e.g. ZABAL -> ETH -> SANG).
 */
export async function getSwapQuote(params: {
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  takerAddress: string;
}): Promise<SwapQuote> {
  const apiKey = process.env.ZX_API_KEY;
  if (!apiKey) throw new Error('ZX_API_KEY not configured');

  const url = new URL(`${ZX_API_BASE}/swap/v1/quote`);
  url.searchParams.set('chainId', String(BASE_CHAIN_ID));
  url.searchParams.set('sellToken', params.sellToken);
  url.searchParams.set('buyToken', params.buyToken);
  url.searchParams.set('sellAmount', params.sellAmount);
  url.searchParams.set('takerAddress', params.takerAddress);

  const res = await fetch(url.toString(), {
    headers: { '0x-api-key': apiKey },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`0x quote failed (${res.status}): ${body}`);
  }

  return res.json();
}

/**
 * Get ZABAL price in USD from 0x API.
 */
export async function getZabalPrice(): Promise<number> {
  const apiKey = process.env.ZX_API_KEY;
  if (!apiKey) throw new Error('ZX_API_KEY not configured');

  const url = new URL(`${ZX_API_BASE}/swap/v1/price`);
  url.searchParams.set('chainId', String(BASE_CHAIN_ID));
  url.searchParams.set('sellToken', '0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07');
  url.searchParams.set('buyToken', '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'); // USDC
  url.searchParams.set('sellAmount', '1000000000000000000000000'); // 1M ZABAL

  const res = await fetch(url.toString(), {
    headers: { '0x-api-key': apiKey },
  });

  if (!res.ok) return 0.0000001429; // fallback to last known price
  const data = await res.json();
  // price = USDC received per 1M ZABAL
  return parseFloat(data.price) / 1_000_000;
}
