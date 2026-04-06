import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkTokenGate } from '@/lib/fishbowlz/tokenGate';

const GateCheckSchema = z.object({
  walletAddress: z.string().startsWith('0x'),
  tokenAddress: z.string().startsWith('0x'),
  minBalance: z.string(),
  chainId: z.number().int().default(8453),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = GateCheckSchema.safeParse(body);
    if (!data.success) {
      return NextResponse.json({ error: data.error.issues }, { status: 400 });
    }

    const result = await checkTokenGate(data.data);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Gate check failed' }, { status: 500 });
  }
}
