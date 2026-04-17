import { getSupabaseAdmin } from '@/lib/db/supabase';

export interface PublicMember {
  id: string;
  name: string;
  role: string;
  scope: string;
  bio: string;
  links: string;
  photo_url: string;
  slug: string;
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export async function getPublicMembers(): Promise<PublicMember[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('stock_team_members')
    .select('id, name, role, scope, bio, links, photo_url')
    .order('created_at');

  if (error || !data) return [];

  return data.map((m) => ({
    id: m.id,
    name: m.name,
    role: m.role || 'member',
    scope: m.scope || 'ops',
    bio: m.bio || '',
    links: m.links || '',
    photo_url: m.photo_url || '',
    slug: slugify(m.name),
  }));
}

export async function getMemberBySlug(slug: string): Promise<PublicMember | null> {
  const all = await getPublicMembers();
  return all.find((m) => m.slug === slug) || null;
}
