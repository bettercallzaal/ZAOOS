import { definePlugin, runWorker } from "@paperclipai/plugin-sdk";
import type { ScopeKey, PluginJobContext, ToolRunContext, ToolResult } from "@paperclipai/plugin-sdk";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PluginConfig {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  watchedTables: string[];
  pollIntervalSec: number;
}

interface Filter {
  column: string;
  operator: string;
  value: string;
}

interface ChangeRecord {
  table: string;
  rows: Record<string, unknown>[];
  detectedAt: string;
}

// ---------------------------------------------------------------------------
// Supabase REST helpers (PostgREST via service role key)
// ---------------------------------------------------------------------------

function restUrl(config: PluginConfig, path: string): string {
  return `${config.supabaseUrl}/rest/v1/${path}`;
}

function restHeaders(config: PluginConfig): Record<string, string> {
  return {
    apikey: config.supabaseServiceRoleKey,
    Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

function buildFilterString(filters: Filter[]): string {
  return filters
    .map((f) => {
      if (f.operator === "in") {
        return `${f.column}=in.(${f.value})`;
      }
      return `${f.column}=${f.operator}.${f.value}`;
    })
    .join("&");
}

async function supabaseGet(
  config: PluginConfig,
  table: string,
  opts: {
    select?: string;
    filters?: Filter[];
    order?: string;
    limit?: number;
  } = {},
): Promise<{ data: Record<string, unknown>[] | null; error: string | null }> {
  const params = new URLSearchParams();
  params.set("select", opts.select ?? "*");
  if (opts.order) params.set("order", opts.order);
  if (opts.limit) params.set("limit", String(Math.min(opts.limit, 100)));

  let filterStr = "";
  if (opts.filters?.length) {
    filterStr = "&" + buildFilterString(opts.filters);
  }

  const url = `${restUrl(config, table)}?${params.toString()}${filterStr}`;
  const res = await fetch(url, { headers: restHeaders(config) });

  if (!res.ok) {
    const body = await res.text();
    return { data: null, error: `${res.status}: ${body}` };
  }

  const data = (await res.json()) as Record<string, unknown>[];
  return { data, error: null };
}

async function supabaseUpsert(
  config: PluginConfig,
  table: string,
  rows: Record<string, unknown>[],
  onConflict?: string,
): Promise<{ data: Record<string, unknown>[] | null; error: string | null }> {
  const headers = restHeaders(config);
  if (onConflict) {
    headers["Prefer"] = "resolution=merge-duplicates,return=representation";
  }

  const url = onConflict
    ? `${restUrl(config, table)}?on_conflict=${onConflict}`
    : restUrl(config, table);

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(rows),
  });

  if (!res.ok) {
    const body = await res.text();
    return { data: null, error: `${res.status}: ${body}` };
  }

  const data = (await res.json()) as Record<string, unknown>[];
  return { data, error: null };
}

async function supabaseRpc(
  config: PluginConfig,
  functionName: string,
  params?: Record<string, unknown>,
): Promise<{ data: unknown; error: string | null }> {
  const res = await fetch(restUrl(config, `rpc/${functionName}`), {
    method: "POST",
    headers: restHeaders(config),
    body: params ? JSON.stringify(params) : "{}",
  });

  if (!res.ok) {
    const body = await res.text();
    return { data: null, error: `${res.status}: ${body}` };
  }

  const data: unknown = await res.json();
  return { data, error: null };
}

// ---------------------------------------------------------------------------
// Table schema introspection
// ---------------------------------------------------------------------------

async function getTableSchema(
  config: PluginConfig,
  table: string,
): Promise<{
  columns: { name: string; type: string; nullable: boolean }[];
  error: string | null;
}> {
  const url = `${restUrl(config, table)}?select=*&limit=0`;
  const res = await fetch(url, {
    method: "HEAD",
    headers: restHeaders(config),
  });

  if (!res.ok) {
    return { columns: [], error: `Table '${table}' not accessible: ${res.status}` };
  }

  // Try the OpenAPI spec for detailed types
  const specRes = await fetch(`${config.supabaseUrl}/rest/v1/?apikey=${config.supabaseServiceRoleKey}`, {
    headers: { Accept: "application/openapi+json" },
  });

  if (specRes.ok) {
    const spec = (await specRes.json()) as {
      definitions?: Record<
        string,
        { properties?: Record<string, { type?: string; format?: string; description?: string }> }
      >;
    };
    const tableDef = spec.definitions?.[table];
    if (tableDef?.properties) {
      const columns = Object.entries(tableDef.properties).map(
        ([name, col]) => ({
          name,
          type: col.format ?? col.type ?? "unknown",
          nullable: true,
        }),
      );
      return { columns, error: null };
    }
  }

  // Fallback: infer from sample row
  const sampleRes = await fetch(`${restUrl(config, table)}?select=*&limit=1`, {
    headers: restHeaders(config),
  });

  if (sampleRes.ok) {
    const rows = (await sampleRes.json()) as Record<string, unknown>[];
    if (rows.length > 0) {
      const columns = Object.entries(rows[0]).map(([name, value]) => ({
        name,
        type: value === null ? "unknown" : typeof value,
        nullable: true,
      }));
      return { columns, error: null };
    }
  }

  return {
    columns: [],
    error: `Table '${table}' is empty and schema introspection unavailable.`,
  };
}

// ---------------------------------------------------------------------------
// State helpers — wrap string keys into ScopeKey
// ---------------------------------------------------------------------------

function cursorKey(table: string): ScopeKey {
  return {
    scopeKind: "instance",
    namespace: "cursors",
    stateKey: table,
  };
}

function stateKey(key: string): ScopeKey {
  return {
    scopeKind: "instance",
    namespace: "default",
    stateKey: key,
  };
}

// ---------------------------------------------------------------------------
// Change detection (poll-based)
// ---------------------------------------------------------------------------

interface StateClient {
  get(input: ScopeKey): Promise<unknown>;
  set(input: ScopeKey, value: unknown): Promise<void>;
}

async function detectChanges(
  config: PluginConfig,
  state: StateClient,
  table: string,
  since?: string,
): Promise<ChangeRecord | null> {
  const key = cursorKey(table);
  const lastSeen =
    since ?? ((await state.get(key)) as string | null) ?? new Date(0).toISOString();

  // Try updated_at first, fall back to created_at
  const { data, error } = await supabaseGet(config, table, {
    filters: [{ column: "updated_at", operator: "gt", value: lastSeen }],
    order: "updated_at.asc",
    limit: 100,
  });

  if (error) {
    // Retry with created_at if updated_at doesn't exist
    const fallback = await supabaseGet(config, table, {
      filters: [{ column: "created_at", operator: "gt", value: lastSeen }],
      order: "created_at.asc",
      limit: 100,
    });

    if (fallback.error || !fallback.data?.length) return null;

    const lastRow = fallback.data[fallback.data.length - 1];
    const newCursor = (lastRow.created_at as string) ?? new Date().toISOString();
    await state.set(key, newCursor);

    return {
      table,
      rows: fallback.data,
      detectedAt: new Date().toISOString(),
    };
  }

  if (!data?.length) return null;

  const lastRow = data[data.length - 1];
  const newCursor = (lastRow.updated_at as string) ?? new Date().toISOString();
  await state.set(key, newCursor);

  return {
    table,
    rows: data,
    detectedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Plugin definition
// ---------------------------------------------------------------------------

const plugin = definePlugin({
  async setup(ctx) {
    const rawConfig = (await ctx.config.get()) as Record<string, unknown>;
    const config: PluginConfig = {
      supabaseUrl: rawConfig.supabaseUrl as string,
      supabaseServiceRoleKey: rawConfig.supabaseServiceRoleKey as string,
      watchedTables: (rawConfig.watchedTables as string[]) ?? [
        "community_issues",
        "proposals",
        "song_submissions",
      ],
      pollIntervalSec: (rawConfig.pollIntervalSec as number) ?? 60,
    };

    if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
      ctx.logger.error(
        "Missing required config: supabaseUrl and supabaseServiceRoleKey",
      );
      return;
    }

    // ------------------------------------------------------------------
    // Tool: supabase-query
    // ------------------------------------------------------------------
    ctx.tools.register(
      "supabase-query",
      {
        displayName: "Query Supabase Table",
        description:
          "Read rows from a Supabase table with optional filters, ordering, and pagination.",
        parametersSchema: {
          type: "object" as const,
          properties: {
            table: { type: "string" as const, description: "Table name" },
            select: { type: "string" as const, description: "Columns to select (PostgREST syntax). Default: '*'" },
            filters: { type: "array" as const, items: { type: "object" as const }, description: "Array of {column, operator, value} filters" },
            order: { type: "string" as const, description: "Order clause (e.g. 'created_at.desc')" },
            limit: { type: "number" as const, description: "Max rows (default 25, max 100)" },
          },
          required: ["table"],
        },
      },
      async (rawParams: unknown, _runCtx: ToolRunContext): Promise<ToolResult> => {
        const params = rawParams as {
          table: string;
          select?: string;
          filters?: Filter[];
          order?: string;
          limit?: number;
        };
        const { data, error } = await supabaseGet(config, params.table, {
          select: params.select,
          filters: params.filters,
          order: params.order,
          limit: params.limit ?? 25,
        });

        if (error) {
          return { content: `Error querying '${params.table}': ${error}` };
        }

        if (!data?.length) {
          return {
            content: `No rows found in '${params.table}' matching the given filters.`,
            data: { rows: [], count: 0 },
          };
        }

        const preview = data.slice(0, 5);
        const lines = preview.map(
          (row) =>
            "- " +
            Object.entries(row)
              .slice(0, 6)
              .map(([k, v]) => `**${k}:** ${JSON.stringify(v)}`)
              .join(" | "),
        );

        return {
          content: [
            `**${params.table}** — ${data.length} row(s) returned:`,
            "",
            ...lines,
            data.length > 5 ? `\n...and ${data.length - 5} more` : "",
          ].join("\n"),
          data: { rows: data, count: data.length },
        };
      },
    );

    // ------------------------------------------------------------------
    // Tool: supabase-upsert
    // ------------------------------------------------------------------
    ctx.tools.register(
      "supabase-upsert",
      {
        displayName: "Upsert to Supabase Table",
        description:
          "Insert or update rows in a Supabase table. Use for writing agent decisions back to ZAO OS.",
        parametersSchema: {
          type: "object" as const,
          properties: {
            table: { type: "string" as const, description: "Table name" },
            rows: { type: "array" as const, items: { type: "object" as const }, description: "Row objects to upsert" },
            onConflict: { type: "string" as const, description: "Conflict column(s) for upsert (e.g. 'id')" },
          },
          required: ["table", "rows"],
        },
      },
      async (rawParams: unknown, _runCtx: ToolRunContext): Promise<ToolResult> => {
        const params = rawParams as {
          table: string;
          rows: Record<string, unknown>[];
          onConflict?: string;
        };

        if (!params.rows?.length) {
          return { content: "No rows provided to upsert." };
        }

        if (params.rows.length > 50) {
          return { content: "Too many rows (max 50 per call). Batch your writes." };
        }

        const { data, error } = await supabaseUpsert(
          config,
          params.table,
          params.rows,
          params.onConflict,
        );

        if (error) {
          return { content: `Error upserting to '${params.table}': ${error}` };
        }

        return {
          content: `Successfully upserted ${data?.length ?? params.rows.length} row(s) to '${params.table}'.`,
          data: { rows: data, count: data?.length ?? 0 },
        };
      },
    );

    // ------------------------------------------------------------------
    // Tool: supabase-rpc
    // ------------------------------------------------------------------
    ctx.tools.register(
      "supabase-rpc",
      {
        displayName: "Call Supabase RPC Function",
        description:
          "Call a PostgreSQL function (RPC) on Supabase for custom queries or stored procedures.",
        parametersSchema: {
          type: "object" as const,
          properties: {
            functionName: { type: "string" as const, description: "PostgreSQL function name" },
            params: { type: "object" as const, description: "Parameters to pass" },
          },
          required: ["functionName"],
        },
      },
      async (rawParams: unknown, _runCtx: ToolRunContext): Promise<ToolResult> => {
        const params = rawParams as { functionName: string; params?: Record<string, unknown> };
        const { data, error } = await supabaseRpc(
          config,
          params.functionName,
          params.params,
        );

        if (error) {
          return { content: `Error calling RPC '${params.functionName}': ${error}` };
        }

        const content =
          typeof data === "object"
            ? JSON.stringify(data, null, 2)
            : String(data);

        return {
          content: `**RPC ${params.functionName}** result:\n\`\`\`json\n${content}\n\`\`\``,
          data: { result: data },
        };
      },
    );

    // ------------------------------------------------------------------
    // Tool: supabase-changes
    // ------------------------------------------------------------------
    ctx.tools.register(
      "supabase-changes",
      {
        displayName: "Get Recent Changes",
        description:
          "Get recent changes from watched Supabase tables since the last poll.",
        parametersSchema: {
          type: "object" as const,
          properties: {
            table: { type: "string" as const, description: "Specific table to check (omit for all watched tables)" },
            since: { type: "string" as const, description: "ISO timestamp to check since (omit for last poll cursor)" },
          },
        },
      },
      async (rawParams: unknown, _runCtx: ToolRunContext): Promise<ToolResult> => {
        const params = rawParams as { table?: string; since?: string };
        const tables = params.table ? [params.table] : config.watchedTables;
        const allChanges: ChangeRecord[] = [];

        for (const t of tables) {
          const changes = await detectChanges(config, ctx.state, t, params.since);
          if (changes) allChanges.push(changes);
        }

        if (allChanges.length === 0) {
          return {
            content: `No changes detected in ${tables.join(", ")} since last poll.`,
            data: { changes: [] },
          };
        }

        const lines = allChanges.map(
          (c) =>
            `- **${c.table}**: ${c.rows.length} changed row(s) (detected ${c.detectedAt})`,
        );

        return {
          content: [
            `**Changes detected** across ${allChanges.length} table(s):`,
            "",
            ...lines,
          ].join("\n"),
          data: { changes: allChanges },
        };
      },
    );

    // ------------------------------------------------------------------
    // Tool: supabase-schema
    // ------------------------------------------------------------------
    ctx.tools.register(
      "supabase-schema",
      {
        displayName: "Inspect Table Schema",
        description:
          "Get column names and types for a Supabase table.",
        parametersSchema: {
          type: "object" as const,
          properties: {
            table: { type: "string" as const, description: "Table name to inspect" },
          },
          required: ["table"],
        },
      },
      async (rawParams: unknown, _runCtx: ToolRunContext): Promise<ToolResult> => {
        const params = rawParams as { table: string };
        const { columns, error } = await getTableSchema(config, params.table);

        if (error) {
          return { content: `Error inspecting '${params.table}': ${error}` };
        }

        const lines = columns.map(
          (c) => `- **${c.name}** (${c.type})${c.nullable ? " — nullable" : ""}`,
        );

        return {
          content: [
            `**Schema for '${params.table}'** — ${columns.length} column(s):`,
            "",
            ...lines,
          ].join("\n"),
          data: { columns },
        };
      },
    );

    // ------------------------------------------------------------------
    // Job: poll-changes (cron-driven change detection)
    // ------------------------------------------------------------------
    ctx.jobs.register("poll-changes", async (_job: PluginJobContext): Promise<void> => {
      ctx.logger.info("Polling watched tables for changes", {
        tables: config.watchedTables,
      });

      const allChanges: ChangeRecord[] = [];

      for (const table of config.watchedTables) {
        const changes = await detectChanges(config, ctx.state, table);
        if (changes) {
          allChanges.push(changes);
          ctx.logger.info(`Changes detected in '${table}'`, {
            count: changes.rows.length,
          });
        }
      }

      if (allChanges.length > 0) {
        // Store latest changes in state for agent consumption
        await ctx.state.set(stateKey("latestChanges"), {
          changes: allChanges,
          polledAt: new Date().toISOString(),
        });

        // Emit events for each table that changed
        const companyId = (rawConfig as Record<string, unknown>).companyId as string | undefined;
        if (companyId) {
          for (const change of allChanges) {
            await ctx.events.emit("supabase.table_changed", companyId, {
              table: change.table,
              rowCount: change.rows.length,
              detectedAt: change.detectedAt,
            });
          }
        }
      }

      ctx.logger.info("Poll complete", {
        tablesPolled: config.watchedTables.length,
        changesFound: allChanges.length,
        totalRows: allChanges.reduce((sum, c) => sum + c.rows.length, 0),
      });
    });

    ctx.logger.info("ZAO Supabase Sync plugin loaded", {
      supabaseUrl: config.supabaseUrl,
      watchedTables: config.watchedTables,
      pollIntervalSec: config.pollIntervalSec,
    });
  },
});

runWorker(plugin, import.meta.url);
