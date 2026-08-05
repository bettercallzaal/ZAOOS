import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSessionData } from "@/lib/auth/session";
import { logger } from "@/lib/logger";

interface CoworkTask {
  id: string;
  legacy_id?: string;
  title: string;
  status?: string;
  owner?: string;
  legacy_owner?: string;
  due?: string;
  legacy_source?: string;
  project?: string;
}

interface TasksResponse {
  configured: boolean;
  message?: string;
  tasks?: CoworkTask[];
}

/**
 * GET /api/tasks/list
 *
 * Queries the COWORK_TRACKER Supabase project for tasks.
 * Returns gracefully if the tracker is not configured (env vars missing).
 *
 * Session required. The tracker is queried with its SERVICE ROLE key, which
 * bypasses RLS and returns every row of the internal task board (titles,
 * owners, sources). Without this guard the whole board is readable by any
 * anonymous caller on the internet - middleware only rate-limits, it does not
 * authenticate, and /api/tasks has no rate-limit entry either.
 *
 * Response:
 * - If configured: { configured: true, tasks: [...] }
 * - If not configured: { configured: false, message: "..." }
 */
export async function GET(): Promise<NextResponse<TasksResponse>> {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json(
        { configured: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const trackerUrl = process.env.COWORK_TRACKER_URL;
    const trackerKey = process.env.COWORK_TRACKER_SERVICE_ROLE_KEY;

    // Graceful degradation if env vars are missing
    if (!trackerUrl || !trackerKey) {
      return NextResponse.json({
        configured: false,
        message:
          "COWORK_TRACKER not configured - add COWORK_TRACKER_URL and COWORK_TRACKER_SERVICE_ROLE_KEY env vars to activate",
      });
    }

    // Create client for the separate cowork tracker Supabase project
    const coworkClient = createClient(trackerUrl, trackerKey);

    // Query the tasks table
    const { data, error } = await coworkClient.from("tasks").select(
      `
      id,
      legacy_id,
      title,
      status,
      owner,
      legacy_owner,
      due,
      legacy_source,
      project
    `,
    );

    if (error) {
      logger.error("Failed to query cowork tasks", { error });
      return NextResponse.json(
        {
          configured: true,
          message: `Query error: ${error.message}`,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      configured: true,
      tasks: (data || []) as CoworkTask[],
    });
  } catch (err) {
    logger.error("Error in /api/tasks/list", { error: err });
    return NextResponse.json(
      {
        configured: true,
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}