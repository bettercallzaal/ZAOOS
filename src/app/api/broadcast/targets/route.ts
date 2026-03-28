import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { getUserTargets, createTarget, deleteTarget } from '@/lib/broadcast/targetsDb';

const CreateTargetSchema = z.object({
  platform: z.enum(['youtube', 'twitch', 'tiktok', 'facebook', 'kick', 'custom']),
  name: z.string().min(1).max(100),
  rtmpUrl: z.string().min(1),
  streamKey: z.string().min(1),
  provider: z.enum(['direct', 'livepeer', 'restream']).optional(),
});

export async function GET() {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const targets = await getUserTargets(session.fid);
    return NextResponse.json({ targets });
  } catch (error) {
    console.error('Get targets error:', error);
    return NextResponse.json({ error: 'Failed to fetch targets' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CreateTargetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const target = await createTarget({
      userFid: session.fid,
      ...parsed.data,
    });

    return NextResponse.json({ target });
  } catch (error) {
    console.error('Create target error:', error);
    return NextResponse.json({ error: 'Failed to create target' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Target ID required' }, { status: 400 });
    }

    await deleteTarget(id, session.fid);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete target error:', error);
    return NextResponse.json({ error: 'Failed to delete target' }, { status: 500 });
  }
}
