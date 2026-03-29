import { supabase } from "../lib/supabase.js";
import { MCPError } from "../lib/errors.js";
import type { SearchCast, ToolArgs } from "../types/index.js";

interface SearchCastsArgs extends ToolArgs {
  query: string;
}

export async function searchCasts(args: SearchCastsArgs) {
  const { query } = args;

  if (!query || typeof query !== "string") {
    throw new MCPError("query is required and must be a string", "INVALID_ARGUMENT", 400);
  }

  const { data, error, count } = await Promise.race([
    supabase
      .from("casts")
      .select("fid, username, text, timestamp")
      .ilike("text", `%${query}%`)
      .order("timestamp", { ascending: false })
      .limit(50),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new MCPError("Query timeout", "TIMEOUT", 504)), 10000)
    )
  ]);

  if (error) {
    throw new MCPError(`Failed to search casts: ${error.message}`, "QUERY_ERROR", 500);
  }

  // Add a placeholder relevance_score (in production, this could be computed by Supabase full-text search)
  const casts: SearchCast[] = data.map((c: any) => ({
    fid: c.fid,
    username: c.username,
    text: c.text,
    timestamp: c.timestamp,
    relevance_score: 0.9
  }));

  return { casts, total: count || casts.length };
}
