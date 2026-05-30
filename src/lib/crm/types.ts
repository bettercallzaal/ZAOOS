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

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/^@/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}
