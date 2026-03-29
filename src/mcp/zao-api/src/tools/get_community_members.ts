import { supabase } from "../lib/supabase.js";
import { MCPError } from "../lib/errors.js";
import type { CommunityMember, ToolArgs } from "../types/index.js";

interface GetCommunityMembersArgs extends ToolArgs {
  limit?: number;
}

export async function getCommunityMembers(args: GetCommunityMembersArgs) {
  const { limit = 20 } = args;

  const safeLimit = Math.min(Math.max(1, Number(limit) || 20), 100);

  const { data, error, count } = await Promise.race([
    supabase
      .from("profiles")
      .select("fid, username, display_name, role, joined_at, is_active", { count: "exact" })
      .eq("is_active", true)
      .order("joined_at", { ascending: false })
      .limit(safeLimit),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new MCPError("Query timeout", "TIMEOUT", 504)), 10000)
    )
  ]);

  if (error) {
    throw new MCPError(`Failed to fetch community members: ${error.message}`, "QUERY_ERROR", 500);
  }

  // Fetch respect scores to enrich the member data
  interface ProfileRow { fid: string; username: string; display_name: string; role: string; joined_at: string; is_active: boolean }
  interface ScoreRow { fid: string; respect_score: number }

  const fids = (data as ProfileRow[]).map((p) => p.fid);
  const { data: scores } = await supabase
    .from("respect_scores")
    .select("fid, respect_score")
    .in("fid", fids);

  const scoreMap = new Map((scores as ScoreRow[] | null)?.map((s) => [s.fid, s.respect_score]) || []);

  const members: CommunityMember[] = (data as ProfileRow[]).map((p) => ({
    fid: p.fid,
    username: p.username,
    display_name: p.display_name,
    respect_score: scoreMap.get(p.fid) || 0,
    role: p.role || "member",
    joined_at: p.joined_at,
    is_active: p.is_active
  }));

  // Sort by respect_score descending
  members.sort((a, b) => b.respect_score - a.respect_score);

  return { members, total: count || members.length };
}
