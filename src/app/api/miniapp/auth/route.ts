/**
 * Miniapp auth via QuickAuth JWT (Authorization: Bearer ...).
 *
 * Twin of /api/miniapp/auth-context (POST). Both verify the token and mint a
 * session through the shared `authenticateMiniappToken` helper — the FID is
 * taken from the verified JWT, never from client input.
 */
import { NextRequest, NextResponse } from 'next/server';
import { authenticateMiniappToken, extractBearerToken } from '@/lib/auth/miniapp-quickauth';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  const token = extractBearerToken(req.headers.get('Authorization'));
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await authenticateMiniappToken(token);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error: unknown) {
    logger.error('Mini app auth error:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
