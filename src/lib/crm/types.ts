// Shared CRM types + helpers. Doc 772. Backed by crm_contacts / crm_interactions
// (see scripts/20260529_crm.sql). Public reads go through the *_public views.

export type InteractionType =
  | 'meeting'
  | 'call'
  | 'email'
  | 'message'
  | 'gcal'
  | 'github'
  | 'note';

export type Visibility = 'public' | 'private';

/**
 * The canonical CRM segments (doc 772 follow-up). The Airtable import had 114
 * free-text categories with heavy spelling drift; these are the ~11 real ones
 * everything normalizes to. `category` holds one of these; `tags` keeps the
 * granular original label + acquisition channel.
 */
export const CANONICAL_CATEGORIES = [
  'Musician',
  'Music Industry',
  'Web3 / Onchain',
  'Founder / Business',
  'Visual / Creative',
  'Developer / Tech',
  'Games',
  'DAO / Regen',
  'Local / Maine',
  'Community / Personal',
  'Other',
] as const;

export type CrmCategory = (typeof CANONICAL_CATEGORIES)[number];

/** A contact row as stored privately (service-role reads only). */
export interface CrmContact {
  id: string;
  owner_fid: number | null;
  name: string;
  slug: string | null;
  handle: string | null;
  farcaster_handle: string | null;
  x_handle: string | null;
  github_handle: string | null;
  role: string | null;
  category: string | null;
  tags: string[];
  org: string | null;
  how_we_met: string | null;
  public_summary: string | null;
  is_public: boolean;
  telegram_handle: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  private_notes: string | null;
  relationship_strength: number | null;
  legacy_airtable_id: string | null;
  created_at: string;
  updated_at: string;
}

/** Public projection of a contact (crm_contacts_public view). */
export interface CrmContactPublic {
  id: string;
  slug: string | null;
  name: string;
  handle: string | null;
  farcaster_handle: string | null;
  x_handle: string | null;
  github_handle: string | null;
  role: string | null;
  category: string | null;
  tags: string[];
  org: string | null;
  how_we_met: string | null;
  public_summary: string | null;
  created_at: string;
}

/** Public projection of an interaction (crm_interactions_public view). */
export interface CrmInteractionPublic {
  id: string;
  contact_id: string;
  type: InteractionType;
  occurred_at: string;
  title: string | null;
  public_summary: string | null;
}

/**
 * Deterministic slug from the best available identifier. Lets the bot upsert a
 * contact by a stable key without first reading the DB. Order: explicit slug,
 * then farcaster/x/github handle, then the name.
 */
export function deriveContactSlug(input: {
  slug?: string | null;
  farcaster_handle?: string | null;
  x_handle?: string | null;
  github_handle?: string | null;
  name: string;
}): string {
  const raw =
    input.slug ||
    input.farcaster_handle ||
    input.x_handle ||
    input.github_handle ||
    input.name;
  return slugify(raw);
}

/**
 * True when the input carries a key that uniquely identifies a person (explicit
 * slug or a social handle). A name alone is NOT stable — two different people
 * can share a name — so it must never be used as an upsert conflict target
 * (C-M2: a name-only upsert overwrites a different person's PII).
 */
export function hasStableContactKey(input: {
  slug?: string | null;
  farcaster_handle?: string | null;
  x_handle?: string | null;
  github_handle?: string | null;
}): boolean {
  return Boolean(
    input.slug ||
      input.farcaster_handle ||
      input.x_handle ||
      input.github_handle,
  );
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/^@/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}
