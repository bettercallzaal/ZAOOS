-- Agent config table
CREATE TABLE IF NOT EXISTS agent_config (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  brand text NOT NULL,
  wallet_address text NOT NULL DEFAULT '',
  max_daily_spend_usd numeric NOT NULL DEFAULT 5,
  max_single_trade_usd numeric NOT NULL DEFAULT 2,
  trading_enabled boolean NOT NULL DEFAULT false,
  buy_price_ceiling numeric NOT NULL DEFAULT 0.001,
  sell_price_floor numeric NOT NULL DEFAULT 0.00000005,
  content_purchase_budget_usd numeric NOT NULL DEFAULT 5,
  lp_allocation_pct numeric NOT NULL DEFAULT 10,
  cron_schedule text NOT NULL DEFAULT '0 6 * * *',
  allowed_contracts text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Agent events table
CREATE TABLE IF NOT EXISTS agent_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_name text NOT NULL,
  action text NOT NULL,
  token_in text,
  token_out text,
  amount_in numeric,
  amount_out numeric,
  usd_value numeric,
  tx_hash text,
  content_id text,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_events_agent ON agent_events(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_events_action ON agent_events(action);
CREATE INDEX IF NOT EXISTS idx_agent_events_created ON agent_events(created_at DESC);

-- Seed configs for 3 agents (wallets added later)
INSERT INTO agent_config (name, brand, cron_schedule, allowed_contracts)
VALUES
  ('VAULT', 'ZAO OS', '0 6 * * *', ARRAY[
    '0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07',
    '0x4ff4d349caa028bd069bbe85fa05253f96176741',
    '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    '0x4200000000000000000000000000000000000006'
  ]),
  ('BANKER', 'COC Concertz', '0 14 * * *', ARRAY[
    '0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07',
    '0x4ff4d349caa028bd069bbe85fa05253f96176741',
    '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    '0x4200000000000000000000000000000000000006'
  ]),
  ('DEALER', 'FISHBOWLZ', '0 22 * * *', ARRAY[
    '0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07',
    '0x4ff4d349caa028bd069bbe85fa05253f96176741',
    '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    '0x4200000000000000000000000000000000000006'
  ])
ON CONFLICT (name) DO NOTHING;

-- RLS: admin only
ALTER TABLE agent_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_events ENABLE ROW LEVEL SECURITY;
