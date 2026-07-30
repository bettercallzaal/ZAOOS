/**
 * MemoryLeaseStore - deterministic in-memory LeaseStore.
 *
 * Injectable clock, atomic conditional updates (single-threaded JS = each
 * conditionalUpdate call is atomic), used by the property-proof suite and the
 * canary's dry-run mode. Port of the app-side FakeAgentRunsStore semantics
 * onto the package's store contract.
 */
import type { AgentRunRow, LeaseStore } from './types';

export class MemoryLeaseStore implements LeaseStore {
  private readonly runs = new Map<string, AgentRunRow>();
  private readonly idempotencyKeys = new Set<string>();
  private clock: Date;

  constructor(initialNow: Date = new Date(0)) {
    this.clock = new Date(initialNow);
  }

  setNow(now: Date): void {
    this.clock = new Date(now);
  }

  advance(ms: number): void {
    this.clock = new Date(this.clock.getTime() + ms);
  }

  now(): Date {
    return new Date(this.clock);
  }

  insert(run: Omit<AgentRunRow, 'created_at' | 'updated_at'>): AgentRunRow {
    if (this.idempotencyKeys.has(run.idempotency_key)) {
      throw new Error(`Idempotency key collision: ${run.idempotency_key}`);
    }
    const full: AgentRunRow = { ...run, created_at: this.clock.toISOString(), updated_at: this.clock.toISOString() };
    this.runs.set(run.id, full);
    this.idempotencyKeys.add(run.idempotency_key);
    return full;
  }

  async getRun(runId: string): Promise<AgentRunRow | null> {
    return this.runs.get(runId) ?? null;
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
    const run = this.runs.get(runId);
    if (!run) return null;
    const rec = run as unknown as Record<string, unknown>;
    for (const [field, expected] of Object.entries(conditions.eq ?? {})) {
      if (rec[field] !== expected) return null;
    }
    for (const [field, allowed] of Object.entries(conditions.in ?? {})) {
      if (!(allowed as unknown[]).includes(rec[field])) return null;
    }
    for (const [field, boundary] of Object.entries(conditions.lt ?? {})) {
      const actual = rec[field];
      if (typeof actual !== 'string' || new Date(actual) >= new Date(boundary as string)) return null;
    }
    const updated: AgentRunRow = { ...run, ...updates };
    this.runs.set(runId, updated);
    return updated;
  }

  async findExpiredLeases(nowIso: string, limit: number): Promise<AgentRunRow[]> {
    const out: AgentRunRow[] = [];
    for (const run of this.runs.values()) {
      if (
        (run.status === 'leased' || run.status === 'running') &&
        run.lease_expires_at !== null &&
        new Date(run.lease_expires_at) < new Date(nowIso)
      ) {
        out.push(run);
        if (out.length >= limit) break;
      }
    }
    return out;
  }
}
