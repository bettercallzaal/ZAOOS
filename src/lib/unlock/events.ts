import { getSupabaseAdmin } from '@/lib/db/supabase';

/** A ZAO event row, carrying its Unlock lock + hosted page (research doc 863). */
export interface ZaoEvent {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  lock_address: string | null;
  unlock_event_url: string | null;
  chain_id: number;
  starts_at: string | null;
  ends_at: string | null;
  location: string | null;
  is_published: boolean;
}

const EVENT_COLUMNS =
  'id, slug, title, description, lock_address, unlock_event_url, chain_id, starts_at, ends_at, location, is_published';

export async function getEventBySlug(slug: string): Promise<ZaoEvent | null> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('events')
    .select(EVENT_COLUMNS)
    .eq('slug', slug)
    .maybeSingle();

  return (data as ZaoEvent) ?? null;
}

export async function listPublishedEvents(): Promise<ZaoEvent[]> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('events')
    .select(EVENT_COLUMNS)
    .eq('is_published', true)
    .order('starts_at', { ascending: true, nullsFirst: false });

  return (data as ZaoEvent[]) ?? [];
}
