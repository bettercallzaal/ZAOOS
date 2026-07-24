/**
 * Organism - the first living end-to-end flow. Public surface.
 *
 * assembleOrganism() wires a real Vacuum Spike through the Bloodstream into
 * Memory, with every organ registered in the Control Plane. runTick() drives
 * one heartbeat of life and returns a Control Plane snapshot proving the organs
 * ran. See scripts/organism-demo.ts for a live run against the real Coinbase API.
 */

export { assembleOrganism } from './organism';
export type { Organism, OrganismOptions, TickResult } from './organism';
