import { supabase } from "../lib/supabase.js";
import { MCPError } from "../lib/errors.js";
import type { RespectScore, ToolArgs } from "../types/index.js";

interface GetRespectScoreArgs extends ToolArgs {
  fid: string;
}

export async function getRespectScore(args: GetRespectScoreArgs) {
  const { fid } = args;

  if (!fid || typeof fid !== "string") {
    throw new MCPError("fid is required and must be a string", "INVALID_ARGUMENT", 400);
  }

  const { data, error } = await Promise.race([
    supabase
      .from("respect_scores")
      .select("fid, respect_score, rank, weekly_delta, all_time_total")
      .eq("fid", fid)
      .single(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new MCPError("Query timeout", "TIMEOUT", 504)), 10000)
    )
  ]);

  if (error) {
    throw new MCPError(`Respect score not found for fid: ${fid}`, "NOT_FOUND", 404);
  }

  return data as RespectScore;
}
