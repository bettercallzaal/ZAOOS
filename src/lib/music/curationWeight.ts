/**
 * Calculate curation weight for a user based on their Respect score.
 * Weight = log2(respect + 1), minimum 1.
 * A member with 0 Respect has weight 1 (their likes still count).
 * A member with 500 Respect has weight ~9.97.
 */
export function curationWeight(respectScore: number): number {
  return Math.max(1, Math.log2(respectScore + 1));
}
