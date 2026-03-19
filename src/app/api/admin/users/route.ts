import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getUserByFid, getUserByAddress, searchUsers } from '@/lib/farcaster/neynar';

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

  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '200', 10), 500);
  const offset = Math.max(parseInt(req.nextUrl.searchParams.get('offset') || '0', 10), 0);

  let query = supabaseAdmin
    .from('users')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (role) {
    query = query.eq('role', role);
  }

  if (search) {
    // Sanitize: escape Supabase filter metacharacters and cap length
    const safe = search.slice(0, 100).replace(/[%_,().]/g, '');
    if (safe) {
      query = query.or(`display_name.ilike.%${safe}%,username.ilike.%${safe}%,primary_wallet.ilike.%${safe}%,real_name.ilike.%${safe}%,ign.ilike.%${safe}%,ens_name.ilike.%${safe}%`);
    }
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }

  const users = data || [];

  return NextResponse.json({ users, total: count ?? users.length, limit, offset });
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
    const { primary_wallet, role, real_name, ign, notes } = body;
    let { fid } = body;
    const { username: usernameInput } = body;

    // Resolve username to FID if provided
    if (usernameInput && !fid) {
      try {
        const clean = usernameInput.replace(/^@/, '').trim();
        const searchData = await searchUsers(clean, 1);
        const match = (searchData.result?.users || []).find(
          (u: Record<string, unknown>) => (u.username as string)?.toLowerCase() === clean.toLowerCase()
        );
        if (match) {
          fid = match.fid as number;
        } else {
          // No exact match — try first result
          const first = searchData.result?.users?.[0];
          if (first) {
            fid = first.fid as number;
          } else {
            return NextResponse.json({ error: `No Farcaster user found for "${clean}"` }, { status: 404 });
          }
        }
      } catch {
        return NextResponse.json({ error: `Failed to look up username "${usernameInput}"` }, { status: 500 });
      }
    }

    if (!primary_wallet && !fid) {
      return NextResponse.json({ error: 'Wallet address, FID, or username is required' }, { status: 400 });
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
    const { id, assign_zid, ...rawUpdates } = body;

    if (!id) {
      return NextResponse.json({ error: 'User id is required' }, { status: 400 });
    }

    // Allowlist fields that admins can update — prevents arbitrary column injection
    const ALLOWED_FIELDS = new Set([
      'fid', 'username', 'display_name', 'pfp_url', 'bio',
      'primary_wallet', 'respect_wallet', 'role', 'is_active',
      'custody_address', 'verified_addresses',
    ]);
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rawUpdates)) {
      if (ALLOWED_FIELDS.has(key)) updates[key] = value;
    }

    // Admin-assigned ZID via sequence
    if (assign_zid) {
      const { error: zidErr } = await supabaseAdmin
        .rpc('assign_next_zid', { target_user_id: id });
      if (zidErr) {
        console.error('ZID assignment error:', zidErr);
        return NextResponse.json({ error: 'Failed to assign ZID' }, { status: 500 });
      }
      // Return updated user
      const { data: updatedUser } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      return NextResponse.json({ user: updatedUser });
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
