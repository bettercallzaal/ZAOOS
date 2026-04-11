-- Room gating: hosts can control who joins their room
-- Gate types: open (default), farcaster, token, invite, allowlist

-- Add gate columns to fishbowl_rooms
ALTER TABLE fishbowl_rooms ADD COLUMN IF NOT EXISTS gate_type text NOT NULL DEFAULT 'open';
ALTER TABLE fishbowl_rooms ADD COLUMN IF NOT EXISTS gate_config jsonb DEFAULT '{}';
-- gate_config examples:
-- open: {}
-- farcaster: {}  (just need a Farcaster account)
-- token: { "address": "0x...", "chain_id": 8453, "min_balance": "1" }
-- invite: { "max_uses": null }  (null = unlimited)
-- allowlist: { "fids": [123, 456], "wallets": ["0x..."] }

-- Invite links table
CREATE TABLE IF NOT EXISTS fishbowl_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES fishbowl_rooms(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  created_by bigint NOT NULL,
  max_uses integer,  -- null = unlimited
  use_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,  -- null = never expires
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fishbowl_invites_code ON fishbowl_invites(code);
CREATE INDEX IF NOT EXISTS idx_fishbowl_invites_room_id ON fishbowl_invites(room_id);

-- Invite redemptions table (track who used which invite)
CREATE TABLE IF NOT EXISTS fishbowl_invite_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id uuid NOT NULL REFERENCES fishbowl_invites(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES fishbowl_rooms(id) ON DELETE CASCADE,
  redeemed_by bigint NOT NULL,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(invite_id, redeemed_by)  -- each user can only redeem an invite once
);

CREATE INDEX IF NOT EXISTS idx_fishbowl_invite_redemptions_room ON fishbowl_invite_redemptions(room_id);

-- Room allowlist table (for allowlist gate type)
CREATE TABLE IF NOT EXISTS fishbowl_room_allowlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES fishbowl_rooms(id) ON DELETE CASCADE,
  fid bigint,
  wallet text,
  added_by bigint NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(room_id, fid),
  CHECK (fid IS NOT NULL OR wallet IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_fishbowl_room_allowlist_room ON fishbowl_room_allowlist(room_id);

-- Enable RLS
ALTER TABLE fishbowl_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE fishbowl_invite_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fishbowl_room_allowlist ENABLE ROW LEVEL SECURITY;

-- RLS policies: allow all via service role (API routes use supabaseAdmin)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'fishbowl_invites_service') THEN
    CREATE POLICY fishbowl_invites_service ON fishbowl_invites FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'fishbowl_invite_redemptions_service') THEN
    CREATE POLICY fishbowl_invite_redemptions_service ON fishbowl_invite_redemptions FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'fishbowl_room_allowlist_service') THEN
    CREATE POLICY fishbowl_room_allowlist_service ON fishbowl_room_allowlist FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Function to check if a user can join a gated room
CREATE OR REPLACE FUNCTION fishbowl_check_gate(
  p_room_id uuid,
  p_fid bigint,
  p_wallet text DEFAULT NULL,
  p_invite_code text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_room record;
  v_invite record;
  v_allowed boolean := false;
  v_reason text := 'Access denied';
BEGIN
  -- Get room gate config
  SELECT gate_type, gate_config, host_fid
  INTO v_room
  FROM fishbowl_rooms
  WHERE id = p_room_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Room not found');
  END IF;

  -- Host always allowed
  IF v_room.host_fid = p_fid THEN
    RETURN jsonb_build_object('allowed', true, 'reason', 'Host');
  END IF;

  CASE v_room.gate_type
    WHEN 'open' THEN
      v_allowed := true;
      v_reason := 'Open room';

    WHEN 'farcaster' THEN
      -- Just need a FID (which they have if they're authed)
      v_allowed := (p_fid IS NOT NULL AND p_fid > 0);
      v_reason := CASE WHEN v_allowed THEN 'Farcaster verified' ELSE 'Farcaster account required' END;

    WHEN 'token' THEN
      -- Token check happens in the API route (needs external RPC call)
      -- This function just returns that token check is needed
      RETURN jsonb_build_object('allowed', false, 'reason', 'Token check required', 'gate_type', 'token', 'gate_config', v_room.gate_config);

    WHEN 'invite' THEN
      IF p_invite_code IS NOT NULL THEN
        -- Check invite code
        SELECT * INTO v_invite
        FROM fishbowl_invites
        WHERE code = p_invite_code
          AND room_id = p_room_id
          AND (max_uses IS NULL OR use_count < max_uses)
          AND (expires_at IS NULL OR expires_at > now());

        IF FOUND THEN
          -- Check if already redeemed by this user
          IF NOT EXISTS (
            SELECT 1 FROM fishbowl_invite_redemptions
            WHERE invite_id = v_invite.id AND redeemed_by = p_fid
          ) THEN
            -- Redeem the invite
            INSERT INTO fishbowl_invite_redemptions (invite_id, room_id, redeemed_by)
            VALUES (v_invite.id, p_room_id, p_fid);
            UPDATE fishbowl_invites SET use_count = use_count + 1 WHERE id = v_invite.id;
          END IF;
          v_allowed := true;
          v_reason := 'Invite accepted';
        ELSE
          v_reason := 'Invalid or expired invite';
        END IF;
      ELSE
        -- Check if user was previously invited
        IF EXISTS (
          SELECT 1 FROM fishbowl_invite_redemptions
          WHERE room_id = p_room_id AND redeemed_by = p_fid
        ) THEN
          v_allowed := true;
          v_reason := 'Previously invited';
        ELSE
          v_reason := 'Invite required';
        END IF;
      END IF;

    WHEN 'allowlist' THEN
      -- Check FID or wallet in allowlist
      IF EXISTS (
        SELECT 1 FROM fishbowl_room_allowlist
        WHERE room_id = p_room_id
          AND (fid = p_fid OR (p_wallet IS NOT NULL AND lower(wallet) = lower(p_wallet)))
      ) THEN
        v_allowed := true;
        v_reason := 'On allowlist';
      ELSE
        v_reason := 'Not on allowlist';
      END IF;

    ELSE
      v_allowed := true;
      v_reason := 'Unknown gate type, defaulting to open';
  END CASE;

  RETURN jsonb_build_object('allowed', v_allowed, 'reason', v_reason);
END;
$$;
