/**
 * SupabaseLeaseStore - LeaseStore over the agent_runs table.
 *
 * The client is INJECTED (any @supabase/supabase-js client with service-role
 * access) - the package itself imports nothing environment-specific, which is
 * what lets both the Next app (via @/lib/db/supabase's admin client) and the
 * bot (via its own client) share one lease implementation.
 *
 * Atomicity: Supabase/PostgREST UPDATE ... WHERE is a single SQL statement -
 * conditions are checked and the row mutated atomically; a condition miss
 * returns zero rows, which this adapter maps to null (collision), matching
 * the LeaseStore contract.
 */
import type { AgentRunRow, LeaseStore } from './types';

/** Structural type for the injected client - avoids a package dependency. */
export interface SupabaseLikeClient {
  from(table: string): {
    select(columns: string): {
      eq(field: string, value: unknown): { single(): Promise<{ data: unknown; error: { message: string } | null }> };
      in(
        field: string,
        values: unknown[],
      ): {
        lt(
          field: string,
          value: string,
        ): { limit(n: number): Promise<{ data: unknown[] | null; error: { message: string } | null }> };
      };
    };
    update(values: Record<string, unknown>): unknown;
  };
}

export class SupabaseLeaseStore implements LeaseStore {
  constructor(
    private readonly client: SupabaseLikeClient,
    private readonly table = 'agent_runs',
  ) {}

  now(): Date {
    return new Date();
  }

  async getRun(runId: string): Promise<AgentRunRow | null> {
    const { data, error } = await this.client.from(this.table).select('*').eq('id', runId).single();
    if (error || !data) return null;
    return data as AgentRunRow;
  }

  async conditionalUpdate(
    runId: string,
    updates: Partial<AgentRunRow>,
    conditions: {
      eq?: Partial<Record<keyof AgentRunRow, unknown>>;
      in?: Partial<Record<keyof AgentRunRow, unknown[]>>;
      lt?: Partial<Record<keyof AgentRunRow, string>>;
    },
  ): Promise<AgentRunRow | null> {
    // Build the chained filter dynamically; PostgREST applies all WHEREs in
    // one atomic UPDATE.

    let q = this.client.from(this.table).update(updates as Record<string, unknown>) as {
      eq(field: string, value: unknown): typeof q;
      in(field: string, values: unknown[]): typeof q;
      lt(field: string, value: string): typeof q;
      is(field: string, value: null): typeof q;
      select(columns: string): { single(): Promise<{ data: unknown; error: { message: string } | null }> };
    };
    q = q.eq('id', runId);
    for (const [field, value] of Object.entries(conditions.eq ?? {})) {
      // PostgREST needs IS for null equality.
      q = value === null ? q.is(field, null) : q.eq(field, value);
    }
    for (const [field, values] of Object.entries(conditions.in ?? {})) {
      q = q.in(field, values as unknown[]);
    }
    for (const [field, value] of Object.entries(conditions.lt ?? {})) {
      q = q.lt(field, value as string);
    }
    const { data, error } = await q.select('*').single();
    if (error || !data) return null;
    return data as AgentRunRow;
  }

  async findExpiredLeases(nowIso: string, limit: number): Promise<AgentRunRow[]> {
    const { data, error } = await this.client
      .from(this.table)
      .select('*')
      .in('status', ['leased', 'running'])
      .lt('lease_expires_at', nowIso)
      .limit(limit);
    if (error || !data) return [];
    return data as AgentRunRow[];
  }
}
