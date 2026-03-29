export interface Profile {
  fid: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  created_at: string;
}

export interface Cast {
  hash: string;
  text: string;
  timestamp: string;
  reactions: { likes: number; recasts: number };
  reply_count: number;
}

export interface RespectScore {
  fid: string;
  respect_score: number;
  rank: number;
  weekly_delta: number;
  all_time_total: number;
}

export interface CommunityMember {
  fid: string;
  username: string;
  display_name: string;
  respect_score: number;
  role: string;
  joined_at: string;
  is_active: boolean;
}

export interface RecentCast {
  fid: string;
  username: string;
  text: string;
  timestamp: string;
  reactions: { likes: number };
}

export interface SearchCast {
  fid: string;
  username: string;
  text: string;
  timestamp: string;
  relevance_score: number;
}

export interface AudioRoom {
  id: string;
  title: string;
  host_fid: string;
  started_at: string;
  ended_at: string | null;
  participant_count: number;
  max_participants: number;
}

export interface Proposal {
  id: string;
  title: string;
  status: string;
  votes_for: number;
  votes_against: number;
  created_at: string;
  ends_at: string | null;
  author_fid: string;
}

export interface ToolArgs {
  [key: string]: unknown;
}
