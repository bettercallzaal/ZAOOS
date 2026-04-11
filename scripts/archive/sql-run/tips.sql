CREATE TABLE IF NOT EXISTS tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid,
  sender_fid integer NOT NULL,
  recipient_fid integer NOT NULL,
  amount text NOT NULL,
  currency text DEFAULT 'ETH',
  chain text DEFAULT 'base',
  tx_hash text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tips_room ON tips(room_id);
CREATE INDEX IF NOT EXISTS idx_tips_recipient ON tips(recipient_fid);
