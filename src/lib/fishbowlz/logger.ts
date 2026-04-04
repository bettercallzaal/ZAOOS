/**
 * FISHBOWLZ Event Logger
 *
 * Append-only JSONL event logger. Every fishbowl action is logged to:
 * 1. Supabase fishbowl_event_log table (for queries)
 * 2. window.localStorage as a local backup JSONL (for resilience)
 *
 * Events logged:
 * - room.created, room.ended, room.resumed
 * - session.started, session.ended
 * - speaker.joined, speaker.left, speaker.rotated_in, speaker.rotated_out
 * - listener.joined, listener.left
 * - transcript.segment_added
 * - agent.joined (agents participating in rooms)
 */

export type FishbowlEventType =
  | 'room.created'
  | 'room.paused'
  | 'room.resumed'
  | 'room.ended'
  | 'session.started'
  | 'session.ended'
  | 'speaker.joined'
  | 'speaker.left'
  | 'speaker.rotated_in'
  | 'speaker.rotated_out'
  | 'listener.joined'
  | 'listener.left'
  | 'transcript.segment_added'
  | 'agent.joined'
  | 'agent.action';

export interface FishbowlEvent {
  id?: number;
  event_type: FishbowlEventType;
  event_data: Record<string, unknown>;
  room_id?: string;
  session_id?: string;
  actor_fid?: number;
  actor_type?: 'human' | 'agent';
  created_at: string;
}

/**
 * Log a fishbowl event to Supabase.
 * Falls back to localStorage JSONL if API call fails.
 */
export async function logFishbowlEvent(event: Omit<FishbowlEvent, 'id' | 'created_at'>): Promise<number | null> {
  const payload = {
    eventType: event.event_type,
    eventData: event.event_data,
    roomId: event.room_id,
    sessionId: event.session_id,
    actorFid: event.actor_fid,
    actorType: event.actor_type,
  };

  // Always write to localStorage first (append-only backup)
  appendLocalEvent({
    ...event,
    created_at: new Date().toISOString(),
  });

  try {
    const res = await fetch('/api/fishbowlz/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.id ?? null;
  } catch {
    // Network error — localStorage has the event, will be synced later
    return null;
  }
}

/**
 * Append event to localStorage JSONL (browser backup).
 * Max 1000 events stored locally; oldest are evicted.
 */
function appendLocalEvent(event: FishbowlEvent): void {
  if (typeof window === 'undefined') return;

  try {
    const key = `fishbowlz_events_${event.room_id ?? 'global'}`;
    const existing = JSON.parse(localStorage.getItem(key) ?? '[]') as FishbowlEvent[];
    const updated = [...existing, event].slice(-1000); // Keep last 1000
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {
    // localStorage full or unavailable — silently skip
  }
}

/**
 * Flush local events to Supabase. Call on page load to recover from offline periods.
 */
export async function flushLocalEvents(roomId: string): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const key = `fishbowlz_events_${roomId}`;
    const events = JSON.parse(localStorage.getItem(key) ?? '[]') as FishbowlEvent[];

    if (events.length === 0) return;

    // POST each event
    await Promise.allSettled(
      events.map((event) =>
        fetch('/api/fishbowlz/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: event.event_type,
            eventData: event.event_data,
            roomId: event.room_id,
            sessionId: event.session_id,
            actorFid: event.actor_fid,
            actorType: event.actor_type,
          }),
        })
      )
    );

    // Clear local events after flush
    localStorage.removeItem(key);
  } catch {
    // Non-critical
  }
}

/**
 * Get all events for a room from Supabase.
 */
export async function getRoomEvents(roomId: string, limit = 100): Promise<FishbowlEvent[]> {
  try {
    const res = await fetch(`/api/fishbowlz/events?roomId=${roomId}&limit=${limit}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.events ?? [];
  } catch {
    return [];
  }
}

/**
 * Format an event for display (human-readable).
 */
export function formatEvent(event: FishbowlEvent): string {
  const data = event.event_data as Record<string, unknown>;
  const actor = event.actor_type === 'agent' ? `agent:${data.username ?? ''}` : `@${data.username ?? event.actor_fid}`;

  switch (event.event_type) {
    case 'room.created':
      return `Room created: ${data.title}`;
    case 'session.started':
      return `Session started`;
    case 'speaker.joined':
      return `${actor} joined the hot seat`;
    case 'speaker.left':
      return `${actor} left the hot seat`;
    case 'speaker.rotated_in':
      return `${actor} rotated into the hot seat`;
    case 'listener.joined':
      return `${actor} joined as listener`;
    case 'listener.left':
      return `${actor} left listener mode`;
    case 'transcript.segment_added':
      return `${actor} said: "${String(data.text ?? '').slice(0, 50)}..."`;
    case 'agent.joined':
      return `Agent ${data.username} joined as ${data.role}`;
    default:
      return event.event_type;
  }
}
