/**
 * Sponsor Grid - the fifth and final of ZAO's domain grids (Brandon's "Brains" layer).
 *
 * Instead of generic AI memory, a grid is a domain-scoped, queryable view over
 * data ZAO already holds. This one answers "who funded what, and what was the
 * impact? What is the relationship? What are the future opportunities?" - the
 * durable memory of sponsorships, ROI, and partnership health.
 *
 * v1 sources the SOLID part (ZAOstock sponsor commitments via stock_sponsors table).
 * Declares the not-yet-sourced fields (ROI, conversions, relationship depth,
 * future opportunities) as typed PendingSource fields wired next. Every profile
 * is honest about what is sourced vs pending, so nothing is fabricated.
 *
 * This follows the Reputation + Creator + Event + Battle Grid pattern: a typed
 * profile + one assembly function over existing data + a query seam.
 */

import { getSupabaseAdmin } from '@/lib/db/supabase';

// ============================================================================
// Types
// ============================================================================

export interface SponsorIdentity {
  name: string;
  wallet: string | null;
  email: string | null;
  /** Organization or individual sponsor name. */
  entity: string;
  /** Primary contact. */
  contact: string | null;
}

export type SponsorshipStatus = 'prospective' | 'committed' | 'paid' | 'completed' | 'cancelled';

export interface SponsoredItem {
  id: string;
  /** Event, initiative, or project funded. */
  what: string;
  /** Date sponsorship was made or commitment date. */
  date: string | null;
  /** Amount committed or paid. */
  amount: number;
  /** Currency (USD, ETH, SOL, etc.). */
  currency: string;
  status: SponsorshipStatus;
}

/**
 * A field that is part of the Sponsor intelligence but not yet sourced from a table.
 */
export interface PendingSource {
  sourced: false;
  /** Where this will come from once wired. */
  plannedSource: string;
}

export interface SponsorROI {
  /** Estimated or realized return. sourced: false until partnership data lands. */
  estimated: PendingSource;
  /** Realized conversions, upsells, partnerships flowing from this sponsorship. */
  conversions: PendingSource;
  /** Overall ROI score, 0-100. */
  score: PendingSource;
}

export interface SponsorRelationship {
  /** How deep is the relationship (prospecting, negotiating, partner, champion)? */
  stage: PendingSource;
  /** Health of the relationship (strong, neutral, strained, dormant). */
  health: PendingSource;
  /** Last meaningful contact date. */
  lastContact: string | null;
  /** Frequency of engagement (monthly, quarterly, event-based, one-time). */
  cadence: PendingSource;
}

export interface SponsorOpportunities {
  /** Next sponsorship opportunity (event, tier, category). */
  next: PendingSource;
  /** Cross-sell or expansion opportunities (new products, larger tier). */
  upsell: PendingSource;
  /** Co-marketing or co-production opportunities. */
  partnerships: PendingSource;
}

export interface SponsorProfile {
  identity: SponsorIdentity;
  /** All sponsorships this entity has made to ZAO. */
  sponsored: SponsoredItem[];
  /** Aggregate return on investment. */
  roi: SponsorROI;
  /** Relationship health and stage. */
  relationship: SponsorRelationship;
  /** Future engagement opportunities. */
  opportunities: SponsorOpportunities;
  /** Whether we resolved a real sponsor for the query, or returned an empty shell. */
  found: boolean;
}

// ============================================================================
// Data Assembly
// ============================================================================

const PENDING = (plannedSource: string): PendingSource => ({ sourced: false, plannedSource });

interface StockSponsorRow {
  id: string;
  sponsor_name: string;
  sponsor_email: string | null;
  sponsor_wallet: string | null;
  amount_committed: number;
  currency: string;
  status: string;
  committed_at: string | null;
}

function matchesIdentifier(sponsor: StockSponsorRow, id: string): boolean {
  const q = id.trim().toLowerCase();
  if (!q) return false;
  return (
    sponsor.sponsor_name.toLowerCase() === q ||
    sponsor.sponsor_name.toLowerCase().includes(q) ||
    (sponsor.sponsor_email?.toLowerCase() === q) ||
    (sponsor.sponsor_wallet?.toLowerCase() === q)
  );
}

/**
 * Assemble a sponsor's Sponsor Grid profile.
 *
 * @param identifier - a sponsor name, email, or wallet.
 * @returns the profile; `found: false` with empty sponsored array if unresolved.
 */
export async function getSponsorProfile(identifier: string): Promise<SponsorProfile> {
  const supabase = getSupabaseAdmin();

  // Query all sponsor records for this identifier
  const { data: records, error } = await supabase
    .from('stock_sponsors')
    .select('id, sponsor_name, sponsor_email, sponsor_wallet, amount_committed, currency, status, committed_at');

  if (error || !records || records.length === 0) {
    return {
      identity: { name: identifier, wallet: null, email: null, entity: identifier, contact: null },
      sponsored: [],
      roi: {
        estimated: PENDING('partnership metrics and conversion tracking'),
        conversions: PENDING('deal tracking, CRM events'),
        score: PENDING('roi formula: (returns / investment) over time'),
      },
      relationship: {
        stage: PENDING('sponsor_relationship_stage (prospecting, negotiating, partner, champion)'),
        health: PENDING('sponsor_relationship_health (strong, neutral, strained, dormant)'),
        lastContact: null,
        cadence: PENDING('sponsor_engagement_cadence (monthly, quarterly, event-based, one-time)'),
      },
      opportunities: {
        next: PENDING('sponsor_next_opportunity (event, tier, category)'),
        upsell: PENDING('sponsor_upsell_opportunities (new products, larger tier)'),
        partnerships: PENDING('sponsor_comarketing_opportunities (co-marketing, co-production)'),
      },
      found: false,
    };
  }

  // Find matching sponsor(s) - aggregate if multiple records for same sponsor
  const matchedRecords = records.filter((r) => matchesIdentifier(r, identifier));

  if (matchedRecords.length === 0) {
    // No exact match, return empty with the first record's name as fallback
    const first = records[0];
    return {
      identity: { name: identifier, wallet: null, email: null, entity: identifier, contact: null },
      sponsored: [],
      roi: {
        estimated: PENDING('partnership metrics and conversion tracking'),
        conversions: PENDING('deal tracking, CRM events'),
        score: PENDING('roi formula: (returns / investment) over time'),
      },
      relationship: {
        stage: PENDING('sponsor_relationship_stage (prospecting, negotiating, negotiating, champion)'),
        health: PENDING('sponsor_relationship_health (strong, neutral, strained, dormant)'),
        lastContact: null,
        cadence: PENDING('sponsor_engagement_cadence (monthly, quarterly, event-based, one-time)'),
      },
      opportunities: {
        next: PENDING('sponsor_next_opportunity (event, tier, category)'),
        upsell: PENDING('sponsor_upsell_opportunities (new products, larger tier)'),
        partnerships: PENDING('sponsor_comarketing_opportunities (co-marketing, co-production)'),
      },
      found: false,
    };
  }

  // Use the first matched record for identity
  const primary = matchedRecords[0];

  // Assemble all sponsorships for this sponsor
  const sponsored: SponsoredItem[] = matchedRecords.map((r) => ({
    id: r.id,
    what: 'ZAOstock 2026',
    date: r.committed_at,
    amount: Number(r.amount_committed) || 0,
    currency: r.currency || 'USD',
    status: (r.status as SponsorshipStatus) || 'prospective',
  }));

  return {
    identity: {
      name: primary.sponsor_name,
      wallet: primary.sponsor_wallet,
      email: primary.sponsor_email,
      entity: primary.sponsor_name,
      contact: null, // Could be wired from a sponsor_contact_name field next
    },
    sponsored,
    roi: {
      estimated: PENDING('partnership metrics and conversion tracking'),
      conversions: PENDING('deal tracking, CRM events'),
      score: PENDING('roi formula: (returns / investment) over time'),
    },
    relationship: {
      stage: PENDING('sponsor_relationship_stage (prospecting, negotiating, partner, champion)'),
      health: PENDING('sponsor_relationship_health (strong, neutral, strained, dormant)'),
      lastContact: null,
      cadence: PENDING('sponsor_engagement_cadence (monthly, quarterly, event-based, one-time)'),
    },
    opportunities: {
      next: PENDING('sponsor_next_opportunity (event, tier, category)'),
      upsell: PENDING('sponsor_upsell_opportunities (new products, larger tier)'),
      partnerships: PENDING('sponsor_comarketing_opportunities (co-marketing, co-production)'),
    },
    found: true,
  };
}
