/**
 * Memory decay + scoping for the multi-agent layer (doc 761 Phase 3).
 *
 * 7-day half-life exponential decay: a memory's weight halves every 7 days. Used to (a) fade
 * old context out of relevance scoring and (b) drop fully-decayed memories. Scoping keys let
 * memories be partitioned per-user / per-topic / per-agent so one agent's history does not
 * bleed into another's.
 */

export const HALF_LIFE_DAYS = 7;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

export interface ScopedMemory<T = unknown> {
  /** scope key, e.g. "agent:caster|topic:music|user:1325" */
  scope: string;
  /** ISO timestamp the memory was created */
  created_at: string;
  payload: T;
}

/** Weight in (0,1]: 0.5 ^ (ageDays / 7). nowMs passed in (Date.now() may be unavailable). */
export function decayWeight(createdAtIso: string, nowMs: number): number {
  const ageMs = nowMs - new Date(createdAtIso).getTime();
  if (ageMs <= 0) return 1;
  const ageDays = ageMs / MS_PER_DAY;
  return Math.pow(0.5, ageDays / HALF_LIFE_DAYS);
}

/** Build a canonical scope key. Omitted parts are skipped. */
export function scopeKey(parts: { agent?: string; topic?: string; user?: string | number }): string {
  const segs: string[] = [];
  if (parts.agent) segs.push(`agent:${parts.agent}`);
  if (parts.topic) segs.push(`topic:${parts.topic.toLowerCase()}`);
  if (parts.user !== undefined) segs.push(`user:${parts.user}`);
  return segs.join('|');
}

/**
 * Filter + sort memories for a scope by decayed weight, dropping anything below `floor`
 * (default 0.05 ~ older than ~4.3 half-lives ~ 30 days). Returns each memory with its weight.
 */
export function relevantMemories<T>(
  memories: ScopedMemory<T>[],
  scope: string,
  nowMs: number,
  floor = 0.05,
): Array<{ memory: ScopedMemory<T>; weight: number }> {
  return memories
    .filter((m) => m.scope === scope || scope.startsWith(m.scope) || m.scope.startsWith(scope))
    .map((m) => ({ memory: m, weight: decayWeight(m.created_at, nowMs) }))
    .filter((x) => x.weight >= floor)
    .sort((a, b) => b.weight - a.weight);
}

/** Garbage-collect fully-decayed memories (weight < floor). Returns the survivors. */
export function gcDecayed<T>(memories: ScopedMemory<T>[], nowMs: number, floor = 0.05): ScopedMemory<T>[] {
  return memories.filter((m) => decayWeight(m.created_at, nowMs) >= floor);
}
