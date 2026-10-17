/**
 * Proof that a member controls the XMTP address they register.
 *
 * The server builds the message from the session FID and the address; the
 * client signs it with the key behind that address (the burner key, or a
 * wallet's `signMessage`); the server recovers the signer and requires it to
 * be that address. A member therefore cannot register someone else's address.
 * Replaying a signature only re-registers the same address to the same FID.
 *
 * No server imports here: the client imports `signWithLocalKey`.
 */

export function addressClaimMessage(address: string, fid: number): string {
  return `ZAO XMTP: I control XMTP address ${address.toLowerCase()} and link it to Farcaster FID ${fid}.`;
}

/** Sign a claim with the app-generated burner key. The key never leaves the browser. */
export async function signWithLocalKey(privateKey: `0x${string}`, message: string): Promise<string> {
  const { privateKeyToAccount } = await import('viem/accounts');
  return privateKeyToAccount(privateKey).signMessage({ message });
}
