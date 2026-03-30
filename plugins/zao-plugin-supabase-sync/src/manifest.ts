const manifest = {
  id: "zao.supabase-sync",
  apiVersion: 1,
  version: "0.1.0",
  displayName: "ZAO Supabase Sync",
  description:
    "Event-driven bidirectional sync between Paperclip agents and ZAO OS Supabase. Inbound: DB changes trigger agent actions. Outbound: agents write decisions to Supabase.",
  author: "ZAO <team@zaoos.com>",
  categories: ["connector"] as const,

  capabilities: [
    "agent.tools.register",
    "http.outbound",
    "events.subscribe",
    "state.readwrite",
  ],

  entrypoints: {
    worker: "./dist/worker.js",
  },

  instanceConfigSchema: {
    type: "object" as const,
    properties: {
      supabaseUrl: {
        type: "string" as const,
        description: "Supabase project URL (NEXT_PUBLIC_SUPABASE_URL)",
      },
      supabaseServiceRoleKey: {
        type: "string" as const,
        description:
          "Supabase service role key for server-side operations (secret reference)",
      },
      watchedTables: {
        type: "array" as const,
        items: { type: "string" as const },
        description:
          "Tables to watch for changes via polling (e.g. ['community_issues', 'proposals', 'song_submissions'])",
        default: [
          "community_issues",
          "proposals",
          "song_submissions",
        ],
      },
      pollIntervalSec: {
        type: "number" as const,
        description:
          "How often to poll watched tables for changes (seconds). Default: 60",
        default: 60,
      },
    },
    required: ["supabaseUrl", "supabaseServiceRoleKey"],
  },

  tools: [
    {
      name: "supabase-query",
      displayName: "Query Supabase Table",
      description:
        "Read rows from a Supabase table with optional filters, ordering, and pagination. Use for inspecting ZAO OS data.",
      parametersSchema: {
        type: "object" as const,
        properties: {
          table: {
            type: "string" as const,
            description: "Table name (e.g. 'proposals', 'songs', 'users')",
          },
          select: {
            type: "string" as const,
            description:
              "Columns to select (PostgREST syntax, e.g. 'id,title,status' or '*'). Default: '*'",
          },
          filters: {
            type: "array" as const,
            items: {
              type: "object" as const,
              properties: {
                column: { type: "string" as const },
                operator: {
                  type: "string" as const,
                  description:
                    "PostgREST operator: eq, neq, gt, gte, lt, lte, like, ilike, in, is",
                },
                value: { type: "string" as const },
              },
              required: ["column", "operator", "value"],
            },
            description: "Array of filter conditions",
          },
          order: {
            type: "string" as const,
            description:
              "Order clause (e.g. 'created_at.desc' or 'title.asc')",
          },
          limit: {
            type: "number" as const,
            description: "Max rows to return (default 25, max 100)",
          },
        },
        required: ["table"],
      },
    },
    {
      name: "supabase-upsert",
      displayName: "Upsert to Supabase Table",
      description:
        "Insert or update rows in a Supabase table. Use for writing agent decisions, status updates, or syncing data back to ZAO OS.",
      parametersSchema: {
        type: "object" as const,
        properties: {
          table: {
            type: "string" as const,
            description: "Table name",
          },
          rows: {
            type: "array" as const,
            items: { type: "object" as const },
            description: "Array of row objects to upsert",
          },
          onConflict: {
            type: "string" as const,
            description:
              "Conflict resolution column(s) for upsert (e.g. 'id'). If omitted, performs insert.",
          },
        },
        required: ["table", "rows"],
      },
    },
    {
      name: "supabase-rpc",
      displayName: "Call Supabase RPC Function",
      description:
        "Call a PostgreSQL function (RPC) on Supabase. Useful for custom queries, aggregations, or stored procedures.",
      parametersSchema: {
        type: "object" as const,
        properties: {
          functionName: {
            type: "string" as const,
            description: "Name of the PostgreSQL function to call",
          },
          params: {
            type: "object" as const,
            description: "Parameters to pass to the function",
          },
        },
        required: ["functionName"],
      },
    },
    {
      name: "supabase-changes",
      displayName: "Get Recent Changes",
      description:
        "Get recent changes from watched Supabase tables since the last poll. Returns new/updated rows that agents can act on.",
      parametersSchema: {
        type: "object" as const,
        properties: {
          table: {
            type: "string" as const,
            description:
              "Specific table to check (omit to check all watched tables)",
          },
          since: {
            type: "string" as const,
            description:
              "ISO timestamp to check changes since (omit to use last poll cursor)",
          },
        },
      },
    },
    {
      name: "supabase-schema",
      displayName: "Inspect Table Schema",
      description:
        "Get column names and types for a Supabase table. Useful for understanding data structure before querying.",
      parametersSchema: {
        type: "object" as const,
        properties: {
          table: {
            type: "string" as const,
            description: "Table name to inspect",
          },
        },
        required: ["table"],
      },
    },
  ],

  jobs: [
    {
      name: "poll-changes",
      displayName: "Poll Supabase Changes",
      description:
        "Periodically polls watched tables for new/updated rows and stores change events for agent consumption.",
      schedule: "*/1 * * * *",
    },
  ],
};

export default manifest;
