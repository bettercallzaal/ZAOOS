import { CommandContext, Context } from 'grammy';
import { db } from './supabase';
import type { TeamMember } from './auth';

interface OnePagerRow {
  id: string;
  slug: string;
  title: string;
  audience: string;
  purpose: string;
  body: string;
  status: 'draft' | 'review' | 'final' | 'sent' | 'archived';
  visibility: 'internal' | 'public';
  meeting_date: string | null;
  meeting_location: string | null;
  version: number;
  updated_at: string;
}

const STATUSES = ['draft', 'review', 'final', 'sent', 'archived'] as const;

async function listAll(): Promise<OnePagerRow[]> {
  const { data, error } = await db()
    .from('stock_onepagers')
    .select('id, slug, title, audience, purpose, body, status, visibility, meeting_date, meeting_location, version, updated_at')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as OnePagerRow[];
}

async function getBySlug(slug: string): Promise<OnePagerRow | null> {
  const { data, error } = await db()
    .from('stock_onepagers')
    .select('id, slug, title, audience, purpose, body, status, visibility, meeting_date, meeting_location, version, updated_at')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return (data as OnePagerRow | null) ?? null;
}

async function logActivity(
  onepager_id: string,
  member_id: string,
  type: 'created' | 'edited' | 'status_change' | 'note' | 'share' | 'review_comment',
  content: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  await db().from('stock_onepager_activity').insert({ onepager_id, member_id, type, content, metadata });
}

function formatList(rows: OnePagerRow[]): string {
  if (rows.length === 0) return 'No one-pagers yet. Create one via Claude /onepager skill or the dashboard.';
  const lines = ['One-pagers (most recent first):', ''];
  for (const r of rows) {
    lines.push(`/${r.slug}  [${r.status}]  v${r.version}`);
    lines.push(`  ${r.title}`);
    if (r.audience) lines.push(`  for: ${r.audience}`);
    lines.push('');
  }
  lines.push('Read one: /op <slug>');
  lines.push('Edit: /op <slug> status <draft|review|final|sent|archived>');
  lines.push('       /op <slug> note <text>');
  lines.push('       /op <slug> share <recipient>');
  lines.push('       /op <slug> append <text>');
  return lines.join('\n');
}

function formatOne(r: OnePagerRow): string {
  const lines = [
    `${r.title}  [${r.status}]  v${r.version}`,
    `slug: ${r.slug}`,
    `audience: ${r.audience}`,
    `purpose: ${r.purpose}`,
  ];
  if (r.meeting_date) lines.push(`meeting: ${r.meeting_date}${r.meeting_location ? ` · ${r.meeting_location}` : ''}`);
  lines.push(`visibility: ${r.visibility}`);
  lines.push(`updated: ${r.updated_at.slice(0, 10)}`);
  lines.push('');
  lines.push('--- body preview ---');
  const preview = r.body.slice(0, 600);
  lines.push(preview);
  if (r.body.length > 600) lines.push(`... (${r.body.length - 600} more chars)`);
  lines.push('');
  lines.push(`Full doc: https://zaoos.com/stock/onepagers/${r.slug}`);
  return lines.join('\n');
}

export async function cmdOp(ctx: CommandContext<Context>, member: TeamMember | null): Promise<void> {
  const raw = (ctx.match ?? '').trim();
  if (!raw) {
    try {
      const all = await listAll();
      const visible = member ? all : all.filter((r) => r.visibility === 'public');
      await ctx.reply(formatList(visible));
    } catch (err) {
      await ctx.reply(`Failed to load: ${err instanceof Error ? err.message : 'unknown'}`);
    }
    return;
  }

  const parts = raw.split(/\s+/);
  const slug = parts[0]?.replace(/^\//, '');
  const action = parts[1]?.toLowerCase();
  const rest = parts.slice(2).join(' ');

  if (!slug) {
    await ctx.reply('Usage: /op <slug>  or  /op <slug> <action> <args>');
    return;
  }

  let pager: OnePagerRow | null;
  try {
    pager = await getBySlug(slug);
  } catch (err) {
    await ctx.reply(`Failed to look up "${slug}": ${err instanceof Error ? err.message : 'unknown'}`);
    return;
  }
  if (!pager) {
    await ctx.reply(`No one-pager with slug "${slug}". Try /op to list all.`);
    return;
  }

  // Read mode
  if (!action) {
    await ctx.reply(formatOne(pager));
    return;
  }

  // Mutations require linked member
  if (!member) {
    await ctx.reply(`Edit actions need a linked Telegram account. Ask Zaal to /link @${ctx.from?.username ?? 'you'} <name>.`);
    return;
  }

  try {
    if (action === 'status') {
      const target = rest.trim().toLowerCase() as OnePagerRow['status'];
      if (!STATUSES.includes(target)) {
        await ctx.reply(`Status must be one of: ${STATUSES.join(' | ')}`);
        return;
      }
      const previous = pager.status;
      const { error } = await db()
        .from('stock_onepagers')
        .update({ status: target, last_edited_by: member.id })
        .eq('id', pager.id);
      if (error) throw error;
      await logActivity(pager.id, member.id, 'status_change', `${previous} -> ${target}`, {
        from: previous,
        to: target,
      });
      await ctx.reply(`Status: ${previous} -> ${target} on "${pager.title}"`);
      return;
    }

    if (action === 'note') {
      const text = rest.trim();
      if (!text) {
        await ctx.reply('Usage: /op <slug> note <text>');
        return;
      }
      await logActivity(pager.id, member.id, 'note', text);
      await ctx.reply(`Note logged on "${pager.title}".`);
      return;
    }

    if (action === 'share') {
      const recipient = rest.trim();
      if (!recipient) {
        await ctx.reply('Usage: /op <slug> share <recipient>');
        return;
      }
      await logActivity(pager.id, member.id, 'share', `Shared to ${recipient}`, { recipient });
      await ctx.reply(`Logged share to ${recipient} on "${pager.title}".`);
      return;
    }

    if (action === 'append') {
      const text = rest.trim();
      if (!text) {
        await ctx.reply('Usage: /op <slug> append <text>');
        return;
      }
      const sep = pager.body.endsWith('\n') ? '\n' : '\n\n';
      const newBody = `${pager.body}${sep}${text}\n`;
      const { error } = await db()
        .from('stock_onepagers')
        .update({ body: newBody, version: pager.version + 1, last_edited_by: member.id })
        .eq('id', pager.id);
      if (error) throw error;
      await logActivity(pager.id, member.id, 'edited', `Appended ${text.length} chars`);
      await ctx.reply(`Appended on "${pager.title}". v${pager.version + 1}.`);
      return;
    }

    await ctx.reply(`Unknown action "${action}". Try: status | note | share | append`);
  } catch (err) {
    await ctx.reply(`Failed: ${err instanceof Error ? err.message : 'unknown'}`);
  }
}
