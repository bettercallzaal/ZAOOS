export interface AllowlistEntry {
  id: string;
  fid: number | null;
  wallet_address: string | null;
  real_name: string | null;
  ign: string | null;
  is_active: boolean;
  added_at: string;
  notes: string | null;
}

export interface SessionData {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  signerUuid: string | null;
  isAdmin: boolean;
}

export interface HiddenMessage {
  id: string;
  cast_hash: string;
  hidden_by_fid: number;
  reason: string | null;
  hidden_at: string;
}

export interface Cast {
  hash: string;
  author: {
    fid: number;
    username: string;
    display_name: string;
    pfp_url: string;
  };
  text: string;
  timestamp: string;
  replies: { count: number };
  parent_hash: string | null;
}

export interface FarcasterUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  custody_address: string;
  verified_addresses: {
    eth_addresses: string[];
  };
}
