import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkAllowlist } from '@/lib/gates/allowlist';
import { registerUser, createSigner } from '@/lib/farcaster/neynar';
import { logger } from '@/lib/logger';

const registerSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  signature: z.string().min(1),
  deadline: z.number().int().positive(),
  fname: z.string().min(1).max(32).optional(),
});

// Rate limiting: middleware covers /api/auth/* at 10/min

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { signature, deadline, fname } = parsed.data;
    const normalizedWallet = parsed.data.walletAddress.toLowerCase();

    // Check allowlist by wallet
    const gateResult = await checkAllowlist(undefined, normalizedWallet);
    if (!gateResult.allowed) {
      return NextResponse.json({ error: 'Not on allowlist', redirect: '/not-allowed' }, { status: 403 });
    }

    // Register new FID via Neynar
    const registration = await registerUser(signature, normalizedWallet, deadline, fname);

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
    logger.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
