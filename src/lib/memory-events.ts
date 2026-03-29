import { hindsight } from './hindsight';

// ============================================================================
// Event Types
// ============================================================================

export interface CastReceipt {
  type: 'cast';
  castHash: string;
  authorFid: number;
  authorUsername: string;
  content: string;
  timestamp: string;
  reactions: { type: string; count: number }[];
  recasts: number;
}

export interface TrackShare {
  type: 'track_share';
  trackName: string;
  artist: string;
  platform: 'spotify' | 'soundcloud' | 'youtube' | 'apple_music';
  sharerFid: number;
  sharerUsername: string;
  timestamp: string;
  note?: string;
}

export interface RespectTransaction {
  type: 'respect';
  fromFid: number;
  fromUsername: string;
  toFid: number;
  toUsername: string;
  amount: string;
  reason?: string;
  txHash?: string;
  timestamp: string;
}

export interface RoomParticipation {
  type: 'room_participation';
  roomId: string;
  event: 'joined' | 'left' | 'spoke';
  speakerFid?: number;
  speakerUsername?: string;
  content?: string;
  timestamp: string;
}

export interface ProfileUpdate {
  type: 'profile_update';
  fid: number;
  username: string;
  field: 'bio' | 'username' | 'avatar';
  oldValue?: string;
  newValue: string;
  timestamp: string;
}

// Union type for all events
export type MemoryEvent =
  | CastReceipt
  | TrackShare
  | RespectTransaction
  | RoomParticipation
  | ProfileUpdate;

// ============================================================================
// Event Handlers - WHEN to call retain()
// ============================================================================

/**
 * On new cast received from the ZAO feed
 */
export async function onCastReceived(cast: CastReceipt): Promise<void> {
  await retainEvent(String(cast.authorFid), cast);
}

/**
 * On track shared by a user
 */
export async function onTrackShared(track: TrackShare): Promise<void> {
  await retainEvent(String(track.sharerFid), track);
}

/**
 * On Respect transaction sent or received
 */
export async function onRespectTransaction(tx: RespectTransaction): Promise<void> {
  // Store for both sender and receiver
  await retainEvent(String(tx.fromFid), tx);
  await retainEvent(String(tx.toFid), tx);
}

/**
 * On room participation (join, leave, speak)
 */
export async function onRoomEvent(event: RoomParticipation): Promise<void> {
  if (event.speakerFid) {
    await retainEvent(String(event.speakerFid), event);
  }
}

/**
 * On profile update (bio, username, avatar)
 */
export async function onProfileUpdate(profile: ProfileUpdate): Promise<void> {
  await retainEvent(String(profile.fid), profile);
}

// ============================================================================
// Core retain logic
// ============================================================================

/**
 * Store a memory event in the user's bank.
 * bank_id = user's FID (as string) for per-user isolation.
 */
export async function retainEvent(
  userFid: string,
  event: MemoryEvent
): Promise<void> {
  try {
    const content = serializeEventToText(event);
    await hindsight.retain(userFid, content, {
      metadata: {
        eventType: event.type,
        timestamp: event.timestamp,
        ...flattenEvent(event),
      },
    });
  } catch (error) {
    console.error(`Failed to retain event for user ${userFid}:`, error);
    // Graceful degradation - don't hard error if Hindsight is down
  }
}

function serializeEventToText(event: MemoryEvent): string {
  switch (event.type) {
    case 'cast':
      return `${event.authorUsername} cast: "${event.content}" — ${event.reactions.map(r => `${r.count} ${r.type}`).join(', ')} reactions, ${event.recasts} recasts`;
    case 'track_share':
      return `${event.sharerUsername} shared "${event.trackName}" by ${event.artist} on ${event.platform}${event.note ? ` — "${event.note}"` : ''}`;
    case 'respect':
      return `${event.fromUsername} sent ${event.amount} Respect to ${event.toUsername}${event.reason ? ` for: ${event.reason}` : ''}`;
    case 'room_participation':
      return `${event.speakerUsername || `User ${event.speakerFid}`} ${event.event} room ${event.roomId}${event.content ? `: "${event.content}"` : ''}`;
    case 'profile_update':
      return `User ${event.username} updated ${event.field}: ${event.oldValue ? `"${event.oldValue}" → ` : ''}"${event.newValue}"`;
  }
}

function flattenEvent(event: MemoryEvent): Record<string, string | number | undefined> {
  return {
    castHash: 'castHash' in event ? event.castHash : undefined,
    trackName: 'trackName' in event ? event.trackName : undefined,
    artist: 'artist' in event ? event.artist : undefined,
    platform: 'platform' in event ? event.platform : undefined,
    amount: 'amount' in event ? event.amount : undefined,
    roomId: 'roomId' in event ? event.roomId : undefined,
    field: 'field' in event ? event.field : undefined,
  };
}
