/**
 * ZOE -> ZAO CRM write path (doc 772; direct-write refactor 2026-05-31).
 *
 * ZOE runs on the VPS with the Supabase service-role key (bot/src/supabase.ts
 * `db()`), so she writes CRM contacts/interactions STRAIGHT to Supabase instead
 * of POSTing to the app behind a shared bearer secret. This drops CRM_BOT_SECRET
 * + CRM_API_URL from the bot entirely and removes the dependency on the app
 * being reachable. The app's POST /api/crm/interactions still exists for the
 * admin browser form (iron-session auth); ZOE just no longer calls it.
 *
 * The two security guards from the app route are PORTED here so they hold on
 * this path too:
 *   - C-H1: ZOE may NEVER publish. is_public is dropped and every interaction
 *     is written `private`. Publishing stays an admin-only action in /crm.
 *   - C-M2: dedup is by exact name against the real `contacts` table (which has
 *     no slug column). An existing person is reused, never duplicated.
 *
 * 2026-07-22: retargeted from the non-existent crm_contacts/crm_interactions
 * tables to the real `contacts` (951 rows) + `contact_log` tables - the prior
 * writes silently failed the missing-table constraint.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { db } from '../supabase';
import type { CrmOp } from './types';

export interface CrmResult {
  op: CrmOp;
  status: 'logged' | 'skipped' | 'failed';
  contact_id?: string;
  error?: string;
}

/**
 * Map a CrmOp contact to the `contacts` table columns. `contacts` is the single
 * real CRM (951 rows, what zao-crm + the /crm page read) - NOT crm_contacts,
 * which does not exist in this Supabase. It has no slug and no handle columns, so
 * dedup is by name (see runCrmOps) and farcaster/x/github/telegram handles ride
 * in `tags` (fc:/x:/gh:/tg: prefixes) where they stay queryable.
 */
function toContactRow(c: Omit<CrmOp['contact'], 'is_public'>): Record<string, unknown> {
  const strip = (h: string): string => h.replace(/^@/, '');
  const tags: string[] = [];
  if (c.farcaster_handle) tags.push(`fc:${strip(c.farcaster_handle)}`);
  if (c.x_handle) tags.push(`x:${strip(c.x_handle)}`);
  if (c.github_handle) tags.push(`gh:${strip(c.github_handle)}`);
  if (c.telegram_handle) tags.push(`tg:${strip(c.telegram_handle)}`);
  return compact({
    name: c.name,
    role: c.role,
    company: c.org,
    where_met: c.how_we_met,
    email: c.email,
    origin: c.location,
    bio: c.public_summary,
    tags: tags.length > 0 ? tags : undefined,
    source: 'zoe',
    status: 'active',
  });
}

function compact<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

/**
 * Write each CRM op directly to Supabase. `client` is injectable for tests;
 * defaults to the bot's service-role client. Never throws — every op resolves
 * into a CrmResult so the caller can always summarize for Zaal.
 */
export async function runCrmOps(ops: CrmOp[], client?: SupabaseClient): Promise<CrmResult[]> {
  const results: CrmResult[] = [];
  if (ops.length === 0) return results;

  let supabase: SupabaseClient;
  try {
    supabase = client ?? db();
  } catch (err) {
    // Supabase not configured on this box — skip, never throw.
    for (const op of ops) results.push({ op, status: 'skipped', error: (err as Error).message });
    return results;
  }

  for (const op of ops) {
    try {
      // C-H1: ZOE may never publish — drop is_public entirely.
      const { is_public: _omitPublic, ...contactSafe } = op.contact;
      void _omitPublic;

      // Dedup by exact name: `contacts` has no slug column. If the person is
      // already in the CRM, reuse their row; otherwise insert a new one.
      const name = op.contact.name;
      const { data: found } = await supabase
        .from('contacts')
        .select('id')
        .eq('name', name)
        .limit(1)
        .maybeSingle();

      let contactId: string;
      if (found && (found as { id?: string }).id) {
        contactId = (found as { id: string }).id;
      } else {
        const { data: contact, error: contactErr } = await supabase
          .from('contacts')
          .insert(toContactRow(contactSafe))
          .select('id')
          .single();
        if (contactErr || !contact) {
          results.push({ op, status: 'failed', error: contactErr?.message ?? 'contact insert failed' });
          continue;
        }
        contactId = (contact as { id: string }).id;
      }

      // Interaction -> contact_log (the interactions table). C-H1: internal only,
      // never public. contact_log has no visibility column, so it is not exposed.
      const summary = [op.interaction.title, op.interaction.public_summary, op.interaction.private_notes]
        .filter(Boolean)
        .join(' - ');
      const { error: interactionErr } = await supabase.from('contact_log').insert(
        compact({
          project: 'zaodevz',
          contact: name,
          channel: op.interaction.type ?? 'note',
          summary: summary.length > 0 ? summary : undefined,
          logged_at: op.interaction.occurred_at,
        }),
      );

      if (interactionErr) {
        results.push({ op, status: 'failed', contact_id: contactId, error: interactionErr.message });
        continue;
      }
      results.push({ op, status: 'logged', contact_id: contactId });
    } catch (err) {
      results.push({ op, status: 'failed', error: (err as Error).message });
    }
  }
  return results;
}

/** One-line postscript for Zaal's DM summarizing CRM writes. */
export function summarizeCrmResults(results: CrmResult[]): string {
  if (results.length === 0) return '';
  const lines: string[] = [];
  for (const r of results) {
    const who = r.op.contact.name;
    if (r.status === 'logged') {
      lines.push(`Logged ${who} to CRM.`);
    } else if (r.status === 'skipped') {
      lines.push(`Could not log ${who} — CRM (Supabase) not configured on this box.`);
    } else {
      lines.push(`CRM write for ${who} failed: ${r.error ?? 'unknown error'}`);
    }
  }
  return lines.join('\n');
}
