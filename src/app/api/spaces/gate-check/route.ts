import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { checkTokenGate, type TokenGateConfig } from '@/lib/spaces/tokenGate';
import { logger } from '@/lib/logger';

const GateCheckSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  gateConfig: z.object({
    type: z.enum(['erc20', 'erc721', 'erc1155']),
    contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid contract address'),
    chainId: z.number().int().refine(id => [1, 8453, 10].includes(id), { message: 'Unsupported chainId' }),
    minBalance: z.string().optional(),
    tokenId: z.string().optional(),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = GateCheckSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { walletAddress, gateConfig } = parsed.data;
    const result = await checkTokenGate(walletAddress, gateConfig as TokenGateConfig);

    return NextResponse.json({
      allowed: result.allowed,
      balance: result.balance,
    });
  } catch (err) {
    logger.error('Gate check error:', err);
    return NextResponse.json(
      { error: 'Failed to check token gate', allowed: false },
      { status: 500 },
    );
  }
}
