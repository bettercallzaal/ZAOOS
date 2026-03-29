import { supabase } from "../lib/supabase.js";
import { MCPError } from "../lib/errors.js";
import type { Proposal, ToolArgs } from "../types/index.js";

interface GetProposalsArgs extends ToolArgs {
  status?: "open" | "closed" | "all";
}

export async function getProposals(args: GetProposalsArgs) {
  const { status = "all" } = args;

  const validStatuses = ["open", "closed", "all"];
  if (!validStatuses.includes(status as string)) {
    throw new MCPError("status must be 'open', 'closed', or 'all'", "INVALID_ARGUMENT", 400);
  }

  let query = supabase
    .from("proposals")
    .select("id, title, status, votes_for, votes_against, created_at, ends_at, author_fid")
    .order("created_at", { ascending: false });

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await Promise.race([
    query,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new MCPError("Query timeout", "TIMEOUT", 504)), 10000)
    )
  ]);

  if (error) {
    throw new MCPError(`Failed to fetch proposals: ${error.message}`, "QUERY_ERROR", 500);
  }

  return { proposals: data as Proposal[] };
}
