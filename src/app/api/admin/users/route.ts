import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getUserByFid, getUserByAddress } from '@/lib/farcaster/neynar';

async function requireAdmin() {
  const session = await getSessionData();
  if (!session) return { error: 'Unauthorized', status: 401 };
  if (!session.isAdmin) return { error: 'Admin access required', status: 403 };
  return { session };
}

/**
 * GET — List all users with optional filters
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const role = req.nextUrl.searchParams.get('role');
  const search = req.nextUrl.searchParams.get('q');

  let query = supabaseAdmin
    .from('users')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (role) {
    query = query.eq('role', role);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }

  let users = data || [];

  // Client-side search filter (Supabase doesn't support OR ilike easily)
  if (search) {
    const q = search.toLowerCase();
    users = users.filter((u) =>
      u.display_name?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.primary_wallet?.toLowerCase().includes(q) ||
      u.real_name?.toLowerCase().includes(q) ||
      u.ign?.toLowerCase().includes(q) ||
      u.ens_name?.toLowerCase().includes(q) ||
      String(u.fid).includes(q)
    );
  }

  return NextResponse.json({ users });
}

/**
 * POST — Create a new user
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { primary_wallet, fid, role, real_name, ign, notes } = body;

    if (!primary_wallet && !fid) {
      return NextResponse.json({ error: 'Either wallet address or FID is required' }, { status: 400 });
    }

    let wallet = primary_wallet ? primary_wallet.toLowerCase() : '';

    // Build user record
    const userData: Record<string, unknown> = {
      role: role || (fid ? 'member' : 'beta'),
      real_name: real_name || null,
      ign: ign || null,
      notes: notes || null,
    };

    // If FID provided, fetch Farcaster profile and resolve wallet
    if (fid) {
      try {
        const fcUser = await getUserByFid(fid);
        if (fcUser) {
          userData.fid = fcUser.fid;
          userData.username = fcUser.username;
          userData.display_name = fcUser.display_name;
          userData.pfp_url = fcUser.pfp_url;
          userData.custody_address = fcUser.custody_address;
          userData.verified_addresses = fcUser.verified_addresses?.eth_addresses || [];
          userData.bio = fcUser.profile?.bio?.text || null;
          // Auto-resolve wallet from Farcaster if not provided
          if (!wallet) {
            wallet = (fcUser.custody_address || fcUser.verified_addresses?.eth_addresses?.[0] || '').toLowerCase();
          }
        }
      } catch {
        userData.fid = fid;
      }
    }

    // If still no wallet, use FID-based placeholder
    if (!wallet && fid) {
      wallet = `fid:${fid}`;
    }
    if (!wallet) {
      return NextResponse.json({ error: 'Could not resolve a wallet address' }, { status: 400 });
    }

    userData.primary_wallet = wallet;

    if (!fid && wallet && !wallet.startsWith('fid:')) {
      // Try to resolve Farcaster from wallet
      try {
        const fcUser = await getUserByAddress(wallet);
        if (fcUser) {
          userData.fid = fcUser.fid;
          userData.username = fcUser.username;
          userData.display_name = fcUser.display_name;
          userData.pfp_url = fcUser.pfp_url;
          userData.custody_address = fcUser.custody_address;
          userData.verified_addresses = fcUser.verified_addresses?.eth_addresses || [];
          userData.bio = fcUser.profile?.bio?.text || null;
          userData.role = 'member'; // Auto-upgrade if FC found
        }
      } catch {
        // No Farcaster — stays as beta
      }
    }

    // Set display_name fallback
    if (!userData.display_name) {
      userData.display_name = real_name || ign || wallet.slice(0, 6) + '...' + wallet.slice(-4);
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'User already exists' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ user: data });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

/**
 * PATCH — Update a user (edit profile, link FID, change role)
 */
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'User id is required' }, { status: 400 });
    }

    // If linking a new FID, fetch Farcaster profile
    if (updates.fid && typeof updates.fid === 'number') {
      try {
        const fcUser = await getUserByFid(updates.fid);
        if (fcUser) {
          updates.username = updates.username || fcUser.username;
          updates.display_name = updates.display_name || fcUser.display_name;
          updates.pfp_url = updates.pfp_url || fcUser.pfp_url;
          updates.custody_address = fcUser.custody_address;
          updates.verified_addresses = fcUser.verified_addresses?.eth_addresses || [];
          updates.bio = fcUser.profile?.bio?.text || null;
          // Auto-upgrade role when FID linked
          if (!updates.role) updates.role = 'member';
        }
      } catch {
        // Non-critical
      }
    }

    // If unlinking FID (set to null)
    if (updates.fid === null) {
      updates.role = updates.role || 'beta';
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'FID or wallet already linked to another user' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ user: data });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

/**
 * DELETE — Deactivate a user
 */
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'User id is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Deactivate user error:', error);
    return NextResponse.json({ error: 'Failed to deactivate user' }, { status: 500 });
  }
}
