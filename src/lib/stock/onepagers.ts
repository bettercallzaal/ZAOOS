import { getSupabaseAdmin } from '@/lib/db/supabase';

export type OnePagerStatus = 'draft' | 'review' | 'final' | 'sent' | 'archived';
export type OnePagerVisibility = 'internal' | 'public';
export type OnePagerActivityType =
  | 'created'
  | 'edited'
  | 'status_change'
  | 'note'
  | 'share'
  | 'review_comment';

export interface OnePagerMeta {
  id: string;
  slug: string;
  title: string;
  audience: string;
  purpose: string;
  status: OnePagerStatus;
  visibility: OnePagerVisibility;
  meeting_date: string | null;
  meeting_location: string | null;
  authors: string | null;
  reviewers: string | null;
  version: number;
  last_edited_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface OnePager extends OnePagerMeta {
  body: string;
}

export interface OnePagerActivity {
  id: string;
  onepager_id: string;
  member_id: string | null;
  member_name: string | null;
  type: OnePagerActivityType;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

const META_COLUMNS =
  'id, slug, title, audience, purpose, status, visibility, meeting_date, meeting_location, authors, reviewers, version, last_edited_by, created_at, updated_at';

export async function listOnePagers(): Promise<OnePagerMeta[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('stock_onepagers')
    .select(META_COLUMNS)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as OnePagerMeta[];
}

export async function getOnePager(slug: string): Promise<OnePager | null> {
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(slug)) return null;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('stock_onepagers')
    .select(`${META_COLUMNS}, body`)
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return (data as OnePager | null) ?? null;
}

export interface OnePagerCreateInput {
  slug: string;
  title: string;
  audience?: string;
  purpose?: string;
  body?: string;
  status?: OnePagerStatus;
  visibility?: OnePagerVisibility;
  meeting_date?: string | null;
  meeting_location?: string | null;
  authors?: string | null;
  reviewers?: string | null;
  last_edited_by?: string | null;
}

export async function createOnePager(input: OnePagerCreateInput): Promise<OnePager> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('stock_onepagers')
    .insert({
      slug: input.slug,
      title: input.title,
      audience: input.audience ?? '',
      purpose: input.purpose ?? '',
      body: input.body ?? '',
      status: input.status ?? 'draft',
      visibility: input.visibility ?? 'internal',
      meeting_date: input.meeting_date ?? null,
      meeting_location: input.meeting_location ?? null,
      authors: input.authors ?? null,
      reviewers: input.reviewers ?? null,
      last_edited_by: input.last_edited_by ?? null,
      version: 1,
    })
    .select(`${META_COLUMNS}, body`)
    .single();
  if (error) throw error;
  await logActivity(data.id as string, input.last_edited_by ?? null, 'created', `Created "${input.title}"`);
  return data as OnePager;
}

export interface OnePagerUpdateInput {
  title?: string;
  audience?: string;
  purpose?: string;
  body?: string;
  status?: OnePagerStatus;
  visibility?: OnePagerVisibility;
  meeting_date?: string | null;
  meeting_location?: string | null;
  authors?: string | null;
  reviewers?: string | null;
  bumpVersion?: boolean;
  last_edited_by?: string | null;
}

export async function updateOnePager(slug: string, patch: OnePagerUpdateInput): Promise<OnePager | null> {
  const current = await getOnePager(slug);
  if (!current) return null;

  const updates: Record<string, unknown> = {};
  if (patch.title !== undefined) updates.title = patch.title;
  if (patch.audience !== undefined) updates.audience = patch.audience;
  if (patch.purpose !== undefined) updates.purpose = patch.purpose;
  if (patch.body !== undefined) updates.body = patch.body;
  if (patch.status !== undefined) updates.status = patch.status;
  if (patch.visibility !== undefined) updates.visibility = patch.visibility;
  if (patch.meeting_date !== undefined) updates.meeting_date = patch.meeting_date;
  if (patch.meeting_location !== undefined) updates.meeting_location = patch.meeting_location;
  if (patch.authors !== undefined) updates.authors = patch.authors;
  if (patch.reviewers !== undefined) updates.reviewers = patch.reviewers;
  if (patch.last_edited_by !== undefined) updates.last_edited_by = patch.last_edited_by;
  if (patch.bumpVersion) updates.version = current.version + 1;

  if (Object.keys(updates).length === 0) return current;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('stock_onepagers')
    .update(updates)
    .eq('id', current.id)
    .select(`${META_COLUMNS}, body`)
    .single();
  if (error) throw error;

  if (patch.status !== undefined && patch.status !== current.status) {
    await logActivity(
      current.id,
      patch.last_edited_by ?? null,
      'status_change',
      `${current.status} -> ${patch.status}`,
      { from: current.status, to: patch.status },
    );
  } else if (patch.body !== undefined && patch.body !== current.body) {
    await logActivity(current.id, patch.last_edited_by ?? null, 'edited', 'Body updated');
  }
  return data as OnePager;
}

export async function appendBodySection(
  slug: string,
  appendText: string,
  editedBy: string | null,
): Promise<OnePager | null> {
  const current = await getOnePager(slug);
  if (!current) return null;
  const trimmed = appendText.trim();
  if (!trimmed) return current;
  const sep = current.body.endsWith('\n') ? '\n' : '\n\n';
  const newBody = `${current.body}${sep}${trimmed}\n`;
  return updateOnePager(slug, { body: newBody, bumpVersion: true, last_edited_by: editedBy });
}

export async function appendActivityNote(
  slug: string,
  note: string,
  type: OnePagerActivityType,
  memberId: string | null,
  metadata: Record<string, unknown> = {},
): Promise<OnePagerActivity | null> {
  const current = await getOnePager(slug);
  if (!current) return null;
  return logActivity(current.id, memberId, type, note, metadata);
}

export async function listActivity(slug: string, limit = 50): Promise<OnePagerActivity[]> {
  const current = await getOnePager(slug);
  if (!current) return [];
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('stock_onepager_activity')
    .select('id, onepager_id, member_id, type, content, metadata, created_at, stock_team_members:member_id (name)')
    .eq('onepager_id', current.id)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  type Row = {
    id: string;
    onepager_id: string;
    member_id: string | null;
    type: OnePagerActivityType;
    content: string;
    metadata: Record<string, unknown> | null;
    created_at: string;
    stock_team_members: { name: string } | { name: string }[] | null;
  };
  return ((data ?? []) as unknown as Row[]).map((r) => {
    const tm = Array.isArray(r.stock_team_members) ? r.stock_team_members[0] : r.stock_team_members;
    return {
      id: r.id,
      onepager_id: r.onepager_id,
      member_id: r.member_id,
      member_name: tm?.name ?? null,
      type: r.type,
      content: r.content,
      metadata: r.metadata ?? {},
      created_at: r.created_at,
    };
  });
}

async function logActivity(
  onepagerId: string,
  memberId: string | null,
  type: OnePagerActivityType,
  content: string,
  metadata: Record<string, unknown> = {},
): Promise<OnePagerActivity | null> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('stock_onepager_activity')
      .insert({ onepager_id: onepagerId, member_id: memberId, type, content, metadata })
      .select('id, onepager_id, member_id, type, content, metadata, created_at')
      .single();
    if (error) return null;
    return { ...(data as Omit<OnePagerActivity, 'member_name'>), member_name: null };
  } catch {
    return null;
  }
}

export function slugify(text: string, maxLen = 40): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLen);
}
