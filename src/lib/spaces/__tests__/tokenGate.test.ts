// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { checkTokenGate } from '../tokenGate';

// checkTokenGate delegates live reads to viem. Tests here cover the defensive
// error paths that throw before any network call, documenting the supported
// chain set and the ERC-1155 tokenId requirement.

const DEAD_ADDR = '0x000000000000000000000000000000000000dEaD';

describe('checkTokenGate — unsupported chain', () => {
  it('throws for chain 999 (not supported)', async () => {
    await expect(
      checkTokenGate(DEAD_ADDR, { type: 'erc20', contractAddress: DEAD_ADDR, chainId: 999 }),
    ).rejects.toThrow('Unsupported chain: 999');
  });

  it('throws for chain 137 (Polygon — not in supported set)', async () => {
    await expect(
      checkTokenGate(DEAD_ADDR, { type: 'erc20', contractAddress: DEAD_ADDR, chainId: 137 }),
    ).rejects.toThrow('Unsupported chain: 137');
  });

  it('throws for chain 0', async () => {
    await expect(
      checkTokenGate(DEAD_ADDR, { type: 'erc20', contractAddress: DEAD_ADDR, chainId: 0 }),
    ).rejects.toThrow('Unsupported chain: 0');
  });

  it('error message includes the bad chain id', async () => {
    await expect(
      checkTokenGate(DEAD_ADDR, { type: 'erc721', contractAddress: DEAD_ADDR, chainId: 56 }),
    ).rejects.toThrow('56');
  });
});

describe('checkTokenGate — ERC-1155 tokenId guard', () => {
  it('throws when tokenId is absent for erc1155 gate', async () => {
    await expect(
      checkTokenGate(DEAD_ADDR, { type: 'erc1155', contractAddress: DEAD_ADDR, chainId: 8453 }),
    ).rejects.toThrow('tokenId required for ERC-1155 gate');
  });

  it('throws when tokenId is an empty string for erc1155 gate', async () => {
    await expect(
      checkTokenGate(DEAD_ADDR, {
        type: 'erc1155',
        contractAddress: DEAD_ADDR,
        chainId: 8453,
        tokenId: '',
      }),
    ).rejects.toThrow('tokenId required for ERC-1155 gate');
  });
});

describe('checkTokenGate — unknown gate type', () => {
  it('throws for an unknown gate type', async () => {
    await expect(
      checkTokenGate(DEAD_ADDR, {
        // @ts-expect-error — deliberate runtime test of the default branch
        type: 'erc777',
        contractAddress: DEAD_ADDR,
        chainId: 8453,
      }),
    ).rejects.toThrow('Unknown gate type: erc777');
  });
});
