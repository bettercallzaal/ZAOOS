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
 *   - C-M2: a name-only contact is INSERTed with a uniquified slug, never
 *     upserted onto a slug a different person already owns.
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

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/^@/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function deriveContactSlug(c: CrmOp['contact']): string {
  return slugify(c.farcaster_handle || c.x_handle || c.github_handle || c.name);
}

/** A handle uniquely identifies a person; a bare name does not (C-M2). */
function hasStableContactKey(c: CrmOp['contact']): boolean {
  return Boolean(c.farcaster_handle || c.x_handle || c.github_handle);
}

/** Pick a free slug for a name-only contact: john-smith, john-smith-2, … (C-M2). */
async function uniqueNameSlug(client: SupabaseClient, base: string): Promise<string> {
  const { data } = await client.from('crm_contacts').select('slug').like('slug', `${base}%`);
  const taken = new Set((data ?? []).map((r) => (r as { slug: string | null }).slug));
  if (!taken.has(base)) return base;
  for (let i = 2; i < 1000; i++) {
    const candidate = `${base}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
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

      const stableKey = hasStableContactKey(op.contact);
      const baseSlug = deriveContactSlug(op.contact);
      const slug = stableKey ? baseSlug : await uniqueNameSlug(supabase, baseSlug);
      const contactRow = compact({ ...contactSafe, slug });

      const contactQuery = stableKey
        ? supabase.from('crm_contacts').upsert(contactRow, { onConflict: 'slug' })
        : supabase.from('crm_contacts').insert(contactRow);

      const { data: contact, error: contactErr } = await contactQuery
        .select('id, slug')
        .single();

      if (contactErr || !contact) {
        results.push({ op, status: 'failed', error: contactErr?.message ?? 'contact upsert failed' });
        continue;
      }
      const contactId = (contact as { id: string }).id;

      const { error: interactionErr } = await supabase
        .from('crm_interactions')
        .insert(
          compact({
            contact_id: contactId,
            type: op.interaction.type ?? 'note',
            title: op.interaction.title,
            public_summary: op.interaction.public_summary,
            private_notes: op.interaction.private_notes,
            visibility: 'private', // C-H1: bot interactions are always private
            occurred_at: op.interaction.occurred_at,
            source: 'zoe',
            created_by: 'zoe',
          }),
        )
        .select('id')
        .single();

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
