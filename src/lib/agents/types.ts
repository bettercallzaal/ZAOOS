export type AgentName = 'VAULT' | 'BANKER' | 'DEALER';

export type AgentAction =
  | 'buy_zabal'
  | 'sell_zabal'
  | 'buy_sang'
  | 'buy_content'
  | 'list_content'
  | 'add_lp'
  | 'report';

export interface AgentConfig {
  id: string;
  name: AgentName;
  brand: string;
  wallet_address: string;
  max_daily_spend_usd: number;
  max_single_trade_usd: number;
  trading_enabled: boolean;
  buy_price_ceiling: number;
  sell_price_floor: number;
  content_purchase_budget_usd: number;
  lp_allocation_pct: number;
  cron_schedule: string;
  allowed_contracts: string[];
  created_at: string;
  updated_at: string;
}

export interface AgentEvent {
  id: string;
  agent_name: AgentName;
  action: AgentAction;
  token_in: string | null;
  token_out: string | null;
  amount_in: number | null;
  amount_out: number | null;
  usd_value: number | null;
  tx_hash: string | null;
  content_id: string | null;
  status: 'pending' | 'success' | 'failed';
  error_message: string | null;
  created_at: string;
}

// Base chain token addresses
export const TOKENS = {
  ZABAL: '0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07',
  SANG: '0x4ff4d349caa028bd069bbe85fa05253f96176741',
  WETH: '0x4200000000000000000000000000000000000006',
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
} as const;

export const BASE_CHAIN_ID = 8453;

// Day-of-week action schedules (0=Sunday)
export const VAULT_SCHEDULE: Record<number, AgentAction> = {
  0: 'report',       // Sunday
  1: 'buy_zabal',    // Monday
  2: 'buy_sang',     // Tuesday
  3: 'buy_content',  // Wednesday
  4: 'buy_zabal',    // Thursday
  5: 'buy_content',  // Friday
  6: 'add_lp',       // Saturday
};

export const BURN_ADDRESS = '0x000000000000000000000000000000000000dEaD';
export const BURN_PCT = 0.01; // 1% of every buy

export const ZABAL_STAKING_CONTRACT = process.env.NEXT_PUBLIC_ZABAL_STAKING_CONTRACT || '';

export const BANKER_SCHEDULE: Record<number, AgentAction> = {
  0: 'report',
  1: 'buy_zabal',
  2: 'buy_content',
  3: 'buy_zabal',
  4: 'buy_content',
  5: 'buy_zabal',
  6: 'buy_sang',
};

export const DEALER_SCHEDULE: Record<number, AgentAction> = {
  0: 'report',
  1: 'buy_content',
  2: 'buy_zabal',
  3: 'buy_content',
  4: 'buy_sang',
  5: 'buy_zabal',
  6: 'buy_zabal',
};
