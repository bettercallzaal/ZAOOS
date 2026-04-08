-- ===========================================================================
-- FISHBOWLZ: Performance indexes + atomic RPC functions for race-free mutations
-- ===========================================================================

-- -------------------------------------------------------------------------
-- 1. Missing Indexes
-- -------------------------------------------------------------------------

-- Index for room list ordering
CREATE INDEX IF NOT EXISTS idx_fishbowl_rooms_last_active_at
  ON fishbowl_rooms(last_active_at DESC);

-- Index for slug lookups (unique, partial - only non-null slugs)
DROP INDEX IF EXISTS idx_fishbowl_rooms_slug;
CREATE UNIQUE INDEX IF NOT EXISTS idx_fishbowl_rooms_slug
  ON fishbowl_rooms(slug) WHERE slug IS NOT NULL;

-- Index for transcript queries by room (composite for ORDER BY)
CREATE INDEX IF NOT EXISTS idx_fishbowl_transcripts_room_id
  ON fishbowl_transcripts(room_id, created_at DESC);

-- Index for chat messages by room (composite for ORDER BY)
CREATE INDEX IF NOT EXISTS idx_fishbowl_chat_room_id
  ON fishbowl_chat_messages(room_id, created_at DESC);

-- Index for event log by room + time
CREATE INDEX IF NOT EXISTS idx_fishbowl_events_room_id
  ON fishbowl_event_log(room_id, created_at DESC);


-- -------------------------------------------------------------------------
-- 2. Atomic RPC Functions (SECURITY DEFINER, plpgsql)
--    All functions are transactional - if any statement fails, the whole
--    function rolls back. This eliminates race conditions from
--    client-side read-modify-write patterns.
-- -------------------------------------------------------------------------


-- ----- fishbowl_join_speaker -----
CREATE OR REPLACE FUNCTION fishbowl_join_speaker(
  p_room_id UUID,
  p_fid BIGINT,
  p_username TEXT,
  p_address TEXT
)
RETURNS fishbowl_rooms
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room fishbowl_rooms;
  v_speakers jsonb;
  v_listeners jsonb;
  v_speaker_count int;
  v_now timestamptz := now();
  v_new_speaker jsonb;
BEGIN
  -- Lock the row for update to prevent concurrent mutations
  SELECT * INTO v_room
    FROM fishbowl_rooms
    WHERE id = p_room_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room not found: %', p_room_id;
  END IF;

  v_speakers := v_room.current_speakers;
  v_listeners := v_room.current_listeners;
  v_speaker_count := jsonb_array_length(v_speakers);

  -- Check if already a speaker
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_speakers) AS s
    WHERE (s->>'fid')::bigint = p_fid
  ) THEN
    RAISE EXCEPTION 'User % is already a speaker', p_fid;
  END IF;

  -- Check capacity (hot_seat_count is the max speakers)
  IF v_speaker_count >= v_room.hot_seat_count THEN
    RAISE EXCEPTION 'Room is full (% / % speakers)', v_speaker_count, v_room.hot_seat_count;
  END IF;

  -- Build the new speaker object
  v_new_speaker := jsonb_build_object(
    'fid', p_fid,
    'username', p_username,
    'address', p_address,
    'joined_at', v_now,
    'last_seen', v_now
  );

  -- Add to speakers
  v_speakers := v_speakers || jsonb_build_array(v_new_speaker);

  -- Remove from listeners if present
  SELECT jsonb_agg(l) INTO v_listeners
    FROM jsonb_array_elements(v_listeners) AS l
    WHERE (l->>'fid')::bigint != p_fid;
  v_listeners := COALESCE(v_listeners, '[]'::jsonb);

  -- Persist
  UPDATE fishbowl_rooms
    SET current_speakers = v_speakers,
        current_listeners = v_listeners,
        last_active_at = v_now
    WHERE id = p_room_id
    RETURNING * INTO v_room;

  RETURN v_room;
END;
$$;


-- ----- fishbowl_leave_speaker -----
CREATE OR REPLACE FUNCTION fishbowl_leave_speaker(
  p_room_id UUID,
  p_fid BIGINT
)
RETURNS fishbowl_rooms
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room fishbowl_rooms;
  v_speakers jsonb;
  v_now timestamptz := now();
BEGIN
  SELECT * INTO v_room
    FROM fishbowl_rooms
    WHERE id = p_room_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room not found: %', p_room_id;
  END IF;

  -- Remove speaker with matching fid
  SELECT jsonb_agg(s) INTO v_speakers
    FROM jsonb_array_elements(v_room.current_speakers) AS s
    WHERE (s->>'fid')::bigint != p_fid;
  v_speakers := COALESCE(v_speakers, '[]'::jsonb);

  UPDATE fishbowl_rooms
    SET current_speakers = v_speakers,
        last_active_at = v_now
    WHERE id = p_room_id
    RETURNING * INTO v_room;

  RETURN v_room;
END;
$$;


-- ----- fishbowl_join_listener -----
CREATE OR REPLACE FUNCTION fishbowl_join_listener(
  p_room_id UUID,
  p_fid BIGINT,
  p_username TEXT
)
RETURNS fishbowl_rooms
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room fishbowl_rooms;
  v_listeners jsonb;
  v_now timestamptz := now();
  v_new_listener jsonb;
BEGIN
  SELECT * INTO v_room
    FROM fishbowl_rooms
    WHERE id = p_room_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room not found: %', p_room_id;
  END IF;

  v_listeners := v_room.current_listeners;

  -- Check if already a listener
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_listeners) AS l
    WHERE (l->>'fid')::bigint = p_fid
  ) THEN
    -- Already present, just update last_active_at and return
    UPDATE fishbowl_rooms
      SET last_active_at = v_now
      WHERE id = p_room_id
      RETURNING * INTO v_room;
    RETURN v_room;
  END IF;

  v_new_listener := jsonb_build_object(
    'fid', p_fid,
    'username', p_username,
    'joined_at', v_now,
    'last_seen', v_now
  );

  v_listeners := v_listeners || jsonb_build_array(v_new_listener);

  UPDATE fishbowl_rooms
    SET current_listeners = v_listeners,
        last_active_at = v_now
    WHERE id = p_room_id
    RETURNING * INTO v_room;

  RETURN v_room;
END;
$$;


-- ----- fishbowl_leave_listener -----
CREATE OR REPLACE FUNCTION fishbowl_leave_listener(
  p_room_id UUID,
  p_fid BIGINT
)
RETURNS fishbowl_rooms
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room fishbowl_rooms;
  v_listeners jsonb;
  v_now timestamptz := now();
BEGIN
  SELECT * INTO v_room
    FROM fishbowl_rooms
    WHERE id = p_room_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room not found: %', p_room_id;
  END IF;

  SELECT jsonb_agg(l) INTO v_listeners
    FROM jsonb_array_elements(v_room.current_listeners) AS l
    WHERE (l->>'fid')::bigint != p_fid;
  v_listeners := COALESCE(v_listeners, '[]'::jsonb);

  UPDATE fishbowl_rooms
    SET current_listeners = v_listeners,
        last_active_at = v_now
    WHERE id = p_room_id
    RETURNING * INTO v_room;

  RETURN v_room;
END;
$$;


-- ----- fishbowl_kick_speaker -----
CREATE OR REPLACE FUNCTION fishbowl_kick_speaker(
  p_room_id UUID,
  p_speaker_fid BIGINT,
  p_host_fid BIGINT
)
RETURNS fishbowl_rooms
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room fishbowl_rooms;
  v_speakers jsonb;
  v_listeners jsonb;
  v_kicked jsonb;
  v_now timestamptz := now();
BEGIN
  SELECT * INTO v_room
    FROM fishbowl_rooms
    WHERE id = p_room_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room not found: %', p_room_id;
  END IF;

  -- Verify caller is the host
  IF v_room.host_fid != p_host_fid THEN
    RAISE EXCEPTION 'Only the host (fid %) can kick speakers', v_room.host_fid;
  END IF;

  -- Find the speaker being kicked (to preserve their username for listener entry)
  SELECT s INTO v_kicked
    FROM jsonb_array_elements(v_room.current_speakers) AS s
    WHERE (s->>'fid')::bigint = p_speaker_fid
    LIMIT 1;

  -- Remove from speakers
  SELECT jsonb_agg(s) INTO v_speakers
    FROM jsonb_array_elements(v_room.current_speakers) AS s
    WHERE (s->>'fid')::bigint != p_speaker_fid;
  v_speakers := COALESCE(v_speakers, '[]'::jsonb);

  -- Add to listeners (remove first if somehow already there)
  SELECT jsonb_agg(l) INTO v_listeners
    FROM jsonb_array_elements(v_room.current_listeners) AS l
    WHERE (l->>'fid')::bigint != p_speaker_fid;
  v_listeners := COALESCE(v_listeners, '[]'::jsonb);

  v_listeners := v_listeners || jsonb_build_array(
    jsonb_build_object(
      'fid', p_speaker_fid,
      'username', COALESCE(v_kicked->>'username', 'unknown'),
      'joined_at', v_now,
      'last_seen', v_now
    )
  );

  UPDATE fishbowl_rooms
    SET current_speakers = v_speakers,
        current_listeners = v_listeners,
        last_active_at = v_now
    WHERE id = p_room_id
    RETURNING * INTO v_room;

  RETURN v_room;
END;
$$;


-- ----- fishbowl_rotate_speaker -----
CREATE OR REPLACE FUNCTION fishbowl_rotate_speaker(
  p_room_id UUID,
  p_new_fid BIGINT,
  p_new_username TEXT,
  p_old_fid BIGINT,
  p_host_fid BIGINT
)
RETURNS fishbowl_rooms
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room fishbowl_rooms;
  v_speakers jsonb;
  v_listeners jsonb;
  v_old_speaker jsonb;
  v_now timestamptz := now();
BEGIN
  SELECT * INTO v_room
    FROM fishbowl_rooms
    WHERE id = p_room_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room not found: %', p_room_id;
  END IF;

  -- Verify caller is the host
  IF v_room.host_fid != p_host_fid THEN
    RAISE EXCEPTION 'Only the host (fid %) can rotate speakers', v_room.host_fid;
  END IF;

  -- Find old speaker to preserve their username
  SELECT s INTO v_old_speaker
    FROM jsonb_array_elements(v_room.current_speakers) AS s
    WHERE (s->>'fid')::bigint = p_old_fid
    LIMIT 1;

  -- Remove old speaker from speakers
  SELECT jsonb_agg(s) INTO v_speakers
    FROM jsonb_array_elements(v_room.current_speakers) AS s
    WHERE (s->>'fid')::bigint != p_old_fid;
  v_speakers := COALESCE(v_speakers, '[]'::jsonb);

  -- Add new speaker to speakers
  v_speakers := v_speakers || jsonb_build_array(
    jsonb_build_object(
      'fid', p_new_fid,
      'username', p_new_username,
      'address', NULL,
      'joined_at', v_now,
      'last_seen', v_now
    )
  );

  -- Remove new speaker from listeners
  SELECT jsonb_agg(l) INTO v_listeners
    FROM jsonb_array_elements(v_room.current_listeners) AS l
    WHERE (l->>'fid')::bigint != p_new_fid;
  v_listeners := COALESCE(v_listeners, '[]'::jsonb);

  -- Add old speaker to listeners
  v_listeners := v_listeners || jsonb_build_array(
    jsonb_build_object(
      'fid', p_old_fid,
      'username', COALESCE(v_old_speaker->>'username', 'unknown'),
      'joined_at', v_now,
      'last_seen', v_now
    )
  );

  UPDATE fishbowl_rooms
    SET current_speakers = v_speakers,
        current_listeners = v_listeners,
        last_active_at = v_now
    WHERE id = p_room_id
    RETURNING * INTO v_room;

  RETURN v_room;
END;
$$;


-- ----- fishbowl_approve_hand -----
CREATE OR REPLACE FUNCTION fishbowl_approve_hand(
  p_room_id UUID,
  p_fid BIGINT,
  p_username TEXT,
  p_host_fid BIGINT
)
RETURNS fishbowl_rooms
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room fishbowl_rooms;
  v_speakers jsonb;
  v_listeners jsonb;
  v_hand_raises jsonb;
  v_speaker_count int;
  v_now timestamptz := now();
BEGIN
  SELECT * INTO v_room
    FROM fishbowl_rooms
    WHERE id = p_room_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room not found: %', p_room_id;
  END IF;

  -- Verify caller is the host
  IF v_room.host_fid != p_host_fid THEN
    RAISE EXCEPTION 'Only the host (fid %) can approve hand raises', v_room.host_fid;
  END IF;

  v_speakers := v_room.current_speakers;
  v_speaker_count := jsonb_array_length(v_speakers);

  -- Check capacity
  IF v_speaker_count >= v_room.hot_seat_count THEN
    RAISE EXCEPTION 'Room is full (% / % speakers)', v_speaker_count, v_room.hot_seat_count;
  END IF;

  -- Remove from hand_raises
  SELECT jsonb_agg(h) INTO v_hand_raises
    FROM jsonb_array_elements(v_room.hand_raises) AS h
    WHERE (h->>'fid')::bigint != p_fid;
  v_hand_raises := COALESCE(v_hand_raises, '[]'::jsonb);

  -- Remove from listeners if present
  SELECT jsonb_agg(l) INTO v_listeners
    FROM jsonb_array_elements(v_room.current_listeners) AS l
    WHERE (l->>'fid')::bigint != p_fid;
  v_listeners := COALESCE(v_listeners, '[]'::jsonb);

  -- Add to speakers
  v_speakers := v_speakers || jsonb_build_array(
    jsonb_build_object(
      'fid', p_fid,
      'username', p_username,
      'address', NULL,
      'joined_at', v_now,
      'last_seen', v_now
    )
  );

  UPDATE fishbowl_rooms
    SET current_speakers = v_speakers,
        current_listeners = v_listeners,
        hand_raises = v_hand_raises,
        last_active_at = v_now
    WHERE id = p_room_id
    RETURNING * INTO v_room;

  RETURN v_room;
END;
$$;


-- ----- fishbowl_heartbeat -----
CREATE OR REPLACE FUNCTION fishbowl_heartbeat(
  p_room_id UUID,
  p_fid BIGINT
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room fishbowl_rooms;
  v_speakers jsonb;
  v_listeners jsonb;
  v_now timestamptz := now();
  v_found boolean := false;
BEGIN
  SELECT * INTO v_room
    FROM fishbowl_rooms
    WHERE id = p_room_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  v_speakers := v_room.current_speakers;
  v_listeners := v_room.current_listeners;

  -- Try to update last_seen in speakers
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_speakers) AS s
    WHERE (s->>'fid')::bigint = p_fid
  ) THEN
    SELECT jsonb_agg(
      CASE
        WHEN (s->>'fid')::bigint = p_fid
        THEN s || jsonb_build_object('last_seen', v_now)
        ELSE s
      END
    ) INTO v_speakers
    FROM jsonb_array_elements(v_speakers) AS s;
    v_found := true;
  END IF;

  -- Try to update last_seen in listeners
  IF NOT v_found AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_listeners) AS l
    WHERE (l->>'fid')::bigint = p_fid
  ) THEN
    SELECT jsonb_agg(
      CASE
        WHEN (l->>'fid')::bigint = p_fid
        THEN l || jsonb_build_object('last_seen', v_now)
        ELSE l
      END
    ) INTO v_listeners
    FROM jsonb_array_elements(v_listeners) AS l;
    v_found := true;
  END IF;

  IF v_found THEN
    UPDATE fishbowl_rooms
      SET current_speakers = v_speakers,
          current_listeners = v_listeners,
          last_active_at = v_now
      WHERE id = p_room_id;
  END IF;

  RETURN v_found;
END;
$$;
