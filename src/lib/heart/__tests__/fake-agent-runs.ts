/**
 * Fake In-Memory Agent Runs Store
 *
 * Mimics Supabase.js conditional UPDATE semantics for testing.
 * The key insight: a conditional UPDATE only mutates if the WHERE clauses are satisfied.
 * This fake tracks mutations and enforces the same constraints.
 *
 * Supports:
 * - Controllable clock (inject now)
 * - Conditional updates with .eq() and .lt()
 * - Collision detection (returns null if WHERE fails)
 * - Idempotent inserts (throws if duplicate idempotency_key)
 */

import type { AgentRunRow, RunStatus } from '../types';

interface UpdateBuilder {
  runId: string;
  updates: Partial<AgentRunRow>;
  eqConditions: Map<string, unknown>;
  ltConditions: Map<string, unknown>;
  inConditions: Map<string, unknown[]>;
  select: string[];
}

export class FakeAgentRunsStore {
  private runs: Map<string, AgentRunRow> = new Map();
  private idempotencyKeys: Set<string> = new Set();
  private now: Date;

  constructor(initialNow: Date = new Date()) {
    this.now = new Date(initialNow);
  }

  /**
   * Advance the injected clock (for testing expiration scenarios).
   */
  public setNow(now: Date): void {
    this.now = new Date(now);
  }

  /**
   * Get the current injected time.
   */
  public getNow(): Date {
    return new Date(this.now);
  }

  /**
   * Insert a new run. Throws if idempotency_key is already used.
   */
  public insert(run: Omit<AgentRunRow, 'created_at' | 'updated_at'>): AgentRunRow {
    if (this.idempotencyKeys.has(run.idempotency_key)) {
      throw new Error(
        `Idempotency key collision: ${run.idempotency_key} already exists`,
      );
    }

    const fullRun: AgentRunRow = {
      ...run,
      created_at: this.now.toISOString(),
      updated_at: this.now.toISOString(),
    };

    this.runs.set(run.id, fullRun);
    this.idempotencyKeys.add(run.idempotency_key);

    return fullRun;
  }

  /**
   * Start a conditional update builder.
   */
  public updateBuilder(updates: Partial<AgentRunRow>): UpdateBuilderImpl {
    return new UpdateBuilderImpl(this, updates);
  }

  /**
   * Fetch a single run by ID.
   */
  public selectById(runId: string): AgentRunRow | null {
    return this.runs.get(runId) || null;
  }

  /**
   * Fetch all runs (for recovery scans).
   */
  public selectAll(): AgentRunRow[] {
    return Array.from(this.runs.values());
  }

  /**
   * Apply a conditional update and return the updated row(s) or null on collision.
   *
   * @internal Used by UpdateBuilderImpl
   */
  public _applyUpdate(builder: UpdateBuilder): AgentRunRow | null {
    const run = this.runs.get(builder.runId);
    if (!run) {
      return null; // No such run
    }

    // Check all .eq() conditions
    for (const [field, expected] of builder.eqConditions) {
      const actual = (run as unknown as Record<string, unknown>)[field];
      if (actual !== expected) {
        return null; // Condition failed; UPDATE returns no rows
      }
    }

    // Check all .lt() conditions
    for (const [field, boundary] of builder.ltConditions) {
      const actual = (run as unknown as Record<string, unknown>)[field];
      if (typeof actual === 'string' && typeof boundary === 'string') {
        if (new Date(actual as string) >= new Date(boundary as string)) {
          return null; // Condition failed
        }
      }
    }

    // Check all .in() conditions
    for (const [field, allowed] of builder.inConditions) {
      const actual = (run as unknown as Record<string, unknown>)[field];
      if (!allowed.includes(actual)) {
        return null; // Condition failed
      }
    }

    // All conditions passed; apply the update
    const updated: AgentRunRow = {
      ...run,
      ...builder.updates,
      updated_at: this.now.toISOString(),
    };

    this.runs.set(builder.runId, updated);
    return updated;
  }
}

class UpdateBuilderImpl {
  private store: FakeAgentRunsStore;
  private builder: UpdateBuilder;

  constructor(store: FakeAgentRunsStore, updates: Partial<AgentRunRow>) {
    this.store = store;
    this.builder = {
      runId: '',
      updates,
      eqConditions: new Map(),
      ltConditions: new Map(),
      inConditions: new Map(),
      select: [],
    };
  }

  public eq(field: string, value: unknown): this {
    this.builder.eqConditions.set(field, value);
    return this;
  }

  public lt(field: string, boundary: unknown): this {
    this.builder.ltConditions.set(field, boundary);
    return this;
  }

  public in(field: string, values: unknown[]): this {
    this.builder.inConditions.set(field, values);
    return this;
  }

  public id(runId: string): this {
    this.builder.runId = runId;
    return this;
  }

  public select(...fields: string[]): this {
    this.builder.select = fields;
    return this;
  }

  public single(): AgentRunRow | null {
    const result = this.store._applyUpdate(this.builder);
    return result;
  }
}
