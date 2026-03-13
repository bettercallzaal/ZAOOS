import { NextRequest, NextResponse } from 'next/server';
import { checkAllowlist } from '@/lib/gates/allowlist';
import { registerUser, createSigner } from '@/lib/farcaster/neynar';

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, signature, deadline, fname } = await req.json();

    if (!walletAddress || !signature || !deadline) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check allowlist by wallet
    const gateResult = await checkAllowlist(undefined, walletAddress);
    if (!gateResult.allowed) {
      return NextResponse.json({ error: 'Not on allowlist', redirect: '/not-allowed' }, { status: 403 });
    }

    // Register new FID via Neynar
    const registration = await registerUser(signature, walletAddress, deadline, fname);

    // Create a signer for the new user
    const signer = await createSigner();

    return NextResponse.json({
      success: true,
      fid: registration.fid,
      signerUuid: signer.signer_uuid,
      signerStatus: signer.status,
      signerApprovalUrl: signer.signer_approval_url,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
