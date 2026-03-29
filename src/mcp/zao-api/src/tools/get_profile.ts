import { supabase } from "../lib/supabase.js";
import { MCPError } from "../lib/errors.js";
import type { Profile, ToolArgs } from "../types/index.js";

interface GetProfileArgs extends ToolArgs {
  fid: string;
}

export async function getProfile(args: GetProfileArgs) {
  const { fid } = args;

  if (!fid || typeof fid !== "string") {
    throw new MCPError("fid is required and must be a string", "INVALID_ARGUMENT", 400);
  }

  const { data, error } = await Promise.race([
    supabase
      .from("profiles")
      .select("fid, username, display_name, bio, avatar_url, created_at")
      .eq("fid", fid)
      .single(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new MCPError("Query timeout", "TIMEOUT", 504)), 10000)
    )
  ]);

  if (error) {
    throw new MCPError(`Profile not found for fid: ${fid}`, "NOT_FOUND", 404);
  }

  return data as Profile;
}
