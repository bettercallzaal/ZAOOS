import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
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
 * Response:
 * - If configured: { configured: true, tasks: [...] }
 * - If not configured: { configured: false, message: "..." }
 */
export async function GET(): Promise<NextResponse<TasksResponse>> {
  try {
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