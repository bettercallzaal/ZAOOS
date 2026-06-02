/**
 * Miniapp silent auth — QuickAuth-verified (no SIWF signature prompt).
 *
 * SECURITY (doc 795): the FID comes from a verified QuickAuth JWT, never the
 * request body. The verification + allowlist + session logic is shared with
 * /api/miniapp/auth via `authenticateMiniappToken`. The client attaches the
 * token via `sdk.quickAuth.fetch(...)`; QuickAuth is silent (a JWT, not a SIWF
 * signature prompt), so the no-prompt UX is preserved.
 */
import { NextRequest, NextResponse } from 'next/server';
import { authenticateMiniappToken, extractBearerToken } from '@/lib/auth/miniapp-quickauth';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  const token = extractBearerToken(req.headers.get('Authorization'));
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await authenticateMiniappToken(token);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error: unknown) {
    logger.error('Miniapp context auth error:', error);
    return NextResponse.json({ error: 'Auth failed' }, { status: 500 });
  }
}
