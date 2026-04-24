import { scryptSync, timingSafeEqual } from 'crypto';
import { db } from './supabase';

export interface TeamMember {
  id: string;
  name: string;
  scope: string;
  role: string;
  telegram_id: number | null;
}

function verify(code: string, stored: string): boolean {
  if (!stored) return false;
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const actual = scryptSync(code, salt, 64);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export async function findMemberByTelegramId(telegramId: number): Promise<TeamMember | null> {
  const { data } = await db()
    .from('stock_team_members')
    .select('id, name, scope, role, telegram_id, active')
    .eq('telegram_id', telegramId)
    .neq('active', false)
    .maybeSingle();
  if (!data) return null;
  return data as TeamMember;
}

export async function linkTelegramId(
  code: string,
  telegramId: number,
): Promise<{ ok: true; member: TeamMember } | { ok: false; reason: string }> {
  const normalized = code.trim().toUpperCase();
  if (normalized.length !== 4) return { ok: false, reason: 'Code must be 4 characters' };

  const { data: members, error } = await db()
    .from('stock_team_members')
    .select('id, name, scope, role, telegram_id, password_hash, active')
    .neq('active', false);

  if (error || !members) return { ok: false, reason: 'Could not load roster' };

  const match = members.find((m) => m.password_hash && verify(normalized, m.password_hash));
  if (!match) return { ok: false, reason: 'Invalid code' };

  // If another Telegram user already claimed this member, block.
  if (match.telegram_id && match.telegram_id !== telegramId) {
    return { ok: false, reason: 'This code is already linked to another Telegram account' };
  }

  if (match.telegram_id !== telegramId) {
    const { error: updateErr } = await db()
      .from('stock_team_members')
      .update({ telegram_id: telegramId })
      .eq('id', match.id);
    if (updateErr) return { ok: false, reason: `Link failed: ${updateErr.message}` };
  }

  return {
    ok: true,
    member: {
      id: match.id,
      name: match.name,
      scope: match.scope,
      role: match.role,
      telegram_id: telegramId,
    },
  };
}
