import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { encryptPostingKey, getHiveClient } from '@/lib/publish/hive';

const connectSchema = z.object({
  username: z.string().min(1).max(16),
  postingKey: z.string().min(1),
});

/**
 * POST — Connect a Hive account to the current user.
 *
 * Verifies the account exists on-chain, encrypts the posting key,
 * and stores both columns in the users table.
 * The posting key is NEVER returned to the client after storage.
 */
export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = connectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { username, postingKey } = parsed.data;

  try {
    // Verify the Hive account exists on-chain
    const client = getHiveClient();
    const accounts = await client.database.getAccounts([username]);

    if (!accounts || accounts.length === 0) {
      return NextResponse.json(
        { error: 'Hive account not found. Please check the username.' },
        { status: 400 },
      );
    }

    // Encrypt the posting key before storage
    const encrypted = encryptPostingKey(postingKey);

    // Store credentials
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        hive_username: username,
        hive_posting_key_encrypted: encrypted,
      })
      .eq('fid', session.fid);

    if (updateError) {
      console.error('[platforms/hive] Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to save Hive credentials' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      username,
    });
  } catch (err) {
    console.error('[platforms/hive] Connect error:', err);
    return NextResponse.json(
      { error: 'Failed to connect Hive account' },
      { status: 500 },
    );
  }
}

/**
 * DELETE — Disconnect Hive account from the current user.
 *
 * Nulls out hive_username and hive_posting_key_encrypted.
 */
export async function DELETE() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        hive_username: null,
        hive_posting_key_encrypted: null,
      })
      .eq('fid', session.fid);

    if (updateError) {
      console.error('[platforms/hive] Delete error:', updateError);
      return NextResponse.json(
        { error: 'Failed to disconnect Hive account' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[platforms/hive] Disconnect error:', err);
    return NextResponse.json(
      { error: 'Failed to disconnect Hive account' },
      { status: 500 },
    );
  }
}
