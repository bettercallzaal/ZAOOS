export interface AllowlistEntry {
  id: string;
  fid: number | null;
  wallet_address: string | null;
  real_name: string | null;
  ign: string | null;
  is_active: boolean;
  added_at: string;
  notes: string | null;
  display_name: string | null;
  pfp_url: string | null;
  username: string | null;
  custody_address: string | null;
  verified_addresses: string[] | null;
  ens_name: string | null;
  xmtp_address: string | null;
}

export interface SessionData {
  fid: number;
  walletAddress: string | null;
  authMethod: 'farcaster' | 'wallet';
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
  /** Origin of the cast inside ZAO OS — used to credit external curators on outgoing quote-casts. */
  _source?: 'sopha' | 'neynar';
  /** Curator attribution carried from the source feed. */
  _curators?: {
    fid?: number;
    username: string;
    display_name?: string;
    pfp_url?: string;
  }[];
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
    zid?: number | null;
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

