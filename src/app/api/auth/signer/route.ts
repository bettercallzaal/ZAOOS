import { NextResponse } from 'next/server';
import { getSession, getSessionData } from '@/lib/auth/session';
import { createSigner, registerSignedKey } from '@/lib/farcaster/neynar';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { optimism } from 'viem/chains';

const SIGNED_KEY_REQUEST_VALIDATOR = '0x00000000FC700472606ED4fA22623Acf62c60553' as const;

export async function POST() {
  const sessionData = await getSessionData();
  if (!sessionData) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // If user already has an approved signer, return it
  if (sessionData.signerUuid) {
    return NextResponse.json({ signerUuid: sessionData.signerUuid, status: 'approved' });
  }

  try {
    // Step 1: Create a managed signer
    const signer = await createSigner();
    const signerUuid = signer.signer_uuid;
    const publicKey = signer.public_key;

    // Step 2: Sign with app wallet to register the key
    const appFid = parseInt(process.env.APP_FID!);
    const deadline = Math.floor(Date.now() / 1000) + 86400; // 24 hours

    const account = privateKeyToAccount(process.env.APP_SIGNER_PRIVATE_KEY! as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      chain: optimism,
      transport: http('https://mainnet.optimism.io'),
    });

    const signature = await walletClient.signTypedData({
      domain: {
        name: 'Farcaster SignedKeyRequestValidator',
        version: '1',
        chainId: 10,
        verifyingContract: SIGNED_KEY_REQUEST_VALIDATOR,
      },
      types: {
        SignedKeyRequest: [
          { name: 'requestFid', type: 'uint256' },
          { name: 'key', type: 'bytes' },
          { name: 'deadline', type: 'uint256' },
        ],
      },
      primaryType: 'SignedKeyRequest',
      message: {
        requestFid: BigInt(appFid),
        key: publicKey as `0x${string}`,
        deadline: BigInt(deadline),
      },
    });

    // Step 3: Register signed key to get approval URL
    const registered = await registerSignedKey(signerUuid, appFid, deadline, signature);

    return NextResponse.json({
      signerUuid: registered.signer_uuid,
      status: registered.status,
      approvalUrl: registered.signer_approval_url,
    });
  } catch (error) {
    console.error('Signer creation error:', error);
    return NextResponse.json({ error: 'Failed to create signer' }, { status: 500 });
  }
}
