import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getPastRooms } from '@/lib/spaces/roomsDb';

const QuerySchema = z.object({
  days: z.coerce.number().min(1).max(90).default(7),
});

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({ days: url.searchParams.get('days') ?? 7 });
    const days = parsed.success ? parsed.data.days : 7;

    const rooms = await getPastRooms(days);
    return NextResponse.json({ rooms });
  } catch (error) {
    console.error('Fetch past rooms error:', error);
    return NextResponse.json({ error: 'Failed to fetch past rooms' }, { status: 500 });
  }
}
