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
import {
  addParticipant,
  bumpParticipantCount,
  getJukeSpace,
  removeParticipant,
  updateJukeSpace,
  type JukeParticipantEntry,
} from './jukeSpacesDb';

interface JukeWebhookBody {
  // Juke 2026-05-23 shape uses snake_case `event_type` + `event_id` at top level
  // and nests details under `data` (with `room_id`, `host_fid`, etc.). The
  // aliases below cover earlier-doc / alternative shapes we still see in tests
  // so the parser is defensive across versions.
  event?: string;
  type?: string;
  event_type?: string;
  event_id?: string;
  eventId?: string;
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
  const eventType = (b.event_type ?? b.event ?? b.type ?? '').toString();
  const data = (typeof b.data === 'object' && b.data !== null
    ? (b.data as { space_id?: string; spaceId?: string; id?: string; room_id?: string; roomId?: string })
    : null);
  const spaceId =
    b.space_id ??
    b.spaceId ??
    data?.room_id ??
    data?.roomId ??
    data?.space_id ??
    data?.spaceId ??
    data?.id ??
    (typeof b.space === 'object' && b.space !== null
      ? ((b.space as { id?: string }).id ?? null)
      : null) ??
    null;
  const eventId =
    b.event_id ??
    b.eventId ??
    (typeof b.data === 'object' && b.data !== null
      ? ((b.data as { id?: string; event_id?: string }).event_id ??
        (b.data as { id?: string; event_id?: string }).id ??
        null)
      : null) ??
    null;
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
 * Extract `ended_via` from a room.finished body. Lives on `data.ended_via`
 * per Nicky 2026-05-24 ship, with `endedVia` as a defensive camelCase alias.
 * `host` = iOS host-end, `api` = developer-API end (e.g. our End-space
 * button), undefined = LiveKit empty-room timeout.
 */
function readEndedVia(body: unknown): 'host' | 'api' | null {
  const b = (body ?? {}) as { data?: Record<string, unknown> };
  const d = (b.data ?? {}) as { ended_via?: unknown; endedVia?: unknown };
  const raw = d.ended_via ?? d.endedVia;
  if (raw === 'host' || raw === 'api') return raw;
  return null;
}

/** Pull a JukeParticipantEntry from a participant.joined/left body. Returns
 * null if no usable fid is present (Juke filters anon listeners + virtual
 * participants out, so an event without an fid is unexpected but possible). */
function readParticipant(body: unknown, occurredAt: string): JukeParticipantEntry | null {
  const b = (body ?? {}) as { data?: Record<string, unknown> };
  const d = (b.data ?? {}) as {
    fid?: unknown;
    host_fid?: unknown;
    participant_fid?: unknown;
    user_fid?: unknown;
    display_name?: unknown;
    displayName?: unknown;
    username?: unknown;
    role?: unknown;
  };
  // Juke's 2026-05-23 room.started used `host_fid`; participant events likely
  // use `participant_fid` or `fid`. Be defensive across aliases.
  const fidRaw = d.fid ?? d.participant_fid ?? d.user_fid ?? d.host_fid;
  const fid = typeof fidRaw === 'number' ? fidRaw : typeof fidRaw === 'string' ? Number(fidRaw) : null;
  if (fid === null || !Number.isFinite(fid)) return null;
  const display_name =
    typeof d.display_name === 'string'
      ? d.display_name
      : typeof d.displayName === 'string'
        ? d.displayName
        : typeof d.username === 'string'
          ? d.username
          : null;
  const role = typeof d.role === 'string' ? d.role : null;
  return { fid, display_name, role, joined_at: occurredAt };
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
      // Juke 2026-05-24 ship (Nicky PR #174): room.finished carries
      // `ended_via: "host" | "api"` on the payload. Omitted means LiveKit's
      // empty-room timeout fired (no human action). We log it so future
      // analysis can branch on it; the raw body also persists in
      // `juke_webhook_events`.
      const endedVia = readEndedVia(body);
      const occurredAt = readOccurredAt(body);
      if (endedVia) {
        logger.info('[juke/webhooks] room.finished ended_via=' + endedVia, { spaceId });
      }
      await updateJukeSpace(spaceId, { status: 'ended', ended_at: occurredAt });

      // Recap cast: fire only for real session ends (host or api). Idle
      // empty-room timeouts (endedVia=null) had nobody to recap to so we
      // stay quiet there. recording.ready emits a separate "Recording up"
      // follow-up cast with the link if recording was on, so this first
      // cast intentionally does NOT speculate about a recording.
      if (endedVia === 'host' || endedVia === 'api') {
        try {
          const row = await getJukeSpace(spaceId);
          const title = row?.title ?? 'A ZAO space';
          const liveUrl = `https://zaoos.com/live/${spaceId}`;
          const participants = Array.isArray(row?.participants)
            ? row.participants.length
            : 0;
          const lines = [`Just wrapped: ${title}`];
          if (participants > 0) {
            lines.push(
              `${participants} ZAO ${participants === 1 ? 'member' : 'members'} joined.`,
            );
          }
          lines.push(liveUrl);
          await autoCastToZao(lines.join('\n\n'), liveUrl);
        } catch (err: unknown) {
          logger.warn('[juke/webhooks] room.finished recap cast failed (non-fatal):', err);
        }
      }
      return;
    }
    case 'participant.joined': {
      await bumpParticipantCount(spaceId, +1);
      const p = readParticipant(body, readOccurredAt(body));
      if (p) await addParticipant(spaceId, p);
      return;
    }
    case 'participant.left': {
      await bumpParticipantCount(spaceId, -1);
      const p = readParticipant(body, readOccurredAt(body));
      if (p) await removeParticipant(spaceId, p.fid);
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
