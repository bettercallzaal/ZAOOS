/**
 * Memory - the layered remembering organ. Public surface.
 *
 * Fed by the Bloodstream (Memory.record is a subscriber hook), read by the
 * Brain/Spine. Working + episodic layers are implemented; the rest of the
 * layer stack (semantic/vector/receipt/archive/swarm/organism-state) share the
 * MemoryLayer interface and slot in without touching the organ.
 */

export type {
  LayerHealth,
  LayerKind,
  MemoryLayer,
  MemoryOptions,
  MemoryQuery,
  MemoryRecord,
} from './types';
export { Memory } from './memory';
export type { MemorySnapshot } from './memory';
export { WorkingMemory } from './working-memory';
export type { WorkingMemoryOptions } from './working-memory';
export { EpisodicMemory } from './episodic-memory';
export type { EpisodicMemoryOptions } from './episodic-memory';
