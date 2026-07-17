// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockSendTransaction = vi.hoisted(() => vi.fn());
vi.mock('@privy-io/node', () => ({
  PrivyClient: vi.fn().mockImplementation(() => ({
    wallets: vi.fn().mockReturnValue({
      ethereum: vi.fn().mockReturnValue({
        sendTransaction: mockSendTransaction,
      }),
    }),
  })),
}));

import { executeSwap, sendToken } from '../wallet';

beforeEach(() => {
  process.env.PRIVY_APP_ID = 'test-app-id';
  process.env.PRIVY_APP_SECRET = 'test-app-secret';
  process.env.VAULT_WALLET_ID = 'wid-vault';
  process.env.BANKER_WALLET_ID = 'wid-banker';
  process.env.DEALER_WALLET_ID = 'wid-dealer';
});
afterEach(() => {
  vi.clearAllMocks();
  delete process.env.PRIVY_APP_ID;
  delete process.env.PRIVY_APP_SECRET;
  delete process.env.VAULT_WALLET_ID;
  delete process.env.BANKER_WALLET_ID;
  delete process.env.DEALER_WALLET_ID;
});

const MOCK_QUOTE = {
  to: '0x1234abcd',
  data: '0xdeadbeef',
  value: '0',
  gas: '200000',
};

// ---------------------------------------------------------------------------
// executeSwap
// ---------------------------------------------------------------------------
describe('executeSwap', () => {
  it('returns the transaction hash on success', async () => {
    mockSendTransaction.mockResolvedValue({ hash: '0xTXHASH' });
    const hash = await executeSwap('VAULT', MOCK_QUOTE);
    expect(hash).toBe('0xTXHASH');
    expect(mockSendTransaction).toHaveBeenCalledWith(
      'wid-vault',
      expect.objectContaining({
        caip2: 'eip155:8453',
        params: expect.objectContaining({
          transaction: expect.objectContaining({ to: '0x1234abcd' }),
        }),
      }),
    );
  });

  it('throws when VAULT_WALLET_ID is not configured', async () => {
    delete process.env.VAULT_WALLET_ID;
    await expect(executeSwap('VAULT', MOCK_QUOTE)).rejects.toThrow('VAULT_WALLET_ID not configured');
  });

  it('rethrows non-auth errors from Privy', async () => {
    mockSendTransaction.mockRejectedValue(new Error('insufficient funds'));
    await expect(executeSwap('VAULT', MOCK_QUOTE)).rejects.toThrow('insufficient funds');
  });

  it('rethrows auth errors and resets the Privy client', async () => {
    mockSendTransaction.mockRejectedValueOnce(new Error('401 Unauthorized'));
    await expect(executeSwap('VAULT', MOCK_QUOTE)).rejects.toThrow('401 Unauthorized');
  });
});

// ---------------------------------------------------------------------------
// sendToken
// ---------------------------------------------------------------------------
describe('sendToken', () => {
  it('returns the transaction hash on success', async () => {
    mockSendTransaction.mockResolvedValue({ hash: '0xTOKEN_TX' });
    const hash = await sendToken('BANKER', '0xTokenAddr', '0xRecipient', BigInt(1e18));
    expect(hash).toBe('0xTOKEN_TX');
    expect(mockSendTransaction).toHaveBeenCalledWith(
      'wid-banker',
      expect.objectContaining({
        params: expect.objectContaining({
          transaction: expect.objectContaining({ to: '0xTokenAddr' }),
        }),
      }),
    );
  });

  it('throws when BANKER_WALLET_ID is not configured', async () => {
    delete process.env.BANKER_WALLET_ID;
    await expect(sendToken('BANKER', '0xAddr', '0xTo', BigInt(100))).rejects.toThrow(
      'BANKER_WALLET_ID not configured',
    );
  });

  it('rethrows errors from Privy sendTransaction', async () => {
    mockSendTransaction.mockRejectedValue(new Error('policy violated'));
    await expect(sendToken('DEALER', '0xAddr', '0xTo', BigInt(100))).rejects.toThrow(
      'policy violated',
    );
  });
});
