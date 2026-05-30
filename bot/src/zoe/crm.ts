/**
 * ZOE -> ZAO CRM write path (doc 772).
 *
 * When ZOE emits a crm_op in her reply, this module POSTs it to the ZAOOS app
 * route `POST /api/crm/interactions`, authenticated with a Bearer shared secret
 * (CRM_BOT_SECRET). The app upserts the contact (by deterministic slug) and
 * logs the interaction. Fire-and-forget from ZOE's side - a one-line summary is
 * appended to her DM reply.
 *
 * Env:
 *   CRM_API_URL    - base URL of the app (default https://zaoos.com)
 *   CRM_BOT_SECRET - shared bearer secret; must match the app's ENV.CRM_BOT_SECRET
 *
 * If CRM_BOT_SECRET is unset, ops are skipped (logged), never throws.
 */

import type { CrmOp } from './types';

export interface CrmResult {
  op: CrmOp;
  status: 'logged' | 'skipped-no-secret' | 'failed';
  contact_id?: string;
  error?: string;
}

const CRM_API_URL = process.env.CRM_API_URL ?? 'https://zaoos.com';

export async function runCrmOps(ops: CrmOp[]): Promise<CrmResult[]> {
  if (ops.length === 0) return [];
  const secret = process.env.CRM_BOT_SECRET;
  const results: CrmResult[] = [];

  for (const op of ops) {
    if (!secret) {
      results.push({ op, status: 'skipped-no-secret' });
      continue;
    }
    try {
      const res = await fetch(`${CRM_API_URL}/api/crm/interactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify({ contact: op.contact, interaction: op.interaction }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        results.push({
          op,
          status: 'failed',
          error: body.error ?? `HTTP ${res.status}`,
        });
        continue;
      }
      const data = (await res.json().catch(() => ({}))) as { contact_id?: string };
      results.push({ op, status: 'logged', contact_id: data.contact_id });
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
      const pub = r.op.contact.is_public ? ' (public on /network)' : '';
      lines.push(`Logged ${who} to CRM${pub}.`);
    } else if (r.status === 'skipped-no-secret') {
      lines.push(`Could not log ${who} - CRM_BOT_SECRET not set on this box.`);
    } else {
      lines.push(`CRM write for ${who} failed: ${r.error ?? 'unknown error'}`);
    }
  }
  return lines.join('\n');
}
