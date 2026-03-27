import { NextRequest, NextResponse } from 'next/server';
import { StreamClient } from '@stream-io/node-sdk';
import { z } from 'zod';

const TokenSchema = z.object({
  userId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    const apiSecret = process.env.STREAM_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.error('Stream.io keys missing');
      return NextResponse.json({ error: 'Stream configuration missing' }, { status: 500 });
    }

    const body = await req.json();
    const parsed = TokenSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const client = new StreamClient(apiKey, apiSecret);
    const token = client.generateUserToken({ user_id: parsed.data.userId });

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Stream token error:', error);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}
