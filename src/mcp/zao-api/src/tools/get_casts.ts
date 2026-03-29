import { supabase } from "../lib/supabase.js";
import { MCPError } from "../lib/errors.js";
import type { Cast, ToolArgs } from "../types/index.js";

interface GetCastsArgs extends ToolArgs {
  fid: string;
  limit?: number;
}

export async function getCasts(args: GetCastsArgs) {
  const { fid, limit = 20 } = args;

  if (!fid || typeof fid !== "string") {
    throw new MCPError("fid is required and must be a string", "INVALID_ARGUMENT", 400);
  }

  const safeLimit = Math.min(Math.max(1, Number(limit) || 20), 100);

  const { data, error } = await Promise.race([
    supabase
      .from("casts")
      .select("hash, text, timestamp, reactions, reply_count")
      .eq("fid", fid)
      .order("timestamp", { ascending: false })
      .limit(safeLimit),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new MCPError("Query timeout", "TIMEOUT", 504)), 10000)
    )
  ]);

  if (error) {
    throw new MCPError(`Failed to fetch casts: ${error.message}`, "QUERY_ERROR", 500);
  }

  return { casts: data as Cast[] };
}
