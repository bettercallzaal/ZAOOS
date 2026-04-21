import { getSupabaseAdmin } from '@/lib/db/supabase';
import { randomBytes } from 'crypto';

export interface PublicArtist {
  id: string;
  name: string;
  slug: string;
  genre: string;
  city: string;
  status: 'wishlist' | 'contacted' | 'interested' | 'confirmed' | 'declined' | 'travel_booked';
  socials: string;
  bio: string;
  photo_url: string;
  logo_url: string;
  social_post_url: string;
  cypher_interested: boolean;
  cypher_role: string;
  points_earned: number;
  volunteer_eligible: boolean;
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function generateClaimToken(): string {
  return randomBytes(8).toString('hex');
}

export async function getPublicArtists(): Promise<PublicArtist[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('stock_artists')
    .select('id, name, genre, city, status, socials, bio, photo_url, logo_url, social_post_url, cypher_interested, cypher_role, points_earned, volunteer_eligible')
    .neq('status', 'declined')
    .order('status')
    .order('name');

  if (error || !data) return [];

  return data.map((a) => ({
    id: a.id,
    name: a.name,
    slug: slugify(a.name),
    genre: a.genre || '',
    city: a.city || '',
    status: a.status,
    socials: a.socials || '',
    bio: a.bio || '',
    photo_url: a.photo_url || '',
    logo_url: a.logo_url || '',
    social_post_url: a.social_post_url || '',
    cypher_interested: Boolean(a.cypher_interested),
    cypher_role: a.cypher_role || '',
    points_earned: a.points_earned || 0,
    volunteer_eligible: Boolean(a.volunteer_eligible),
  }));
}

export async function getArtistBySlug(slug: string): Promise<PublicArtist | null> {
  const all = await getPublicArtists();
  return all.find((a) => a.slug === slug) || null;
}

export async function verifyClaimToken(slug: string, token: string): Promise<string | null> {
  if (!token || token.length < 4) return null;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('stock_artists')
    .select('id, name, claim_token')
    .eq('claim_token', token)
    .maybeSingle();
  if (error || !data) return null;
  if (slugify(data.name) !== slug) return null;
  return data.id;
}
