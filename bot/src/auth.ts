import { db } from './supabase';

export interface TeamMember {
  id: string;
  name: string;
  scope: string;
  role: string;
  telegram_id: number | null;
  telegram_username: string | null;
}

const SELECT = 'id, name, scope, role, telegram_id, telegram_username, active';

function normalizeUsername(u: string | undefined | null): string | null {
  if (!u) return null;
  return u.trim().replace(/^@+/, '').toLowerCase();
}

export async function findMemberByTelegramId(telegramId: number): Promise<TeamMember | null> {
  const { data } = await db()
    .from('stock_team_members')
    .select(SELECT)
    .eq('telegram_id', telegramId)
    .neq('active', false)
    .maybeSingle();
  if (!data) return null;
  return data as TeamMember;
}

export async function findMemberByUsername(username: string): Promise<TeamMember | null> {
  const n = normalizeUsername(username);
  if (!n) return null;
  const { data } = await db()
    .from('stock_team_members')
    .select(SELECT)
    .eq('telegram_username', n)
    .neq('active', false)
    .maybeSingle();
  if (!data) return null;
  return data as TeamMember;
}

/**
 * Resolve a Telegram user -> team member via cascade:
 *   1. match on telegram_id (fast path, already linked)
 *   2. match on telegram_username (auto-links telegram_id on hit)
 *   3. null (not on roster)
 */
export async function resolveMember(
  telegramId: number | undefined,
  telegramUsername: string | undefined,
): Promise<TeamMember | null> {
  if (!telegramId) return null;

  const byId = await findMemberByTelegramId(telegramId);
  if (byId) return byId;

  const byUsername = await findMemberByUsername(telegramUsername ?? '');
  if (!byUsername) return null;

  // auto-link telegram_id so next lookup is the fast path
  if (byUsername.telegram_id !== telegramId) {
    await db()
      .from('stock_team_members')
      .update({ telegram_id: telegramId })
      .eq('id', byUsername.id);
  }
  return { ...byUsername, telegram_id: telegramId };
}

/**
 * Admin: manually pair a telegram @username with a team member by name.
 * Matches name case-insensitively. Returns the updated member or an error.
 */
export async function linkUsernameToMember(
  telegramUsername: string,
  memberName: string,
): Promise<{ ok: true; member: TeamMember } | { ok: false; reason: string }> {
  const username = normalizeUsername(telegramUsername);
  if (!username) return { ok: false, reason: 'Username required' };
  if (!memberName.trim()) return { ok: false, reason: 'Member name required' };

  const trimmed = memberName.trim();

  // 1. Exact (case-insensitive) match first
  const { data: exact, error } = await db()
    .from('stock_team_members')
    .select(SELECT)
    .ilike('name', trimmed)
    .neq('active', false);
  if (error) return { ok: false, reason: `DB error: ${error.message}` };

  let candidates = (exact ?? []) as TeamMember[];

  // 2. Substring fallback ("thy rev" -> "Thy Revolution")
  if (candidates.length === 0) {
    const { data: subs } = await db()
      .from('stock_team_members')
      .select(SELECT)
      .ilike('name', `%${trimmed}%`)
      .neq('active', false);
    candidates = (subs ?? []) as TeamMember[];
  }

  // 3. First-token match ("thy" -> "Thy Revolution") last resort
  if (candidates.length === 0) {
    const firstToken = trimmed.split(/\s+/)[0];
    if (firstToken && firstToken.length >= 3) {
      const { data: tok } = await db()
        .from('stock_team_members')
        .select(SELECT)
        .ilike('name', `${firstToken}%`)
        .neq('active', false);
      candidates = (tok ?? []) as TeamMember[];
    }
  }

  if (candidates.length === 0) return { ok: false, reason: `No active member named "${memberName}"` };
  if (candidates.length > 1) {
    const names = candidates.map((c) => c.name).join(', ');
    return { ok: false, reason: `Multiple matches for "${memberName}": ${names}. Use full name.` };
  }

  const target = candidates[0];

  const { error: updateErr } = await db()
    .from('stock_team_members')
    .update({ telegram_username: username })
    .eq('id', target.id);
  if (updateErr) return { ok: false, reason: `Link failed: ${updateErr.message}` };

  return { ok: true, member: { ...(target as TeamMember), telegram_username: username } };
}

export async function unlinkUsername(
  telegramUsername: string,
): Promise<{ ok: true; name: string } | { ok: false; reason: string }> {
  const username = normalizeUsername(telegramUsername);
  if (!username) return { ok: false, reason: 'Username required' };

  const { data, error } = await db()
    .from('stock_team_members')
    .select(SELECT)
    .eq('telegram_username', username)
    .maybeSingle();
  if (error) return { ok: false, reason: `DB error: ${error.message}` };
  if (!data) return { ok: false, reason: `@${username} not linked to anyone` };

  const { error: updateErr } = await db()
    .from('stock_team_members')
    .update({ telegram_username: null, telegram_id: null })
    .eq('id', data.id);
  if (updateErr) return { ok: false, reason: `Unlink failed: ${updateErr.message}` };

  return { ok: true, name: (data as TeamMember).name };
}
