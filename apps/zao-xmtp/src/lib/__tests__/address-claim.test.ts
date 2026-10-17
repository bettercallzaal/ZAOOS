import { verifyMessage } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { describe, expect, it } from 'vitest';
import { addressClaimMessage, signWithLocalKey } from '@/lib/xmtp/address-claim';

describe('address claim', () => {
  const key = generatePrivateKey();
  const own = privateKeyToAccount(key).address.toLowerCase() as `0x${string}`;
  const other = privateKeyToAccount(generatePrivateKey()).address.toLowerCase() as `0x${string}`;

  it('verifies a claim signed by the key behind the address', async () => {
    const message = addressClaimMessage(own, 42);
    const signature = (await signWithLocalKey(key, message)) as `0x${string}`;
    await expect(verifyMessage({ address: own, message, signature })).resolves.toBe(true);
  });

  it('rejects a claim on someone else\'s address (the attack the proof blocks)', async () => {
    const message = addressClaimMessage(other, 42);
    const signature = (await signWithLocalKey(key, message)) as `0x${string}`;
    await expect(verifyMessage({ address: other, message, signature })).resolves.toBe(false);
  });

  it('binds the FID: a signature for FID 42 does not verify for FID 43', async () => {
    const signature = (await signWithLocalKey(key, addressClaimMessage(own, 42))) as `0x${string}`;
    await expect(
      verifyMessage({ address: own, message: addressClaimMessage(own, 43), signature }),
    ).resolves.toBe(false);
  });
});
