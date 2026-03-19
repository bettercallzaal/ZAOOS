import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { allowlistEntrySchema, removeAllowlistSchema } from '@/lib/validation/schemas';

async function requireAdmin() {
  const session = await getSessionData();
  if (!session) return { error: 'Unauthorized', status: 401 };
  if (!session.isAdmin) return { error: 'Admin access required', status: 403 };
  return { session };
}

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('allowlist')
      .select('*')
      .order('added_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch allowlist' }, { status: 500 });
    }

    // Join xmtp_address from users table
    const fids = (data || []).map((m) => m.fid).filter(Boolean);
    const xmtpMap = new Map<number, string>();
    if (fids.length > 0) {
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('fid, xmtp_address')
        .in('fid', fids)
        .not('xmtp_address', 'is', null);
      for (const u of userData || []) {
        if (u.fid && u.xmtp_address) xmtpMap.set(u.fid, u.xmtp_address);
      }
    }

    const entries = (data || []).map((m) => ({
      ...m,
      xmtp_address: m.fid ? (xmtpMap.get(m.fid) || null) : null,
    }));

    return NextResponse.json({ entries });
  } catch (err) {
    console.error('Allowlist fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch allowlist' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const parsed = allowlistEntrySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('allowlist')
      .insert(parsed.data);

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Entry already exists' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Add allowlist error:', error);
    return NextResponse.json({ error: 'Failed to add entry' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const parsed = removeAllowlistSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('allowlist')
      .delete()
      .eq('id', parsed.data.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove allowlist error:', error);
    return NextResponse.json({ error: 'Failed to remove entry' }, { status: 500 });
  }
}
