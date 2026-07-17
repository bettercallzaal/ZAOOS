// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getSwapQuote, getZabalPrice } from '../swap';

const SELL_TOKEN = '0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07'; // ZABAL
const BUY_TOKEN = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC
const TAKER = '0x000000000000000000000000000000000000dEaD';

const MOCK_QUOTE = {
  to: '0xrouter',
  data: '0xswapdata',
  value: '0',
  gas: '200000',
  gasPrice: '1000000000',
  buyAmount: '1000000',
  sellAmount: '1000000000000000000',
  price: '0.50',
  estimatedGas: '150000',
};

function stubFetch(ok: boolean, body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      status: ok ? 200 : 400,
      json: async () => body,
      text: async () => JSON.stringify(body),
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  delete process.env.ZX_API_KEY;
});

// ---------------------------------------------------------------------------
// getSwapQuote
// ---------------------------------------------------------------------------

describe('getSwapQuote', () => {
  it('throws when ZX_API_KEY is not set', async () => {
    delete process.env.ZX_API_KEY;
    await expect(
      getSwapQuote({ sellToken: SELL_TOKEN, buyToken: BUY_TOKEN, sellAmount: '1e18', takerAddress: TAKER }),
    ).rejects.toThrow('ZX_API_KEY not configured');
  });

  it('builds URL with chainId=8453 (Base mainnet)', async () => {
    process.env.ZX_API_KEY = 'test-key';
    stubFetch(true, MOCK_QUOTE);

    await getSwapQuote({ sellToken: SELL_TOKEN, buyToken: BUY_TOKEN, sellAmount: '1000', takerAddress: TAKER });

    const [[url]] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
    expect(url).toContain('chainId=8453');
  });

  it('includes sell/buy tokens and taker address in URL', async () => {
    process.env.ZX_API_KEY = 'test-key';
    stubFetch(true, MOCK_QUOTE);

    await getSwapQuote({ sellToken: SELL_TOKEN, buyToken: BUY_TOKEN, sellAmount: '1000', takerAddress: TAKER });

    const [[url]] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
    expect(url).toContain(encodeURIComponent(SELL_TOKEN));
    expect(url).toContain(encodeURIComponent(BUY_TOKEN));
    expect(url).toContain(encodeURIComponent(TAKER));
  });

  it('returns the parsed quote JSON on success', async () => {
    process.env.ZX_API_KEY = 'test-key';
    stubFetch(true, MOCK_QUOTE);

    const result = await getSwapQuote({ sellToken: SELL_TOKEN, buyToken: BUY_TOKEN, sellAmount: '1e18', takerAddress: TAKER });
    expect(result.price).toBe('0.50');
    expect(result.buyAmount).toBe('1000000');
  });

  it('throws with status code when response is not OK', async () => {
    process.env.ZX_API_KEY = 'test-key';
    stubFetch(false, { reason: 'Insufficient liquidity' });

    await expect(
      getSwapQuote({ sellToken: SELL_TOKEN, buyToken: BUY_TOKEN, sellAmount: '1e18', takerAddress: TAKER }),
    ).rejects.toThrow('0x quote failed');
  });
});

// ---------------------------------------------------------------------------
// getZabalPrice
// ---------------------------------------------------------------------------

describe('getZabalPrice', () => {
  it('throws when ZX_API_KEY is not set', async () => {
    delete process.env.ZX_API_KEY;
    await expect(getZabalPrice()).rejects.toThrow('ZX_API_KEY not configured');
  });

  it('throws when 0x API returns non-OK response', async () => {
    process.env.ZX_API_KEY = 'test-key';
    stubFetch(false, {});

    await expect(getZabalPrice()).rejects.toThrow('ZABAL price unavailable');
  });

  it('returns price divided by 1,000,000 (1M-ZABAL quote normalised to per-unit)', async () => {
    process.env.ZX_API_KEY = 'test-key';
    // price = 500,000 USDC for 1M ZABAL → 0.50 per ZABAL
    stubFetch(true, { price: '500000' });

    const price = await getZabalPrice();
    expect(price).toBeCloseTo(0.5, 5);
  });

  it('queries the /price endpoint (not /quote)', async () => {
    process.env.ZX_API_KEY = 'test-key';
    stubFetch(true, { price: '500000' });

    await getZabalPrice();
    const [[url]] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
    expect(url).toContain('/price');
    expect(url).not.toContain('/quote');
  });
});
