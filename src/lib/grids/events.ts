/**
 * Event Grid - the second of ZAO's domain grids (Brandon's "Brains" layer).
 *
 * Instead of generic AI memory, a grid is a domain-scoped, queryable view over
 * data ZAO already holds. This one answers "what happened, when, who, and what
 * came of it?" - every concert, every battle, every stream, every submission,
 * every POIDH becomes queryable in one place.
 *
 * v1 sources the SOLID part: events (Unlock ticketed), wavewarz battles
 * (settled artist vs artist), and song submissions (music performances).
 * Declares fractal/game events + cowork tasks (where is_event=true) as typed
 * PendingSource fields wired next. Every profile is honest about what is
 * sourced vs pending, so nothing is fabricated.
 *
 * This follows the Reputation Grid pattern: a typed profile + one assembly
 * function over existing data + a query seam.
 */

import { getSupabaseAdmin } from '@/lib/db/supabase';

// ============================================================================
// Types
// ============================================================================

export type EventType = 'concert' | 'battle' | 'stream' | 'submission' | 'other';

export interface EventIdentity {
  id: string;
  title: string;
  description: string | null;
  type: EventType;
  /** The source table this event came from. */
  source: 'events' | 'wavewarz_battle_log' | 'song_submissions' | 'fractal_events' | 'cowork_tasks';
}

export interface EventTiming {
  startsAt: string | null;
  endsAt: string | null;
  /** ISO datetime of when the event was recorded/happened. */
  occurredAt: string | null;
  /** Human-readable status: upcoming, in-progress, past. */
  status: 'upcoming' | 'in_progress' | 'past';
}

export interface EventParticipants {
  /** Primary organizer or creator (name, fid, or username). */
  organizer: string | null;
  /** Key participants: artists in a battle, speakers in a stream, submitter. */
  participants: string[];
}

export interface EventOutcome {
  /** For battles: winner name. For submissions: approved/rejected status. For concerts: attended count. */
  result: string | null;
  /** For battles: margin or volume. For concerts: attendance or capacity. */
  metric: number | string | null;
  /** Direct link to the outcome proof (battle details URL, concert page, etc). */
  proofUrl: string | null;
}

/** A field that is part of the Event chain but not yet sourced from a table. */
export interface PendingSource {
  sourced: false;
  /** Where this will come from once wired. */
  plannedSource: string;
}

export interface EventProfile {
  identity: EventIdentity;
  timing: EventTiming;
  participants: EventParticipants;
  outcome: EventOutcome;
  /** Fractal/game event details. Wired when fractal schema is finalized. */
  fractalscore: PendingSource;
  /** Cowork tasks marked is_event=true. Wired to cowork DB next. */
  coworkEvent: PendingSource;
  /** Whether we resolved a real event for the query, or returned an empty shell. */
  found: boolean;
}

// ============================================================================
// Data Assembly
// ============================================================================

const PENDING = (plannedSource: string): PendingSource => ({ sourced: false, plannedSource });

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  type: EventType;
  source: 'events' | 'wavewarz_battle_log' | 'song_submissions' | 'fractal_events' | 'cowork_tasks';
  startsAt: string | null;
  endsAt: string | null;
  occurredAt: string | null;
  organizer: string | null;
  participants: string[];
  result: string | null;
  metric: number | string | null;
  proofUrl: string | null;
}

/**
 * Fetch and assemble recent/upcoming events across all sourced systems.
 *
 * @param opts - query options
 * @param opts.type - filter by event type (concert|battle|stream|submission|other), or undefined for all
 * @param opts.timeWindow - filter by timing: 'upcoming', 'past', or undefined for all
 * @param opts.limit - max events to return, default 50
 * @returns array of event profiles, most recent/upcoming first
 */
export async function getEventGrid(opts?: {
  type?: EventType;
  timeWindow?: 'upcoming' | 'past';
  limit?: number;
}): Promise<EventProfile[]> {
  const limit = opts?.limit ?? 50;
  const typeFilter = opts?.type;
  const windowFilter = opts?.timeWindow;

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const events: EventRow[] = [];

  // Source 1: Published ZAO events (concerts, streams, workshops)
  try {
    const eventsQuery = supabase
      .from('events')
      .select(
        'id, title, description, starts_at, ends_at, created_at, is_published',
      )
      .eq('is_published', true);

    const { data: publishedEvents } = await eventsQuery;

    if (publishedEvents && publishedEvents.length > 0) {
      publishedEvents.forEach((e: any) => {
        events.push({
          id: e.id,
          title: e.title,
          description: e.description,
          type: 'concert',
          source: 'events',
          startsAt: e.starts_at,
          endsAt: e.ends_at,
          occurredAt: e.created_at,
          organizer: null,
          participants: [],
          result: null,
          metric: null,
          proofUrl: null,
        });
      });
    }
  } catch (error) {
    // graceful degradation if events table is unreachable
    console.warn('[grids/events] failed to fetch published events', error);
  }

  // Source 2: WaveWarZ battles
  try {
    const battlesQuery = supabase
      .from('wavewarz_battle_log')
      .select('id, battle_id, artist_a, artist_b, winner, winner_margin, volume_sol, settled_at')
      .not('settled_at', 'is', null)
      .order('settled_at', { ascending: false });

    const { data: battles } = await battlesQuery;

    if (battles && battles.length > 0) {
      battles.forEach((b: any) => {
        events.push({
          id: b.id,
          title: `${b.artist_a} vs ${b.artist_b}`,
          description: null,
          type: 'battle',
          source: 'wavewarz_battle_log',
          startsAt: null,
          endsAt: null,
          occurredAt: b.settled_at,
          organizer: 'WaveWarZ',
          participants: [b.artist_a, b.artist_b],
          result: b.winner ?? null,
          metric: `${b.volume_sol || 0} SOL`,
          proofUrl: null,
        });
      });
    }
  } catch (error) {
    console.warn('[grids/events] failed to fetch wavewarz battles', error);
  }

  // Source 3: Song submissions (music performances/tracks)
  try {
    const submissionsQuery = supabase
      .from('song_submissions')
      .select(
        'id, title, artist, submitted_by_username, created_at, status, url',
      )
      .order('created_at', { ascending: false });

    const { data: submissions } = await submissionsQuery;

    if (submissions && submissions.length > 0) {
      submissions.forEach((s: any) => {
        events.push({
          id: s.id,
          title: s.title,
          description: null,
          type: 'submission',
          source: 'song_submissions',
          startsAt: null,
          endsAt: null,
          occurredAt: s.created_at,
          organizer: s.artist,
          participants: [s.submitted_by_username || 'unknown'].filter(Boolean),
          result: s.status,
          metric: null,
          proofUrl: s.url ?? null,
        });
      });
    }
  } catch (error) {
    console.warn('[grids/events] failed to fetch song submissions', error);
  }

  // Filter by type if specified
  const filtered = typeFilter
    ? events.filter((e) => e.type === typeFilter)
    : events;

  // Compute status and filter by time window if specified
  const withStatus = filtered.map((e): EventRow & { computedStatus: 'upcoming' | 'in_progress' | 'past' } => {
    let computedStatus: 'upcoming' | 'in_progress' | 'past';

    if (e.startsAt) {
      const startDate = new Date(e.startsAt);
      const endDate = e.endsAt ? new Date(e.endsAt) : null;

      if (startDate > new Date(now)) {
        computedStatus = 'upcoming';
      } else if (endDate && endDate < new Date(now)) {
        computedStatus = 'past';
      } else {
        computedStatus = 'in_progress';
      }
    } else if (e.occurredAt) {
      computedStatus = new Date(e.occurredAt) < new Date(now) ? 'past' : 'upcoming';
    } else {
      computedStatus = 'past';
    }

    return { ...e, computedStatus };
  });

  const timeFiltered = windowFilter
    ? withStatus.filter((e) => e.computedStatus === windowFilter)
    : withStatus;

  // Sort by most recent/upcoming, limit
  const sorted = timeFiltered
    .sort((a, b) => {
      const aTime = a.startsAt ? new Date(a.startsAt) : a.occurredAt ? new Date(a.occurredAt) : new Date(0);
      const bTime = b.startsAt ? new Date(b.startsAt) : b.occurredAt ? new Date(b.occurredAt) : new Date(0);
      return bTime.getTime() - aTime.getTime();
    })
    .slice(0, limit);

  // Assemble profiles
  return sorted.map((e) => ({
    identity: {
      id: e.id,
      title: e.title,
      description: e.description,
      type: e.type,
      source: e.source,
    },
    timing: {
      startsAt: e.startsAt,
      endsAt: e.endsAt,
      occurredAt: e.occurredAt,
      status: e.computedStatus,
    },
    participants: {
      organizer: e.organizer,
      participants: e.participants,
    },
    outcome: {
      result: e.result,
      metric: e.metric,
      proofUrl: e.proofUrl,
    },
    fractalscore: PENDING('fractal_events + fractal_scores'),
    coworkEvent: PENDING('cowork DB tasks (is_event=true)'),
    found: true,
  }));
}
