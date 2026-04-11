import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getSessionData } from '@/lib/auth/session';

const CreateInviteSchema = z.object({
  roomId: z.string().uuid(),
  maxUses: z.number().int().positive().optional(),
  expiresInHours: z.number().positive().optional(),
});

const ListInvitesSchema = z.object({
  roomId: z.string().uuid(),
});

const RevokeInviteSchema = z.object({
  inviteId: z.string().uuid(),
});

async function verifyRoomHost(roomId: string, fid: number): Promise<{ isHost: boolean; slug?: string }> {
  const { data: room, error } = await supabaseAdmin
    .from('fishbowl_rooms')
    .select('host_fid, slug')
    .eq('id', roomId)
    .single();

  if (error || !room) {
    return { isHost: false };
  }

  return { isHost: room.host_fid === fid, slug: room.slug };
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session?.fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CreateInviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const { roomId, maxUses, expiresInHours } = parsed.data;

    const { isHost, slug } = await verifyRoomHost(roomId, session.fid);
    if (!isHost) {
      return NextResponse.json({ error: 'Only the room host can create invites' }, { status: 403 });
    }

    const code = crypto.randomBytes(6).toString('base64url').slice(0, 8);
    const expiresAt = expiresInHours
      ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString()
      : null;

    const { data: invite, error } = await supabaseAdmin
      .from('fishbowl_invites')
      .insert({
        room_id: roomId,
        code,
        created_by_fid: session.fid,
        max_uses: maxUses ?? null,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      code: invite.code,
      url: `https://fishbowlz.com/fishbowlz/${slug}?invite=${invite.code}`,
      expiresAt: invite.expires_at,
    }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session?.fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const parsed = ListInvitesSchema.safeParse({ roomId: searchParams.get('roomId') });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const { roomId } = parsed.data;

    const { isHost } = await verifyRoomHost(roomId, session.fid);
    if (!isHost) {
      return NextResponse.json({ error: 'Only the room host can list invites' }, { status: 403 });
    }

    const { data: invites, error } = await supabaseAdmin
      .from('fishbowl_invites')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ invites });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session?.fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const parsed = RevokeInviteSchema.safeParse({ inviteId: searchParams.get('inviteId') });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const { inviteId } = parsed.data;

    // Look up the invite to find its room, then verify host
    const { data: invite, error: lookupError } = await supabaseAdmin
      .from('fishbowl_invites')
      .select('room_id')
      .eq('id', inviteId)
      .single();

    if (lookupError || !invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    const { isHost } = await verifyRoomHost(invite.room_id, session.fid);
    if (!isHost) {
      return NextResponse.json({ error: 'Only the room host can revoke invites' }, { status: 403 });
    }

    const { error: deleteError } = await supabaseAdmin
      .from('fishbowl_invites')
      .delete()
      .eq('id', inviteId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
