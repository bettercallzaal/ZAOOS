import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
export const alt = 'FISHBOWLZ Room';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Resolve slug or UUID
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const column = isUuid ? 'id' : 'slug';

  // Use createClient directly — edge runtime won't have preloadEnv() called
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const fallback = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        background: '#0a1628',
        color: 'white',
        fontSize: 40,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <span style={{ color: '#f5a623', fontWeight: 700, letterSpacing: '2px' }}>FISHBOWLZ</span>
    </div>
  );

  if (!supabaseUrl || !supabaseKey) {
    return new ImageResponse(fallback, { ...size });
  }

  const client = createClient(supabaseUrl, supabaseKey);

  const { data: room } = await client
    .from('fishbowl_rooms')
    .select('title, host_username, state, hot_seat_count, current_speakers, current_listeners')
    .eq(column, id)
    .single();

  if (!room) {
    return new ImageResponse(fallback, { ...size });
  }

  const speakers = Array.isArray(room.current_speakers)
    ? room.current_speakers
    : (() => {
        try {
          return typeof room.current_speakers === 'string'
            ? JSON.parse(room.current_speakers)
            : [];
        } catch {
          return [];
        }
      })();

  const listeners = Array.isArray(room.current_listeners)
    ? room.current_listeners
    : (() => {
        try {
          return typeof room.current_listeners === 'string'
            ? JSON.parse(room.current_listeners)
            : [];
        } catch {
          return [];
        }
      })();

  const totalParticipants = speakers.length + listeners.length;

  const stateColor =
    room.state === 'active' ? '#22c55e' : room.state === 'scheduled' ? '#3b82f6' : '#6b7280';
  const stateLabel =
    room.state === 'active' ? 'LIVE' : room.state === 'scheduled' ? 'SCHEDULED' : 'ENDED';

  const title: string = room.title ?? 'Untitled Room';
  const truncatedTitle = title.length > 40 ? title.slice(0, 40) + '...' : title;

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #0a1628 0%, #1a2a4a 100%)',
          padding: '60px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <span style={{ fontSize: '48px' }}>🐟</span>
          <span
            style={{ color: '#f5a623', fontSize: '28px', fontWeight: 700, letterSpacing: '2px' }}
          >
            FISHBOWLZ
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: `${stateColor}20`,
              border: `2px solid ${stateColor}50`,
              borderRadius: '999px',
              padding: '4px 16px',
              marginLeft: 'auto',
            }}
          >
            {room.state === 'active' && (
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: stateColor,
                }}
              />
            )}
            <span style={{ color: stateColor, fontSize: '18px', fontWeight: 600 }}>
              {stateLabel}
            </span>
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: '56px',
            fontWeight: 700,
            color: 'white',
            marginBottom: '16px',
            lineHeight: 1.2,
          }}
        >
          {truncatedTitle}
        </div>

        {/* Host */}
        <div style={{ fontSize: '24px', color: '#9ca3af', marginBottom: '40px' }}>
          Hosted by @{room.host_username}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '40px', marginTop: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '40px', fontWeight: 700, color: '#f5a623' }}>
              {speakers.length}/{room.hot_seat_count}
            </span>
            <span style={{ fontSize: '16px', color: '#6b7280' }}>Hot Seats</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '40px', fontWeight: 700, color: 'white' }}>
              {totalParticipants}
            </span>
            <span style={{ fontSize: '16px', color: '#6b7280' }}>Participants</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
