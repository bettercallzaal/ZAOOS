/**
 * heart-fleet - shared fleet lease layer (Heart extraction, canary phase).
 *
 * Consumed via direct TS import from both builds:
 *  - Next app:  import { HeartFleet } from '@/../packages/heart-fleet/src'
 *  - bot/:      import { HeartFleet } from '../../../packages/heart-fleet/src'
 * No build step, no npm workspace - the package is plain dependency-free TS.
 *
 * Canary status: consumed by bot/src/zoe/heart-canary.ts (flag-gated,
 * default OFF). The app-side src/lib/heart stays on its own impl until the
 * canary proves out - see research doc 2139.
 */
export * from './types';
export { HeartFleet, type HeartOptions } from './lease';
export {
  executeWithLease,
  guardIrreversible,
  MemoryEffectLedger,
  type EffectLedger,
  type ExecuteOpts,
  type ExecuteOutcome,
  type GuardOutcome,
} from './execute';
export { MemoryLeaseStore } from './memory-store';
export { SupabaseLeaseStore, type SupabaseLikeClient } from './supabase-store';
export { canonicalize, sha256Hex, deterministicResourceId } from './canonical';
