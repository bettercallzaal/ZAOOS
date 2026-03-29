import { supabase } from "../lib/supabase.js";
import { MCPError } from "../lib/errors.js";
import type { AudioRoom, ToolArgs } from "../types/index.js";

interface GetRoomHistoryArgs extends ToolArgs {
  limit?: number;
}

export async function getRoomHistory(args: GetRoomHistoryArgs) {
  const { limit = 10 } = args;

  const safeLimit = Math.min(Math.max(1, Number(limit) || 10), 50);

  const { data, error } = await Promise.race([
    supabase
      .from("audio_rooms")
      .select("id, title, host_fid, started_at, ended_at, participant_count, max_participants")
      .order("started_at", { ascending: false })
      .limit(safeLimit),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new MCPError("Query timeout", "TIMEOUT", 504)), 10000)
    )
  ]);

  if (error) {
    throw new MCPError(`Failed to fetch room history: ${error.message}`, "QUERY_ERROR", 500);
  }

  return { rooms: data as AudioRoom[] };
}
