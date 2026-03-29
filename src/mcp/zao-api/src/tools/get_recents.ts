import { supabase } from "../lib/supabase.js";
import { MCPError } from "../lib/errors.js";
import type { RecentCast, ToolArgs } from "../types/index.js";

interface GetRecentsArgs extends ToolArgs {
  hours?: number;
}

export async function getRecents(args: GetRecentsArgs) {
  const { hours = 24 } = args;

  const safeHours = Math.min(Math.max(1, Number(hours) || 24), 168);

  const { data, error, count } = await Promise.race([
    supabase
      .from("casts")
      .select("fid, username, text, timestamp, reactions")
      .gte("timestamp", new Date(Date.now() - safeHours * 60 * 60 * 1000).toISOString())
      .order("timestamp", { ascending: false }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new MCPError("Query timeout", "TIMEOUT", 504)), 10000)
    )
  ]);

  if (error) {
    throw new MCPError(`Failed to fetch recents: ${error.message}`, "QUERY_ERROR", 500);
  }

  return { casts: data as RecentCast[], count: count || data.length };
}
