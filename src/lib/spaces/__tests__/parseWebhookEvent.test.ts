// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

// jukeWebhookHandlers transitively imports @/lib/env which calls requireEnv()
// at module load. Mock the module before importing to prevent the throw.
vi.mock('@/lib/env', () => ({
  ENV: {
    JUKE_API_KEY: undefined,
    ZAO_OFFICIAL_FID: undefined,
    ZAO_OFFICIAL_SIGNER_UUID: undefined,
    ZAO_OFFICIAL_NEYNAR_API_KEY: undefined,
  },
}));

import { parseWebhookEvent } from '../jukeWebhookHandlers';

// parseWebhookEvent is a pure defensive parser — it accepts unknown shapes and
// normalizes to { eventType, spaceId, eventId }. Tests document the priority
// order for each field so we catch regressions when Juke ships new payload shapes.

describe('parseWebhookEvent', () => {
  // ── Null / empty body ───────────────────────────────────────────

  it('handles null body gracefully', () => {
    const r = parseWebhookEvent(null);
    expect(r.eventType).toBe('');
    expect(r.spaceId).toBeNull();
    expect(r.eventId).toBeNull();
  });

  it('handles undefined body gracefully', () => {
    const r = parseWebhookEvent(undefined);
    expect(r.eventType).toBe('');
    expect(r.spaceId).toBeNull();
    expect(r.eventId).toBeNull();
  });

  it('handles empty object', () => {
    const r = parseWebhookEvent({});
    expect(r.eventType).toBe('');
    expect(r.spaceId).toBeNull();
    expect(r.eventId).toBeNull();
  });

  // ── event_type priority ─────────────────────────────────────────

  it('prefers event_type over event and type', () => {
    const r = parseWebhookEvent({ event_type: 'room.started', event: 'other', type: 'another' });
    expect(r.eventType).toBe('room.started');
  });

  it('falls back to event when event_type absent', () => {
    const r = parseWebhookEvent({ event: 'room.finished', type: 'ignored' });
    expect(r.eventType).toBe('room.finished');
  });

  it('falls back to type when only type is present', () => {
    const r = parseWebhookEvent({ type: 'participant.joined' });
    expect(r.eventType).toBe('participant.joined');
  });

  // ── spaceId resolution ──────────────────────────────────────────

  it('reads space_id at top level', () => {
    const r = parseWebhookEvent({ event_type: 'room.started', space_id: 'space-123' });
    expect(r.spaceId).toBe('space-123');
  });

  it('reads camelCase spaceId at top level', () => {
    const r = parseWebhookEvent({ event_type: 'room.started', spaceId: 'space-camel' });
    expect(r.spaceId).toBe('space-camel');
  });

  it('reads data.room_id (Juke 2026-05-23 shape)', () => {
    const r = parseWebhookEvent({ event_type: 'room.finished', data: { room_id: 'room-abc' } });
    expect(r.spaceId).toBe('room-abc');
  });

  it('reads data.roomId (camelCase alias)', () => {
    const r = parseWebhookEvent({ event_type: 'participant.joined', data: { roomId: 'room-xyz' } });
    expect(r.spaceId).toBe('room-xyz');
  });

  it('reads space.id when no other space field is present', () => {
    const r = parseWebhookEvent({ event_type: 'room.started', space: { id: 'space-via-space' } });
    expect(r.spaceId).toBe('space-via-space');
  });

  // ── eventId resolution ──────────────────────────────────────────

  it('reads event_id at top level', () => {
    const r = parseWebhookEvent({ event_type: 'room.started', event_id: 'evt-1' });
    expect(r.eventId).toBe('evt-1');
  });

  it('reads data.event_id when top-level event_id absent', () => {
    const r = parseWebhookEvent({ event_type: 'room.started', data: { event_id: 'evt-nested' } });
    expect(r.eventId).toBe('evt-nested');
  });

  // ── Full Juke 2026-05-23 canonical shape ───────────────────────

  it('correctly parses the canonical 2026-05-23 Juke body shape', () => {
    const body = {
      event_type: 'room.finished',
      event_id: 'evt-may23',
      data: { room_id: 'room-official', ended_via: 'host' },
    };
    const r = parseWebhookEvent(body);
    expect(r.eventType).toBe('room.finished');
    expect(r.spaceId).toBe('room-official');
    expect(r.eventId).toBe('evt-may23');
  });
});
