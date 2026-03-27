import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import {
  createSubnameWithFallback,
  deleteSubname,
  listSubnames,
  batchCreateSubnames,
  buildMemberTextRecords,
  isValidSubname,
  sanitizeSubname,
} from '@/lib/ens/namestone';

const createSchema = z.object({
  fid: z.number().int().positive(),
  name: z.string().min(1).max(63),
});

const batchSchema = z.object({
  batch: z.literal(true),
});

const deleteSchema = z.object({
  fid: z.number().int().positive(),
  name: z.string().min(1).max(63),
});

/**
 * GET /api/admin/ens-subnames — List all subnames from NameStone + local DB
 */
export async function GET() {
  const session = await getSessionData();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const [namestoneNames, { data: users }] = await Promise.all([
      listSubnames(),
      supabaseAdmin
        .from('users')
        .select('fid, username, display_name, primary_wallet, zao_subname, zid, pfp_url')
        .eq('is_active', true)
        .not('primary_wallet', 'is', null)
        .order('zid', { ascending: true, nullsFirst: false }),
    ]);

    return NextResponse.json({
      namestone: namestoneNames,
      members: (users || []).map(u => ({
        fid: u.fid,
        username: u.username,
        displayName: u.display_name,
        wallet: u.primary_wallet,
        zaoSubname: u.zao_subname,
        zid: u.zid,
        pfpUrl: u.pfp_url,
      })),
    });
  } catch (err) {
    console.error('[admin/ens-subnames] list error:', err);
    return NextResponse.json({ error: 'Failed to list subnames' }, { status: 500 });
  }
}

/**
 * POST /api/admin/ens-subnames — Create subname(s)
 *
 * Single: { fid, name }
 * Batch:  { batch: true } — auto-creates for all members without subnames
 */
export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await req.json();

    // Batch mode: create subnames for all members without one
    if (batchSchema.safeParse(body).success) {
      const { data: members } = await supabaseAdmin
        .from('users')
        .select('fid, username, display_name, primary_wallet, zid, pfp_url, bio, zao_subname')
        .eq('is_active', true)
        .not('primary_wallet', 'is', null)
        .is('zao_subname', null);

      if (!members || members.length === 0) {
        return NextResponse.json({ message: 'All members already have subnames', created: [], failed: [] });
      }

      const toCreate = members.map(m => ({
        name: sanitizeSubname(m.username || m.display_name || `member-${m.fid}`),
        address: m.primary_wallet!,
        zid: m.zid ? Number(m.zid) : null,
        textRecords: buildMemberTextRecords({ username: m.username, pfpUrl: m.pfp_url, bio: m.bio }),
      }));

      const result = await batchCreateSubnames(toCreate);

      // Update DB for successfully created names
      for (let i = 0; i < members.length; i++) {
        const fullName = result.created.find(n =>
          n.startsWith(sanitizeSubname(toCreate[i].name)) ||
          n.startsWith(`${sanitizeSubname(toCreate[i].name)}-`)
        );
        if (fullName) {
          await supabaseAdmin
            .from('users')
            .update({ zao_subname: fullName })
            .eq('fid', members[i].fid);
        }
      }

      return NextResponse.json({
        message: `Created ${result.created.length}/${members.length} subnames`,
        created: result.created,
        failed: result.failed,
      });
    }

    // Single create
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { fid, name } = parsed.data;
    const sanitized = sanitizeSubname(name);
    if (!isValidSubname(sanitized)) {
      return NextResponse.json({ error: `Invalid subname: "${name}"` }, { status: 400 });
    }

    // Get member data
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('primary_wallet, zid, username, pfp_url, bio')
      .eq('fid', fid)
      .eq('is_active', true)
      .single();

    if (!user || !user.primary_wallet) {
      return NextResponse.json({ error: 'Member not found or no wallet' }, { status: 404 });
    }

    const textRecords = buildMemberTextRecords({ username: user.username, pfpUrl: user.pfp_url, bio: user.bio });
    const result = await createSubnameWithFallback(sanitized, user.primary_wallet, user.zid ? Number(user.zid) : null, textRecords);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Store in DB
    await supabaseAdmin
      .from('users')
      .update({ zao_subname: result.fullName })
      .eq('fid', fid);

    return NextResponse.json({ success: true, subname: result.fullName });
  } catch (err) {
    console.error('[admin/ens-subnames] create error:', err);
    return NextResponse.json({ error: 'Failed to create subname' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/ens-subnames — Revoke a subname
 */
export async function DELETE(req: NextRequest) {
  const session = await getSessionData();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = deleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { fid, name } = parsed.data;

    const delResult = await deleteSubname(name);
    if (!delResult.success) {
      return NextResponse.json({ error: delResult.error }, { status: 500 });
    }

    // Clear from DB
    await supabaseAdmin
      .from('users')
      .update({ zao_subname: null })
      .eq('fid', fid);

    return NextResponse.json({ success: true, message: `Revoked ${name}.thezao.eth` });
  } catch (err) {
    console.error('[admin/ens-subnames] delete error:', err);
    return NextResponse.json({ error: 'Failed to revoke subname' }, { status: 500 });
  }
}
