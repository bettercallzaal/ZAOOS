/**
 * The member directory: Respect holders who have signed in, so they can find
 * each other. Not the authority on membership - the on-chain check is.
 * Table: supabase/migrations/0001_members_seen.sql. Server-side only.
 */

import { db } from '@/lib/db';

export interface DirectoryMember {
  fid: number;
  username: string | null;
  display_name: string | null;
  pfp_url: string | null;
  xmtp_address: string | null;
  last_login_at: string | null;
}

const COLUMNS = 'fid, username, display_name, pfp_url, xmtp_address, last_login_at';

export async function recordSignIn(member: {
  fid: number;
  username: string | null;
  displayName: string | null;
  pfpUrl: string | null;
}): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await db().from('members_seen').upsert(
    {
      fid: member.fid,
      username: member.username,
      display_name: member.displayName,
      pfp_url: member.pfpUrl,
      respect_checked_at: now,
      last_login_at: now,
    },
    { onConflict: 'fid' },
  );
  if (error) throw new Error(`members_seen upsert failed: ${error.message}`);
}

/** Thrown when another member already registered this XMTP address. */
export class XmtpAddressTakenError extends Error {}

export async function setXmtpAddress(fid: number, xmtpAddress: string): Promise<void> {
  const { error } = await db()
    .from('members_seen')
    .update({ xmtp_address: xmtpAddress.toLowerCase() })
    .eq('fid', fid);
  // 23505 = unique_violation on members_seen_xmtp_address_key (migration 0002).
  if (error?.code === '23505') throw new XmtpAddressTakenError('xmtp address already registered');
  if (error) throw new Error(`members_seen update failed: ${error.message}`);
}

export async function listMembers(limit = 500): Promise<DirectoryMember[]> {
  const { data, error } = await db()
    .from('members_seen')
    .select(COLUMNS)
    .order('username', { ascending: true })
    .limit(limit);
  if (error) throw new Error(`members_seen list failed: ${error.message}`);
  return (data ?? []) as DirectoryMember[];
}

export async function searchMembers(q: string, limit = 10): Promise<DirectoryMember[]> {
  // The term goes inside a PostgREST `or()` filter, where commas, dots and
  // parentheses are syntax. Keep only characters a username can contain.
  const term = q.replace(/[^a-zA-Z0-9-]/g, '');
  if (!term) return [];
  const pattern = `*${term}*`;
  const { data, error } = await db()
    .from('members_seen')
    .select(COLUMNS)
    .or(`username.ilike.${pattern},display_name.ilike.${pattern}`)
    .limit(limit);
  if (error) throw new Error(`members_seen search failed: ${error.message}`);
  return (data ?? []) as DirectoryMember[];
}

export async function getMember(fid: number): Promise<DirectoryMember | null> {
  const { data, error } = await db().from('members_seen').select(COLUMNS).eq('fid', fid).maybeSingle();
  if (error) throw new Error(`members_seen get failed: ${error.message}`);
  return (data as DirectoryMember | null) ?? null;
}
