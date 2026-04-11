ALTER TABLE fishbowl_rooms ADD COLUMN IF NOT EXISTS token_gate_address text;
ALTER TABLE fishbowl_rooms ADD COLUMN IF NOT EXISTS token_gate_min_balance text DEFAULT '0';
ALTER TABLE fishbowl_rooms ADD COLUMN IF NOT EXISTS token_gate_chain_id integer DEFAULT 8453;
ALTER TABLE fishbowl_rooms ADD COLUMN IF NOT EXISTS token_gate_type text CHECK (token_gate_type IN ('erc20', 'erc721', 'erc1155'));
