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

export interface QuotedCastData {
  hash: string;
  author: {
    fid: number;
    username: string;
    display_name: string;
    pfp_url: string;
  };
  text: string;
  timestamp: string;
  embeds?: { url?: string }[];
}

export interface CastEmbed {
  url?: string;
  cast?: QuotedCastData; // quote cast embed
  metadata?: {
    content_type?: string;
    _status?: string;
    image?: { width_px?: number; height_px?: number };
    video?: { streams?: { width_px?: number; height_px?: number }[] };
    html?: { ogTitle?: string; ogDescription?: string; ogImage?: { url?: string }[] };
  };
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
  reactions: {
    likes_count: number;
    recasts_count: number;
    likes: { fid: number }[];
    recasts: { fid: number }[];
  };
  parent_hash: string | null;
  embeds?: CastEmbed[];
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
