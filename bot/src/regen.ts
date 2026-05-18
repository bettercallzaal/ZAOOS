// /regen - generate a new 4-character dashboard login code
//
// Two surfaces:
//   - Self-serve (any team member): /regen in DM only, mints + writes own code,
//     replies privately with plaintext.
//   - Admin override: /regen <Name>, regen anyone, DMs target if linked, falls
//     back to replying to the admin so they can relay.
//
// Why this exists:
//   - Codes are scrypt-hashed in DB; if a member loses theirs, only a fresh
//     mint can restore login. The legacy path was: SQL UPDATE pasted into
//     Supabase by Zaal. This automates it via Telegram so Zaal isn't a
//     bottleneck and team members can self-service.
//   - Two tables in the same Supabase project hold member rows:
//       team_members        - what the dashboard login route reads
//       team_members  - what the bot's auth + roster commands read
//     Out-of-band sync exists between them (name as the join key). /regen
//     writes the new password_hash to BOTH so login + roster stay coherent.
//
// Safety:
//   - DM-only for self-regen (codes leak risk in groups)
//   - Daily cap (REGEN_DAILY_PER_MEMBER, default 1/day) prevents abuse
//   - Admin override checks BOT_ADMIN_TELEGRAM_IDS env (same gate as /fix)
//   - All regens log to activity_log for audit

import type { Context } from 'grammy';
import { scryptSync, randomBytes } from 'node:crypto';
import { db } from './supabase';
import { logBotActivity } from './activity';
import {
  findMemberByTelegramId,
  findMemberByUsername,
  type TeamMember,
} from './auth';

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateCode(): string {
  let out = '';
  for (let i = 0; i < 4; i++) out += ALPHABET[randomBytes(1)[0] % ALPHABET.length];
  return out;
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function isAdmin(ctx: Context): boolean {
  const adminIds = (process.env.BOT_ADMIN_TELEGRAM_IDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const fromId = ctx.from?.id;
  if (!fromId) return false;
  return adminIds.includes(String(fromId));
}

async function countRegensForMemberToday(memberId: string): Promise<number> {
  const todayUtcStart = new Date();
  todayUtcStart.setUTCHours(0, 0, 0, 0);
  const { count, error } = await db()
    .from('activity_log')
    .select('id', { count: 'exact', head: true })
    .eq('actor_id', memberId)
    .eq('action', 'code_regen')
    .gte('created_at', todayUtcStart.toISOString());
  if (error) {
    console.error('[regen] count query failed', error.message);
    return 0; // fail-open; daily cap is a courtesy not a security boundary
  }
  return count ?? 0;
}

/**
 * Mint a new code for `member`, write to both team_members (dashboard login)
 * and team_members (bot roster), log the activity.
 *
 * Returns the plaintext code so the caller can DM it to the right person.
 * NEVER write the plaintext anywhere persistent - only the salt:hash.
 */
async function mintAndWrite(member: TeamMember): Promise<{ ok: true; code: string } | { ok: false; reply: string }> {
  const code = generateCode();
  const passwordHash = hashPassword(code);

  // Dashboard login table (read by /api/team/login in zaostock). Match by
  // name since team_members and team_members share name as join key.
  const dash = await db()
    .from('team_members')
    .update({ password_hash: passwordHash, active: true })
    .eq('name', member.name);

  // Bot roster table - keep the hash in sync so any future bot reader sees
  // the same value. ID match is exact for this table (we resolved from it).
  const bot = await db()
    .from('team_members')
    .update({ password_hash: passwordHash })
    .eq('id', member.id);

  if (dash.error && bot.error) {
    return { ok: false, reply: `Could not write to either table. dashboard=${dash.error.message}. bot=${bot.error.message}` };
  }
  if (dash.error) {
    // Bot table got it but dashboard didn't - login won't work. Surface loudly.
    return {
      ok: false,
      reply: `Wrote to bot roster but dashboard update failed: ${dash.error.message}. Login won't change. Ping Zaal to fix the team_members row by name='${member.name}'.`,
    };
  }
  // bot.error alone is fine - dashboard is the user-visible one.
  if (bot.error) {
    console.error(`[regen] team_members update warning: ${bot.error.message}`);
  }

  await logBotActivity({
    actorId: member.id,
    entityType: 'member',
    entityId: member.id,
    action: 'code_regen',
    newValue: 'mint',
  });

  return { ok: true, code };
}

/**
 * /regen self-serve. Open to any registered team member, DM only.
 */
export async function cmdRegenSelf(ctx: Context, member: TeamMember | null): Promise<void> {
  if (!member) {
    await ctx.reply('I only regen codes for registered team. Run /whoami to confirm, or DM Zaal to get added.');
    return;
  }

  const chatType = ctx.chat?.type;
  if (chatType !== 'private') {
    await ctx.reply('DM me directly for /regen - I never paste a login code into a group. Open a DM and try again.');
    return;
  }

  const dailyCap = Number(process.env.REGEN_DAILY_PER_MEMBER ?? '1');
  const usedToday = await countRegensForMemberToday(member.id);
  if (usedToday >= dailyCap) {
    await ctx.reply(
      `You already regenerated today (${usedToday}/${dailyCap}). Resets at UTC midnight. Ping Zaal if you've genuinely lost it twice.`,
    );
    return;
  }

  const result = await mintAndWrite(member);
  if (!result.ok) {
    await ctx.reply(result.reply);
    return;
  }

  await ctx.reply(
    [
      `New code: ${result.code}`,
      '',
      `Use it at https://zaostock.com/team to log into the dashboard.`,
      `Case-insensitive. (${usedToday + 1}/${dailyCap} regens today.)`,
    ].join('\n'),
  );
}

/**
 * /regen <Name> admin override. Mints a fresh code for a different team member
 * and either DMs it to them (if their telegram_id is linked) or hands it back
 * to the admin to relay.
 */
export async function cmdRegenForName(ctx: Context, callerMember: TeamMember | null): Promise<void> {
  if (!isAdmin(ctx)) {
    await ctx.reply('Admin-only when targeting someone else. Use /regen with no argument to regen your own code.');
    return;
  }

  const text = (ctx.message?.text ?? '').replace(/^\/regen(@\w+)?\s*/, '').trim();
  if (!text) {
    // Caller wants their own code, which is the self-serve path. Route there.
    await cmdRegenSelf(ctx, callerMember);
    return;
  }

  // Find target by name. Try normalized lookups against team_members.
  const { data: target } = await db()
    .from('team_members')
    .select('id, name, scope, role, telegram_id, telegram_username, active')
    .ilike('name', text)
    .neq('active', false)
    .maybeSingle();

  if (!target) {
    await ctx.reply(`Couldn't find a team member matching "${text}". Try the exact name from the roster.`);
    return;
  }

  const result = await mintAndWrite(target as TeamMember);
  if (!result.ok) {
    await ctx.reply(result.reply);
    return;
  }

  // Try to DM the target privately if their telegram_id is linked.
  const targetTgId = (target as TeamMember).telegram_id;
  if (targetTgId) {
    try {
      await ctx.api.sendMessage(
        targetTgId,
        [
          `Hermes here - your dashboard code was reset by admin.`,
          '',
          `New code: ${result.code}`,
          `Use it at https://zaostock.com/team`,
        ].join('\n'),
      );
      await ctx.reply(`Reset done. New code DM'd to ${target.name} privately. Activity logged.`);
      return;
    } catch (err) {
      // Fall through to hand the code to the admin if the DM bounces.
      console.error(`[regen] DM to target ${target.name} failed`, err);
    }
  }

  await ctx.reply(
    [
      `Reset done for ${target.name}.`,
      `Their telegram is not linked (or DM blocked), so I can't deliver privately.`,
      `Relay this to them yourself: ${result.code}`,
    ].join('\n'),
  );
}
