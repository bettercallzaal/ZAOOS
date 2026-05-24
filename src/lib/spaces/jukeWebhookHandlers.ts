/**
 * Per-event handlers for the Juke outbound webhooks. The route in
 * `/api/juke/webhooks/route.ts` parses + HMAC-verifies the delivery, then
 * dispatches the parsed body here.
 *
 * Juke event vocabulary (per the 2026-05-23 PR):
 *
 *   - room.started        the host opened the room
 *   - room.finished       the room ended for everyone
 *   - participant.joined  someone joined the room
 *   - participant.left    someone left the room
 *   - recording.ready     the host had recording on and the file is ready
 *
 * Body shape is best-effort - we treat the inbound JSON defensively and only
 * consume the fields we recognise. Extra fields are stored verbatim in
 * `juke_webhook_events.body`.
 */
import { autoCastToZao } from '@/lib/publish/auto-cast';
import { logger } from '@/lib/logger';
import { bumpParticipantCount, getJukeSpace, updateJukeSpace } from './jukeSpacesDb';

interface JukeWebhookBody {
  event?: string;
  type?: string;
  data?: Record<string, unknown>;
  space?: Record<string, unknown>;
  space_id?: string;
  spaceId?: string;
  recording_url?: string;
  recordingUrl?: string;
  occurred_at?: string;
  occurredAt?: string;
}

export interface ParsedWebhookEvent {
  /** Normalised event name, e.g. `room.finished`. */
  eventType: string;
  /** Juke space id this event is for, when extractable from the body. */
  spaceId: string | null;
  /** Optional Juke-side event id, when present in the body. */
  eventId: string | null;
}

/**
 * Extract `eventType` + `spaceId` + `eventId` from the Juke body without
 * assuming a single shape. Juke's PR description names the events but the
 * payload schema is not yet in llms.txt — be defensive.
 */
export function parseWebhookEvent(body: unknown): ParsedWebhookEvent {
  const b = (body ?? {}) as JukeWebhookBody;
  const eventType = (b.event ?? b.type ?? '').toString();
  const spaceId =
    b.space_id ??
    b.spaceId ??
    (typeof b.data === 'object' && b.data !== null
      ? ((b.data as { space_id?: string; spaceId?: string; id?: string }).space_id ??
        (b.data as { space_id?: string; spaceId?: string; id?: string }).spaceId ??
        (b.data as { space_id?: string; spaceId?: string; id?: string }).id ??
        null)
      : null) ??
    (typeof b.space === 'object' && b.space !== null
      ? ((b.space as { id?: string }).id ?? null)
      : null) ??
    null;
  const eventId =
    typeof b.data === 'object' && b.data !== null
      ? ((b.data as { id?: string }).id ?? null)
      : null;
  return { eventType, spaceId, eventId };
}

/** Pull the recording url from any reasonable place in the body. */
function readRecordingUrl(body: unknown): string | null {
  const b = (body ?? {}) as JukeWebhookBody;
  if (typeof b.recording_url === 'string') return b.recording_url;
  if (typeof b.recordingUrl === 'string') return b.recordingUrl;
  if (b.data && typeof b.data === 'object') {
    const d = b.data as { recording_url?: string; recordingUrl?: string; url?: string };
    if (typeof d.recording_url === 'string') return d.recording_url;
    if (typeof d.recordingUrl === 'string') return d.recordingUrl;
    if (typeof d.url === 'string') return d.url;
  }
  return null;
}

function readOccurredAt(body: unknown): string {
  const b = (body ?? {}) as JukeWebhookBody;
  return b.occurred_at ?? b.occurredAt ?? new Date().toISOString();
}

/**
 * Apply the side effects for one verified, deduplicated webhook event.
 *
 * Errors are surfaced to the caller — the route persists the error message
 * on the corresponding `juke_webhook_events` row but always returns 200 so
 * Juke does not retry a handler bug forever.
 */
export async function applyWebhookEvent(
  eventType: string,
  spaceId: string | null,
  body: unknown,
): Promise<void> {
  if (!spaceId) {
    // Without a space id there is nothing to update. Acknowledge silently.
    return;
  }
  switch (eventType) {
    case 'room.started': {
      await updateJukeSpace(spaceId, { status: 'active', started_at: readOccurredAt(body) });
      return;
    }
    case 'room.finished':
    case 'room.ended': {
      await updateJukeSpace(spaceId, { status: 'ended', ended_at: readOccurredAt(body) });
      return;
    }
    case 'participant.joined': {
      await bumpParticipantCount(spaceId, +1);
      return;
    }
    case 'participant.left': {
      await bumpParticipantCount(spaceId, -1);
      return;
    }
    case 'recording.ready': {
      const url = readRecordingUrl(body);
      if (!url) return;
      await updateJukeSpace(spaceId, { recording_url: url });
      // Best-effort recap cast - autoCastToZao silently no-ops if the
      // @thezao signer is not configured, so this is safe on local + preview.
      try {
        const row = await getJukeSpace(spaceId);
        const title = row?.title ?? 'A ZAO space';
        const liveUrl = `https://zaoos.com/live/${spaceId}`;
        await autoCastToZao(
          `Recording up: ${title}\n\nListen back: ${liveUrl}`,
          liveUrl,
        );
      } catch (err: unknown) {
        logger.warn('[juke/webhooks] recap cast failed (non-fatal):', err);
      }
      return;
    }
    default: {
      // Unknown event - record only (the route already inserted the audit row).
      return;
    }
  }
}
