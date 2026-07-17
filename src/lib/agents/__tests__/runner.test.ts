// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const mockGetAgentConfig = vi.hoisted(() => vi.fn());
const mockClaimBudget = vi.hoisted(() => vi.fn());
vi.mock('../config', () => ({ getAgentConfig: mockGetAgentConfig, claimBudget: mockClaimBudget }));

const mockMaybeAutoStake = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
vi.mock('../autostake', () => ({ maybeAutoStake: mockMaybeAutoStake }));

const mockBurnZabal = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
vi.mock('../burn', () => ({ burnZabal: mockBurnZabal }));

const mockPostTradeUpdate = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
vi.mock('../cast', () => ({ postTradeUpdate: mockPostTradeUpdate }));

const mockLogAgentEvent = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
vi.mock('../events', () => ({ logAgentEvent: mockLogAgentEvent }));

const mockGetSwapQuote = vi.hoisted(() => vi.fn());
const mockGetZabalPrice = vi.hoisted(() => vi.fn());
vi.mock('../swap', () => ({ getSwapQuote: mockGetSwapQuote, getZabalPrice: mockGetZabalPrice }));

const mockExecuteSwap = vi.hoisted(() => vi.fn());
vi.mock('../wallet', () => ({ executeSwap: mockExecuteSwap }));

const mockFetch = vi.hoisted(() => vi.fn());
vi.stubGlobal('fetch', mockFetch);

import { runAgent } from '../runner';

afterEach(() => vi.clearAllMocks());

const BASE_CONFIG = {
  trading_enabled: true,
  wallet_address: '0xABCD1234',
  max_single_trade_usd: 1.0,
  max_daily_spend_usd: 10.0,
  buy_price_ceiling: 0.01,
};

const MOCK_QUOTE = {
  buyAmount: '1000000000000000000',
  sellAmount: '200000000000000',
  price: '0.0001',
};

// ETH price fetch — return $2500 by default
function stubEthPrice(price = 2500) {
  mockFetch.mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue({ price: String(price) }),
  });
}

// ---------------------------------------------------------------------------
// Early-return paths (no financial ops)
// ---------------------------------------------------------------------------
describe('runAgent — early returns', () => {
  it('returns failed when no config found', async () => {
    mockGetAgentConfig.mockResolvedValue(null);
    const result = await runAgent('vault');
    expect(result.status).toBe('failed');
    expect(result.details).toContain('No config found');
  });

  it('returns skipped when trading_enabled is false', async () => {
    mockGetAgentConfig.mockResolvedValue({ ...BASE_CONFIG, trading_enabled: false });
    const result = await runAgent('vault');
    expect(result.status).toBe('skipped');
    expect(result.details).toBe('Trading disabled');
  });

  it('returns skipped when wallet_address is falsy', async () => {
    mockGetAgentConfig.mockResolvedValue({ ...BASE_CONFIG, wallet_address: null });
    const result = await runAgent('vault');
    expect(result.status).toBe('skipped');
    expect(result.details).toBe('No wallet configured');
  });

  it('returns skipped when budget claim fails', async () => {
    mockGetAgentConfig.mockResolvedValue(BASE_CONFIG);
    stubEthPrice();
    mockClaimBudget.mockResolvedValue(false);
    const result = await runAgent('vault');
    expect(result.status).toBe('skipped');
    expect(result.details).toContain('Budget exceeded');
  });

  it('returns skipped when ZABAL price API throws', async () => {
    mockGetAgentConfig.mockResolvedValue(BASE_CONFIG);
    stubEthPrice();
    mockClaimBudget.mockResolvedValue(true);
    mockGetZabalPrice.mockRejectedValue(new Error('API down'));
    const result = await runAgent('vault');
    expect(result.status).toBe('skipped');
    expect(result.details).toBe('Price API unavailable');
  });

  it('returns skipped when ZABAL price exceeds ceiling', async () => {
    mockGetAgentConfig.mockResolvedValue({ ...BASE_CONFIG, buy_price_ceiling: 0.001 });
    stubEthPrice();
    mockClaimBudget.mockResolvedValue(true);
    mockGetZabalPrice.mockResolvedValue(0.005); // above ceiling
    const result = await runAgent('vault');
    expect(result.status).toBe('skipped');
    expect(result.details).toBe('Price above ceiling');
  });
});

// ---------------------------------------------------------------------------
// Success path
// ---------------------------------------------------------------------------
describe('runAgent — success', () => {
  it('returns success after swap + burn + log + cast', async () => {
    mockGetAgentConfig.mockResolvedValue(BASE_CONFIG);
    stubEthPrice(3000);
    mockClaimBudget.mockResolvedValue(true);
    mockGetZabalPrice.mockResolvedValue(0.0005); // below ceiling
    mockGetSwapQuote.mockResolvedValue(MOCK_QUOTE);
    mockExecuteSwap.mockResolvedValue('0xTXHASH');

    const result = await runAgent('vault');
    expect(result.status).toBe('success');
    expect(result.action).toBe('buy_zabal');
    expect(mockExecuteSwap).toHaveBeenCalledWith('vault', MOCK_QUOTE);
    expect(mockBurnZabal).toHaveBeenCalledWith('vault', BigInt(MOCK_QUOTE.buyAmount));
    expect(mockLogAgentEvent).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
    expect(mockPostTradeUpdate).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Failure path
// ---------------------------------------------------------------------------
describe('runAgent — failures', () => {
  it('returns failed and logs event when executeSwap throws', async () => {
    mockGetAgentConfig.mockResolvedValue(BASE_CONFIG);
    stubEthPrice();
    mockClaimBudget.mockResolvedValue(true);
    mockGetZabalPrice.mockResolvedValue(0.0005);
    mockGetSwapQuote.mockResolvedValue(MOCK_QUOTE);
    mockExecuteSwap.mockRejectedValue(new Error('insufficient funds'));

    const result = await runAgent('vault');
    expect(result.status).toBe('failed');
    expect(result.details).toContain('insufficient funds');
    expect(mockLogAgentEvent).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'failed', error_message: 'insufficient funds' }),
    );
  });

  it('uses $2500 ETH fallback when price fetch fails', async () => {
    mockGetAgentConfig.mockResolvedValue(BASE_CONFIG);
    mockFetch.mockRejectedValue(new Error('network error'));
    mockClaimBudget.mockResolvedValue(true);
    mockGetZabalPrice.mockResolvedValue(0.0005);
    mockGetSwapQuote.mockResolvedValue(MOCK_QUOTE);
    mockExecuteSwap.mockResolvedValue('0xTXHASH');

    const result = await runAgent('vault');
    // Should still succeed using the $2500 fallback
    expect(result.status).toBe('success');
  });
});
