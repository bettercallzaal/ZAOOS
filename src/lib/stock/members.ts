import { getSupabaseAdmin } from '@/lib/db/supabase';

export interface StockCounts {
  volunteers: number;
  rsvps: number;
  sponsorsCommitted: number;
  sponsorsCommittedAmount: number;
}

export async function getStockCounts(): Promise<StockCounts> {
  const supabase = getSupabaseAdmin();

  const [vRes, rRes, sRes] = await Promise.allSettled([
    supabase.from('stock_volunteers').select('id', { count: 'exact', head: true }),
    supabase
      .from('event_rsvps')
      .select('id', { count: 'exact', head: true })
      .eq('event_slug', 'zao-stock-2026'),
    supabase
      .from('stock_sponsors')
      .select('amount_committed, status')
      .in('status', ['committed', 'paid']),
  ]);

  const volunteers = vRes.status === 'fulfilled' ? vRes.value.count || 0 : 0;
  const rsvps = rRes.status === 'fulfilled' ? rRes.value.count || 0 : 0;

  let sponsorsCommitted = 0;
  let sponsorsCommittedAmount = 0;
  if (sRes.status === 'fulfilled' && sRes.value.data) {
    sponsorsCommitted = sRes.value.data.length;
    sponsorsCommittedAmount = sRes.value.data.reduce(
      (sum, s) => sum + Number(s.amount_committed || 0),
      0,
    );
  }

  return { volunteers, rsvps, sponsorsCommitted, sponsorsCommittedAmount };
}

export interface PublicMember {
  id: string;
  name: string;
  role: string;
  scope: string;
  secondary_scope: string;
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

export interface ParsedLink {
  href: string;
  display: string;
}

export function parseLinks(raw: string): ParsedLink[] {
  return raw
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((token) => {
      const hasProtocol = /^https?:\/\//i.test(token);
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(token);
      const isHandle = token.startsWith('@');
      if (isEmail) {
        return { href: `mailto:${token}`, display: token };
      }
      if (isHandle) {
        return { href: `https://x.com/${token.slice(1)}`, display: token };
      }
      const href = hasProtocol ? token : `https://${token}`;
      return { href, display: token };
    });
}

export async function getPublicMembers(): Promise<PublicMember[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('stock_team_members')
    .select('id, name, role, scope, secondary_scope, bio, links, photo_url, active')
    .neq('active', false)
    .order('created_at');

  if (error || !data) return [];

  return data.map((m) => ({
    id: m.id,
    name: m.name,
    role: m.role || 'member',
    scope: m.scope || 'ops',
    secondary_scope: m.secondary_scope || '',
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
